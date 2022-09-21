import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { inputdevice_events }       from '../constants';
import { notifyEvent }              from '../events';
import {
  xrcontrol_mapping,
  input_actions
} from './actions';
import {
  input_state,
  input_index,
  push_input_state
} from './state';


let controllerL,     controllerR;
let controllerGripL, controllerGripR;
let controls,        group;
let gp;

let last_gamepad_state = { ...input_state[input_index], index: input_index };

let vr_controllers = {
    controllerL    : controllerL,
    controllerR    : controllerR,
    controllerGripL: controllerGripL,
    controllerGripR: controllerGripR
}

function get_XRController(){
  return (
    vr_controllers
      ? vr_controllers
      : (
          vr_controllers = {
            controllerL    : controllerL,
            controllerR    : controllerR,
            controllerGripL: controllerGripL,
            controllerGripR: controllerGripR
          }
        )
  )
}

function onSelectEnd  (...e){ console.log(e)}
function onSelectStart(...e){ console.log(e)}

const AXIS   = 1;
const BUTTON = 0;

function readVRGamepad(){
  // console.log("readVRGamepad")

  let input_frame = {...last_gamepad_state, index: input_index};
  let change      = 0;

  for (var action of input_actions) {
    let mapping = xrcontrol_mapping[action];
    console.log({action})

    if(!mapping) {
      console.warn(`action: '${action}' was not found in mapping object, this is a noop`);
      continue;
    }

    let hands_gp       = [controllerL.gamepad, controllerR.gamepad];
    let hands_action   = [mapping.left, mapping.right]; // simplify structure
    let hand_actionmap = {};

    // [ hands_action[0] -> mapping.left , hands_action[1] -> mapping.right ]
    // hand_actionmap = hands_action[n]
    // side => 0 .. 1
    let side=0
    for(side=0; side<2 ; side++){
      hand_actionmap = hands_action[ side ]
      if(!hand_actionmap){
        console.log(`${action} has no ${side==0 ? "left" : "right"} mapping`);
        continue;
      }
    // while(  != null ){  // what in the C
      // console.log({hand_actionmap, hands_action, side}, hands_gp)

      const neg    = hand_actionmap.negative; //button/axis index for negative value
      const pos    = hand_actionmap.positive; //button/axis index for positive value
      const poslen = pos.length; // negative can not exist; positive must always exist
      const type   = (neg && pos)
                        ? AXIS // axis have positive and negative axis
                        : BUTTON // button can have only positive value or zero

      let   invert = 1;

      for (var i = 0; i < poslen; i++) {
        console.log(
          action,
          {i, type, poslen, pos, neg},
          type===AXIS ? "axis" : "buttan",
          type===AXIS ? hands_gp[side].axes[i] : ( (hands_gp[side].buttons[i]) ? hands_gp[side].buttons[i].value : "OOB" )
        )

        invert =  (Object.is(pos[i], -0) // check for exact value -0
                      ? -1                        // cast (-0) -> -1
                      : Math.sign(pos[i]||1)      // 1 | -1, casts 0->1
                  );

        let v;
        switch (type) {
          case AXIS:
            input_frame[action]   = invert * Math.round(hands_gp[side].axes[    Math.abs(neg[i]) ] * 2 ) / 2;
            break;
          case BUTTON:
            if(hands_gp[side].buttons[ Math.abs(pos[i]) ]) { // BAD. Figure a way to fix the double lookup and if
              input_frame[action] = invert * hands_gp[side].buttons[ Math.abs(pos[i]) ].value || 0;
            }
            break;
        }
        //if pos[i] is a number outside of hands_gp[side].buttons length return 0

        // if( neg && Number.isInteger(neg[i]) ){ //axis has both negative and positive
        // } else {      //button has only positive on/off
        //   input_frame[action] = invert * v
        // }
      }

      change += (
        Math.abs(
  					(last_gamepad_state[action] || 0)
  				- input_frame[action]
  			)
      );
    }
  }

  if(change>0) {
    console.log(input_frame, hands_gp)
    push_input_state(input_frame);
    last_gamepad_state = input_frame;
  }
}






function input_init(renderer){
  const controllerModelFactory = new XRControllerModelFactory();

  console.log(renderer.xr)
  controllerL = renderer.xr.getController(0);
  controllerR = renderer.xr.getController(1);

  console.log(
    "input xrcontroller input_init:",
    controllerL,
    controllerR
  )

  controllerL.addEventListener(
    'connected',
    (e) => {
      console.log(e)
      if(e.data.handedness === "right"){
        controllerR.gamepad = e.data.gamepad;
        console.log(controllerR.gamepad.axes);
      } else {
        controllerL.gamepad = e.data.gamepad;
        console.log(controllerL.gamepad.axes);
      }
      console.log("xrcontrol left:", e.data);

      notifyEvent(inputdevice_events.connected, e);
    }
  );

  controllerR.addEventListener(
    'connected',
    (e) => {
      controllerR.gamepad = e.data.gamepad;
      console.log("xrcontrol right:", e.data);

      notifyEvent(inputdevice_events.connected, e);
    }
  );

  controllerGripL = renderer.xr.getControllerGrip( 0 );
  controllerGripL.add( controllerModelFactory.createControllerModel( controllerGripL ) );

  controllerGripR = renderer.xr.getControllerGrip( 1 );
  controllerGripR.add( controllerModelFactory.createControllerModel( controllerGripR ) );

  controllerL.addEventListener( 'selectstart',         onSelectStart );
  controllerL.addEventListener( 'selectend',           onSelectEnd );
  controllerR.addEventListener( 'selectstart',         onSelectStart );
  controllerR.addEventListener( 'selectend',           onSelectEnd );

}


export {
  input_init,
  readVRGamepad
}
