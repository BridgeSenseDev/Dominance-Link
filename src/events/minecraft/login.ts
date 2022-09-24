import { writeFileSync } from 'fs';
import config from '../../config.json' assert {type: 'json'};

let emittedEvent = false;
export default async function execute() {
  if (!emittedEvent) {
    // eslint-disable-next-line no-underscore-dangle
    config.minecraft.ign = global.bot._client.session.selectedProfile.name;
    writeFileSync('./config.json', JSON.stringify(config, null, 2));
    await global.statusChannel.send(`${config.minecraft.ign} has logged in to Hypixel.`);
    // eslint-disable-next-line no-console
    console.log(`[MINECRAFT] Logged in as ${config.minecraft.ign}`);
    emittedEvent = true;

    // LIMBO CHECK
    setTimeout(async () => {
      await global.bot.chat('/locraw');
    }, 3000);
    setTimeout(async () => {
      await global.bot.chat('/g online');
    }, 10000);
    setInterval(async () => {
      await global.bot.chat('/locraw');
    }, 1000 * 60);
  }
}
