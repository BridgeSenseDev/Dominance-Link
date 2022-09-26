import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
} from 'discord.js';
import config from '../config.json' assert {type: 'json'};
import { formatDate } from '../helper/utils.js';

export default async function requirements(client, channelId) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setAuthor({ name: 'Guild Requirements', iconURL: config.guild.icon })
    .setDescription(`**Our current GEXP requirement is \`${config.guild.gexpReq}\` per week\nClick the button below to check if you meet our requirements**\n\n════ ⋆★⋆ ════\n\n**\
    [Requirements]**\n**You must meet at least one of these requirements to join:**\n\`Achievement Points\`\n\`-\` 10k AP\n\`Arcade\`\n\`-\` 1.5k Wins\n\`Bedwars\`\n\`-\` \
    200 Stars\n\`-\` 3 FKDR\n\`Build Battle\`\n\`-\`20k Score\n\`Duels\`\n\`-\` 10k Wins\n\`-\` 2 WLR\n\`Murder Mystery\`\n\`-\` 2k Wins\n\`Pit\`\n\`-\` Prestige 15\n\
    \`Skywars\`\n\`-\` 13 Stars\n\`-\` 1.5 KDR\n\`Skyblock (API On)\`\n\`-\` \
    500m Networth\n\`-\` 30 Skill Average\n\`TNT Games\`\n\`-\` 800 Wins\n\n════ ⋆★⋆ ════\n\n**[What You Could Get Rejected For]**\n\
    \`1\` Having an offensive mc name/profile\n\`2\` Being toxic\n\`3\` Being a \
    known hacker/cheater\n\`4\` Not writing enough on your application\n\`5\` Not meeting our requirements\n\`6\` Being a guild hopper\n\n════ ⋆★⋆ ════`)
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('requirements')
        .setLabel('Check Requirements')
        .setStyle(ButtonStyle.Success)
        .setEmoji('a:checkmark:1011799454959022081'),
    );
  const channel = client.channels.cache.get(channelId);
  await channel.send({ components: [row], embeds: [embed] });
}