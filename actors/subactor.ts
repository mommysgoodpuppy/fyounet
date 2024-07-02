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
import { getAvailablePort } from "https://raw.githubusercontent.com/jakubdolejs/deno-port/main/mod.ts";

type State = {
  id: string;
  db: Record<string, unknown>;
  [key: string]: unknown;
};

const state: State & BaseState = {
  id: "",
  db: {},
  name: "sub",
  numbah: 0,
  addressbook: [],
  rtcSocket: null,
};

const functions: ActorFunctions = {
  RTC: async (_payload) => {
    const socket = await Postman.creatertcsocket();
    socket.send(JSON.stringify({
      type: "ADDREMOTE",
      payload: state.id,
    }));
  },
  LOG: (_payload) => {
    console.log(state.id);
  },
};

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
