import { writeFileSync } from "node:fs";
import config from "../../config.json";
import { chat } from "../../handlers/workerHandler.js";
import { textChannels } from "../discord/clientReady.ts";

let emittedEvent = false;
export default async function execute() {
  if (!emittedEvent) {
    writeFileSync("./config.json", JSON.stringify(config, null, 2));
    await textChannels["botStatus"].send(
      `${config.minecraft.ign} has logged in to Hypixel.`,
    );
    console.log(`[MINECRAFT] Logged in as ${config.minecraft.ign}`);
    emittedEvent = true;

    setTimeout(async () => {
      chat("/g online");
    }, 10000);
  }
}
