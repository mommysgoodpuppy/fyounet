import { type } from "arktype";

export const worker = self as unknown as ActorWorker;

export type ToAddress = string & { __brand: "ActorId" };

export type BaseState = {
  id: string;
  [key: string]: unknown;
};

export const System = "SYSTEM";
export const xSystem = type("'System'");
export type SystemType = typeof xSystem.infer;

export const xPairAddress = type({
  fm: "string",
  to: "string|null",
});
export type PairAddress = typeof xPairAddress.infer;

export const xSystemCommand = type({
  fm: xSystem,
  to: "null",
});
export type SystemCommand = typeof xSystemCommand.infer;

export const xWorkerToSystem = type({
  fm: "string",
  to: xSystem,
});
export type WorkerToSystem = typeof xWorkerToSystem.infer;

export const xMessageAddressSingle = type(
  xPairAddress,
).or(
  xSystemCommand,
).or(
  xWorkerToSystem,
);
export const xMessageAddressArray = type(xPairAddress.array());
export type MessageAddressSingle = typeof xMessageAddressSingle.infer;
export type MessageAddress =
  | typeof xMessageAddressSingle.infer
  | typeof xMessageAddressArray.infer;

//#endregion

export const xMessageTypeSys = type(
  "'KEEPALIVE'|'LOADED'|'CREATE'|'MURDER'",
);
export const xMessageTypeActor = type(
  "'INIT'|'REGISTER'",
);
export const xMessageTypeRTC = type(
  "'CONNECT'|'RELAYMSG'|'NETWORKACTOR'",
);
export const xMessageTypeFunctions = type(
  "'MAIN'|'FILE'|'SHUT'|'OTHER_TYPE2'|'STARTSERVER'|'LOG'",
);
export const xMessageType = type(
  xMessageTypeSys,
).or(
  xMessageTypeActor,
).or(
  xMessageTypeRTC,
).or(
  xMessageTypeFunctions,
);
export type MessageType = typeof xMessageType.infer;

//#region payloads
export const xPayload = type({
  type: "'CONNECT'",
  payload: "string",
}).or({
  type: "'NETWORKACTOR'",
  payload: "string",
}).or({
  type: "'RELAYMSG'",
  payload: "string",
}).or({
  type: "'STARTSERVER'",
  payload: "number",
}).or({
  type: "'MURDER'",
  payload: "string",
}).or({
  type: "'KEEPALIVE'",
  payload: "null",
}).or({
  type: "'FILE'",
  payload: "string",
}).or({
  type: "'MAIN'",
  payload: "null",
}).or({
  type: "'LOG'",
  payload: "null",
}).or({
  type: "'OTHER_TYPE2'",
  payload: "string",
}).or({
  type: "'STARTSERVER'",
  payload: "number",
}).or({
  type: "'SHUT'",
  payload: "null",
}).or({
  type: "'LOADED'",
  payload: "string",
}).or({
  type: "'CREATE'",
  payload: "string",
}).or({
  type: "'INIT'",
  payload: "string|null",
}).or({
  type: "'REGISTER'",
  payload: "string",
});

export type xPayload = typeof xPayload.infer;
export type Payload = {
  [K in MessageType]: Extract<
    xPayload,
    { type: K }
  >["payload"];
};
//#endregion

export const xMessage = type([
  { address: xMessageAddressSingle },
  "&",
  xPayload,
]);
export type Message = typeof xMessage.infer;

//payloads
export type hFunction = (_payload: Payload[MessageType]) => void;

export type PayloadHandler<T extends MessageType> = (
  payload: Payload[T],
  address: PairAddress,
) => hFunction | void | Promise<void>;

export type ActorFunctions = { [K in MessageType]?: PayloadHandler<K> };

export type nonArrayAddress = PairAddress | SystemCommand | WorkerToSystem;

export function notAddressArray(
  address: Message["address"],
): address is nonArrayAddress {
  return !Array.isArray(address);
}

export class ActorWorker extends Worker {
  constructor(scriptURL: string | URL, options?: WorkerOptions) {
    super(scriptURL, options);
  }

  postMessage(message: Message, transfer: Transferable[]): void;
  postMessage(message: Message, options?: StructuredSerializeOptions): void;
  postMessage(
    message: Message,
    transferOrOptions?: Transferable[] | StructuredSerializeOptions,
  ): void {
    message.address = JSON.stringify(
      message.address,
    ) as unknown as MessageAddressSingle;
    if (Array.isArray(transferOrOptions)) {
      super.postMessage(message, transferOrOptions);
    } else {
      super.postMessage(message, transferOrOptions);
    }
  }
}
