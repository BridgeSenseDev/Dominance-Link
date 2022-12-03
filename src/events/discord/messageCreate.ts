import { Client, EmbedBuilder, Message, Role } from 'discord.js';
import Database from 'better-sqlite3';
import { formatMentions, uuidToName } from '../../helper/utils.js';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { channels } from './ready.js';
import { StringObject } from '../../types/global.d.js';

const db = new Database('guild.db');

const lastMessage: StringObject = {};

export default async function execute(client: Client, message: Message) {
  if (message.guildId !== '242357942664429568') return;
  if (message.author.id.toString() in lastMessage) {
    if (Date.now() / 1000 - Number(lastMessage[message.author.id]) >= 60) {
      db.prepare('UPDATE members SET xp = xp + ? WHERE discord = ?').run(
        Math.floor(Math.random() * 11 + 15),
        message.author.id
      );
    }
  } else {
    db.prepare('UPDATE members SET xp = xp + ? WHERE discord = ?').run(
      Math.floor(Math.random() * 11 + 15),
      message.author.id
    );
  }
  db.prepare('UPDATE members SET (messages) = messages + 1 WHERE discord = (?)').run(message.author.id);
  lastMessage[message.author.id.toString()] = Math.floor(Date.now() / 1000).toString();
  if (message.author.bot) return;
  let uuid;
  if (message.content.toLowerCase().includes('dominance')) {
    await message.react(':dominance:1033300891597557830');
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
  }
}
