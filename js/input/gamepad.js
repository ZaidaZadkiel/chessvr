import { inputdevice_events }       from '../constants';
import { notifyEvent }              from '../events';
import {
  gamepad_mapping,
  input_actions
} from './actions';
import {
  input_state,
  input_index,
  push_input_state
} from './state';

let current_gamepad    = 0;
let gamepads           = [];
let gp                 = null;
let last_gamepad_state = { ...input_state[input_index], index: input_index };

function poll_gamepads() {
  gamepads = navigator.getGamepads
		? navigator.getGamepads()
		: (navigator.webkitGetGamepads
				? navigator.webkitGetGamepads
				: []
			);

  // console.log({gamepads});

  if(gamepads && gamepads[current_gamepad]) return readGamepad();
}

function readGamepad(){
  if(gamepads[current_gamepad]) update_input_state(gamepad_mapping, gamepads[current_gamepad]);
}

function update_input_state(gp_mapping, gp) {
  let input_frame = {...last_gamepad_state, index: input_index};
  let change      = 0;

  for (var action of input_actions) {
    if(!gp_mapping[action]) {
      console.warn(`action: '${action}' was not found in mapping object, this is a noop`);
      continue;
    }

    const neg    = gp_mapping[action].negative; //button/axis index for negative value
    const pos    = gp_mapping[action].positive; //button/axis index for positive value
    const poslen = pos.length; // negative can not exist; positive must always exist
    let   invert = 1;

    for (var i = 0; i < poslen; i++) {
      invert = (Object.is(pos[i], -0) // check for exact value -0
          ? -1                        // cast (-0) -> -1
          : Math.sign(pos[i]||1)      // 1 | -1, casts 0->1
      );

      //if pos[i] is a number outside of gp.buttons length return 0
      let v = (gp.buttons[Math.abs(pos[i])] && gp.buttons[Math.abs(pos[i])].value) || 0;

      if( neg && Number.isInteger(neg[i]) ){ //axis has both negative and positive
        input_frame[action] = invert * Math.round(gp.axes   [Math.abs(neg[i])] * 2 ) / 2;
      } else {      //button has only positive on/off
        input_frame[action] = invert * v
      }
    }
    // if(gp_mapping[action].invert) input_frame[action] *= -1; //invert sign

    change += (
      Math.abs(
					(last_gamepad_state[action] || 0)
				- input_frame[action]
			)
    );
  }

  if(change>0) {
    // console.log(input_frame, gp)
    push_input_state(input_frame);
    last_gamepad_state = input_frame;
  }

}


function gamepad_handler(event, connecting) {
  console.log("gamepad_handler", event, connecting);

  var gamepadEvt = event.gamepad;

  if (connecting) {
    let gptest     = gamepadEvt;
    let setcurrent = false;
    let axislen    = gptest.axes.length
    let btnlen     = gptest.buttons.length

    for (var i = 0; i < axislen; i++) if( Boolean(gptest.axes[i]))             {setcurrent=true; break;}
    for (var i = 0; i < btnlen;  i++) if( Boolean(gptest.buttons[i].pressed) ) {setcurrent=true; break;}

    if(setcurrent) current_gamepad = gamepadEvt.index;

    gamepads[gamepadEvt.index] = gamepadEvt;
    notifyEvent(inputdevice_events.connected, gamepadEvt);

  } else {
    delete gamepads[gamepadEvt.index];
    notifyEvent(inputdevice_events.disconnected, gamepadEvt);
  }
}

function input_init(){
  window.addEventListener( "gamepadconnected",    function(e) { gamepad_handler(e, true); },  false);
  window.addEventListener( "gamepaddisconnected", function(e) { gamepad_handler(e, false); }, false);
}


export {
  input_init,
  update_input_state,
  poll_gamepads
}
