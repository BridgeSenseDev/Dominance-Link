import type { Player, SkyblockMember } from "hypixel-api-reborn";
import { abbreviateNumber, formatNumber } from "../helper/clientUtils.ts";
import { hypixel } from "../index.ts";
import { chat } from "./workerHandler.ts";

export async function handleMinecraftCommands(message: string, author: string) {
  const command = /!(\w+)/.exec(message)?.[1];
  if (command) {
    let ign = /!\w+\s+(\S+)/.exec(message)?.[1];
    if (!ign) {
      ign = author;
    }

    const player = await hypixel.getPlayer(ign).catch(async (e) => {
      chat(`/gc Error: ${e}`);
    });
    if (!player) return;

    switch (command) {
      case "bw":
      case "bedwars": {
        chat(getBedwarsStats(player));
        break;
      }
      case "d":
      case "duels": {
        chat(getDuelsStats(player));
        break;
      }
      case "mm":
      case "murder": {
        chat(getMurderMysteryStats(player));
        break;
      }
      case "b":
      case "bridge": {
        chat(getBridgeStats(player));
        break;
      }
      case "vz":
      case "vampirez": {
        chat(getVampStats(player));
        break;
      }
      case "sw":
      case "skywars": {
        chat(getSkyWarsStats(player));
        break;
      }
      case "sb":
      case "skyblock": {
        chat(await getSkyblockStats(player));
      }
    }
  }
}

export function getBedwarsStats(player: Player) {
  const bedwars = player.stats?.bedwars;
  const star = bedwars?.level ?? 0;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const fk = formatNumber(bedwars?.finalKills ?? 0);
  const fkdr = formatNumber(bedwars?.finalKDRatio ?? 0);
  const wins = formatNumber(bedwars?.wins ?? 0);
  const wlr = formatNumber(bedwars?.WLRatio ?? 0);
  const ws = formatNumber(bedwars?.winstreak ?? 0);

  return `/gc [${star}✫] ${rankTag}${player.nickname} FK: ${fk} FKDR: ${fkdr} W: ${wins} WLR: ${wlr} WS: ${ws}`;
}

export function getDuelsStats(player: Player) {
  const duels = player.stats?.duels;
  const division = duels?.division ? `[${duels?.division}] ` : "";
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(duels?.wins ?? 0);
  const wlr = formatNumber(duels?.WLRatio ?? 0);
  const cws = formatNumber(duels?.winstreak ?? 0);
  const bws = formatNumber(duels?.bestWinstreak ?? 0);

  return `/gc ${division}${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} CWS: ${cws} BWS: ${bws}`;
}

export function getMurderMysteryStats(player: Player) {
  const murderMystery = player.stats?.murdermystery;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = murderMystery?.wins ?? 0;
  const kills = murderMystery?.kills ?? 0;
  const kdr = formatNumber(
    (murderMystery?.kills ?? 0) / (murderMystery?.deaths ?? 0),
  );

  return `/gc ${rankTag}${player.nickname} W: ${wins} K: ${kills} KDR: ${kdr}`;
}

export function getBridgeStats(player: Player) {
  const bridge = player.stats?.duels?.bridge.overall;
  const division = bridge?.division ? `[${bridge?.division}] ` : "";
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(bridge?.wins ?? 0);
  const wlr = formatNumber(bridge?.WLRatio ?? 0);
  const goals = formatNumber(bridge?.goals ?? 0);
  const cws = formatNumber(bridge?.winstreak ?? 0);
  const bws = formatNumber(bridge?.bestWinstreak ?? 0);

  return `/gc ${division}${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} G: ${goals} CWS: ${cws} BWS: ${bws}`;
}

export function getVampStats(player: Player) {
  const vamp = player.stats?.vampirez;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const humanWins = formatNumber(vamp?.human.wins ?? 0);
  const humanKills = formatNumber(vamp?.vampire.kills ?? 0);
  const humanKdr = formatNumber(
    (vamp?.vampire.kills ?? 0) / (vamp?.human.deaths ?? 0),
  );

  return `/gc ${rankTag}${player.nickname} HW: ${humanWins} HK: ${humanKills} HKDR: ${humanKdr}`;
}

export function getSkyWarsStats(player: Player) {
  const skywars = player.stats?.skywars;
  const level = skywars?.levelFormatted ?? "1⋆";
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(skywars?.wins ?? 0);
  const wlr = formatNumber(skywars?.WLRatio ?? 0);
  const kills = formatNumber(skywars?.kills ?? 0);
  const kdr = formatNumber((skywars?.kills ?? 0) / (skywars?.deaths ?? 0));

  return `/gc [${level}] ${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} K: ${kills} KDR: ${kdr}`;
}

export async function getSkyblockStats(player: Player) {
  let sbMember: SkyblockMember | undefined;
  try {
    sbMember = (
      await hypixel.getSkyblockProfiles(player.uuid).catch(() => null)
    )?.find((profile) => profile.selected)?.me;
  } catch (e) {
    return `/gc Error: ${e}`;
  }

  if (sbMember) {
    const { networth } = (await sbMember.getNetworth()) ?? 0;
    const sbSkillAverage = sbMember.skills.average;
    const sbLevel = sbMember.level;
    const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;

    return `/gc [${Math.floor(sbLevel)}] ${rankTag}${
      player.nickname
    } NW: ${abbreviateNumber(networth)} SA: ${formatNumber(sbSkillAverage)}`;
  }
  return `/gc Error: No profiles found for ${player.nickname}`;
}
