import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { bullet, dividers } from '../helper/constants.js';
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
  const gexpEmbed = new EmbedBuilder()
  .setColor(config.colors.discordGray)
  .setAuthor({ name: 'GEXP Info', iconURL: config.guild.icon })
  .setDescription(
    `**GEXP Scaling:**\n\n${bullet} When the guild reaches \`200,000\` daily GEXP, XP gain is scaled down to \`10%\`\n${bullet} When ` +
      `the guild reaches \`250,000\` daily GEXP, XP gain is scaled down to \`3%\`\n${bullet} The reward summary after games displays ` +
      `your **scaled** gexp\n${bullet} Your **raw** GEXP is shown in \`/g top\`, \`/g member\` and the Hypixel API\n\n${dividers(26)}` +
      `\n\n**GEXP Requirements:**\n\n${bullet} Our GEXP requirement is ${config.guild.gexpReq} weekly GEXP\n${bullet} If you are unable ` +
      `to meet the requirements, make a [break form]()`
  )
  .setFooter({
    text: `Updated ${formatDate(new Date())}`,
    iconURL: config.guild.icon
  })

  const dominanceLinkEmbed = new EmbedBuilder()
  .setColor(config.colors.discordGray)
  .setAuthor({ name: 'Dominance Link', iconURL: config.guild.icon })
  .setDescription(
    `a`
  )
  .setFooter({
    text: `Updated ${formatDate(new Date())}`,
    iconURL: config.guild.icon
  })

  const staffEmbed = new EmbedBuilder()
  .setColor(config.colors.discordGray)
  .setAuthor({ name: 'Staff', iconURL: config.guild.icon })
  .setDescription(
    `a`
  )
  .setFooter({
    text: `Updated ${formatDate(new Date())}`,
    iconURL: config.guild.icon
  })

  const socialsEmbed = new EmbedBuilder()
  .setColor(config.colors.discordGray)
  .setAuthor({ name: 'Socials', iconURL: config.guild.icon })
  .setDescription(
    `a`
  )
  .setFooter({
    text: `Updated ${formatDate(new Date())}`,
    iconURL: config.guild.icon
  })

  const overviewEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Overview', iconURL: config.guild.icon })
    .setDescription(
      `${bullet} GEXP Info\n${bullet} Breaks\n${bullet} Dominance Link\n${bullet} Staff\n${bullet} Socials`
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    })
    .setImage(config.guild.banner);

  const channel = client.channels.cache.get('1036643935134695554') as TextChannel;
  await channel.send({ embeds: [gexpEmbed, dominanceLinkEmbed, staffEmbed, socialsEmbed, overviewEmbed]})
});

client.login(config.keys.discordBotToken);
