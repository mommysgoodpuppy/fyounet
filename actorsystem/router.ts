import { initTRPC } from "@trpc/server";
import { xMessage } from "./types.ts";

const t = initTRPC.create();

export const appRouter = t.router({
  processMessage: t.procedure
    .input(xMessage.assert)
    .mutation(({ input }) => {
      console.log("Received message:", input);
      // Process message based on its type
      switch (input.type) {
        case "SHUT":
          // Handle OTHER_TYPE1 type message
          break;
      }
      return input;
    }),
  readFile: t.procedure
    .input(String)
    .query(async ({ input }) => {
      const text = await Deno.readTextFile(input);
      return text;
    }),
});

export type AppRouter = typeof appRouter;
