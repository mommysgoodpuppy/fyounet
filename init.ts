import { Postman } from "./actorsystem/postMan.ts";
import { main } from "./actors/main.ts";

const postman = new Postman("localhost:8000");

const mainAddress = await postman.add("main.ts");

postman.PostMessage(mainAddress, "program", null);