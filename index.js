const fs = require('fs');
const { REST } = require('@discordjs/rest');
const {
  Client, GatewayIntentBits, Collection, Routes,
} = require('discord.js');
const config = require('./config.json');
const gexpWatch = require('./helper/gexpWatch');
const channelUpdate = require('./helper/channelUpdate');
const { autoRejoin, startBot } = require('./helper/autoRejoin');
const {
  database, gsrun, sheet, weekly,
} = require('./helper/database');
// eslint-disable-next-line no-unused-vars
const { notificationRoles, gamemodeRoles, applications } = require('./embeds/buttons');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  rest: { rejectOnRateLimit: (rateLimitData) => rateLimitData },
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./slashCommands/');

const commands = [];
for (const file of commandFiles) {
  const command = require(`./slashCommands/${file}`);
  commands.push(command.data.toJSON());
  if (command.data.name) {
    client.commands.set(command.data.name, command);
  }
}

fs.readdirSync('./events/discord')
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const event = require(`./events/discord/${file}`);
    const name = file.split('.')[0];
    client.on(name, event.execute.bind(null, client));
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
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.login(config.keys.discordBotToken);

client.login(config.keys.discordBotToken);
