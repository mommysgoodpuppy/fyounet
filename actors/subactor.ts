import {
  ActorFunctions,
  BaseState,
  Message,
  Payload,
  worker,
} from "../actorsystem/types.ts";
import { wait } from "../actorsystem/utils.ts";
import { OnMessage, Postman, trpc } from "../classes/PostMan.ts";
import { WebRTCServer } from "../classes/webrtcClass.ts";


type State = {
  id: string;
  db: Record<string, unknown>;
  [key: string]: unknown;
};

const state: State & BaseState = {
  id: "",
  db: {},
  name: "sub",
  socket: null,
  numbah: 0,
  addressbook: [],
};

const functions: ActorFunctions = {
  LOG: (_payload) => {
    console.log(state.id);
  },
};

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
