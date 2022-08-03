const { ActivityType } = require('discord.js');
const { getLevel } = require('./utils');
const config = require('../config.json');

async function channelUpdate(client) {
  setInterval(async () => {
    await bot.chat('/g online');
    // Presence
    let members = 0;
    for (let i = 0; i < client.guilds.cache.size; i += 1) {
      members += client.guilds.cache.map((guild) => guild.memberCount)[i];
    }
    await client.user.setPresence({ status: 'idle', activities: [{ name: `${members} members`, type: ActivityType.Listening }] });

    // Total members
    await membersChannel.setName(`🧑│All members: ${membersChannel.guild.memberCount}`);
    // Guild level
    const level = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Matrix`)).json()).guild.exp;
    await levelChannel.setName(`🔰│Guild Level: ${getLevel(level)}`);

    // Online members
    await onlineChannel.setName(`🔰│Online Members: ${onlineMembers}`);
  }, 7 * 60 * 1000);
}

module.exports = channelUpdate;
