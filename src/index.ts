import { Database } from "bun:sqlite";
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

export default client;
