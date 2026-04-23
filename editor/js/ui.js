var currentworld = null;
var workspace = null;
var myInterpreter = null;

var currentworldFrameSelector = "#stageFrame";
var currentworldHeigth = 350;

function getCurrentMicroworld() {
  return currentworld;
}

function setStepsLabel(steps) {
  var stepsText = $("#stepsText");

  if(stepsText!=null) {
    stepsText.text(steps.toString()+" passo");
    if(steps>1) {
      stepsText.append("s");
    }
  }
}

function setCurrentStepLabel(steps) {
  var stepsText = $("#stepsText");

  if(stepsText!=null) {
    stepsText.text("passo "+steps.toString());
  }
}

function isTimeVisible() {
  el = $("#isTimeVisible");

  if(el!=null) {
    return el.prop('checked');
  }

  return false;
}

function executeCode() {
  console.log("Executing code.")

  currentworld.renderAtEachCommand = true;
  currentworld.reset();

  currentworld.setTimeVisibleMode(isTimeVisible());

  lpRunCode();
  var runFrames = currentworld.getTotalTime();

  currentworld.setPlayTime(runFrames-1);

  setStepsLabel(runFrames);

  var slider = $("#programTimeSlider");
  slider.attr("max", runFrames);
  slider.attr("min", 1);
  slider.attr("step", 1);
  slider.val(runFrames);
  slider.prop('disabled', false);

  console.log("Set slider to max "+runFrames.toString());
}

$(window).on('load', function() {

  $('#runButton').click( function() {
      executeCode();
  });

  $('#stepButton').click( function() {
      stepCode();
  });


  $("#programTimeSlider").prop('disabled', true);
  $("#programTimeSlider").on("input",slideTime);


  $("#isTimeVisible").click(function() {
    currentworld.setTimeVisibleMode(isTimeVisible());
  })

  $("#save_button").click(save);
  $("#load_button").click(load)


  //this code aims to give a visual intuition about moves and angles
  // var blocklyChangingNumber = false;
  // $(document).on("mousedown mouseup mousemove",".blocklyHtmlInput", function(e) {
  //     if(!isTimeVisible) return false;
  //
  //     switch(e.type) {
  //       case "mousedown":
  //           blocklyChangingNumber = true;
  //           break;
  //       case "mousedown":
  //           blocklyChangingNumber = false;
  //           break;
  //       case "mousemove":
  //           if(blocklyChangingNumber) {
  //             var el = $(e.toElement);
  //             var currentValue = parseInt(el.val(),10);
  //
  //             console.log(currentValue);
  //             //tests if currentValue is integer
  //             if (Number.isInteger(currentValue)) {
  //               //ok, we got an int
  //               currentValue += 1;
  //               el.val(currentValue);
  //               executeCode();
  //             }
  //           }
  //           break;
  //     }
  // });

  // $(".blocklyHtmlInput").mousedown = function(e) { blocklyChangingNumber = true; }
  //
  // $(".blocklyHtmlInput").mousemove= function(e) {
  //   if(blocklyChangingNumber) {
  //     console.log(e);
  //   };
  // }
  //
  // $(".blocklyHtmlInput").mouseup = function(e) { blocklyChangingNumber = false; }


  initUI();
});

function initUI() {

  workspace = Blockly.inject('blocklyDiv',
     {media: 'blockly/media/',
      sound: false,
      toolbox: document.getElementById('toolbox')});

  //Blockly.Xml.domToWorkspace(workspace,  document.getElementById('demo') );

  workspace.addChangeListener(lpParseCode);

  setTimeout(function() { Blockly.svgResize(workspace); }, 0);

  // hideChaff() with no argument checks flyout.autoClose and calls
  // clearSelection(), closing the toolbox flyout on every workspace/block
  // mousedown — before the user can drag a block out. The toolbox manages
  // its own lifecycle through tree SELECT events, so clearSelection from
  // hideChaff is unnecessary and harmful here.
  Blockly.hideChaff = function() {
    Blockly.Tooltip && Blockly.Tooltip.hide();
    Blockly.WidgetDiv && Blockly.WidgetDiv.hide();
  };
  window.addEventListener('resize', function() { workspace.resize(); });

  //init the turtle geometry microworldDiv
  var canvasParent = $(currentworldFrameSelector);
  var stageSize = canvasParent.width();
  currentworld = new Microworld(currentworldFrameSelector, stageSize, stageSize);

  //currentworld.penup();
}

function slideTime(event) {
    var slider = $("#programTimeSlider");
    currentworld.setPlayTime(slider.val()-1);
    lpHighlighBlockTime(slider.val()-1);
    setCurrentStepLabel(slider.val());

    currentworld.refresh();
}


function stepCode() {
  var slider = $("#programTimeSlider");
  var value = parseInt(slider.val());

  if(value!=null) {
    value += 1;
    slider.val(value);
  }

  slideTime(null);
}



/*****************************************************************************'
 * SAVE AND RESTORE UI EVENTS AND FUNCTIONS
 *
 *****************************************************************************/
function load() {
    var list = $("#microworlds_list"); //gets list element
    var worlds = getSavedWorldsList(); // load saved worlds

    list.empty(); //clears list

    worlds.forEach(function(item) {
       var worldInfo = getSaveMicroworld(item);

       if(worldInfo!=null) {
         var str = '<li class="collection-item">'
              + '<span class="title">' + worldInfo.name +  '</span>'
              + '<p>Autor: ' + worldInfo.author
              + '<a href="#!" class="secondary-content load-modal-item" data-key="'+item+'"><i class="material-icons">cloud_download</i></a>'
              + '<a href="#!" class="secondary-content download-modal-item" data-key="'+item+'"><i class="material-icons">file_download</i></a>'
              + '</li>';

         list.append(str);
       }

    });


    $(".load-modal-item").click(modalLoad);
    $(".download-modal-item").click(modalDownload);

    $('#load_modal').openModal();
}

function modalLoad(event) {
  var el = $(this);
  var key = el.data("key");

  if(key!=null) {
    var worldInfo = getSaveMicroworld(key);

    if(worldInfo!=null) {
        restoreMicroworld(worldInfo);
        $('#load_modal').closeModal();
        Materialize.toast('Micro-mundo carregado com sucesso', 3000, 'rounded')
        return true;
    }
  }

  $('#load_modal').closeModal();
  Materialize.toast('Opsss! Algum problema aconteu lendo seu micro mundo.', 3000, 'rounded')
}

function modalDownload(event) {
  var el = $(this);
  var key = el.data("key");

  if(key!=null) {
    var worldInfo = getSaveMicroworld(key);
    var filename = ((worldInfo.name==null)?"Micromundo":worldInfo.name)+".mw";

    if(worldInfo!=null) {
      //this thing is really hard to get working and undocumented
      //in the data, the comma marks where the download data will start. All other elements separated by ; are parameters
      downloadDataURI($, {filename: filename,data:"data:application/octet-stream; charset=utf-16le; base64,"+encodeURIComponent(JSON.stringify(worldInfo))});
    }
  }
}


function save() {
    $("#save_modal_save").click(modalSave);

    if(currentworld.microworldName=="") {
      $('#save_modal').openModal();
    } else {
      saveMicrowold();
    }
}

function modalSave() {
  var input_name = $("#microworld_name");
  var input_author = $("#microworld_author");

  if(input_name.val()!="") {
    currentworld.microworldName = input_name.val();
    currentworld.microworldAuthor = input_author.val();
    saveMicrowold();
    $('#save_modal').closeModal();
  }
}
