import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { Client, Message, TextChannel, VoiceChannel } from 'discord.js';
import { database, gsrun, players, sheet, weekly } from '../../helper/database.js';
import gexpWatch from '../../helper/gexpWatch.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../handlers/workerHandler.js';
import config from '../../config.json' assert { type: 'json' };
import leaderboards from '../../helper/leaderboards.js';
import { breakUpdate, unverifiedUpdate } from '../../helper/messageUpdate.js';

let worker: Worker;

interface Messages {
  [key: string]: Message;
}
const messages: Messages = {};

interface Channels {
  [key: string]: TextChannel | VoiceChannel;
}
const channels: Channels = {};

global.onlineMembers = 0;
global.lastMessage = {};

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

  gexpWatch();
  channelUpdate(client);
  autoRejoin();
  database();
  weekly(client);
  gsrun(sheet, client);
  startBot();
  unverifiedUpdate();
  breakUpdate();
  players();
  leaderboards();

  // Music
  await client.distube.play(
    channels.music,
    'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=86cc479f1d954174'
  );
  client.distube.getQueue(channels.music.guild).setRepeatMode(2);
  await client.distube.shuffle(channels.music.guild);
}

export { worker, channels, messages };
