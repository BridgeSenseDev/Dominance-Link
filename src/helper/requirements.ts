import { getNetworth } from 'skyhelper-networth';
import {
  removeSectionSymbols,
  abbreviateNumber,
  formatNumber,
  uuidToName,
  skillAverage,
  hypixelRequest
} from './utils.js';
import config from '../config.json' assert { type: 'json' };

export default async function requirements(uuid: string, playerData: any) {
  let guildData;
  let profiles;
  let guild: [string, string] | undefined;
  let bedwars: [number, number, number] | undefined;
  let duels: [number, number] | undefined;
  let skywars: [string, number] | undefined;
  let skyblock: [number, number] | undefined;
  const name = await uuidToName(uuid);
  try {
    guildData = (await hypixelRequest(`https://api.hypixel.net/guild?player=${uuid}`)).guild;
    ({ profiles } = await hypixelRequest(`https://api.hypixel.net/skyblock/profiles?uuid=${uuid}`));
  } catch (e) {
    /* empty */
  }

  // Get gamemode data
  if (profiles) {
    const profile = profiles.find((i: any) => i.selected);
    const profileData = profile.members[uuid];
    const bankBalance = profile.banking?.balance;
    const { networth } = await getNetworth(profileData, bankBalance);
    skyblock = [networth, await skillAverage(profileData)];
  }

  const fkdr =
    Math.round((playerData.stats.Bedwars?.final_kills_bedwars / playerData.stats.Bedwars?.final_deaths_bedwars) * 100) /
    100;
  if (fkdr) {
    bedwars = [playerData.achievements.bedwars_level, fkdr, playerData.stats.Bedwars.wins_bedwars];
  } else if (Number.isNaN(fkdr) && playerData.stats.Bedwars?.wins_bedwars) {
    bedwars = [
      playerData.achievements.bedwars_level,
      playerData.stats.Bedwars.final_kills_bedwars,
      playerData.stats.Bedwars.wins_bedwars
    ];
  }

  const wlr = Math.round((playerData.stats.Duels?.wins / playerData.stats.Duels?.losses) * 100) / 100;
  if (wlr) {
    duels = [playerData.stats.Duels.wins, wlr];
  } else if (Number.isNaN(wlr) && playerData.stats.Duels?.wins) {
    duels = [playerData.stats.Duels.wins, playerData.stats.Duels.wins];
  }

  const kdr = Math.round((playerData.stats.SkyWars?.kills / playerData.stats.SkyWars?.deaths) * 100) / 100;
  if (kdr) {
    skywars = [removeSectionSymbols(playerData.stats.SkyWars.levelFormatted), kdr];
  } else if (!kdr && playerData.stats.Skywars?.kills) {
    skywars = [removeSectionSymbols(playerData.stats.SkyWars.levelFormatted), playerData.stats.Skywars?.kills];
  }

  if (guildData) {
    const member = guildData.members.find((i: any) => i.uuid === uuid);
    const weeklyGexp = (Object.values(member.expHistory) as number[]).reduce((acc, cur) => acc + cur, 0);
    guild = [guildData.name, weeklyGexp.toString()];
  } else {
    guild = ['None', 'Not in a guild'];
  }

  // Check requirements
  let requirementEmbed = '';
  let meetingReqs = false;
  let author;
  let color;
  let reqs;

  if (!playerData.achievementPoints) {
    requirementEmbed += ':red_circle: **Achievements**\n<a:across:986170696512204820> **Achievement Points:** `0`\n\n';
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

  if (bedwars) {
    if (bedwars[0] >= 300 && bedwars[1] >= 2) {
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
    if (bedwars[1] >= 2) {
      requirementEmbed += `<a:atick:986173414723162113> **Bedwars FKDR:** \`${bedwars[1]}\`\n\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Bedwars FKDR:** \`${bedwars[1]} / 2\`\n\n`;
    }
  } else {
    requirementEmbed +=
      ':red_circle: **Bedwars 1**\n<a:across:986170696512204820> **Bedwars Wins:** `No Bedwars Data`\n' +
      '<a:across:986170696512204820> **Bedwars FKDR:** `No Bedwars Data`\n\n';
  }

  if (bedwars) {
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
  } else {
    requirementEmbed +=
      ':red_circle: **Bedwars 2**\n<a:across:986170696512204820> **Bedwars Wins:** `No Bedwars Data`\n' +
      '<a:across:986170696512204820> **Bedwars FKDR:** `No Bedwars Data`\n\n';
  }

  if (duels) {
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
  } else {
    requirementEmbed +=
      ':red_circle: **Duels 1**\n<a:across:986170696512204820> **Duels Wins:** `No Duels Data`\n' +
      '<a:across:986170696512204820> **Duels WLR:** `No Duels Data`\n\n';
  }

  if (duels) {
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
  } else {
    requirementEmbed +=
      ':red_circle: **Duels 2**\n<a:across:986170696512204820> **Duels Wins:** `No Duels Data`\n<a:across:986170696512204820> **Duels WLR:** `No Duels Data`\n\n';
  }

  if (skywars) {
    const stars = parseInt(skywars[0].toString().slice(0, -1), 10);
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
  } else {
    requirementEmbed +=
      ':red_circle: **Skywars 1**\n<a:across:986170696512204820> **Skywars Stars:** `No Skywars Data`\n<a:across:986170696512204820> **Skywars KDR:** `No Skywars Data`\n\n';
  }

  if (skywars) {
    const stars = parseInt(skywars[0].toString().slice(0, -1), 10);
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
  } else {
    requirementEmbed +=
      ':red_circle: **Skywars 2**\n<a:across:986170696512204820> **Skywars Stars:** `No Skywars Data`\n<a:across:986170696512204820> **Skywars KDR:** `No Skywars Data`\n\n';
  }

  if (skyblock) {
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
  } else {
    requirementEmbed +=
      ':red_circle: **Skyblock**\n<a:across:986170696512204820> **Skyblock Networth:** `No Skyblock Data / API Disabled`\n' +
      '<a:across:986170696512204820> **Skyblock Skill Average:** `No Skyblock Data / API Disabled`\n\n';
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
