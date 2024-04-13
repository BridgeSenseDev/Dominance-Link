import fs from "node:fs";
import type { Client } from "discord.js";

export default async function discordEvents(client: Client) {
  const eventFiles = fs.readdirSync("./events/discord");

  for (const file of eventFiles) {
    const event = await import(`../events/discord/${file}`);
    const name = file.split(".")[0];
    client.on(name, event.default.bind(null, client));
  }
}
