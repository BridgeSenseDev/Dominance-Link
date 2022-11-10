import { writeFileSync } from 'fs';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../helper/workerHandler.js';

let emittedEvent = false;
export default async function execute() {
  if (!emittedEvent) {
    writeFileSync('./config.json', JSON.stringify(config, null, 2));
    await global.statusChannel.send(`${config.minecraft.ign} has logged in to Hypixel.`);
    console.log(`[MINECRAFT] Logged in as ${config.minecraft.ign}`);
    emittedEvent = true;

    // LIMBO CHECK
    setTimeout(async () => {
      await chat('/locraw');
    }, 3000);
    setTimeout(async () => {
      await chat('/g online');
    }, 10000);
    setInterval(async () => {
      await chat('/locraw');
    }, 1000 * 60);
  }
}
