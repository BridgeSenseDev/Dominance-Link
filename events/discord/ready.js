// eslint-disable-next-line no-unused-vars
const { notificationRoles, gamemodeRoles, applications } = require('../../embeds/buttons');
const {
  database, gsrun, sheet, weekly,
} = require('../../helper/database');
const gexpWatch = require('../../helper/gexpWatch');
const channelUpdate = require('../../helper/channelUpdate');
const { autoRejoin, startBot } = require('../../helper/autoRejoin');

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

module.exports = {
  execute,
};
