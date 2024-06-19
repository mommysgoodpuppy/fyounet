import { payload } from "../actors/types2.ts";
import { Actor } from "../actorsystem/actor.ts";

class Address<T extends Actor> {
  constructor(public id: string, public type: new (...args: any[]) => T) {}
}
export type ActorMessage<T> = keyof T;

export const System = "system";

export type Message = {
  address: string | typeof System;
  type: any;
  payload: any;
};
type PayloadHandler = (payload: any) => void;

export class Postman {
  private actors: Map<string, Worker> = new Map();
  creationResolver: (value: any) => void;

  constructor(public localAddress: string) {
    this.creationResolver = (value) => value;
  }

  async add(address: string) : Promise<string> {
    const worker = new Worker(
      new URL(`../actors/${address}`, import.meta.url).href,
      {
        type: "module",
      },
    );
    worker.postMessage({ type: "init", payload: null });
    worker.onmessage = (event: MessageEvent<Message>) => {
      this.onmessage(worker, event);
    };
    const created = new Promise<any>((resolve) => {
      this.creationResolver = (value: any): any => {
        resolve(value);
        return value;
      };
    });
    console.log("WWW");
    const id = await created;
    console.log("created", id);
    this.actors.set(id, worker);
    return id;
  }

  onmessage = (worker: Worker, event: MessageEvent<Message>) => {
    console.log("main thread msg", event.data);

    if (event.data.address == System) {
      const func = event.data.type;
      const payload = event.data.payload;

      const obj: { [key: string]: PayloadHandler } = {
        alive: (_payload) => {
          console.log("dead");
        },

        create: async (payload) => {
          const id = await this.add(payload);
          worker.postMessage({ type: "register", payload: id });
        },

        loaded: (payload) => {
          console.log("load msg", payload);
          this.creationResolver(payload);
        },
      };
      obj[func]?.(payload);
    } else {
      console.log("not system", event.data);
      const worker = this.actors.get(event.data.address);
      if (worker) {worker.postMessage(event.data);}
    }
  };

  PostMessage<T extends Actor, P = any>(
    address: any,
    type: string,
    payload: P,
  ) {
    console.log(
      "postMAN message add",
      address,
      "type",
      type,
      "payload",
      payload,
    );
    const worker = this.actors.get(address);
    if (worker) {
      worker.postMessage({ type, payload });
    } else {
      console.error(`No worker found for address ${address.id}`);
    }
  }
}
