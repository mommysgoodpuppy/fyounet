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


type State = {
  id: string;
  db: Record<string, unknown>;
  [key: string]: unknown;
};

const state: State & BaseState = {
  name: "main",
  id: "",
  db: {},
  socket: null,
  numbah: 0,
  addressbook: [],
};

const functions: ActorFunctions = {
  MAIN: (payload) => {
    main(payload);
  },
  LOG: (_payload) => {
    console.log(state.id);
  },
  STDIN: (payload) => {
    console.log("stdin:", payload);
  },
};

async function main(_payload: Payload["MAIN"]) {
  console.log("main!");

  const remoteid = await Postman.create(worker, "subactor.ts", state);

  // create rtc socket on self
  Postman.functions?.RTC?.(null);

  // tell subactor to create rtc socket
  Postman.PostMessage(worker, {
    address: { fm: state.id, to: remoteid },
    type: "RTC",
    payload: null,
  });
  await wait(3000);

  // connect to subactor
  Postman.functions?.CONNECT?.(remoteid);
  await wait(10000);

  // tell subactor to log
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
