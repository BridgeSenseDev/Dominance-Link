import { getNetworth } from 'skyhelper-networth';
import {
  removeSectionSymbols, abbreviateNumber, formatNumber, UUIDtoName,
} from './utils.js';
import config from '../config.json' assert {type: 'json'};
import { levelingXp } from './constants.js';

async function xpToLevel(exp, cap) {
  let xp = exp;
  for (let i = 0; i < cap; i += 1) {
    if (xp - levelingXp[i] > 0) {
      xp -= levelingXp[i];
    } else {
      return i + xp / levelingXp[i];
    }
  }
  return cap;
}

async function skillAverage(player) {
  let levels = 0;
  levels += await xpToLevel(player.experience_skill_farming, 60);
  levels += await xpToLevel(player.experience_skill_mining, 60);
  levels += await xpToLevel(player.experience_skill_combat, 60);
  levels += await xpToLevel(player.experience_skill_foraging, 50);
  levels += await xpToLevel(player.experience_skill_fishing, 50);
  levels += await xpToLevel(player.experience_skill_enchanting, 60);
  levels += await xpToLevel(player.experience_skill_alchemy, 50);
  levels += await xpToLevel(player.experience_skill_taming, 50);
  if (Number.isNaN(levels)) {
    return 'No Skyblock Data / API Disabled';
  }
  return levels / 8;
}

function weeklyGexp(members, uuid) {
  let gexp = 0;
  Object.keys(members).forEach((member) => {
    if (uuid === members[member].uuid) {
      for (let i = 0; i < 7; i += 1) {
        gexp += Number(Object.values(members[member].expHistory)[i]);
      }
    }
  });
  return gexp;
}

export default async function requirements(uuid, playerData) {
  let guild; let bedwars; let duels; let skywars; let skyblock;
  const name = await UUIDtoName(uuid);
  const guildData = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&player=${uuid}`)).json()).guild;

  // Get gamemode data
  let profileData; let bankBalance;
  const { profiles } = (await (await fetch(`https://api.hypixel.net/skyblock/profiles?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json());
  if (profiles === null) {
    skyblock = ['No Skyblock Data / API Disabled', 'No Skyblock Data / API Disabled'];
  } else {
    profiles.forEach((i) => {
      if (i.selected === true) {
        profileData = i.members[uuid];
        bankBalance = i.banking?.balance;
      }
    });
    if (profileData === undefined) {
      skyblock = ['No Skyblock Data / API Disabled', 'No Skyblock Data / API Disabled'];
    } else {
      const { networth } = await getNetworth(profileData, bankBalance);
      skyblock = [networth, await skillAverage(profileData)];
    }
  }

  try {
    const fkdr = Math.round((playerData.stats.Bedwars.final_kills_bedwars
      / playerData.stats.Bedwars.final_deaths_bedwars) * 100) / 100;
    if (Number.isNaN(fkdr)) {
      bedwars = [playerData.achievements.bedwars_level, 0, playerData.stats.Bedwars.wins_bedwars];
    } else {
      bedwars = [playerData.achievements.bedwars_level,
        Math.round((playerData.stats.Bedwars.final_kills_bedwars
        / playerData.stats.Bedwars.final_deaths_bedwars) * 100) / 100,
        playerData.stats.Bedwars.wins_bedwars];
    }
  } catch (e) {
    bedwars = ['No Bedwars Data', 'No Bedwars Data', 'No Bedwars Data'];
  }
  if (bedwars[2] === undefined) {
    bedwars = ['No Bedwars Data', 'No Bedwars Data', 'No Bedwars Data'];
  }

  try {
    duels = [playerData.stats.Duels.wins, Math.round((playerData.stats.Duels.wins
      / playerData.stats.Duels.losses) * 100) / 100];
  } catch (e) {
    duels = ['No Duels Data', 'No Duels Data'];
  }

  try {
    const kdr = Math.round((playerData.stats.SkyWars.kills / playerData.stats.SkyWars.deaths) * 100)
    / 100;
    if (Number.isNaN(kdr)) {
      skywars = [removeSectionSymbols(playerData.stats.SkyWars.levelFormatted), 0];
    } else {
      skywars = [removeSectionSymbols(playerData.stats.SkyWars.levelFormatted),
        Math.round((playerData.stats.SkyWars.kills / playerData.stats.SkyWars.deaths) * 100) / 100];
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
  let author; let color; let reqs;

  if (playerData.achievementPoints === undefined) {
    requirementEmbed += ':red_circle: **Achievements**\n<a:across:986170696512204820> **Achievement Points:** `No Achievements Data`\n\n';
  } else if (playerData.achievementPoints >= 12500) {
    meetingReqs = true;
    requirementEmbed += ':green_circle: **Achievements**\n';
    requirementEmbed += `<a:atick:986173414723162113> **Achievement Points:** \`${formatNumber(playerData.achievementPoints)}\`\n\n`;
  } else {
    requirementEmbed += ':red_circle: **Achievements**\n';
    requirementEmbed += `<a:across:986170696512204820> **Achievement Points:** \`${formatNumber(playerData.achievementPoints)} / 12,500\`\n\n`;
  }

  if (bedwars[0] !== 'No Bedwars Data') {
    if (bedwars[2] >= 1500 && bedwars[1] >= 2 && bedwars[0] !== 'No Bedwars Data') {
      meetingReqs = true;
      requirementEmbed += ':green_circle: **Bedwars 1**\n';
    } else {
      requirementEmbed += ':red_circle: **Bedwars 1**\n';
    }
    if (bedwars[2] >= 1500) {
      requirementEmbed += `<a:atick:986173414723162113> **Bedwars Wins:** \`${bedwars[2]}\`\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Bedwars Wins:** \`${bedwars[2]} / 1500\`\n`;
    }
    if (bedwars[1] >= 2) {
      requirementEmbed += `<a:atick:986173414723162113> **Bedwars FKDR:** \`${bedwars[1]}\`\n\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Bedwars FKDR:** \`${bedwars[1]} / 2\`\n\n`;
    }
  } else {
    requirementEmbed += ':red_circle: **Bedwars 1**\n<a:across:986170696512204820> **Bedwars Wins:** `No Bedwars Data`\n'
      + '<a:across:986170696512204820> **Bedwars FKDR:** `No Bedwars Data`\n\n';
  }

  if (bedwars[0] !== 'No Bedwars Data') {
    if (bedwars[0] >= 300) {
      meetingReqs = true;
      requirementEmbed += `:green_circle: **Bedwars 2**\n<a:atick:986173414723162113> **Bedwars Stars:** \`${bedwars[0]}\`\n\n`;
    } else {
      requirementEmbed += `:red_circle: **Bedwars 2**\n<a:across:986170696512204820> **Bedwars Stars:** \`${bedwars[0]} / 300\`\n\n`;
    }
  } else {
    requirementEmbed += ':red_circle: **Bedwars 2**\n<a:across:986170696512204820> **Bedwars Stars:** `No Bedwars Data`\n\n';
  }

  if (duels[0] !== 'No Duels Data') {
    if (duels[0] >= 7500 && duels[1] >= 2) {
      meetingReqs = true;
      requirementEmbed += ':green_circle: **Duels 1**\n';
    } else {
      requirementEmbed += ':red_circle: **Duels 1**\n';
    }
    if (duels[0] >= 7500) {
      requirementEmbed += `<a:atick:986173414723162113> **Duels Wins:** \`${formatNumber(duels[0])}\`\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Duels Wins:** \`${formatNumber(duels[0])} / 7,500\`\n`;
    }
    if (duels[1] >= 2) {
      requirementEmbed += `<a:atick:986173414723162113> **Duels WLR:** \`${duels[1]}\`\n\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Duels WLR:** \`${duels[1]} / 2\`\n\n`;
    }
  } else {
    requirementEmbed += ':red_circle: **Duels 1**\n<a:across:986170696512204820> **Duels Wins:** `No Duels Data`\n'
      + '<a:across:986170696512204820> **Duels WLR:** `No Duels Data`\n\n';
  }

  if (duels[0] !== 'No Duels Data') {
    if (duels[0] >= 4000 && duels[1] >= 4) {
      meetingReqs = true;
      requirementEmbed += ':green_circle: **Duels 2**\n';
    } else {
      requirementEmbed += ':red_circle: **Duels 2**\n';
    }
    if (duels[0] >= 4000) {
      requirementEmbed += `<a:atick:986173414723162113> **Duels Wins:** \`${formatNumber(duels[0])}\`\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Duels Wins:** \`${formatNumber(duels[0])} / 4,000\`\n`;
    }
    if (duels[1] >= 4) {
      requirementEmbed += `<a:atick:986173414723162113> **Duels WLR:** \`${duels[1]}\`\n\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Duels WLR:** \`${duels[1]} / 4\`\n\n`;
    }
  } else {
    requirementEmbed += ':red_circle: **Duels 2**\n<a:across:986170696512204820> **Duels Wins:** `No Duels Data`\n<a:across:986170696512204820> **Duels WLR:** `No Duels Data`\n\n';
  }

  if (skywars[0] !== 'No SkyWars Data') {
    if (skywars[0].slice(0, -1) >= 12 && skywars[1] >= 1) {
      meetingReqs = true;
      requirementEmbed += ':green_circle: **Skywars 1**\n';
    } else {
      requirementEmbed += ':red_circle: **Skywars 1**\n';
    }
    if (skywars[0].slice(0, -1) >= 12) {
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
    requirementEmbed += ':red_circle: **Skywars 1**\n<a:across:986170696512204820> **Skywars Stars:** `No Skywars Data`\n<a:across:986170696512204820> **Skywars KDR:** `No Skywars Data`\n\n';
  }

  if (skywars[0] !== 'No SkyWars Data') {
    if (skywars[0].slice(0, -1) >= 10 && skywars[1] >= 1.5) {
      meetingReqs = true;
      requirementEmbed += ':green_circle: **Skywars 2**\n';
    } else {
      requirementEmbed += ':red_circle: **Skywars 2**\n';
    }
    if (skywars[0].slice(0, -1) >= 10) {
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
    requirementEmbed += ':red_circle: **Skywars 2**\n<a:across:986170696512204820> **Skywars Stars:** `No Skywars Data`\n<a:across:986170696512204820> **Skywars KDR:** `No Skywars Data`\n\n';
  }

  if (skyblock[0] !== 'No Skyblock Data / API Disabled') {
    if (skyblock[0] >= 500000000 && skyblock[1] >= 25) {
      meetingReqs = true;
      requirementEmbed += ':green_circle: **Skyblock**\n';
    } else {
      requirementEmbed += ':red_circle: **Skyblock**\n';
    }
    if (skyblock[0] >= 500000000) {
      requirementEmbed += `<a:atick:986173414723162113> **Skyblock Networth:** \`${abbreviateNumber(Math.round(skyblock[0] * 100) / 100)}\`\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Skyblock Networth:** \`${abbreviateNumber(Math.round(skyblock[0] * 100) / 100)} / 500m\`\n`;
    }
    if (skyblock[1] === 'No Skyblock Data / API Disabled') {
      requirementEmbed += '<a:across:986170696512204820> **Skyblock Skill Average:** `No Skyblock Data / API Disabled`\n\n';
    } else if (skyblock[1] >= 25) {
      requirementEmbed += `<a:atick:986173414723162113> **Skyblock Skill Average:** \`${Math.round(skyblock[1] * 10) / 10}\`\n\n`;
    } else {
      requirementEmbed += `<a:across:986170696512204820> **Skyblock Skill Average:** \`${Math.round(skyblock[1] * 10) / 10} / 25\`\n\n`;
    }
  } else {
    requirementEmbed += '<a:across:986170696512204820> **Skyblock Networth:** `No Skyblock Data / API Disabled`\n'
    + '<a:across:986170696512204820> **Skyblock Skill Average:** `No Skyblock Data / API Disabled`\n\n';
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
    requirementEmbed, guild, author, color, reqs,
  };
}
