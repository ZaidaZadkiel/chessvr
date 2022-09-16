import * as THREE from "three";
import { scene }    from './scene';
import { chess }    from './chess';
import { input }    from './input/';
import { addEvent } from './events';
import * as constants from './constants';

let board = [
  ["BT0", "BH0", "BR0",  "BK",  "BQ", "BR1", "BH1", "BT1"],
  ["BP0", "BP1", "BP2", "BP3", "BP4", "BP5", "BP6", "BP7"],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  ["WP0", "WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7"],
  ["WT0", "WH0", "WR0",  "WQ",  "WK", "WR1", "WH1", "WT1"]
]

const input_settings = {
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
};

addEvent(constants.inputdevice_events.changed,     (e)=>console.log("main", e) );
addEvent(constants.inputdevice_events.action,      (e)=>console.log("main", e) );
addEvent(constants.inputdevice_events.action_down, (e)=>console.log("main", e) );

Promise.all(
  [
    scene.load(),
    chess.load(),
    input.init(
      scene.renderer,
      input_settings
    )
  ]
)
.then(setup)
.catch(show_error)

function setup(){
  scene.setup(board, update).then(
    world=>{

      const canvases = document.getElementsByTagName("canvas");
      console.log(canvases)
      const texcanvas = canvases[0].getContext('2d');
      const canvasmat = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(texcanvas.canvas),
      });

      let plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), canvasmat );
      plane.position.set(0,1,0)
      console.log(world);//.add(plane);
      world.add(plane);
  }
  );
}

function show_error(e){console.error(e)}


const clock = new THREE.Clock();
let delta=0;
function update(time){
  if(window.stats) window.stats.update();

  input.poll_gamepads()
  delta = clock.getDelta()
  scene.dolly.rotation.y+=(delta*0.05);
  // console.log(data)
  return ;
}
