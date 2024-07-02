import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type } from "arktype";
import { Signal } from "../actorsystem/utils.ts";
import {
  ActorFunctions,
  BaseState,
  Message,
  notAddressArray,
  Payload,
  PayloadHandler,
  System,
  ToAddress,
  worker,
} from "../actorsystem/types.ts";
import { ActorWorker } from "../actorsystem/ActorWorker.ts";
import { wait } from "../actorsystem/utils.ts";
import { WebRTCServer } from "./webrtcClass.ts";
import type { AppRouter } from "../actorsystem/router.ts";
import { getAvailablePort } from "https://raw.githubusercontent.com/jakubdolejs/deno-port/main/mod.ts";

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
  static creationSignal: Signal<ToAddress>;
  static callbackSignal: Signal<any>;
  static portals: Array<ToAddress>;

  static functions: ActorFunctions = {
    //initialize actor
    INIT: (payload) => {
      Postman.state.id = `${Postman.state.name}${crypto.randomUUID()}`;
      Postman.PostMessage(worker, {
        address: { fm: Postman.state.id, to: System },
        type: "LOADED",
        payload: Postman.state.id,
      });
      console.log("initied sub actor with args:", payload);
    },

    //register self to system
    REGISTER: (payload) => {
      Postman.creationSignal.trigger(payload as ToAddress);
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

  static async PostMessage(worker: ActorWorker, message: Message) {
    worker.postMessage(message);
  }

  static async create(
    worker: ActorWorker,
    actorname: string,
    state: BaseState,
  ): Promise<ToAddress> {
    Postman.creationSignal = new Signal<ToAddress>();

    worker.postMessage({
      address: { fm: state.id, to: System },
      type: "CREATE",
      payload: actorname,
    });

    const result = await Postman.creationSignal.wait();

    return result;
  }

  static async creatertcsocket() {
    const port = await getAvailablePort();
    if (!port) {
      throw new Error("no port available");
    }
    const server = new WebRTCServer(Postman.state.id, port);
    const socket = await server.start();
    Postman.state.socket = socket;
    socket.addEventListener("open", () => {
      console.log("socket open");
      socket.send(JSON.stringify({
        type: "portalSet",
        payload: Postman.state.id,
      }));
    });
    socket.addEventListener("message", (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("got message raw", data);
      const message = JSON.parse(data.rtcmessage) as Message;
      console.log("got message", message);
      if (message.address.to === Postman.state.id) {
        console.log("message is to self");
        Postman.runFunctions(message);
      }
      else {
        throw new Error("message not to self");
      }
    });
    while (socket.readyState !== WebSocket.OPEN) {
      await wait(100);
    }
    return socket;
  }

  static addPortal(worker: Worker, actorAddr: string, portal: string) {
    worker.postMessage({
      address: System,
      type: "addPortal",
      payload: [actorAddr, portal],
    });
  }
}