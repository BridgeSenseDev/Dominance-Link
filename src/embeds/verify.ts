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
        `to our public channels, click verify below**\nCreate a ticket in <#867160066704146482> if you have any trouble verifying`
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
      .setEmoji(config.emojis.aCheckmark),
    new ButtonBuilder()
      .setCustomId('unverify')
      .setLabel('Unverify')
      .setStyle(ButtonStyle.Danger)
      .setEmoji(config.emojis.unlocked3d)
  );

  const channel = client.channels.cache.get('1031568019522072677') as TextChannel;
  await channel.send({
    components: [verifyRow],
    embeds: [verifyEmbed]
  });
});

client.login(config.keys.discordBotToken);
