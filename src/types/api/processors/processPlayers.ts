import { RawPlayer } from '../raw/RawPlayer.js';
import { Player } from '../processed/Player.js';
import processDuels from './processDuels.js';
import { processSkywars } from './processSkywars.js';
import processBedwars from './processBedwars.js';
import { rankColor } from '../../../helper/constants.js';
import { removeSectionSymbols } from '../../../helper/utils.js';

export function rankTagF(player: RawPlayer) {
  if (!player) {
    return '';
  }
  if (player.rank) {
    return `[${player.rank}] ${player.displayname}`;
  }
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') {
    let monthlyPlusColor = rankColor[player.rankPlusColor!];
    if (!monthlyPlusColor) {
      monthlyPlusColor = '§c';
    }
    if (player.monthlyRankColor === 'GOLD') {
      return `§6[MVP${monthlyPlusColor}++§6] ${player.displayname}`;
    }
    if (player.monthlyRankColor === 'AQUA') {
      return `§b[MVP${monthlyPlusColor}++§b] ${player.displayname}`;
    }
  }
  if (player.newPackageRank === 'MVP_PLUS') {
    let monthlyPlusColor = rankColor[player.rankPlusColor!];
    if (!monthlyPlusColor) {
      monthlyPlusColor = '§c';
    }
    return `§b[MVP${monthlyPlusColor}+§b] ${player.displayname}`;
  }
  if (player.newPackageRank === 'MVP') {
    return `§b[MVP] ${player.displayname}`;
  }
  if (player.newPackageRank === 'VIP_PLUS') {
    return `§a[VIP§6+§a] ${player.displayname}`;
  }
  if (player.newPackageRank === 'VIP') {
    return `§a[VIP] ${player.displayname}`;
  }
  return `§7${player.displayname}`;
}

export function processPlayer(input: RawPlayer, statsToProcess: Array<'duels' | 'bedwars' | 'skywars'> = []): Player {
  const json: RawPlayer = input ?? {};
  const stats: any = {};
  statsToProcess.forEach((item) => {
    switch (item) {
      case 'duels':
        stats.Duels = processDuels(json.stats?.Duels == null ? {} : json.stats.Duels);
        break;
      case 'bedwars':
        stats.Bedwars = processBedwars(json.stats?.Bedwars == null ? {} : json.stats.Bedwars);
        break;
      case 'skywars':
        stats.Skywars = processSkywars(json.stats?.SkyWars == null ? {} : json.stats.SkyWars);
        break;
    }
  });

  return {
    exp: json.networkExp ?? 0,
    firstLogin: json.firstLogin ?? 0,
    giftsReceived: json.giftingMeta?.realBundlesReceived ?? 0,
    giftsSent: json.giftingMeta?.realBundlesGiven ?? 0,
    karma: json.karma ?? 0,
    lastLogin: json.lastLogin ?? 0,
    lastLogout: json.lastLogout ?? 0,
    level: +Number((Math.sqrt(2 * (json.networkExp ?? 0) + 30625) / 50 - 2.5) ** 2).toFixed(1),
    links: {
      DISCORD: json.socialMedia?.links?.DISCORD ?? '',
      TWITCH: json.socialMedia?.links?.TWITCH ?? '',
      TWITTER: json.socialMedia?.links?.TWITTER ?? '',
      YOUTUBE: json.socialMedia?.links?.YOUTUBE ?? '',
      INSTAGRAM: json.socialMedia?.links?.INSTAGRAM ?? '',
      HYPIXEL: json.socialMedia?.links?.HYPIXEL ?? ''
    },
    mcVersion: json.mcVersionRp ?? '',
    nameHistory: json.knownAliases ?? [],
    prefix: json.prefix ?? '',
    rank: json.rank ?? '',
    rankPlusColor: json.rankPlusColor ?? '',
    rankTag: removeSectionSymbols(rankTagF(input)),
    rankTagF: rankTagF(input),
    username: json.displayname ?? '',
    uuid: json.uuid ?? '',
    stats
  };
}
