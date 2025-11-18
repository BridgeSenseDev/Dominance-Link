import type { Player } from "hypixel-api-reborn";
import config from "../config.json" with { type: "json" };
import { abbreviateNumber, formatNumber } from "../helper/clientUtils.ts";
import { checkRequirements } from "../helper/requirements.ts";
import { fetchSkyBlockStats, formatTime, timeAgo } from "../helper/utils.ts";
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
      chat(`/${channel} Error: ${e.message}`);
    });
    if (!player || player.isRaw()) return;

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
      case "wl":
      case "warlords": {
        chat(await getWarlordsStats(channel, player));
        break;
      }
    }
  }
}

export function getBedwarsStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const bw = player.stats.BedWars;

  return `/${channel} [${Math.floor(bw.level)}✫] ${nametag}${player.nickname} FK: ${formatNumber(bw.finalKills)} FKDR: ${formatNumber(bw.FKDR)} W: ${formatNumber(bw.wins)} WLR: ${formatNumber(bw.WLR)} WS: ${formatNumber(bw.winStreak)}`;
}

export function getDuelsStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const duels = player.stats.Duels;
  const division = duels.title ? `[${duels?.title}] ` : "";

  return `/${channel} ${division}${nametag}${player.nickname} W: ${formatNumber(duels.wins)} WLR: ${formatNumber(duels.WLR)} CWS: ${formatNumber(duels.winStreak)} BWS: ${formatNumber(duels.bestWinStreak)}`;
}

export function getMurderMysteryStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const mm = player.stats.MurderMystery;
  return `/${channel} ${nametag}${player.nickname} W: ${formatNumber(mm.wins)} K: ${formatNumber(mm.kills)} KDR: ${formatNumber(mm.KDR)}`;
}

export function getBridgeStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const bridge = player.stats.Duels.bridge;
  const division = bridge.title ? `[${bridge?.title}] ` : "";

  // TODO: bridge goals
  return `/${channel} ${division}${nametag}${player.nickname} W: ${formatNumber(bridge.wins)} WLR: ${formatNumber(bridge.WLR)} G: 0 CWS: ${formatNumber(bridge.winStreak)} BWS: ${formatNumber(bridge.bestWinStreak)}`;
}

export function getVampStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const vamp = player.stats.VampireZ;

  return `/${channel} ${nametag}${player.nickname} HW: ${formatNumber(vamp.wins)} HK: ${formatNumber(vamp.human.kills)} HKDR: ${formatNumber(vamp.human.KDR)}`;
}

export function getSkyWarsStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const sw = player.stats.SkyWars;
  const level = sw.levelFormatted ?? "1⋆";

  return `/${channel} [${level}] ${nametag}${player.nickname} W: ${formatNumber(sw.wins)} WLR: ${formatNumber(sw.WLR)} K: ${formatNumber(sw.kills)} KDR: ${formatNumber(sw.KDR)}`;
}

export async function getSkyblockStats(channel: string, player: Player) {
  const sbStats = await fetchSkyBlockStats(player.uuid);

  if (sbStats) {
    const nametag = player.rank ? `[${player.rank}] ` : "";

    return `/${channel} [${Math.floor(sbStats.level)}] ${nametag}${player.nickname} NW: ${abbreviateNumber(sbStats.networth)} SA: ${formatNumber(sbStats.skillAverage)}`;
  }

  return `/${channel} Error: No profiles found for ${player.nickname}`;
}

export async function getHypixelPing(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const response = await fetch(
    `https://api.polsu.xyz/polsu/ping?uuid=${player.uuid}`,
    {
      headers: {
        "Api-Key": config.keys.polsuApiKey,
      },
    },
  );

  const ping = await response.json().catch(() => {
    return {
      success: false,
      cause: "Failed to parse response",
    };
  });

  if (!ping.success) {
    return `/${channel} Error: ${ping.cause}`;
  }

  const avg = ping.data.stats.avg;
  const min = ping.data.stats.min;
  const max = ping.data.stats.max;
  const recent = `Ping ${timeAgo(ping.data.history[0].timestamp * 1000)}: ${ping.data.history[0].avg}ms`;

  return `/${channel} ${nametag}${player.nickname} MAX: ${max}ms MIN: ${min}ms AVG: ${avg}ms ${recent}`;
}

export async function getHypixelStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";

  const lastLogin = player.lastLoginAt ? timeAgo(player.lastLoginAt) : "N/A";

  return `/${channel} [${player.level.level}] ${nametag}${player.nickname} AP: ${formatNumber(player.achievements.points)} Karma: ${formatNumber(player.karma)} Reward Streak: ${formatNumber(player.rewards.rewardStreak)} Last Login: ${lastLogin}`;
}

export async function getZombiesStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const zb = player.stats.Arcade.zombies;

  const DE = zb?.deadEnd.fastestRound30
    ? formatTime(zb.deadEnd.fastestRound30)
    : `Round ${zb?.deadEnd.bestRound ?? 0}`;
  const AA = zb?.alienArcadium.fastestRound30
    ? formatTime(zb.alienArcadium.fastestRound30)
    : `Round ${zb?.alienArcadium.bestRound ?? 0}`;
  const BB = zb?.badBlood.fastestRound30
    ? formatTime(zb.badBlood.fastestRound30)
    : `Round ${zb?.badBlood.bestRound ?? 0}`;
  const P = zb?.prison.fastestRound30
    ? formatTime(zb.prison.fastestRound30)
    : `Round ${zb?.prison.bestRound ?? 0}`;

  return `/${channel} ${nametag}${player.nickname} W: ${formatNumber(zb.overall.wins)} K: ${formatNumber(zb.overall.zombieKills)} D: ${formatNumber(zb.overall.deaths)} DE: ${DE} AA: ${AA} BB: ${BB} P: ${P}`;
}

export async function getWarlordsStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const wl = player.stats.Warlords;
  const wlClass = wl.class.charAt(0).toUpperCase() + wl.class.slice(1);

  return `/${channel} [${wlClass}] ${nametag}${player.nickname} W: ${formatNumber(wl.wins)} WLR: ${formatNumber(wl.WLR)} K: ${formatNumber(wl.kills)} KDR: ${formatNumber(wl.KDR)}`;
}

export async function getReqs(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const reqs = await checkRequirements(player.uuid, player);

  if (reqs === 0) {
    return `/${channel} ${nametag}${player.nickname} does not meet requirements!`;
  }
  if (reqs === 1) {
    return `/${channel} ${nametag}${player.nickname} meets secondary requirements! (200k GEXP/week)`;
  }
  if (reqs === 2) {
    return `/${channel} ${nametag}${player.nickname} meets primary requirements! (65k GEXP/week)`;
  }

  return `/${channel} ${nametag}${player.nickname} requirements check failed!`;
}
