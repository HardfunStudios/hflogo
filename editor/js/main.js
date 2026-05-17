import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { logoGenerator }     from './logo-generator.js';
import { logoToBlocklyState } from './logo-to-blockly.js';
import { mountHighlighter }   from './logo-highlight.js';
import {
  COLOR_TABLE, COLOR_TURTLE, COLOR_CONTROL, COLOR_NUMBERS,
  COLOR_PEN, COLOR_SCREEN, BLOCKLY_BASE_OPTIONS,
} from './turtle-blocks-defs.js';

// ── Turtle_Msg alias (kept for reference by toolbox; blocks-defs exports it) ──
const Turtle_Msg = {
  GREEN_FLAG: 'In\u00edcio',
  STEPS: 'passos',
  FORWARD: 'para frente',
  BACKWARD: 'para trás',
  LEFT: 'vira esquerda',
  RIGHT: 'vira direita',
  SET_POS: 'vai para posição',
  SET_POSX: 'vai para x',
  SET_POSY: 'vai para y',
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
// (block definitions, locale, color table, and FieldColorSwatch are in turtle-blocks-defs.js)

// ─── Toolbox definition ───────────────────────────────────────────────────────
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
        { kind: 'block', type: 'turtle_distance', inputs: { x: { shadow: { type: 'math_number', fields: { NUM: 0 } } }, y: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'turtle_direction_to', inputs: { x: { shadow: { type: 'math_number', fields: { NUM: 0 } } }, y: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
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
        { kind: 'block', type: 'pen_setshade', inputs: { shade: { shadow: { type: 'math_number', fields: { NUM: 50 } } } } },
        { kind: 'block', type: 'pen_getshade' },
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

// Code to send to the worker: always instrumented so time slider records steps
function _getLogoCode() {
  if (_activeTab === 'logo') {
    const raw = document.getElementById('logoCodeEditor')?.value ?? '';
    return _injectLineMarkers(raw);
  }
  return generateCode();
}

function _getLogoTextarea() { return document.getElementById('logoCodeEditor'); }

function getExecutionDelay() {
  const slider = document.getElementById('speedSlider');
  if (!slider) return 0;
  const map = { 1: 500, 2: 375, 3: 250, 4: 125, 5: 0, 6: 0 };
  return map[parseInt(slider.value)] ?? 0;
}

// ── Worker management ─────────────────────────────────────────────────────────

function _getOrCreateErrorBanner() {
  let banner = document.getElementById('errorBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'errorBanner';
    banner.style.cssText = 'display:none;background:#c62828;color:#fff;font-size:13px;padding:6px 12px 6px 12px;font-family:monospace;white-space:pre-wrap;word-break:break-word;position:fixed;bottom:0;left:0;right:0;z-index:9999;display:none;align-items:flex-start;gap:8px;';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'margin-left:auto;background:none;border:none;color:#fff;font-size:16px;cursor:pointer;padding:0 0 0 8px;line-height:1;flex-shrink:0;';
    closeBtn.addEventListener('click', _clearError);
    banner._msgSpan = document.createElement('span');
    banner._msgSpan.style.flex = '1';
    banner.appendChild(banner._msgSpan);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);
  }
  return banner;
}

function _showError(msg) {
  const banner = _getOrCreateErrorBanner();
  const msgEl = banner._msgSpan ?? document.getElementById('errorBannerMsg') ?? banner;
  msgEl.textContent = '⚠ ' + msg;
  banner.style.display = 'flex';
}

function _clearError() {
  const banner = document.getElementById('errorBanner');
  if (banner) banner.style.display = 'none';
}

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
    case 'setshadeCT':      setshadeCT(args[0]); break;
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
      // Always record for time slider regardless of speed
      window.currentworld.render();
      time_block_mapping.push(msg.blockId);

      if (_shouldHighlight()) {
        // Visual highlight: block or Logo line
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
          requestAnimationFrame(() => { if (_worker) _worker.postMessage({ type: 'ack' }); });
        }
      } else {
        // Speed 6: no visual update, ack immediately
        if (_worker) _worker.postMessage({ type: 'ack' });
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
      _showError(msg.message);
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
    _showError(`Erro interno: ${e.message}`);
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
    slider.max   = Math.max(1, totalSteps);
    slider.min   = 1;
    slider.step  = 1;
    slider.value = Math.max(1, totalSteps);
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
    _clearError();
    try {
      window.currentworld.renderAtEachCommand = true;
      window.currentworld.reset();
      window.currentworld.setTimeVisibleMode(isTimeVisible());
      const code = _getLogoCode();
      console.log('[Logo] código gerado:\n' + code);
      _startWorker(code);
    } catch(e) {
      console.error('executeCode error:', e);
      _showError(e.message ?? String(e));
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

  document.getElementById('isTimeVisible')?.addEventListener('change', () => {
    if (window.currentworld) window.currentworld.setTimeVisibleMode(isTimeVisible());
  });

  document.getElementById('save_button')?.addEventListener('click', save);
  document.getElementById('load_button')?.addEventListener('click', load);

  // Inject workspace
  const readOnly = !!window._logoEditorReadOnly;
  window.workspace = Blockly.inject('blocklyDiv', {
    ...BLOCKLY_BASE_OPTIONS,
    toolbox:  readOnly ? undefined : toolbox,
    readOnly,
    zoom: {
      ...BLOCKLY_BASE_OPTIONS.zoom,
      startScale: readOnly ? 0.65 : 1.0,
    },
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
  window.currentworld.setTimeVisibleMode(isTimeVisible());

  // ── Tab switching ──────────────────────────────────────────────────────────
  const tabBlocos     = document.getElementById('tabBlocos');
  const tabLogo       = document.getElementById('tabLogo');
  const blocklyDiv    = document.getElementById('blocklyDiv');
  const logoTextPanel = document.getElementById('logoTextPanel');
  const logoCodeEl    = _getLogoTextarea();
  if (logoCodeEl) mountHighlighter(logoCodeEl);

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

  const syntaxErrorEl = document.getElementById('logoSyntaxError');

  function _showSyntaxError(msg) {
    _showError(msg);
    if (syntaxErrorEl) {
      syntaxErrorEl.textContent = '⚠ ' + msg;
      syntaxErrorEl.title = msg;
      syntaxErrorEl.classList.add('visible');
    }
  }

  function _clearSyntaxError() {
    _clearError();
    if (syntaxErrorEl) syntaxErrorEl.classList.remove('visible');
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
      _showSyntaxError(e.message);
      return;
    }
    _clearSyntaxError();
    _activeTab = 'blocos';
    tabBlocos.classList.add('active');
    tabLogo.classList.remove('active');
    blocklyDiv.style.display = '';
    logoTextPanel.classList.remove('active');
    if (window._onChangedCallback) {
      window._onChangedCallback(window.LogoEditor.getProjectState());
    }
  }

  logoCodeEl?.addEventListener('input', _clearSyntaxError);

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
        // Restaura aba ativa primeiro (_switchToLogo regenera o textarea dos blocos)
        if (obj.activeTab === 'logo') _switchToLogo();
        // Depois sobrescreve com o código Logo salvo (tem precedência sobre blocos)
        if (logoCodeEl && obj.logoCode != null) {
          logoCodeEl.value = obj.logoCode;
          logoCodeEl.dispatchEvent(new Event('input'));
        }
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

