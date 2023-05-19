import { Client, GatewayIntentBits } from 'discord.js';
import config from './config.json' assert { type: 'json' };
import ready from './events/discord/ready.js';

const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences
  ]
});

client.on('ready', () => {
  ready(client);
});

client.login(config.keys.discordBotToken);

export default client;
