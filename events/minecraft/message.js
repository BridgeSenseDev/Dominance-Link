const { WebhookClient } = require('discord.js');
const db = require('better-sqlite3')('matrix.db');
const {
  nameToUUID,
} = require('../../helper/utils');
const messageToImage = require('../../helper/messageToImage');
const config = require('../../config.json');

const webhook = new WebhookClient({ url: 'https://discord.com/api/webhooks/1004702051424538704/pCsSZLHfUNZSo8Xj0V_-iSOdWPleFei-FZimGjgm5lgAqGIXV47_rNWvq3873wiE_5M1' });

module.exports = {
  async execute(client, message, messagePosition) {
    if (messagePosition !== 'chat') return;
    let msg = message.toString();
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
    await webhook.send({ content: msg, username: 'Matrix Link', avatarURL: config.keys.webhookUrl });

    // Guild Chat
    if (msg.indexOf('Online Members:') !== -1) {
      [, onlineMembers] = msg.split('Online Members: ');
    } else if (msg.indexOf('cannot say the same message') !== -1) {
      await guildChat.send({
        files: [messageToImage(
          '§6-------------------------------------------------------------§r §cYou cannot say the same message twice!§6-------------------------------------------------------------',
        )],
      });
    } else if (msg.indexOf('left the guild!') !== -1) {
      await guildChat.send({
        files: [messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`,
        )],
      });
    } else if (msg.indexOf('joined the guild!') !== -1) {
      const name = msg.substring(msg.search(/ (.*?) joined/g) + 1, msg.lastIndexOf(' joined'));
      await bot.chat(`/gc Welcome to Matrix, ${name}! Join our discord using /g discord to learn more about our roles and rules. Our current GEXP requirement is 250k per week.`);
      await guildChat.send({
        files: [messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`,
        )],
      });
    } else if (msg.indexOf('was promoted') !== -1) {
      await guildChat.send({
        files: [messageToImage(
          `§6-------------------------------------------------------------§r ${rawMsg} §6-------------------------------------------------------------`,
        )],
      });
    } else if (msg.indexOf('Guild >') !== -1) {
      await guildChat.send({
        files: [messageToImage(rawMsg)],
      });
      let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
      let uuid = await nameToUUID(name);
      if (uuid == null) {
        [name] = msg.replace(/Guild > |:/g, '').split(' ');
        uuid = await nameToUUID(name);
      }
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages) VALUES (?, ?)').run(uuid, 0);
      db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);

      // Dad joke
      msg = msg.split(' ');
      for (let i = 0; i < msg.length; i += 1) {
        if ((msg[i].toLowerCase() === 'im' || msg[i].toLowerCase() === "i'm") && name !== 'MatrixLink') {
          // eslint-disable-next-line no-await-in-loop
          await bot.chat(`/gc Hi ${msg[i + 1]}, im dad`);
        }
      }
    }
  },
};
