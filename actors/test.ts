import { Message } from "../actorsystem/postMan.ts";
import { System } from "../actorsystem/postMan.ts";
import { Actor } from "../actorsystem/actor.ts";
import { Contents, PayloadHandler, worker } from "./types2.ts";
import { actorManager } from "./actorManager.ts";

let db : {[key: string]: string} = {};

const functions: { [key: string]: PayloadHandler } = {
  init: (payload) => {
    const id = crypto.randomUUID();
    worker.postMessage({
      address: System,
      type: "loaded",
      payload: id,
    });
    console.log("initied sub actor", payload);
  },

  dbadd: (payload: {key: string, value: string}) => {
    db[payload.key] = payload.value;
    console.log("added to db", db);
  },

  hello: (payload) => {
    console.log("WOOAOGOGOA");
    console.log(payload)
  },
};

new actorManager(worker, functions);

worker.onmessage = (event: MessageEvent<Message>) => {
  actorManager.runFunction(event);
};

