import {
  removeSectionSymbols, abbreviateNumber, formatNumber, UUIDtoName,
} from './utils.js';
import config from '../config.json' assert {type: "json"};

const validSkills = ['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'];

function skillAverage(skills) {
  let levels = 0;
  for (const i in skills) {
    if (validSkills.includes(i)) {
      levels += skills[i].level;
    }
  }
  return levels / 8;
}

function weeklyGexp(members, uuid) {
  let weeklyGexp = 0;
  for (const i in members) {
    if (uuid === members[i].uuid) {
      for (let j = 0; j < 7; j += 1) {
        weeklyGexp += (Object.values(members[i].expHistory)[j]);
      }
    }
  }
  return weeklyGexp;
}

export default async function requirements(uuid, playerData) {
  let guild; let bedwars; let duels; let skywars; let skyblock;
  const name = await UUIDtoName(uuid);
  const guildData = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&playerData=${uuid}`)).json()).guild;

  // Get gamemode data
  let skyblockData;
  try {
    [skyblockData] = (await (await fetch(`http://192.168.1.119:3000/v1/profiles/${name}?key=matrixlink`)).json()).data;
    skyblock = [skyblockData.networth.total_networth, skillAverage(skyblockData.skills)];
  } catch (e) {
    skyblock = ['No Skyblock Data / API Disabled', 'No Skyblock Data / API Disabled'];
  }

  try {
    bedwars = [playerData.achievements.bedwars_level, Math.round((
      playerData.stats.Bedwars.final_kills_bedwars / playerData.stats.Bedwars.final_deaths_bedwars)
      * 100) / 100];
  } catch (e) {
    bedwars = ['No Bedwars Data', 'No Bedwars Data'];
  }
  if (bedwars[0] === undefined) {
    bedwars = ['No Bedwars Data', 'No Bedwars Data'];
  }

  try {
    duels = [playerData.stats.Duels.wins, Math.round((playerData.stats.Duels.wins
      / playerData.stats.Duels.losses) * 100) / 100];
  } catch (e) {
    duels = ['No Duels Data', 'No Duels Data'];
  }
  if (duels[0] === undefined) {
    duels = ['No Duels Data', 'No Duels Data'];
  }

  try {
    skywars = [removeSectionSymbols(playerData.stats.SkyWars.levelFormatted),
      Math.round((playerData.stats.SkyWars.kills / playerData.stats.SkyWars.deaths) * 100) / 100];
  } catch (e) {
    skywars = ['No SkyWars Data', 'No SkyWars Data'];
  }
  if (skywars[0] === undefined) {
    skywars = ['No SkyWars Data', 'No SkyWars Data'];
  }

  try {
    guild = [guildData.name, weeklyGexp(guildData.members, uuid)];
  } catch (e) {
    guild = ['None', 'Not in a guild'];
  }

  // Check requirements
  let requirements = '';
  let meetingReqs = false;
  let author; let color; let reqs;

  if (playerData.achievementPoints >= 10000) {
    meetingReqs = true;
    requirements += ':green_circle: **Achievements**\n';
    requirements += `<a:atick:986173414723162113> **Achievement Points:** \`${playerData.achievementPoints}\`\n\n`;
  } else {
    requirements += ':red_circle: **Achievements**\n';
    requirements += `<a:across:986170696512204820> **Achievement Points:** \`${formatNumber(playerData.achievementPoints)} / 10,000\`\n\n`;
  }

  if (playerData.achievements.arcade_arcade_winner >= 1500) {
    meetingReqs = true;
    requirements += ':green_circle: **Arcade**\n';
    requirements += `<a:atick:986173414723162113> **Arcade Wins:** \`${playerData.achievements.arcade_arcade_winner}\`\n\n`;
  } else {
    requirements += ':red_circle: **Arcade**\n';
    try {
      requirements += `<a:across:986170696512204820> **Arcade Wins:** \`${formatNumber(playerData.achievements.arcade_arcade_winner)} / 1,500\`\n\n`;
    } catch (e) {
      requirements += '<a:across:986170696512204820> **Arcade Wins:** `No Arcade Games Data`\n\n';
    }
  }

  if (bedwars[0] >= 200 && bedwars[1] >= 3 && bedwars[0] !== 'No Bedwars Data') {
    meetingReqs = true;
    requirements += ':green_circle: **Bedwars**\n';
  } else {
    requirements += ':red_circle: **Bedwars**\n';
  }
  if (bedwars[0] === 'No Bedwars Data') {
    requirements += '<a:across:986170696512204820> **Bedwars Stars:** `No Bedwars Data`\n<a:across:986170696512204820> **Bedwars FKDR:** `No Bedwars Data`\n\n';
  } else {
    if (bedwars[0] >= 200) {
      requirements += `<a:atick:986173414723162113> **Bedwars Stars:** \`${bedwars[0]}\`\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Bedwars Stars:** \`${bedwars[0]} / 300\`\n`;
    }
    if (bedwars[1] >= 3) {
      requirements += `<a:atick:986173414723162113> **Bedwars FKDR:** \`${bedwars[1]}\`\n\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Bedwars FKDR:** \`${bedwars[1]} / 3\`\n\n`;
    }
  }

  try {
    if (playerData.stats.BuildBattle.score >= 20000) {
      meetingReqs = true;
      requirements += ':green_circle: **Build Battle**\n';
      requirements += `<a:atick:986173414723162113> **Build Battle Score:** \`${playerData.stats.BuildBattle.score}\`\n\n`;
    } else {
      requirements += ':red_circle: **Build Battle**\n';
      requirements += `<a:across:986170696512204820> **Build Battle Score:** \`${formatNumber(playerData.stats.BuildBattle.score)} / 20,000\`\n\n`;
    }
  } catch (e) {
    requirements += ':red_circle: **Build Battle**\n';
    requirements += '<a:across:986170696512204820> **Build Battle Score:** `No Build Battle Data`\n\n';
  }

  if (duels[0] >= 10000 && duels[1] >= 2 && duels[0] !== 'No Duels Data') {
    meetingReqs = true;
    requirements += ':green_circle: **Duels**\n';
  } else {
    requirements += ':red_circle: **Duels**\n';
  }
  if (duels[0] === 'No Duels Data') {
    requirements += '<a:across:986170696512204820> **Duels Wins:** `No Duels Data`\n<a:across:986170696512204820> **Duels WLR:** `No Duels Data`\n\n';
  } else {
    if (duels[0] >= 10000) {
      requirements += `<a:atick:986173414723162113> **Duels Wins:** \`${formatNumber(duels[0])}\`\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Duels Wins:** \`${formatNumber(duels[0])} / 10,000\`\n`;
    }
    if (duels[1] >= 2) {
      requirements += `<a:atick:986173414723162113> **Duels WLR:** \`${duels[1]}\`\n\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Duels WLR:** \`${duels[1]} / 2\`\n\n`;
    }
  }

  if (playerData.stats.MurderMystery.wins >= 2000) {
    meetingReqs = true;
    requirements += ':green_circle: **Murder Mystery**\n';
    requirements += `<a:atick:986173414723162113> **Murder Mystery Wins:** \`${playerData.stats.MurderMystery.wins}\`\n\n`;
  } else {
    requirements += ':red_circle: **Murder Mystery**\n';
    try {
      requirements += `<a:across:986170696512204820> **Murder Mystery Wins:** \`${formatNumber(playerData.stats.MurderMystery.wins)} / 20,000\`\n\n`;
    } catch (e) {
      requirements += '<a:across:986170696512204820> **Arcade Wins:** `No Murder Mystery Data`\n\n';
    }
  }

  if (playerData.achievements.pit_prestiges >= 2000) {
    meetingReqs = true;
    requirements += ':green_circle: **Pit**\n';
    requirements += `<a:atick:986173414723162113> **Pit Prestige:** \`${playerData.achievements.pit_prestiges}\`\n\n`;
  } else {
    requirements += ':red_circle: **Pit**\n';
    try {
      requirements += `<a:across:986170696512204820> **Pit Prestige:** \`${formatNumber(playerData.achievements.pit_prestiges)} / 15\`\n\n`;
    } catch (e) {
      requirements += '<a:across:986170696512204820> **Arcade Wins:** `No Pit Data`\n\n';
    }
  }

  if (skywars[0].slice(0, -1) >= 13 && skywars[1] >= 1.5 && skywars[0] !== 'No SkyWars Data') {
    meetingReqs = true;
    requirements += ':green_circle: **Skywars**\n';
  } else {
    requirements += ':red_circle: **Skywars**\n';
  }
  if (skywars[0] === 'No SkyWars Data') {
    requirements += '<a:across:986170696512204820> **Skywars Stars:** `No Skywars Data`\n<a:across:986170696512204820> **Skywars KDR:** `No Skywars Data`\n\n';
  } else {
    if (skywars[0].slice(0, -1) >= 13) {
      requirements += `<a:atick:986173414723162113> **Skywars Stars:** \`${skywars[0]}\`\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Skywars Stars:** \`${skywars[0]} / 12☆\`\n`;
    }
    if (skywars[1] >= 1.5) {
      requirements += `<a:atick:986173414723162113> **Skywars KDR:** \`${skywars[1]}\`\n\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Skywars KDR:** \`${skywars[1]} / 1.5\`\n\n`;
    }
  }

  if (skyblock[0] >= 500000000 && skyblock[1] >= 30 && skyblock[0] !== 'No Skyblock Data / API Disabled') {
    meetingReqs = true;
    requirements += ':green_circle: **Skyblock**\n';
  } else {
    requirements += ':red_circle: **Skyblock**\n';
  }
  if (skyblock[0] === 'No Skyblock Data / API Disabled') {
    requirements += '<a:across:986170696512204820> **Skyblock Networth:** `No Skyblock Data / API Disabled`\n<a:across:986170696512204820> **Skyblock Skill \
    Average:** `No Skyblock Data / API Disabled`\n\n';
  } else {
    if (skyblock[0] >= 500000000) {
      requirements += `<a:atick:986173414723162113> **Skyblock Networth:** \`${abbreviateNumber(Math.round(skyblock[0] * 100) / 100)}\`\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Skyblock Networth:** \`${abbreviateNumber(Math.round(skyblock[0] * 100) / 100)} / 500m\`\n`;
    }
    if (skyblock[1] >= 30) {
      requirements += `<a:atick:986173414723162113> **Skyblock Skill Average:** \`${skyblock[1]}\`\n\n`;
    } else {
      requirements += `<a:across:986170696512204820> **Skyblock Skill Average:** \`${skyblock[1]} / 30\`\n\n`;
    }
  }

  if (playerData.stats.TNTGames.wins >= 800) {
    meetingReqs = true;
    requirements += ':green_circle: **Tnt Games**\n';
    requirements += `<a:atick:986173414723162113> **Tnt Games Wins:** \`${playerData.stats.TNTGames.wins}\``;
  } else {
    requirements += ':red_circle: **Tnt Games**\n';
    try {
      requirements += `<a:across:986170696512204820> **Tnt Games Wins:** \`${formatNumber(playerData.stats.TNTGames.wins)} / 800\``;
    } catch (e) {
      requirements += '<a:across:986170696512204820> **Arcade Wins:** `No Tnt Games Data`\n\n';
    }
  }

  if (meetingReqs) {
    author = `${name} meets Matrix requirements!`;
    color = 0x2ecc70;
    reqs = 'Yes';
  } else {
    author = `${name} does not meet Matrix requirements!`;
    color = config.color.red;
    reqs = 'No';
  }

  return {
    requirements, guild, author, color, reqs,
  };
}
