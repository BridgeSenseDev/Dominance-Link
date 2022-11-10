import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

function formatMembers(msg) {
  const message = msg;
  let online = '';
  for (let i = 1; i < message.length - 3; i += 1) {
    if (message[i].includes('-- ')) {
      message[i] = message[i].trim();
      if (i === 1) online += `**${message[i].slice(3, -3)}**\n`;
      else {
        online = online.slice(0, online.length - 2);
        online += `\n\n**${message[i].slice(3, -3)}**\n`;
      }
    } else if (message[i].includes('●')) {
      message[i] = message[i].split(/\s+/);
      for (let j = 0; j < message[i].length; j += 1) {
        if (!(message[i][j].includes('●') || message[i][j].includes('[') || message[i][j] === '')) {
          online += `\`${message[i][j]}\`, `;
        }
      }
    }
  }
  return online.slice(0, online.length - 2);
}

export const data = new SlashCommandBuilder().setName('online').setDescription('List all online members in the guild');
export async function execute(interaction) {
  await interaction.deferReply();
  let offlineMembers = 0;
  let totalMembers = 0;
  try {
    [, offlineMembers] = global.guildOnline[global.guildOnline.length - 1].split('Offline Members: ');
  } catch (e) {
    await interaction.editReply('`/g online` timed out, try again in a few minutes');
    return;
  }
  [, totalMembers] = global.guildOnline[global.guildOnline.length - 3].split('Total Members: ');
  const online = formatMembers(global.guildOnline);

  const embed = new EmbedBuilder()
    .setColor(3092790)
    .setTitle('Online Members')
    .setDescription(
      `${online}\n\nTotal Members: \`${totalMembers}\` / \`125\`\nOnline Members: \`${global.onlineMembers}\`\nOffline Members: \`${offlineMembers}\``
    )
    .setThumbnail(config.guild.icon);
  await interaction.editReply({ embeds: [embed] });
}
