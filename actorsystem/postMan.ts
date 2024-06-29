import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { Signal } from "./utils.ts";
import {
  ActorFunctions,
  ActorWorker,
  BaseState,
  Message,
  nonArrayAddress,
  notAddressArray,
  Payload,
  PayloadHandler,
  System,
  ToAddress,
  worker,
} from "./types.ts";
import type { AppRouter } from "./router.ts";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:8080/trpc",
    }),
  ],
});
export const OnMessage = (handler: (message: Message) => void) => {
  worker.onmessage = (event: MessageEvent) => {
    const message = event.data as Message;
    handler(message);
  };
};

export class Postman {
  static worker: ActorWorker;
  static state: BaseState;
  static signal: Signal<ToAddress>;

  static functions: ActorFunctions = {
    //initialize actor
    INIT: (payload) => {
      Postman.state.id = `subM${crypto.randomUUID()}`;
      Postman.PostMessage(worker, {
        address: { fm: Postman.state.id, to: System },
        type: "LOADED",
        payload: Postman.state.id,
      });
      console.log("initied sub actor with args:", payload);
    },

    //register self to system
    REGISTER: (payload) => {
      Postman.signal.trigger(payload as ToAddress);
    },

    //terminate
    SHUT: (_payload) => {
      console.log("Shutting down...");
      worker.terminate();
    },
  };

  constructor(
    _worker: ActorWorker,
    functions: ActorFunctions,
    state: BaseState,
  ) {
    Postman.state = state;
    Postman.functions = { ...Postman.functions, ...functions };
  }

  static runFunctions(message: Message) {
    if (notAddressArray(message.address)) {
      const address = message.address;

      console.log(
        `[${address.to}]Actor running function, type: ${message.type}, payload: ${message.payload}`,
      );

      (this.functions[message.type] as PayloadHandler<typeof message.type>)?.(
        message.payload as Payload[typeof message.type],
        address,
      );
    } else throw new Error("not address array");
  }

  static PostMessage(worker: ActorWorker, message: Message) {
    worker.postMessage(message);
  }

  static async create(
    worker: ActorWorker,
    actorname: string,
    state: BaseState,
  ): Promise<ToAddress> {
    Postman.signal = new Signal<ToAddress>();

    worker.postMessage({
      address: { fm: state.id, to: System },
      type: "CREATE",
      payload: actorname,
    });

    const result = await Postman.signal.wait();

    return result;
  }

  static addPortal(worker: Worker, actorAddr: string, portal: string) {
    worker.postMessage({
      address: System,
      type: "addPortal",
      payload: [actorAddr, portal],
    });
  }
}
