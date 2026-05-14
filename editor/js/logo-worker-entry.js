'use strict';
import { Lexer }     from './logo-interpreter/lexer.js';
import { Parser }    from './logo-interpreter/parser.js';
import { Evaluator } from './logo-interpreter/evaluator.js';

// ── Turtle state mirror ───────────────────────────────────────────────────────
const ts = {
  x: 0, y: 0, heading: 0,
  penDown: true, color: 0, width: 1,
  visible: true, turtleMode: 'window',
  shade: 50,
};

function resetState() {
  Object.assign(ts, { x: 0, y: 0, heading: 0, penDown: true, color: 0,
    width: 1, visible: true, turtleMode: 'window', shade: 50 });
}

// ── Command dispatch — maps Logo command names to CT calls + state updates ────
function dispatch(name, args) {
  const n = normalise(name);
  switch (n) {
    case 'parafrente': {
      const s = Number(args[0]) || 0;
      const hr = ts.heading * Math.PI / 180;
      ts.x += s * Math.sin(hr); ts.y += s * Math.cos(hr);
      self.postMessage({ type: 'cmd', name: 'moveCT', args: [s] }); break;
    }
    case 'paratras': {
      const s = Number(args[0]) || 0;
      const hr = ts.heading * Math.PI / 180;
      ts.x -= s * Math.sin(hr); ts.y -= s * Math.cos(hr);
      self.postMessage({ type: 'cmd', name: 'moveCT', args: [-s] }); break;
    }
    case 'viradireita': {
      const d = Number(args[0]) || 0;
      ts.heading = ((ts.heading + d) % 360 + 360) % 360;
      self.postMessage({ type: 'cmd', name: 'turnCT', args: [d] }); break;
    }
    case 'viraesquerda': {
      const d = Number(args[0]) || 0;
      ts.heading = ((ts.heading - d) % 360 + 360) % 360;
      self.postMessage({ type: 'cmd', name: 'turnCT', args: [-d] }); break;
    }
    case 'vaipara': {
      // vaipara X Y  (both axes)
      ts.x = Number(args[0]) || 0;
      ts.y = Number(args[1]) || 0;
      self.postMessage({ type: 'cmd', name: 'setpositionCT', args: [ts.x, ts.y] }); break;
    }
    case 'vaipara_x': {
      ts.x = Number(args[0]) || 0;
      self.postMessage({ type: 'cmd', name: 'setpositionCT', args: [ts.x, ts.y] }); break;
    }
    case 'vaipara_y': {
      ts.y = Number(args[0]) || 0;
      self.postMessage({ type: 'cmd', name: 'setpositionCT', args: [ts.x, ts.y] }); break;
    }
    case 'mudadirecao': {
      ts.heading = Number(args[0]) || 0;
      self.postMessage({ type: 'cmd', name: 'setheadingCT', args }); break;
    }
    case 'casa':
      ts.x = 0; ts.y = 0; ts.heading = 0;
      self.postMessage({ type: 'cmd', name: 'homeCT', args: [] }); break;
    case 'mostra':
      ts.visible = true;
      self.postMessage({ type: 'cmd', name: 'showCT', args: [] }); break;
    case 'esconde':
      ts.visible = false;
      self.postMessage({ type: 'cmd', name: 'hideCT', args: [] }); break;
    case 'arco':
      self.postMessage({ type: 'cmd', name: 'arcCT', args }); break;
    case 'aponta':
      self.postMessage({ type: 'cmd', name: 'towardsCT', args }); break;
    case 'mudacor':
      ts.color = args[0];
      self.postMessage({ type: 'cmd', name: 'setcolorCT', args }); break;
    case 'mudatamanho':
      ts.width = Number(args[0]);
      self.postMessage({ type: 'cmd', name: 'setwidthCT', args }); break;
    case 'levantacaneta':
      ts.penDown = false;
      self.postMessage({ type: 'cmd', name: 'penupCT', args: [] }); break;
    case 'abaixacaneta':
      ts.penDown = true;
      self.postMessage({ type: 'cmd', name: 'pendownCT', args: [] }); break;
    case 'preenche':
      self.postMessage({ type: 'cmd', name: 'fillCT', args: [] }); break;
    case 'limpa':
      self.postMessage({ type: 'cmd', name: 'clearCT', args: [] }); break;
    case 'limpatela':
      resetState();
      self.postMessage({ type: 'cmd', name: 'clearscreenCT', args: [] }); break;
    case 'wrap':
      ts.turtleMode = 'wrap';
      self.postMessage({ type: 'cmd', name: 'setturtlemodeCT', args: ['wrap'] }); break;
    case 'fence':
      ts.turtleMode = 'fence';
      self.postMessage({ type: 'cmd', name: 'setturtlemodeCT', args: ['fence'] }); break;
    case 'window':
      ts.turtleMode = 'window';
      self.postMessage({ type: 'cmd', name: 'setturtlemodeCT', args: ['window'] }); break;
    case 'mudatom':
      ts.shade = Math.max(0, Math.min(99, Number(args[0])));
      self.postMessage({ type: 'cmd', name: 'setshadeCT', args: [ts.shade] });
      break;
    default:
      console.warn('[logo-worker] comando desconhecido:', name);
  }
}

function normalise(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function queryState(key) {
  switch (key) {
    case 'getx':       return ts.x;
    case 'gety':       return ts.y;
    case 'getheading': return ts.heading;
    case 'getcolor':   return ts.color;
    case 'getwidth':   return ts.width;
    case 'ispendown':  return ts.penDown;
    case 'getshade':   return ts.shade;
    default:           return 0;
  }
}

// ── Worker pacing state ───────────────────────────────────────────────────────
let _gen           = null;   // active generator
let _stopped       = false;
let _waitingForAck = false;

// ── Worker message handler ────────────────────────────────────────────────────
self.onmessage = function(e) {
  const { type } = e.data;
  if (type === 'run') {
    _stopped       = false;
    _waitingForAck = false;
    _gen           = null;
    runLogo(e.data.code);
  } else if (type === 'stop') {
    _stopped = true;
    _gen     = null;
  } else if (type === 'ack') {
    if (_waitingForAck) {
      _waitingForAck = false;
      driveGenerator();
    }
  }
};

// ── Execution ─────────────────────────────────────────────────────────────────
function runLogo(source) {
  resetState();

  let ast;
  try {
    const tokens = new Lexer(source).tokenize();
    ast          = new Parser(tokens).parse();
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
    self.postMessage({ type: 'done',  stopped: false });
    return;
  }

  const ev = new Evaluator();
  ev._query    = queryState;
  ev._dispatch = dispatch;
  _gen = ev.run(ast);

  driveGenerator();
}

// Drive the generator one step at a time.
// We advance until we hit a 'highlight' event, then pause and wait for ack.
// 'cmd' events are forwarded to the main thread immediately (no pause needed).
function driveGenerator() {
  if (!_gen || _stopped) {
    self.postMessage({ type: 'done', stopped: _stopped });
    _gen = null;
    return;
  }

  // Process events in a tight loop — yield back to the event loop only on
  // 'highlight' (so the main thread can render and send ack).
  function step() {
    try {
      while (true) {
        if (_stopped) {
          self.postMessage({ type: 'done', stopped: true });
          _gen = null;
          return;
        }

        const { value: event, done } = _gen.next();

        if (done) {
          self.postMessage({ type: 'done', stopped: false });
          _gen = null;
          return;
        }

        if (event.type === 'cmd') {
          dispatch(event.name, event.args || []);
          // Continue immediately — commands don't need ack
          continue;
        }

        if (event.type === 'highlight') {
          self.postMessage({ type: 'highlight', blockId: event.blockId });
          // Pause and wait for ack from main thread
          _waitingForAck = true;
          return;
        }
      }
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
      self.postMessage({ type: 'done',  stopped: false });
      _gen = null;
    }
  }

  // Use setTimeout(0) to yield back to the event loop so stop messages can
  // be processed between batches of synchronous steps.
  setTimeout(step, 0);
}
