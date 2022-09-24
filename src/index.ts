import fs from 'fs';
import { DisTube } from 'distube';
import { SpotifyPlugin } from '@distube/spotify';
import { REST } from '@discordjs/rest';
import {
  Client, GatewayIntentBits, Collection, Routes,
} from 'discord.js';
import config from './config.json' assert {type: 'json'};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  leaveOnEmpty: false,
  leaveOnFinish: false,
  leaveOnStop: false,

  plugins: [new SpotifyPlugin()],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./slashCommands/');
const commands = [];

Object.values(commandFiles).forEach(async (file) => {
  const command = await import(`./slashCommands/${file}`);
  commands.push(command.data.toJSON());
  if (command.data.name) {
    client.commands.set(command.data.name, command);
  }
});

const eventFiles = fs.readdirSync('./events/discord');

Object.values(eventFiles).forEach(async (file) => {
  const event = await import(`./events/discord/${file}`);
  const name = file.split('.')[0];
  client.on(name, event.default.bind(null, client));
});

const clientId = '960769680765771806';
const guildId = '242357942664429568';
const rest = new REST({ version: '10' }).setToken(config.keys.discordBotToken);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );
    // eslint-disable-next-line no-console
    console.log('[DISCORD] Successfully reloaded application commands.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
})();

client.login(config.keys.discordBotToken);

export default client;
