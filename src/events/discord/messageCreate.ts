import { Client, EmbedBuilder, Message, Role } from 'discord.js';
import Database from 'better-sqlite3';
import { addXp, formatMentions, uuidToName } from '../../helper/utils.js';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { channels } from './ready.js';

const db = new Database('guild.db');

export default async function execute(client: Client, message: Message) {
  if (message.guildId !== '242357942664429568') return;
  addXp(message.author.id);
  if (message.author.bot) return;
  let uuid;
  if (message.content.toLowerCase().includes('dominance')) {
    await message.react(':dominance:1060579574347472946');
  }
  if (message.channel.id === channels.chatLogs.id) {
    await chat(message.content);
  } else if (message.channel.id === channels.minecraftLink.id) {
    let user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
    if (user === undefined) {
      try {
        ({ uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(message.author.id));
      } catch (err) {
        await message.member!.roles.add(message.guild!.roles.cache.get('907911526118223912') as Role);
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription(
            `<a:across:986170696512204820> <@${message.author.id}> Please verify first in <#907911357582704640>`
          );
        message.reply({ embeds: [embed] });
        return;
      }
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(message.author.id, uuid);
      user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
    }
    message.content = (await formatMentions(client, message))!;
    message.content = message.content.replace(/\n/g, '');
    let length;
    try {
      ({ length } = `/gc ${await uuidToName(user.uuid)} ${user.tag}: ${message.content}`);
    } catch (e) {
      return;
    }
    if (length > 256) {
      await channels.minecraftLink.send(`Character limit exceeded (${length})`);
      return;
    }
    await chat(`/gc ${await uuidToName(user.uuid)} ${user.tag}: ${message.content}`);
    await message.delete();
    db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
  } else if (message.channel.id === channels.officerChat.id) {
    let user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
    if (user === undefined) {
      try {
        ({ uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(message.author.id));
      } catch (e) {
        await message.member!.roles.add(message.guild!.roles.cache.get('907911526118223912') as Role);
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription(
            `<a:across:986170696512204820> <@${message.author.id}> Please verify first in <#907911357582704640>`
          );
        message.reply({ embeds: [embed] });
        return;
      }
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(message.author.id, uuid);
      user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(message.author.id);
    }
    message.content = (await formatMentions(client, message))!;
    message.content = message.content.replace(/\n/g, '');
    let length;
    try {
      ({ length } = `/oc ${await uuidToName(user.uuid)} ${user.tag}: ${message.content}`);
    } catch (e) {
      return;
    }
    if (length > 256) {
      await channels.minecraftLink.send(`Character limit exceeded (${length})`);
      return;
    }
    await chat(`/oc ${await uuidToName(user.uuid)} ${user.tag}: ${message.content}`);
    await message.delete();
    db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
  }
}
