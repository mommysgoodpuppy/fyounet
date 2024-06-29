import { PostalService } from "../actorsystem/PostalService.ts";
import {
  ActorFunctions,
  BaseState,
  Message,
  MessageAddressSingle,
  PairAddress,
  Payload,
  PayloadHandler,
  System,
  ToAddress,
  worker,
} from "../actorsystem/types.ts";
import { WebRTCServer } from "../classes/webrtcClass.ts";
import { getAvailablePort } from "https://raw.githubusercontent.com/jakubdolejs/deno-port/main/mod.ts";
import { OnMessage, Postman } from "../actorsystem/PostMan.ts";

type socket = Map<string, WebSocket>;

type State = BaseState & {
  sockets: socket;
  portals: Array<ToAddress>;
  directConnections: PairAddress[];
};

const state: State = {
  id: "",
  sockets: new Map<string, WebSocket>(),
  portals: [],
  directConnections: [],
};

const functions: ActorFunctions = {
  CONNECT: async (payload, address) => {
    const addr1 = address.to; //self
    const addr2 = payload as string;

    console.log("scios ", state.sockets);
    const socket = state.sockets.get(addr1 as ToAddress);
    if (socket) {
      await new Promise<void>((resolve) => {
        if (socket.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          socket.addEventListener("open", () => {
            resolve();
          });
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));

      socket.send(JSON.stringify({
        type: "create_offer",
        targetPeerId: addr2,
      }));
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      throw new Error("wfff");
    }

    state.portals.push(addr2 as ToAddress);
    console.log("portals", state.portals);
  },

  /* socketreceiver: (payload) => {
    throw new Error("WAAed");
    state.sockets.push(payload as WebSocket);
  }, */

  RELAYMSG: async (payload) => {
    const p = payload as unknown as Message;
    console.log("relaying", payload);
    console.log(state.sockets);
    console.log(state.directConnections);

    console.log(payload);
    const address = p.address;

    // for socket in state.sockets:
    for (const [_key, socket] of state.sockets.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        //
        console.log("payload", payload);
        /* throw new Error("no portal found"); */

        const _to = await address.to;

        const spayload = JSON.stringify(payload);

        const MMessage = {
          type: "send_message",
          targetPeerId: address.to, // other portal address
          payload: spayload,
        };

        socket.send(JSON.stringify(MMessage));
      }
    }
  },
};

async function creatertcsocket(_payload: string) {
  const port = await getAvailablePort();
  if (!port) {
    throw new Error("no port available");
  }
  const server = new WebRTCServer(state.id, port);
  const socket = await server.start();
  state.sockets.set(state.id, socket);
  socket.addEventListener("open", () => {
    console.log("socket open");
    socket.send(JSON.stringify({
      type: "portalSet",
      payload: state.id,
    }));
  });
  socket.addEventListener("MESSAGE", (event) => {
    console.log("got message", event.data);
    const data = JSON.parse(event.data);
    const message = JSON.parse(data.rtcmessage) as Message;
    message.payload = ["arriving", message.payload];
    Postman.PostMessage(worker, message);
  });
}

new Postman(worker, functions, state);

OnMessage((message) => {
  Postman.runFunctions(message);
});
