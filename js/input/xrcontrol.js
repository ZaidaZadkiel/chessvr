import {
  // input_state,
  // input_index,
  update_input_state
} from './gamepad';
import { xrcontrol_mapping } from './actions';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

let controllerL,     controllerR;
let controllerGripL, controllerGripR;
let controls,        group;
let gp;

function onSelectEnd  (...e){ console.log(e)}
function onSelectStart(...e){ console.log(e)}

function readVRGamepad(){
  // if(
  //       (get_XRController().controllerL && get_XRController().controllerL.gamepad)
  //   ||  (get_XRController().controllerR && get_XRController().controllerR.gamepad)
  // )

  if(get_XRController().controllerL.gamepad) gp = get_XRController().controllerL.gamepad;
  if(get_XRController().controllerR.gamepad) gp = get_XRController().controllerR.gamepad;
  // console.log("gp", gp)

  if(gp) update_input_state(xrcontrol_mapping, gp);
  // gp = get_XRController().controllerR.gamepad;
}


let vr_controllers = {
    controllerL    : controllerL,
    controllerR    : controllerR,
    controllerGripL: controllerGripL,
    controllerGripR: controllerGripR
}

function get_XRController(){
  vr_controllers = {
      controllerL    : controllerL,
      controllerR    : controllerR,
      controllerGripL: controllerGripL,
      controllerGripR: controllerGripR
  }
  return vr_controllers;
}



function input_init(renderer){
  const controllerModelFactory = new XRControllerModelFactory();

  // xrcontrol_enabled = true;
  controllerL       = renderer.xr.getController(0);
  controllerR       = renderer.xr.getController(1);
  // console.log(
  //   controllerL,
  //   controllerR
  // )

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
    }
  );

  controllerR.addEventListener(
    'connected',
    (e) => {
      controllerR.gamepad = e.data.gamepad;
      console.log(controllerR.gamepad)
      console.log(controllerR.gamepad.axes)
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
