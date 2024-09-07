import { Client, GatewayIntentBits } from "discord.js";
import Hypixel from "hypixel-api-reborn";
import config from "./config.json" with { type: "json" };
import ready from "./events/discord/ready.js";

export const hypixel = new Hypixel.Client(config.keys.hypixelApiKey, {
  cache: true,
});

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

client.on("ready", () => {
  ready(client);
});

client.login(config.keys.discordBotToken);

setInterval(() => {
  fetch(config.keys.uptimeKuma).catch((error) =>
    console.error("Uptime Kuma fetch failed:", error),
  );
}, 60000);

export default client;
