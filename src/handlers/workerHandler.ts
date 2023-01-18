import { EmbedBuilder } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { channels, worker } from '../events/discord/ready.js';
import { hypixelRequest } from '../helper/utils.js';

export async function startBot() {
  const client = (await import('../index.js')).default;
  worker.postMessage({ type: 'startBot' });

  worker.on('message', async (msg) => {
    if (msg.type === 'message') {
      const event = await import('../events/minecraft/message.js');
      event.default(client, msg.string, msg.motd, msg.messagePosition);
    }

    if (msg.type === 'login') {
      const event = await import('../events/minecraft/login.js');
      event.default();
    }
  });
}

export async function chat(message: string) {
  worker.postMessage({ type: 'send', content: message });
}

export async function quit() {
  worker.postMessage({ type: 'quit' });
}

export async function autoRejoin() {
  setInterval(async () => {
    const status = (await hypixelRequest(`https://api.hypixel.net/status?uuid=5760aae2-d977-467c-bf62-048469d5f507`))
      .session.online;
    if (!status) {
      console.log('[MINECRAFT] Restarting bot');
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle('Disconnected')
        .setDescription(`${config.minecraft.ign} has been disconnected from hypixel. Trying to reconnect...`)
        .addFields({ name: '<:clock_:969185417712775168> Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>` });
      await channels.botStatus.send({ embeds: [embed] });
      try {
        quit();
      } catch (err) {
        /* empty */
      }
      worker.postMessage({ type: 'restartBot' });
    }
  }, 60 * 1000);
}
