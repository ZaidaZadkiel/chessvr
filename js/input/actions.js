import {inputdevice_events} from '../constants';
import {
  notifyEvent
  // addEvent
} from "../events";
import {
  gamepad_enabled,
  keyboard_enabled,
  xrcontrol_enabled
} from './state';

var input_actions=[
  "updown",
  "leftright",
  "action",
  "cancel"
]

let keyboard_mapping = {
  updown   : { positive: [38], negative: [40] },
  leftright: { positive: [37], negative: [39] },
  action   : { positive: [13]},
  cancel   : { positive: [27]},
}

let gamepad_mapping = {
  updown   : { positive: [1], negative: [1] },
  leftright: { positive: [0], negative: [0] },
  action   : { positive: [2]},
  cancel   : { positive: [1]},
}

let xrcontrol_mapping = { // ???
  updown   : { positive: [0], negative: [0] },
  leftright: { positive: [0], negative: [0] },
  action   : { positive: [0]},
  cancel   : { positive: [0]},
}

function get_actions(){
  if(input_actions && Array.isArray(input_actions)) return input_actions; //recorded actions
  return []; // no actions
}

function get_mapping(){
  return (
    {
      gamepad  : gamepad_enabled   || false,
      keyboard : keyboard_enabled  || false,
      xrcontrol: xrcontrol_enabled || false,
      actions  : input_actions,
      defaults : {
        keyboard : keyboard_mapping,
        gamepad  : gamepad_mapping,
        xrcontrol: xrcontrol_mapping
      }
    }
  );
}

function set_mapping(strInput, mapping){
  // console.log({strInput, mapping});
  switch(strInput){
    case "keyboard":  keyboard_mapping  = mapping
    case "gamepad":   gamepad_mapping   = mapping
    case "xrcontrol": xrcontrol_mapping = mapping
  }
  notifyEvent(inputdevice_events.changed, {[strInput]: mapping});
  // obj = {mapping}
}

function set_input_actions(actions){
  input_actions = [...actions]
}

export {
  input_actions,
  set_input_actions,
  keyboard_mapping,
  gamepad_mapping,
  xrcontrol_mapping,
  set_mapping,
  get_mapping
}
