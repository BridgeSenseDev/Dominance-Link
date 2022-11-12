import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

function formatMembers(message: string[] | string[][]) {
  let online = '';
  for (let i = 1; i < message.length - 3; i += 1) {
    if (message[i].includes('-- ')) {
      message[i] = (message[i] as string).trim();
      if (i === 1) online += `**${message[i].slice(3, -3)}**\n`;
      else {
        online = online.slice(0, online.length - 2);
        online += `\n\n**${message[i].slice(3, -3)}**\n`;
      }
    } else if (message[i].includes('●')) {
      message[i] = (message[i] as string).split(/\s+/);
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
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  let offlineMembers = 0;
  let totalMembers = 0;
  try {
    offlineMembers = parseInt(global.guildOnline[global.guildOnline.length - 1].split('Offline Members: ')[1], 10);
  } catch (e) {
    await interaction.editReply('`/g online` timed out, try again in a few minutes');
    return;
  }
  totalMembers = parseInt(global.guildOnline[global.guildOnline.length - 3].split('Total Members: ')[1], 10);
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
