import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { Client, Message, TextChannel, VoiceChannel } from 'discord.js';
import { database, gsrun, players, sheet, weekly } from '../../helper/database.js';
import gexpWatch from '../../helper/gexpWatch.js';
import unverified from '../../helper/unverified.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../handlers/workerHandler.js';
import config from '../../config.json' assert { type: 'json' };
import leaderboards from '../../helper/leaderboards.js';

let worker: Worker;

interface Messages {
  [key: string]: Message;
}
const messages: Messages = {};

interface Channels {
  [key: string]: TextChannel | VoiceChannel;
}
const channels: Channels = {};

if (fileURLToPath(import.meta.url).slice(-2) === 'js') {
  worker = new Worker('./helper/worker.js');
} else {
  worker = new Worker(new URL('../../helper/worker.ts', import.meta.url));
}

export default async function execute(client: Client) {
  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);

  for (let i = 0; i < Object.keys(config.messages).length; i++) {
    const channel = client.channels.cache.get(Object.values(config.messages)[i][0])!;
    messages[Object.keys(config.messages)[i]] = await (channel as TextChannel).messages.fetch(
      Object.values(config.messages)[i][1]
    );
  }

  for (let i = 0; i < Object.keys(config.channels).length; i++) {
    const channel = client.channels.cache.get(Object.values(config.channels)[i])!;
    if (channel.isTextBased()) {
      channels[Object.keys(config.channels)[i]] = channel as TextChannel;
    }
    if (channel.isVoiceBased()) {
      channels[Object.keys(config.channels)[i]] = channel as VoiceChannel;
    }
  }
  
  global.onlineMembers = 0;
  global.lastMessage = {};

  gexpWatch();
  channelUpdate(client);
  autoRejoin();
  database();
  weekly(client);
  gsrun(sheet, client);
  startBot();
  unverified();
  players();
  leaderboards();
}

export { worker, channels, messages };
