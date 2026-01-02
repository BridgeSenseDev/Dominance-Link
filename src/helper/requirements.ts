import type { Player } from "hypixel-api-reborn";
import config from "../config.json";
import { abbreviateNumber, formatNumber, uuidToName } from "./clientUtils.js";
import { fetchSkyBlockStats } from "./utils.js";

async function processPlayerData(
  uuid: string,
  player: Player,
): Promise<{
  skyblock: number[];
  bedwars: [number, number, number];
  duels: [number, number];
  skywars: [string, number];
}> {
  const bwData = player.stats.BedWars;
  const bedwars: [number, number, number] = [
    bwData.level ?? 0,
    bwData.finals.total.ratio,
    bwData.wins,
  ];

  const duelsData = player.stats.Duels;
  const duels: [number, number] = [duelsData.wins, duelsData.WLR];

  const swData = player.stats.SkyWars;
  const skywars: [string, number] = [
    swData.levelFormatted ?? "1⋆",
    swData.kills.total.ratio,
  ];

  const sbStats = await fetchSkyBlockStats(uuid);
  const skyblock = sbStats
    ? [sbStats.networth, sbStats.skillAverage, sbStats.level]
    : [0, 0, 0];

  return { skyblock, bedwars, duels, skywars };
}

export default async function requirementsEmbed(
  uuid: string,
  playerData: Player,
) {
  const name = await uuidToName(uuid);

  const { skyblock, bedwars, duels, skywars } = await processPlayerData(
    uuid,
    playerData,
  );

  // Check requirements
  let requirementEmbed = "";
  let meetsReqs1 = false;
  let meetsReqs2 = false;

  // Achievements
  const ap = playerData.achievements.points;
  if (!ap) {
    requirementEmbed += `':red_circle: **Achievements**\n${config.emojis.aCross} **Achievement Points:** \`0 / 3,000\`\n\n`;
  } else if (ap >= 9000) {
    meetsReqs1 = true;
    requirementEmbed += `:green_circle: **Achievements**\n${
      config.emojis.aTick
    } **Achievement Points:** \`${formatNumber(ap)}\`\n\n`;
  } else if (ap >= 3000) {
    meetsReqs2 = true;
    requirementEmbed += `:yellow_circle: **Achievements**\n${
      config.emojis.aWarning
    } **Achievement Points:** \`${formatNumber(ap)} / 9,000\`\n\n`;
  } else {
    requirementEmbed += `:red_circle: **Achievements**\n${
      config.emojis.aCross
    } **Achievement Points:** \`${formatNumber(ap)} / 3,000\`\n\n`;
  }

  // Bedwars 1
  if (bedwars[0] >= 500 && bedwars[1] >= 3) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Bedwars 1**\n";
    requirementEmbed += `${config.emojis.aTick} **Stars:** \`${Math.floor(bedwars[0])}\`\n`;
    requirementEmbed += `${config.emojis.aTick} **FKDR:** \`${formatNumber(bedwars[1])}\`\n\n`;
  } else if (bedwars[0] >= 200) {
    meetsReqs2 = true;
    requirementEmbed += ":yellow_circle: **Bedwars 1**\n";

    if (bedwars[0] >= 500) {
      requirementEmbed += `${config.emojis.aTick} **Stars:** \`${Math.floor(bedwars[0])}\`\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **Stars:** \`${Math.floor(bedwars[0])} / 500\`\n`;
    }
    if (bedwars[1] >= 3) {
      requirementEmbed += `${config.emojis.aTick} **FKDR:** \`${formatNumber(bedwars[1])}\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **FKDR:** \`${formatNumber(bedwars[1])} / 3\`\n\n`;
    }
  } else {
    requirementEmbed += ":red_circle: **Bedwars 1**\n";
    requirementEmbed += `${config.emojis.aCross} **Stars:** \`${Math.floor(bedwars[0])} / 200\`\n\n`;
  }

  // Bedwars 2
  if (bedwars[0] >= 150 && bedwars[1] >= 5) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Bedwars 2**\n";
  } else {
    requirementEmbed += ":red_circle: **Bedwars 2**\n";
  }
  if (bedwars[0] >= 150) {
    requirementEmbed += `${config.emojis.aTick} **Stars:** \`${Math.floor(bedwars[0])}\`\n`;
  } else {
    requirementEmbed += `${config.emojis.aCross} **Stars:** \`${Math.floor(bedwars[0])} / 150\`\n`;
  }
  if (bedwars[1] >= 5) {
    requirementEmbed += `${config.emojis.aTick} **FKDR:** \`${formatNumber(bedwars[1])}\`\n\n`;
  } else {
    requirementEmbed += `${config.emojis.aCross} **FKDR:** \`${formatNumber(bedwars[1])} / 5\`\n\n`;
  }

  // Duels 1
  if (duels[0] >= 10000 && duels[1] >= 2) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Duels 1**\n";
    requirementEmbed += `${config.emojis.aTick} **Wins:** \`${formatNumber(duels[0])}\`\n`;
    requirementEmbed += `${config.emojis.aTick} **WLR:** \`${duels[1]}\`\n\n`;
  } else if (duels[0] > 4000) {
    meetsReqs2 = true;
    requirementEmbed += ":yellow_circle: **Duels 1**\n";
    if (duels[0] >= 10000) {
      requirementEmbed += `${
        config.emojis.aTick
      } **Wins:** \`${formatNumber(duels[0])}\`\n`;
    } else {
      requirementEmbed += `${
        config.emojis.aWarning
      } **Wins:** \`${formatNumber(duels[0])} / 10,000\`\n`;
    }
    if (duels[1] >= 2) {
      requirementEmbed += `${config.emojis.aTick} **WLR:** \`${duels[1]}\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **WLR:** \`${duels[1]} / 2\`\n\n`;
    }
  } else {
    requirementEmbed += ":red_circle: **Duels 1**\n";
    requirementEmbed += `${config.emojis.aCross} **Wins:** \`${formatNumber(duels[0])} / 4,000\`\n\n`;
  }

  // Duels 2
  if (duels[0] >= 5000 && duels[1] >= 3) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Duels 2**\n";
  } else {
    requirementEmbed += ":red_circle: **Duels 2**\n";
  }
  if (duels[0] >= 5000) {
    requirementEmbed += `${
      config.emojis.aTick
    } **Duels Wins:** \`${formatNumber(duels[0])}\`\n`;
  } else {
    requirementEmbed += `${
      config.emojis.aCross
    } **Duels Wins:** \`${formatNumber(duels[0])} / 5,000\`\n`;
  }
  if (duels[1] >= 3) {
    requirementEmbed += `${config.emojis.aTick} **WLR:** \`${duels[1]}\`\n\n`;
  } else {
    requirementEmbed += `${config.emojis.aCross} **WLR:** \`${duels[1]} / 3\`\n\n`;
  }

  const stars = Number.parseInt(skywars[0].slice(0, -1), 10);
  if (stars >= 15 && skywars[1] >= 1) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Skywars 1**\n";
    requirementEmbed += `${config.emojis.aTick} **Stars:** \`${skywars[0]}\`\n`;
    requirementEmbed += `${config.emojis.aTick} **KDR:** \`${skywars[1]}\`\n\n`;
  } else if (stars >= 10) {
    meetsReqs2 = true;
    requirementEmbed += ":yellow_circle: **Skywars 1**\n";
    if (stars >= 12) {
      requirementEmbed += `${config.emojis.aTick} **Stars:** \`${skywars[0]}\`\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **Stars:** \`${skywars[0]} / 15☠\`\n`;
    }
    if (skywars[1] >= 1) {
      requirementEmbed += `${config.emojis.aTick} **KDR:** \`${skywars[1]}\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **KDR:** \`${skywars[1]} / 1\`\n\n`;
    }
  } else {
    requirementEmbed += ":red_circle: **Skywars 1**\n";
    requirementEmbed += `${config.emojis.aCross} **Stars:** \`${skywars[0]} / 10❤\`\n\n`;
  }

  // Skywars 2
  if (stars >= 10 && skywars[1] >= 1.5) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Skywars 2**\n";
  } else {
    requirementEmbed += ":red_circle: **Skywars 2**\n";
  }
  if (stars >= 10) {
    requirementEmbed += `${config.emojis.aTick} **Stars:** \`${skywars[0]}\`\n`;
  } else {
    requirementEmbed += `${config.emojis.aCross} **Stars:** \`${skywars[0]} / 10❤\`\n`;
  }
  if (skywars[1] >= 1.5) {
    requirementEmbed += `${config.emojis.aTick} **KDR:** \`${skywars[1]}\`\n\n`;
  } else {
    requirementEmbed += `${config.emojis.aCross} **KDR:** \`${skywars[1]} / 1.5\`\n\n`;
  }

  // Skyblock 1
  if (skyblock[0] >= 3000000000 && skyblock[1] >= 40) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Skyblock 1**\n";
    requirementEmbed += `${config.emojis.aTick} **Networth:** \`${abbreviateNumber(skyblock[0])}\`\n`;
    requirementEmbed += `${config.emojis.aTick} **Skill Average:** \`${formatNumber(skyblock[1])}\`\n\n`;
  } else if (skyblock[0] >= 1000000000 && skyblock[1] > 25) {
    meetsReqs2 = true;
    requirementEmbed += ":yellow_circle: **Skyblock 1**\n";
    if (skyblock[0] >= 3000000000) {
      requirementEmbed += `${config.emojis.aTick} **Networth:** \`${abbreviateNumber(skyblock[0])}\`\n`;
    } else {
      requirementEmbed += `${
        config.emojis.aWarning
      } **Networth:** \`${abbreviateNumber(skyblock[0])} / 3B\`\n`;
    }
    if (skyblock[1] === 0) {
      requirementEmbed += `${config.emojis.aCross} **Skill Average:** \`No Skyblock Data / API Disabled\`\n\n`;
    } else if (skyblock[1] >= 40) {
      requirementEmbed += `${config.emojis.aTick} **Skill Average:** \`${formatNumber(skyblock[1])}\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **Skill Average:** \`${formatNumber(skyblock[1])} / 40\`\n\n`;
    }
  } else {
    requirementEmbed += ":red_circle: **Skyblock 1**\n";
    if (skyblock[0] >= 3000000000) {
      requirementEmbed += `${
        config.emojis.aTick
      } **Networth:** \`${abbreviateNumber(skyblock[0])}\`\n`;
    } else {
      requirementEmbed += `${
        config.emojis.aCross
      } **Networth:** \`${abbreviateNumber(skyblock[0])} / 1B\`\n`;
    }
    if (skyblock[1] === 0) {
      requirementEmbed += `${config.emojis.aCross} **Skill Average:** \`No Skyblock Data / API Disabled\`\n\n`;
    } else if (skyblock[1] >= 40) {
      requirementEmbed += `${config.emojis.aTick} **Skill Average:** \`${formatNumber(skyblock[1])}\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aCross} **Skill Average:** \`${formatNumber(skyblock[1])} / 25\`\n\n`;
    }
  }

  // Skyblock 2
  if (skyblock[2] >= 250) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Skyblock 2**\n";
    requirementEmbed += `${config.emojis.aTick} **Level:** \`${Math.floor(skyblock[2])}\`\n`;
  } else if (skyblock[2] >= 200) {
    meetsReqs2 = true;
    requirementEmbed += ":yellow_circle: **Skyblock 2**\n";
    requirementEmbed += `${
      config.emojis.aCross
    } **Level:** \`${Math.floor(skyblock[2])} / 250\`\n`;
  } else {
    requirementEmbed += ":red_circle: **Skyblock 2**\n";
    requirementEmbed += `${
      config.emojis.aCross
    } **Level:** \`${Math.floor(skyblock[2])} / 200\`\n`;
  }

  if (meetsReqs1) {
    return {
      embed: `**You will have to earn \`65k\` GEXP per week**\n\n${requirementEmbed}`,
      author: `${name} meets primary requirements!`,
      reqs: 2,
    };
  }

  if (meetsReqs2) {
    return {
      embed: `**You will have to earn \`200k\` GEXP per week**\n\n${requirementEmbed}`,
      author: `${name} meets secondary requirements!`,
      reqs: 1,
    };
  }

  return {
    embed: requirementEmbed,
    author: `${name} does not meet requirements!`,
    reqs: 0,
  };
}

export async function checkRequirements(uuid: string, playerData: Player) {
  const { skyblock, bedwars, duels, skywars } = await processPlayerData(
    uuid,
    playerData,
  );

  const stars = Number.parseInt(skywars[0].slice(0, -1), 10);

  // Primary requirements
  const meetsPrimary =
    playerData.achievements.points >= 9000 ||
    (bedwars[0] >= 500 && bedwars[1] >= 3) ||
    (bedwars[0] >= 150 && bedwars[1] >= 5) ||
    (duels[0] >= 10000 && duels[1] >= 2) ||
    (duels[0] >= 5000 && duels[1] >= 3) ||
    (stars >= 15 && skywars[1] >= 1) ||
    (stars >= 10 && skywars[1] >= 1.5) ||
    (skyblock[0] >= 3000000000 && skyblock[1] >= 40) ||
    skyblock[2] >= 250;

  // Secondary requirements
  const meetsSecondary =
    playerData.achievements.points >= 3000 ||
    bedwars[0] >= 200 ||
    duels[0] >= 4000 ||
    stars >= 10 ||
    (skyblock[0] >= 1000000000 && skyblock[1] > 25) ||
    skyblock[2] >= 200;

  if (meetsPrimary) {
    return 2;
  }
  if (meetsSecondary) {
    return 1;
  }
  return 0;
}
