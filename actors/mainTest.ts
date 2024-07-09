import {
  ActorFunctions,
  BaseState,
  Payload,
  PayloadHandler,
  worker,
} from "../actorsystem/types.ts";
import { OnMessage, Postman } from "../classes/PostMan.ts";
import { wait } from "../actorsystem/utils.ts";

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
  CUSTOMINIT: (_payload) => {

  },
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
      // deno-lint-ignore no-explicit-any
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
        payload2, state.id
      );
    }
  },
};

async function main(_payload: Payload["MAIN"]) {
  console.log("main!");

  // create rtc socket on self
  Postman.functions?.RTC?.(null, state.id);

  const portal = await Postman.create(worker, "portal.ts", state);
  const portal2 = await Postman.create(worker, "portal.ts", state);
  const remoteid = await Postman.create(worker, "subactor.ts", state);

  await wait(3000);

  Postman.PostMessage(worker, {
    address: { fm: state.id, to: portal },
    type: "PREGISTER",
    payload: {
      name: "self:Ellie",
      address: state.id,
    },
  }, false);

  await wait(1000);

  Postman.PostMessage(worker, {
    address: { fm: remoteid, to: portal2 },
    type: "PREGISTER",
    payload: {
      name: "self:Teaqu",
      address: remoteid,
    },
  }, false);

  const result3 = await Postman.PostMessage(worker, {
    address: { fm: state.id, to: portal },
    type: "LOOKUP",
    payload: "Ellie",
  }, true);

  console.log("result3", result3);


  await wait(10000);

}

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
