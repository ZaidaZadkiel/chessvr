// import

import * as actions   from './actions';
import * as gamepad   from './gamepad';
import * as keyboard  from './keyboard';
import * as state     from './state';
import * as xrcontrol from './xrcontrol';


function init(renderer, options){

  let _opt = {...options}; // avoid undefined||null||""
  if(!_opt || Object.keys(_opt).length) _opt.keyboard = true; // keyboard always enabled

  if(import.meta.env.VITE_DEBUG) console.info("input: options", options )

  // if options has actions key, we shallow-copy the array to prevent outside mutation
  if(
        Boolean(_opt.actions)
    &&  Array.isArray(_opt.actions)
  ) actions.set_input_actions(_opt.actions);

  let starting = {index: 0}
  actions.input_actions.forEach( x=>(starting[x] = 0) )
  state.input_state[0] = starting;

  let defaults = _opt.defaults;

  if( Boolean(_opt.defaults) ){
    actions.set_mapping("keyboard",  defaults.keyboard);
    actions.set_mapping("gamepad",   defaults.gamepad);
    actions.set_mapping("xrcontrol", defaults.xrcontrol);
  }

  if(Boolean(_opt.keyboard)  === true) { keyboard.input_init();  }
  if(Boolean(_opt.gamepad)   === true) { gamepad.input_init();   }
  if(Boolean(_opt.xrcontrol) === true) {
    if(Boolean(renderer) == false) throw Error("xr must be present when xrcontrol enabled");
    console.log("renderer for xr")
    if(!renderer)    throw Error("No puede activarse control XR sin renderer");
    if(!renderer.xr) throw Error("Modo XR no esta activado en renderer");
    xrcontrol.input_init(renderer);
  }

  if(import.meta.env.VITE_DEBUG) console.log("input: mapping", actions.get_mapping())
}

function poll_gamepads(){
  // console.log("hi")
  gamepad.poll_gamepads();
  // xrcontrol.poll_gamepads()
}

export const input = {
  actions,
  gamepad,
  keyboard,
  state,
  xrcontrol,
  init,
  poll_gamepads: gamepad.poll_gamepads
}
