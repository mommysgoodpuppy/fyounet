import {
  ActorFunctions,
  BaseState,
  Message,
  Payload,
  PayloadHandler,
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
    if (payload.startsWith("/")) {
      const vmessage = payload.split(":");
      const address = vmessage[0].slice(1);
      const type = vmessage[1] as any;
      const payload2 = vmessage[2];

      Postman.PostMessage(worker, {
        address: { fm: state.id, to: address },
        type: type,
        payload: payload2,
      }, true);
    } else {
      const vmessage = payload.split(":");
      const type = vmessage[0] as keyof ActorFunctions;
      const payload2 = vmessage[1];

      (Postman.functions?.[type] as PayloadHandler<typeof type>)?.(
        payload2,
      );
    }
  },
};

async function main(_payload: Payload["MAIN"]) {
  console.log("main!");

  // create rtc socket on self
  Postman.functions?.RTC?.(null);

  const remoteid = await Postman.create(worker, "subactor.ts", state);
  console.log("remoteidXXX", remoteid);

  // connect to subactor
  /* Postman.functions?.CONNECT?.(remoteid); */
  await wait(10000);

  // tell subactor to log
  /* Postman.PostMessage(worker, {
    address: { fm: state.id, to: remoteid },
    type: "LOG",
    payload: null,
  }, true); */
}

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
