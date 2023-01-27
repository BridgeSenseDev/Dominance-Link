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

function weeklyGexp(members: any, uuid: string) {
  let gexp = 0;
  Object.keys(members).forEach((member) => {
    if (uuid === members[member].uuid) {
      for (let i = 0; i < 7; i++) {
        gexp += Number(Object.values(members[member].expHistory)[i]);
      }
    }
  });
  return gexp;
}

export default async function requirements(uuid: string, playerData: any) {
  let guild;
  let bedwars;
  let duels;
  let skywars;
  let skyblock;
  const name = await uuidToName(uuid);
  const guildData = (await hypixelRequest(`https://api.hypixel.net/guild?player=${uuid}`)).guild;

  // Get gamemode data
  let profileData;
  let bankBalance;
  const { profiles } = await hypixelRequest(`https://api.hypixel.net/skyblock/profiles?uuid=${uuid}`);
  if (!profiles) {
    skyblock = ['No Skyblock Data / API Disabled', 'No Skyblock Data / API Disabled'];
  } else {
    profiles.forEach((i: any) => {
      if (i.selected === true) {
        profileData = i.members[uuid];
        bankBalance = i.banking?.balance;
      }
    });
    if (!profileData) {
      skyblock = ['No Skyblock Data / API Disabled', 'No Skyblock Data / API Disabled'];
    } else {
      const { networth } = await getNetworth(profileData, bankBalance);
      skyblock = [networth, await skillAverage(profileData)];
    }
  }

  try {
    const fkdr =
      Math.round((playerData.stats.Bedwars.final_kills_bedwars / playerData.stats.Bedwars.final_deaths_bedwars) * 100) /
      100;
    if (Number.isNaN(fkdr)) {
      bedwars = [playerData.achievements.bedwars_level, 0, playerData.stats.Bedwars.wins_bedwars];
    } else {
      bedwars = [
        playerData.achievements.bedwars_level,
        Math.round(
          (playerData.stats.Bedwars.final_kills_bedwars / playerData.stats.Bedwars.final_deaths_bedwars) * 100
        ) / 100,
        playerData.stats.Bedwars.wins_bedwars
      ];
    }
  } catch (e) {
    bedwars = ['No Bedwars Data', 'No Bedwars Data', 'No Bedwars Data'];
  }
  if (!bedwars[2]) {
    bedwars = ['No Bedwars Data', 'No Bedwars Data', 'No Bedwars Data'];
  }

  duels = [
    playerData.stats.Duels.wins,
    Math.round((playerData.stats.Duels.wins / playerData.stats.Duels.losses) * 100) / 100
  ];
  if (!duels[0]) {
    duels = ['No Duels Data', 'No Duels Data'];
  }

  try {
    const kdr = Math.round((playerData.stats.SkyWars.kills / playerData.stats.SkyWars.deaths) * 100) / 100;
    if (Number.isNaN(kdr)) {
      skywars = [removeSectionSymbols(playerData.stats.SkyWars.levelFormatted), 0];
    } else {
      skywars = [
        removeSectionSymbols(playerData.stats.SkyWars.levelFormatted),
        Math.round((playerData.stats.SkyWars.kills / playerData.stats.SkyWars.deaths) * 100) / 100
      ];
    }
  } catch (e) {
    skywars = ['No SkyWars Data', 'No SkyWars Data'];
  }

  try {
    guild = [guildData.name, weeklyGexp(guildData.members, uuid)];
  } catch (e) {
    guild = ['None', 'Not in a guild'];
  }

  // Check requirements
  let requirementEmbed = '';
  let meetingReqs = false;
  let author;
  let color;
  let reqs;

  if (!playerData.achievementPoints) {
    requirementEmbed +=
      ':red_circle: **Achievements**\n<a:across:986170696512204820> **Achievement Points:** `No Achievements Data`\n\n';
  } else if (playerData.achievementPoints >= 9000) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Achievements**\n';
    requirementEmbed += `<a:atick:986173414723162113> **Achievement Points:** \`${formatNumber(
      playerData.achievementPoints
    )}\`\n\n`;
  } else {
    requirementEmbed += ':red_circle: **Achievements**\n';
    requirementEmbed += `<a:across:986170696512204820> **Achievement Points:** \`${formatNumber(
      playerData.achievementPoints
    )} / 9,000\`\n\n`;
  }

  if (bedwars[0] !== 'No Bedwars Data') {
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

  if (bedwars[0] !== 'No Bedwars Data') {
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

  if (duels[0] !== 'No Duels Data') {
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

  if (duels[0] !== 'No Duels Data') {
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

  if (skywars[0] !== 'No SkyWars Data') {
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

  if (skywars[0] !== 'No SkyWars Data') {
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

  if (skyblock[0] !== 'No Skyblock Data / API Disabled') {
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
      '<a:across:986170696512204820> **Skyblock Networth:** `No Skyblock Data / API Disabled`\n' +
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
