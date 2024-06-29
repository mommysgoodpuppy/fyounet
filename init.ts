import { PostalService } from "./actorsystem/PostalService.ts";

const postalservice = new PostalService();

const mainAddress = await postalservice.add("worker.ts");

postalservice.Post({
  address: { fm: "system", to: mainAddress },
  type: "MAIN",
  payload: null,
});
