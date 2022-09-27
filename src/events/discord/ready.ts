import {
  database, gsrun, sheet, weekly,
} from '../../helper/database.js';
import gexpWatch from '../../helper/gexpWatch.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../helper/autoRejoin.js';
import config from '../../config.json' assert {type: 'json'};

async function execute(client) {
  // eslint-disable-next-line no-console
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);
  global.statusChannel = client.channels.cache.get(config.channels.statusChannel);
  global.logChannel = client.channels.cache.get(config.channels.logChannel);
  global.guildChat = client.channels.cache.get(config.channels.guildChat);
  global.onlineChannel = client.channels.cache.get(config.channels.onlineChannel);
  global.membersChannel = client.channels.cache.get(config.channels.memberschannel);
  global.levelChannel = client.channels.cache.get(config.channels.levelChannel);
  global.applicationsChannel = client.channels.cache.get(config.channels.applicationsChannel);
  global.officerChat = client.channels.cache.get(config.channels.officerChat);
  global.onlineMembers = 0;
  gexpWatch(client);
  channelUpdate(client);
  autoRejoin();
  database();
  weekly();
  gsrun(sheet, client);
  startBot();
}

export default execute;
