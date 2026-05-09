
/**
 * Turtle Graphics Microwold in Javascript
 *
 * Author: Juliano Bittencourt <juliano@hardfunstudios.com>
 *
 * This work was heavely beased on Joshua's Bell Turtle Graphics in Javascript.
 * See the original code in https://github.com/inexorabletash/jslogo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **/

function Microworld(canvasParentSelector,width, height) {

  //init the turtle geometry microworldDiv
  var canvasParent = $(canvasParentSelector);
  width = Number(width);
  height = Number(height);

  // ── Logical coordinate system ─────────────────────────────────────────────────
  // Turtle state (self.x, self.y) is stored in logical coords: -500..+500, Y-up.
  // All canvas draw calls convert via lx2cx / ly2cy.
  var WORLD_HALF = 500;                                // logical half-extent

  function getScale() { return Math.min(width, height) / (WORLD_HALF * 2); }
  function lx2cx(lx) { return  lx * getScale() + width  / 2; }
  function ly2cy(ly) { return -ly * getScale() + height / 2; }  // Y-flip

  canvasElement = document.createElement("CANVAS");
  canvasElement.id = "microworldCavnas";
  canvasElement.width = width;
  canvasElement.height = height;
  canvasParent.append(canvasElement);

	var turtleCanvas = null;   //canvas elements
	var turtleCanvas_ctx = null; //canvas context

	var penCanvas = null;     //canvas elements
	var penCanvas_ctx = null; //canvas context

	var renderCanvas = canvasElement; //canvas elements
	var renderCanvas_ctx = canvasElement.getContext('2d'); //canvas context

	var initilized = false;

  var logToConsole = false;


  //enables the make time visible mode
  var makeTimeVisibleMode = false;

  // ── Replay-based time tracking (replaces canvas stack) ──────────────────────
  // commandLog stores {name, args} for every turtle command executed.
  // stepLog[i] = index into commandLog after step i completes.
  // To go to step N: replay commandLog[0..stepLog[N]-1] from scratch.
  var commandLog = [];
  var stepLog = [];   // stepLog[i] = {cmdCount, x, y} after step i
  var replayStep = -1; // which step is currently displayed (-1 = live)

  // Checkpoints: every CHECKPOINT_INTERVAL steps we store an ImageData snapshot
  // of the pen canvas, so replay only needs to re-draw from the last checkpoint.
  var CHECKPOINT_INTERVAL = 300;
  var checkpoints = []; // checkpoints[k] = { stepIndex, imageData }

  // Legacy aliases kept so old code paths (reset, init) still compile
  var canvasStoryStack = { length: 0 };
  var currentStotyStackPointer = 0;
  var canvasPenStack = [];
  var currentPenStackPointer = 0;
  var alphaBorder = 0.2;

	//var turtleImageFile = "media/costumes/cat1-a.gif";
  var turtleImageFile = "/media/t0.png";
	var turtles = []; // array containing all turtles
	var currentTurtleIndex = 0; //point to the current turtle in the array
	var currentTurtle = null;  //pointer to the current turtle

  function deg2rad(d) { return d / 180 * Math.PI; }
  function rad2deg(r) { return r * 180 / Math.PI; }
  function makeid() {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 5; i++ )
          text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
  }

  //microworld public properties
  this.microworldName = "";
  this.microworldAuthor = "";
  this.microworldId = makeid();

  this.renderAtEachCommand = true;

  var self = this;

	function Turtle(turtleName,imageFilename, microworld) {

		this.turtleImageFile = imageFilename;
		this.name = turtleName;

		this.turtleImage = new Image();
		this.turtleImage.src = imageFilename;
		this.visible = true;


    //VALIDE ROTATION STYLES ARE HEADING, NONE
    this.rotationStyle = "HEADING";

    this.microworld = microworld;    //references the parant microworld

    this.turtleImage.onload = function() { microworld.render(); }  //when finished loading the image, forces the microworld to render again

	}

  function moveto(x, y) {
    // All coordinates here are logical (±WORLD_HALF, Y-up).
    // _go converts to canvas pixels for actual drawing.
    function _go(x1, y1, x2, y2) {
      if (_skipDrawing) return;
      var cx1 = lx2cx(x1), cy1 = ly2cy(y1);
      var cx2 = lx2cx(x2), cy2 = ly2cy(y2);
      if (self.filling) {
        penCanvas_ctx.lineTo(cx1, cy1);
        penCanvas_ctx.lineTo(cx2, cy2);
      } else if (self.down) {
        penCanvas_ctx.beginPath();
        penCanvas_ctx.moveTo(cx1, cy1);
        penCanvas_ctx.lineTo(cx2, cy2);
        penCanvas_ctx.stroke();
      }
    }

    var ix, iy, wx, wy, fx, fy, less;
    var B = WORLD_HALF;

    while (true) {
      switch (self.turtlemode) {
        case 'window':
          _go(self.x, self.y, x, y);
          self.x = x;
          self.y = y;
          if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
          return;

        default:
        case 'wrap':
        case 'fence':

          fx = 1;
          fy = 1;

          if (x < -B) {
            fx = (self.x + B) / (self.x - x);
          } else if (x > B) {
            fx = (self.x - B) / (self.x - x);
          }

          if (y < -B) {
            fy = (self.y + B) / (self.y - y);
          } else if (y > B) {
            fy = (self.y - B) / (self.y - y);
          }

          ix = x;
          iy = y;
          wx = x;
          wy = y;

          if (fx < 1 && fx <= fy) {
            less = (x < -B);
            ix = less ? -B : B;
            iy = self.y - fx * (self.y - y);
            x += less ? B * 2 : -B * 2;
            wx = less ? B : -B;
            wy = iy;
          } else if (fy < 1 && fy <= fx) {
            less = (y < -B);
            ix = self.x - fy * (self.x - x);
            iy = less ? -B : B;
            y += less ? B * 2 : -B * 2;
            wx = ix;
            wy = less ? B : -B;
          }

          _go(self.x, self.y, ix, iy);

          if (self.turtlemode === 'fence') {
            self.x = ix;
            self.y = iy;
            if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
            return;
          } else {
            self.x = wx;
            self.y = wy;
            if (fx === 1 && fy === 1) {
              if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
              return;
            }
          }

          break;
      }
    }
  }

  this.move = function(distance) {
    var x, y, point, saved_x, saved_y, EPSILON = 1e-3;

    if(logToConsole) console.log("Move "+distance.toString());

    point = Math.abs(distance) < EPSILON;

    if (point) {
      saved_x = this.x;
      saved_y = this.y;
      distance = EPSILON;
    }

    // Logical Y-up: no sign flip on Y
    x = this.x + distance * Math.cos(this.r);
    y = this.y + distance * Math.sin(this.r);
    moveto(x, y);

    if (point) {
      this.x = saved_x;
      this.y = saved_y;
    }


  };

  this.turn = function(angle) {
    this.r -= deg2rad(angle);

    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
  };

  this.penup = function() { this.down = false; };
  this.pendown = function() { this.down = true; };

  this.setpenmode = function(penmode) {
    this.penmode = penmode;
    penCanvas_ctx.globalCompositeOperation =
                (this.penmode === 'erase') ? 'destination-out' :
                (this.penmode === 'reverse') ? 'xor' : 'source-over';
  };
  this.getpenmode = function() { return this.penmode; };

  this.setturtlemode = function(turtlemode) { this.turtlemode = turtlemode; };
  this.getturtlemode = function() { return this.turtlemode; };

  this.ispendown = function() { return this.down; };

  // To handle additional color names (localizations, etc):
  // turtle.colorAlias = function(name) {
  //   return {internationalorange: '#FF4F00', ... }[name];
  // };
  this.colorAlias = null;

  function parseColor(color) {
    color = String(color);
    if (!isNaN(parseInt(color))) {
      var new_color = ((parseInt(color) % 140) + 140) % 140;
      return FULL_256_COLORTABLE[new_color];
    }
    return color; // hex string or CSS color name passed directly
  }



  this.setcolor = function(color) {
    this.color = color;
    penCanvas_ctx.strokeStyle = parseColor(this.color);
    penCanvas_ctx.fillStyle = parseColor(this.color);
  };

  this.getcolor = function() { return this.color; };

  this.setwidth = function(width) {
    this.width = width;
    penCanvas_ctx.lineWidth = this.width;


  };
  this.getwidth = function() { return this.width; };

  this.setfontsize = function(size) {
    this.fontsize = size;
    penCanvas_ctx.font = this.fontsize + 'px sans-serif';


  };
  this.getfontsize = function() { return this.fontsize; };

  this.setposition = function(x, y) {
    // Logical coords passed directly — no pixel conversion.
    x = (x === undefined) ? this.x : Number(x);
    y = (y === undefined) ? this.y : Number(y);
    moveto(x, y);
  };

  this.towards = function(x, y) {
    // Logical Y-up: atan2(dy, dx), heading = 90 - math_angle.
    return 90 - rad2deg(Math.atan2(Number(y) - this.y, Number(x) - this.x));
  };

  this.setheading = function(angle) {
    this.r = deg2rad(90 - angle);

    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
  };

  this.reset = function() {
    commandLog = [];
    stepLog = [];
    checkpoints = [];
    replayStep = -1;

    // Reset turtle state to defaults
    self.x = 0;
    self.y = 0;
    self.r = Math.PI / 2;
    self.down = true;
    self.color = 0;
    self.width = 1;
    self.fontsize = 14;
    self.penmode = 'paint';
    self.turtlemode = 'window';
    if (currentTurtle) currentTurtle.visible = true;

    // Reinitialize pen canvas context cleanly
    penCanvas_ctx = self.penCanvasSetup(penCanvas);
    // Fill with background color
    penCanvas_ctx.fillStyle = parseColor(self.bgcolor);
    penCanvas_ctx.fillRect(0, 0, width, height);
    // Restore pen color after fill
    penCanvas_ctx.fillStyle = parseColor(self.color);

    // Clear turtle canvas
    turtleCanvas_ctx.clearRect(0, 0, width, height);

    self.drawTurtle();
    updateRenderCanvas();
  };

  this.clearscreen = function() {
    this.home();
    this.clear();

  };

  this.clear = function() {
    if (_skipDrawing) return;
    penCanvas_ctx.clearRect(0, 0, width, height);
    penCanvas_ctx.save();
    try {
      penCanvas_ctx.fillStyle = parseColor(this.bgcolor);
      penCanvas_ctx.fillRect(0, 0, width, height);
    } finally {
      penCanvas_ctx.restore();
    }

    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
  };

  this.home = function() {
    moveto(0, 0);          // logical origin
    this.r = deg2rad(90);  // heading 0 = north
  };

  this.showturtle = function() {
    currentTurtle.visible = true;

    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
  };

  this.hideturtle = function() {
    currentTurtle.visible = false;
    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();

  };

  this.isturtlevisible = function() {
    return currentTurtle.visible;
  };

  this.getheading = function() {
    return 90 - rad2deg(this.r);

  };

  this.getxy = function() {
    return [this.x, this.y];  // logical coords directly
  };

  this.drawtext = function(text) {
    if (_skipDrawing) return;
    penCanvas_ctx.save();
    penCanvas_ctx.translate(lx2cx(this.x), ly2cy(this.y));
    penCanvas_ctx.rotate(-this.r);
    penCanvas_ctx.fillText(text, 0, 0);
    penCanvas_ctx.restore();

    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
  };

  this.filling = 0;
  this.beginpath = function() {
    if (this.filling === 0) {
      this.saved_turtlemode = this.turtlemode;
      this.turtlemode = 'window';
      ++this.filling;
      penCanvas_ctx.beginPath();
    }


  };

  this.fillpath = function(fillcolor) {
    --this.filling;
    if (this.filling === 0) {
      penCanvas_ctx.closePath();
      penCanvas_ctx.fillStyle = parseColor(fillcolor);
      penCanvas_ctx.fill();
      penCanvas_ctx.fillStyle = this.color;
      if (this.down)
        penCanvas_ctx.stroke();
      this.turtlemode = this.saved_turtlemode;
    }

    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
  };

  this.fill = function() {
    // TODO: implement flood fill funcion to canvas
    penCanvas_ctx.floodFill(this.x, this.y);


  };

  this.arc = function(angle, radius) {
    if (_skipDrawing) return;
    var self = this;
    var cx = lx2cx(this.x), cy = ly2cy(this.y), sr = radius * getScale();
    if (this.turtlemode == 'wrap') {
      [cx, cx + width, cx - width].forEach(function(x) {
        [cy, cy + height, cy - height].forEach(function(y) {
          if (!self.filling)
            penCanvas_ctx.beginPath();
          penCanvas_ctx.arc(x, y, sr, -self.r, -self.r + deg2rad(angle), false);
          if (!self.filling)
            penCanvas_ctx.stroke();
        });
      });
    } else {
      if (!this.filling)
        penCanvas_ctx.beginPath();
      penCanvas_ctx.arc(cx, cy, sr, -this.r, -this.r + deg2rad(angle), false);
      if (!this.filling)
        penCanvas_ctx.stroke();
    }

    if(self.renderAtEachCommand && !_replaying) self.drawTurtle();
  };

  this.getstate = function () {
    return {
      isturtlestate: true,
      color: this.getcolor(),
      xy: this.getxy(),
      heading: this.getheading(),
      penmode: this.getpenmode(),
      turtlemode: this.getturtlemode(),
      width: this.getwidth(),
      fontsize: this.getfontsize(),
      visible: this.isturtlevisible(),
      pendown: this.down
    };
  };

  this.setstate = function (state) {
    if ((! state) || ! state.isturtlestate) {
      throw new Error("Tried to restore a state that is not a turtle state");
    }
    this.penup();
    this.hideturtle();
    this.setturtlemode(state.turtlemode);
    this.setcolor(state.color);
    this.setwidth(state.width);
    this.setfontsize(state.size);
    this.setposition(state.xy[0], state.xy[1]);
    this.setheading(state.heading);
    this.setpenmode(state.penmode);
    if (state.visible) {
      this.showturtle();
    }
    if (state.pendown) {
      this.pendown();
    }
  };

  this.drawTurtle = function() {
    if(logToConsole) console.log("Drawing turtle");
    // Stub for old browsers w/ canvas but no text functions
    var ctx = turtleCanvas_ctx;

    var turtle = currentTurtle;

    ctx.save();
    ctx.translate(lx2cx(this.x), ly2cy(this.y));

    if(turtle.rotationStyle == "HEADING") {
      ctx.rotate(Math.PI/2 - this.r);
    }

    dx = -(turtle.turtleImage.width / 2);
    dy = -(turtle.turtleImage.height / 2);

    if (turtle.visible) {
      ctx.drawImage(turtle.turtleImage, dx, dy);
    }

    ctx.restore();

  }

  // ── Render: called once per step during execution ────────────────────────────
  // Always records a step boundary (for the time slider) and redraws.
	this.render = function() {
    stepLog.push({ cmdCount: commandLog.length, x: self.x, y: self.y });

    // Save checkpoint every CHECKPOINT_INTERVAL steps
    if (stepLog.length % CHECKPOINT_INTERVAL === 0) {
      checkpoints.push({
        stepIndex: stepLog.length - 1,
        imageData: penCanvas_ctx.getImageData(0, 0, width, height)
      });
    }

    turtleCanvas_ctx.clearRect(0, 0, width, height);
    self.drawTurtle();
    updateRenderCanvas();
  };

  this.getTotalTime = function() {
    return stepLog.length;
  };

  this.getTime = function() {
    return stepLog.length;
  };

  this.setTimeVisibleMode = function(visible) {
    makeTimeVisibleMode = visible;
    updateRenderCanvas();
  };

  // ── Replay engine ─────────────────────────────────────────────────────────────
  // Redraws pen canvas by replaying commands up to (not including) endCmdIndex.
  // Restores from the nearest checkpoint to avoid replaying from step 0 every time.
  function replayPenCanvas(endCmdIndex) {
    var startCmd = 0;
    var checkpointRestored = false;

    // Find the most recent checkpoint whose command count is > 0 and <= endCmdIndex
    for (var k = checkpoints.length - 1; k >= 0; k--) {
      var cp = checkpoints[k];
      var cpCmds = stepLog[cp.stepIndex].cmdCount;
      if (cpCmds > 0 && cpCmds <= endCmdIndex) {
        penCanvas_ctx.putImageData(cp.imageData, 0, 0);
        startCmd = cpCmds;
        checkpointRestored = true;
        break;
      }
    }

    if (!checkpointRestored) {
      penCanvas_ctx.clearRect(0, 0, width, height);
      penCanvas_ctx.save();
      penCanvas_ctx.fillStyle = parseColor(self.bgcolor);
      penCanvas_ctx.fillRect(0, 0, width, height);
      penCanvas_ctx.restore();
    }

    _replayState(endCmdIndex, startCmd);
  }

  var _replaying = false;
  var _skipDrawing = false; // suppresses pen strokes without touching self.down

  function _replayState(endCmdIndex, startCmd) {
    // Reset turtle to initial state before replaying
    self.x = 0;
    self.y = 0;
    self.r = Math.PI / 2;
    self.down = true;
    self.color = 0;
    self.width = 1;
    self.fontsize = 14;
    self.penmode = 'paint';
    self.turtlemode = 'window';
    if (currentTurtle) currentTurtle.visible = true;
    penCanvas_ctx.strokeStyle = parseColor(self.color);
    penCanvas_ctx.fillStyle = parseColor(self.color);
    penCanvas_ctx.lineWidth = self.width;
    penCanvas_ctx.font = self.fontsize + 'px sans-serif';
    penCanvas_ctx.globalCompositeOperation = 'source-over';

    _replaying = true;
    for (var i = 0; i < endCmdIndex; i++) {
      // Before checkpoint: skip drawing but apply all state changes correctly
      _skipDrawing = (i < startCmd);
      _applyReplayCmd(commandLog[i]);
    }
    _skipDrawing = false;
    _replaying = false;
  }

  function _applyReplayCmd(cmd) {
    if (!cmd) return;
    var name = cmd.name, a = cmd.args;
    switch (name) {
      case 'moveCT':          self.move(a[0]); break;
      case 'turnCT':          self.turn(a[0]); break;
      case 'setpositionCT':   self.setposition(a[0], a[1]); break;
      case 'setheadingCT':    self.setheading(a[0]); break;
      case 'setcolorCT':      self.setcolor(a[0]); break;
      case 'setwidthCT':      self.setwidth(a[0]); break;
      case 'setfontsizeCT':   self.setfontsize(a[0]); break;
      case 'setpenmodeCT':    self.setpenmode(a[0]); break;
      case 'setturtlemodeCT': self.setturtlemode(a[0]); break;
      case 'penupCT':         self.penup(); break;
      case 'pendownCT':       self.pendown(); break;
      case 'showCT':          self.showturtle(); break;
      case 'hideCT':          self.hideturtle(); break;
      case 'homeCT':          self.home(); break;
      case 'clearscreenCT':   self.clearscreen(); break;
      case 'clearCT':         self.clear(); break;
      case 'arcCT':           self.arc(a[0], a[1]); break;
      case 'drawtextCT':      self.drawtext(a[0]); break;
    }
  }

  function updateRenderCanvas() {
    if (_replaying) return;
    renderCanvas_ctx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
    renderCanvas_ctx.globalAlpha = 1;
    renderCanvas_ctx.drawImage(penCanvas, 0, 0);

    if (makeTimeVisibleMode && stepLog.length > 1 && currentTurtle && currentTurtle.turtleImage) {
      // Draw ghost turtle at every recorded step position
      var n = stepLog.length;
      var img = currentTurtle.turtleImage;
      var dx = -(img.width / 2);
      var dy = -(img.height / 2);
      for (var i = 0; i < n; i++) {
        var entry = stepLog[i];
        var alpha = 0.15 + 0.55 * (i / (n - 1));
        renderCanvas_ctx.globalAlpha = alpha;
        renderCanvas_ctx.save();
        renderCanvas_ctx.translate(lx2cx(entry.x), ly2cy(entry.y));
        renderCanvas_ctx.drawImage(img, dx, dy);
        renderCanvas_ctx.restore();
      }
      renderCanvas_ctx.globalAlpha = 1;
    }

    renderCanvas_ctx.globalAlpha = 1;
    renderCanvas_ctx.drawImage(turtleCanvas, 0, 0);
  }

  this.refresh = function() {
    updateRenderCanvas();
  };

  // ── Scrub to a step ───────────────────────────────────────────────────────────
  this.setPlayTime = function(stepIndex) {
    stepIndex = Math.max(0, Math.min(stepIndex, stepLog.length - 1));
    replayStep = stepIndex;

    var endCmd = stepLog[stepIndex] ? stepLog[stepIndex].cmdCount : 0;

    // Clear turtle canvas
    turtleCanvas_ctx.clearRect(0, 0, width, height);

    replayPenCanvas(endCmd);

    self.drawTurtle();
    updateRenderCanvas();
  };

  this.x = 0;
  this.y = 0;
  this.r = Math.PI / 2;

  this.bgcolor = '#ffffff';
  this.color = '#000000';
  this.width = 1;
  this.penmode = 'paint';
  this.fontsize = 14;
  this.turtlemode = 'window';
  this.visible = true;
  this.down = true;

  function init() {
		turtleCanvas = document.createElement("CANVAS");
		turtleCanvas.id = "mwTurtleCanvas";
		turtleCanvas.width = width;
		turtleCanvas.height = height;
		turtleCanvas.style.display = "none";
		document.body.appendChild(turtleCanvas);
		turtleCanvas_ctx = turtleCanvas.getContext('2d');

		penCanvas = document.createElement("CANVAS");
		penCanvas.id = "mwPenCanvas";
		penCanvas.width = width;
		penCanvas.height = height;
		penCanvas.style.display = "none";
		document.body.appendChild(penCanvas);
		penCanvas_ctx = self.penCanvasSetup(penCanvas);

		turtleCanvas_ctx.lineCap = 'round';

		var turtle0 = new Turtle("0",turtleImageFile,self);
		turtles.push(turtle0);

		currentTurtle = turtles[currentTurtleIndex];

    self.drawTurtle(turtleCanvas_ctx);
  }

  // Expose commandLog so the execution layer can push commands
  this.pushCommand = function(name, args) {
    if (!_replaying) commandLog.push({ name: name, args: args });
  };

  // Capture any commands after the last highlight into a final step
  this.flushFinalStep = function() {
    var lastLogged = stepLog.length > 0 ? stepLog[stepLog.length - 1].cmdCount : 0;
    if (commandLog.length > lastLogged) {
      stepLog.push({ cmdCount: commandLog.length, x: self.x, y: self.y });
    }
  };

  this.resize = function(w, h) {
    width = w;
    height = h;
    renderCanvas.width = w;
    renderCanvas.height = h;
    if (turtleCanvas) { turtleCanvas.width = w; turtleCanvas.height = h; }
    if (penCanvas)    { penCanvas.width = w;    penCanvas.height = h; }
    self.render();
  };

  this.penCanvasSetup = function(canvas) {
    var canvas_ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas_ctx.lineCap = 'round';

    canvas_ctx.strokeStyle = parseColor(this.color);
    canvas_ctx.fillStyle = parseColor(this.color);
    canvas_ctx.lineWidth = this.width;
    canvas_ctx.font = this.fontsize + 'px sans-serif';
    canvas_ctx.globalCompositeOperation =
      (self.penmode === 'erase') ? 'destination-out' :
      (self.penmode === 'reverse') ? 'xor' : 'source-over';


    return canvas_ctx;
  }


  init();
  this.render();

  var FULL_256_COLORTABLE = (function() {
    var bases = [
      [128,128,128],[220,50,47],[232,124,18],[155,93,46],[225,225,40],
      [60,180,50],[130,210,30],[30,200,130],[0,190,210],[80,150,220],
      [40,80,220],[130,40,200],[200,30,180],[230,90,160]
    ];
    function lerp(a,b,t){ return Math.round(a+(b-a)*t); }
    function hex2(v){ return Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0'); }
    var t = {};
    for (var f = 0; f < bases.length; f++) {
      var r=bases[f][0], g=bases[f][1], b=bases[f][2];
      for (var o = 0; o < 10; o++) {
        var idx = f*10+o, cr, cg, cb;
        if (o < 5) {
          var factor = o/5;
          cr=lerp(15,r,factor); cg=lerp(15,g,factor); cb=lerp(15,b,factor);
        } else if (o === 5) {
          cr=r; cg=g; cb=b;
        } else {
          var factor = (o-5)/5;
          cr=lerp(r,240,factor); cg=lerp(g,240,factor); cb=lerp(b,240,factor);
        }
        t[idx] = '#'+hex2(cr)+hex2(cg)+hex2(cb);
      }
    }
    return t;
  })();
}
