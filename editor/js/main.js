import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';
import * as ptBR from 'blockly/msg/pt-br';
import { FieldAngle } from '@blockly/field-angle';

Blockly.setLocale(ptBR);

// Custom turtle messages (pt-br)
const Turtle_Msg = {
  GREEN_FLAG: '\u2691 Bandeira Verde',
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

// ─── Block definitions ────────────────────────────────────────────────────────

const hue_category_pen = 230;

Blockly.Blocks['controls_start'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.GREEN_FLAG);
    this.setNextStatement(true);
    this.setColour(120);
  },
};
javascriptGenerator.forBlock['controls_start'] = () => '';

Blockly.Blocks['turtle_forward'] = {
  init() {
    this.appendValueInput('steps').setCheck('Number').appendField(Turtle_Msg.FORWARD);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
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
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_back'] = (block, gen) => {
  const steps = gen.valueToCode(block, 'steps', Order.ATOMIC);
  return `moveCT(-${steps});\n`;
};

Blockly.Blocks['turtle_right'] = {
  init() {
    this.appendDummyInput()
      .appendField(Turtle_Msg.RIGHT)
      .appendField(new FieldAngle('90'), 'degrees');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_right'] = (block) =>
  `turnCT(${block.getFieldValue('degrees')});\n`;

Blockly.Blocks['turtle_left'] = {
  init() {
    this.appendDummyInput()
      .appendField(Turtle_Msg.LEFT)
      .appendField(new FieldAngle('90'), 'degrees');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_left'] = (block) =>
  `turnCT(-${block.getFieldValue('degrees')});\n`;

Blockly.Blocks['turtle_setpos'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SET_POS);
    this.appendValueInput('x').setCheck('Number').appendField('x');
    this.appendValueInput('y').setCheck('Number').appendField('y');
    this.setPreviousStatement(true);
    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setColour(210);
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
    this.setColour(210);
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
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_setposy'] = (block, gen) => {
  const y = gen.valueToCode(block, 'y', Order.ATOMIC);
  return `setpositionCT(undefined,${y});\n`;
};

Blockly.Blocks['turtle_setheading'] = {
  init() {
    this.appendDummyInput()
      .appendField(Turtle_Msg.SET_HEADING)
      .appendField(new FieldAngle('90'), 'degrees');
    this.setPreviousStatement(true);
    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_setheading'] = (block) =>
  `setheadingCT(${block.getFieldValue('degrees')});\n`;

Blockly.Blocks['turtle_home'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HOME);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_home'] = () => 'homeCT();\n';

Blockly.Blocks['turtle_show'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.SHOW_TURTLE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_show'] = () => 'showCT();\n';

Blockly.Blocks['turtle_hide'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HIDE_TURTLE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_hide'] = () => 'hideCT();\n';

Blockly.Blocks['screen_clean'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.CLEAN);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
  },
};
javascriptGenerator.forBlock['screen_clean'] = () => 'clearCT();\n';

Blockly.Blocks['screen_clearscreen'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.CLEAR_SCREEN);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
  },
};
javascriptGenerator.forBlock['screen_clearscreen'] = () => 'clearscreenCT();\n';

Blockly.Blocks['screen_wrap'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.WRAP);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
  },
};
javascriptGenerator.forBlock['screen_wrap'] = () => 'setturtlemodeCT("wrap");\n';

Blockly.Blocks['screen_fence'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.FENCE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
  },
};
javascriptGenerator.forBlock['screen_fence'] = () => 'setturtlemodeCT("fence");\n';

Blockly.Blocks['screen_window'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.WINDOW);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
  },
};
javascriptGenerator.forBlock['screen_window'] = () => 'setturtlemodeCT("window");\n';

Blockly.Blocks['turtle_arc'] = {
  init() {
    this.appendDummyInput()
      .appendField(Turtle_Msg.ARC)
      .appendField(Turtle_Msg.ANGLE)
      .appendField(new FieldAngle('90'), 'angle');
    this.appendValueInput('radius').setCheck('Number').appendField('radius');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_arc'] = (block, gen) => {
  const angle = block.getFieldValue('angle');
  const radius = gen.valueToCode(block, 'radius', Order.ATOMIC);
  return `arcCT(${angle},${radius});\n`;
};

Blockly.Blocks['turtle_xcor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.X_COORDINATE);
    this.setOutput(true, 'Number');
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_xcor'] = () => ['getxyCT()[0]', Order.ATOMIC];

Blockly.Blocks['turtle_ycor'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.Y_COORDINATE);
    this.setOutput(true, 'Number');
    this.setColour(210);
  },
};
javascriptGenerator.forBlock['turtle_ycor'] = () => ['getxyCT()[1]', Order.ATOMIC];

Blockly.Blocks['turtle_heading'] = {
  init() {
    this.appendDummyInput().appendField(Turtle_Msg.HEADING);
    this.setOutput(true, 'Number');
    this.setColour(210);
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
    this.setColour(210);
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
  const color = gen.valueToCode(block, 'color', Order.ATOMIC);
  return `setcolorCT(${color});\n`;
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
    this.setOutput(true, 'Boolean');
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
      contents: [
        { kind: 'block', type: 'turtle_forward', inputs: { steps: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'turtle_back', inputs: { steps: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'turtle_right' },
        { kind: 'block', type: 'turtle_left' },
        { kind: 'block', type: 'turtle_home' },
        { kind: 'block', type: 'turtle_arc', inputs: { radius: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'turtle_setpos' },
        { kind: 'block', type: 'turtle_setposx' },
        { kind: 'block', type: 'turtle_xcor' },
        { kind: 'block', type: 'turtle_setposy' },
        { kind: 'block', type: 'turtle_ycor' },
        { kind: 'block', type: 'turtle_setheading' },
        { kind: 'block', type: 'turtle_heading' },
        { kind: 'block', type: 'turtle_show' },
        { kind: 'block', type: 'turtle_hide' },
        { kind: 'block', type: 'turtle_towards' },
      ],
    },
    {
      kind: 'category',
      name: 'Controle',
      contents: [
        { kind: 'block', type: 'controls_start' },
        { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
      ],
    },
    {
      kind: 'category',
      name: 'Números',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_trig' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'math_change', inputs: { DELTA: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
        { kind: 'block', type: 'math_modulo' },
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
      contents: [
        { kind: 'block', type: 'pen_setpencolor', inputs: { color: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
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
      contents: [
        { kind: 'block', type: 'screen_clean' },
        { kind: 'block', type: 'screen_clearscreen' },
      ],
    },
    { kind: 'category', name: 'Variáveis', custom: 'VARIABLE' },
    { kind: 'category', name: 'Ensinar', custom: 'PROCEDURE' },
  ],
};

// ─── LP code execution ────────────────────────────────────────────────────────

let time_block_mapping = [];

function highlightBlock(id) {
  window.currentworld.render();
  time_block_mapping.push(id);
}

function lpHighlighBlockTime(time) {
  const block_id = time_block_mapping[time];
  window.workspace.highlightBlock(block_id);
}

function lpInitApi(interpreter, scope) {
  const addFn = (name, fn) =>
    interpreter.setProperty(scope, name, interpreter.createNativeFunction(fn));

  addFn('alert', (text) => interpreter.createPrimitive(alert(text ? text.toString() : '')));
  addFn('prompt', (text) => interpreter.createPrimitive(prompt(text ? text.toString() : '')));
  addFn('highlightBlock', (id) => interpreter.createPrimitive(highlightBlock(id ? id.toString() : '')));
  addFn('moveCT', (s) => interpreter.createPrimitive(moveCT(s)));
  addFn('turnCT', (d) => interpreter.createPrimitive(turnCT(d)));
  addFn('setpenmodeCT', (v) => interpreter.createPrimitive(setpenmodeCT(v ? v.toString() : '')));
  addFn('setturtlemodeCT', (v) => interpreter.createPrimitive(setturtlemodeCT(v ? v.toString() : '')));
  addFn('setcolorCT', (v) => interpreter.createPrimitive(setcolorCT(v)));
  addFn('setwidthCT', (v) => interpreter.createPrimitive(setwidthCT(v)));
  addFn('setfontsizeCT', (v) => interpreter.createPrimitive(setfontsizeCT(v)));
  addFn('setheadingCT', (v) => interpreter.createPrimitive(setheadingCT(v)));
  addFn('setstateCT', (v) => interpreter.createPrimitive(setstateCT(v)));
  addFn('setpositionCT', (x, y) => interpreter.createPrimitive(setpositionCT(x, y)));
  addFn('towardsCT', (x, y) => interpreter.createPrimitive(towardsCT(x, y)));
  addFn('drawtextCT', (x, y) => interpreter.createPrimitive(drawtextCT(x, y)));
  addFn('arcCT', (angle, radius) => interpreter.createPrimitive(arcCT(angle, radius)));
  addFn('penupCT', () => interpreter.createPrimitive(penupCT()));
  addFn('pendownCT', () => interpreter.createPrimitive(pendownCT()));
  addFn('getpenmodeCT', () => interpreter.createPrimitive(getpenmodeCT()));
  addFn('getturtlemodeCT', () => interpreter.createPrimitive(getturtlemodeCT()));
  addFn('ispendownCT', () => interpreter.createPrimitive(ispendownCT()));
  addFn('getcolorCT', () => interpreter.createPrimitive(getcolorCT()));
  addFn('getwidthCT', () => interpreter.createPrimitive(getwidthCT()));
  addFn('getfontsizeCT', () => interpreter.createPrimitive(getfontsizeCT()));
  addFn('clearscreenCT', () => interpreter.createPrimitive(clearscreenCT()));
  addFn('homeCT', () => interpreter.createPrimitive(homeCT()));
  addFn('clearCT', () => interpreter.createPrimitive(clearCT()));
  addFn('showCT', () => interpreter.createPrimitive(showCT()));
  addFn('hideCT', () => interpreter.createPrimitive(hideCT()));
  addFn('isturtlevisibleCT', () => interpreter.createPrimitive(isturtlevisibleCT()));
  addFn('getheadingCT', () => interpreter.createPrimitive(getheadingCT()));
  addFn('getxyCT', () => interpreter.createPrimitive(getxyCT()));
  addFn('fillCT', () => interpreter.createPrimitive(fillCT()));
  addFn('getstateCT', () => interpreter.createPrimitive(getstateCT()));
}

function lpParseCode() {
  javascriptGenerator.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
  javascriptGenerator.addReservedWords('highlightBlock');
  const code = javascriptGenerator.workspaceToCode(window.workspace);

  window.myInterpreter = new Interpreter(code, lpInitApi);

  document.getElementById('runButton').disabled = '';
  window.workspace.highlightBlock(null);
}

function lpRunCode() {
  time_block_mapping = [];
  lpParseCode();
  window.myInterpreter.run();
}

window.lpHighlighBlockTime = lpHighlighBlockTime;
window.lpParseCode = lpParseCode;
window.lpRunCode = lpRunCode;

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

function setStepsLabel(steps) {
  const el = document.getElementById('stepsText');
  if (el) el.textContent = steps.toString() + ' passo' + (steps > 1 ? 's' : '');
}

function setCurrentStepLabel(steps) {
  const el = document.getElementById('stepsText');
  if (el) el.textContent = 'passo ' + steps.toString();
}

function executeCode() {
  try {
  window.currentworld.renderAtEachCommand = true;
  window.currentworld.reset();
  window.currentworld.setTimeVisibleMode(isTimeVisible());

  lpRunCode();
  const runFrames = window.currentworld.getTotalTime();
  // The last entry in canvasStoryStack is always an empty canvas created
  // by the final render() call. The last frame with content is at index
  // runFrames-2, so we use that for both display and the slider max.
  const lastValidFrame = Math.max(0, runFrames - 2);
  window.currentworld.setPlayTime(lastValidFrame);
  setStepsLabel(lastValidFrame + 1);

  const slider = document.getElementById('programTimeSlider');
  slider.max = lastValidFrame + 1;
  slider.min = 1;
  slider.step = 1;
  slider.value = lastValidFrame + 1;
  slider.disabled = false;
  // Envia thumbnail após execução
  setTimeout(() => {
    if (window._onThumbnailCallback) window._onThumbnailCallback();
  }, 100);
  } catch(e) { console.error('executeCode error:', e); alert('Erro ao executar: ' + e.message); }
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
  document.getElementById('runButton')?.addEventListener('click', executeCode);
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

  if (!readOnly) window.workspace.addChangeListener(lpParseCode);
  setTimeout(() => window.workspace.resize(), 0);
  window.addEventListener('resize', () => window.workspace.resize());

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

  // API para o Rails (editor_controller.js)
  window.LogoEditor = {
    getProjectState() {
      return Blockly.serialization.workspaces.save(window.workspace);
    },
    loadProjectState(state) {
      try {
        window.workspace.clear();
        Blockly.serialization.workspaces.load(state, window.workspace);
      } catch (e) {
        console.warn('LogoEditor.loadProjectState:', e);
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
    if (window._onChangedCallback &&
        e.type !== Blockly.Events.UI &&
        e.type !== Blockly.Events.VIEWPORT_CHANGE) {
      window._onChangedCallback(window.LogoEditor.getProjectState());
    }
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
  if (!document.getElementById('blocklyDiv')) return;
  if (window._logoEditorInitialized) return; // já inicializado
  _initLogoEditor();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _tryInit);
} else {
  setTimeout(_tryInit, 0);
}

