import { Client } from 'discord.js';
import fs from 'fs';

export default async function discordEvents(client: Client) {
  const eventFiles = fs.readdirSync('./events/discord');

  for (const file of eventFiles) {
    const event = await import(`../events/discord/${file}`);
    const name = file.split('.')[0];
    client.on(name, event.default.bind(null, client));
  }
}
