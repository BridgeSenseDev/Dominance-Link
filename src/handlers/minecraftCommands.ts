import type { Player } from "hypixel-api-reborn";
import { ZombiesMap } from "hypixel-api-reborn";
import config from "../config.json" with { type: "json" };
import { abbreviateNumber, formatNumber } from "../helper/clientUtils.ts";
import { checkRequirements } from "../helper/requirements.ts";
import { fetchSkyBlockStats, formatTime, timeAgo } from "../helper/utils.ts";
import { hypixel } from "../index.ts";
import { fetchGuildMember } from "./databaseHandler.ts";
import { chat } from "./workerHandler.ts";

export async function handleMinecraftCommands(
  channel: string,
  message: string,
  author: string,
) {
  if (author === config.minecraft.ign && message.includes("Commands: !h")) {
    return;
  }

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
      case "h":
      case "help": {
        chat(getHelpMessage(channel));
        break;
      }
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
      case "player": {
        chat(await getPlayerStats(channel, player));
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
      case "wg":
      case "woolgames": {
        chat(await getWoolGamesStats(channel, player));
        break;
      }
    }
  }
}

export function getBedwarsStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const bw = player.stats.BedWars;

  return `/${channel} [${Math.floor(bw.level)}✫] ${nametag}${player.nickname} FK: ${formatNumber(bw.finals.total.kills)} FKDR: ${formatNumber(bw.finals.total.ratio)} W: ${formatNumber(bw.wins)} WLR: ${formatNumber(bw.winLossRatio)} WS: ${formatNumber(bw.winstreak)}`;
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
  return `/${channel} ${nametag}${player.nickname} W: ${formatNumber(mm.wins)} K: ${formatNumber(mm.kills)} KDR: ${formatNumber(mm.kills / mm.deaths)}`;
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

export async function getPlayerStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const lastLogin = player.lastLoginAt ? timeAgo(player.lastLoginAt) : "N/A";
  const guildMember = fetchGuildMember(player.uuid);
  const playtime = guildMember?.playtime
    ? ` PT: ${formatNumber(guildMember.playtime / 3600)}h `
    : "";
  const response = await fetch(
    `https://api.polsu.xyz/polsu/ping?uuid=${player.uuid}`,
    {
      headers: {
        "Api-Key": config.keys.polsuApiKey,
      },
    },
  );
  const pingData = await response.json().catch(() => {
    return null;
  });
  const ping = pingData?.data?.stats?.avg
    ? `${pingData.data.stats.avg}ms`
    : "0ms";

  return `/${channel} [${Math.floor(player.level.level)}] ${nametag}${player.nickname}${playtime} Ping: ${ping} AP: ${formatNumber(player.achievements.points)} Karma: ${formatNumber(player.karma)} Reward Streak: ${formatNumber(player.rewards.rewardStreak)} Last Login: ${lastLogin}`;
}

export async function getZombiesStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const zb = player.stats.Arcade.zombies;

  const deadEndMap = new ZombiesMap(player.stats.Arcade, "deadend");
  const alienArcadiumMap = new ZombiesMap(player.stats.Arcade, "alienarcadium");
  const badBloodMap = new ZombiesMap(player.stats.Arcade, "badblood");
  const prisonMap = new ZombiesMap(player.stats.Arcade, "prison");

  const DE = deadEndMap.fastestTime30
    ? formatTime(deadEndMap.fastestTime30)
    : `Round ${deadEndMap.bestRoundZombies ?? 0}`;
  const AA = alienArcadiumMap.fastestTime30
    ? formatTime(alienArcadiumMap.fastestTime30)
    : `Round ${alienArcadiumMap.bestRoundZombies ?? 0}`;
  const BB = badBloodMap.fastestTime30
    ? formatTime(badBloodMap.fastestTime30)
    : `Round ${badBloodMap.bestRoundZombies ?? 0}`;
  const P = prisonMap.fastestTime30
    ? formatTime(prisonMap.fastestTime30)
    : `Round ${prisonMap.bestRoundZombies ?? 0}`;

  return `/${channel} ${nametag}${player.nickname} W: ${formatNumber(zb.wins)} K: ${formatNumber(zb.zombieKills)} KDR: ${formatNumber(zb.zombieKills / zb.deaths)} DE: ${DE} AA: ${AA} BB: ${BB} P: ${P}`;
}

export async function getWarlordsStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const wl = player.stats.Warlords;
  const wlClass = wl.class.charAt(0).toUpperCase() + wl.class.slice(1);

  return `/${channel} [${wlClass}] ${nametag}${player.nickname} W: ${formatNumber(wl.wins)} WLR: ${formatNumber(wl.WLR)} K: ${formatNumber(wl.kills)} KDR: ${formatNumber(wl.KDR)}`;
}

export async function getWoolGamesStats(channel: string, player: Player) {
  const nametag = player.rank ? `[${player.rank}] ` : "";
  const wg = player.stats.WoolGames;
  const wins = wg.captureTheWool.wins + wg.sheepWars.wins + wg.woolWars.wins;
  const losses =
    wg.captureTheWool.losses +
    wg.sheepWars.losses +
    wg.woolWars.gamesPlayed -
    wg.woolWars.wins;
  const kills =
    wg.captureTheWool.kills + wg.sheepWars.kills + wg.woolWars.kills;
  const deaths =
    wg.captureTheWool.deaths + wg.sheepWars.deaths + wg.woolWars.deaths;

  return `/${channel} [${wg.level}] ${nametag}${player.nickname} PT: ${formatNumber(wg.playtime / 3600)}h W: ${formatNumber(wins)} WLR: ${formatNumber(wins / losses)} K: ${formatNumber(kills)} KDR: ${formatNumber(kills / deaths)}`;
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

export function getHelpMessage(channel: string) {
  const commands = [
    "!h/help",
    "!p/player",
    "!bw/bedwars",
    "!sb/skyblock",
    "!d/duels",
    "!mm/murder",
    "!b/bridge",
    "!vz/vampirez",
    "!sw/skywars",
    "!z/zombies",
    "!wl/warlords",
    "!wg/woolgames",
    "!r/reqs",
  ];

  return `/${channel} Commands: ${commands.join(" ")}`;
}
