import { Client, EmbedBuilder, TextChannel, WebhookClient } from 'discord.js';
import Database from 'better-sqlite3';
import { addXp, nameToUuid } from '../../helper/utils.js';
import messageToImage from '../../helper/messageToImage.js';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { channels } from '../discord/ready.js';

const db = new Database('guild.db');
db.defaultSafeIntegers(true);

global.playtime = {};
const logWebhook = new WebhookClient({ url: config.keys.logWebhookUrl });
const gcWebhook = new WebhookClient({ url: config.keys.gcWebhookUrl });
const ocWebhook = new WebhookClient({ url: config.keys.ocWebhookUrl });
const messageCache: string[] = [];

export default async function execute(client: Client, msg: string, rawMsg: string, messagePosition: string) {
  if (messagePosition !== 'chat') return;
  if (msg.trim() === '') return;
  // Limbo Check
  if (msg.includes('"server"')) {
    const parsedMessage = JSON.parse(msg);
    if (parsedMessage.server !== 'limbo') {
      await chat('\u00a7');
    } else {
      return;
    }
  }
  if (msg.includes('@everyone') || msg.includes('@here')) {
    await logWebhook.send({ content: msg.replace('@', ''), username: 'Dominance', avatarURL: config.guild.icon });
  } else {
    await logWebhook.send({ content: msg, username: 'Dominance', avatarURL: config.guild.icon });
  }
  if (messageCache.length >= 20) messageCache.shift();
  messageCache.push(msg);

  // Guild Chat
  if (msg.includes('joined.')) {
    let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
    let uuid = await nameToUuid(name);
    if (uuid === null) {
      [name] = msg.replace(/Guild > |:/g, '').split(' ');
      uuid = await nameToUuid(name);
    }
    global.playtime[name] = Math.floor(Date.now() / 1000);
  } else if (msg.includes('left.')) {
    let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
    let uuid = await nameToUuid(name);
    if (uuid === null) {
      [name] = msg.replace(/Guild > |:/g, '').split(' ');
      uuid = await nameToUuid(name);
    }
    const time = Math.floor(Date.now() / 1000) - global.playtime[name];
    if (!Number.isNaN(time)) {
      delete global.playtime[name];
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);
      db.prepare('UPDATE guildMembers SET playtime = playtime + (?) WHERE uuid = (?)').run(time, uuid);
    }
  } else if (msg.includes('Guild >')) {
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [await messageToImage(rawMsg)]
    });
    let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
    let uuid = await nameToUuid(name);
    if (uuid === null) {
      [name] = msg.replace(/Guild > |:/g, '').split(' ');
      uuid = await nameToUuid(name);
    }
    const discordId = db.prepare('SELECT discord FROM members WHERE uuid = (?)').get(uuid).discord;
    db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);
    db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
    addXp(discordId);
  } else if (msg.includes('Officer >')) {
    await ocWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [await messageToImage(rawMsg)]
    });
    let [, name] = msg.replace(/Officer > |:/g, '').split(' ');
    let uuid = await nameToUuid(name);
    const discordId = db.prepare('SELECT discord FROM members WHERE uuid = (?)').get(uuid).discord;
    if (uuid == null) {
      [name] = msg.replace(/Officer > |:/g, '').split(' ');
      uuid = await nameToUuid(name);
    }
    db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);
    db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
    addXp(discordId);
  } else if (msg.includes('From')) {
    let waitlist;
    let [, , name] = msg.split(' ');
    name = name.slice(0, -1);
    let uuid = await nameToUuid(name);
    if (uuid === null) {
      [, name] = msg.split(' ');
      name = name.slice(0, -1);
      uuid = await nameToUuid(name);
    }
    try {
      waitlist = db.prepare('SELECT discord, channel FROM waitlist WHERE uuid = ?').get(uuid);
    } catch (err) {
      // Continue regardless of error
    }
    if (waitlist !== undefined) {
      await chat(`/g invite ${name}`);
      const channel = client.channels.cache.get(waitlist.channel) as TextChannel;
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`${name} has been invited to the guild`)
        .setDescription(
          'If you did not receive an invite:\n`-` Make sure you are not in a guild\n`-` The guild may be currently ' +
            'full, check using the </online:1023548883332255765> command\nIf the guild is full, ping <@&1016513036313448579> here'
        );
      await channel.send({ embeds: [embed] });
    }
  } else if (msg.includes('The Guild has reached Level')) {
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          '§6-------------------------------------------------------------§r§f§l                                                        LEVEL ' +
            'UP!§r                                                       §f                                §6The Guild has reached Level 212!' +
            '§6-------------------------------------------------------------'
        )
      ]
    });
    await channels.guildLogs.send({
      files: [
        await messageToImage(
          '§6-------------------------------------------------------------§r§f§l                                                        LEVEL ' +
            'UP!§r                                                       §f                                §6The Guild has reached Level 212!' +
            '§6-------------------------------------------------------------'
        )
      ]
    });
    await channels.announcements.send({
      files: [
        await messageToImage(
          '§6-------------------------------------------------------------§r§f§l                                                        LEVEL ' +
            'UP!§r                                                       §f                                §6The Guild has reached Level 212!' +
            '§6-------------------------------------------------------------'
        )
      ]
    });
  } else if (msg.includes('Offline Members:')) {
    let includes = 0;
    for (let i = messageCache.length - 1; i >= 0; i--) {
      if (
        messageCache[i].includes('Guild Name:') ||
        messageCache[i].includes('Total Members:') ||
        messageCache[i].includes('Online Members:') ||
        messageCache[i].includes('Offline Members:')
      )
        includes++;
      if (includes === 4) {
        global.guildOnline = messageCache.splice(i);
        break;
      }
    }
  } else if (msg.includes('Online Members:')) {
    global.onlineMembers = parseInt(msg.split('Online Members: ')[1], 10);
  } else if (msg.includes('cannot say the same message')) {
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          '§6-------------------------------------------------------------§r §cYou cannot say the same message twice!§6-------------------------------------------------------------'
        )
      ]
    });
  } else if (msg.includes(' has muted ')) {
    await channels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
  } else if (msg.includes(' has unmuted ')) {
    await channels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
  } else if (
    msg.includes('left the guild!') ||
    msg.includes('was promoted') ||
    msg.includes('was kicked') ||
    msg.includes('was demoted')
  ) {
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
    await channels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
  } else if (msg.includes('joined the guild!')) {
    let funFact;
    const name = msg.substring(msg.search(/ (.*?) joined/g) + 1, msg.lastIndexOf(' joined'));
    const funFacts = await (
      await fetch('https://api.api-ninjas.com/v1/facts?limit=3', {
        method: 'GET',
        headers: { 'X-Api-Key': config.keys.apiNinjasKey }
      })
    ).json();
    for (let i = 0; i < funFacts.length; i++) {
      if (funFacts[i].fact.length < 150) {
        funFact = funFacts[i].fact;
        break;
      }
    }
    await chat(
      `/gc Welcome to Dominance, ${name}! Our current GEXP requirement is ${config.guild.gexpReq} per week. ${funFact}`
    );
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
    await channels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
    const uuid = await nameToUuid(name);
    db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);
    try {
      const { channel } = db.prepare('SELECT channel FROM waitlist WHERE uuid = ?').get(uuid);
      await client.channels.cache.get(channel)!.delete();
      db.prepare('DELETE FROM waitlist WHERE uuid = ?').run(uuid);
    } catch (e) {
      // Continue regardless of error
    }
    try {
      const { discord } = db.prepare('SELECT discord FROM members WHERE uuid = ?').get(uuid);
      await channels.guildChat.send(
        `<a:wave_animated:1036265311390928897> Welcome to Dominance, <@${discord}>! Our current gexp requirement is ${config.guild.gexpReq} per week. ${funFacts[2].fact}`
      );
    } catch (e) {
      await channels.guildChat.send(
        `<a:wave_animated:1036265311390928897> Welcome to Dominance, ${name}! Our current gexp requirement is ${config.guild.gexpReq} per week. ${funFacts[2].fact}`
      );
    }
  }
}
