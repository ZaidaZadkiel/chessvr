const div = document.getElementById("app");
function add(...d){
  div.innerHTML += String(d.join("<br/>"))+"<br/>";
}

function getArguments(fref){
  let f = String(fref);
  if(typeof fref === "function") return (
        "("
        +f.slice(
          f.indexOf('(')+1,
          f.indexOf(')')
        )
        +")"
      );
  return typeof fref
}

function table(t_arr2d){
  console.log(t_arr2d)
  //this is ugly
  div.innerHTML +=`
  <table>
    ${
      t_arr2d.map(
        tm => `
          <tr>
            ${tm.map(arr=>`<td>${arr}</td>`).join("")}
          </tr>
        `
      ).join("")
    }
  </table>
  `
}

function show_obj_keys(obj){
  table(
    Object.keys(obj).map(
      x=>[ typeof obj[x], x, getArguments(obj[x]) ]
    )
  )
}

import { scene }  from '../js/scene';
import { chess }  from '../js/chess';
import * as input from '../js/input';

add("Testing input");
add("input.keys:")
add( show_obj_keys(input) )

add("Testing chess");
add("chess.keys:")
add( show_obj_keys(chess) )

add("Testing scene");
add("scene.keys:")
add( show_obj_keys(scene) )


// console.log(input.get_hook())

// clear_hook
// get_XRController
// get_mapping
// get_state
// init
// poll_gamepads
