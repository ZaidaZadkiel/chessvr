
import {
  notifyEvent,
  addEvent
} from "../events";
import { inputdevice_events }       from "../constants";

const debug_log = (...t)=>console.info("input", t);

/*
options = {
  gamepad  : bool,
  keyboard : bool,
  xrcontrol: bool,
  actions: [ String, ... ],
  defaults: {
    keyboard : { action_name: { positive: Number, positive: Number }, ... }
    gamepad  : { action_name: { positive: Number, positive: Number }, ... }
    xrcontrol: { action_name: { positive: Number, positive: Number }, ... }
  }
}
if !options default input is keyboard

Example:

input.init(
  renderer,
  {
    keyboard : true,
    gamepad  : true,
    xrcontrol: true,
    actions  : [
      "updown",
      "leftright",
      "action",
      "cancel",
      "userlist",
      "lookaround",
      "rotateview",
    ],
    defaults: {
      keyboard: {
        updown    : { positive: [38, 87], negative: [40, 83] },
        leftright : { positive: [37, 65], negative: [39, 68] },
        rotateview: { positive: [69],     negative: [81]},
        action    : { positive: [13]},
        cancel    : { positive: [27]},
        userlist  : { positive: [ 9]},
        lookaround: { positive: [32]},
      },
      gamepad: {
        updown    : { positive: [-1], negative: [-1] },
        leftright : { positive: [-0], negative: [-0] },
        rotateview: { positive: [ 2], negative: [ 2]},
        action    : { positive: [ 2]},
        cancel    : { positive: [ 1]},
      },
      xrcontrol: { // ???
        updown    : { positive: [ 1], negative: [ 1] },
        leftright : { positive: [-0], negative: [-0] },
        action    : { positive: [ 0]},
        cancel    : { positive: [ 1]},
      }
    }
  }
); // input
*/

var keyboard_enabled  = false;
var gamepad_enabled   = false;
var xrcontrol_enabled = false;

var input_index = 0;
var input_state = new Array(20).fill({});

function get_state(index){
  // console.log(input_state[input_index])
  if(index===-1) return (
    input_state
    .slice(input_index)
    .concat(
      input_state.slice(0, input_index)
    )
  );

  if(index >= 0) return input_state[index]

  return input_state[input_index];
}

function push_input_state(input_frame){
  input_state[
    input_index=(
      (input_index||20)-1
    )
  ] = input_frame;
  notifyEvent(inputdevice_events.changed, input_frame);
  // console.log("input changed", input_frame)
}

// let inputdevice_events = {
//   changed     : "changed",
//   connected   : "connected",
//   disconnected: "disconnected",
//   error       : "error",
//   action      : "action",
//   action_down : "action_down"
// }

addEvent(
  inputdevice_events.connected,
  (e)=>{
    console.log(
      "state: input connected",
      {
        "keyboard" : e.keyboard,
        "gamepad"  : e.gamepad,
        "xrcontrol": e.data && e.data.gamepad
      },
      "event", e
    );

    if(e.keyboard)               { console.log("keyboard_enabled?", keyboard_enabled  = true) }
    if(e.gamepad)                { console.log("gamepad_enabled?", gamepad_enabled   = true) }
    if(e.data && e.data.gamepad) { console.log("xrcontrol_enabled?", xrcontrol_enabled = true) }

    if(xrcontrol_enabled){
        console.log(
          {
            id        : e.data.gamepad.id,
            buttons   : e.data.gamepad.buttons.length,
            axis      : e.data.gamepad.axes.length,
            handedness: e.data.handedness,
          },
          e.gamepad
        )
    }

    if(gamepad_enabled){
        console.log(
          {
            id        : e.gamepad.id,
            buttons   : e.gamepad.buttons.length,
            axis      : e.gamepad.axes.length,
            handedness: e.data.handedness,
          },
          e.gamepad
        )
    }
  }
);


export {
  push_input_state,
  input_state,
  input_index,

  gamepad_enabled,
  keyboard_enabled,
  xrcontrol_enabled
}
