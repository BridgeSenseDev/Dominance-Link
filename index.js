const fs = require('fs');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { REST } = require('@discordjs/rest');
const {
  Client, GatewayIntentBits, Collection, Routes,
} = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  rest: { rejectOnRateLimit: (rateLimitData) => rateLimitData },
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

module.exports = {
  client,
};
