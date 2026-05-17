'use strict';
import * as Blockly from 'blockly/core';

// ── Logo code generator ───────────────────────────────────────────────────────
// Produces human-readable Logo text from the Blockly workspace.
// Statement blocks return a string ending with \n.
// Expression blocks return [code, order] (same convention as JS generator).

const Order = { ATOMIC: 0, UNARY: 1, POWER: 2, MULTIPLICATIVE: 3, ADDITIVE: 4, COMPARISON: 5, LOGICAL: 6, NONE: 99 };

export const logoGenerator = new Blockly.Generator('Logo');
logoGenerator.ORDER = Order;
logoGenerator.INDENT = '  ';

// Required by Blockly.Generator
logoGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const nextCode  = opt_thisOnly ? '' : logoGenerator.blockToCode(nextBlock);
  return code + nextCode;
};

logoGenerator.init = function(workspace) {
  // Call the base init so internal Blockly state is set up
  Object.getPrototypeOf(logoGenerator).init.call(this, workspace);
  if (!this.nameDB_) {
    this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_ || '');
  } else {
    this.nameDB_.reset();
  }
  this.nameDB_.setVariableMap(workspace.getVariableMap());
  this.nameDB_.populateVariables(workspace);
  this.nameDB_.populateProcedures(workspace);
};

logoGenerator.workspaceToCode = function(workspace) {
  const allBlocks = workspace.getTopBlocks(true);
  const start = allBlocks.find(b => b.type === 'controls_start');
  if (!start) return '';

  this.init(workspace);

  // Procedure definitions first (they may be called from the main body)
  let procCode = '';
  for (const b of allBlocks) {
    if (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn') {
      procCode += logoGenerator.blockToCode(b, true);
    }
  }

  // Main body: blocks chained after controls_start
  let mainCode = '';
  let block = start.getNextBlock();
  while (block) {
    mainCode += logoGenerator.blockToCode(block, true);
    block = block.getNextBlock();
  }

  return procCode + mainCode;
};

// Prefix injected before each statement for block highlighting
logoGenerator.STATEMENT_PREFIX = '';

// Encode block ID to base64url so it contains only [A-Za-z0-9\-_] — safe
// for the Logo lexer (no brackets, semicolons, or whitespace).
function encodeId(id) {
  return btoa(id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function statementCode(block, gen) {
  if (gen._noHighlight) return '';
  return `__hl__ "${encodeId(block.id)}\n`;
}

function valueCode(block, inputName, gen, fallback = '0') {
  return gen.valueToCode(block, inputName, Order.NONE) || fallback;
}

// ── Controls ──────────────────────────────────────────────────────────────────

logoGenerator.forBlock['controls_start'] = () => '';
logoGenerator.forBlock['controls_stop']  = (block, gen) =>
  statementCode(block, gen) + 'pare\n';

logoGenerator.forBlock['controls_repeat_ext'] = (block, gen) => {
  const times = valueCode(block, 'TIMES', gen, '10');
  const body  = gen.statementToCode(block, 'DO');
  return `${statementCode(block, gen)}repita ${times} [\n${body}]\n`;
};

logoGenerator.forBlock['controls_if'] = (block, gen) => {
  let code = '';
  const cond0 = valueCode(block, 'IF0', gen, 'falso');
  const do0   = gen.statementToCode(block, 'DO0');
  code += `${statementCode(block, gen)}se ${cond0} [\n${do0}]`;
  if (block.elseifCount_) {
    for (let i = 1; i <= block.elseifCount_; i++) {
      const cond = valueCode(block, `IF${i}`, gen, 'falso');
      const body = gen.statementToCode(block, `DO${i}`);
      code += ` [\n${body}]`; // Logo doesn't have elseif; chain as nested se
    }
  }
  if (block.elseCount_) {
    const elseBody = gen.statementToCode(block, 'ELSE');
    code += ` [\n${elseBody}]`;
  }
  return code + '\n';
};

logoGenerator.forBlock['controls_whileUntil'] = (block, gen) => {
  const mode = block.getFieldValue('MODE');
  let   cond = valueCode(block, 'BOOL', gen, 'falso');
  if (mode === 'UNTIL') cond = `não ${cond}`;
  const body = gen.statementToCode(block, 'DO');
  return `${statementCode(block, gen)}enquanto ${cond} [\n${body}]\n`;
};

// ── Turtle ────────────────────────────────────────────────────────────────────

logoGenerator.forBlock['turtle_forward'] = (block, gen) =>
  `${statementCode(block, gen)}parafrente ${valueCode(block, 'steps', gen, '100')}\n`;

logoGenerator.forBlock['turtle_back'] = (block, gen) =>
  `${statementCode(block, gen)}paratras ${valueCode(block, 'steps', gen, '100')}\n`;

logoGenerator.forBlock['turtle_right'] = (block, gen) =>
  `${statementCode(block, gen)}viradireita ${valueCode(block, 'degrees', gen, '90')}\n`;

logoGenerator.forBlock['turtle_left'] = (block, gen) =>
  `${statementCode(block, gen)}viraesquerda ${valueCode(block, 'degrees', gen, '90')}\n`;

logoGenerator.forBlock['turtle_angle'] = (block) =>
  [block.getFieldValue('angle'), Order.ATOMIC];

logoGenerator.forBlock['turtle_setpos'] = (block, gen) => {
  const x = valueCode(block, 'x', gen, '0');
  const y = valueCode(block, 'y', gen, '0');
  return `${statementCode(block, gen)}vaipara ${x} ${y}\n`;
};

logoGenerator.forBlock['turtle_setposx'] = (block, gen) =>
  `${statementCode(block, gen)}vaipara_x ${valueCode(block, 'x', gen, '0')}\n`;

logoGenerator.forBlock['turtle_setposy'] = (block, gen) =>
  `${statementCode(block, gen)}vaipara_y ${valueCode(block, 'y', gen, '0')}\n`;

logoGenerator.forBlock['turtle_setheading'] = (block, gen) =>
  `${statementCode(block, gen)}mudadireção ${valueCode(block, 'degrees', gen, '0')}\n`;

logoGenerator.forBlock['turtle_home'] = (block, gen) =>
  `${statementCode(block, gen)}casa\n`;

logoGenerator.forBlock['turtle_show'] = (block, gen) =>
  `${statementCode(block, gen)}mostra\n`;

logoGenerator.forBlock['turtle_hide'] = (block, gen) =>
  `${statementCode(block, gen)}esconde\n`;

logoGenerator.forBlock['turtle_arc'] = (block, gen) => {
  const angle  = valueCode(block, 'angle',  gen, '90');
  const radius = valueCode(block, 'radius', gen, '100');
  return `${statementCode(block, gen)}arco ${angle} ${radius}\n`;
};

logoGenerator.forBlock['turtle_xcor']    = () => ['coordenadax', Order.ATOMIC];
logoGenerator.forBlock['turtle_ycor']    = () => ['coordenaday', Order.ATOMIC];
logoGenerator.forBlock['turtle_heading'] = () => ['direção',     Order.ATOMIC];

logoGenerator.forBlock['turtle_towards'] = (block, gen) => {
  const x = valueCode(block, 'x', gen, '0');
  const y = valueCode(block, 'y', gen, '0');
  return `${statementCode(block, gen)}aponta ${x} ${y}\n`;
};

logoGenerator.forBlock['turtle_distance'] = (block, gen) => {
  const x = valueCode(block, 'x', gen, '0');
  const y = valueCode(block, 'y', gen, '0');
  return [`distancia ${x} ${y}`, Order.ATOMIC];
};

logoGenerator.forBlock['turtle_direction_to'] = (block, gen) => {
  const x = valueCode(block, 'x', gen, '0');
  const y = valueCode(block, 'y', gen, '0');
  return [`direcao_ate ${x} ${y}`, Order.ATOMIC];
};

// ── Pen ───────────────────────────────────────────────────────────────────────

logoGenerator.forBlock['pen_setpencolor'] = (block, gen) =>
  `${statementCode(block, gen)}mudacor ${valueCode(block, 'color', gen, '0')}\n`;

logoGenerator.forBlock['pen_colornumber'] = (block) =>
  [String(parseInt(block.getFieldValue('NUM')) || 0), Order.ATOMIC];

logoGenerator.forBlock['pen_setpensize'] = (block, gen) =>
  `${statementCode(block, gen)}mudatamanho ${valueCode(block, 'size', gen, '1')}\n`;

logoGenerator.forBlock['pen_setpenup']   = (block, gen) => `${statementCode(block, gen)}levantacaneta\n`;
logoGenerator.forBlock['pen_setpendown'] = (block, gen) => `${statementCode(block, gen)}abaixacaneta\n`;
logoGenerator.forBlock['pen_fill']       = (block, gen) => `${statementCode(block, gen)}preenche\n`;

logoGenerator.forBlock['pen_ispendown?'] = () => ['canetalevantada?', Order.ATOMIC];
logoGenerator.forBlock['pen_pencolor']   = () => ['corcaneta',        Order.ATOMIC];
logoGenerator.forBlock['pen_pensize']    = () => ['tamanhocaneta',    Order.ATOMIC];

logoGenerator.forBlock['pen_setshade'] = (block, gen) =>
  `${statementCode(block, gen)}mudatom ${valueCode(block, 'shade', gen, '50')}\n`;

logoGenerator.forBlock['pen_getshade'] = () => ['tomcaneta', Order.ATOMIC];

// ── Screen ────────────────────────────────────────────────────────────────────

logoGenerator.forBlock['screen_clean']       = (block, gen) => `${statementCode(block, gen)}limpa\n`;
logoGenerator.forBlock['screen_clearscreen'] = (block, gen) => `${statementCode(block, gen)}limpatela\n`;
logoGenerator.forBlock['screen_wrap']        = (block, gen) => `${statementCode(block, gen)}wrap\n`;
logoGenerator.forBlock['screen_fence']       = (block, gen) => `${statementCode(block, gen)}fence\n`;
logoGenerator.forBlock['screen_window']      = (block, gen) => `${statementCode(block, gen)}window\n`;

// ── Numbers & math ────────────────────────────────────────────────────────────

logoGenerator.forBlock['math_number'] = (block) =>
  [String(block.getFieldValue('NUM')), Order.ATOMIC];

logoGenerator.forBlock['math_arithmetic'] = (block, gen) => {
  const opMap = { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/', POWER: '^' };
  const op = opMap[block.getFieldValue('OP')];
  const a  = valueCode(block, 'A', gen, '0');
  const b  = valueCode(block, 'B', gen, '0');
  return [`(${a} ${op} ${b})`, Order.NONE];
};

logoGenerator.forBlock['math_single'] = (block, gen) => {
  const fnMap = {
    ROOT: 'raizq', ABS: 'abs', NEG: '-', LN: 'ln', LOG10: 'log', EXP: 'exp',
    POW10: '(10 ^ %1)',
  };
  const op  = block.getFieldValue('OP');
  const num = valueCode(block, 'NUM', gen, '0');
  if (op === 'NEG')   return [`(- ${num})`, Order.UNARY];
  if (op === 'POW10') return [`(10 ^ ${num})`, Order.POWER];
  return [`${fnMap[op] || op} ${num}`, Order.ATOMIC];
};

logoGenerator.forBlock['math_trig'] = (block, gen) => {
  const fnMap = { SIN: 'seno', COS: 'cosseno', TAN: 'tangente', ASIN: 'arcoseno', ACOS: 'arcocosseno', ATAN: 'arcotangente' };
  const fn  = fnMap[block.getFieldValue('OP')] || 'seno';
  const num = valueCode(block, 'NUM', gen, '0');
  return [`${fn} ${num}`, Order.ATOMIC];
};

logoGenerator.forBlock['math_modulo'] = (block, gen) => {
  const dividend = valueCode(block, 'DIVIDEND', gen, '0');
  const divisor  = valueCode(block, 'DIVISOR',  gen, '1');
  return [`(${dividend} % ${divisor})`, Order.NONE];
};

logoGenerator.forBlock['math_random_int'] = (block, gen) => {
  const from = valueCode(block, 'FROM', gen, '1');
  const to   = valueCode(block, 'TO',   gen, '100');
  return [`inteiroentre ${from} ${to}`, Order.ATOMIC];
};

logoGenerator.forBlock['math_change'] = (block, gen) => {
  const name  = gen.getVariableName(block.getFieldValue('VAR'));
  const delta = valueCode(block, 'DELTA', gen, '1');
  return `${statementCode(block, gen)}faça "${name} (:${name} + ${delta})\n`;
};

// ── Logic ─────────────────────────────────────────────────────────────────────

logoGenerator.forBlock['logic_compare'] = (block, gen) => {
  const opMap = { EQ: '=', NEQ: '<>', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
  const op = opMap[block.getFieldValue('OP')];
  const a  = valueCode(block, 'A', gen, '0');
  const b  = valueCode(block, 'B', gen, '0');
  return [`(${a} ${op} ${b})`, Order.COMPARISON];
};

logoGenerator.forBlock['logic_operation'] = (block, gen) => {
  const op = block.getFieldValue('OP') === 'AND' ? 'e' : 'ou';
  const a  = valueCode(block, 'A', gen, 'falso');
  const b  = valueCode(block, 'B', gen, 'falso');
  return [`(${a} ${op} ${b})`, Order.LOGICAL];
};

logoGenerator.forBlock['logic_negate'] = (block, gen) => {
  const v = valueCode(block, 'BOOL', gen, 'falso');
  return [`não ${v}`, Order.UNARY];
};

logoGenerator.forBlock['logic_boolean'] = (block) =>
  [block.getFieldValue('BOOL') === 'TRUE' ? 'verdade' : 'falso', Order.ATOMIC];

// ── Variables ─────────────────────────────────────────────────────────────────

logoGenerator.forBlock['variables_set'] = (block, gen) => {
  const name  = gen.getVariableName(block.getFieldValue('VAR'));
  const value = valueCode(block, 'VALUE', gen, '0');
  return `${statementCode(block, gen)}faça "${name} ${value}\n`;
};

logoGenerator.forBlock['variables_get'] = (block, gen) =>
  [`:${gen.getVariableName(block.getFieldValue('VAR'))}`, Order.ATOMIC];

// ── Procedures ────────────────────────────────────────────────────────────────

logoGenerator.forBlock['procedures_defnoreturn'] = (block, gen) => {
  const name   = block.getFieldValue('NAME');
  const args   = block.getVars ? block.getVars().map(v => `:${v}`).join(' ') : '';
  const body   = gen.statementToCode(block, 'STACK');
  return `\naprenda ${name}${args ? ' ' + args : ''}\n${body}fim\n`;
};

logoGenerator.forBlock['procedures_defreturn'] = (block, gen) => {
  const name   = block.getFieldValue('NAME');
  const args   = block.getVars ? block.getVars().map(v => `:${v}`).join(' ') : '';
  const body   = gen.statementToCode(block, 'STACK');
  const ret    = valueCode(block, 'RETURN', gen, '0');
  return `\naprenda ${name}${args ? ' ' + args : ''}\n${body}  retorna ${ret}\nfim\n`;
};

logoGenerator.forBlock['procedures_callnoreturn'] = (block, gen) => {
  const name = block.getFieldValue('NAME');
  const args = (block.arguments_ || []).map((_, i) => valueCode(block, `ARG${i}`, gen, '0')).join(' ');
  return `${statementCode(block, gen)}${name}${args ? ' ' + args : ''}\n`;
};

logoGenerator.forBlock['procedures_callreturn'] = (block, gen) => {
  const name = block.getFieldValue('NAME');
  const args = (block.arguments_ || []).map((_, i) => valueCode(block, `ARG${i}`, gen, '0')).join(' ');
  return [`${name}${args ? ' ' + args : ''}`, Order.ATOMIC];
};

logoGenerator.forBlock['procedures_ifreturn'] = (block, gen) => {
  const cond = valueCode(block, 'CONDITION', gen, 'falso');
  const val  = block.hasReturnValue_ ? valueCode(block, 'VALUE', gen, '0') : '';
  return val
    ? `${statementCode(block, gen)}se ${cond} [ retorna ${val} ]\n`
    : `${statementCode(block, gen)}se ${cond} [ pare ]\n`;
};
