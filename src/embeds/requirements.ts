import {
  Client, GatewayIntentBits, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle,
  ActionRowBuilder,
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
  const embed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setAuthor({ name: 'Guild Requirements', iconURL: config.guild.icon })
    .setDescription(`**Our current GEXP requirement is \`${config.guild.gexpReq}\` per week\nClick the button below to check if you \
    meet our requirements**\n\n════ ⋆★⋆ ════\n\n**[Requirements]**\n**You must meet at least one of these requirements to join:**\n\
    \`Achievement Points\`\n\`-\` 15k A.P.\n\`Bedwars 1\`\n\`-\` 2000 Wins\n\`-\` 3 FKDR\n\`Bedwars 2\`\n\`-\` 500 Stars\n\`Duels 1\`\n\`-\` \
    10k Wins\n\`-\` 2 WLR\n\`Duels 2\`\n\`-\` 5k Wins\n\`-\` 5 WLR\n\`Skywars 1\`\n\`-\` 15 Stars\n\`-\` 1 KDR\n\`Skywars 2\`\n\`-\` 10 Stars\n\
    \`-\` 1.5 KDR\n\`Skyblock (API On)\`\n\`-\` 750m Networth\n\`-\` 30 Skill Average\n\n════ ⋆★⋆ ════\n\n**[What You Could Get Rejected For]**\
    \n\`1\` Having an offensive mc name/profile\n\`2\` Being toxic\n\`3\` Being a known hacker/cheater\n\`4\` Not writing enough on your application\
    \n\`5\` Not meeting our requirements\n\`6\` Being a guild hopper\n\n════ ⋆★⋆ ════`)
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('requirements')
        .setLabel('Check Requirements')
        .setStyle(ButtonStyle.Success)
        .setEmoji('a:checkmark:1011799454959022081'),
    );

  const channel = client.channels.cache.get('498179573847031824');
  if (channel?.type === ChannelType.GuildText) {
    await channel.send({ components: [row], embeds: [embed] });
  }
});

client.login(config.keys.discordBotToken);
