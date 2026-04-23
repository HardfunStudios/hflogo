
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
  var makeTimeVisibleMode = true;
  var canvasStoryStack = new Array();
  var currentStotyStackPointer = 0;

  var canvasPenStack = new Array();
  var currentPenStackPointer = 0;

  //control canvas play in time visible mode
  var currentFrameInTimeVisibleMode = 0;
  var alphaBorder = 0.2; //initial alpha for last frames

	//var turtleImageFile = "media/costumes/cat1-a.gif";
  var turtleImageFile = "media/t0.png";
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
    function _go(x1, y1, x2, y2) {
      if (self.filling) {
        penCanvas_ctx.lineTo(x1, y1);
        penCanvas_ctx.lineTo(x2, y2);
      } else if (self.down) {
        penCanvas_ctx.beginPath();
        penCanvas_ctx.moveTo(x1, y1);
        penCanvas_ctx.lineTo(x2, y2);
        penCanvas_ctx.stroke();
      }
    }

    var ix, iy, wx, wy, fx, fy, less;

    while (true) {
      // TODO: What happens if we switch modes and turtle is outside bounds?

      switch (self.turtlemode) {
        case 'window':
          _go(self.x, self.y, x, y);
          self.x = x;
          self.y = y;
          if(self.renderAtEachCommand) self.drawTurtle();
          return;

        default:
        case 'wrap':
        case 'fence':

          // fraction before intersecting
          fx = 1;
          fy = 1;

          if (x < 0) {
            fx = (self.x - 0) / (self.x - x);
          } else if (x >= width) {
            fx = (self.x - width) / (self.x - x);
          }

          if (y < 0) {
            fy = (self.y - 0) / (self.y - y);
          } else if (y >= height) {
            fy = (self.y - height) / (self.y - y);
          }

          // intersection point (draw current to here)
          ix = x;
          iy = y;

          // endpoint after wrapping (next "here")
          wx = x;
          wy = y;

          if (fx < 1 && fx <= fy) {
            less = (x < 0);
            ix = less ? 0 : width;
            iy = self.y - fx * (self.y - y);
            x += less ? width : -width;
            wx = less ? width : 0;
            wy = iy;
          } else if (fy < 1 && fy <= fx) {
            less = (y < 0);
            ix = self.x - fy * (self.x - x);
            iy = less ? 0 : height;
            y += less ? height : -height;
            wx = ix;
            wy = less ? height : 0;
          }

          _go(self.x, self.y, ix, iy);


          if (self.turtlemode === 'fence') {
            // FENCE - stop on collision
            self.x = ix;
            self.y = iy;
            if(self.renderAtEachCommand) self.drawTurtle();
            return;
          } else {
            // WRAP - keep going
            self.x = wx;
            self.y = wy;
            if (fx === 1 && fy === 1) {
              if(self.renderAtEachCommand) self.drawTurtle();
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

    x = this.x + distance * Math.cos(this.r);
    y = this.y - distance * Math.sin(this.r);
    moveto(x, y);

    if (point) {
      this.x = saved_x;
      this.y = saved_y;
    }


  };

  this.turn = function(angle) {
    this.r -= deg2rad(angle);

    if(self.renderAtEachCommand) self.drawTurtle();
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

  var STANDARD_COLORS = {
    0: "black", 1: "blue", 2: "lime", 3: "cyan",
    4: "red", 5: "magenta", 6: "yellow", 7: "white",
    8: "brown", 9: "tan", 10: "green", 11: "aquamarine",
    12: "salmon", 13: "purple", 14: "orange", 15: "gray"
  };



  //TODO: change the parsecolor to understando colors from 0 to 256 and also rgb hex colors
  function parseColor(color) {
    color = String(color);
    if (STANDARD_COLORS.hasOwnProperty(color)) {
      return STANDARD_COLORS[color];
    }
    // if (self.colorAlias)
    //   return self.colorAlias(color) || color;

    if(!isNaN(parseInt(color))) {
      var new_color = color % 256;
      return FULL_256_COLORTABLE[new_color];
    }
    return color;
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
    x = (x === undefined) ? this.x : x + (width / 2);
    y = (y === undefined) ? this.y : -y + (height / 2);

    moveto(x, y);

  };

  this.towards = function(x, y) {
    x = x + (width / 2);
    y = -y + (height / 2);

    return 90 - rad2deg(Math.atan2(this.y - y, x - this.x));


  };

  this.setheading = function(angle) {
    this.r = deg2rad(90 - angle);

    if(self.renderAtEachCommand) self.drawTurtle();
  };

  this.reset = function() {
    turtleCanvas = canvasStoryStack[canvasStoryStack.length-1];
    turtleCanvas.id = "mwTurtleCanvas";
    turtleCanvas_ctx = turtleCanvas.getContext("2d");

    penCanvas = canvasPenStack[canvasPenStack.length-1];
    penCanvas.id = "mwPenCanvas";
    penCanvas_ctx = penCanvas.getContext("2d");

    //remove all canvases from the document so we don't overflow the memory
    canvasPenStack.forEach(function(canvas) {
      if(canvas!=penCanvas) canvas.parentNode.removeChild(canvas);  //avoid removing the initial canvas
    });

    //remove all canvases from the document so we don't overflow the memory
    canvasStoryStack.forEach(function(canvas) {
      if(canvas!=turtleCanvas) canvas.parentNode.removeChild(canvas);  //avoid removing the initial canvas
    });

    canvasStoryStack = new Array();
    canvasStoryStack.push(turtleCanvas);

    canvasPenStack = new Array();
    canvasPenStack.push(penCanvas);

    currentStotyStackPointer = 0;
    currentPenStackPointer = 0;

  }

  this.clearscreen = function() {
    this.home();
    this.clear();

  };

  this.clear = function() {
    penCanvas_ctx.clearRect(0, 0, width, height);
    penCanvas_ctx.save();
    try {
      penCanvas_ctx.fillStyle = parseColor(this.bgcolor);
      penCanvas_ctx.fillRect(0, 0, width, height);
    } finally {
      penCanvas_ctx.restore();
    }

    if(self.renderAtEachCommand) self.drawTurtle();
  };

  this.home = function() {
    moveto(width / 2, height / 2);
    this.r = deg2rad(90);


  };

  this.showturtle = function() {
    currentTurtle.visible = true;

    if(self.renderAtEachCommand) self.drawTurtle();
  };

  this.hideturtle = function() {
    currentTurtle.visible = false;
    if(self.renderAtEachCommand) self.drawTurtle();

  };

  this.isturtlevisible = function() {
    return currentTurtle.visible;
  };

  this.getheading = function() {
    return 90 - rad2deg(this.r);

  };

  this.getxy = function() {
    return [this.x - (width / 2), -this.y + (height / 2)];
  };

  this.drawtext = function(text) {
    penCanvas_ctx.save();
    penCanvas_ctx.translate(this.x, this.y);
    penCanvas_ctx.rotate(-this.r);
    penCanvas_ctx.fillText(text, 0, 0);
    penCanvas_ctx.restore();

    if(self.renderAtEachCommand) self.drawTurtle();
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

    if(self.renderAtEachCommand) self.drawTurtle();
  };

  this.fill = function() {
    // TODO: implement flood fill funcion to canvas
    penCanvas_ctx.floodFill(this.x, this.y);


  };

  this.arc = function(angle, radius) {
    var self = this;
    if (this.turtlemode == 'wrap') {
      [self.x, self.x + width, this.x - width].forEach(function(x) {
        [self.y, self.y + height, this.y - height].forEach(function(y) {
          if (!this.filling)
            penCanvas_ctx.beginPath();
          penCanvas_ctx.arc(x, y, radius, -self.r, -self.r + deg2rad(angle), false);
          if (!this.filling)
            penCanvas_ctx.stroke();
        });
      });
    } else {
      if (!this.filling)
        penCanvas_ctx.beginPath();
      penCanvas_ctx.arc(this.x, this.y, radius, -this.r, -this.r + deg2rad(angle), false);
      if (!this.filling)
        penCanvas_ctx.stroke();
    }

    if(self.renderAtEachCommand) self.drawTurtle();
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
    ctx.translate(this.x, this.y);

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

	this.render = function() {

    self.drawTurtle();
    updateRenderCanvas();

    newTurtleCanvas = document.createElement("CANVAS");
    newTurtleCanvas.id = "mwTurtleCanvas_"+makeid();
    newTurtleCanvas.width = width;
    newTurtleCanvas.height = height;
    newTurtleCanvas.style.display = "none";
    document.body.appendChild(newTurtleCanvas);

    canvasStoryStack.push(newTurtleCanvas);

    //Create 2 adictional canvas
    currentStotyStackPointer = canvasStoryStack.length;

    turtleCanvas = newTurtleCanvas;
    turtleCanvas_ctx = newTurtleCanvas.getContext('2d');



    // // Erase turtle canvas content, but keeps its context
    // turtleCanvas_ctx.clearRect(0, 0, width, height);
    currentPenStackPointer = canvasPenStack.length;

    var previousPenCanvas = canvasPenStack[currentPenStackPointer-1]; //get last canvas

    newPenCanvas = document.createElement("CANVAS");
    newPenCanvas.id = "mwPenCanvas_"+makeid();
    newPenCanvas.width = width;
    newPenCanvas.height = height;
    newPenCanvas.style.display = "none";
    document.body.appendChild(newPenCanvas);

    ctx_pen = self.penCanvasSetup(newPenCanvas);
    ctx_pen.drawImage(penCanvas,0,0);


    canvasPenStack.push(newPenCanvas);

    penCanvas = newPenCanvas;
    penCanvas_ctx = ctx_pen;


  };


  this.getTotalTime = function() {
    return canvasStoryStack.length;
  }

  this.getTime = function() {
    return currentStotyStackPointer;
  }

  this.setTimeVisibleMode = function(visible) {
    makeTimeVisibleMode = visible;
    updateRenderCanvas();
  }

  function updateRenderCanvas() {
    renderCanvas_ctx.clearRect(0,0,renderCanvas.width,renderCanvas.height);
    renderCanvas_ctx.drawImage(penCanvas,0,0);

    if(makeTimeVisibleMode) {
      var renderStack = canvasStoryStack.slice();

      //sort the arrays by its alpha. Lower alaphas goes before
      renderStack.sort(function(canvasA,canvasB) {
        var ctxA = canvasA.getContext("2d");
        var ctxB = canvasB.getContext("2d");

        return ctxA.globalAlpha - ctxB.globalAlpha;
      });

      renderStack.forEach(function(canvas) {
        var ctx = canvas.getContext("2d");
        renderCanvas_ctx.globalAlpha =  ctx.globalAlpha;
        renderCanvas_ctx.drawImage(canvas,0,0);
      })
    } else {
      if(logToConsole) console.log("Rendering turtle canvas");
      if(logToConsole) console.log(turtleCanvas);
      turtleCanvas_ctx.globalAlpha = 1;
      renderCanvas_ctx.drawImage(turtleCanvas,0,0);
    }
  }


  this.refresh = function() {
    updateRenderCanvas();
  }

  this.setPlayTime = function(time) {
    var stackSize = canvasStoryStack.length;
    if(logToConsole) console.log(time);
    if((time<0) | (time>stackSize+1)) {
      throw "Time values must be between 0 and "+stackSize.toString();
      return 0;
    }

    //time = time -1;
    var limitAlpha = 0.2;
    var stackSize = canvasStoryStack.length;
    var crescentAlphaIncrement = (limitAlpha-alphaBorder)/time;
    var descrecentAlphaIncrement = (limitAlpha-alphaBorder)/(stackSize-time);

    var alpha = alphaBorder;  //we start with an alpha different from 0 stored in this variable
    var canvas = canvasStoryStack[time];
    var ctx = canvas.getContext("2d");
    ctx.globalAlpha = 1;

    turtleCanvas = canvas;
    turtleCanvas_ctx = ctx;

    for(var i=0; i<time; i++) {
      canvas = canvasStoryStack[i];
      ctx = canvas.getContext("2d");

      alpha += crescentAlphaIncrement;
      ctx.globalAlpha = alpha;
    }

    alpha = limitAlpha;
    for(var i=(time+1); i<stackSize; i++) {
      canvas = canvasStoryStack[i];
      ctx = canvas.getContext("2d");

      ctx.globalAlpha = alpha;
      alpha -= descrecentAlphaIncrement;
    }


    //set the current pen canvas
    penCanvas = canvasPenStack[time];
    penCanvas_ctx = penCanvas.getContext("2d");

    if(logToConsole) console.log(canvasStoryStack); if(logToConsole) console.log(turtleCanvas);
    if(logToConsole) console.log(canvasPenStack); if(logToConsole) console.log(penCanvas);

    updateRenderCanvas();

  }

  this.x = width / 2;
  this.y = height / 2;
  this.r = Math.PI / 2;

  this.bgcolor = '#ffffff';
  this.color = '#000000';
  this.width = 1;
  this.penmode = 'paint';
  this.fontsize = 14;
  this.turtlemode = 'wrap';
  this.visible = true;
  this.down = true;

  function init() {
		//Create 2 adictional canvas
		turtleCanvas = document.createElement("CANVAS");
		turtleCanvas.id = "mwTurtleCanvas";
		turtleCanvas.width = width;
		turtleCanvas.height = height;
		turtleCanvas.style.display = "none";
		document.body.appendChild(turtleCanvas);
		turtleCanvas_ctx = turtleCanvas.getContext('2d');

    canvasStoryStack.push(turtleCanvas);

		penCanvas = document.createElement("CANVAS");
		penCanvas.id = "mwPenCanvas";
		penCanvas.width = width;
		penCanvas.height = height;
		penCanvas.style.display = "none";
		document.body.appendChild(penCanvas);
		penCanvas_ctx = self.penCanvasSetup(penCanvas);

    canvasPenStack.push(penCanvas);

		turtleCanvas_ctx.lineCap = 'round';
		turtleCanvas_ctx.strokeStyle = 'green';
		turtleCanvas_ctx.lineWidth = 2;

		//creates first turtle 0
		var turtle0 = new Turtle("0",turtleImageFile,self);
		turtles.push(turtle0);

		currentTurtle = turtles[currentTurtleIndex];

    self.drawTurtle(turtleCanvas_ctx);
  }

  this.resize = function(w, h) {
    width = w;
    height = h;
    init();
  };

  this.penCanvasSetup = function(canvas) {
    var canvas_ctx = canvas.getContext('2d');
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

  var FULL_256_COLORTABLE = {
                0: '#000000',
                1: '#800000',
                2: '#008000',
                3: '#808000',
                4: '#000080',
                5: '#800080',
                6: '#008080',
                7: '#c0c0c0',
                8: '#808080',
                9: '#ff0000',
                10: '#00ff00',
                11: '#ffff00',
                12: '#0000ff',
                13: '#ff00ff',
                14: '#00ffff',
                15: '#ffffff',
                16: '#000000',
                17: '#00005f',
                18: '#000087',
                19: '#0000af',
                20: '#0000d7',
                21: '#0000ff',
                22: '#005f00',
                23: '#005f5f',
                24: '#005f87',
                25: '#005faf',
                26: '#005fd7',
                27: '#005fff',
                28: '#008700',
                29: '#00875f',
                30: '#008787',
                31: '#0087af',
                32: '#0087d7',
                33: '#0087ff',
                34: '#00af00',
                35: '#00af5f',
                36: '#00af87',
                37: '#00afaf',
                38: '#00afd7',
                39: '#00afff',
                40: '#00d700',
                41: '#00d75f',
                42: '#00d787',
                43: '#00d7af',
                44: '#00d7d7',
                45: '#00d7ff',
                46: '#00ff00',
                47: '#00ff5f',
                48: '#00ff87',
                49: '#00ffaf',
                50: '#00ffd7',
                51: '#00ffff',
                52: '#5f0000',
                53: '#5f005f',
                54: '#5f0087',
                55: '#5f00af',
                56: '#5f00d7',
                57: '#5f00ff',
                58: '#5f5f00',
                59: '#5f5f5f',
                60: '#5f5f87',
                61: '#5f5faf',
                62: '#5f5fd7',
                63: '#5f5fff',
                64: '#5f8700',
                65: '#5f875f',
                66: '#5f8787',
                67: '#5f87af',
                68: '#5f87d7',
                69: '#5f87ff',
                70: '#5faf00',
                71: '#5faf5f',
                72: '#5faf87',
                73: '#5fafaf',
                74: '#5fafd7',
                75: '#5fafff',
                76: '#5fd700',
                77: '#5fd75f',
                78: '#5fd787',
                79: '#5fd7af',
                80: '#5fd7d7',
                81: '#5fd7ff',
                82: '#5fff00',
                83: '#5fff5f',
                84: '#5fff87',
                85: '#5fffaf',
                86: '#5fffd7',
                87: '#5fffff',
                88: '#870000',
                89: '#87005f',
                90: '#870087',
                91: '#8700af',
                92: '#8700d7',
                93: '#8700ff',
                94: '#875f00',
                95: '#875f5f',
                96: '#875f87',
                97: '#875faf',
                98: '#875fd7',
                99: '#875fff',
                100: '#878700',
                101: '#87875f',
                102: '#878787',
                103: '#8787af',
                104: '#8787d7',
                105: '#8787ff',
                106: '#87af00',
                107: '#87af5f',
                108: '#87af87',
                109: '#87afaf',
                110: '#87afd7',
                111: '#87afff',
                112: '#87d700',
                113: '#87d75f',
                114: '#87d787',
                115: '#87d7af',
                116: '#87d7d7',
                117: '#87d7ff',
                118: '#87ff00',
                119: '#87ff5f',
                120: '#87ff87',
                121: '#87ffaf',
                122: '#87ffd7',
                123: '#87ffff',
                124: '#af0000',
                125: '#af005f',
                126: '#af0087',
                127: '#af00af',
                128: '#af00d7',
                129: '#af00ff',
                130: '#af5f00',
                131: '#af5f5f',
                132: '#af5f87',
                133: '#af5faf',
                134: '#af5fd7',
                135: '#af5fff',
                136: '#af8700',
                137: '#af875f',
                138: '#af8787',
                139: '#af87af',
                140: '#af87d7',
                141: '#af87ff',
                142: '#afaf00',
                143: '#afaf5f',
                144: '#afaf87',
                145: '#afafaf',
                146: '#afafd7',
                147: '#afafff',
                148: '#afd700',
                149: '#afd75f',
                150: '#afd787',
                151: '#afd7af',
                152: '#afd7d7',
                153: '#afd7ff',
                154: '#afff00',
                155: '#afff5f',
                156: '#afff87',
                157: '#afffaf',
                158: '#afffd7',
                159: '#afffff',
                160: '#d70000',
                161: '#d7005f',
                162: '#d70087',
                163: '#d700af',
                164: '#d700d7',
                165: '#d700ff',
                166: '#d75f00',
                167: '#d75f5f',
                168: '#d75f87',
                169: '#d75faf',
                170: '#d75fd7',
                171: '#d75fff',
                172: '#d78700',
                173: '#d7875f',
                174: '#d78787',
                175: '#d787af',
                176: '#d787d7',
                177: '#d787ff',
                178: '#d7af00',
                179: '#d7af5f',
                180: '#d7af87',
                181: '#d7afaf',
                182: '#d7afd7',
                183: '#d7afff',
                184: '#d7d700',
                185: '#d7d75f',
                186: '#d7d787',
                187: '#d7d7af',
                188: '#d7d7d7',
                189: '#d7d7ff',
                190: '#d7ff00',
                191: '#d7ff5f',
                192: '#d7ff87',
                193: '#d7ffaf',
                194: '#d7ffd7',
                195: '#d7ffff',
                196: '#ff0000',
                197: '#ff005f',
                198: '#ff0087',
                199: '#ff00af',
                200: '#ff00d7',
                201: '#ff00ff',
                202: '#ff5f00',
                203: '#ff5f5f',
                204: '#ff5f87',
                205: '#ff5faf',
                206: '#ff5fd7',
                207: '#ff5fff',
                208: '#ff8700',
                209: '#ff875f',
                210: '#ff8787',
                211: '#ff87af',
                212: '#ff87d7',
                213: '#ff87ff',
                214: '#ffaf00',
                215: '#ffaf5f',
                216: '#ffaf87',
                217: '#ffafaf',
                218: '#ffafd7',
                219: '#ffafff',
                220: '#ffd700',
                221: '#ffd75f',
                222: '#ffd787',
                223: '#ffd7af',
                224: '#ffd7d7',
                225: '#ffd7ff',
                226: '#ffff00',
                227: '#ffff5f',
                228: '#ffff87',
                229: '#ffffaf',
                230: '#ffffd7',
                231: '#ffffff',
                232: '#080808',
                233: '#121212',
                234: '#1c1c1c',
                235: '#262626',
                236: '#303030',
                237: '#3a3a3a',
                238: '#444444',
                239: '#4e4e4e',
                240: '#585858',
                241: '#606060',
                242: '#666666',
                243: '#767676',
                244: '#808080',
                245: '#8a8a8a',
                246: '#949494',
                247: '#9e9e9e',
                248: '#a8a8a8',
                249: '#b2b2b2',
                250: '#bcbcbc',
                251: '#c6c6c6',
                252: '#d0d0d0',
                253: '#dadada',
                254: '#e4e4e4',
                255: '#eeeeee',
  }
}
