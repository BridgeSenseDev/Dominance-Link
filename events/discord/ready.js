// eslint-disable-next-line no-unused-vars
import { notificationRoles, gamemodeRoles, applications } from '../../embeds/buttons.js';
import {
  database, gsrun, sheet, weekly,
} from '../../helper/database.js';
import gexpWatch from '../../helper/gexpWatch.js';
import channelUpdate from '../../helper/channelUpdate.js';
import { autoRejoin, startBot } from '../../helper/autoRejoin.js';

async function execute(client) {
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);
  global.statusChannel = client.channels.cache.get('1001465850555027477');
  global.logChannel = client.channels.cache.get('1011845953826857030');
  global.guildChat = client.channels.cache.get('1016734361472729088');
  global.onlineChannel = client.channels.cache.get('995685430420852766');
  global.membersChannel = client.channels.cache.get('995685323818410004');
  global.levelChannel = client.channels.cache.get('995685400700006520');
  global.applicationsChannel = client.channels.cache.get('1018079280443424898');
  global.officerChat = client.channels.cache.get('1016735077385912360');
  global.onlineMembers = 0;
  gexpWatch(client);
  channelUpdate(client);
  autoRejoin();
  database();
  weekly();
  gsrun(sheet, client);
  startBot(client);
  // notificationRoles(client, '583661446202785815');
  // gamemodeRoles(client, '583661446202785815');
  // applications(client, '1017099269372657724');
}

export default execute;
