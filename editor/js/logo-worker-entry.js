'use strict';
// Entry point for the Logo worker (bundled by Vite via logo-worker.config.js).
// This replaces the old acorn_interpreter-based worker.

import { Lexer }     from './logo-interpreter/lexer.js';
import { Parser }    from './logo-interpreter/parser.js';
import { Evaluator } from './logo-interpreter/evaluator.js';

// ── Turtle state mirror (kept in sync with evaluator commands) ────────────────
const ts = {
  x: 0, y: 0, heading: 0,
  penDown: true, color: 0, width: 1,
  visible: true, penMode: 'paint', turtleMode: 'window', fontSize: 12,
};

function resetState() {
  Object.assign(ts, { x: 0, y: 0, heading: 0, penDown: true, color: 0,
    width: 1, visible: true, penMode: 'paint', turtleMode: 'window', fontSize: 12 });
}

// ── Pacing state ──────────────────────────────────────────────────────────────
let stopped         = false;
let resumeAfterAck  = null;

// ── Worker message handling ───────────────────────────────────────────────────
self.onmessage = function(e) {
  const { type } = e.data;
  if (type === 'run') {
    stopped = false;
    runLogo(e.data.code);
  } else if (type === 'stop') {
    stopped = true;
    resumeAfterAck = null;
  } else if (type === 'ack') {
    if (resumeAfterAck) {
      const fn = resumeAfterAck;
      resumeAfterAck = null;
      fn();
    }
  }
};

// ── Command dispatch ──────────────────────────────────────────────────────────
// Maps Logo command names (lowercase, no accents) to CT calls + state updates.

const COMMAND_MAP = {
  parafrente:    (args) => { const s = args[0]; const hr = ts.heading * Math.PI / 180; ts.x += s * Math.sin(hr); ts.y += s * Math.cos(hr); emit('moveCT', [s]); },
  paratras:      (args) => { const s = args[0]; const hr = ts.heading * Math.PI / 180; ts.x -= s * Math.sin(hr); ts.y -= s * Math.cos(hr); emit('moveCT', [-s]); },
  viradireita:   (args) => { ts.heading = ((ts.heading + args[0]) % 360 + 360) % 360; emit('turnCT',  [args[0]]); },
  viraesquerda:  (args) => { ts.heading = ((ts.heading - args[0]) % 360 + 360) % 360; emit('turnCT',  [-args[0]]); },
  'vaipara':     (args) => {
    // vaipara x X y Y  → args = [X, Y]
    // vaipara x X      → args = [X]   (only x)
    // vaipara y Y      → handled by vaipara_y below
    if (args[0] !== undefined) ts.x = args[0];
    if (args[1] !== undefined) ts.y = args[1];
    emit('setpositionCT', [ts.x, ts.y]);
  },
  vaipara_x:     (args) => { ts.x = args[0]; emit('setpositionCT', [ts.x, ts.y]); },
  vaipara_y:     (args) => { ts.y = args[0]; emit('setpositionCT', [ts.x, ts.y]); },
  mudadireção:   (args) => { ts.heading = args[0]; emit('setheadingCT', args); },
  'mudadireção': (args) => { ts.heading = args[0]; emit('setheadingCT', args); },
  mudadirecao:   (args) => { ts.heading = args[0]; emit('setheadingCT', args); },
  casa:          ()     => { ts.x = 0; ts.y = 0; ts.heading = 0; emit('homeCT', []); },
  mostra:        ()     => { ts.visible = true;  emit('showCT',  []); },
  esconde:       ()     => { ts.visible = false; emit('hideCT',  []); },
  arco:          (args) => emit('arcCT', args),
  aponta:        (args) => emit('towardsCT', args),

  // Pen
  mudacor:       (args) => { ts.color = args[0]; emit('setcolorCT',  args); },
  mudatamanho:   (args) => { ts.width = args[0]; emit('setwidthCT',  args); },
  levantacaneta: ()     => { ts.penDown = false; emit('penupCT',   []); },
  abaixacaneta:  ()     => { ts.penDown = true;  emit('pendownCT', []); },
  preenche:      ()     => emit('fillCT', []),

  // Screen
  limpa:         ()     => emit('clearCT', []),
  limpatela:     ()     => { resetState(); emit('clearscreenCT', []); },
  wrap:          ()     => { ts.turtleMode = 'wrap';   emit('setturtlemodeCT', ['wrap']);   },
  fence:         ()     => { ts.turtleMode = 'fence';  emit('setturtlemodeCT', ['fence']);  },
  window:        ()     => { ts.turtleMode = 'window'; emit('setturtlemodeCT', ['window']); },
};

function normalise(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function dispatchCommand(name, args) {
  // Block highlight injected by the Logo generator
  if (name === '__hl__') {
    const blockId = String(args[0] ?? '');
    self.postMessage({ type: 'highlight', blockId });
    commandFired = true;
    return;
  }
  const fn = COMMAND_MAP[name] || COMMAND_MAP[normalise(name)];
  if (fn) { fn(args); return; }
  // unknown command — send as-is (forward compatibility)
  emit(name, args);
}

// ── Queries (synchronous getters) ─────────────────────────────────────────────
// The evaluator calls onCommand('__query__', ['getx']) etc.
// In the worker these are answered from the local state mirror.

function handleQuery(args) {
  switch (args[0]) {
    case 'getx':       return ts.x;
    case 'gety':       return ts.y;
    case 'getheading': return ts.heading;
    case 'getcolor':   return ts.color;
    case 'getwidth':   return ts.width;
    case 'ispendown':  return ts.penDown;
    default:           return 0;
  }
}

// ── Messaging helpers ─────────────────────────────────────────────────────────
let commandFired = false;

function emit(name, args) {
  self.postMessage({ type: 'cmd', name, args });
  commandFired = true;
}

// ── Execution ─────────────────────────────────────────────────────────────────
function runLogo(source) {
  resetState();
  stopped      = false;
  commandFired = false;

  let ast;
  try {
    const tokens = new Lexer(source).tokenize();
    ast          = new Parser(tokens).parse();
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
    self.postMessage({ type: 'done', stopped: false });
    return;
  }

  // We run the evaluator synchronously but yield to the main thread
  // after each command (pacing), replicating the old ack/resume pattern.
  // Because the evaluator is fully synchronous we wrap the run in a
  // trampoline: evaluator.run() is called in chunks via a callback chain
  // driven by the ack messages from the main thread.

  const evaluator = new Evaluator({
    isStopped: () => stopped,
    onHighlight(blockId) {
      self.postMessage({ type: 'highlight', blockId });
      commandFired = true;
    },
    onCommand(name, args) {
      if (name === '__query__') return handleQuery(args);
      dispatchCommand(name, args);
      return undefined;
    },
  });

  // Wrap the entire run inside a generator so we can pause at every
  // highlight/command and resume after ack.
  // Since JS doesn't allow async inside a sync evaluator tree, we use a
  // simpler approach: split execution into a scheduled continuation.

  let pendingResolve = null;

  // Override onHighlight to pause execution
  const origHighlight = evaluator.onHighlight;
  evaluator.onHighlight = function(blockId) {
    origHighlight(blockId);
    // pause — execution will continue when ack arrives
    // We achieve this by throwing a pause token, catching it outside,
    // and scheduling the remainder via resumeAfterAck.
    // This only works if the evaluator supports this pattern.
    // Instead we use a simpler synchronous approach with setTimeout(0) yield:
  };

  // Simpler approach: run fully sync, but intercept each command to
  // schedule a pause. We reuse the same ack/resumeAfterAck pattern.
  // We split the program into individual statement executions by running
  // one statement at a time from a queue.

  const stmts = ast.body.filter(s => s.type !== 'ProcDef');
  // register procs
  for (const s of ast.body) {
    if (s.type === 'ProcDef') evaluator._registerProc(s);
  }

  let idx = 0;

  function runNext() {
    if (stopped) {
      self.postMessage({ type: 'done', stopped: true });
      return;
    }
    if (idx >= stmts.length) {
      self.postMessage({ type: 'done', stopped: false });
      return;
    }

    commandFired = false;
    try {
      evaluator._execStmt(stmts[idx++], evaluator.globalEnv);
    } catch (err) {
      if (err && err.isStop) {
        self.postMessage({ type: 'done', stopped: false });
        return;
      }
      self.postMessage({ type: 'error', message: err.message });
      self.postMessage({ type: 'done', stopped: false });
      return;
    }

    if (commandFired) {
      // pause and wait for ack
      resumeAfterAck = runNext;
    } else {
      // no drawing command, continue immediately
      setTimeout(runNext, 0);
    }
  }

  runNext();
}
