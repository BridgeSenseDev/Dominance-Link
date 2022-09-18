const db = require('better-sqlite3')('matrix.db');
const { EmbedBuilder } = require('discord.js');
const { formatMentions, UUIDtoName } = require('../../helper/utils');

module.exports = {
  execute: async (client, message) => {
    let uuid;
    if (message.author.bot) return;
    if (message.channel.id === logChannel.id) {
      await bot.chat(message.content);
    } else if (message.channel.id === guildChat.id) {
      let user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
      if (user === undefined) {
        try {
          ({ uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(message.author.id));
        } catch (err) {
          await message.member.roles.add(message.guild.roles.cache.get('907911526118223912'));
          const embed = new EmbedBuilder()
            .setColor(0xe74d3c)
            .setTitle('Error')
            .setDescription(`<a:across:986170696512204820> <@${message.author.id}> Please verify first in <#907911357582704640>`);
          message.reply({ embeds: [embed] });
          return;
        }
        db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(message.author.id, uuid);
        user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
      }
      message.content = await formatMentions(client, message);
      message.content = message.content.replace(/\n/g, '');
      const { length } = `/gc ${await UUIDtoName(user.uuid)} ${user.tag}: ${message.content}`;
      if (length > 256) {
        await guildChat.send(`Character limit exceeded (${length})`);
        return;
      }
      await bot.chat(`/gc ${await UUIDtoName(user.uuid)} ${user.tag}: ${message.content}`);
      await message.delete();
    } else if (message.channel.id === officerChat.id) {
      let user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
      if (user === undefined) {
        const uuid = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(message.author.id);
        if (uuid === undefined) {
          await message.author.roles.add(message.guild.roles.cache.get('907911526118223912'));
          const embed = new EmbedBuilder()
            .setColor(0xe74d3c)
            .setTitle('Error')
            .setDescription(`<a:across:986170696512204820> <@${message.author.id}> Please verify first in <#907911357582704640>`);
          message.reply({ embeds: [embed] });
          return;
        }
        db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(message.author.id, uuid);
        user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
      }
      message.content = await formatMentions(client, message);
      message.content = message.content.replace(/\n/g, '');
      const { length } = `/oc ${await UUIDtoName(user.uuid)} ${user.tag}: ${message.content}`;
      if (length > 256) {
        await guildChat.send(`Character limit exceeded (${length})`);
        return;
      }
      await bot.chat(`/oc ${await UUIDtoName(user.uuid)} ${user.tag}: ${message.content}`);
      await message.delete();
    }
  },
};
