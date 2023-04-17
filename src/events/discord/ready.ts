import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { Client, Message, TextChannel, VoiceChannel } from 'discord.js';
import { database, gsrun, players, sheet } from '../../helper/database.js';
import gexpWatch from '../../helper/gexpWatch.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../handlers/workerHandler.js';
import config from '../../config.json' assert { type: 'json' };
import leaderboards from '../../helper/leaderboards.js';
import { breakUpdate, unverifiedUpdate } from '../../helper/messageUpdate.js';
import { logInterval } from '../minecraft/message.js';
import { weeklyChallengesInterval } from '../../helper/challenges.js';

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
  for (const message in config.messages) {
    type ConfigMessages = keyof typeof config.messages;
    const channel = client.channels.cache.get(config.messages[message as ConfigMessages][0]);
    messages[message] = await (channel as TextChannel).messages.fetch(config.messages[message as ConfigMessages][1]);
  }

  for (const channelName in config.channels) {
    type ConfigChannels = keyof typeof config.channels;
    const channel = client.channels.cache.get(config.channels[channelName as ConfigChannels])!;
    if (channel.isTextBased()) {
      channels[channelName] = channel as TextChannel;
    }
    if (channel.isVoiceBased()) {
      channels[channelName] = channel as VoiceChannel;
    }
  }

  gexpWatch();
  channelUpdate(client);
  autoRejoin();
  database();
  gsrun(sheet, client);
  startBot();
  unverifiedUpdate();
  breakUpdate();
  players();
  leaderboards();
  logInterval();
  weeklyChallengesInterval(client);

  // Music
  await client.distube.play(
    channels.music,
    'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=86cc479f1d954174'
  );
  client.distube.getQueue(channels.music.guild).setRepeatMode(2);
  await client.distube.shuffle(channels.music.guild);

  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
}

export { worker, channels, messages };
