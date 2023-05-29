import { getNetworth } from 'skyhelper-networth';
import { abbreviateNumber, formatNumber, uuidToName, skillAverage } from './utils.js';
import config from '../config.json' assert { type: 'json' };
import { fetchGuildByPlayer, fetchSkyblockProfiles } from '../api.js';
import { processPlayer } from '../types/api/processors/processPlayers.js';
import { RawPlayer } from '../types/api/raw/RawPlayer.js';

export default async function requirements(uuid: string, playerData: RawPlayer) {
  let guild: [string, number] = ['None', 0];
  let skyblock = [0, 0];
  const name = await uuidToName(uuid);

  const guildResponse = await fetchGuildByPlayer(uuid);
  const skyblockProfilesResponse = await fetchSkyblockProfiles(uuid);
  const processedPlayer = processPlayer(playerData, ['duels', 'bedwars', 'skywars']);

  if (skyblockProfilesResponse.success && skyblockProfilesResponse.profiles) {
    const { profiles } = skyblockProfilesResponse;
    const profile = profiles.find((i: any) => i.selected);
    if (profile) {
      const profileData = profile.members[uuid];
      const bankBalance = profile.banking?.balance;
      const { networth } = await getNetworth(profileData, bankBalance);
      skyblock = [networth, await skillAverage(profileData)];
    }
  }

  const bedwars = [
    processedPlayer.stats.Bedwars?.star ?? 0,
    +(processedPlayer.stats.Bedwars?.overall.fkdr.toFixed(1) ?? 0),
    processedPlayer.stats.Bedwars?.overall.wins ?? 0
  ];

  const duels = [
    processedPlayer.stats.Duels?.general.wins ?? 0,
    +(processedPlayer.stats.Duels?.general.wlr.toFixed(1) ?? 0)
  ];

  const skywars: [string, number] = [
    processedPlayer.stats.Skywars?.levelFormatted?.slice(2) ?? '1⋆',
    processedPlayer.stats.Skywars?.kdr ?? 0
  ];

  if (guildResponse.success && guildResponse.guild) {
    const member = guildResponse.guild.members.find((i: any) => i.uuid === uuid);
    if (member) {
      const weeklyGexp = (Object.values(member.expHistory) as number[]).reduce((acc, cur) => acc + cur, 0);
      guild = [guildResponse.guild.name, weeklyGexp];
    }
  }

  // Check requirements
  let requirementEmbed = '';
  let meetingReqs = false;
  let author;
  let color;
  let reqs;

  if (guild[1] >= config.guild.gexpReqNum) {
    meetingReqs = true;
    requirementEmbed += `:green_circle: **GEXP**\n<a:atick:986173414723162113> **Guild:** \`${
      guild[0]
    }\`\n<a:atick:986173414723162113> **Weekly GEXP:** \`${formatNumber(guild[1])}\`\n\n`;
  } else {
    requirementEmbed += `:red_circle: **GEXP**\n<a:atick:986173414723162113> **Guild:** \`${
      guild[0]
    }\`\n<a:across:986170696512204820> **Weekly GEXP:** \`${formatNumber(guild[1])} / 150,000\`\n\n`;
  }

  if (!playerData.achievementPoints) {
    requirementEmbed +=
      ':red_circle: **Achievements**\n<a:across:986170696512204820> **Achievement Points:** `0 / 9,000`\n\n';
  } else if (playerData.achievementPoints >= 9000) {
    meetingReqs = true;
    requirementEmbed += `:green_circle: **Achievements**\n<a:atick:986173414723162113> **Achievement Points:** \`${formatNumber(
      playerData.achievementPoints
    )}\`\n\n`;
  } else {
    requirementEmbed += `:red_circle: **Achievements**\n<a:across:986170696512204820> **Achievement Points:** \`${formatNumber(
      playerData.achievementPoints
    )} / 9,000\`\n\n`;
  }

  if (bedwars[0] >= 300 && bedwars[1] >= 3) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Bedwars 1**\n';
  } else {
    requirementEmbed += ':red_circle: **Bedwars 1**\n';
  }
  if (bedwars[0] >= 300) {
    requirementEmbed += `<a:atick:986173414723162113> **Bedwars Stars:** \`${bedwars[0]}\`\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Bedwars Stars:** \`${bedwars[0]} / 300\`\n`;
  }
  if (bedwars[1] >= 3) {
    requirementEmbed += `<a:atick:986173414723162113> **Bedwars FKDR:** \`${bedwars[1]}\`\n\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Bedwars FKDR:** \`${bedwars[1]} / 3\`\n\n`;
  }

  if (bedwars[0] >= 150 && bedwars[1] >= 5) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Bedwars 2**\n';
  } else {
    requirementEmbed += ':red_circle: **Bedwars 2**\n';
  }
  if (bedwars[0] >= 150) {
    requirementEmbed += `<a:atick:986173414723162113> **Bedwars Stars:** \`${bedwars[0]}\`\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Bedwars Stars:** \`${bedwars[0]} / 150\`\n`;
  }
  if (bedwars[1] >= 5) {
    requirementEmbed += `<a:atick:986173414723162113> **Bedwars FKDR:** \`${bedwars[1]}\`\n\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Bedwars FKDR:** \`${bedwars[1]} / 5\`\n\n`;
  }

  if (duels[0] >= 6500 && duels[1] >= 2) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Duels 1**\n';
  } else {
    requirementEmbed += ':red_circle: **Duels 1**\n';
  }
  if (duels[0] >= 6500) {
    requirementEmbed += `<a:atick:986173414723162113> **Duels Wins:** \`${formatNumber(duels[0])}\`\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Duels Wins:** \`${formatNumber(duels[0])} / 6,500\`\n`;
  }
  if (duels[1] >= 2) {
    requirementEmbed += `<a:atick:986173414723162113> **Duels WLR:** \`${duels[1]}\`\n\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Duels WLR:** \`${duels[1]} / 2\`\n\n`;
  }

  if (duels[0] >= 3000 && duels[1] >= 4) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Duels 2**\n';
  } else {
    requirementEmbed += ':red_circle: **Duels 2**\n';
  }
  if (duels[0] >= 3000) {
    requirementEmbed += `<a:atick:986173414723162113> **Duels Wins:** \`${formatNumber(duels[0])}\`\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Duels Wins:** \`${formatNumber(duels[0])} / 3,000\`\n`;
  }
  if (duels[1] >= 4) {
    requirementEmbed += `<a:atick:986173414723162113> **Duels WLR:** \`${duels[1]}\`\n\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Duels WLR:** \`${duels[1]} / 4\`\n\n`;
  }

  const stars = parseInt(skywars[0].slice(0, -1), 10);
  if (stars >= 12 && skywars[1] >= 1) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Skywars 1**\n';
  } else {
    requirementEmbed += ':red_circle: **Skywars 1**\n';
  }
  if (stars >= 12) {
    requirementEmbed += `<a:atick:986173414723162113> **Skywars Stars:** \`${skywars[0]}\`\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Skywars Stars:** \`${skywars[0]} / 12⁕\`\n`;
  }
  if (skywars[1] >= 1) {
    requirementEmbed += `<a:atick:986173414723162113> **Skywars KDR:** \`${skywars[1]}\`\n\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Skywars KDR:** \`${skywars[1]} / 1\`\n\n`;
  }

  if (stars >= 10 && skywars[1] >= 1.5) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Skywars 2**\n';
  } else {
    requirementEmbed += ':red_circle: **Skywars 2**\n';
  }
  if (stars >= 10) {
    requirementEmbed += `<a:atick:986173414723162113> **Skywars Stars:** \`${skywars[0]}\`\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Skywars Stars:** \`${skywars[0]} / 10❤\`\n`;
  }
  if (skywars[1] >= 1.5) {
    requirementEmbed += `<a:atick:986173414723162113> **Skywars KDR:** \`${skywars[1]}\`\n\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Skywars KDR:** \`${skywars[1]} / 1.5\`\n\n`;
  }

  if (skyblock[0] >= 3000000000 && skyblock[1] >= 40) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Skyblock**\n';
  } else {
    requirementEmbed += ':red_circle: **Skyblock**\n';
  }
  if (skyblock[0] >= 3000000000) {
    requirementEmbed += `<a:atick:986173414723162113> **Skyblock Networth:** \`${abbreviateNumber(
      Math.round(skyblock[0] * 100) / 100
    )}\`\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Skyblock Networth:** \`${abbreviateNumber(
      Math.round(skyblock[0] * 100) / 100
    )} / 3b\`\n`;
  }
  if (skyblock[1] === 0) {
    requirementEmbed +=
      '<a:across:986170696512204820> **Skyblock Skill Average:** `No Skyblock Data / API Disabled`\n\n';
  } else if (skyblock[1] >= 40) {
    requirementEmbed += `<a:atick:986173414723162113> **Skyblock Skill Average:** \`${
      Math.round(skyblock[1] * 10) / 10
    }\`\n\n`;
  } else {
    requirementEmbed += `<a:across:986170696512204820> **Skyblock Skill Average:** \`${
      Math.round(skyblock[1] * 10) / 10
    } / 40\`\n\n`;
  }

  if (meetingReqs) {
    author = `${name} meets Dominance requirements!`;
    color = 0x2ecc70;
    reqs = 'Yes';
  } else {
    author = `${name} does not meet Dominance requirements!`;
    color = config.colors.red;
    reqs = 'No';
  }
  return {
    requirementEmbed,
    guild,
    author,
    color,
    reqs
  };
}
