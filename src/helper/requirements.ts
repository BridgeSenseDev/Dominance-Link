import type { Player } from "hypixel-api-reborn";
import config from "../config.json" with { type: "json" };
import { hypixel } from "../index.js";
import { abbreviateNumber, formatNumber, uuidToName } from "./clientUtils.js";

async function processPlayerData(
  uuid: string,
  playerData: Player,
): Promise<{
  skyblock: [number, number, number];
  bedwars: [number, number, number];
  duels: [number, number];
  skywars: [string, number];
}> {
  let skyblock: [number, number, number] | undefined;
  const bedwarsData = playerData.stats?.bedwars;
  const bedwars: [number, number, number] = [
    bedwarsData?.level ?? 0,
    +(bedwarsData?.finalKDRatio.toFixed(1) ?? 0),
    bedwarsData?.wins ?? 0,
  ];

  const duelsData = playerData.stats?.duels;
  const duels: [number, number] = [
    duelsData?.wins ?? 0,
    +(duelsData?.WLRatio.toFixed(1) ?? 0),
  ];

  const skywarsData = playerData.stats?.skywars;
  const skywars: [string, number] = [
    skywarsData?.levelFormatted ?? "1⋆",
    skywarsData?.KDRatio ?? 0,
  ];

  const sbMember = (
    await hypixel.getSkyblockProfiles(uuid).catch(() => null)
  )?.find((profile) => profile.selected)?.me;
  if (sbMember) {
    skyblock = [
      (await sbMember.getNetworth()).networth,
      sbMember.skills.average,
      sbMember.level,
    ];
  } else {
    skyblock = [0, 0, 0];
  }

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
  if (!playerData.achievementPoints) {
    requirementEmbed += `':red_circle: **Achievements**\n${config.emojis.aCross} **Achievement Points:** \`0 / 3,000\`\n\n`;
  } else if (playerData.achievementPoints >= 9000) {
    meetsReqs1 = true;
    requirementEmbed += `:green_circle: **Achievements**\n${
      config.emojis.aTick
    } **Achievement Points:** \`${formatNumber(
      playerData.achievementPoints,
    )}\`\n\n`;
  } else if (playerData.achievementPoints >= 3000) {
    meetsReqs2 = true;
    requirementEmbed += `:yellow_circle: **Achievements**\n${
      config.emojis.aWarning
    } **Achievement Points:** \`${formatNumber(
      playerData.achievementPoints,
    )} / 9,000\`\n\n`;
  } else {
    requirementEmbed += `:red_circle: **Achievements**\n${
      config.emojis.aCross
    } **Achievement Points:** \`${formatNumber(
      playerData.achievementPoints,
    )} / 3,000\`\n\n`;
  }

  // Bedwars 1
  if (bedwars[0] >= 500 && bedwars[1] >= 3) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Bedwars 1**\n";
    requirementEmbed += `${config.emojis.aTick} **Stars:** \`${bedwars[0]}\`\n`;
    requirementEmbed += `${config.emojis.aTick} **FKDR:** \`${bedwars[1]}\`\n\n`;
  } else if (bedwars[0] >= 200) {
    meetsReqs2 = true;
    requirementEmbed += ":yellow_circle: **Bedwars 1**\n";

    if (bedwars[0] >= 500) {
      requirementEmbed += `${config.emojis.aTick} **Stars:** \`${bedwars[0]}\`\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **Stars:** \`${bedwars[0]} / 500\`\n`;
    }
    if (bedwars[1] >= 3) {
      requirementEmbed += `${config.emojis.aTick} **FKDR:** \`${bedwars[1]}\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **FKDR:** \`${bedwars[1]} / 3\`\n\n`;
    }
  } else {
    requirementEmbed += ":red_circle: **Bedwars 1**\n";
    requirementEmbed += `${config.emojis.aCross} **Stars:** \`${bedwars[0]} / 200\`\n\n`;
  }

  // Bedwars 2
  if (bedwars[0] >= 150 && bedwars[1] >= 5) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Bedwars 2**\n";
  } else {
    requirementEmbed += ":red_circle: **Bedwars 2**\n";
  }
  if (bedwars[0] >= 150) {
    requirementEmbed += `${config.emojis.aTick} **Stars:** \`${bedwars[0]}\`\n`;
  } else {
    requirementEmbed += `${config.emojis.aCross} **Stars:** \`${bedwars[0]} / 150\`\n`;
  }
  if (bedwars[1] >= 5) {
    requirementEmbed += `${config.emojis.aTick} **FKDR:** \`${bedwars[1]}\`\n\n`;
  } else {
    requirementEmbed += `${config.emojis.aCross} **FKDR:** \`${bedwars[1]} / 5\`\n\n`;
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
    requirementEmbed += `${config.emojis.aTick} **Networth:** \`${abbreviateNumber(
      Math.round(skyblock[0] * 100) / 100,
    )}\`\n`;
    requirementEmbed += `${config.emojis.aTick} **Skill Average:** \`${
      Math.round(skyblock[1] * 10) / 10
    }\`\n\n`;
  } else if (skyblock[0] >= 1000000000 && skyblock[1] > 25) {
    meetsReqs2 = true;
    requirementEmbed += ":yellow_circle: **Skyblock 1**\n";
    if (skyblock[0] >= 3000000000) {
      requirementEmbed += `${
        config.emojis.aTick
      } **Networth:** \`${abbreviateNumber(
        Math.round(skyblock[0] * 100) / 100,
      )}\`\n`;
    } else {
      requirementEmbed += `${
        config.emojis.aWarning
      } **Networth:** \`${abbreviateNumber(
        Math.round(skyblock[0] * 100) / 100,
      )} / 3b\`\n`;
    }
    if (skyblock[1] === 0) {
      requirementEmbed += `${config.emojis.aCross} **Skill Average:** \`No Skyblock Data / API Disabled\`\n\n`;
    } else if (skyblock[1] >= 40) {
      requirementEmbed += `${config.emojis.aTick} **Skill Average:** \`${
        Math.round(skyblock[1] * 10) / 10
      }\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aWarning} **Skill Average:** \`${
        Math.round(skyblock[1] * 10) / 10
      } / 40\`\n\n`;
    }
  } else {
    requirementEmbed += ":red_circle: **Skyblock 1**\n";
    if (skyblock[0] >= 3000000000) {
      requirementEmbed += `${
        config.emojis.aTick
      } **Networth:** \`${abbreviateNumber(
        Math.round(skyblock[0] * 100) / 100,
      )}\`\n`;
    } else {
      requirementEmbed += `${
        config.emojis.aCross
      } **Networth:** \`${abbreviateNumber(
        Math.round(skyblock[0] * 100) / 100,
      )} / 1b\`\n`;
    }
    if (skyblock[1] === 0) {
      requirementEmbed += `${config.emojis.aCross} **Skill Average:** \`No Skyblock Data / API Disabled\`\n\n`;
    } else if (skyblock[1] >= 40) {
      requirementEmbed += `${config.emojis.aTick} **Skill Average:** \`${
        Math.round(skyblock[1] * 10) / 10
      }\`\n\n`;
    } else {
      requirementEmbed += `${config.emojis.aCross} **Skill Average:** \`${
        Math.round(skyblock[1] * 10) / 10
      } / 25\`\n\n`;
    }
  }

  // Skyblock 2
  if (skyblock[2] >= 250) {
    meetsReqs1 = true;
    requirementEmbed += ":green_circle: **Skyblock 2**\n";
    requirementEmbed += `${config.emojis.aTick} **Level:** \`${abbreviateNumber(
      Math.round(skyblock[2] * 100) / 100,
    )}\`\n`;
  } else if (skyblock[2] >= 200) {
    meetsReqs2 = true;
    if (skyblock[2] >= 250) {
      requirementEmbed += `${
        config.emojis.aTick
      } **Level:** \`${abbreviateNumber(
        Math.round(skyblock[2] * 100) / 100,
      )}\`\n`;
    } else {
      requirementEmbed += `${
        config.emojis.aCross
      } **Level:** \`${abbreviateNumber(
        Math.round(skyblock[2] * 100) / 100,
      )} / 250\`\n`;
    }
  } else {
    requirementEmbed += ":red_circle: **Skyblock 2**\n";
    requirementEmbed += `${
      config.emojis.aCross
    } **Level:** \`${abbreviateNumber(
      Math.round(skyblock[2] * 100) / 100,
    )} / 200\`\n`;
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
    playerData.achievementPoints >= 9000 ||
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
    playerData.achievementPoints >= 3000 ||
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
