import { writeFileSync } from 'fs';
import config from '../../config.json' assert { type: "json" };

let emittedEvent = false;
export default async function execute() {
  if (!emittedEvent) {
    // eslint-disable-next-line no-underscore-dangle
    config.minecraft.ign = bot._client.session.selectedProfile.name;
    writeFileSync('./config.json', JSON.stringify(config, null, 2));
    await statusChannel.send(`${config.minecraft.ign} has logged in to Hypixel.`);
    console.log('[MINECRAFT] Logged in!');
    emittedEvent = true;

    // LIMBO CHECK
    setTimeout(async () => {
      await bot.chat('/locraw');
    }, 3000);
    setTimeout(async () => {
      await bot.chat('/g online');
    }, 10000);
    setInterval(async () => {
      await bot.chat('/locraw');
    }, 1000 * 60);
  }
}
