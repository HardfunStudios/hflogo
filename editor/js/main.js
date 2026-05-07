import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';
import * as ptBR from 'blockly/msg/pt-br';
import { FieldAngle } from '@blockly/field-angle';
import { logoGenerator }     from './logo-generator.js';
import { logoToBlocklyState } from './logo-to-blockly.js';

Blockly.setLocale(ptBR);

// Custom turtle messages (pt-br)
const Turtle_Msg = {
  GREEN_FLAG: 'In\u00edcio',
  STEPS: 'passos',
  FORWARD: 'para frente',
  BACKWARD: 'para trás',
  LEFT: 'vira esquerda',
  RIGHT: 'vira direita',
  SET_POS: 'vai para posição',
  SET_POSX: 'vai para posição x',
  SET_POSY: 'vai para posição y',
  SET_HEADING: 'muda direção',
  HOME: 'vai para casa',
  SHOW_TURTLE: 'mostra tartaruga',
  HIDE_TURTLE: 'esconde tartaruga',
  CLEAN: 'limpa',
  CLEAR_SCREEN: 'limpa tela',
  WRAP: 'wrap',
  FENCE: 'fence',
  WINDOW: 'window',
  ARC: 'arco',
  ANGLE: 'ângulo',
  X_COORDINATE: 'coordenada x',
  Y_COORDINATE: 'coordenada y',
  HEADING: 'direção',
  TOWARDS: 'aponta',
  FILL: 'preenche',
  PENCOLOR: 'muda cor da caneta para',
  PENSIZE: 'muda tamanho da caneta para',
  PENUP: 'levanta caneta',
  PENDOWN: 'abaixa caneta',
  IS_PENUP: 'caneta levantada?',
  GET_PENCOLOR: 'cor da caneta',
  GET_PENSIZE: 'tamanho da caneta',
};

Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE'] = 'aprenda';
Blockly.Msg['PROCEDURES_DEFNORETURN_PROCEDURE'] = 'algo novo';
Blockly.Msg['PROCEDURES_DEFRETURN_TITLE'] = 'aprenda';
Blockly.Msg['PROCEDURES_DEFRETURN_PROCEDURE'] = 'algo novo';

// ─── Color table (mirrors microworld.js FULL_256_COLORTABLE) ─────────────────

// StarLogo/NetLogo color scale: 14 families × 10 shades (0–139)
//   Family × 10 + 0  = darkest shade
//   Family × 10 + 5  = pure color
//   Family × 10 + 9  = lightest shade
//
//   0x: gray  | 1x: red    | 2x: orange | 3x: brown  | 4x: yellow
//   5x: green | 6x: lime   | 7x: turq   | 8x: cyan   | 9x: sky
//   10x: blue | 11x: violet| 12x: magenta| 13x: pink
function _buildColorTable() {
  const bases = [
    [128, 128, 128], // 0x: gray
    [220,  50,  47], // 1x: red
    [232, 124,  18], // 2x: orange
    [155,  93,  46], // 3x: brown
    [225, 225,  40], // 4x: yellow
    [ 60, 180,  50], // 5x: green
    [130, 210,  30], // 6x: lime
    [ 30, 200, 130], // 7x: turquoise
    [  0, 190, 210], // 8x: cyan
    [ 80, 150, 220], // 9x: sky
    [ 40,  80, 220], // 10x: blue
    [130,  40, 200], // 11x: violet
    [200,  30, 180], // 12x: magenta
    [230,  90, 160], // 13x: pink
  ];
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const hex2 = v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  const rgb2hex = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

  const t = {};
  for (let f = 0; f < bases.length; f++) {
    const [r, g, b] = bases[f];
    for (let o = 0; o < 10; o++) {
      const idx = f * 10 + o;
      if (o < 5) {
        const factor = o / 5;
        t[idx] = rgb2hex(lerp(15, r, factor), lerp(15, g, factor), lerp(15, b, factor));
      } else if (o === 5) {
        t[idx] = rgb2hex(r, g, b);
      } else {
        const factor = (o - 5) / 5;
        t[idx] = rgb2hex(lerp(r, 240, factor), lerp(g, 240, factor), lerp(b, 240, factor));
      }
    }
  }
  return t;
}
const COLOR_TABLE = _buildColorTable();

// Find the closest index in COLOR_TABLE for a given hex color
function hexToColorIndex(hex) {
  const r1 = parseInt(hex.slice(1,3),16);
  const g1 = parseInt(hex.slice(3,5),16);
  const b1 = parseInt(hex.slice(5,7),16);
  let best = 0, bestDist = Infinity;
  for (const [idx, h] of Object.entries(COLOR_TABLE)) {
    const r2 = parseInt(h.slice(1,3),16);
    const g2 = parseInt(h.slice(3,5),16);
    const b2 = parseInt(h.slice(5,7),16);
    const d = (r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2;
    if (d < bestDist) { bestDist = d; best = Number(idx); }
  }
  return best;
}

// ─── FieldColorSwatch: clickable color rect, stores hex, opens native picker ──

class FieldColorSwatch extends Blockly.Field {
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

  _updateView() {
    if (this.rectEl_) this.rectEl_.style.fill = this.getValue();
  }

  showEditor_() {
    const div = Blockly.DropDownDiv.getContentDiv();
    div.innerHTML = '';

    const W = 220, H = 150, SH = 16, PAD = 10;
    const container = document.createElement('div');
    Object.assign(container.style, { padding: PAD+'px', userSelect: 'none', width: W+'px' });

    // ── Spectrum canvas (saturation x, brightness y) ─────────────────────────
    const spectrum = document.createElement('canvas');
    spectrum.width = W; spectrum.height = H;
    Object.assign(spectrum.style, { display:'block', borderRadius:'4px', cursor:'crosshair' });

    // ── Hue slider ────────────────────────────────────────────────────────────
    const hueCanvas = document.createElement('canvas');
    hueCanvas.width = W; hueCanvas.height = SH;
    Object.assign(hueCanvas.style, { display:'block', borderRadius:'3px', cursor:'crosshair', marginTop:'8px' });

    // ── Preview row ───────────────────────────────────────────────────────────
    const previewRow = document.createElement('div');
    Object.assign(previewRow.style, { display:'flex', alignItems:'center', gap:'8px', marginTop:'8px' });

    const preview = document.createElement('div');
    Object.assign(preview.style, { width:'32px', height:'32px', borderRadius:'4px', border:'1px solid rgba(0,0,0,0.3)', flexShrink:'0' });

    const idxLabel = document.createElement('div');
    Object.assign(idxLabel.style, { fontSize:'13px', fontFamily:'monospace', fontWeight:'bold', color:'#fff' });

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.maxLength = 7;
    Object.assign(hexInput.style, {
      fontSize:'12px', fontFamily:'monospace', color:'#fff',
      background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)',
      borderRadius:'3px', padding:'2px 5px', width:'72px', outline:'none',
    });

    const labelCol = document.createElement('div');
    Object.assign(labelCol.style, { display:'flex', flexDirection:'column', gap:'4px' });
    labelCol.append(idxLabel, hexInput);
    previewRow.append(preview, labelCol);
    container.append(spectrum, hueCanvas, previewRow);
    div.appendChild(container);

    // ── State ─────────────────────────────────────────────────────────────────
    // Parse current hex → HSV
    const hexToHsv = (hex) => {
      const r = parseInt(hex.slice(1,3),16)/255;
      const g = parseInt(hex.slice(3,5),16)/255;
      const b = parseInt(hex.slice(5,7),16)/255;
      const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
      let h = 0;
      if (d) {
        if (max===r) h = ((g-b)/d+6)%6;
        else if (max===g) h = (b-r)/d+2;
        else h = (r-g)/d+4;
        h /= 6;
      }
      return { h, s: max ? d/max : 0, v: max };
    };

    const hsvToHex = (h,s,v) => {
      const f = (n) => { const k=(n+h*6)%6; return v-v*s*Math.max(0,Math.min(k,4-k,1)); };
      const to = x => Math.round(x*255).toString(16).padStart(2,'0');
      return '#'+to(f(5))+to(f(3))+to(f(1));
    };

    let { h, s, v } = hexToHsv(this.getValue());
    let draggingSpectrum = false, draggingHue = false;

    // ── Draw functions ────────────────────────────────────────────────────────
    const drawSpectrum = () => {
      const ctx = spectrum.getContext('2d');
      // White → hue gradient (left to right = saturation)
      const hg = ctx.createLinearGradient(0,0,W,0);
      hg.addColorStop(0, '#fff');
      hg.addColorStop(1, hsvToHex(h,1,1));
      ctx.fillStyle = hg; ctx.fillRect(0,0,W,H);
      // Transparent → black (top to bottom = brightness)
      const vg = ctx.createLinearGradient(0,0,0,H);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, '#000');
      ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
      // Cursor
      const cx = s*W, cy = (1-v)*H;
      ctx.beginPath(); ctx.arc(cx,cy,6,0,2*Math.PI);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,7,0,2*Math.PI);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    };

    const drawHue = () => {
      const ctx = hueCanvas.getContext('2d');
      const g = ctx.createLinearGradient(0,0,W,0);
      for (let i=0;i<=12;i++) g.addColorStop(i/12, `hsl(${i/12*360},100%,50%)`);
      ctx.fillStyle = g; ctx.fillRect(0,0,W,SH);
      // Cursor
      const cx = h*W;
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx-2, 0, 4, SH);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth=1;
      ctx.strokeRect(cx-2, 0, 4, SH);
    };

    const updatePreview = () => {
      const hex = hsvToHex(h,s,v);
      const idx = hexToColorIndex(hex);
      preview.style.background = hex;
      idxLabel.textContent = 'índice: ' + idx;
      if (document.activeElement !== hexInput) hexInput.value = hex;
    };

    hexInput.addEventListener('input', () => {
      const val = hexInput.value.trim();
      if (!/^#[0-9a-f]{6}$/i.test(val)) return;
      const hsv = hexToHsv(val);
      h = hsv.h; s = hsv.s; v = hsv.v;
      update();
      this.setValue(val);
    });
    hexInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') hexInput.blur();
      e.stopPropagation(); // prevent Blockly from stealing keys
    });
    hexInput.addEventListener('mousedown', (e) => e.stopPropagation());

    const update = () => { drawSpectrum(); drawHue(); updatePreview(); };
    update();

    // ── Spectrum interaction ──────────────────────────────────────────────────
    const onSpectrumMove = (e) => {
      const r = spectrum.getBoundingClientRect();
      s = Math.max(0, Math.min(1, (e.clientX - r.left) / W));
      v = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / H));
      update();
      this.setValue(hsvToHex(h,s,v));
    };
    spectrum.addEventListener('mousedown', (e) => { draggingSpectrum=true; onSpectrumMove(e); });

    // ── Hue interaction ───────────────────────────────────────────────────────
    const onHueMove = (e) => {
      const r = hueCanvas.getBoundingClientRect();
      h = Math.max(0, Math.min(1, (e.clientX - r.left) / W));
      update();
      this.setValue(hsvToHex(h,s,v));
    };
    hueCanvas.addEventListener('mousedown', (e) => { draggingHue=true; onHueMove(e); });

    // Global mousemove/mouseup
    const onMove = (e) => {
      if (draggingSpectrum) onSpectrumMove(e);
      if (draggingHue) onHueMove(e);
    };
    const onUp = () => { draggingSpectrum=false; draggingHue=false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    Blockly.DropDownDiv.setColour(
      this.sourceBlock_.style.colourPrimary,
      this.sourceBlock_.style.colourTertiary,
    );
    Blockly.DropDownDiv.showPositionedByField(this, () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    });
  }
}

Blockly.fieldRegistry.register('field_color_swatch', FieldColorSwatch);

// ─── Block definitions ────────────────────────────────────────────────────────

const COLOR_TURTLE   = '#0081A6';
const COLOR_CONTROL  = '#8B5CF6';
const COLOR_NUMBERS  = '#D97706';
const COLOR_PEN      = '#2ECC71';
const COLOR_SCREEN   = '#00607e';
const COLOR_START    = '#16A34A';
const COLOR_STOP     = '#D51414';

const hue_category_pen = COLOR_PEN;

// Override colors of built-in Blockly blocks to match our palette
[
  'controls_repeat_ext', 'controls_if', 'controls_whileUntil',
  'controls_for', 'controls_forEach', 'controls_flow_statements',
].forEach(type => {
  const proto = Blockly.Blocks[type];
  if (!proto) return;
  const orig = proto.init;
  proto.init = function () { orig.call(this); this.setColour(COLOR_CONTROL); };
});

[
  'math_number', 'math_arithmetic', 'math_single', 'math_trig',
  'math_change', 'math_modulo', 'math_random_int', 'math_random_float',
  'math_constrain', 'math_number_property',
  'logic_compare', 'logic_operation', 'logic_negate',
  'logic_boolean', 'logic_null', 'logic_ternary',
].forEach(type => {
  const proto = Blockly.Blocks[type];
  if (!proto) return;
  const orig = proto.init;
  proto.init = function () { orig.call(this); this.setColour(COLOR_NUMBERS); };
});

[
  'procedures_defnoreturn', 'procedures_defreturn',
  'procedures_callnoreturn', 'procedures_callreturn',
  'procedures_ifreturn',
].forEach(type => {
  const proto = Blockly.Blocks[type];
  if (!proto) return;
  const orig = proto.init;
  proto.init = function () { orig.call(this); this.setColour('#F5C518'); };
});

Blockly.Blocks['controls_start'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GREEN_FLAG);
    this.setNextStatement(true);
    this.setColour(COLOR_START);
  },
};
javascriptGenerator.forBlock['controls_start'] = () => '';

Blockly.Blocks['controls_stop'] = {
  init() {
    this.appendDummyInput().appendField('pare');
    this.setPreviousStatement(true);
    this.setNextStatement(false);
    this.setColour(COLOR_STOP);
    this.setTooltip('Para a execução do escopo atual. Dentro de uma função, sai da função. No programa principal, encerra a execução.');
  },
};
javascriptGenerator.forBlock['controls_stop'] = () => 'return;\n';

Blockly.Blocks['turtle_forward'] = {
  init() {
    this.appendValueInput('steps').setCheck('Number').appendField(Turtle_Msg.FORWARD);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_forward'] = (block, gen) => {
  const steps = gen.valueToCode(block, 'steps', Order.ATOMIC);
  return `moveCT(${steps});\n`;
};

Blockly.Blocks['turtle_back'] = {
  init() {
    this.appendValueInput('steps').setCheck('Number').appendField(Turtle_Msg.BACKWARD);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_back'] = (block, gen) => {
  const steps = gen.valueToCode(block, 'steps', Order.ATOMIC);
  return `moveCT(-${steps});\n`;
};

// Angle value block: FieldAngle so the user can type or use the protractor
Blockly.Blocks['turtle_angle'] = {
  init() {
    this.appendDummyInput()
      .appendField(new FieldAngle('90'), 'angle');
    this.setOutput(true, 'Number');
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_angle'] = (block) =>
  [block.getFieldValue('angle'), Order.ATOMIC];

Blockly.Blocks['turtle_right'] = {
  init() {
    this.appendValueInput('degrees')
      .setCheck('Number')
      .appendField(Turtle_Msg.RIGHT);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_right'] = (block, gen) =>
  `turnCT(${gen.valueToCode(block, 'degrees', Order.ATOMIC) || '0'});\n`;

Blockly.Blocks['turtle_left'] = {
  init() {
    this.appendValueInput('degrees')
      .setCheck('Number')
      .appendField(Turtle_Msg.LEFT);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_left'] = (block, gen) =>
  `turnCT(-(${gen.valueToCode(block, 'degrees', Order.ATOMIC) || '0'}));\n`;

Blockly.Blocks['turtle_setpos'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SET_POS);
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setPreviousStatement(true);
    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setpos'] = (block, gen) => {
  const x = gen.valueToCode(block, 'x', Order.ATOMIC);
  const y = gen.valueToCode(block, 'y', Order.ATOMIC);
  return `setpositionCT(${x},${y});\n`;
};

Blockly.Blocks['turtle_setposx'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SET_POSX);
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.setPreviousStatement(true);
    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setposx'] = (block, gen) => {
  const x = gen.valueToCode(block, 'x', Order.ATOMIC);
  return `setpositionCT(${x},undefined);\n`;
};

Blockly.Blocks['turtle_setposy'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SET_POSY);
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setPreviousStatement(true);
    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setposy'] = (block, gen) => {
  const y = gen.valueToCode(block, 'y', Order.ATOMIC);
  return `setpositionCT(undefined,${y});\n`;
};

Blockly.Blocks['turtle_setheading'] = {
  init() {
    this.appendValueInput('degrees')
      .setCheck('Number')
      .appendField(Turtle_Msg.SET_HEADING);
    this.setPreviousStatement(true);
    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_setheading'] = (block, gen) =>
  `setheadingCT(${gen.valueToCode(block, 'degrees', Order.ATOMIC) || '0'});\n`;

Blockly.Blocks['turtle_home'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HOME);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_home'] = () => 'homeCT();\n';

Blockly.Blocks['turtle_show'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SHOW_TURTLE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_show'] = () => 'showCT();\n';

Blockly.Blocks['turtle_hide'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HIDE_TURTLE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_hide'] = () => 'hideCT();\n';

Blockly.Blocks['screen_clean'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.CLEAN);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_clean'] = () => 'clearCT();\n';

Blockly.Blocks['screen_clearscreen'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.CLEAR_SCREEN);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_clearscreen'] = () => 'clearscreenCT();\n';

Blockly.Blocks['screen_wrap'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.WRAP);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_wrap'] = () => 'setturtlemodeCT("wrap");\n';

Blockly.Blocks['screen_fence'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.FENCE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_fence'] = () => 'setturtlemodeCT("fence");\n';

Blockly.Blocks['screen_window'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.WINDOW);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_SCREEN);
  },
};
javascriptGenerator.forBlock['screen_window'] = () => 'setturtlemodeCT("window");\n';

Blockly.Blocks['turtle_arc'] = {
  init() {
    this.appendValueInput('angle')
      .setCheck('Number')
      .appendField(Turtle_Msg.ARC)
      .appendField(Turtle_Msg.ANGLE);
    this.appendValueInput('radius').setCheck('Number').appendField('radius');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_arc'] = (block, gen) => {
  const angle = gen.valueToCode(block, 'angle', Order.ATOMIC) || '90';
  const radius = gen.valueToCode(block, 'radius', Order.ATOMIC) || '100';
  return `arcCT(${angle},${radius});\n`;
};

Blockly.Blocks['turtle_xcor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.X_COORDINATE);
    this.setOutput(true, 'Number');
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_xcor'] = () => ['getxCT()', Order.ATOMIC];

Blockly.Blocks['turtle_ycor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.Y_COORDINATE);
    this.setOutput(true, 'Number');
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_ycor'] = () => ['getyCT()', Order.ATOMIC];

Blockly.Blocks['turtle_heading'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HEADING);
    this.setOutput(true, 'Number');
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_heading'] = () => ['getheadingCT()', Order.ATOMIC];

Blockly.Blocks['turtle_towards'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.TOWARDS);
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setPreviousStatement(true);
    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setColour(COLOR_TURTLE);
  },
};
javascriptGenerator.forBlock['turtle_towards'] = (block, gen) => {
  const x = gen.valueToCode(block, 'x', Order.ATOMIC);
  const y = gen.valueToCode(block, 'y', Order.ATOMIC);
  return `towardsCT(${x},${y});\n`;
};

Blockly.Blocks['pen_fill'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.FILL);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(hue_category_pen);
  },
};
javascriptGenerator.forBlock['pen_fill'] = () => 'fillCT();\n';

Blockly.Blocks['pen_setpencolor'] = {
  init() {
    this.appendValueInput('color').setCheck('Number').appendField(Turtle_Msg.PENCOLOR);
    this.setColour(hue_category_pen);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  },
};
javascriptGenerator.forBlock['pen_setpencolor'] = (block, gen) => {
  const color = gen.valueToCode(block, 'color', Order.ATOMIC) || '0';
  return `setcolorCT(${color});\n`;
};

Blockly.Blocks['pen_colornumber'] = {
  init() {
    this.appendDummyInput()
        .appendField(new FieldColorSwatch(COLOR_TABLE[0]), 'SWATCH')
        .appendField(new Blockly.FieldNumber(0, 0, 139, 1), 'NUM');
    this.setColour(hue_category_pen);
    this.setOutput(true, 'Number');
    this.setTooltip('Clique no swatch para escolher a cor, ou no número para digitar (0–139).');
  },
  onchange(e) {
    if (e.type !== Blockly.Events.BLOCK_CHANGE || e.blockId !== this.id) return;
    Blockly.Events.disable();
    try {
      if (e.name === 'SWATCH') {
        const idx = hexToColorIndex(e.newValue);
        this.getField('NUM').setValue(idx);
      } else if (e.name === 'NUM') {
        const hex = COLOR_TABLE[Math.max(0, Math.min(139, parseInt(e.newValue) || 0))];
        this.getField('SWATCH').setValue(hex);
      }
    } finally {
      Blockly.Events.enable();
    }
  },
};
javascriptGenerator.forBlock['pen_colornumber'] = (block) => {
  const num = parseInt(block.getFieldValue('NUM')) || 0;
  return [String(num), Order.ATOMIC];
};

Blockly.Blocks['pen_setpensize'] = {
  init() {
    this.appendValueInput('size').setCheck('Number').appendField(Turtle_Msg.PENSIZE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(hue_category_pen);
  },
};
javascriptGenerator.forBlock['pen_setpensize'] = (block, gen) => {
  const size = gen.valueToCode(block, 'size', Order.ATOMIC);
  return `setwidthCT(${size});\n`;
};

Blockly.Blocks['pen_setpenup'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.PENUP);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(hue_category_pen);
  },
};
javascriptGenerator.forBlock['pen_setpenup'] = () => 'penupCT();\n';

Blockly.Blocks['pen_setpendown'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.PENDOWN);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(hue_category_pen);
  },
};
javascriptGenerator.forBlock['pen_setpendown'] = () => 'pendownCT();\n';

Blockly.Blocks['pen_ispendown?'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.IS_PENUP);
    this.setOutput(true, 'Boolean');
    this.setColour(hue_category_pen);
  },
};
javascriptGenerator.forBlock['pen_ispendown?'] = () => ['ispendownCT()', Order.ATOMIC];

Blockly.Blocks['pen_pencolor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GET_PENCOLOR);
    this.setOutput(true, 'Number');
    this.setColour(hue_category_pen);
  },
};
javascriptGenerator.forBlock['pen_pencolor'] = () => ['getcolorCT()', Order.ATOMIC];

Blockly.Blocks['pen_pensize'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GET_PENSIZE);
    this.setOutput(true, 'Boolean');
    this.setColour(hue_category_pen);
  },
};
javascriptGenerator.forBlock['pen_pensize'] = () => ['getwidthCT()', Order.ATOMIC];

// ─── Toolbox definition ───────────────────────────────────────────────────────

const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Tartaruga',
      colour: COLOR_TURTLE,
      contents: [
        { kind: 'block', type: 'turtle_forward', inputs: { steps: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'turtle_back', inputs: { steps: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'turtle_right', inputs: { degrees: { shadow: { type: 'turtle_angle', fields: { angle: 90 } } } } },
        { kind: 'block', type: 'turtle_left',  inputs: { degrees: { shadow: { type: 'turtle_angle', fields: { angle: 90 } } } } },
        { kind: 'block', type: 'turtle_home' },
        { kind: 'block', type: 'turtle_arc', inputs: { angle: { shadow: { type: 'math_number', fields: { NUM: 360 } } }, radius: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'turtle_setpos', inputs: { x: { shadow: { type: 'math_number', fields: { NUM: 0 } } }, y: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'turtle_setposx', inputs: { x: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'turtle_xcor' },
        { kind: 'block', type: 'turtle_setposy', inputs: { y: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'turtle_ycor' },
        { kind: 'block', type: 'turtle_setheading', inputs: { degrees: { shadow: { type: 'turtle_angle', fields: { angle: 90 } } } } },
        { kind: 'block', type: 'turtle_heading' },
        { kind: 'block', type: 'turtle_show' },
        { kind: 'block', type: 'turtle_hide' },
        { kind: 'block', type: 'turtle_towards', inputs: { x: { shadow: { type: 'math_number', fields: { NUM: 0 } } }, y: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
      ],
    },
    {
      kind: 'category',
      name: 'Controle',
      colour: COLOR_CONTROL,
      contents: [
        { kind: 'block', type: 'controls_start' },
        { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'controls_if', inputs: { IF0: { shadow: { type: 'logic_boolean' } } } },
        { kind: 'block', type: 'controls_if', extraState: { hasElse: true }, inputs: { IF0: { shadow: { type: 'logic_boolean' } } } },
        { kind: 'block', type: 'controls_stop' },
      ],
    },
    {
      kind: 'category',
      name: 'Números',
      colour: COLOR_NUMBERS,
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic', inputs: { A: { shadow: { type: 'math_number', fields: { NUM: 10 } } }, B: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'math_single', inputs: { NUM: { shadow: { type: 'math_number', fields: { NUM: 9 } } } } },
        { kind: 'block', type: 'math_trig', inputs: { NUM: { shadow: { type: 'math_number', fields: { NUM: 45 } } } } },
        { kind: 'block', type: 'logic_compare', inputs: { A: { shadow: { type: 'math_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'logic_operation', inputs: { A: { shadow: { type: 'logic_boolean' } }, B: { shadow: { type: 'logic_boolean' } } } },
        { kind: 'block', type: 'logic_negate', inputs: { BOOL: { shadow: { type: 'logic_boolean' } } } },
        { kind: 'block', type: 'math_change', inputs: { DELTA: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
        { kind: 'block', type: 'math_modulo', inputs: { DIVIDEND: { shadow: { type: 'math_number', fields: { NUM: 10 } } }, DIVISOR: { shadow: { type: 'math_number', fields: { NUM: 3 } } } } },
        {
          kind: 'block',
          type: 'math_random_int',
          inputs: {
            FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
            TO: { shadow: { type: 'math_number', fields: { NUM: 100 } } },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Caneta',
      colour: COLOR_PEN,
      contents: [
        { kind: 'block', type: 'pen_setpencolor', inputs: { color: { shadow: { type: 'pen_colornumber', fields: { NUM: 15, SWATCH: COLOR_TABLE[15] } } } } },
        { kind: 'block', type: 'pen_colornumber' },
        { kind: 'block', type: 'pen_setpensize', inputs: { size: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
        { kind: 'block', type: 'pen_ispendown?' },
        { kind: 'block', type: 'pen_setpenup' },
        { kind: 'block', type: 'pen_setpendown' },
        { kind: 'block', type: 'pen_fill' },
        { kind: 'block', type: 'pen_pencolor' },
        { kind: 'block', type: 'pen_pensize' },
      ],
    },
    {
      kind: 'category',
      name: 'Tela',
      colour: COLOR_SCREEN,
      contents: [
        { kind: 'block', type: 'screen_clean' },
        { kind: 'block', type: 'screen_clearscreen' },
      ],
    },
    { kind: 'category', name: 'Variáveis', colour: '#9E6B00', custom: 'VARIABLE' },
    { kind: 'category', name: 'Ensinar', colour: '#F5C518', custom: 'PROCEDURE' },
  ],
};

// ─── Tab state ────────────────────────────────────────────────────────────────

let _activeTab = 'blocos'; // 'blocos' | 'logo'
let _running   = false;
let _hadError  = false;

function _setRunning(val) {
  _running = val;
  ['tabBlocos', 'tabLogo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = val;
  });
}

function _shouldHighlight() {
  return parseInt(document.getElementById('speedSlider')?.value ?? '5') < 6;
}

// Inject __hl__ "base64(L{line}) before each executable line for Logo-mode stepping
function _injectLineMarkers(code) {
  const enc = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return code.split('\n').flatMap((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith(';') || t === '[' || t === ']' || t === 'fim') return [line];
    return [`__hl__ "${enc('L' + (i + 1))}`, line];
  }).join('\n');
}

const _LOGO_LINE_HEIGHT = 13 * 1.6; // must match CSS font-size × line-height
const _LOGO_PADDING_TOP = 16;

function _highlightLogoLine(lineNum) {
  const ta    = document.getElementById('logoCodeEditor');
  const hl    = document.getElementById('logoLineHighlight');
  const arrow = document.getElementById('logoLineArrow');
  if (!ta || !hl) return;
  // Auto-scroll to keep line visible
  const taH = ta.clientHeight;
  const yRaw = _LOGO_PADDING_TOP + (lineNum - 1) * _LOGO_LINE_HEIGHT;
  if (yRaw - ta.scrollTop < _LOGO_PADDING_TOP ||
      yRaw - ta.scrollTop + _LOGO_LINE_HEIGHT > taH - _LOGO_PADDING_TOP) {
    ta.scrollTop = yRaw - taH / 2;
  }
  const y = yRaw - ta.scrollTop;
  hl.style.top    = y + 'px';
  hl.style.height = _LOGO_LINE_HEIGHT + 'px';
  hl.style.opacity = '1';
  if (arrow) {
    arrow.style.top    = y + 'px';
    arrow.style.height = _LOGO_LINE_HEIGHT + 'px';
    arrow.style.opacity = '1';
  }
}

function _clearLogoHighlight() {
  const hl    = document.getElementById('logoLineHighlight');
  const arrow = document.getElementById('logoLineArrow');
  if (hl)    hl.style.opacity    = '0';
  if (arrow) arrow.style.opacity = '0';
}

// ─── LP code execution ────────────────────────────────────────────────────────

let time_block_mapping = [];

function lpHighlighBlockTime(time) {
  const block_id = time_block_mapping[time];
  window.workspace.highlightBlock(block_id);
}

// With __hl__ markers — only for the worker (block highlighting)
function generateCode() {
  logoGenerator.STATEMENT_PREFIX = '';
  logoGenerator._noHighlight     = false;
  return logoGenerator.workspaceToCode(window.workspace);
}

// Clean Logo — for display in the text editor
function generateDisplayCode() {
  logoGenerator.STATEMENT_PREFIX = '';
  logoGenerator._noHighlight     = true;
  return logoGenerator.workspaceToCode(window.workspace);
}

// Code to send to the worker: instrumented when highlighting, plain otherwise
function _getLogoCode() {
  if (_activeTab === 'logo') {
    const raw = document.getElementById('logoCodeEditor')?.value ?? '';
    return _shouldHighlight() ? _injectLineMarkers(raw) : raw;
  }
  return _shouldHighlight() ? generateCode() : generateDisplayCode();
}

function _getLogoTextarea() { return document.getElementById('logoCodeEditor'); }

function getExecutionDelay() {
  const slider = document.getElementById('speedSlider');
  if (!slider) return 0;
  const map = { 1: 500, 2: 375, 3: 250, 4: 125, 5: 0, 6: 0 };
  return map[parseInt(slider.value)] ?? 0;
}

// ── Worker management ─────────────────────────────────────────────────────────

let _worker = null;

function _applyCommand(name, args) {
  window.currentworld.pushCommand(name, args);
  switch (name) {
    case 'moveCT':          moveCT(args[0]); break;
    case 'turnCT':          turnCT(args[0]); break;
    case 'setpositionCT':   setpositionCT(args[0], args[1]); break;
    case 'setheadingCT':    setheadingCT(args[0]); break;
    case 'setcolorCT':      setcolorCT(args[0]); break;
    case 'setwidthCT':      setwidthCT(args[0]); break;
    case 'setfontsizeCT':   setfontsizeCT(args[0]); break;
    case 'setpenmodeCT':    setpenmodeCT(args[0]); break;
    case 'setturtlemodeCT': setturtlemodeCT(args[0]); break;
    case 'setstateCT':      setstateCT(args[0]); break;
    case 'penupCT':         penupCT(); break;
    case 'pendownCT':       pendownCT(); break;
    case 'showCT':          showCT(); break;
    case 'hideCT':          hideCT(); break;
    case 'homeCT':          homeCT(); break;
    case 'clearscreenCT':   clearscreenCT(); break;
    case 'clearCT':         clearCT(); break;
    case 'fillCT':          fillCT(); break;
    case 'towardsCT':       towardsCT(args[0], args[1]); break;
    case 'drawtextCT':      drawtextCT(args[0], args[1]); break;
    case 'arcCT':           arcCT(args[0], args[1]); break;
  }
}

function _startWorker(code) {
  if (_worker) { _worker.terminate(); _worker = null; }
  _hadError = false;
  _setRunning(true);

  time_block_mapping = [];
  window.workspace.highlightBlock(null);

  _worker = new Worker('/editor-assets/js/logo-worker-v2.js');

  _worker.onmessage = function(e) {
    const msg = e.data;

    if (msg.type === 'cmd') {
      _applyCommand(msg.name, msg.args);
      return;
    }

    if (msg.type === 'highlight') {
      // Speed 6: skip all highlighting, ack immediately
      if (!_shouldHighlight()) {
        if (_worker) _worker.postMessage({ type: 'ack' });
        return;
      }

      window.currentworld.render();
      time_block_mapping.push(msg.blockId);

      // Highlight block or Logo line depending on active tab
      if (_activeTab === 'logo' && msg.blockId.startsWith('L')) {
        _highlightLogoLine(parseInt(msg.blockId.slice(1)));
      } else {
        _clearLogoHighlight();
        window.workspace.highlightBlock(msg.blockId);
      }

      const delay = getExecutionDelay();
      if (delay > 0) {
        setTimeout(() => { if (_worker) _worker.postMessage({ type: 'ack' }); }, delay);
      } else {
        // yield to browser so the highlight repaints before next step
        requestAnimationFrame(() => { if (_worker) _worker.postMessage({ type: 'ack' }); });
      }
      return;
    }

    if (msg.type === 'alert') {
      alert(msg.text);
      return;
    }

    if (msg.type === 'error') {
      _hadError = true;
      console.error('[Logo] runtime error:', msg.message);
      return;
    }

    if (msg.type === 'done') {
      window.workspace.highlightBlock(null);
      _clearLogoHighlight();
      _worker.terminate();
      _worker = null;
      window.currentworld.render();
      const btn = document.getElementById('runButton');
      _finishExecution(btn, { stopped: msg.stopped, hadError: _hadError });
      _setRunning(false);
    }
  };

  _worker.onerror = function(e) {
    console.error('Worker error:', e.message, e.filename, e.lineno);
    const btn = document.getElementById('runButton');
    btn?.classList.remove('running');
    btn && (btn.disabled = false);
    _clearLogoHighlight();
    _hadError = true;
    _setRunning(false);
    if (_worker) { _worker.terminate(); _worker = null; }
  };

  _worker.postMessage({ type: 'run', code });
}

function _onSpeedChange() {
  // delay is read from slider at ack time — no message needed
}

window.lpHighlighBlockTime = lpHighlighBlockTime;
window.lpParseCode = generateCode;

// ─── Microworld store ─────────────────────────────────────────────────────────

function saveFormat(name, author, state) {
  this.name = name;
  this.author = author;
  this.code = JSON.stringify(state);
}

function restoreMicroworld(mw) {
  window.currentworld.reset();
  $('canvas').remove();

  const canvasParent = $(window.currentworldFrameSelector);
  window.currentworld = new Microworld(
    window.currentworldFrameSelector,
    canvasParent.width(),
    window.currentworldHeigth
  );
  window.currentworld.name = mw.name;
  window.currentworld.author = mw.author;

  window.workspace.clear();
  Blockly.serialization.workspaces.load(JSON.parse(mw.code), window.workspace);
}

function saveMicroworldDump() {
  const state = Blockly.serialization.workspaces.save(window.workspace);
  return JSON.stringify(new saveFormat(window.currentworld.microworldName, window.currentworld.microworldAuthor, state));
}

function getSavedWorldsList() {
  const worldsStr = window.localStorage.getItem('microworlds');
  return worldsStr ? JSON.parse(worldsStr) : [];
}

function getSaveMicroworld(key) {
  return JSON.parse(window.localStorage.getItem(key));
}

function saveMicrowold() {
  if (window.currentworld.microworldName !== '') {
    const worlds = getSavedWorldsList();
    const key = 'microwold_' + window.currentworld.microworldId;
    window.localStorage.setItem(key, saveMicroworldDump());
    if (!worlds.includes(key)) {
      worlds.push(key);
      window.localStorage.setItem('microworlds', JSON.stringify(worlds));
    }
  }
  return false;
}

const downloadDataURI = function ($, options) {
  if (!options) return;
  if (!$.isPlainObject(options)) options = { data: options };
  window.location = options.data;
};

window.restoreMicroworld = restoreMicroworld;
window.getSavedWorldsList = getSavedWorldsList;
window.getSaveMicroworld = getSaveMicroworld;
window.saveMicrowold = saveMicrowold;
window.downloadDataURI = downloadDataURI;

// ─── UI ───────────────────────────────────────────────────────────────────────

window.currentworldFrameSelector = '#stageFrame';
window.currentworldHeigth = 350;

function isTimeVisible() {
  const el = document.getElementById('isTimeVisible');
  return el ? el.checked : false;
}

let _totalSteps = 0;

function setStepsLabel(steps) {
  _totalSteps = steps;
  const el = document.getElementById('stepsText');
  if (el) el.textContent = 'passo ' + steps + ' de ' + steps + ' passos';
}

function setCurrentStepLabel(current) {
  const el = document.getElementById('stepsText');
  if (el) el.textContent = 'passo ' + current + ' de ' + _totalSteps + ' passos';
}

function _finishExecution(btn, { stopped = false, hadError = false } = {}) {
  const totalSteps = window.currentworld.getTotalTime();
  setStepsLabel(totalSteps);

  const slider = document.getElementById('programTimeSlider');
  if (slider) {
    slider.max = totalSteps;
    slider.min = 1;
    slider.step = 1;
    slider.value = totalSteps;
    slider.disabled = totalSteps === 0;
  }
  // Only update thumbnail after a clean, uninterrupted execution
  if (!stopped && !hadError) {
    setTimeout(() => {
      if (window._onThumbnailCallback) window._onThumbnailCallback();
    }, 100);
  }
  btn?.classList.remove('running');
  btn && (btn.disabled = false);
}

function executeCode() {
  console.log('[Logo] executeCode called');
  const btn = document.getElementById('runButton');
  btn?.classList.add('running');
  btn && (btn.disabled = true);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    try {
      window.currentworld.renderAtEachCommand = true;
      window.currentworld.reset();
      window.currentworld.setTimeVisibleMode(isTimeVisible());
      const code = _getLogoCode();
      console.log('[Logo] código gerado:\n' + code);
      _startWorker(code);
    } catch(e) {
      console.error('executeCode error:', e);
      btn?.classList.remove('running');
      btn && (btn.disabled = false);
    }
  }));
}

function stopExecution() {
  if (_worker) {
    _worker.postMessage({ type: 'stop' });
    // _finishExecution is called when worker responds with 'done'
  }
}

function slideTime() {
  const slider = document.getElementById('programTimeSlider');
  window.currentworld.setPlayTime(slider.value - 1);
  lpHighlighBlockTime(slider.value - 1);
  setCurrentStepLabel(slider.value);
  window.currentworld.refresh();
}

function stepCode() {
  const slider = document.getElementById('programTimeSlider');
  slider.value = parseInt(slider.value) + 1;
  slideTime();
}

function save() {
  document.getElementById('save_modal_save').onclick = modalSave;
  if (window.currentworld.microworldName === '') {
    $('#save_modal').openModal();
  } else {
    saveMicrowold();
  }
}

function modalSave() {
  const name = document.getElementById('microworld_name').value;
  const author = document.getElementById('microworld_author').value;
  if (name !== '') {
    window.currentworld.microworldName = name;
    window.currentworld.microworldAuthor = author;
    saveMicrowold();
    $('#save_modal').closeModal();
  }
}

function load() {
  const list = $('#microworlds_list');
  const worlds = getSavedWorldsList();
  list.empty();

  worlds.forEach((item) => {
    const worldInfo = getSaveMicroworld(item);
    if (worldInfo) {
      list.append(
        `<li class="collection-item">` +
          `<span class="title">${worldInfo.name}</span>` +
          `<p>Autor: ${worldInfo.author}</p>` +
          `<a href="#!" class="secondary-content load-modal-item" data-key="${item}"><i class="material-icons">cloud_download</i></a>` +
          `<a href="#!" class="secondary-content download-modal-item" data-key="${item}"><i class="material-icons">file_download</i></a>` +
          `</li>`
      );
    }
  });

  $('.load-modal-item').click(function () {
    const key = $(this).data('key');
    if (key) {
      const worldInfo = getSaveMicroworld(key);
      if (worldInfo) {
        restoreMicroworld(worldInfo);
        $('#load_modal').closeModal();
        Materialize.toast('Micro-mundo carregado com sucesso', 3000, 'rounded');
        return;
      }
    }
    $('#load_modal').closeModal();
    Materialize.toast('Opsss! Algum problema aconteu lendo seu micro mundo.', 3000, 'rounded');
  });

  $('.download-modal-item').click(function () {
    const key = $(this).data('key');
    if (key) {
      const worldInfo = getSaveMicroworld(key);
      if (worldInfo) {
        const filename = (worldInfo.name || 'Micromundo') + '.mw';
        downloadDataURI($, {
          filename,
          data: 'data:application/octet-stream; charset=utf-16le; base64,' + encodeURIComponent(JSON.stringify(worldInfo)),
        });
      }
    }
  });

  $('#load_modal').openModal();
}


function _initLogoEditor() {
  const runBtn = document.getElementById('runButton');
  console.log('[Logo] _initLogoEditor runButton=', !!runBtn);
  runBtn?.addEventListener('click', executeCode);
  document.getElementById('stopButton')?.addEventListener('click', stopExecution);
  document.getElementById('stepButton')?.addEventListener('click', stepCode);

  const slider = document.getElementById('programTimeSlider');
  if (slider) {
    slider.disabled = true;
    slider.addEventListener('input', slideTime);
  }

  document.getElementById('isTimeVisible')?.addEventListener('click', () => {
    window.currentworld.setTimeVisibleMode(isTimeVisible());
  });

  document.getElementById('save_button')?.addEventListener('click', save);
  document.getElementById('load_button')?.addEventListener('click', load);

  // Inject workspace
  const readOnly = !!window._logoEditorReadOnly;
  window.workspace = Blockly.inject('blocklyDiv', {
    toolbox: readOnly ? undefined : toolbox,
    readOnly,
    media: '/blockly/media/',
    scrollbars: true,
    zoom: readOnly
      ? { controls: false, wheel: true, startScale: 0.65 }
      : { controls: false, wheel: false, startScale: 1.0 },
  });

  setTimeout(() => window.workspace.resize(), 0);
  window.addEventListener('resize', () => window.workspace.resize());

  // Speed slider → update running worker in real time
  document.getElementById('speedSlider')?.addEventListener('input', _onSpeedChange);

  // Init microworld canvas — tamanho = menor dimensão disponível no painel
  const canvasParent = $(window.currentworldFrameSelector);
  const stagePanel   = document.getElementById('stagePanel');
  const toolbarH     = 56 + 38; // stageToolbar + sliderArea (aproximado)
  const availH       = stagePanel ? stagePanel.offsetHeight - toolbarH : canvasParent.width();
  const stageSize    = Math.min(canvasParent.width(), Math.max(availH, 200));
  window.currentworld = new Microworld(
    window.currentworldFrameSelector,
    stageSize,
    stageSize
  );

  // ── Tab switching ──────────────────────────────────────────────────────────
  const tabBlocos     = document.getElementById('tabBlocos');
  const tabLogo       = document.getElementById('tabLogo');
  const blocklyDiv    = document.getElementById('blocklyDiv');
  const logoTextPanel = document.getElementById('logoTextPanel');
  const logoCodeEl    = _getLogoTextarea();

  function _switchToLogo() {
    if (_activeTab === 'logo') return;
    const code = generateDisplayCode();
    if (logoCodeEl) { logoCodeEl.value = code; logoCodeEl.dispatchEvent(new Event('input')); }
    _activeTab = 'logo';
    tabLogo.classList.add('active');
    tabBlocos.classList.remove('active');
    blocklyDiv.style.display    = 'none';
    logoTextPanel.classList.add('active');
  }

  function _switchToBlocos() {
    if (_activeTab === 'blocos') return;
    const code = logoCodeEl?.value ?? '';
    try {
      const state = logoToBlocklyState(code);
      window.workspace.clear();
      Blockly.Events.disable();
      try {
        Blockly.serialization.workspaces.load(state, window.workspace, { recordUndo: false });
      } finally {
        Blockly.Events.enable();
      }
      window.workspace.render();
    } catch (e) {
      alert('Erro ao converter Logo para Blocos:\n' + e.message);
      return;
    }
    _activeTab = 'blocos';
    tabBlocos.classList.add('active');
    tabLogo.classList.remove('active');
    blocklyDiv.style.display = '';
    logoTextPanel.classList.remove('active');
    if (window._onChangedCallback) {
      window._onChangedCallback(window.LogoEditor.getProjectState());
    }
  }

  tabLogo?.addEventListener('click', _switchToLogo);
  tabBlocos?.addEventListener('click', _switchToBlocos);

  // Autosave ao editar o código Logo diretamente
  logoCodeEl?.addEventListener('input', () => {
    if (window._onChangedCallback) {
      window._onChangedCallback(window.LogoEditor.getProjectState());
    }
  });

  // API para o Rails (editor_controller.js)
  window.LogoEditor = {
    getProjectState() {
      const state = Blockly.serialization.workspaces.save(window.workspace);
      state.logoCode     = logoCodeEl?.value ?? '';
      state.activeTab    = _activeTab;
      return state;
    },
    loadProjectState(state) {
      try {
        const obj = typeof state === 'string' ? JSON.parse(state) : state;
        window.workspace.clear();
        Blockly.Events.disable();
        try {
          Blockly.serialization.workspaces.load(obj, window.workspace, { recordUndo: false });
        } finally {
          Blockly.Events.enable();
        }
        window.workspace.render();
        // Restaura código Logo salvo
        if (logoCodeEl && obj.logoCode) {
          logoCodeEl.value = obj.logoCode;
          logoCodeEl.dispatchEvent(new Event('input'));
        }
        // Restaura aba ativa
        if (obj.activeTab === 'logo') _switchToLogo();
      } catch (e) {
        console.error('LogoEditor.loadProjectState:', e, e.stack);
      }
    },
    onChanged(callback) {
      window._onChangedCallback = callback;
    },
    onExecuted(callback) {
      window._onThumbnailCallback = callback;
    },
    getThumbnailSVG() {
      const canvas = document.getElementById('microworldCavnas');
      return canvas ? canvas.toDataURL('image/png') : null;
    }
  };

  // Dispara onChanged a cada alteração no workspace
  window.workspace.addChangeListener((e) => {
    if (!window._onChangedCallback) return;
    if (e.isUiEvent) return;
    window._onChangedCallback(window.LogoEditor.getProjectState());
  });

  // Notifica quem já registrou callback antes da inicialização
  if (window._logoEditorReadyCallback) {
    window._logoEditorReadyCallback();
    window._logoEditorReadyCallback = null;
  }
  window._logoEditorInitialized = true;
}

// Inicializa assim que o DOM estiver pronto, compatível com Turbo Drive
function _tryInit() {
  const blocklyDiv = document.getElementById('blocklyDiv');
  console.log('[Logo] _tryInit blocklyDiv=', !!blocklyDiv, 'bound=', blocklyDiv?._logoEditorBound);
  if (!blocklyDiv) return;
  if (blocklyDiv._logoEditorBound) return;
  blocklyDiv._logoEditorBound = true;
  _initLogoEditor();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _tryInit);
} else {
  setTimeout(_tryInit, 0);
}
document.addEventListener('turbo:load', _tryInit);

window.addEventListener('beforeunload', () => {
  if (_worker) { _worker.terminate(); _worker = null; }
});

