import {
  database, gsrun, players, sheet, weekly,
} from '../../helper/database.js';
import gexpWatch from '../../helper/gexpWatch.js';
import unverified from '../../helper/unverified.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../helper/autoRejoin.js';
import config from '../../config.json' assert {type: 'json'};
import leaderboards from '../../helper/leaderboards.js';

async function execute(client) {
  // eslint-disable-next-line no-console
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);
  global.statusChannel = client.channels.cache.get(config.channels.statusChannel);
  global.logChannel = client.channels.cache.get(config.channels.logChannel);
  global.minecraftLinkChannel = client.channels.cache.get(config.channels.minecraftLinkChannel);
  global.onlineChannel = client.channels.cache.get(config.channels.onlineChannel);
  global.membersChannel = client.channels.cache.get(config.channels.membersChannel);
  global.levelChannel = client.channels.cache.get(config.channels.levelChannel);
  global.applicationsChannel = client.channels.cache.get(config.channels.applicationsChannel);
  global.guildLogsChannel = client.channels.cache.get(config.channels.guildLogsChannel);
  global.applicationLogsChannel = client.channels.cache.get(config.channels.applicationLogsChannel);
  global.officerChat = client.channels.cache.get(config.channels.officerChat);
  global.welcomeChannel = client.channels.cache.get(config.channels.welcomeChannel);
  global.guildChatChannel = client.channels.cache.get(config.channels.guildChatChannel);
  global.unverifiedChannel = client.channels.cache.get(config.channels.unverifiedChannel);
  global.unverifiedMessage = await global.unverifiedChannel.messages
    .fetch(config.channels.unverifiedMessage);
  global.dailyGexpChannel = client.channels.cache.get(config.leaderboards.dailyGexpChannel);
  global.dailyGexpMessage = await global.dailyGexpChannel.messages
    .fetch(config.leaderboards.dailyGexpMessage);
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
}

export default execute;
