const { WebhookClient } = require('discord.js');
const db = require('better-sqlite3')('matrix.db');
const {
  nameToUUID,
} = require('../../helper/utils');
const messageToImage = require('../../helper/messageToImage');
const config = require('../../config.json');

const logWebhook = new WebhookClient({ url: config.keys.logWebhookUrl });
const gcWebhook = new WebhookClient({ url: config.keys.gcWebhookUrl });
const ocWebhook = new WebhookClient({ url: config.keys.ocWebhookUrl });
global.messageCache = [];
global.guildOnline = [];
db.defaultSafeIntegers(true);

module.exports = {
  async execute(client, message, messagePosition) {
    if (messagePosition !== 'chat') return;
    const msg = message.toString();
    if (msg.trim() === '') return;
    // Limbo Check
    if (msg.indexOf('"server"') !== -1) {
      const parsedMessage = JSON.parse(msg);
      if (parsedMessage.server !== 'limbo') {
        await bot.chat('\u00a7');
      } else {
        return;
      }
    }
    const rawMsg = message.toMotd();
    await logWebhook.send({ content: msg, username: 'Matrix Link', avatarURL: config.guild.icon });
    if (messageCache.length >= 20) messageCache.shift();
    messageCache.push(msg);

    // Guild Chat
    if (msg.indexOf('Offline Members:') !== -1) {
      let includes = 0;
      for (let i = messageCache.length - 1; i >= 0; i -= 1) {
        if (messageCache[i].includes('Guild Name:') || messageCache[i].includes('Total Members:') || messageCache[i].includes('Online Members:') || messageCache[i].includes('Offline Members:')
        ) includes += 1;
        if (includes === 4) {
          guildOnline = messageCache.splice(i);
          break;
        }
      }
    } else if (msg.indexOf('Online Members:') !== -1) {
      [, onlineMembers] = msg.split('Online Members: ');
    } else if (msg.indexOf('cannot say the same message') !== -1) {
      await gcWebhook.send({
        username: 'Matrix',
        avatarURL: config.guild.icon,
        files: [messageToImage(
          '§6-------------------------------------------------------------§r §cYou cannot say the same message twice!§6-------------------------------------------------------------',
        )],
      });
    } else if (msg.indexOf('left the guild!') !== -1 || msg.indexOf('was promoted') !== -1 || msg.indexOf('was kicked') !== -1) {
      await gcWebhook.send({
        username: 'Matrix',
        avatarURL: config.guild.icon,
        files: [messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`,
        )],
      });
    } else if (msg.indexOf('joined the guild!') !== -1) {
      let funFact;
      const name = msg.substring(msg.search(/ (.*?) joined/g) + 1, msg.lastIndexOf(' joined'));
      const funFacts = await (await fetch('https://api.api-ninjas.com/v1/facts?limit=3', { method: 'GET', headers: { 'X-Api-Key': config.keys.apiNinjasKey } })).json();
      for (let i = 0; i < funFacts.length; i += 1) {
        if (funFacts[i].fact.length < 150) {
          funFact = funFacts[i].fact;
          break;
        }
      }
      await bot.chat(`/gc Welcome to Matrix, ${name}! . Our current GEXP \
      requirement is ${config.guild.gexpReq} per week. ${funFact}`);
      await gcWebhook.send({
        username: 'Matrix',
        avatarURL: config.guild.icon,
        files: [messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`,
        )],
      });
      const uuid = nameToUUID(name);
      const channelId = db.prepare('SELECT channel FROM waitlist WHERE uuid = ?').run(uuid);
      await client.channels.cache.get(channelId).delete();
      db.prepare('DELETE FROM waitlist WHERE uuid = ?').run(uuid);
    } else if (msg.indexOf('Guild >') !== -1) {
      await gcWebhook.send({
        username: 'Matrix',
        avatarURL: config.guild.icon,
        files: [messageToImage(rawMsg)],
      });
      let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
      let uuid = await nameToUUID(name);
      if (uuid === null) {
        [name] = msg.replace(/Guild > |:/g, '').split(' ');
        uuid = await nameToUUID(name);
      }
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages) VALUES (?, ?)').run(uuid, 0);
      db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
    } else if (msg.indexOf('Officer >') !== -1) {
      await ocWebhook.send({
        username: 'Matrix',
        avatarURL: config.guild.icon,
        files: [messageToImage(rawMsg)],
      });
      let [, name] = msg.replace(/Officer > |:/g, '').split(' ');
      let uuid = await nameToUUID(name);
      if (uuid == null) {
        [name] = msg.replace(/Officer > |:/g, '').split(' ');
        uuid = await nameToUUID(name);
      }
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages) VALUES (?, ?)').run(uuid, 0);
      db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
    } else if (msg.indexOf('From') !== -1) {
      let waitlist;
      let [, , name] = msg.split(' ');
      name = name.slice(0, -1);
      let uuid = await nameToUUID(name);
      if (uuid === null) {
        [, name] = msg.split(' ');
        name = name.slice(0, -1);
        uuid = await nameToUUID(name);
      }
      try {
        waitlist = db.prepare('SELECT discord, channel FROM waitlist WHERE uuid = ?').get(uuid);
      // eslint-disable-next-line no-empty
      } catch (err) {}
      if (waitlist !== undefined) {
        await bot.chat(`/g invite ${name}`);
        const channel = client.channels.cache.get(waitlist.channel.toString());
        await channel.send(`<@${waitlist.discord.toString()}> has been invited to the guild.
If you did not receive an invite make sure you are not in a guild`);
      }
    }
  },
};
