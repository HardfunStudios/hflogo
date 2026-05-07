'use strict';
import { Lexer }  from './logo-interpreter/lexer.js';
import { Parser } from './logo-interpreter/parser.js';

// ── ID helpers ────────────────────────────────────────────────────────────────
let _seq = 0;
function uid() { return 'b' + (++_seq).toString(36) + Math.random().toString(36).slice(2, 5); }

// ── Variable registry ─────────────────────────────────────────────────────────
let _vars = {};
function ensureVar(name) {
  if (!_vars[name]) _vars[name] = uid();
  return _vars[name];
}

function normalise(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// ── Public entry point ────────────────────────────────────────────────────────
export function logoToBlocklyState(code) {
  _seq = 0;
  _vars = {};

  const tokens = new Lexer(code).tokenize();
  const ast    = new Parser(tokens).parse();

  const procDefs = ast.body.filter(s => s.type === 'ProcDef');
  const mainBody = ast.body.filter(s => s.type !== 'ProcDef');

  const topBlocks = [];

  if (mainBody.length > 0) {
    const start = { type: 'controls_start', id: uid(), x: 20, y: 20 };
    const chain = stmtsToChain(mainBody);
    if (chain) start.next = { block: chain };
    topBlocks.push(start);
  }

  let procY = 20;
  for (const proc of procDefs) {
    const b = procDefToBlock(proc);
    b.x = 520; b.y = procY; procY += 300;
    topBlocks.push(b);
  }

  return {
    blocks: { languageVersion: 0, blocks: topBlocks },
    variables: Object.entries(_vars).map(([name, id]) => ({ name, id, type: '' })),
  };
}

// ── Statement list → linked chain ─────────────────────────────────────────────
function stmtsToChain(stmts) {
  const blocks = stmts
    .filter(s => !(s.type === 'Command' && normalise(s.name) === '__hl__'))
    .map(stmtToBlock)
    .filter(Boolean);

  if (!blocks.length) return null;
  for (let i = 0; i < blocks.length - 1; i++) {
    blocks[i].next = { block: blocks[i + 1] };
  }
  return blocks[0];
}

function stmtToBlock(node) {
  switch (node.type) {
    case 'Command': return cmdToBlock(node);
    case 'Repeat':  return repeatToBlock(node);
    case 'While':   return whileToBlock(node);
    case 'If':      return ifToBlock(node);
    case 'Make':    return makeToBlock(node);
    case 'Stop':    return { type: 'controls_stop', id: uid() };
    case 'Output':  return outputToBlock(node);
    default:        return null;
  }
}

// ── Command / procedure call → block ─────────────────────────────────────────
function cmdToBlock(node) {
  const n = normalise(node.name);
  const a = node.args;

  const simple = {
    casa:          'turtle_home',
    mostra:        'turtle_show',
    esconde:       'turtle_hide',
    levantacaneta: 'pen_setpenup',
    abaixacaneta:  'pen_setpendown',
    preenche:      'pen_fill',
    limpa:         'screen_clean',
    limpatela:     'screen_clearscreen',
    wrap:          'screen_wrap',
    fence:         'screen_fence',
    window:        'screen_window',
    pare:          'controls_stop',
  };

  if (n === '__hl__') return null;
  if (simple[n]) return { type: simple[n], id: uid() };

  switch (n) {
    case 'parafrente':   return { type: 'turtle_forward',    id: uid(), inputs: { steps:   vi(a[0]) } };
    case 'paratras':     return { type: 'turtle_back',       id: uid(), inputs: { steps:   vi(a[0]) } };
    case 'viradireita':  return { type: 'turtle_right',      id: uid(), inputs: { degrees: vi(a[0]) } };
    case 'viraesquerda': return { type: 'turtle_left',       id: uid(), inputs: { degrees: vi(a[0]) } };
    case 'vaipara':      return { type: 'turtle_setpos',     id: uid(), inputs: { x: vi(a[0]), y: vi(a[1]) } };
    case 'vaipara_x':    return { type: 'turtle_setposx',    id: uid(), inputs: { x: vi(a[0]) } };
    case 'vaipara_y':    return { type: 'turtle_setposy',    id: uid(), inputs: { y: vi(a[0]) } };
    case 'mudadirecao':  return { type: 'turtle_setheading', id: uid(), inputs: { degrees: vi(a[0]) } };
    case 'arco':         return { type: 'turtle_arc',        id: uid(), inputs: { angle: vi(a[0]), radius: vi(a[1]) } };
    case 'aponta':       return { type: 'turtle_towards',    id: uid(), inputs: { x: vi(a[0]), y: vi(a[1]) } };
    case 'mudacor':      return { type: 'pen_setpencolor',   id: uid(), inputs: { color: vi(a[0]) } };
    case 'mudatamanho':  return { type: 'pen_setpensize',    id: uid(), inputs: { size:  vi(a[0]) } };
    default: {
      // User-defined procedure call (no return value)
      const b = { type: 'procedures_callnoreturn', id: uid(),
        extraState: { name: node.name, hasReturn: false },
        fields: { NAME: node.name } };
      if (a.length) {
        b.extraState.params = a.map((_, i) => ({ name: `arg${i}`, id: uid() }));
        a.forEach((arg, i) => { b.inputs = b.inputs || {}; b.inputs[`ARG${i}`] = vi(arg); });
      }
      return b;
    }
  }
}

// ── Control structures ────────────────────────────────────────────────────────
function repeatToBlock(node) {
  const b = { type: 'controls_repeat_ext', id: uid(), inputs: { TIMES: vi(node.times) } };
  const body = stmtsToChain(node.body);
  if (body) b.inputs.DO = { block: body };
  return b;
}

function whileToBlock(node) {
  const b = { type: 'controls_whileUntil', id: uid(), fields: { MODE: 'WHILE' },
    inputs: { BOOL: vi(node.cond) } };
  const body = stmtsToChain(node.body);
  if (body) b.inputs.DO = { block: body };
  return b;
}

function ifToBlock(node) {
  const b = { type: 'controls_if', id: uid(), inputs: { IF0: vi(node.cond) } };
  const thenBody = stmtsToChain(node.then);
  if (thenBody) b.inputs.DO0 = { block: thenBody };
  if (node.else && node.else.length > 0) {
    b.extraState = { hasElse: true };
    const elseBody = stmtsToChain(node.else);
    if (elseBody) b.inputs.ELSE = { block: elseBody };
  }
  return b;
}

function makeToBlock(node) {
  const varId = ensureVar(node.name);
  return {
    type: 'variables_set', id: uid(),
    fields: { VAR: { id: varId, name: node.name, type: '' } },
    inputs: { VALUE: vi(node.value) },
  };
}

function procDefToBlock(node) {
  const b = { type: 'procedures_defnoreturn', id: uid(),
    fields: { NAME: node.name }, inputs: {} };
  if (node.params && node.params.length > 0) {
    b.extraState = { params: node.params.map(p => ({ name: p, id: uid() })) };
  }
  const body = stmtsToChain(node.body);
  if (body) b.inputs.STACK = { block: body };
  return b;
}

function outputToBlock(node) {
  return {
    type: 'procedures_ifreturn', id: uid(),
    fields: { CONDITION: 1 },
    inputs: { VALUE: vi(node.value) },
  };
}

// ── Expressions ───────────────────────────────────────────────────────────────
function vi(node) { return { block: exprToBlock(node) }; }

function exprToBlock(node) {
  if (!node) return numBlock(0);
  switch (node.type) {
    case 'NumberLiteral': return numBlock(node.value);
    case 'BoolLiteral':   return { type: 'logic_boolean', id: uid(), fields: { BOOL: node.value ? 'TRUE' : 'FALSE' } };
    case 'VarRef': {
      const id = ensureVar(node.name);
      return { type: 'variables_get', id: uid(), fields: { VAR: { id, name: node.name, type: '' } } };
    }
    case 'BinOp':    return binOpToBlock(node);
    case 'UnOp':     return unOpToBlock(node);
    case 'FuncCall': return funcCallToBlock(node);
    default:         return numBlock(0);
  }
}

function numBlock(v) { return { type: 'math_number', id: uid(), fields: { NUM: v } }; }

function binOpToBlock(node) {
  const op = node.op;
  const mathMap = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE', '^': 'POWER' };
  const cmpMap  = { '=': 'EQ', '<>': 'NEQ', '<': 'LT', '<=': 'LTE', '>': 'GT', '>=': 'GTE' };
  const logMap  = { e: 'AND', and: 'AND', ou: 'OR', or: 'OR' };

  if (op === '%') return { type: 'math_modulo', id: uid(), inputs: { DIVIDEND: vi(node.left), DIVISOR: vi(node.right) } };
  if (mathMap[op]) return { type: 'math_arithmetic', id: uid(), fields: { OP: mathMap[op] }, inputs: { A: vi(node.left), B: vi(node.right) } };
  if (cmpMap[op])  return { type: 'logic_compare',   id: uid(), fields: { OP: cmpMap[op]  }, inputs: { A: vi(node.left), B: vi(node.right) } };
  if (logMap[op])  return { type: 'logic_operation', id: uid(), fields: { OP: logMap[op]  }, inputs: { A: vi(node.left), B: vi(node.right) } };
  return numBlock(0);
}

function unOpToBlock(node) {
  const op = normalise(node.op);
  if (op === 'not' || op === 'nao') {
    return { type: 'logic_negate', id: uid(), inputs: { BOOL: vi(node.operand) } };
  }
  // unary minus: 0 - expr
  return { type: 'math_arithmetic', id: uid(), fields: { OP: 'MINUS' },
    inputs: { A: { block: numBlock(0) }, B: vi(node.operand) } };
}

function funcCallToBlock(node) {
  const n = normalise(node.name);
  const a = node.args;
  switch (n) {
    case 'inteiroentre':
    case 'aleatorioentree':
    case 'aleatorio_entre':
      return { type: 'math_random_int', id: uid(), inputs: { FROM: vi(a[0]), TO: vi(a[1]) } };
    case 'coordenadax': case 'xcor': return { type: 'turtle_xcor',    id: uid() };
    case 'coordenaday': case 'ycor': return { type: 'turtle_ycor',    id: uid() };
    case 'direcao':     case 'heading': return { type: 'turtle_heading', id: uid() };
    default:
      return { type: 'procedures_callreturn', id: uid(),
        extraState: { name: node.name, hasReturn: true },
        fields: { NAME: node.name } };
  }
}
