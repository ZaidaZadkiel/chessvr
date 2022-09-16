const message_types = {
  welcome  : "welcome",
  left     : "left",
  me       : "me",
  privately: "privately",
  private  : "private",
  public   : "public",
  test     : "test",
};

const socket_events = {
  welcome       :"welcome",
  join          :"join",
  moved         :"moved",
  visible       :"visible",
  enterroom     :"enterroom",
  leaveroom     :"leaveroom",
  left          :"left",
  connect_error :"connect_error",
  disconnect    :"disconnect",
  private       :"private",
  message       :"message",
  move          :"move",
  // TODO: match these events on backend
};

let conference_events = {
  participants    : "participants",
  status_changed  : "status_changed",
  message_received: "message_received",
  user_left       : "user_left",
};

let jitsi_events = {
  connected     : "connected",
  status_changed: "status_changed",
}

let inputdevice_events = {
  changed     : "changed",
  connected   : "connected",
  disconnected: "disconnected",
  error       : "error",
  action      : "action",
  action_down : "action_down"
}

export { message_types, socket_events, conference_events, jitsi_events, inputdevice_events };
