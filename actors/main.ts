import {
  ActorFunctions,
  BaseState,
  Message,
  Payload,
  System,
  worker,
} from "../actorsystem/types.ts";
import { OnMessage, Postman, trpc } from "../classes/PostMan.ts";
import { wait } from "../actorsystem/utils.ts";
import { WebRTCServer } from "../classes/webrtcClass.ts";
import { PostalService } from "../actorsystem/PostalService.ts";
import { getAvailablePort } from "https://raw.githubusercontent.com/jakubdolejs/deno-port/main/mod.ts";

type State = {
  id: string;
  db: Record<string, unknown>;
  [key: string]: unknown;
};

const state: State & BaseState = {
  name: "main",
  id: "",
  socket: null,
  db: {},
  numbah: 0,
  addressbook: [],
  rtcSocket: null,
};

const functions: ActorFunctions = {
  MAIN: (payload) => {
    main(payload);
  },
  LOG: (_payload) => {
    console.log(state.id);
  },
};

async function main(_payload: Payload["MAIN"]) {
  console.log("main!");

  //#region signaling
  const signalingServer = await Postman.create(
    worker,
    "signalingDenoServer.ts",
    state,
  );
  Postman.PostMessage(worker, {
    address: { fm: state.id, to: signalingServer },
    type: "STARTSERVER",
    payload: 8081,
  });
  //#endregion

  const remoteid = await Postman.create(worker, "subactor.ts", state);

  const socket = await Postman.creatertcsocket();

  // tell subactor to make a socket and listen

  Postman.PostMessage(worker, {
    address: { fm: state.id, to: remoteid },
    type: "RTC",
    payload: null,
  });
  await wait(3000);

  socket.send(JSON.stringify({
    type: "create_offer",
    targetPeerId: remoteid,
  }));
  await wait(6000);

  Postman.PostMessage(worker, {
    address: { fm: state.id, to: remoteid },
    type: "LOG",
    payload: null,
  }, true);
}

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
