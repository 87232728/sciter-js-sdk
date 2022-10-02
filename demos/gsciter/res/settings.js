
import * as env from "@env";
import * as sys from "@sys";

import {encode,decode} from "@sciter";

var path;
var list = []; // list of persistable objects
var data = {}  // the data being persisted

// persistable settings

export async function store() 
{
  console.log("Settings.store",path);

  if(!path)
    return;

  var file;

  try {
    file = await sys.fs.open(path,"w+",0o666);
    for(var persistable of list)
      persistable.store(data);
    await file.write(encode(JSON.stringify(data, null, "  "),"utf-8"));
  } catch(e) {
    Window.modal(<warning>Cannot open file {path} for writing.<br/>{e}<br/>Settings will not be saved.</warning>);
  }
  finally {
    if(file) file.close();
  }
}

async function restore() 
{
  var buffer;

  try {
    buffer = await sys.fs.readFile(path,"r");
  } catch(e) {
    return false;
  }

  try {
    data = JSON.parse( decode(buffer,"utf-8") );
    for(var persistable of list)
      persistable.restore(data);
  }
  catch(e) { 
    console.error("Restore error:",e); 
  }
}

export function add(persistable) { list.push(persistable); }

// window position persistence
add({
  store : function(data) 
    {
       var [x,y,w,h] = Window.this.box("xywh","border","screen");
       data.window = {left:x,top:y,width:w,height:h};  
    },
  restore : function(data) 
    {
      if( data.window ) {
        var x = Math.max(data.window.left,0);
        var y = Math.max(data.window.top,0);
        var w = Math.max(data.window.width,800);
        var h = Math.max(data.window.height,600); 
        Window.this.move(x,y); // move to monitor 
        Window.this.move(x,y,w,h); // replace on monitor
      }
    }
});
  
export function requestSave()
{
  if(!document.parentWindow) {
    Window.this.off(requestSave); // document is unloaded
    return;
  }
  // throttled request to store the data
  document.timer(1000,store);
}

Window.this.on("move",requestSave)
           .on("size",requestSave);

export async function init(APP_NAME) {
  path = env.path("appdata", APP_NAME + ".json");
  await restore();
}

export function storeItem(name, itemData) {
  data[name] = itemData;
  requestSave();
}

export function fetchItem(name) {
  return data[name];
}

Window.this.persistent = {
  add: add, 
  requestSave: requestSave,
  storeItem: storeItem,
  fetchItem: fetchItem,
};

