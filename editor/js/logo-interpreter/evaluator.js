'use strict';

// ── Control-flow signals ──────────────────────────────────────────────────────
export class StopSignal   { constructor()  { this.isStop   = true; } }
export class OutputSignal { constructor(v) { this.value = v; this.isOutput = true; } }

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
    if (name in this.vars || !this.parent) { this.vars[name] = value; return; }
    this.parent.set(name, value);
  }
  define(name, value) { this.vars[name] = value; }
}

// ── Evaluator ─────────────────────────────────────────────────────────────────
// Generator-based: every yield produces a {type, ...} event that the caller
// (Worker) can act on. Execution pauses naturally at each yield.
//
// Yield types:
//   {type: 'cmd',       name, args}   — drawing/turtle/pen command
//   {type: 'highlight', blockId}      — before a statement (for time-slider)
//   {type: 'query',     key}          — read turtle state (must call .next(value))

export class Evaluator {
  constructor() {
    this.globalEnv  = new Env();
    this._procs     = Object.create(null);
    this._callDepth = 0;
    this.MAX_DEPTH  = 256;
    this.MAX_STEPS  = 1_000_000;
    this._steps     = 0;
  }

  // ── Entry point — returns a generator ─────────────────────────────────────

  *run(ast) {
    this._steps = 0;
    for (const s of ast.body) if (s.type === 'ProcDef') this._registerProc(s);
    for (const s of ast.body) {
      if (s.type === 'ProcDef') continue;
      yield* this._execStmt(s, this.globalEnv);
    }
  }

  // ── Statements ─────────────────────────────────────────────────────────────

  *_execStmt(node, env) {
    if (++this._steps > this.MAX_STEPS)
      throw new Error('Limite de passos atingido — verifique laços infinitos.');

    if (node.blockId) yield { type: 'highlight', blockId: node.blockId };

    switch (node.type) {
      case 'ProcDef': this._registerProc(node); return;
      case 'Command': yield* this._execCommand(node, env); return;
      case 'Repeat':  yield* this._execRepeat(node, env);  return;
      case 'While':   yield* this._execWhile(node, env);   return;
      case 'If':      yield* this._execIf(node, env);      return;
      case 'Make':    this._execMake(node, env);            return;
      case 'Stop':    throw new StopSignal();
      case 'Output':  throw new OutputSignal(yield* this._evalExpr(node.value, env));
      default: throw new Error(`nó desconhecido: ${node.type}`);
    }
  }

  *_execBlock(stmts, env) {
    for (const s of stmts) yield* this._execStmt(s, env);
  }

  *_execRepeat(node, env) {
    const times = Math.floor(yield* this._evalExpr(node.times, env));
    for (let i = 0; i < times; i++) {
      try {
        yield* this._execBlock(node.body, new Env(env));
      } catch (e) {
        if (e instanceof StopSignal) return;
        throw e;
      }
    }
  }

  *_execWhile(node, env) {
    let guard = 0;
    while (yield* this._evalExpr(node.cond, env)) {
      if (++guard > this.MAX_STEPS) throw new Error('Laço enquanto excedeu o limite.');
      try {
        yield* this._execBlock(node.body, new Env(env));
      } catch (e) {
        if (e instanceof StopSignal) return;
        throw e;
      }
    }
  }

  *_execIf(node, env) {
    const cond = yield* this._evalExpr(node.cond, env);
    if (cond) yield* this._execBlock(node.then, new Env(env));
    else if (node.else) yield* this._execBlock(node.else, new Env(env));
  }

  _execMake(node, env) {
    // Make is synchronous — no yielding needed
    // (value expression may contain function calls, but we handle those inline)
    const value = this._evalSync(node.value, env);
    env.set(node.name, value);
    this.globalEnv.define(node.name, value);
  }

  *_execCommand(node, env) {
    const args = node.args.map(a => this._evalSync(a, env));

    if (node.name === '__hl__') {
      yield { type: 'highlight', blockId: atob(String(args[0] ?? '').replace(/-/g, '+').replace(/_/g, '/')) };
      return;
    }

    if (this._procs[node.name]) {
      yield* this._callProc(node.name, args, env);
      return;
    }

    yield { type: 'cmd', name: node.name, args };
  }

  // ── Procedure handling ─────────────────────────────────────────────────────

  _registerProc(node) { this._procs[node.name] = node; }

  *_callProc(name, argValues, _callerEnv) {
    const proc = this._procs[name];
    if (!proc) throw new ReferenceError(`procedimento não definido: "${name}"`);
    if (++this._callDepth > this.MAX_DEPTH) {
      this._callDepth--;
      throw new Error(`Recursão muito profunda: "${name}"`);
    }
    const local = new Env(this.globalEnv);
    proc.params.forEach((p, i) => local.define(p, argValues[i] ?? 0));
    let result;
    try {
      yield* this._execBlock(proc.body, local);
    } catch (e) {
      if (e instanceof StopSignal) { /* normal return */ }
      else if (e instanceof OutputSignal) { result = e.value; }
      else throw e;
    } finally {
      this._callDepth--;
    }
    return result;
  }

  // ── Expressions ───────────────────────────────────────────────────────────
  // Expression evaluation is synchronous (no yield) since expressions don't
  // produce drawing side-effects. Generator wrapper for uniformity in callers.

  *_evalExpr(node, env) { return this._evalSync(node, env); }

  _evalSync(node, env) {
    if (!node) return 0;
    switch (node.type) {
      case 'NumberLiteral': return node.value;
      case 'BoolLiteral':   return node.value;
      case 'WordLiteral':   return node.value;
      case 'ListLiteral':   return node.items.map(i => this._evalSync(i, env));
      case 'VarRef':        return env.get(node.name);
      case 'BinOp':         return this._evalBinOp(node, env);
      case 'UnOp':          return this._evalUnOp(node, env);
      case 'FuncCall':      return this._evalFuncCall(node, env);
      default: throw new Error(`nó de expressão desconhecido: ${node.type}`);
    }
  }

  _evalBinOp(node, env) {
    const l = this._evalSync(node.left, env);
    const r = this._evalSync(node.right, env);
    switch (node.op) {
      case '+':   return l + r;
      case '-':   return l - r;
      case '*':   return l * r;
      case '/':   if (r === 0) throw new Error('Divisão por zero'); return l / r;
      case '^':   return Math.pow(l, r);
      case '%':   return l % r;
      case '=':   return l === r;
      case '<>':  return l !== r;
      case '<':   return l < r;
      case '>':   return l > r;
      case '<=':  return l <= r;
      case '>=':  return l >= r;
      case 'e':
      case 'and': return Boolean(l) && Boolean(r);
      case 'ou':
      case 'or':  return Boolean(l) || Boolean(r);
      default: throw new Error(`operador desconhecido: "${node.op}"`);
    }
  }

  _evalUnOp(node, env) {
    const v = this._evalSync(node.operand, env);
    switch (node.op) {
      case '-':   return -v;
      case 'not': return !v;
      default: throw new Error(`operador unário desconhecido: "${node.op}"`);
    }
  }

  _evalFuncCall(node, env) {
    const args = node.args.map(a => this._evalSync(a, env));
    if (this._procs[node.name]) {
      // sync call for expressions — run generator to completion
      const gen = this._callProc(node.name, args, env);
      let last;
      for (const event of gen) {
        // swallow any emitted events (side-effects in expression context — unusual)
        last = event;
      }
      return last;
    }
    return this._evalBuiltin(node.name, args);
  }

  _evalBuiltin(name, args) {
    const a0 = args[0]; const a1 = args[1];
    switch (name) {
      case 'soma':                          return a0 + a1;
      case 'diferença': case 'diferenca':   return a0 - a1;
      case 'produto':                       return a0 * a1;
      case 'divisão': case 'divisao':       if (a1 === 0) throw new Error('Divisão por zero'); return a0 / a1;
      case 'resto':                         return a0 % a1;
      case 'potência': case 'potencia':     return Math.pow(a0, a1);
      case 'raizq':                         return Math.sqrt(Math.abs(a0));
      case 'abs':                           return Math.abs(a0);
      case 'int':                           return Math.trunc(a0);
      case 'arredonda':                     return Math.round(a0);
      case 'máximo': case 'maximo':         return Math.max(a0, a1);
      case 'mínimo': case 'minimo':         return Math.min(a0, a1);
      case 'seno':                          return Math.sin(a0 * Math.PI / 180);
      case 'cosseno':                       return Math.cos(a0 * Math.PI / 180);
      case 'tangente':                      return Math.tan(a0 * Math.PI / 180);
      case 'arcoseno':                      return Math.asin(a0) * 180 / Math.PI;
      case 'arcocosseno':                   return Math.acos(a0) * 180 / Math.PI;
      case 'arcotangente':                  return Math.atan(a0) * 180 / Math.PI;
      case 'ln':                            return Math.log(a0);
      case 'log':                           return Math.log10(a0);
      case 'exp':                           return Math.exp(a0);
      case 'aleatório': case 'aleatorio':   return Math.floor(Math.random() * Math.abs(a0));
      case 'aleatórioentre':
      case 'aleatorioentree':
      case 'inteiroentre':                  return Math.floor(Math.random() * (a1 - a0 + 1)) + Math.floor(a0);
      case 'e':                             return Boolean(a0) && Boolean(a1);
      case 'ou':                            return Boolean(a0) || Boolean(a1);
      case 'não': case 'nao':               return !a0;
      case 'igual?':                        return a0 === a1;
      case 'diferente?':                    return a0 !== a1;
      case 'menor?':                        return a0 < a1;
      case 'maior?':                        return a0 > a1;
      // Turtle queries — resolved from state mirror in worker
      case 'coordenadax': case 'xcor':      return this._query('getx');
      case 'coordenaday': case 'ycor':      return this._query('gety');
      case 'direção': case 'direcao':
      case 'heading':                       return this._query('getheading');
      case 'corcaneta':                     return this._query('getcolor');
      case 'tamanhocaneta':                 return this._query('getwidth');
      case 'canetalevantada?':              return this._query('ispendown');
      default:
        throw new ReferenceError(`função desconhecida: "${name}"`);
    }
  }

  // Injected by the worker so queries read from the local state mirror
  _query(key) { return 0; }
}
