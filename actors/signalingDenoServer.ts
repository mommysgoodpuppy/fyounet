import { OnMessage, Postman } from "../classes/PostMan.ts";
import { ActorFunctions, BaseState, worker } from "../actorsystem/types.ts";
import { SignalingServer } from "../classes/signalingClass.ts";

const state: BaseState = {
  name: "signalingDenoServer",
  id: "",
  db: {},
  socket: null,
  numbah: 0,
  addressbook: [],
  rtcSocket: null,
};

const functions: ActorFunctions = {
  CUSTOMINIT: (_payload) => {
    Postman.functions?.STARTSERVER?.(8081);
  },
  STARTSERVER: (payload) => {
    const signalingServer = new SignalingServer(payload);
    signalingServer.start();
  },
};

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
