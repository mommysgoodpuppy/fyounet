import { OnMessage, Postman } from "./PostMan.ts";
import { ActorFunctions, BaseState, worker } from "../actorsystem/types.ts";

import { SignalingServer } from "../classes/signalingClass.ts";

const state: BaseState = {
  id: "",
  db: {},
  numbah: 0,
  addressbook: [],
  rtcSocket: null,
};

const functions: ActorFunctions = {
  /* dbAdd: (payload) => {
    db[payload.key] = payload.value;
    console.log("added to db", db);
  }, */

  STARTSERVER: (payload) => {
    const signalingServer = new SignalingServer(payload);
    signalingServer.start();
  },
};

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
