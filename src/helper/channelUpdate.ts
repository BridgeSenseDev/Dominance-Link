import { ActivityType } from 'discord.js';
import { getLevel, sleep } from './utils.js';
import config from '../config.json' assert {type: 'json'};
import { chat } from '../helper/workerHandler.js';

async function channelUpdate(client) {
  setInterval(async () => {
    await chat('/g online');
    // Presence
    let members = 0;
    for (let i = 0; i < client.guilds.cache.size; i += 1) {
      members += client.guilds.cache.map((guild) => guild.memberCount)[i];
    }
    await client.user.setPresence({ status: 'idle', activities: [{ name: `${members} members`, type: ActivityType.Listening }] });

    // Total members
    await global.membersChannel.setName(`🧑│All members: ${global.membersChannel.guild.memberCount}`);

    // Guild level
    const level = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Dominance`)).json()).guild.exp;
    await global.levelChannel.setName(`📈│Guild Level: ${getLevel(level)}`);

    // Online members
    await sleep(10000);
    await global.onlineChannel.setName(`🎮│Online Members: ${global.onlineMembers}`);
  }, 6 * 60 * 1000);
}

export default channelUpdate;
