function lpInitApi(interpreter, scope) {
  // Add an API function for the alert() block.
  var wrapper = function(text) {
    text = text ? text.toString() : '';
    return interpreter.createPrimitive(alert(text));
  };
  interpreter.setProperty(scope, 'alert',
      interpreter.createNativeFunction(wrapper));

  // Add an API function for the prompt() block.
  var wrapper = function(text) {
    text = text ? text.toString() : '';
    return interpreter.createPrimitive(prompt(text));
  };
  interpreter.setProperty(scope, 'prompt',
      interpreter.createNativeFunction(wrapper));

  // Add an API function for highlighting blocks.
  var wrapper = function(id) {
    id = id ? id.toString() : '';
    return interpreter.createPrimitive(highlightBlock(id));
  };
  interpreter.setProperty(scope, 'highlightBlock',
      interpreter.createNativeFunction(wrapper));

  wrapper = function(steps) {
        steps = steps ? steps.toString() : '';
        return interpreter.createPrimitive(moveCT(steps));
  };
  interpreter.setProperty(scope, 'moveCT',
      interpreter.createNativeFunction(wrapper));

  wrapper = function(degrees) {
        degrees = degrees ? degrees.toString() : '';
        return interpreter.createPrimitive(turnCT(degrees));
  };
  interpreter.setProperty(scope, 'turnCT',
      interpreter.createNativeFunction(wrapper));

  wrapper = function(value) {
        value = value ? value.toString() : '';
        return interpreter.createPrimitive(setpenmodeCT(value));
  };
  interpreter.setProperty(scope, 'setpenmodeCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(value) {
        value = value ? value.toString() : '';
        return interpreter.createPrimitive(setturtlemodeCT(value));
  };
  interpreter.setProperty(scope, 'setturtlemodeCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(value) {
        value = value ? value.toString() : '';
        return interpreter.createPrimitive(setcolorCT(value));
  };
  interpreter.setProperty(scope, 'setcolorCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(value) {
        value = value ? value.toString() : '';
        return interpreter.createPrimitive(setwidthCT(value));
  };
  interpreter.setProperty(scope, 'setwidthCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(value) {
        value = value ? value.toString() : '';
        return interpreter.createPrimitive(setfontsizeCT(value));
  };
  interpreter.setProperty(scope, 'setfontsizeCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(value) {
        value = value ? value.toString() : '';
        return interpreter.createPrimitive(setheadingCT(value));
  };
  interpreter.setProperty(scope, 'setheadingCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(value) {
        value = value ? value.toString() : '';
        return interpreter.createPrimitive(setstateCT(value));
  };
  interpreter.setProperty(scope, 'setstateCT', interpreter.createNativeFunction(wrapper));

  // X,Y Functions
  wrapper = function(x,y) {
        x = x ? x.toString() : '';
        y = y ? y.toString() : '';
        return interpreter.createPrimitive(setpositionCT(x,y));
  };
  interpreter.setProperty(scope, 'setpositionCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(x,y) {
        x = x ? x.toString() : '';
        y = y ? y.toString() : '';
        return interpreter.createPrimitive(towardsCT(x,y));
  };
  interpreter.setProperty(scope, 'towardsCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(x,y) {
        x = x ? x.toString() : '';
        y = y ? y.toString() : '';
        return interpreter.createPrimitive(drawtextCT(x,y));
  };
  interpreter.setProperty(scope, 'drawtextCT', interpreter.createNativeFunction(wrapper));

  wrapper = function(angle,radius) {
        angle = angle ? angle.toString() : '';
        radius = radius ? radius.toString() : '';
        return interpreter.createPrimitive(arcCT(angle,radius));
  };
  interpreter.setProperty(scope, 'arcCT', interpreter.createNativeFunction(wrapper));

  //UNARY OPERATORS
  wrapper = function() {
        return interpreter.createPrimitive(penupCT());
  };
  interpreter.setProperty(scope, 'penupCT',
      interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(pendownCT());
  };
  interpreter.setProperty(scope, 'pendownCT',
      interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getpenmodeCT());
  };
  interpreter.setProperty(scope, 'getturtlemodeCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getpenmodeCT());
  };
  interpreter.setProperty(scope, 'getturtlemodeCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(ispendownCT());
  };
  interpreter.setProperty(scope, 'ispendownCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getcolorCT());
  };
  interpreter.setProperty(scope, 'getcolorCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getwidthCT());
  };
  interpreter.setProperty(scope, 'getwidthCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getfontsizeCT());
  };
  interpreter.setProperty(scope, 'getfontsizeCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(clearscreenCT());
  };
  interpreter.setProperty(scope, 'clearscreenCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(homeCT());
  };
  interpreter.setProperty(scope, 'homeCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(clearCT());
  };
  interpreter.setProperty(scope, 'clearCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(showCT());
  };
  interpreter.setProperty(scope, 'showCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(hideCT());
  };
  interpreter.setProperty(scope, 'hideCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(isturtlevisibleCT());
  };
  interpreter.setProperty(scope, 'isturtlevisibleCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getheadingCT());
  };
  interpreter.setProperty(scope, 'getheadingCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getxyCT());
  };
  interpreter.setProperty(scope, 'getxyCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(fillCT());
  };
  interpreter.setProperty(scope, 'fillCT', interpreter.createNativeFunction(wrapper));

  wrapper = function() {
        return interpreter.createPrimitive(getstateCT());
  };
  interpreter.setProperty(scope, 'getstateCT', interpreter.createNativeFunction(wrapper));

}

var time_block_mapping = new Array();
var highlightPause = false;

function highlightBlock(id) {
  currentworld.render();
  time_block_mapping.push(id);
}

function lpHighlighBlockTime(time) {
  // var block_id = null;
  // for(var i=0; i<time_block_mapping.length; i++) {
  //   var blocktime = time_block_mapping[i];
  //   if (blocktime.time == time) {
  //     block_id = blocktime.block;
  //     break;
  //   }
  // }
  var block_id = time_block_mapping[time];
  workspace.highlightBlock(block_id);
}

function lpParseCode() {
  // Generate JavaScript code and parse it.
  Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
  Blockly.JavaScript.addReservedWords('highlightBlock');
  var code = Blockly.JavaScript.workspaceToCode(workspace);

  myInterpreter = new Interpreter(code, lpInitApi);
  console.log(code);

  document.getElementById('runButton').disabled = '';
  //highlightPause = false;
  workspace.traceOn(true);

  workspace.highlightBlock(null);
}


function lpRunCode() {
  time_block_mapping = new Array(); //empties the time_block map
  lpParseCode();
  myInterpreter.run();
}


function lpStepCode() {
  try {
    var ok = myInterpreter.step();
  } finally {
    if (!ok) {
      // Program complete, no more code to execute.
      document.getElementById('stepButton').disabled = 'disabled';
      return;
    }
  }
  if (highlightPause) {
    // A block has been highlighted.  Pause execution here.
    highlightPause = false;
  } else {
    // Keep executing until a highlight statement is reached.
    stepCode();
  }
}
