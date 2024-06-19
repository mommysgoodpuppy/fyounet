//#region imports
//helpers
import { getAvailablePort } from "https://raw.githubusercontent.com/jakubdolejs/deno-port/main/mod.ts";

//actorSystem
import {
  Actor,
  Address,
  CloudAddress,
  isActorId,
} from "./actorsystem/types.ts";
import { actorManager } from "./actorsystem/actorManager.ts"; //main system
import { cloudSpace } from "./actorsystem/cloudActorManager.ts"; //cloud networking system
import { aPortal } from "./actors/PortalActor.ts"; //helper actor for addressmanagement

//generic actors
import { aTest } from "./actors/TestActor.ts";

//#endregion

//#region actor payload types

//#endregion
//#region consts

const stream = Deno.stdin.readable.values();

console.log("runtime args: " + Deno.args); // ['one, 'two', 'three']
const username = Deno.args[0];
const ownip = Deno.args[1];
const friendip = Deno.args[2];

//username and ip
const localfullip = ownip;
const localip = localfullip.split(":")[0];

const ovrIPath =
  `${Deno.cwd()}/../${"../OVRINTERFACE/out/build/user/Debug/ovrinput.exe"}`;
const ovrPath =
  `${Deno.cwd()}/../${"../OVRINTERFACE/out/build/user/Debug/petplay.exe"}`;

const absImgPath = `${Deno.cwd()}/../${"../resources/PetPlay.png"}`;
//#endregion
//#region helper funcs

async function IP() {
  return `${localip}:${await getAvailablePort()}`;
}

async function wait(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
async function asyncPrompt(): Promise<string> {
  const next = await stream.next();
  if ("done" in next && next.done) {
    return "";
  } else {
    return new TextDecoder().decode(next.value).slice(0, -1);
  }
}
//commented out for now
/* async function processcommand(msgD: string) {

    const msg = msgD.replace(/\r/g, '');

    const cmd = msg.substring(1).split(" ");
    switch (cmd[0]) {
        case "c": {
            //initial connection

            if (!cmd[1]) {
                console.log(`Connecting to ${friendip}...`)
                //actormanager.command(aChatApp, "h_connect", friendip)
                //here were technically sharing our portal with friendip
                actormanager.command(portalActor, "h_connect", friendip)
            }
            else
            {
            console.log(`Connecting to ${cmd[1]}...`)
            //actormanager.command(aChatApp, "h_connect", cmd[1])
            actormanager.command(portalActor, "h_connect", cmd[1])
            break;
            }
            break
        }
        case "listactors": {
            actormanager.listactors()
            break;
        }
        case "hlistractors": {
            //control a remote actor 🤯
            const remoteportal = cmd[1] as Address<aPortal>
            actormanager.command(remoteportal, "h_listactors", portalActor)
            break;
        }
        case "hlistactors": {
            actormanager.command(portalActor, "h_listactors", portalActor)
            break;
        }
        case "addoverlay": {
            const aOverlay: Address<SimpleOverlayActor> = actormanager.add(
                new SimpleOverlayActor(await IP(), "aSimpleOverlay", "./dependencies/petplay.exe")
            );

            //make overlay public?
            actormanager.command(portalActor, "h_recordAddress", aOverlay)
            break
        }

        default: {
            console.log(`Unknown command '/${cmd}'.`)
            break;
        }
    }
} */
//#endregion
//#region old code
/* //create actormanager

const cloud : cloudSpace = new cloudSpace(localfullip)

//create test actor
const testactor: Address<aTest> = actormanager.add(new aTest("testactor",await IP()))

//command test actor to log its internal state
actormanager.command(testactor, "h_logstate", null)

//change test actors internal state
actormanager.command(testactor, "h_test", null)

//check test actors internal state again
actormanager.command(testactor, "h_logstate", null)

//transfer test actor to cloud space
const cloudtestactor : CloudAddress<Address<aTest>> = await actormanager.transferToCloudSpace(testactor, cloud)

//check test actors internal state in the cloud
cloud.command(cloudtestactor, "h_logstate", null)

//create a portal actor, essentially a public endpoint of an user, contains an addressbook where actor addresses can be added
const portalActor: Address<aPortal> = actormanager.add(new aPortal(ownip, username))

//record the address of the vr actor to our portals address book for external access
actormanager.command(portalActor, "h_recordAddress", cloudtestactor)


//this should probably list actors in cloudspace
actormanager.listactors() */
//#endregion

//PROGRAM STARTS HERE

const actormanager = new actorManager(localfullip);

const testactor : Address<aTest> = actormanager.add(new aTest("testactor", await IP()));

actormanager.command(testactor, "h_logstate", null);


//const testactor = new Worker(import.meta.resolve("./actors/TestActor.ts"), { type: "module" });

testactor.postMessage({ filename: "./log.txt" });


if (import.meta.main) {
  console.log(`Your IP is ${await IP()}`);

  while (true) {
    const msg = await asyncPrompt() ?? "";

    if (msg.startsWith("/")) {
      console.log("Command");
      //await processcommand(msg)
    } else {
      // clear line
      await Deno.stdout.write(new TextEncoder().encode("\x1b[1A\r\x1b[K"));
    }
  }
}
