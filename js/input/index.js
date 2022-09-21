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
    // console.log("renderer for xr")
    if(!Boolean(renderer))    throw Error("renderer must be present when xrcontrol enabled");
    if(!Boolean(renderer.xr)) throw Error("Modo XR no esta activado en renderer");

    xrcontrol.input_init(renderer);
  }

  if(import.meta.env.VITE_DEBUG) console.log("input: mapping", actions.get_mapping())
}

function poll_gamepads(){
  console.log(
    "poll_gamepads",
    "gamepad",   state.gamepad_enabled,
    "xrcontrol", state.xrcontrol_enabled)

  if(state.gamepad_enabled)   gamepad.poll_gamepads();
  if(state.xrcontrol_enabled) xrcontrol.readVRGamepad()
}

export const input = {
  actions,
  state,
  init,
  gamepad,
  keyboard,
  xrcontrol,
  poll_gamepads
}
