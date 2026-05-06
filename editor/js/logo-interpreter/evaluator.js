'use strict';

// ── Control-flow signals ──────────────────────────────────────────────────────
class StopSignal  { constructor() { this.isStop   = true; } }
class OutputSignal { constructor(v) { this.value = v; this.isOutput = true; } }

// ── Environment (scope chain) ─────────────────────────────────────────────────
class Env {
  constructor(parent = null) {
    this.vars   = Object.create(null);
    this.parent = parent;
  }
  get(name) {
    if (name in this.vars) return this.vars[name];
    if (this.parent)       return this.parent.get(name);
    throw new ReferenceError(`variável não definida: "${name}"`);
  }
  set(name, value) {
    // always set in the nearest frame that has it, or global
    if (name in this.vars || !this.parent) { this.vars[name] = value; return; }
    this.parent.set(name, value);
  }
  define(name, value) { this.vars[name] = value; }
}

// ── Evaluator ─────────────────────────────────────────────────────────────────
export class Evaluator {
  /**
   * @param {object}   opts
   * @param {function} opts.onCommand(name, args)  — called for every turtle/pen/screen command
   * @param {function} opts.onHighlight(blockId)   — called before each statement (optional)
   * @param {function} opts.isStopped()            — returns true if execution should halt
   */
  constructor(opts = {}) {
    this.onCommand   = opts.onCommand   || (() => {});
    this.onHighlight = opts.onHighlight || (() => {});
    this.isStopped   = opts.isStopped   || (() => false);

    this.globalEnv = new Env();
    this._procs    = Object.create(null); // user-defined procedures
    this._callDepth = 0;
    this.MAX_DEPTH  = 256;
    this.MAX_STEPS  = 1_000_000;
    this._steps     = 0;
  }

  // ── Entry point ─────────────────────────────────────────────────────────────

  run(ast) {
    this._steps = 0;
    // first pass: collect procedure definitions
    for (const stmt of ast.body) {
      if (stmt.type === 'ProcDef') this._registerProc(stmt);
    }
    // second pass: execute non-def statements
    for (const stmt of ast.body) {
      if (stmt.type === 'ProcDef') continue;
      this._execStmt(stmt, this.globalEnv);
      if (this.isStopped()) break;
    }
  }

  // ── Statements ──────────────────────────────────────────────────────────────

  _execStmt(node, env) {
    if (this.isStopped()) return;
    if (++this._steps > this.MAX_STEPS)
      throw new Error('Limite de passos atingido — verifique laços infinitos.');

    if (node.blockId) this.onHighlight(node.blockId);

    switch (node.type) {
      case 'ProcDef': this._registerProc(node); return;
      case 'Command': return this._execCommand(node, env);
      case 'Repeat':  return this._execRepeat(node, env);
      case 'While':   return this._execWhile(node, env);
      case 'If':      return this._execIf(node, env);
      case 'Make':    return this._execMake(node, env);
      case 'Stop':    throw new StopSignal();
      case 'Output':  throw new OutputSignal(this._eval(node.value, env));
      default: throw new Error(`nó desconhecido: ${node.type}`);
    }
  }

  _execBlock(stmts, env) {
    for (const s of stmts) {
      this._execStmt(s, env);
      if (this.isStopped()) return;
    }
  }

  _execRepeat(node, env) {
    const times = Math.floor(this._eval(node.times, env));
    const local  = new Env(env);
    for (let i = 0; i < times; i++) {
      if (this.isStopped()) return;
      try {
        this._execBlock(node.body, local);
      } catch (e) {
        if (e instanceof StopSignal) return;
        throw e;
      }
    }
  }

  _execWhile(node, env) {
    let guard = 0;
    while (this._eval(node.cond, env)) {
      if (this.isStopped() || ++guard > this.MAX_STEPS)
        throw new Error('Laço enquanto excedeu o limite de iterações.');
      try {
        this._execBlock(node.body, new Env(env));
      } catch (e) {
        if (e instanceof StopSignal) return;
        throw e;
      }
    }
  }

  _execIf(node, env) {
    const cond = this._eval(node.cond, env);
    if (cond) {
      this._execBlock(node.then, new Env(env));
    } else if (node.else) {
      this._execBlock(node.else, new Env(env));
    }
  }

  _execMake(node, env) {
    const value = this._eval(node.value, env);
    env.set(node.name, value);
    // also define in global so it's reachable everywhere
    this.globalEnv.define(node.name, value);
  }

  _execCommand(node, env) {
    const args = node.args.map(a => this._eval(a, env));

    // user-defined procedure used as command
    if (this._procs[node.name]) {
      this._callProc(node.name, args, env);
      return;
    }

    // built-in command → forward to onCommand
    this.onCommand(node.name, args);
  }

  // ── Procedure handling ───────────────────────────────────────────────────────

  _registerProc(node) {
    this._procs[node.name] = node;
  }

  _callProc(name, argValues, callerEnv) {
    const proc = this._procs[name];
    if (!proc) throw new ReferenceError(`procedimento não definido: "${name}"`);
    if (++this._callDepth > this.MAX_DEPTH) {
      this._callDepth--;
      throw new Error(`Recursão muito profunda ao chamar "${name}"`);
    }
    const local = new Env(this.globalEnv);
    proc.params.forEach((p, i) => local.define(p, argValues[i] ?? 0));
    let result;
    try {
      this._execBlock(proc.body, local);
    } catch (e) {
      if (e instanceof StopSignal) { /* normal return */ }
      else if (e instanceof OutputSignal) { result = e.value; }
      else throw e;
    } finally {
      this._callDepth--;
    }
    return result;
  }

  // ── Expressions ─────────────────────────────────────────────────────────────

  _eval(node, env) {
    if (!node) return 0;
    switch (node.type) {
      case 'NumberLiteral': return node.value;
      case 'BoolLiteral':   return node.value;
      case 'WordLiteral':   return node.value;
      case 'ListLiteral':   return node.items.map(i => this._eval(i, env));
      case 'VarRef':        return env.get(node.name);
      case 'BinOp':         return this._evalBinOp(node, env);
      case 'UnOp':          return this._evalUnOp(node, env);
      case 'FuncCall':      return this._evalFuncCall(node, env);
      default: throw new Error(`nó de expressão desconhecido: ${node.type}`);
    }
  }

  _evalBinOp(node, env) {
    const l = this._eval(node.left, env);
    const r = this._eval(node.right, env);
    switch (node.op) {
      case '+':  return l + r;
      case '-':  return l - r;
      case '*':  return l * r;
      case '/':  if (r === 0) throw new Error('Divisão por zero'); return l / r;
      case '^':  return Math.pow(l, r);
      case '%':  return l % r;
      case '=':  return l === r;
      case '<>': return l !== r;
      case '<':  return l < r;
      case '>':  return l > r;
      case '<=': return l <= r;
      case '>=': return l >= r;
      case 'e':
      case 'and': return l && r;
      case 'ou':
      case 'or':  return l || r;
      default: throw new Error(`operador desconhecido: "${node.op}"`);
    }
  }

  _evalUnOp(node, env) {
    const v = this._eval(node.operand, env);
    switch (node.op) {
      case '-':   return -v;
      case 'not': return !v;
      default: throw new Error(`operador unário desconhecido: "${node.op}"`);
    }
  }

  _evalFuncCall(node, env) {
    const args = node.args.map(a => this._eval(a, env));
    const name = node.name;

    // user-defined function (with output)
    if (this._procs[name]) return this._callProc(name, args, env);

    // built-in math/query functions
    return this._evalBuiltin(name, args, env);
  }

  _evalBuiltin(name, args, env) {
    const a0 = args[0];
    const a1 = args[1];
    switch (name) {
      // Math
      case 'soma':        return a0 + a1;
      case 'diferença':
      case 'diferenca':   return a0 - a1;
      case 'produto':     return a0 * a1;
      case 'divisão':
      case 'divisao':     if (a1 === 0) throw new Error('Divisão por zero'); return a0 / a1;
      case 'resto':       return a0 % a1;
      case 'potência':
      case 'potencia':    return Math.pow(a0, a1);
      case 'raizq':       return Math.sqrt(Math.abs(a0));
      case 'abs':         return Math.abs(a0);
      case 'int':         return Math.trunc(a0);
      case 'arredonda':   return Math.round(a0);
      case 'máximo':
      case 'maximo':      return Math.max(a0, a1);
      case 'mínimo':
      case 'minimo':      return Math.min(a0, a1);
      case 'seno':        return Math.sin(a0 * Math.PI / 180);
      case 'cosseno':     return Math.cos(a0 * Math.PI / 180);
      case 'tangente':    return Math.tan(a0 * Math.PI / 180);
      case 'arcoseno':    return Math.asin(a0) * 180 / Math.PI;
      case 'arcocosseno': return Math.acos(a0) * 180 / Math.PI;
      case 'arcotangente':return Math.atan(a0) * 180 / Math.PI;
      case 'ln':          return Math.log(a0);
      case 'log':         return Math.log10(a0);
      case 'exp':         return Math.exp(a0);
      case 'aleatório':
      case 'aleatorio':   return Math.floor(Math.random() * Math.abs(a0));
      case 'aleatórioentre':
      case 'aleatorioentree':
      case 'inteiroentre': return Math.floor(Math.random() * (a1 - a0 + 1)) + Math.floor(a0);

      // Logic
      case 'e':           return a0 && a1;
      case 'ou':          return a0 || a1;
      case 'não':
      case 'nao':         return !a0;
      case 'igual?':      return a0 === a1;
      case 'diferente?':  return a0 !== a1;
      case 'menor?':      return a0 < a1;
      case 'maior?':      return a0 > a1;

      // Turtle queries — these will be resolved by the worker sending a sync query
      // (same as getxCT, getyCT, etc.)
      case 'coordenadax':
      case 'xcor':        return this.onCommand('__query__', ['getx']);
      case 'coordenaday':
      case 'ycor':        return this.onCommand('__query__', ['gety']);
      case 'direção':
      case 'direcao':
      case 'heading':     return this.onCommand('__query__', ['getheading']);
      case 'corcaneta':   return this.onCommand('__query__', ['getcolor']);
      case 'tamanhocaneta': return this.onCommand('__query__', ['getwidth']);
      case 'canetalevantada?': return this.onCommand('__query__', ['ispendown']);

      default:
        throw new ReferenceError(`função desconhecida: "${name}"`);
    }
  }
}
