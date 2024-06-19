export type payload = any | null;
export interface Contents {
  type: string;
  payload: payload;
}
export type PayloadHandler = (payload: any) => void;
export const worker = self as unknown as Worker;
