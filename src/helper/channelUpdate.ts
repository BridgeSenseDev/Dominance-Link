import { ActivityType, type Client } from "discord.js";
import { voiceChannels } from "../events/discord/ready.js";
import { chat } from "../handlers/workerHandler.js";
import { hypixel } from "../index.js";
import { getLevel, sleep } from "./clientUtils.js";

async function channelUpdate(client: Client) {
  setInterval(
    async () => {
      chat("/g online");
      // Presence
      let members = 0;
      for (let i = 0; i < client.guilds.cache.size; i++) {
        members += client.guilds.cache.map((guild) => guild.memberCount)[i];
      }
      client.user?.setPresence({
        status: "idle",
        activities: [
          { name: `${members} members`, type: ActivityType.Listening },
        ],
      });

      // Total members
      await voiceChannels.members.setName(
        `🧑│All members: ${voiceChannels.members.guild.memberCount}`,
      );

      // Guild level
      const guild = await hypixel.getGuild("name", "Dominance", {});
      if (guild) {
        await voiceChannels.level.setName(
          `📈│Guild Level: ${getLevel(guild.experience)}`,
        );
      }

      // Online members
      await sleep(10000);
      await voiceChannels.online.setName(
        `🎮│Online Members: ${global.onlineMembers}`,
      );
    },
    6 * 60 * 1000,
  );
}

export default channelUpdate;
