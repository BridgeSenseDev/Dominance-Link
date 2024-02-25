import { writeFileSync } from 'fs';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { textChannels } from '../discord/ready.js';

let emittedEvent = false;
export default async function execute() {
  if (!emittedEvent) {
    writeFileSync('./config.json', JSON.stringify(config, null, 2));
    await textChannels.botStatus.send(`${config.minecraft.ign} has logged in to Hypixel.`);
    console.log(`[MINECRAFT] Logged in as ${config.minecraft.ign}`);
    emittedEvent = true;

    // LIMBO CHECK
    setTimeout(async () => {
      chat('/locraw');
    }, 3000);
    setTimeout(async () => {
      chat('/g online');
    }, 10000);
    setInterval(async () => {
      chat('/locraw');
    }, 1000 * 60);
  }
}
