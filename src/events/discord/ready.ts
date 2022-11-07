import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import {
  database, gsrun, players, sheet, weekly,
} from '../../helper/database.js';
import gexpWatch from '../../helper/gexpWatch.js';
import unverified from '../../helper/unverified.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../helper/workerHandler.js';
import config from '../../config.json' assert {type: 'json'};
import leaderboards from '../../helper/leaderboards.js';

if (fileURLToPath(import.meta.url).slice(-2) === 'js') {
  global.worker = new Worker('./helper/worker.js');
} else {
  global.worker = new Worker(new URL('../../helper/worker.ts', import.meta.url));
}

export default async function execute(client) {
  // eslint-disable-next-line no-console
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);

  for (let i = 0; i < Object.keys(config.messages).length; i += 1) {
    const channel = client.channels.cache.get(Object.values(config.messages)[i][0]);
    global[Object.keys(config.messages)[i]] = await channel.messages
      .fetch(Object.values(config.messages)[i][1]);
  }
  for (let i = 0; i < Object.keys(config.channels).length; i += 1) {
    global[Object.keys(config.channels)[i]] = client.channels.cache
      .get(Object.values(config.channels)[i]);
  }
  global.onlineMembers = 0;

  gexpWatch(client);
  channelUpdate(client);
  autoRejoin();
  database();
  weekly();
  gsrun(sheet, client);
  startBot();
  unverified();
  players();
  leaderboards();

  // Music
  const voiceChannel = client.channels.cache.get(config.channels.musicChannel);
  await client.distube.play(voiceChannel, 'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=86cc479f1d954174');
}
