function saveFormat(name, author, xml) {
  this.name = name;
  this.author = author;
  this.code = Blockly.Xml.domToText(xml);
}

function restoreMicroworld(mw) {
    currentworld.reset();
    delete currentwold;

    $("canvas").remove();



    //init the turtle geometry microworldDiv
    var canvasParent = $(currentworldFrameSelector);
    currentworld = new Microworld(currentworldFrameSelector, canvasParent.width(), currentworldHeigth);

    currentworld.name = mw.name;
    currentworld.author = mw.author;

    Blockly.mainWorkspace.clear(); //clears thr workspace
    var dom = Blockly.Xml.textToDom(mw.code);
    Blockly.Xml.domToWorkspace(workspace,  dom );
}

function saveMicroworldDump() {
  var xml = Blockly.Xml.workspaceToDom(workspace);

  var saveObj = new saveFormat(currentworld.microworldName, currentworld.microworldAuthor,xml) ;

  return JSON.stringify(saveObj);
}


function getSavedWorldsList() {
  var worldsStr = window.localStorage.getItem("microworlds");
  var worlds = new Array();
  if(worldsStr!=null) {
    worlds = JSON.parse(worldsStr);
  }

  return worlds;
}

function getSaveMicroworld(key) {
    return JSON.parse(window.localStorage.getItem(key));
}

function saveMicrowold() {
  if(currentworld.microworldName!="") {
      var worlds = getSavedWorldsList();

      var key = "microwold_"+currentworld.microworldId;
      window.localStorage.setItem(key, saveMicroworldDump()) ;

      if($.inArray(key, worlds)<0) {
        worlds.push(key);
        window.localStorage.setItem("microworlds", JSON.stringify(worlds)) ;
      }
    }
    return false;
}

var downloadDataURI = function($, options) {
    if(!options)
        return;
    $.isPlainObject(options) || (options = {data: options});

    window.location = options.data;

    options.filename || (options.filename = "download." + options.data.split(",")[0].split(";")[0].substring(5).split("/")[1]);
    options.url || (options.url = "http://download-data-uri.appspot.com/");
    $('<form method="post" action="'+options.url+'" style="display:none"><input type="hidden" name="filename" value="'+options.filename+'"/><input type="hidden" name="data" value="'+options.data+'"/></form>').submit().remove();
}
