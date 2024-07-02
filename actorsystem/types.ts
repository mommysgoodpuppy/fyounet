import { type } from "arktype";
import { ActorWorker } from "./ActorWorker.ts";

export const worker = self as unknown as ActorWorker;

export const xToAddress = type("string");
export type ToAddress = typeof xToAddress.infer;

export type BaseState = {
  name: string;
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
export const xMessageAddressReal = type({
  fm: "string",
  to: xToAddress,
});

export type MessageAddressReal = typeof xMessageAddressReal.infer;
export type MessageAddress =
  | typeof xMessageAddressSingle.infer
  | typeof xMessageAddressArray.infer;

//#endregion

//#region payloads

export const xPayloadSys = type({
  type: "'KEEPALIVE'",
  payload: "null",
}).or({
  type: "'LOADED'",
  payload: "string",
}).or({
  type: "'CREATE'",
  payload: "string",
}).or({
  type: "'MURDER'",
  payload: "string",
}).or({
  type: "'FIND_ROUTE'",
  payload: [xToAddress, "'CBROUTE'"],
}).or({
  type: "'SHUT'",
  payload: "null",
}).or({
  type: "'DELETE'",
  payload: xToAddress,
});

export const xPayloadMain = type({
  type: "'MAIN'",
  payload: "null|string",
});

export const xPayloadActor = type({
  type: "'LOG'",
  payload: "null",
}).or({
  type: "'INIT'",
  payload: "null",
}).or({
  type: "'REGISTER'",
  payload: xToAddress,
});

export const xPayloadRTC = type({
  type: "'RTC'",
  payload: "null",
}).or({
  type: "'CONNECT'",
  payload: xToAddress,
}).or({
  type: "'ADDREMOTE'",
  payload: xToAddress,
});

export const xPayloadSignaling = type({
  type: "'STARTSERVER'",
  payload: "number",
});

export const xPayload = type(
  xPayloadSys,
).or(
  xPayloadMain,
).or(
  xPayloadActor,
).or(
  xPayloadRTC,
).or(
  xPayloadSignaling,
);

export type xPayload = typeof xPayload.infer;
export type MessageType = typeof xPayload.infer.type;

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
