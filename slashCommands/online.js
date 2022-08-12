const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function formatMembers(msg) {
  let online = '';
  for (let i = 1; i < msg.length - 3; i += 1) {
    if (msg[i].indexOf('-- ') !== -1) {
      msg[i] = msg[i].trim();
      if (i === 1) online += `**${msg[i].slice(3, -3)}**\n`;
      else {
        online = online.slice(0, online.length - 2);
        online += `\n\n**${msg[i].slice(3, -3)}**\n`;
      }
    } else if (msg[i].indexOf('●')) {
      msg[i] = msg[i].split(/\s+/);
      for (let j = 0; j < msg[i].length; j += 1) {
        if (!(msg[i][j].indexOf('●') !== -1 || msg[i][j].indexOf('[') !== -1 || msg[i][j] === '')) {
          online += `\`${msg[i][j]}\`, `;
        }
      }
    }
  }
  return online.slice(0, online.length - 2);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('online')
    .setDescription('List all online members in the guild'),

  async execute(interaction) {
    await interaction.deferReply();
    let offlineMembers = 0;
    let totalMembers = 0;
    try {
      [, offlineMembers] = guildOnline[guildOnline.length - 1].split('Offline Members: ');
    } catch (e) {
      await interaction.editReply('`/g online` timed out, try again in a few minutes');
      return;
    }
    [, totalMembers] = guildOnline[guildOnline.length - 3].split('Total Members: ');
    const online = formatMembers(guildOnline);

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle('Online Members')
      .setDescription(`${online}\n\nTotal Members: \`${totalMembers}\` / \`125\`\nOnline Members: \`${onlineMembers}\`\nOffline Members: \`${offlineMembers}\``)
      .setThumbnail(config.guild.icon);
    await interaction.editReply({ embeds: [embed] });
  },
};
