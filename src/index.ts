import { Database } from "bun:sqlite";
import { writeHeapSnapshot } from "node:v8";
import { Client, GatewayIntentBits } from "discord.js";
import Hypixel from "hypixel-api-reborn";
import config from "./config.json";
import clientReady from "./events/discord/clientReady.ts";

export const hypixel = new Hypixel.Client(config.keys.hypixelApiKey, {
  cacheTime: 600,
});

export const db = new Database("guild.db", {
  create: true,
  strict: true,
});
db.query("PRAGMA journal_mode = WAL;").run();

const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
  ],
});

client.on("clientReady", () => {
  clientReady(client);
});

client.login(config.keys.discordBotToken);

setInterval(() => {
  fetch(config.keys.uptimeKuma).catch((error) =>
    console.error("Uptime Kuma fetch failed:", error),
  );
}, 60000);

setInterval(
  () => {
    const filename = `heap-${Date.now()}.heapsnapshot`;
    console.log(`[DEBUG] Saving memory snapshot to ${filename}...`);

    // This saves the file to the current folder on the VPS
    writeHeapSnapshot(filename);

    console.log(`[DEBUG] Snapshot saved!`);
  },
  1000 * 60 * 60 * 4,
);

export default client;
