import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel
} from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { dividers } from '../helper/constants.js';
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
  const verifyEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Verification', iconURL: config.guild.icon })
    .setDescription(
      `Welcome to the official **Dominance** discord server!\n\n${dividers(22)}\n\n**How To Verify:**\n\n**To gain access ` +
        `to our public channels, click the button below**\nMessage <@485703283839860736> if you need any help`
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    });

  const verifyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('verify')
      .setLabel('Verify')
      .setStyle(ButtonStyle.Success)
      .setEmoji('a:checkmark:1011799454959022081')
  );

  const channel = client.channels.cache.get('1031568019522072677') as TextChannel;
  await channel.send({
    components: [verifyRow],
    embeds: [verifyEmbed]
  });
});

client.login(config.keys.discordBotToken);
