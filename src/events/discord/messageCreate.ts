import { EmbedBuilder } from 'discord.js';
import Database from 'better-sqlite3';
import { formatMentions, UUIDtoName } from '../../helper/utils.js';
import config from '../../config.json' assert {type: 'json'};

const db = new Database('matrix.db');

async function execute(client, message) {
  const msg = message;
  if (msg.author.bot) return;
  let uuid;
  if (msg.content.toLowerCase().includes('matrix')) {
    await msg.react(':Matrix:1017274754387947561');
  }
  if (msg.channel.id === global.logChannel.id) {
    await global.bot.chat(msg.content);
  } else if (msg.channel.id === global.guildChat.id) {
    let user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(msg.author.id);
    if (user === undefined) {
      try {
        ({ uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(msg.author.id));
      } catch (err) {
        await msg.member.roles.add(msg.guild.roles.cache.get('907911526118223912'));
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription(`<a:across:986170696512204820> <@${msg.author.id}> Please verify first in <#907911357582704640>`);
        msg.reply({ embeds: [embed] });
        return;
      }
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(msg.author.id, uuid);
      user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(msg.author.id);
    }
    msg.content = await formatMentions(client, msg);
    msg.content = msg.content.replace(/\n/g, '');
    let length;
    try {
      ({ length } = `/gc ${await UUIDtoName(user.uuid)} ${user.tag}: ${msg.content}`);
    } catch (e) {
      return;
    }
    if (length > 256) {
      await global.guildChat.send(`Character limit exceeded (${length})`);
      return;
    }
    await global.bot.chat(`/gc ${await UUIDtoName(user.uuid)} ${user.tag}: ${msg.content}`);
    await msg.delete();
  } else if (msg.channel.id === global.officerChat.id) {
    let user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(msg.author.id);
    if (user === undefined) {
      uuid = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(msg.author.id);
      if (uuid === undefined) {
        await msg.author.roles.add(msg.guild.roles.cache.get('907911526118223912'));
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription(`<a:across:986170696512204820> <@${msg.author.id}> Please verify first in <#907911357582704640>`);
        msg.reply({ embeds: [embed] });
        return;
      }
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(msg.author.id, uuid);
      user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(msg.author.id);
    }
    msg.content = await formatMentions(client, msg);
    msg.content = msg.content.replace(/\n/g, '');
    const { length } = `/oc ${await UUIDtoName(user.uuid)} ${user.tag}: ${msg.content}`;
    if (length > 256) {
      await global.guildChat.send(`Character limit exceeded (${length})`);
      return;
    }
    await global.bot.chat(`/oc ${await UUIDtoName(user.uuid)} ${user.tag}: ${msg.content}`);
    await msg.delete();
  }
}

export default execute;
