'use strict';
import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';
import * as ptBR from 'blockly/msg/pt-br';
import { FieldAngle } from '@blockly/field-angle';

Blockly.setLocale(ptBR);

export const Turtle_Msg = {
  GREEN_FLAG:    'Início',
  STEPS:         'passos',
  FORWARD:       'para frente',
  BACKWARD:      'para trás',
  LEFT:          'vira esquerda',
  RIGHT:         'vira direita',
  SET_POS:       'vai para posição',
  SET_POSX:      'vai para x',
  SET_POSY:      'vai para y',
  SET_HEADING:   'muda direção',
  HOME:          'vai para casa',
  SHOW_TURTLE:   'mostra tartaruga',
  HIDE_TURTLE:   'esconde tartaruga',
  CLEAN:         'limpa',
  CLEAR_SCREEN:  'limpa tela',
  WRAP:          'wrap',
  FENCE:         'fence',
  WINDOW:        'window',
  ARC:           'arco',
  ANGLE:         'ângulo',
  X_COORDINATE:  'coordenada x',
  Y_COORDINATE:  'coordenada y',
  HEADING:       'direção',
  TOWARDS:       'aponta',
  FILL:          'preenche',
  PENCOLOR:      'muda cor da caneta para',
  PENSIZE:       'muda tamanho da caneta para',
  PENUP:         'levanta caneta',
  PENDOWN:       'abaixa caneta',
  IS_PENUP:      'caneta levantada?',
  GET_PENCOLOR:  'cor da caneta',
  GET_PENSIZE:   'tamanho da caneta',
  SET_SHADE:     'muda tom para',
  GET_SHADE:     'tom atual',
};

Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE']    = 'aprenda';
Blockly.Msg['PROCEDURES_DEFNORETURN_PROCEDURE'] = 'algo novo';
Blockly.Msg['PROCEDURES_DEFRETURN_TITLE']       = 'aprenda';
Blockly.Msg['PROCEDURES_DEFRETURN_PROCEDURE']   = 'algo novo';

// ─── Color table ──────────────────────────────────────────────────────────────
function _buildColorTable() {
  const bases = [
    [128, 128, 128], [220,  50,  47], [232, 124,  18], [155,  93,  46],
    [225, 225,  40], [ 60, 180,  50], [130, 210,  30], [ 30, 200, 130],
    [  0, 190, 210], [ 80, 150, 220], [ 40,  80, 220], [130,  40, 200],
    [200,  30, 180], [230,  90, 160],
  ];
  const lerp  = (a, b, t) => Math.round(a + (b - a) * t);
  const hex2  = v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  const r2hex = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  const t = {};
  for (let f = 0; f < bases.length; f++) {
    const [r, g, b] = bases[f];
    for (let o = 0; o < 10; o++) {
      const idx = f * 10 + o;
      if      (o < 5) t[idx] = r2hex(lerp(15,r,o/5), lerp(15,g,o/5), lerp(15,b,o/5));
      else if (o === 5) t[idx] = r2hex(r, g, b);
      else    t[idx] = r2hex(lerp(r,240,(o-5)/5), lerp(g,240,(o-5)/5), lerp(b,240,(o-5)/5));
    }
  }
  return t;
}
export const COLOR_TABLE = _buildColorTable();

export function hexToColorIndex(hex) {
  const r1 = parseInt(hex.slice(1,3),16), g1 = parseInt(hex.slice(3,5),16), b1 = parseInt(hex.slice(5,7),16);
  let best = 0, bestDist = Infinity;
  for (const [idx, h] of Object.entries(COLOR_TABLE)) {
    const r2 = parseInt(h.slice(1,3),16), g2 = parseInt(h.slice(3,5),16), b2 = parseInt(h.slice(5,7),16);
    const d = (r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2;
    if (d < bestDist) { bestDist = d; best = Number(idx); }
  }
  return best;
}

// ─── FieldColorSwatch ─────────────────────────────────────────────────────────
export class FieldColorSwatch extends Blockly.Field {
  static fromJson(o) { return new FieldColorSwatch(o['value'] ?? '#000000'); }
  constructor(value) {
    super(value ?? '#000000');
    this.SERIALIZABLE = true;
    this.size_ = new Blockly.utils.Size(26, 0);
  }
  initView() {
    this.rectEl_ = Blockly.utils.dom.createSvgElement('rect',
      { x: 3, y: 2, width: 20, height: 16, rx: 2, ry: 2,
        style: 'cursor:pointer;stroke:rgba(0,0,0,0.4);stroke-width:1;' },
      this.fieldGroup_);
    this._updateView();
  }
  doClassValidation_(v) { return (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) ? v : null; }
  render_() { this._updateView(); }
  _updateView() { if (this.rectEl_) this.rectEl_.style.fill = this.getValue(); }
  showEditor_() {
    const div = Blockly.DropDownDiv.getContentDiv();
    div.innerHTML = '';
    const CELL = 20, GAP = 2, COLS = 14, ROWS = 10;
    const container = document.createElement('div');
    Object.assign(container.style, { padding:'6px', display:'grid',
      gridTemplateColumns:`repeat(${COLS},${CELL}px)`, gap:GAP+'px' });
    const currentHex = this.getValue();
    let currentIdx = -1;
    for (let i = 0; i < 140; i++) {
      if (COLOR_TABLE[i] && COLOR_TABLE[i].toLowerCase() === currentHex.toLowerCase()) { currentIdx = i; break; }
    }
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = col * 10 + (ROWS - 1 - row);
        if (!COLOR_TABLE[idx]) continue;
        const hex = COLOR_TABLE[idx];
        const cell = document.createElement('div');
        Object.assign(cell.style, { width:CELL+'px', height:CELL+'px', background:hex, cursor:'pointer',
          borderRadius:'3px', boxSizing:'border-box',
          border: idx===currentIdx ? '2px solid #fff' : '1px solid rgba(0,0,0,0.25)',
          outline: idx===currentIdx ? '1px solid #333' : 'none' });
        cell.title = String(idx);
        cell.addEventListener('mouseenter', () => { if (idx!==currentIdx) cell.style.transform='scale(1.2)'; });
        cell.addEventListener('mouseleave', () => { cell.style.transform=''; });
        cell.addEventListener('click', () => { this.setValue(hex); Blockly.DropDownDiv.hideWithoutAnimation(); });
        container.appendChild(cell);
      }
    }
    div.appendChild(container);
    Blockly.DropDownDiv.setColour(
      this.sourceBlock_?.style?.colourPrimary || '#555',
      this.sourceBlock_?.style?.colourTertiary || '#333');
    Blockly.DropDownDiv.showPositionedByField(this, () => {});
  }
}
Blockly.fieldRegistry.register('field_color_swatch', FieldColorSwatch);

// ─── Shared workspace options (single source of truth) ───────────────────────
// Import in both main.js and logo-blocks-viewer.js to keep visual parity.
export const BLOCKLY_BASE_OPTIONS = {
  media:       '/blockly/media/',
  scrollbars:  true,
  zoom:        { controls: true, wheel: true, startScale: 1.0 },
};

// ─── Block colors ─────────────────────────────────────────────────────────────
export const COLOR_TURTLE  = '#0081A6';
export const COLOR_CONTROL = '#8B5CF6';
export const COLOR_NUMBERS = '#D97706';
export const COLOR_PEN     = '#2ECC71';
export const COLOR_SCREEN  = '#00607e';
export const COLOR_START   = '#16A34A';
export const COLOR_STOP    = '#D51414';

// Override built-in block colors
[
  'controls_repeat_ext','controls_if','controls_whileUntil',
  'controls_for','controls_forEach','controls_flow_statements',
].forEach(type => {
  const proto = Blockly.Blocks[type]; if (!proto) return;
  const orig = proto.init;
  proto.init = function() { orig.call(this); this.setColour(COLOR_CONTROL); };
});
[
  'math_number','math_arithmetic','math_single','math_trig',
  'math_change','math_modulo','math_random_int','math_random_float',
  'math_constrain','math_number_property',
  'logic_compare','logic_operation','logic_negate',
  'logic_boolean','logic_null','logic_ternary',
].forEach(type => {
  const proto = Blockly.Blocks[type]; if (!proto) return;
  const orig = proto.init;
  proto.init = function() { orig.call(this); this.setColour(COLOR_NUMBERS); };
});
[
  'procedures_defnoreturn','procedures_defreturn',
  'procedures_callnoreturn','procedures_callreturn','procedures_ifreturn',
].forEach(type => {
  const proto = Blockly.Blocks[type]; if (!proto) return;
  const orig = proto.init;
  proto.init = function() { orig.call(this); this.setColour('#F5C518'); };
});

// ─── Block definitions ────────────────────────────────────────────────────────

Blockly.Blocks['controls_start'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GREEN_FLAG);
    this.setNextStatement(true); this.setColour(COLOR_START);
  },
};
javascriptGenerator.forBlock['controls_start'] = () => '';

Blockly.Blocks['controls_stop'] = {
  init() {
    this.appendDummyInput().appendField('pare');
    this.setPreviousStatement(true); this.setNextStatement(false); this.setColour(COLOR_STOP);
    this.setTooltip('Para a execução do escopo atual.');
  },
};
javascriptGenerator.forBlock['controls_stop'] = () => 'return;\n';

Blockly.Blocks['turtle_forward'] = {
  init() {
    this.appendValueInput('steps').setCheck('Number').appendField(Turtle_Msg.FORWARD);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_forward'] = (b, g) =>
  `moveCT(${g.valueToCode(b,'steps',Order.ATOMIC)});\n`;

Blockly.Blocks['turtle_back'] = {
  init() {
    this.appendValueInput('steps').setCheck('Number').appendField(Turtle_Msg.BACKWARD);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_back'] = (b, g) =>
  `moveCT(-(${g.valueToCode(b,'steps',Order.ATOMIC)}));\n`;

Blockly.Blocks['turtle_angle'] = {
  init() {
    this.appendDummyInput().appendField(new FieldAngle('90'), 'angle');
    this.setOutput(true, 'Number'); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_angle'] = b => [b.getFieldValue('angle'), Order.ATOMIC];

Blockly.Blocks['turtle_right'] = {
  init() {
    this.appendValueInput('degrees').setCheck('Number').appendField(Turtle_Msg.RIGHT);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_right'] = (b, g) =>
  `turnCT(${g.valueToCode(b,'degrees',Order.ATOMIC)||'0'});\n`;

Blockly.Blocks['turtle_left'] = {
  init() {
    this.appendValueInput('degrees').setCheck('Number').appendField(Turtle_Msg.LEFT);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_left'] = (b, g) =>
  `turnCT(-(${g.valueToCode(b,'degrees',Order.ATOMIC)||'0'}));\n`;

Blockly.Blocks['turtle_setpos'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SET_POS);
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setPreviousStatement(true); this.setInputsInline(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setpos'] = (b, g) =>
  `setpositionCT(${g.valueToCode(b,'x',Order.ATOMIC)},${g.valueToCode(b,'y',Order.ATOMIC)});\n`;

Blockly.Blocks['turtle_setposx'] = {
  init() {
    this.appendValueInput('x').setCheck('Number').appendField(Turtle_Msg.SET_POSX);
    this.setPreviousStatement(true); this.setInputsInline(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setposx'] = (b, g) =>
  `setpositionCT(${g.valueToCode(b,'x',Order.ATOMIC)},undefined);\n`;

Blockly.Blocks['turtle_setposy'] = {
  init() {
    this.appendValueInput('y').setCheck('Number').appendField(Turtle_Msg.SET_POSY);
    this.setPreviousStatement(true); this.setInputsInline(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setposy'] = (b, g) =>
  `setpositionCT(undefined,${g.valueToCode(b,'y',Order.ATOMIC)});\n`;

Blockly.Blocks['turtle_setheading'] = {
  init() {
    this.appendValueInput('degrees').setCheck('Number').appendField(Turtle_Msg.SET_HEADING);
    this.setPreviousStatement(true); this.setInputsInline(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setheading'] = (b, g) =>
  `setheadingCT(${g.valueToCode(b,'degrees',Order.ATOMIC)||'0'});\n`;

Blockly.Blocks['turtle_home'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HOME);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_home'] = () => 'homeCT();\n';

Blockly.Blocks['turtle_show'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SHOW_TURTLE);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_show'] = () => 'showCT();\n';

Blockly.Blocks['turtle_hide'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HIDE_TURTLE);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_hide'] = () => 'hideCT();\n';

Blockly.Blocks['screen_clean'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.CLEAN);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_clean'] = () => 'clearCT();\n';

Blockly.Blocks['screen_clearscreen'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.CLEAR_SCREEN);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_clearscreen'] = () => 'clearscreenCT();\n';

Blockly.Blocks['screen_wrap'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.WRAP);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_wrap'] = () => 'setturtlemodeCT("wrap");\n';

Blockly.Blocks['screen_fence'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.FENCE);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_fence'] = () => 'setturtlemodeCT("fence");\n';

Blockly.Blocks['screen_window'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.WINDOW);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_window'] = () => 'setturtlemodeCT("window");\n';

Blockly.Blocks['turtle_arc'] = {
  init() {
    this.appendValueInput('angle').setCheck('Number').appendField(Turtle_Msg.ARC).appendField(Turtle_Msg.ANGLE);
    this.appendValueInput('radius').setCheck('Number').appendField('raio');
    this.setInputsInline(true); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_arc'] = (b, g) =>
  `arcCT(${g.valueToCode(b,'angle',Order.ATOMIC)||'90'},${g.valueToCode(b,'radius',Order.ATOMIC)||'100'});\n`;

Blockly.Blocks['turtle_xcor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.X_COORDINATE);
    this.setOutput(true, 'Number'); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_xcor'] = () => ['getxCT()', Order.ATOMIC];

Blockly.Blocks['turtle_ycor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.Y_COORDINATE);
    this.setOutput(true, 'Number'); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_ycor'] = () => ['getyCT()', Order.ATOMIC];

Blockly.Blocks['turtle_heading'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HEADING);
    this.setOutput(true, 'Number'); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_heading'] = () => ['getheadingCT()', Order.ATOMIC];

Blockly.Blocks['turtle_towards'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.TOWARDS);
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setPreviousStatement(true); this.setInputsInline(true); this.setNextStatement(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_towards'] = (b, g) =>
  `towardsCT(${g.valueToCode(b,'x',Order.ATOMIC)},${g.valueToCode(b,'y',Order.ATOMIC)});\n`;

Blockly.Blocks['turtle_distance'] = {
  init() {
    this.appendDummyInput().appendField('distância até');
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setOutput(true, 'Number'); this.setInputsInline(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_distance'] = (b, g) =>
  [`distanceCT(${g.valueToCode(b,'x',Order.ATOMIC)||'0'},${g.valueToCode(b,'y',Order.ATOMIC)||'0'})`, Order.ATOMIC];

Blockly.Blocks['turtle_direction_to'] = {
  init() {
    this.appendDummyInput().appendField('direção até');
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setOutput(true, 'Number'); this.setInputsInline(true); this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_direction_to'] = (b, g) =>
  [`towardsValueCT(${g.valueToCode(b,'x',Order.ATOMIC)||'0'},${g.valueToCode(b,'y',Order.ATOMIC)||'0'})`, Order.ATOMIC];

Blockly.Blocks['pen_fill'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.FILL);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_fill'] = () => 'fillCT();\n';

Blockly.Blocks['pen_setpencolor'] = {
  init() {
    this.appendValueInput('color').setCheck('Number').appendField(Turtle_Msg.PENCOLOR);
    this.setColour(COLOR_PEN); this.setPreviousStatement(true); this.setNextStatement(true);
  },
};
javascriptGenerator.forBlock['pen_setpencolor'] = (b, g) =>
  `setcolorCT(${g.valueToCode(b,'color',Order.ATOMIC)||'0'});\n`;

Blockly.Blocks['pen_colornumber'] = {
  init() {
    this.appendDummyInput()
      .appendField(new FieldColorSwatch(COLOR_TABLE[0]), 'SWATCH')
      .appendField(new Blockly.FieldNumber(0, 0, 139, 1), 'NUM');
    this.setColour(COLOR_PEN); this.setOutput(true, 'Number');
    this.setTooltip('Clique no swatch para escolher a cor, ou no número para digitar (0–139).');
  },
  onchange(e) {
    if (e.type !== Blockly.Events.BLOCK_CHANGE || e.blockId !== this.id) return;
    Blockly.Events.disable();
    try {
      if (e.name === 'SWATCH') this.getField('NUM').setValue(hexToColorIndex(e.newValue));
      else if (e.name === 'NUM') this.getField('SWATCH').setValue(COLOR_TABLE[Math.max(0, Math.min(139, parseInt(e.newValue)||0))]);
    } finally { Blockly.Events.enable(); }
  },
};
javascriptGenerator.forBlock['pen_colornumber'] = b => [String(parseInt(b.getFieldValue('NUM'))||0), Order.ATOMIC];

Blockly.Blocks['pen_setpensize'] = {
  init() {
    this.appendValueInput('size').setCheck('Number').appendField(Turtle_Msg.PENSIZE);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_setpensize'] = (b, g) =>
  `setwidthCT(${g.valueToCode(b,'size',Order.ATOMIC)});\n`;

Blockly.Blocks['pen_setpenup'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.PENUP);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_setpenup'] = () => 'penupCT();\n';

Blockly.Blocks['pen_setpendown'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.PENDOWN);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_setpendown'] = () => 'pendownCT();\n';

Blockly.Blocks['pen_ispendown?'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.IS_PENUP);
    this.setOutput(true, 'Boolean'); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_ispendown?'] = () => ['ispendownCT()', Order.ATOMIC];

Blockly.Blocks['pen_pencolor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GET_PENCOLOR);
    this.setOutput(true, 'Number'); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_pencolor'] = () => ['getcolorCT()', Order.ATOMIC];

Blockly.Blocks['pen_pensize'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GET_PENSIZE);
    this.setOutput(true, 'Number'); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_pensize'] = () => ['getwidthCT()', Order.ATOMIC];

Blockly.Blocks['pen_setshade'] = {
  init() {
    this.appendValueInput('shade').setCheck('Number').appendField(Turtle_Msg.SET_SHADE);
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_setshade'] = (b, g) =>
  `setshadeCT(${g.valueToCode(b,'shade',Order.ATOMIC)||'50'});\n`;

Blockly.Blocks['pen_getshade'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GET_SHADE);
    this.setOutput(true, 'Number'); this.setColour(COLOR_PEN);
  },
};
javascriptGenerator.forBlock['pen_getshade'] = () => ['getshadeCT()', Order.ATOMIC];
