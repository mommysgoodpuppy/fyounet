import {
  ActorFunctions,
  BaseState,
  Payload,
  worker,
} from "../actorsystem/types.ts";
import { OnMessage, Postman, trpc } from "../actorsystem/PostMan.ts";

type State = {
  id: string;
  db: Record<string, unknown>;
  [key: string]: unknown;
};

const state: State & BaseState = {
  id: "",
  db: {},
  numbah: 0,
  addressbook: [],
  rtcSocket: null,
};

const functions: ActorFunctions = {
  MAIN: (payload) => {
    main(payload);
  },
  FILE: async (payload) => {
    const text = await trpc.readFile.query(payload);
    console.log("File contents:", text);
  },
  LOG: (_payload) => {
    console.log(state.id);
  },
};

async function main(_payload: Payload["MAIN"]) {
  console.log("main!");

  //#region signaling
  /* const signalingServer = await Postman.create(
    worker,
    "signalingDenoServer.ts",
    state,
  );
  Postman.PostMessage(worker, {
    address: { fm: state.id, to: signalingServer },
    type: "STARTSERVER",
    payload: 8080,
  }); */
  //#endregion

  const id = await Postman.create(worker, "worker.ts", state);
  console.log("created", id);

  Postman.PostMessage(worker, {
    address: { fm: state.id, to: id },
    type: "LOG",
    payload: null,
  });
}

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
