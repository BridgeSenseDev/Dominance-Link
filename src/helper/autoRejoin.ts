import { EmbedBuilder } from 'discord.js';
import fs from 'fs';
import mineflayer from 'mineflayer';
import config from '../config.json' assert {type: 'json'};

async function startBot() {
  global.bot = mineflayer.createBot({
    host: 'mc.hypixel.net',
    auth: 'microsoft',
    username: 'DominanceLink',
    version: '1.8.9',
    hideErrors: false,
    checkTimeoutInterval: 60000,
    viewDistance: 'tiny',
    chatLengthLimit: 256,
    defaultChatPatterns: false,
  });

  const client = (await import('../index.js')).default;
  const eventFiles = fs.readdirSync('./events/minecraft');
  for (const file of eventFiles) {
    const event = await import(`../events/minecraft/${file}`);
    const name = file.split('.')[0];
    global.bot.on(name, (...args) => event.default(client, ...args));
  }
}

async function autoRejoin() {
  setInterval(async () => {
    const status = (await (await fetch(`https://api.hypixel.net/status?key=${config.keys.hypixelApiKey}&uuid=5760aae2-d977-467c-bf62-048469d5f507`)).json()).session.online;
    if (!status) {
      // eslint-disable-next-line no-console
      console.log('[MINECRAFT] Restarting bot');
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle('Disconnected')
        .setDescription(`${config.minecraft.ign} has been disconnected from hypixel. Trying to reconnect...`)
        .addFields(
          { name: '<:clock_:969185417712775168> Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>` },
        );
      await global.statusChannel.send({ embeds: [embed] });
      try {
        global.bot.quit();
      } catch (err) {
        // Continue regardless of error
      }
      startBot();
    }
  }, 60 * 1000);
}

export {
  startBot,
  autoRejoin,
};
