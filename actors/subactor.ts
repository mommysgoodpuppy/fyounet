import {
  ActorFunctions,
  BaseState,
  Payload,
  worker,
} from "../actorsystem/types.ts";
import { OnMessage, Postman, trpc } from "./PostMan.ts";

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
  FILE: async (payload) => {
    const text = await trpc.readFile.query(payload);
    console.log("File contents:", text);
  },
  LOG: (_payload) => {
    console.log(state.id);
  },
};

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
