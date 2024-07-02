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
  const division = duels?.division ? "" : `[${duels?.division}] `;
  const rankTag = player.rank === "Default" ? "" : `[${player.rank}] `;
  const wins = formatNumber(duels?.wins ?? 0);
  const wlr = formatNumber(duels?.WLRatio ?? 0);
  const cws = formatNumber(duels?.winstreak ?? 0);
  const bws = formatNumber(duels?.bestWinstreak ?? 0);

  return `/gc ${division}${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} CWS: ${cws} BWS: ${bws}`;
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
