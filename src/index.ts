import { Client, GatewayIntentBits } from 'discord.js';
import config from './config.json' assert { type: 'json' };
import discordCommands from './handlers/discordCommands.js';
import discordEvents from './handlers/discordEvents.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

discordCommands(client);
discordEvents(client);

client.login(config.keys.discordBotToken);

export default client;
