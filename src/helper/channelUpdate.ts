import { ActivityType, Client } from 'discord.js';
import { getLevel, hypixelRequest, sleep } from './utils.js';
import { chat } from '../handlers/workerHandler.js';
import { channels } from '../events/discord/ready.js';

async function channelUpdate(client: Client) {
  setInterval(async () => {
    await chat('/g online');
    // Presence
    let members = 0;
    for (let i = 0; i < client.guilds.cache.size; i++) {
      members += client.guilds.cache.map((guild) => guild.memberCount)[i];
    }
    await client.user!.setPresence({
      status: 'idle',
      activities: [{ name: `${members} members`, type: ActivityType.Listening }]
    });

    // Total members
    await channels.members.setName(`🧑│All members: ${channels.members.guild.memberCount}`);

    // Guild level
    const level = (await hypixelRequest(`https://api.hypixel.net/guild?name=Dominance`)).guild.exp;
    await channels.level.setName(`📈│Guild Level: ${getLevel(level)}`);

    // Online members
    await sleep(10000);
    await channels.online.setName(`🎮│Online Members: ${global.onlineMembers}`);
  }, 6 * 60 * 1000);
}

export default channelUpdate;
