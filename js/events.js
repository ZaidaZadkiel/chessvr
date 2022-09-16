
let _events={};

function addEvent(strEvent, fnAction){
  console.info("addEvent",{strEvent, fnAction});

  if(!strEvent || !fnAction)          return console.error("trying to add empty event name or empty callback", strEvent, fnAction);
  if(!(fnAction instanceof Function)) return console.error("callback to add is not a function");
  if(!_events[strEvent])              _events[strEvent] = [];

  _events[strEvent].push(fnAction);
  return fnAction;
}

function removeEvent(strEvent, fnAction){
  if(!strEvent || !fnAction)          return console.error("trying to remove empty event name or empty callback");
  if(!(fnAction instanceof Function)) return console.error("callback to remove is not a function");
  if(!_events[strEvent])              return console.error("trying to remove inexistent callback");

  _events[strEvent] = _events[strEvent].filter(fn=>fn!==fnAction);
}

function notifyEvent(strEvent, objData){
  if(!strEvent) console.error("trying to notify empty event");
  if(!_events[strEvent]) return; //do nothing for existing events without added handlers

  for(let evt of _events[strEvent]) evt(objData);
}

export {
  addEvent,
  removeEvent,
  notifyEvent
}
