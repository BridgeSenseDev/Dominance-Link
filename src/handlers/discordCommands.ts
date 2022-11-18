import SpotifyPlugin from '@distube/spotify';
import { Client, Collection, REST, Routes } from 'discord.js';
import DisTube from 'distube';
import fs from 'fs';
import config from '../config.json' assert { type: 'json' };

export default async function discordCommands(client: Client) {
  client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnEmpty: false,
    leaveOnFinish: false,
    leaveOnStop: false,

    plugins: [new SpotifyPlugin()]
  });

  client.commands = new Collection();
  const commandFiles = fs.readdirSync('./slashCommands/');
  const commands = [];

  for (const file of commandFiles) {
    const command = await import(`./slashCommands/${file}`);
    commands.push(command.data.toJSON());
    if (command.data.name) {
      client.commands.set(command.data.name, command);
    }
  }

  const clientId = '960769680765771806';
  const guildId = '242357942664429568';
  const rest = new REST({ version: '10' }).setToken(config.keys.discordBotToken);

  (async () => {
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log('[DISCORD] Successfully reloaded application commands.');
    } catch (error) {
      console.error(error);
    }
  })();
}
