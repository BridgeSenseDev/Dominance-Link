const db = require('better-sqlite3')('matrix.db');
const { EmbedBuilder } = require('discord.js');
const { formatMentions, UUIDtoName } = require('../../helper/utils');

module.exports = {
  execute: async (client, message) => {
    if (message.author.bot) return;
    if (message.channel.id === logChannel.id) {
      await bot.chat(message.content);
    } else if (message.channel.id === guildChat.id) {
      const user = db.prepare('SELECT uuid, tag FROM guild_members WHERE discord = ?').get(message.author.id);
      if (user === undefined) {
        const embed = new EmbedBuilder()
          .setColor(0xe74d3c)
          .setTitle('Error')
          .setDescription('Please link your discord account to your minecraft account using `/link`');
        message.reply({ embeds: [embed] });
        return;
      }
      message.content = await formatMentions(client, message);
      message.content = message.content.replace(/\n/g, '');
      const { length } = `/gc ${await UUIDtoName(user.uuid)} ${user.tag}: ${message.content}`;
      if (length > 256) {
        await guildChat.send(`Character limit exceeded (${length})`);
        return;
      }
      await bot.chat(`/gc ${await UUIDtoName(user.uuid)} ${user.tag}: ${message.content}`);
    }
  },
};
