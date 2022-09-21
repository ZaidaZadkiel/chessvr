import { notifyEvent }      from '../events';
import {
  keyboard_mapping,
  input_actions
} from './actions';
import {
  inputdevice_events
} from '../constants'
import {
  keyboard_enabled,
  push_input_state,
  input_state,
  input_index
} from './state'

console.log("input keyboard")

let keyboard_keys = [];

function set_keyboard_state(event){
  let   input_frame  = {...input_state[input_index], index: input_index}
  const len          = input_actions.length;
  let   action       = ""
  let   action_count = 0;

  // console.log("keyboard", event)

  for (var i = 0; i < len; i++) {
    // console.log(i, input_actions[i])
    action = input_actions[i];

    if(!keyboard_mapping[action]) {
      console.warn(`keyboard action: '${action}' was not found in mapping object, this is a noop`);
      return;
    }

    const keyact = keyboard_mapping[action];
    const poslen = keyact.positive.length
    let   value  = 0;

    for (var n = 0; n < poslen; n++) {
      // console.log(keyact.positive[n], keyboard_keys[keyact.positive[n]])
      if(keyact.positive && keyboard_keys[keyact.positive[n]]) value+=1;
      if(keyact.negative && keyboard_keys[keyact.negative[n]]) value-=1;
    } // for (var i = 0; i < poslen; i++)
    // input_frame[action] = Math.sign(input_frame[action]);
    action_count+=Math.abs(value);
    input_frame[action] = value;
  } // for (var i = 0; i < len; i++)

  push_input_state(input_frame);

  if(action_count) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  return false;
  // console.log(input_frame)
}


function onDocumentKeyUp(event) {

  keyboard_keys[event.keyCode] = false;
  if(set_keyboard_state(event)) event.preventDefault();

  return notifyEvent( inputdevice_events.action, event);
}

function onDocumentKeyDown(event) {
  if(event.repeat){
    //we know this same-key presed was handled, therefore we can prevent it
    event.preventDefault(); // prevent tab change focus when left down
    event.stopPropagation();
    return true;
  }

  keyboard_keys[event.keyCode] = true;
  if(set_keyboard_state(event)) event.preventDefault();

  return notifyEvent( inputdevice_events.action_down, event);
}


function input_init(){
  notifyEvent( inputdevice_events.connected, {keyboard: keyboard_mapping});
  document.addEventListener( "keydown", onDocumentKeyDown,true);
  document.addEventListener( "keyup",   onDocumentKeyUp,  true);
}

export {
  input_init
}
