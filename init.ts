import { PostalService } from "./actorsystem/PostalService.ts";
import "./actors/main.ts";
import "./actors/subactor.ts";
import "./actors/signalingDenoServer.ts";

const postalservice = new PostalService();

const mainAddress = await postalservice.add("main.ts");

postalservice.Post({
  address: { fm: "system", to: mainAddress },
  type: "MAIN",
  payload: null,
});

const stream = Deno.stdin.readable.values();
async function asyncPrompt(): Promise<string> {
  const next = await stream.next();
  if ("done" in next && next.done) {
    return "";
  } else {
    return new TextDecoder().decode(next.value).slice(0, -1);
  }
}

if (import.meta.main) {
  while (true) {
    const msg = await asyncPrompt() ?? "";
    postalservice.Post({
      address: { fm: "system", to: mainAddress },
      type: "STDIN",
      payload: msg,
    });
  }
}
