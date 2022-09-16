
import * as THREE from "three";
import { STLLoader }     from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader }     from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { VRButton }                 from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import * as BufferGeometryUtils     from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import ThreeMeshUI from 'three-mesh-ui'

let plane;
let room_scene;
const map = new THREE.TextureLoader().load( 'assets/vignette.png' );
const sprmat = new THREE.SpriteMaterial( { map: map } );

const sprite = new THREE.Sprite( sprmat );
sprite.position.z=-1;
sprite.scale.setScalar(0.7);


const textcontainer = new ThreeMeshUI.Block({
 width: 1.2,
 height: 0.7,
 padding: 0.05,
 textAlign: 'left',
 fontFamily: './assets/Roboto-msdf.json',
 fontTexture: './assets/Roboto-msdf.png',
});

const text = new ThreeMeshUI.Text({
 content: "Some text to be displayed",
 fontSize: 0.055
});
console.log(text)
textcontainer.position.set( 0, 1, -1.8 );
textcontainer.rotation.x = -0.55;
textcontainer.add( text );
console.log(textcontainer)


let controller1, controller2;
let controllerGrip1, controllerGrip2;
var light;
let helper
let xrCamera;

//holds the pieces of each player, whites and blacks, by their name as defined in the array board
let black_pieces={};
let white_pieces={};

let whiteMaterial = null;
let blackMaterial = null;

/* StorePGN should write the proper pieces in the array board with the format of "BP0" for black pawn 0 */
/* this is a 2d array representing each box in the chess board, row by row
  the contents are all Strings with either empty length or a representation of each piece
  format:
    B for black, W for white,
    T for tower, H for knight, R for rook, K for king, Q for queen, P for pawn
    0 .. 7 the number of the pieces which are duplicated in each color,
          0 for the ones on the left hand, 1 for the ones on  the right hand, pawns go from 0 to 7

  changing the position of the strings in this array changes the starting position of the board
*/
let board = [
  ["BT0", "BH0", "BR0",  "BK",  "BQ", "BR1", "BH1", "BT1"],
  ["BP0", "BP1", "BP2", "BP3", "BP4", "BP5", "BP6", "BP7"],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  [   "",    "",    "",    "",    "",    "",    "",    ""],
  ["WP0", "WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7"],
  ["WT0", "WH0", "WR0",  "WQ",  "WK", "WR1", "WH1", "WT1"]
];

var scene, camera, renderer, group_board, controls, pgn, dolly;

let fallingObjects = [];
//make the script wait until all the pieces are loaded before initializing the game and rendering
loadModels().then(
  function(){
    init();
    renderer.setAnimationLoop(animate);
  }
);


function onSqueezeStart( event ){
  console.log(event)
  console.log(event.target)

  if(event.target && event.target.line){
    event.target.line.visible = true;
    event.target.selecting = event.target;
  }
}
function onSqueezeEnd( event ){
  console.log(event)

  if(event.target && event.target.line){
    event.target.line.visible = false;
    event.target.selecting = null;
  }
  if(event.target.highlighted) {
    event.target.highlighted.material.emissive = unselectedColor;
    event.target.highlighted.material.emissiveIntensity = 1;
  }
}

function onSelectStart( event ) {
  console.log(event);
  let control = event.target;
  console.log(control)

  if(control.selecting && control.highlighted) {
    control.selected = control.highlighted;
    control.attach(control.selected)
  }
}

function onSelectEnd( event ) {
  console.log(event);
  const control = event.target;

  if(control.selecting && control.selected){
    group_board.attach(control.selected);
    fallingObjects.push(control.selected);
    control.selected = null;
  }
}

let gamepad_object = {};
let bigcube = new THREE.Group();
let gamepadL = null;
let gamepadR = null;

function onConnected(event){
  console.log(event);

  if( event.type === "sessionend"){
    dolly.scale.set(1, 1, 1)
  }

  if( event.type === "sessionstart"){
    // dolly.scale.set(0.12, 0.12, 0.12)
    dolly.scale.set(1, 1, 1)
    xrCamera = renderer.xr.getCamera(camera);
    scene.remove(textcontainer);

    // controller1.add( sprite );
    plane.position.set(0,0.05,0);
    plane.scale.setScalar(0.0512);
    controller2.add( plane );
    // renderer.xr.getCamera().add( sprite );
    // sprite.position.z = -1;
    // sprite.scale.setScalar(10)
    // scene.add(sprite)

    textcontainer.rotation.set(0,0,0)
    textcontainer.position.set(0,0.15,0)
    textcontainer.scale.set(0.125,0.125,0.125)
    controller1.add(textcontainer)
  }


  // if( event.type === "connected" || event.type === "sessionstart" ){
  if( event.type === "connected"){
    // let session = renderer.xr.getSession();
    let session = (event && event.data);

    console.log(renderer.xr);

    console.log("setting VR session", session);
    if(!session) throw new Error("gamepad session is not defined");
    // console.log("inputSources", Object.keys(session.inputSources))

    if(event.data.handedness === "right"){
      gamepadR = (session.gamepad);
      if(!gamepadR){
        console.log("inputSource empty, setting from xrmanager");
        gamepadR = renderer.xr.getController(0);
      }
      console.log({gamepadR});
    }

    if(event.data.handedness === "left"){
      gamepadL = (session.gamepad);
      if(!gamepadL){
        console.log("inputSource empty, setting from xrmanager");
        gamepadL = renderer.xr.getController(1);
      }
      console.log({gamepadL});
    }

    let object = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial ({color: new THREE.Color(0x012345)})
    );
  }

  if(event.type === "disconnected"){
    console.log("controller disconnected, doing nothing")
    // gamepadL = null;
    // scene.remove(bigcube);
  }
}

let keys = Array(255).fill(0)
function keycontrol(e){
  if(e.repeat === true) return true;
  if(e.type==="keydown"){
    console.log("keyCode", e.keyCode)
    keys[e.keyCode] = 1;
  }
  if(e.type==="keyup"){
    keys[e.keyCode] = 0;
  }
}

function init() {

  const canvases = document.getElementsByTagName("canvas");
  const texcanvas = canvases[0].getContext('2d');



  const canvasmat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(texcanvas.canvas),
  });

  plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), canvasmat );


    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x008080 );

    plane.position.y=1;

    scene.add(room_scene);

    var container = new THREE.Object3D();

    // renderer
    renderer = new THREE.WebGLRenderer({
      antialias: !(window.devicePixelRatio>1),
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio     = 1;
    renderer.outputEncoding    = THREE.sRGBEncoding;
    // renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft     = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    renderer.xr.enabled        = true;

    document.body.appendChild(renderer.domElement);
    document.body.appendChild( VRButton.createButton( renderer ) );

    // camera
    var ratio = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera(45,ratio,0.1,3000);
    camera.position.set(90,90,90); //initial position of the camera
    dolly = new THREE.Group();
    dolly.position.set(1,1,1);
    dolly.add(camera);
    scene.add(dolly);

    // resize
    window.addEventListener('resize', function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth/ window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // lights
    scene.add(new THREE.AmbientLight(0x404040));
    light = new THREE.DirectionalLight(new THREE.Color(1,1,1));
    light.position.set(30,50,10)
    light.rotation.x           = -Math.PI/2;
    light.castShadow           =  true;
		light.shadow.camera.top    =  160;
		light.shadow.camera.bottom = -160;
		light.shadow.camera.right  =  160;
		light.shadow.camera.left   = -160;
    light.shadow.camera.near   =  5;
		light.shadow.camera.far    =  3000;
		light.shadow.mapSize .set( 1024, 1024 );

    light.target.position.set(0, 0, 0);

    helper = new THREE.DirectionalLightHelper( light, 5 );
    scene.add(helper);
    scene.add(light);
    scene.add( light.target );

    helper.parent.updateMatrixWorld();
    helper.update();

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    ]);

    const line = new THREE.Line(geometry);
    line.scale.z = 10;



    // light.add(new THREE.CameraHelper(light.shadow.camera) );
    // light.add(
    //   new THREE.Mesh(
    //     new THREE.BoxGeometry(1, 1, 1),
    //     material
    //   )
    // );;

    console.log("setting events", renderer.xr);

    document.addEventListener("keydown", keycontrol);
    document.addEventListener("keyup",   keycontrol);

    renderer.xr.addEventListener("sessionstart",  onConnected)
    renderer.xr.addEventListener("sessionend",    onConnected)

    controller1 = renderer.xr.getController( 0 );
    controller2 = renderer.xr.getController( 1 );

    controller1.addEventListener( 'connected',    onConnected);
    controller1.addEventListener( 'disconnected', onConnected);
    controller1.addEventListener( 'selectstart',  onSelectStart );
    controller1.addEventListener( 'selectend',    onSelectEnd );
    controller1.addEventListener( 'squeezestart', onSqueezeStart );
    controller1.addEventListener( 'squeezeend',   onSqueezeEnd );
    controller1.line = line.clone();
    controller1.line.visible = false;
    controller1.add(controller1.line);
    dolly.add(controller1)

    controller2.addEventListener( 'connected',    onConnected);
    controller2.addEventListener( 'disconnected', onConnected);
    controller2.addEventListener( 'selectstart',  onSelectStart );
    controller2.addEventListener( 'selectend',    onSelectEnd );
    controller2.addEventListener( 'squeezestart', onSqueezeStart );
    controller2.addEventListener( 'squeezeend',   onSqueezeEnd );

    controller2.line = line.clone();
    controller2.line.visible = false;
    controller2.add(controller2.line)
    dolly.add(controller2)


    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    dolly.add( controllerGrip1 );

    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    dolly.add( controllerGrip2 );

    scene.add( textcontainer );

    // console.log(model_board)
    model_board.boundingBox = new THREE.Box3().setFromObject(model_board);
    model_board.box         = new THREE.BoxHelper( model_board, 0xff00ff );
    // console.log(model_board.box)
    // scene.add(model_board.box );

    //controls
    // controls = new OrbitControls( camera, renderer.domElement );

    var string = "1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#";
    var KasparovVsTopalov = "1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#"

    pgn = StorePGN(string);

    console.log({model_board})
    group_board = new THREE.Group();
    group_board.add(model_board);
    scene.add(group_board);

    StartGame(pgn);
}

//variables to keep the models in memory
var model_pawn      = null;
var model_knight    = null;
var model_rook      = null;
var model_queen     = null;
var model_king      = null;
var model_bishop    = null;
var model_board     = null;
var piecesAvailable = [];

function loadModels(){
  whiteMaterial = new THREE.MeshStandardMaterial();
  blackMaterial = new THREE.MeshStandardMaterial();
  const tl      = new THREE.TextureLoader();

  whiteMaterial.map           = tl.load('models/white/color.jpg');
  whiteMaterial.map.encoding  = THREE.sRGBEncoding;
  whiteMaterial.map.wrapS     = whiteMaterial.map.wrapT = THREE.RepeatWrapping;

  // whiteMaterial.bumpMap       = tl.load('models/white/normal.jpg')
  // whiteMaterial.bumpMap.wrapS = whiteMaterial.map.wrapT = THREE.RepeatWrapping;
  // whiteMaterial.bumpMapScale  = 0.00125;

  // whiteMaterial.displacementMap = tl.load('models/white/disp.jpg')
  // whiteMaterial.displacementScale = 0.1;

  blackMaterial.map           = tl.load('models/black/color.jpg');
  blackMaterial.map.encoding  = THREE.sRGBEncoding;
  blackMaterial.map.wrapS     = blackMaterial.map.wrapT = THREE.RepeatWrapping;
  // blackMaterial.bumpMap       = tl.load('models/black/normal.jpg')
  // blackMaterial.bumpMapScale  = 0.00125;
  // blackMaterial.bumpMap.wrapS = blackMaterial.map.wrapT = THREE.RepeatWrapping;

  // blackMaterial.displacementMap = tl.load('models/black/disp.jpg')
  // blackMaterial.displacementScale = 0.1;

  // whitePieceTexture = tl.load('models/white.png');

  const gltfToInstanced = (gltf) => {
    console.log(gltf)

    const createim = (x, n) => {
      let ig = new THREE.InstancedMesh(x.geometry, x.material, n||8*2)
      ig.name = x.name;
      ig.setMatrixAt(0, dummy.matrix);
      ig.instanceMatrix.needUpdate = true;
      return ig;
    }

    let geos = [];
    let mat  = [];

    const groupim = new THREE.Group();
    const dummy = new THREE.Object3D();
    dummy.position.set(0, 0, 0);
    dummy.updateMatrix();

    gltf.scene.children.forEach(
      x=>{
        if(x.isMesh){
          let ig =createim(x, 16);
          geos.push(ig);
          groupim.add(ig);
        }
        if(x.isGroup){
          let g = new THREE.Group()
          g.name = x.name;
          let ig = x.children.map(n=>g.add(createim(n)));
          console.log("isgroup",ig)
          groupim.add(g);
        }
      }
    );

    console.log( "instanceds",
      geos, mat,
    );

    return groupim;
  }


  return new Promise(
    (ok, no)=>{
      const loader = new GLTFLoader();
      loader.load(
        "./models/selectionroom.glb",
        (gltf)=>{
          room_scene = gltfToInstanced(gltf);
        }
      );

      loader.load(
        "./models/chess complete.glb",
        (gltf)=>{

          let imboard  = gltfToInstanced(gltf);

          model_board  = imboard.getObjectByName("BOARD");
          model_pawn   = imboard.getObjectByName("PAWN");
          model_knight = imboard.getObjectByName("KNIGHT");
          model_rook   = imboard.getObjectByName("ROOK");
          model_queen  = imboard.getObjectByName("QUEEN");
          model_king   = imboard.getObjectByName("KING");
          model_bishop = imboard.getObjectByName("BISHOP");
          // model_board  = gltf.scene.getObjectByName("BOARD");
          // model_pawn   = gltf.scene.getObjectByName("PAWN");
          // model_knight = gltf.scene.getObjectByName("KNIGHT");
          // model_rook   = gltf.scene.getObjectByName("ROOK");
          // model_queen  = gltf.scene.getObjectByName("QUEEN");
          // model_king   = gltf.scene.getObjectByName("KING");
          // model_bishop = gltf.scene.getObjectByName("BISHOP");

          console.log({
            imboard,
            model_board,
            model_pawn,
            model_knight,
            model_rook,
            model_queen,
            model_king,
            model_bishop
          })

          gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
              // child.castShadow = true;
              // child.receiveShadow = true;
            }
          } );

          model_board.traverse((x)=>{
            if(!x.isMesh) return;
            x.castShadow = false;
            // x.receiveShadow = false;
          })
          console.log("loled all")

          document.getElementById("loading").remove();
          ok();
          // setTimeout(
          //   ()=>{
          //   },
          //   5000
          // )
        }
      );
    }
  );

}

function StorePGN(pgn) {
    // "1. e4 Nf6 2. f3 e5" becomes [1., e4, Nf6, 2., f3, e5]
    var moveArray;
    moveArray = pgn.split(/\s+/);
    return moveArray;
}


function CreatePiece(color, model, name, row, column) {
  // console.log(color, model, name, row, column)
  // creates a piece cloning the model and set to a position in row, column
  let pieces;
  if (color === "W") {
    pieces = white_pieces; // set to the list of white's pieces
    pieces[name] = model.clone(); //clone the mesh data into a new object
    // pieces[name].material = model.material.clone();
    pieces[name].material = whiteMaterial.clone(); // overwrite the placeholder material, with the white color
    pieces[name].position.set((row-3.5)*10, 0, (column-3.5)*10); // assign the position in the 3d space to place in the board

    group_board.add(white_pieces[name]); // add the piece to the group which hold the entire board

  } else if (color === "B") {
    pieces = black_pieces; // set to the list of black's pieces
    pieces[name] = model.clone(); // clone 3d object
    // pieces[name].material = model.material.clone();
    pieces[name].material = blackMaterial.clone();
    pieces[name].position.set((row-3.5)*10, 0, (column-3.5)*10 ); // set the position in the board
    pieces[name].rotation.y = Math.PI; // rotate facing towards whites
    group_board.add(black_pieces[name]); // add to the board group
  }

  console.log(pieces[name].isInstancedMesh ? "Instanced" : "Regular", pieces[name])
  pieces[name].box = new THREE.Box3().setFromObject(pieces[name]);
  // pieces[name].box =
  // scene.add(
  //   new THREE.BoxHelper(pieces[name], 0xff0000)
  // );

  piecesAvailable.push(pieces[name])
    // new THREE.Box3().setFromObject(pieces[name]));
}


function PlacePieces() {
  // two-loop for assigning each piece in the board
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let name   = board[i][j]; // we get the piece position from the corresponding cell in the board 2d array
      let color  = name.charAt(0); // get the color, W or B
      let piece  = name.charAt(1); // get the piece type, P, K, H, T, Q, R
      let number = name.charAt(2); // get the corresponding identifier number

      // console.log({ color, piece, number })
      // check each piece and create a new one from their corresponding type
      switch (piece) {
        case "P": CreatePiece(color, model_pawn,   name, j, i); break;
        case "K": CreatePiece(color, model_king,   name, j, i); break;
        case "H": CreatePiece(color, model_knight, name, j, i); break;
        case "T": CreatePiece(color, model_rook,   name, j, i); break;
        case "Q": CreatePiece(color, model_queen,  name, j, i); break;
        case "R": CreatePiece(color, model_bishop, name, j, i); break;
      }
    }
  }
}

function StartGame(pgnArray) {
  // this should figure the initial position of the board from the pgnArray String (not implemented)
  // should set up the board array with the proper positions
  for (var i = 0; i < pgnArray.length; i++) {
    // ignore the 1., 2. elements
    var colour = "white";
    if (i % 3 == 0|| i == 0) continue;

    // CheckCommand(pgnArray[i], colour);
    colour = (colour == "white") ? "black": "white";
  }

  // place the pieces according to the board array
  PlacePieces();
}

function CheckCommand(command, colour) {
    // Check Contains (+: Check, #: Checkmate, 0-0-0: Castle Queen, 0-0: Castle King, =: Promote pawn, x: takes)
    if (command.includes('+')) {
        // Handle Check
        // Find King
        // Highlight King Tile
        console.log("Check");
    }
    else if (command.includes('#')) {
        // Handle Checkmate
        // Find King
        // Highlight King Tile
        // New Text for checkmate
        console.log("Checkmate");
    }

    if (command.includes("0-0-0")) {
        // Handle Castle Queen
        // Find
        console.log("Queen side Castle");
    }
    else if (command.includes("0-0")) {
        // Handle Castle King
        console.log("King Side Castle");
    }

    if (command.includes('=')) {
        // Handle Promote Pawn
        console.log("Pawn promoted");
    }

    if (command.includes('x')) {
        // Handle Takes
        console.log("Piece Taken");
    }

    var target = LookForPiece(command, colour);
    var destX;
    var destY;
        // do something
    // if doesn't contain, only move piece
    // Check Contains UpperCase (N: Knight, B: Bishop, R:Rook, Q: Queen, K: King)
        // Look for piece
    // if doesn't contain, move pawn
    // if pawn takes empty tile, remove pawn in tile below white/above black
    MovePiece(target, destX, destY);
    return;
}

// Change this if you find a better way.
function LookForPiece(command, colour) {
    if (!command.includes('x')) {
        if (command.includes('N')) {
            FindKnight(command, colour);
        }
        else if (command.includes('B')) {
            FindBishop(command, colour);
        }
        else if (command.includes('R')) {
            FindRook(command, colour);
        }
        else if (command.includes('Q')) {
            FindQueen(command, colour);
        }
        else if (command.includes('K')) {
            FindKing(command, colour);
        }
    }
    FindPawn()
}

function FindKnight(command, colour) {
    // Find and return the Knight to move
    return;
}

function FindBishop(command, colour) {
    // Find and return the Bishop to move
    return;
}

function FindRook(command, colour) {
    // Find and return the Rook to move
    return;
}

function FindQueen(command, colour) {
    // Find and return the Queen to move
    return;
}

function FindKing(command, colour) {
    // Find and return the King to move
    return;
}

function FindPawn(command, colour) {
    // Find and return the Pawn to move
    return;
}

function MovePiece(target, destinationX, destinationY) {
    // Move a piece, don't need to return anything;
    return;
}

let campos = 0;
// animation loop

let clock = new THREE.Clock();
let delta = 0;

let rm  = new THREE.Matrix4();
let v   = new THREE.Vector3();
let ray = new THREE.Raycaster();


const frustumSize = 10;
const aspect = window.innerWidth / window.innerHeight;

const overlaycamera = new THREE.OrthographicCamera(
  window.innerWidth  / -25,
  window.innerWidth  /  25,
  window.innerHeight /  25,
  window.innerHeight / -25,
  1, 2000
);
overlaycamera.position.z = 20;

const overlayscene      = new THREE.Scene()
overlayscene.background = new THREE.Color(0xff00ff)
sprite.position.set(0,0,-3)
sprite.scale.setScalar(100)
overlayscene.add(sprite)


function animate() {
  delta = clock.getDelta();
  campos += delta * 0.125;

  if(window.stats) window.stats.update();

  const session = renderer.xr.getSession();

  light.position.z = ( Math.cos(campos) * 80 );
  light.position.y = 70;
  light.position.x = 70;
  light.target.position.x = ( Math.cos(campos) * 80 );

  helper.parent.updateMatrixWorld();
  helper.update();

  if(session) {
    updateVR();
  } else {
    model_board.getWorldPosition(v)
    camera.position.x = ( Math.cos(campos) ) * 150;
    camera.position.z = ( Math.sin(campos) ) * 150;
    camera.lookAt(v)

    // dolly.position.y+= delta*0.1;
    // dolly.rotation.y= dolly.rotation.y + (delta * 0.1) % Math.PI ;

  }
  // This is typically done in the render loop :
  // textcontainer.scale.x = 0;
  // textcontainer.scale.y = campos * 0.1;
  // textcontainer.scale.z = 0;
  // console.log(container)
  ThreeMeshUI.update();

  for (let len = fallingObjects.length; len > 0; len) {
    len--;
    // console.log(len, fallingObjects)
    if(fallingObjects[len].box.update) fallingObjects[len].box.update();
    // fallingObjects[len].geometry.boundingBox.update();

    // console.log(model_board.boundingBox.intersectsBox(fallingObjects[len].geometry.boundingBox));

    // console.log(model_board.boundingBox);
    // console.log(fallingObjects[len].geometry.boundingBox);
    fallingObjects[len].position.y -= 9.8 * delta;
    if(fallingObjects[len].position.y < 0){
      fallingObjects[len].position.y= 0;
      fallingObjects = fallingObjects.slice(len+1, 1);
    }
  }



  // controls.update();
  renderer.render(scene, camera);
  overlaycamera.lookAt(overlayscene.position)
  // renderer.render(overlayscene, overlaycamera);
  // requestAnimationFrame(animate);
}


// let selectedObject;

const debuggeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -1)
]);


// create a Mesh containing the geometry and material
const cube = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.01, 0.01, 0.01),
  new THREE.MeshBasicMaterial()
);
const viewcube = cube.clone();
viewcube.scale.set(5,0.4,0.4);
viewcube.position.set(0,0.1,0);


const debugline       = new THREE.Line(debuggeometry);
let   added           = false;
let   selectedColor   = new THREE.Color(1,1,1);
let   unselectedColor = new THREE.Color(0,0,0);

const cameraDirection = new THREE.Vector3();
const cameraVector    = new THREE.Vector3();
const position        = new THREE.Vector3();
const rotation        = new THREE.Quaternion();
const scale           = new THREE.Vector3();

let   viewdebug       = false;
let   cpy             = new THREE.Vector3();
const v3yup           = new THREE.Vector3(0,1,0);

function moveForward(v){
  cpy.copy(cameraVector);
  cpy.y = 0;
  cpy.multiplyScalar(v * 0.1)

  dolly.position.add( cpy );

  // sprite.visible = sprite.visible||Boolean(v);
  // sprite.position.x += cpy.x;
  // sprite.position.z += cpy.z;
}

function rotateSideways(v){
  dolly.rotation.y += v*0.07;
  // sprite.rotation.y += dolly.rotation.y
  // console.log(v)
}

function moveSideway(v){
  cpy.copy(cameraVector);
  cpy.y=0;
  cpy.applyAxisAngle(v3yup, Math.PI/2  )
  cpy.multiplyScalar(v * 0.1)

  dolly.position.add( cpy );

  // sprite.visible = sprite.visible||Boolean(v);
  // sprite.position.x += cpy.x;
  // sprite.position.z += cpy.z;
}

function rayFromControl(control){
  let selecting      = control.selecting;
  let selectedObject = control.highlighted;

  if(selectedObject) {
    selectedObject.material.emissive = unselectedColor;
    selectedObject.material.emissiveIntensity = 1;
  }

  if(selecting){
    // console.log(selecting)
    rm.extractRotation(selecting.line.matrixWorld);
    selecting.line.getWorldPosition(ray.ray.origin);


    // ray.ray.origin.setFromMatrixPosition(selecting.line.matrixWorld);
    ray.ray.direction.set(0, 0, -1).applyMatrix4(rm);

    cube.position.set(0,0,0);
    cube.lookAt(ray.ray.direction);
    cube.position.copy(ray.ray.origin);

    // selectedObject.material.emissive = unselectedColor;
    const intersects = ray.intersectObjects(piecesAvailable);
    // const intersects = ray.intersectObjects(group_board.children);
    // console.log(ray.ray)
    control.highlighted = null;
    if (intersects.length > 0) {
      // controller.children[0].scale.z = intersects[0].distance;

      selectedObject = intersects[0].object;
      selectedObject.material.emissive = selectedColor;
      selectedObject.material.emissiveIntensity = 0.5;
      control.highlighted = selectedObject;
      // console.log(selectedObject.material)
      // selectedObjectDistance = this.selectedObject.position.distanceTo(controller.position);
    }

  }

}

function deleteIfPress( willDelete ) {
  //delete mesh and all assorted data
}

function updateVR(){


  xrCamera.getWorldDirection(cameraVector);
  renderer.xr.getCamera().updateProjectionMatrix()
  renderer.xr.getCamera().matrixWorld.decompose( position, rotation, scale );
  viewcube.quaternion.copy(rotation);
  // sprite.position.copy(position)
  // sprite.rotation.copy(rotation)
  // sprite.position.z -= 0.2;

  moveForward   ( (keys[38] -  keys[40]) -  (gamepadR && gamepadR.axes[3]    || 0) );
  rotateSideways( (keys[37] -  keys[39]) -  (gamepadL && gamepadL.axes[2]    || 0) );
  moveSideway   ( (keys[81] -  keys[69]) -  (gamepadR && gamepadR.axes[2]    || 0) );
  deleteIfPress ( (keys[88] || 0)        || (gamepadR && gamepadR.buttons[2] || 0) );

  plane.material.map.needsUpdate=true;

  if(controller1.selecting && (!controller1.selected)  ) rayFromControl(controller1);
  if(controller2.selecting && (!controller2.selected)  ) rayFromControl(controller2);

  if(controller1.selected  && controller1.selected && controller1.selected.box.update)      controller1.selected.box.update()
  if(controller2.selected  && controller2.selected && controller2.selected.box.update)      controller2.selected.box.update()

  // console.log(sprite)
  text.set({
    content: `
    selected L   : ${(controller1.selected && controller1.selected.name) || "nothing"}
    selected R   : ${(controller2.selected && controller2.selected.name) || "nothing"}
    render calls : ${renderer.info.render.calls}
    polycount    : ${renderer.info.render.triangles}
    Textures     : ${renderer.info.memory.textures}
    Geometries   : ${renderer.info.memory.geometries}
    `
  });


}
