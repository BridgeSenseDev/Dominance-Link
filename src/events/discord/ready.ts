/* eslint-disable no-unused-vars */
import { notificationRoles, gamemodeRoles, applications } from '../../embeds/buttons.js';
import requirements from '../../embeds/requirements.js';
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
  // notificationRoles(client, '583661446202785815');
  // gamemodeRoles(client, '583661446202785815');
  // applications(client, '1017099269372657724');
  // requirements(client, '1017099269372657724');
}

export default execute;
