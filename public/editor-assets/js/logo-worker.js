'use strict';
// acorn_interpreter.js references `window` — alias it to `self` for worker context
self.window = self;
importScripts('/editor-assets/js/JS-Interpreter/acorn_interpreter.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNative(val) {
  if (val === null || val === undefined) return null;
  if (val.data !== undefined) return val.data;
  if (typeof val.toNumber === 'function') return val.toNumber();
  return val;
}

// ── Turtle state mirror ───────────────────────────────────────────────────────
const ts = {
  x: 0, y: 0, heading: 0,
  penDown: true, color: 0, width: 1,
  visible: true, penMode: 'paint', turtleMode: 'turtle', fontSize: 12,
  state: null,
};

function resetState() {
  Object.assign(ts, {
    x: 0, y: 0, heading: 0,
    penDown: true, color: 0, width: 1,
    visible: true, penMode: 'paint', turtleMode: 'turtle', fontSize: 12,
    state: null,
  });
}

// ── Worker message handling ───────────────────────────────────────────────────
let stopped = false;
let resumeAfterAck = null;

self.onmessage = function(e) {
  const { type } = e.data;
  if (type === 'run') {
    stopped = false;
    runCode(e.data.code);
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

// ── Interpreter API ───────────────────────────────────────────────────────────
let commandExecuted = false;

function initApi(interpreter, scope) {
  function addFn(name, fn) {
    interpreter.setProperty(scope, name, interpreter.createNativeFunction(fn));
  }

  function drawFn(name, stateFn) {
    addFn(name, function() {
      const args = [];
      for (let i = 0; i < arguments.length; i++) {
        args.push(toNative(arguments[i]));
      }
      self.postMessage({ type: 'cmd', name, args });
      if (stateFn) stateFn.apply(null, args);
    });
  }

  // ── Drawing commands ───────────────────────────────────────────────────────

  drawFn('moveCT', function(s) {
    const rad = (ts.heading - 90) * Math.PI / 180;
    ts.x += Number(s) * Math.cos(rad);
    ts.y += Number(s) * Math.sin(rad);
  });

  drawFn('turnCT', function(d) {
    ts.heading = ((ts.heading + Number(d)) % 360 + 360) % 360;
  });

  drawFn('setpositionCT', function(x, y) {
    if (x !== null && x !== undefined) ts.x = Number(x);
    if (y !== null && y !== undefined) ts.y = Number(y);
  });

  drawFn('setheadingCT',    function(v) { ts.heading = Number(v); });
  drawFn('setcolorCT',      function(v) { ts.color = v; });
  drawFn('setwidthCT',      function(v) { ts.width = Number(v); });
  drawFn('setfontsizeCT',   function(v) { ts.fontSize = Number(v); });
  drawFn('setpenmodeCT',    function(v) { ts.penMode = String(v); });
  drawFn('setturtlemodeCT', function(v) { ts.turtleMode = String(v); });
  drawFn('setstateCT',      function(v) { ts.state = v; });
  drawFn('penupCT',         function() { ts.penDown = false; });
  drawFn('pendownCT',       function() { ts.penDown = true; });
  drawFn('showCT',          function() { ts.visible = true; });
  drawFn('hideCT',          function() { ts.visible = false; });

  drawFn('homeCT', function() {
    ts.x = 0; ts.y = 0; ts.heading = 0;
  });

  drawFn('clearscreenCT', function() { resetState(); });
  drawFn('clearCT');
  drawFn('fillCT');
  drawFn('towardsCT');
  drawFn('drawtextCT');
  drawFn('arcCT');

  // ── Getter functions ───────────────────────────────────────────────────────

  addFn('getheadingCT',      function() { return interpreter.createPrimitive(ts.heading); });
  addFn('getcolorCT',        function() { return interpreter.createPrimitive(ts.color); });
  addFn('getwidthCT',        function() { return interpreter.createPrimitive(ts.width); });
  addFn('getfontsizeCT',     function() { return interpreter.createPrimitive(ts.fontSize); });
  addFn('ispendownCT',       function() { return interpreter.createPrimitive(ts.penDown); });
  addFn('isturtlevisibleCT', function() { return interpreter.createPrimitive(ts.visible); });
  addFn('getpenmodeCT',      function() { return interpreter.createPrimitive(ts.penMode); });
  addFn('getturtlemodeCT',   function() { return interpreter.createPrimitive(ts.turtleMode); });
  addFn('getstateCT',        function() { return interpreter.createPrimitive(ts.state); });

  addFn('getxyCT', function() {
    const obj = interpreter.createObject(interpreter.OBJECT);
    interpreter.setProperty(obj, 'x', interpreter.createPrimitive(ts.x));
    interpreter.setProperty(obj, 'y', interpreter.createPrimitive(ts.y));
    return obj;
  });

  // ── UI functions ───────────────────────────────────────────────────────────

  // highlightBlock fires before each statement — used as the pacing point.
  // Worker pauses here and waits for 'ack' from main thread (which applies the delay).
  addFn('highlightBlock', function(id) {
    const blockId = id && id.data !== undefined ? String(id.data) : '';
    self.postMessage({ type: 'highlight', blockId });
    commandExecuted = true;
  });

  addFn('alert', function(text) {
    self.postMessage({ type: 'alert', text: text ? String(toNative(text)) : '' });
  });

  addFn('prompt', function() {
    return interpreter.createPrimitive('');
  });
}

// ── Execution loop ────────────────────────────────────────────────────────────
function runCode(code) {
  resetState();
  stopped = false;
  commandExecuted = false;
  resumeAfterAck = null;

  const interp = new Interpreter(code, initApi);

  function runBatch() {
    if (stopped) {
      self.postMessage({ type: 'done', stopped: true });
      return;
    }

    const deadline = Date.now() + 8;
    let hasMore = true;

    while (hasMore && !stopped && Date.now() < deadline) {
      hasMore = interp.step();

      if (commandExecuted) {
        commandExecuted = false;
        // Pause and wait for main thread ack (main thread applies the delay)
        resumeAfterAck = hasMore ? runBatch : function() {
          self.postMessage({ type: 'done', stopped: false });
        };
        return;
      }
    }

    if (!hasMore || stopped) {
      self.postMessage({ type: 'done', stopped });
      return;
    }

    setTimeout(runBatch, 0);
  }

  runBatch();
}
