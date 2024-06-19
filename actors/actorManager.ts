import { Message, System } from "../actorsystem/postMan.ts";
import { Contents, payload, PayloadHandler } from "./types2.ts";

export class actorManager {
  static creationResolver: (value: Contents) => void;
  static worker: Worker;

  static functions: { [key: string]: PayloadHandler } = {
    register: (payload) => {
      console.log("register", payload);
      this.creationResolver(payload);
    },
  };

  constructor(worker: Worker, functions: any) {
    actorManager.creationResolver = (value) => value as payload;
    actorManager.functions = { ...actorManager.functions, ...functions };
  }

  static async runFunction(event: MessageEvent<Message>) {
    console.log("run webworker", event.data);
    this.functions[event.data.type]?.(event.data.payload);
  }

  static postmessage(worker: Worker, message: Message) {
    worker.postMessage(message);
  }

  static async create(worker: Worker, actorname: string): Promise<payload> {
    const created = new Promise<Contents>((resolve) => {
      this.creationResolver = (value: Contents): Contents => {
        resolve(value);
        return value;
      };
    });

    worker.postMessage({
      address: System,
      type: "create",
      payload: actorname,
    });
    console.log("wait crea");

    await created;
    console.log("created!");

    return created;
  }
}
