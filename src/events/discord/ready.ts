import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { Client, Message, TextChannel, VoiceChannel } from 'discord.js';
import { database, gsrun, players, sheet, weekly } from '../../helper/database.js';
import { gexpWatch } from '../../helper/gexpWatch.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../handlers/workerHandler.js';
import config from '../../config.json' assert { type: 'json' };
import leaderboards from '../../helper/leaderboards.js';
import { breakUpdate, unverifiedUpdate } from '../../helper/messageUpdate.js';
import { logInterval } from '../minecraft/message.js';
import discordCommands from '../../handlers/discordCommands.js';
import discordEvents from '../../handlers/discordEvents.js';
import { fetchGuildByName } from '../../api.js';

let worker: Worker;

interface Messages {
  [key: string]: Message;
}
const messages: Messages = {};

interface TextChannels {
  [key: string]: TextChannel;
}
const textChannels: TextChannels = {};

interface VoiceChannels {
  [key: string]: VoiceChannel;
}
const voiceChannels: VoiceChannels = {};

const dominanceResponse = await fetchGuildByName('Dominance');
const rebelResponse = await fetchGuildByName('Rebel');

if (rebelResponse.success && dominanceResponse.success) {
  global.dominanceGexp = dominanceResponse.guild?.exp ?? 0;
  global.rebelGexp = rebelResponse.guild?.exp ?? 0;
} else {
  global.dominanceGexp = 0;
  global.rebelGexp = 0;
}

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
      textChannels[channelName] = channel as TextChannel;
    }
    if (channel.isVoiceBased()) {
      voiceChannels[channelName] = channel as VoiceChannel;
    }
  }

  discordCommands(client);
  discordEvents(client);
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
  weekly(client);

  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
}

export { worker, voiceChannels, textChannels, messages };
