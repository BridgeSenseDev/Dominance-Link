import { ActivityType, Client } from 'discord.js';
import { getLevel, sleep } from './utils.js';
import { chat } from '../handlers/workerHandler.js';
import { voiceChannels } from '../events/discord/ready.js';
import { fetchGuildByName } from '../api.js';

async function channelUpdate(client: Client) {
  setInterval(
    async () => {
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
      await voiceChannels.members.setName(`🧑│All members: ${voiceChannels.members.guild.memberCount}`);

      // Guild level
      const guildResponse = await fetchGuildByName('Dominance');
      if (guildResponse.success && guildResponse.guild) {
        await voiceChannels.level.setName(`📈│Guild Level: ${getLevel(guildResponse.guild.exp)}`);
      }

      // Online members
      await sleep(10000);
      await voiceChannels.online.setName(`🎮│Online Members: ${global.onlineMembers}`);
    },
    6 * 60 * 1000
  );
}

export default channelUpdate;
