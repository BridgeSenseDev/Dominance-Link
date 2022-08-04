const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const mineflayer = require('mineflayer');
const config = require('../config.json');

const minecraftLoginOptions = {
  host: 'mc.hypixel.net',
  auth: 'microsoft',
  username: 'MatrixLink',
  version: '1.8.9',
  hideErrors: false,
  checkTimeoutInterval: 60000,
  viewDistance: 'tiny',
  chatLengthLimit: 256,
  defaultChatPatterns: false,
};

function startBot(client) {
  global.bot = mineflayer.createBot(minecraftLoginOptions);
  bot.on('error', console.error);
  bot.on('kicked', console.error);
  fs.readdirSync('./events/minecraft')
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => {
      const event = require(`../events/minecraft/${file}`);
      const name = file.split('.')[0];
      bot.on(name, (...args) => event.execute(client, ...args));
    });
}

async function autoRejoin() {
  setInterval(async () => {
    const status = (await (await fetch(`https://api.hypixel.net/status?key=${config.keys.hypixelApiKey}&uuid=5760aae2-d977-467c-bf62-048469d5f507`)).json()).session.online;
    if (!status) {
      console.log('Restarting bot');
      const embed = new EmbedBuilder()
        .setColor(0xe74d3c)
        .setTitle('Disconnected')
        .setDescription('MatrixLink has been disconnected from hypixel. Trying to reconnect...')
        .addFields(
          { name: '<:clock_:969185417712775168> Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>` },
        );
      await statusChannel.send({ embeds: [embed] });
      try {
        bot.quit();
      } catch (err) {
        console.log(err);
      }
      startBot();
    }
  }, 60 * 1000);
}

module.exports = {
  startBot,
  autoRejoin,
};
