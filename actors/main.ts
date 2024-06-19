import { Message } from "../actorsystem/postMan.ts";
import { System } from "../actorsystem/postMan.ts";
import { Actor } from "../actorsystem/actor.ts";
import { Contents, PayloadHandler, worker } from "./types2.ts";
import { actorManager } from "./actorManager.ts";

const functions: { [key: string]: PayloadHandler } = {
  init: (payload) => {
    const id = crypto.randomUUID();
    worker.postMessage({
      address: System,
      type: "loaded",
      payload: id,
    });
    console.log("initied main actor", payload);
  },

  program: (payload) => main(payload),

  test: (payload) => {
    console.log(payload);
  },
};


async function main(payload: Contents) {
  console.log("mainFload with payload", payload);

  const testactor = await actorManager.create(worker, "test.ts");
  console.log("testactor", testactor);

  actorManager.postmessage(worker, {
    address: testactor,
    type: "hello",
    payload: null,
  });

  actorManager.postmessage(worker, {
    address: testactor,
    type: "dbadd",
    payload: {key: "hello", value: "world"},
  });



}

new actorManager(worker, functions);

worker.onmessage = (event: MessageEvent<Message>) => {
  actorManager.runFunction(event);
};
