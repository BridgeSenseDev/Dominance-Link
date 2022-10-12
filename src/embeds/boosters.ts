import {
  Client, GatewayIntentBits, EmbedBuilder, ChannelType,
} from 'discord.js';
import config from '../config.json' assert {type: 'json'};
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.on('ready', async () => {
  // eslint-disable-next-line no-console
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);
  const verifyEmbed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setAuthor({ name: 'Nitro Booster Perks', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1029645929604718613/1477-boosterbadgesroll.gif' })
    .setDescription('`-` <@&586753876066172943> role\n`-` Access to change your server nickname\n`-` Access to priority speaker\n`-` '
      + '[Nitro Booster] tag\n`-` Access to external stickers and emojis\n`-` Ability to request new server emojis and stickers\n`-` '
      + 'Exclusive permanent special role for 5 boosts')
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });

  const channel = client.channels.cache.get('982796960106938378');
  if (channel?.type === ChannelType.GuildText) {
    await channel.send({ embeds: [verifyEmbed] });
  }
});

client.login(config.keys.discordBotToken);
