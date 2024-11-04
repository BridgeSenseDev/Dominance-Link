import type { Player } from "hypixel-api-reborn";
import config from "../config.json" with { type: "json" };
import { abbreviateNumber, formatNumber } from "../helper/clientUtils.ts";
import { checkRequirements } from "../helper/requirements.ts";
import { formatTime, timeAgo } from "../helper/utils.ts";
import { hypixel } from "../index.ts";
import { chat } from "./workerHandler.ts";

export async function handleMinecraftCommands(
  channel: string,
  message: string,
  author: string,
) {
  const command = /!(\w+)/.exec(message)?.[1];
  if (command) {
    let ign = /!\w+\s+(\S+)/.exec(message)?.[1];
    if (!ign) {
      ign = author;
    }

    const player = await hypixel.getPlayer(ign).catch(async (e) => {
      chat(`/{channel} Error: ${e.message}`);
    });
    if (!player) return;

    switch (command) {
      case "bw":
      case "bedwars": {
        chat(getBedwarsStats(channel, player));
        break;
      }
      case "d":
      case "duels": {
        chat(getDuelsStats(channel, player));
        break;
      }
      case "mm":
      case "murder": {
        chat(getMurderMysteryStats(channel, player));
        break;
      }
      case "b":
      case "bridge": {
        chat(getBridgeStats(channel, player));
        break;
      }
      case "vz":
      case "vampirez": {
        chat(getVampStats(channel, player));
        break;
      }
      case "sw":
      case "skywars": {
        chat(getSkyWarsStats(channel, player));
        break;
      }
      case "sb":
      case "skyblock": {
        chat(await getSkyblockStats(channel, player));
        break;
      }
      case "p":
      case "ping": {
        chat(await getHypixelPing(channel, player));
        break;
      }
      case "h":
      case "hypixel": {
        chat(await getHypixelStats(channel, player));
        break;
      }
      case "z":
      case "zombies": {
        chat(await getZombiesStats(channel, player));
        break;
      }
      case "r":
      case "reqs": {
        chat(await getReqs(channel, player));
        break;
      }
    }
  }
}

export function getBedwarsStats(channel: string, player: Player) {
  const bedwars = player.stats?.bedwars;
  const star = bedwars?.level ?? 0;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const fk = formatNumber(bedwars?.finalKills ?? 0);
  const fkdr = formatNumber(bedwars?.finalKDRatio ?? 0);
  const wins = formatNumber(bedwars?.wins ?? 0);
  const wlr = formatNumber(bedwars?.WLRatio ?? 0);
  const ws = formatNumber(bedwars?.winstreak ?? 0);

  return `/${channel} [${star}✫] ${rankTag}${player.nickname} FK: ${fk} FKDR: ${fkdr} W: ${wins} WLR: ${wlr} WS: ${ws}`;
}

export function getDuelsStats(channel: string, player: Player) {
  const duels = player.stats?.duels;
  const division = duels?.title ? `[${duels?.title}] ` : "";
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(duels?.wins ?? 0);
  const wlr = formatNumber(duels?.WLRatio ?? 0);
  const cws = formatNumber(duels?.winstreak ?? 0);
  const bws = formatNumber(duels?.bestWinstreak ?? 0);

  return `/${channel} ${division}${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} CWS: ${cws} BWS: ${bws}`;
}

export function getMurderMysteryStats(channel: string, player: Player) {
  const murderMystery = player.stats?.murdermystery;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = murderMystery?.wins ?? 0;
  const kills = murderMystery?.kills ?? 0;
  const kdr = formatNumber(
    (murderMystery?.kills ?? 0) / (murderMystery?.deaths ?? 0),
  );

  return `/${channel} ${rankTag}${player.nickname} W: ${wins} K: ${kills} KDR: ${kdr}`;
}

export function getBridgeStats(channel: string, player: Player) {
  const bridge = player.stats?.duels?.bridge;
  const division = bridge?.title ? `[${bridge?.title}] ` : "";
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(bridge?.wins ?? 0);
  const wlr = formatNumber(bridge?.WLRatio ?? 0);
  const goals = formatNumber(bridge?.goals ?? 0);
  const cws = formatNumber(bridge?.winstreak ?? 0);
  const bws = formatNumber(bridge?.bestWinstreak ?? 0);

  return `/${channel} ${division}${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} G: ${goals} CWS: ${cws} BWS: ${bws}`;
}

export function getVampStats(channel: string, player: Player) {
  const vamp = player.stats?.vampirez;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const humanWins = formatNumber(vamp?.human.wins ?? 0);
  const humanKills = formatNumber(vamp?.vampire.kills ?? 0);
  const humanKdr = formatNumber(
    (vamp?.vampire.kills ?? 0) / (vamp?.human.deaths ?? 0),
  );

  return `/${channel} ${rankTag}${player.nickname} HW: ${humanWins} HK: ${humanKills} HKDR: ${humanKdr}`;
}

export function getSkyWarsStats(channel: string, player: Player) {
  const skywars = player.stats?.skywars;
  const level = skywars?.levelFormatted ?? "1⋆";
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(skywars?.wins ?? 0);
  const wlr = formatNumber(skywars?.WLRatio ?? 0);
  const kills = formatNumber(skywars?.kills ?? 0);
  const kdr = formatNumber((skywars?.kills ?? 0) / (skywars?.deaths ?? 0));

  return `/${channel} [${level}] ${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} K: ${kills} KDR: ${kdr}`;
}

export async function getSkyblockStats(channel: string, player: Player) {
  const sbProfiles = await hypixel
    .getSkyblockProfiles(player.uuid)
    .catch((e) => {
      return `/${channel} Error: ${e.message}`;
    });
  if (typeof sbProfiles === "string") {
    return sbProfiles;
  }

  const sbMember = sbProfiles?.find((profile) => profile.selected)?.me;

  if (sbMember) {
    const { networth } = (await sbMember.getNetworth()) ?? { networth: 0 };
    const sbSkillAverage = sbMember.skills.average;
    const sbLevel = sbMember.level;
    const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;

    return `/${channel} [${Math.floor(sbLevel)}] ${rankTag}${player.nickname} NW: ${abbreviateNumber(networth)} SA: ${formatNumber(sbSkillAverage)}`;
  }

  return `/${channel} Error: No profiles found for ${player.nickname}`;
}

export async function getHypixelPing(channel: string, player: Player) {
  const ping = await (
    await fetch(`https://api.polsu.xyz/polsu/ping?uuid=${player.uuid}`, {
      headers: {
        "Api-Key": config.keys.polsuApiKey,
      },
    })
  ).json();

  if (!ping.success) {
    return `/${channel} Error: ${ping.cause}`;
  }

  const avg = ping.data.stats.avg;
  const min = ping.data.stats.min;
  const max = ping.data.stats.max;
  const recent = `Ping ${timeAgo(ping.data.history[0].timestamp * 1000)}: ${ping.data.history[0].avg}ms`;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;

  return `/${channel} ${rankTag}${player.nickname} MAX: ${max}ms MIN: ${min}ms AVG: ${avg}ms ${recent}`;
}

export async function getHypixelStats(channel: string, player: Player) {
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const level = Math.floor(player.level ?? 0);
  const achievementPoints = formatNumber(player.achievementPoints ?? 0);
  const rewardStreak = formatNumber(player.rewardStreak ?? 0);
  const karma = abbreviateNumber(player.karma ?? 0);
  const lastLogin = player.lastLogin ? timeAgo(player.lastLogin) : "N/A";

  return `/${channel} [${level}] ${rankTag}${player.nickname} AP: ${achievementPoints} Karma: ${karma} Reward Streak: ${rewardStreak} Last Login: ${lastLogin}`;
}

export async function getZombiesStats(channel: string, player: Player) {
  const zombies = player.stats?.arcade?.zombies;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(zombies?.overall?.wins ?? 0);
  const kills = formatNumber(zombies?.overall?.zombieKills ?? 0);
  const deaths = formatNumber(zombies?.overall?.deaths ?? 0);
  const DE = zombies?.deadEnd.fastestRound30
    ? formatTime(zombies.deadEnd.fastestRound30)
    : `Round ${zombies?.deadEnd.bestRound ?? 0}`;
  const AA = zombies?.alienArcadium.fastestRound30
    ? formatTime(zombies.alienArcadium.fastestRound30)
    : `Round ${zombies?.alienArcadium.bestRound ?? 0}`;
  const BB = zombies?.badBlood.fastestRound30
    ? formatTime(zombies.badBlood.fastestRound30)
    : `Round ${zombies?.badBlood.bestRound ?? 0}`;
  const P = zombies?.prison.fastestRound30
    ? formatTime(zombies.prison.fastestRound30)
    : `Round ${zombies?.prison.bestRound ?? 0}`;

  return `/${channel} ${rankTag}${player.nickname} W: ${wins} K: ${kills} D: ${deaths} DE: ${DE} AA: ${AA} BB: ${BB} P: ${P}`;
}

export async function getReqs(channel: string, player: Player) {
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const reqs = await checkRequirements(player.uuid, player);

  if (reqs === 0) {
    return `/${channel} ${rankTag}${player.nickname} does not meet requirements!`;
  }
  if (reqs === 1) {
    return `/${channel} ${rankTag}${player.nickname} meets secondary requirements! (200k GEXP/week)`;
  }
  if (reqs === 2) {
    return `/${channel} ${rankTag}${player.nickname} meets primary requirements! (65k GEXP/week)`;
  }

  return `/${channel} ${rankTag}${player.nickname} requirements check failed!`;
}
