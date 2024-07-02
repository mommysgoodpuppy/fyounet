import { appRouter } from "./actorsystem/router.ts";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { wait } from "./actorsystem/utils.ts";
import { ActorWorker, System } from "./actorsystem/types.ts";

const handler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/trpc")) {
    return fetchRequestHandler({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext: () => ({}),
    });
  }

  //#region default handler
  const body = `Your user-agent is:\n\n${
    request.headers.get("user-agent") ?? "Unknown"
  }`;
  //#endregion
  return await new Response(body, { status: 200 });
};

const worker = new ActorWorker(
  new URL("./main.ts", import.meta.url).href,
  { type: "module" },
);

await wait(5000);

worker.postMessage({
  address: { fm: System, to: null },
  type: "INIT",
  payload: null
});

worker.postMessage({
  address: { fm: System, to: null },
  type: "LOG",
  payload: null
});

worker.postMessage({
  address: { fm: System, to: null },
  type: "FILE",
  payload: "./text.txt"
});

worker.postMessage({
  address: { fm: System, to: null },
  type: "SHUT",
  payload: null
});

Deno.serve({ port: 8080 }, handler);
