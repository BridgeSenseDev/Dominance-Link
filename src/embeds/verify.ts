import {
  Client, GatewayIntentBits, EmbedBuilder, ChannelType,
} from 'discord.js';
import config from '../config.json' assert {type: 'json'};
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    // GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.MessageContent,
    // GatewayIntentBits.GuildMembers,
  ],
});

client.on('ready', async () => {
  // eslint-disable-next-line no-console
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);
  const verifyEmbed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setAuthor({ name: 'Verification', iconURL: config.guild.icon })
    .setDescription('Welcome to the offical **Matrix** discord server!\n\n════ ⋆★⋆ ════\n\n**[How To Verify]**\n**To gain access to our '
      + 'public channels, use the </verify:1023548883332255771> command**\nMessage <@485703283839860736> if you need any help\n\n════ ⋆★⋆ ════')
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });

  const channel = client.channels.cache.get('907911357582704640');
  if (channel?.type === ChannelType.GuildText) {
    await channel.send({ embeds: [verifyEmbed] });
  }
});

client.login(config.keys.discordBotToken);
