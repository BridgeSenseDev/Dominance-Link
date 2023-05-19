import { RawBedwars } from '../raw/RawBedwars.js';
import { Bedwars } from '../processed/Bedwars.js';
import { findScore } from '../../../helper/utils.js';

const EASY_LEVELS = 4;
const EASY_LEVELS_XP = 7000;
const XP_PER_PRESTIGE = 96 * 5000 + EASY_LEVELS_XP;
const LEVELS_PER_PRESTIGE = 100;
const HIGHEST_PRESTIGE = 10;

function getStarRespectingPrestige(star: number): number {
  if (star > HIGHEST_PRESTIGE * LEVELS_PER_PRESTIGE) {
    return star - HIGHEST_PRESTIGE * LEVELS_PER_PRESTIGE;
  }
  return star % LEVELS_PER_PRESTIGE;
}

function getExpForStar(star: number): number {
  if (star === 0) return 0;
  const respectedLevel = getStarRespectingPrestige(star);
  if (respectedLevel > EASY_LEVELS) return 5000;
  switch (respectedLevel) {
    case 1:
      return 500;
    case 2:
      return 1000;
    case 3:
      return 2000;
    case 4:
      return 3500;
    default:
      return 5000;
  }
}

function getStarForExp(exp: number) {
  const prestiges = Math.floor(exp / XP_PER_PRESTIGE);
  let level = prestiges * LEVELS_PER_PRESTIGE;
  let expWithoutPrestiges = exp - prestiges * XP_PER_PRESTIGE;

  for (let i = 1; i <= EASY_LEVELS; ++i) {
    const expForEasyLevel = getExpForStar(i);
    if (expWithoutPrestiges < expForEasyLevel) {
      break;
    }
    level++;
    expWithoutPrestiges -= expForEasyLevel;
  }
  return level + Math.floor(expWithoutPrestiges / 5000);
}

export const getFormattedLevel = (star: number): string => {
  star = Math.floor(star);

  const prestigeColors: { req: number; fn: (n: number) => string }[] = [
    { req: 0, fn: (n) => `§7[${n}✫]` },
    { req: 100, fn: (n) => `§f[${n}✫]` },
    { req: 200, fn: (n) => `§6[${n}✫]` },
    { req: 300, fn: (n) => `§b[${n}✫]` },
    { req: 400, fn: (n) => `§2[${n}✫]` },
    { req: 500, fn: (n) => `§3[${n}✫]` },
    { req: 600, fn: (n) => `§4[${n}✫]` },
    { req: 700, fn: (n) => `§d[${n}✫]` },
    { req: 800, fn: (n) => `§9[${n}✫]` },
    { req: 900, fn: (n) => `§5[${n}✫]` },
    {
      req: 1000,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§c[§6${nums[0]}§e${nums[1]}§a${nums[2]}§b${nums[3]}§d✫§5]`;
      }
    },
    { req: 1100, fn: (n) => `§7[§f${n}§7✪]` },
    { req: 1200, fn: (n) => `§7[§e${n}§6✪§7]` },
    { req: 1300, fn: (n) => `§7[§b${n}§3✪§7]` },
    { req: 1400, fn: (n) => `§7[§a${n}§2✪§7]` },
    { req: 1500, fn: (n) => `§7[§3${n}§9✪§7]` },
    { req: 1600, fn: (n) => `§7[§c${n}§4✪§7]` },
    { req: 1700, fn: (n) => `§7[§d${n}§5✪§7]` },
    { req: 1800, fn: (n) => `§7[§9${n}§1✪§7]` },
    { req: 1900, fn: (n) => `§7[§5${n}§8✪§7]` },
    {
      req: 2000,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§8[§7${nums[0]}§f${nums[1]}${nums[2]}§7${nums[3]}§8✪]`;
      }
    },
    {
      req: 2100,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§f[${nums[0]}§e${nums[1]}${nums[2]}§6${nums[3]}§l⚝§r§6]`;
      }
    },
    {
      req: 2200,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§6[${nums[0]}§f${nums[1]}${nums[2]}§b${nums[3]}§3§l⚝§r§3]`;
      }
    },
    {
      req: 2300,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§5[${nums[0]}§d${nums[1]}${nums[2]}§6${nums[3]}§e§l⚝§r§e]`;
      }
    },
    {
      req: 2400,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§b[${nums[0]}§f${nums[1]}${nums[2]}§7${nums[3]}§l⚝§r§8]`;
      }
    },
    {
      req: 2500,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§f[${nums[0]}§a${nums[1]}${nums[2]}§2${nums[3]}§l⚝§r§2]`;
      }
    },
    {
      req: 2600,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§4[${nums[0]}§c${nums[1]}${nums[2]}§d${nums[3]}§l⚝§r§d]`;
      }
    },
    {
      req: 2700,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§e[${nums[0]}§f${nums[1]}${nums[2]}§8${nums[3]}§l⚝§r§8]`;
      }
    },
    {
      req: 2800,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§a[${nums[0]}§2${nums[1]}${nums[2]}§6${nums[3]}§l⚝§r§e]`;
      }
    },
    {
      req: 2900,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§b[${nums[0]}§3${nums[1]}${nums[2]}§9${nums[3]}§l⚝§r§1]`;
      }
    },
    {
      req: 3000,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§e[${nums[0]}§6${nums[1]}${nums[2]}§c${nums[3]}§l⚝§r§4]`;
      }
    },
    {
      req: 3100,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§9[${nums[0]}§2${nums[1]}${nums[2]}§6${nums[3]}§l✥§r§e]`;
      }
    },
    {
      req: 3200,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§c[§4${nums[0]}§7${nums[1]}${nums[2]}§4${nums[3]}§c§l✥§r§c]`;
      }
    },
    {
      req: 3300,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§9[${nums[0]}${nums[1]}§d${nums[2]}§c${nums[3]}§l✥§r§4]`;
      }
    },
    {
      req: 3400,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§2[§a${nums[0]}§d${nums[1]}${nums[2]}§5${nums[3]}§l✥§r§2]`;
      }
    },
    {
      req: 3500,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§c[${nums[0]}§4${nums[1]}${nums[2]}§2${nums[3]}§a§l✥§r§a]`;
      }
    },
    {
      req: 3600,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§a[${nums[0]}${nums[1]}§b${nums[2]}§9${nums[3]}§l✥§r§1]`;
      }
    },
    {
      req: 3700,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§4[${nums[0]}§c${nums[1]}${nums[2]}§b${nums[3]}§3§l✥§r§3]`;
      }
    },
    {
      req: 3800,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§1[${nums[0]}§9${nums[1]}§5${nums[2]}${nums[3]}§d§l✥§r§1]`;
      }
    },
    {
      req: 3900,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§c[${nums[0]}§a${nums[1]}${nums[2]}§3${nums[3]}§9§l✥§r§9]`;
      }
    },
    {
      req: 4000,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§5[${nums[0]}§c${nums[1]}${nums[2]}§6${nums[3]}§l✥§r§e]`;
      }
    },
    {
      req: 4100,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§e[${nums[0]}§6${nums[1]}§c${nums[2]}§d${nums[3]}§l✥§r§5]`;
      }
    },
    {
      req: 4200,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§1[§9${nums[0]}§3${nums[1]}§5${nums[2]}${nums[3]}§d§l✥§r§1]`;
      }
    },
    {
      req: 4300,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§0[§5${nums[0]}§8${nums[1]}${nums[2]}§5${nums[3]}§l✥§r§0]`;
      }
    },
    {
      req: 4400,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§2[${nums[0]}§a${nums[1]}§e${nums[2]}§6${nums[3]}§5§l✥§r§d]`;
      }
    },
    {
      req: 4500,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§f[${nums[0]}§b${nums[1]}${nums[2]}§2${nums[3]}§l✥§r§2]`;
      }
    },
    {
      req: 4600,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§2[§b${nums[0]}§e${nums[1]}${nums[2]}§6${nums[3]}§d§l✥§r§5]`;
      }
    },
    {
      req: 4700,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§f[§4${nums[0]}§c${nums[1]}${nums[2]}§9${nums[3]}§1§l✥§r§9]`;
      }
    },
    {
      req: 4800,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§5[${nums[0]}§c${nums[1]}§6${nums[2]}§e${nums[3]}§b§l✥§r§3]`;
      }
    },
    {
      req: 4900,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§2[§a${nums[0]}§f${nums[1]}${nums[2]}§a${nums[3]}§l✥§r§2]`;
      }
    },
    {
      req: 5000,
      fn: (n) => {
        const nums = [...n.toString()];
        return `§4[${nums[0]}§5${nums[1]}§9${nums[2]}${nums[3]}§1§l✥§r§0]`;
      }
    }
  ];

  return findScore(prestigeColors, star).fn(star);
};

export default function processBedwars(json: RawBedwars): Bedwars {
  return {
    xp: json.Experience ?? 0,
    coins: json.coins ?? 0,
    star: getStarForExp(json.Experience ?? 0),
    starFormatted: getFormattedLevel(getStarForExp(json.Experience ?? 0)),
    overall: {
      games: json.games_played_bedwars ?? 0,
      winstreak: json.winstreak ?? 0,
      wins: json.wins_bedwars ?? 0,
      losses: json.losses_bedwars ?? 0,
      wlr: (json.wins_bedwars || 0) / (json.losses_bedwars || 1),
      finalKills: json.final_kills_bedwars ?? 0,
      finalDeaths: json.final_deaths_bedwars ?? 0,
      fkdr: (json.final_kills_bedwars || 0) / (json.final_deaths_bedwars || 1),
      kills: json.kills_bedwars ?? 0,
      deaths: json.deaths_bedwars ?? 0,
      kdr: (json.kills_bedwars || 0) / (json.deaths_bedwars || 1),
      bedsBroken: json.beds_broken_bedwars ?? 0,
      bedsLost: json.beds_lost_bedwars ?? 0,
      bblr: (json.beds_broken_bedwars || 0) / (json.beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.iron_resources_collected_bedwars ?? 0,
        gold: json.gold_resources_collected_bedwars ?? 0,
        diamond: json.diamond_resources_collected_bedwars ?? 0,
        emerald: json.emerald_resources_collected_bedwars ?? 0
      }
    },
    '4v4': {
      games: json.two_four_games_played_bedwars ?? 0,
      winstreak: json.two_four_winstreak ?? 0,
      wins: json.two_four_wins_bedwars ?? 0,
      losses: json.two_four_losses_bedwars ?? 0,
      wlr: (json.two_four_wins_bedwars || 0) / (json.two_four_losses_bedwars || 1),
      finalKills: json.two_four_final_kills_bedwars ?? 0,
      finalDeaths: json.two_four_final_deaths_bedwars ?? 0,
      fkdr: (json.two_four_final_kills_bedwars || 0) / (json.two_four_final_deaths_bedwars || 1),
      kills: json.two_four_kills_bedwars ?? 0,
      deaths: json.two_four_deaths_bedwars ?? 0,
      kdr: (json.two_four_kills_bedwars || 0) / (json.two_four_deaths_bedwars || 1),
      bedsBroken: json.two_four_beds_broken_bedwars ?? 0,
      bedsLost: json.two_four_beds_lost_bedwars ?? 0,
      bblr: (json.two_four_beds_broken_bedwars || 0) / (json.two_four_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.two_four_iron_resources_collected_bedwars ?? 0,
        gold: json.two_four_gold_resources_collected_bedwars ?? 0,
        diamond: json.two_four_diamond_resources_collected_bedwars ?? 0,
        emerald: json.two_four_emerald_resources_collected_bedwars ?? 0
      }
    },
    armedDoubles: {
      games: json.eight_two_armed_games_played_bedwars ?? 0,
      winstreak: json.eight_two_armed_winstreak ?? 0,
      wins: json.eight_two_armed_wins_bedwars ?? 0,
      losses: json.eight_two_armed_losses_bedwars ?? 0,
      wlr: (json.eight_two_armed_wins_bedwars || 0) / (json.eight_two_armed_losses_bedwars || 1),
      finalKills: json.eight_two_armed_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_two_armed_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_two_armed_final_kills_bedwars || 0) / (json.eight_two_armed_final_deaths_bedwars || 1),
      kills: json.eight_two_armed_kills_bedwars ?? 0,
      deaths: json.eight_two_armed_deaths_bedwars ?? 0,
      kdr: (json.eight_two_armed_kills_bedwars || 0) / (json.eight_two_armed_deaths_bedwars || 1),
      bedsBroken: json.eight_two_armed_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_two_armed_beds_lost_bedwars ?? 0,
      bblr: (json.eight_two_armed_beds_broken_bedwars || 0) / (json.eight_two_armed_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_two_armed_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_two_armed_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_two_armed_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_two_armed_emerald_resources_collected_bedwars ?? 0
      }
    },
    armedFours: {
      games: json.four_four_armed_games_played_bedwars ?? 0,
      winstreak: json.four_four_armed_winstreak ?? 0,
      wins: json.four_four_armed_wins_bedwars ?? 0,
      losses: json.four_four_armed_losses_bedwars ?? 0,
      wlr: (json.four_four_armed_wins_bedwars || 0) / (json.four_four_armed_losses_bedwars || 1),
      finalKills: json.four_four_armed_final_kills_bedwars ?? 0,
      finalDeaths: json.four_four_armed_final_deaths_bedwars ?? 0,
      fkdr: (json.four_four_armed_final_kills_bedwars || 0) / (json.four_four_armed_final_deaths_bedwars || 1),
      kills: json.four_four_armed_kills_bedwars ?? 0,
      deaths: json.four_four_armed_deaths_bedwars ?? 0,
      kdr: (json.four_four_armed_kills_bedwars || 0) / (json.four_four_armed_deaths_bedwars || 1),
      bedsBroken: json.four_four_armed_beds_broken_bedwars ?? 0,
      bedsLost: json.four_four_armed_beds_lost_bedwars ?? 0,
      bblr: (json.four_four_armed_beds_broken_bedwars || 0) / (json.four_four_armed_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.four_four_armed_iron_resources_collected_bedwars ?? 0,
        gold: json.four_four_armed_gold_resources_collected_bedwars ?? 0,
        diamond: json.four_four_armed_diamond_resources_collected_bedwars ?? 0,
        emerald: json.four_four_armed_emerald_resources_collected_bedwars ?? 0
      }
    },
    castle: {
      games: json.castle_games_played_bedwars ?? 0,
      winstreak: json.castle_winstreak ?? 0,
      wins: json.castle_wins_bedwars ?? 0,
      losses: json.castle_losses_bedwars ?? 0,
      wlr: (json.castle_wins_bedwars || 0) / (json.castle_losses_bedwars || 1),
      finalKills: json.castle_final_kills_bedwars ?? 0,
      finalDeaths: json.castle_final_deaths_bedwars ?? 0,
      fkdr: (json.castle_final_kills_bedwars || 0) / (json.castle_final_deaths_bedwars || 1),
      kills: json.castle_kills_bedwars ?? 0,
      deaths: json.castle_deaths_bedwars ?? 0,
      kdr: (json.castle_kills_bedwars || 0) / (json.castle_deaths_bedwars || 1),
      bedsBroken: json.castle_beds_broken_bedwars ?? 0,
      bedsLost: json.castle_beds_lost_bedwars ?? 0,
      bblr: (json.castle_beds_broken_bedwars || 0) / (json.castle_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.castle_iron_resources_collected_bedwars ?? 0,
        gold: json.castle_gold_resources_collected_bedwars ?? 0,
        diamond: json.castle_diamond_resources_collected_bedwars ?? 0,
        emerald: json.castle_emerald_resources_collected_bedwars ?? 0
      }
    },
    doubles: {
      games: json.eight_two_games_played_bedwars ?? 0,
      winstreak: json.eight_two_winstreak ?? 0,
      wins: json.eight_two_wins_bedwars ?? 0,
      losses: json.eight_two_losses_bedwars ?? 0,
      wlr: (json.eight_two_wins_bedwars || 0) / (json.eight_two_losses_bedwars || 1),
      finalKills: json.eight_two_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_two_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_two_final_kills_bedwars || 0) / (json.eight_two_final_deaths_bedwars || 1),
      kills: json.eight_two_kills_bedwars ?? 0,
      deaths: json.eight_two_deaths_bedwars ?? 0,
      kdr: (json.eight_two_kills_bedwars || 0) / (json.eight_two_deaths_bedwars || 1),
      bedsBroken: json.eight_two_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_two_beds_lost_bedwars ?? 0,
      bblr: (json.eight_two_beds_broken_bedwars || 0) / (json.eight_two_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_two_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_two_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_two_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_two_emerald_resources_collected_bedwars ?? 0
      }
    },
    fours: {
      games: json.four_four_games_played_bedwars ?? 0,
      winstreak: json.four_four_winstreak ?? 0,
      wins: json.four_four_wins_bedwars ?? 0,
      losses: json.four_four_losses_bedwars ?? 0,
      wlr: (json.four_four_wins_bedwars || 0) / (json.four_four_losses_bedwars || 1),
      finalKills: json.four_four_final_kills_bedwars ?? 0,
      finalDeaths: json.four_four_final_deaths_bedwars ?? 0,
      fkdr: (json.four_four_final_kills_bedwars || 0) / (json.four_four_final_deaths_bedwars || 1),
      kills: json.four_four_kills_bedwars ?? 0,
      deaths: json.four_four_deaths_bedwars ?? 0,
      kdr: (json.four_four_kills_bedwars || 0) / (json.four_four_deaths_bedwars || 1),
      bedsBroken: json.four_four_beds_broken_bedwars ?? 0,
      bedsLost: json.four_four_beds_lost_bedwars ?? 0,
      bblr: (json.four_four_beds_broken_bedwars || 0) / (json.four_four_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.four_four_iron_resources_collected_bedwars ?? 0,
        gold: json.four_four_gold_resources_collected_bedwars ?? 0,
        diamond: json.four_four_diamond_resources_collected_bedwars ?? 0,
        emerald: json.four_four_emerald_resources_collected_bedwars ?? 0
      }
    },
    luckyDoubles: {
      games: json.eight_two_lucky_games_played_bedwars ?? 0,
      winstreak: json.eight_two_lucky_winstreak ?? 0,
      wins: json.eight_two_lucky_wins_bedwars ?? 0,
      losses: json.eight_two_lucky_losses_bedwars ?? 0,
      wlr: (json.eight_two_lucky_wins_bedwars || 0) / (json.eight_two_lucky_losses_bedwars || 1),
      finalKills: json.eight_two_lucky_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_two_lucky_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_two_lucky_final_kills_bedwars || 0) / (json.eight_two_lucky_final_deaths_bedwars || 1),
      kills: json.eight_two_lucky_kills_bedwars ?? 0,
      deaths: json.eight_two_lucky_deaths_bedwars ?? 0,
      kdr: (json.eight_two_lucky_kills_bedwars || 0) / (json.eight_two_lucky_deaths_bedwars || 1),
      bedsBroken: json.eight_two_lucky_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_two_lucky_beds_lost_bedwars ?? 0,
      bblr: (json.eight_two_lucky_beds_broken_bedwars || 0) / (json.eight_two_lucky_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_two_lucky_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_two_lucky_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_two_lucky_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_two_lucky_emerald_resources_collected_bedwars ?? 0
      }
    },
    luckyFours: {
      games: json.four_four_lucky_games_played_bedwars ?? 0,
      winstreak: json.four_four_lucky_winstreak ?? 0,
      wins: json.four_four_lucky_wins_bedwars ?? 0,
      losses: json.four_four_lucky_losses_bedwars ?? 0,
      wlr: (json.four_four_lucky_wins_bedwars || 0) / (json.four_four_lucky_losses_bedwars || 1),
      finalKills: json.four_four_lucky_final_kills_bedwars ?? 0,
      finalDeaths: json.four_four_lucky_final_deaths_bedwars ?? 0,
      fkdr: (json.four_four_lucky_final_kills_bedwars || 0) / (json.four_four_lucky_final_deaths_bedwars || 1),
      kills: json.four_four_lucky_kills_bedwars ?? 0,
      deaths: json.four_four_lucky_deaths_bedwars ?? 0,
      kdr: (json.four_four_lucky_kills_bedwars || 0) / (json.four_four_lucky_deaths_bedwars || 1),
      bedsBroken: json.four_four_lucky_beds_broken_bedwars ?? 0,
      bedsLost: json.four_four_lucky_beds_lost_bedwars ?? 0,
      bblr: (json.four_four_lucky_beds_broken_bedwars || 0) / (json.four_four_lucky_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.four_four_lucky_iron_resources_collected_bedwars ?? 0,
        gold: json.four_four_lucky_gold_resources_collected_bedwars ?? 0,
        diamond: json.four_four_lucky_diamond_resources_collected_bedwars ?? 0,
        emerald: json.four_four_lucky_emerald_resources_collected_bedwars ?? 0
      }
    },
    rushDoubles: {
      games: json.eight_two_rush_games_played_bedwars ?? 0,
      winstreak: json.eight_two_rush_winstreak ?? 0,
      wins: json.eight_two_rush_wins_bedwars ?? 0,
      losses: json.eight_two_rush_losses_bedwars ?? 0,
      wlr: (json.eight_two_rush_wins_bedwars || 0) / (json.eight_two_rush_losses_bedwars || 1),
      finalKills: json.eight_two_rush_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_two_rush_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_two_rush_final_kills_bedwars || 0) / (json.eight_two_rush_final_deaths_bedwars || 1),
      kills: json.eight_two_rush_kills_bedwars ?? 0,
      deaths: json.eight_two_rush_deaths_bedwars ?? 0,
      kdr: (json.eight_two_rush_kills_bedwars || 0) / (json.eight_two_rush_deaths_bedwars || 1),
      bedsBroken: json.eight_two_rush_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_two_rush_beds_lost_bedwars ?? 0,
      bblr: (json.eight_two_rush_beds_broken_bedwars || 0) / (json.eight_two_rush_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_two_rush_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_two_rush_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_two_rush_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_two_rush_emerald_resources_collected_bedwars ?? 0
      }
    },
    rushFours: {
      games: json.four_four_rush_games_played_bedwars ?? 0,
      winstreak: json.four_four_rush_winstreak ?? 0,
      wins: json.four_four_rush_wins_bedwars ?? 0,
      losses: json.four_four_rush_losses_bedwars ?? 0,
      wlr: (json.four_four_rush_wins_bedwars || 0) / (json.four_four_rush_losses_bedwars || 1),
      finalKills: json.four_four_rush_final_kills_bedwars ?? 0,
      finalDeaths: json.four_four_rush_final_deaths_bedwars ?? 0,
      fkdr: (json.four_four_rush_final_kills_bedwars || 0) / (json.four_four_rush_final_deaths_bedwars || 1),
      kills: json.four_four_rush_kills_bedwars ?? 0,
      deaths: json.four_four_rush_deaths_bedwars ?? 0,
      kdr: (json.four_four_rush_kills_bedwars || 0) / (json.four_four_rush_deaths_bedwars || 1),
      bedsBroken: json.four_four_rush_beds_broken_bedwars ?? 0,
      bedsLost: json.four_four_rush_beds_lost_bedwars ?? 0,
      bblr: (json.four_four_rush_beds_broken_bedwars || 0) / (json.four_four_rush_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.four_four_rush_iron_resources_collected_bedwars ?? 0,
        gold: json.four_four_rush_gold_resources_collected_bedwars ?? 0,
        diamond: json.four_four_rush_diamond_resources_collected_bedwars ?? 0,
        emerald: json.four_four_rush_emerald_resources_collected_bedwars ?? 0
      }
    },
    rushSolo: {
      games: json.eight_one_rush_games_played_bedwars ?? 0,
      winstreak: json.eight_one_rush_winstreak ?? 0,
      wins: json.eight_one_rush_wins_bedwars ?? 0,
      losses: json.eight_one_rush_losses_bedwars ?? 0,
      wlr: (json.eight_one_rush_wins_bedwars || 0) / (json.eight_one_rush_losses_bedwars || 1),
      finalKills: json.eight_one_rush_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_one_rush_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_one_rush_final_kills_bedwars || 0) / (json.eight_one_rush_final_deaths_bedwars || 1),
      kills: json.eight_one_rush_kills_bedwars ?? 0,
      deaths: json.eight_one_rush_deaths_bedwars ?? 0,
      kdr: (json.eight_one_rush_kills_bedwars || 0) / (json.eight_one_rush_deaths_bedwars || 1),
      bedsBroken: json.eight_one_rush_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_one_rush_beds_lost_bedwars ?? 0,
      bblr: (json.eight_one_rush_beds_broken_bedwars || 0) / (json.eight_one_rush_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_one_rush_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_one_rush_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_one_rush_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_one_rush_emerald_resources_collected_bedwars ?? 0
      }
    },
    solo: {
      games: json.eight_one_games_played_bedwars ?? 0,
      winstreak: json.eight_one_winstreak ?? 0,
      wins: json.eight_one_wins_bedwars ?? 0,
      losses: json.eight_one_losses_bedwars ?? 0,
      wlr: (json.eight_one_wins_bedwars || 0) / (json.eight_one_losses_bedwars || 1),
      finalKills: json.eight_one_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_one_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_one_final_kills_bedwars || 0) / (json.eight_one_final_deaths_bedwars || 1),
      kills: json.eight_one_kills_bedwars ?? 0,
      deaths: json.eight_one_deaths_bedwars ?? 0,
      kdr: (json.eight_one_kills_bedwars || 0) / (json.eight_one_deaths_bedwars || 1),
      bedsBroken: json.eight_one_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_one_beds_lost_bedwars ?? 0,
      bblr: (json.eight_one_beds_broken_bedwars || 0) / (json.eight_one_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_one_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_one_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_one_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_one_emerald_resources_collected_bedwars ?? 0
      }
    },
    threes: {
      games: json.four_three_games_played_bedwars ?? 0,
      winstreak: json.four_three_winstreak ?? 0,
      wins: json.four_three_wins_bedwars ?? 0,
      losses: json.four_three_losses_bedwars ?? 0,
      wlr: (json.four_three_wins_bedwars || 0) / (json.four_three_losses_bedwars || 1),
      finalKills: json.four_three_final_kills_bedwars ?? 0,
      finalDeaths: json.four_three_final_deaths_bedwars ?? 0,
      fkdr: (json.four_three_final_kills_bedwars || 0) / (json.four_three_final_deaths_bedwars || 1),
      kills: json.four_three_kills_bedwars ?? 0,
      deaths: json.four_three_deaths_bedwars ?? 0,
      kdr: (json.four_three_kills_bedwars || 0) / (json.four_three_deaths_bedwars || 1),
      bedsBroken: json.four_three_beds_broken_bedwars ?? 0,
      bedsLost: json.four_three_beds_lost_bedwars ?? 0,
      bblr: (json.four_three_beds_broken_bedwars || 0) / (json.four_three_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.four_three_iron_resources_collected_bedwars ?? 0,
        gold: json.four_three_gold_resources_collected_bedwars ?? 0,
        diamond: json.four_three_diamond_resources_collected_bedwars ?? 0,
        emerald: json.four_three_emerald_resources_collected_bedwars ?? 0
      }
    },
    ultimateDoubles: {
      games: json.eight_two_ultimate_games_played_bedwars ?? 0,
      winstreak: json.eight_two_ultimate_winstreak ?? 0,
      wins: json.eight_two_ultimate_wins_bedwars ?? 0,
      losses: json.eight_two_ultimate_losses_bedwars ?? 0,
      wlr: (json.eight_two_ultimate_wins_bedwars || 0) / (json.eight_two_ultimate_losses_bedwars || 1),
      finalKills: json.eight_two_ultimate_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_two_ultimate_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_two_ultimate_final_kills_bedwars || 0) / (json.eight_two_ultimate_final_deaths_bedwars || 1),
      kills: json.eight_two_ultimate_kills_bedwars ?? 0,
      deaths: json.eight_two_ultimate_deaths_bedwars ?? 0,
      kdr: (json.eight_two_ultimate_kills_bedwars || 0) / (json.eight_two_ultimate_deaths_bedwars || 1),
      bedsBroken: json.eight_two_ultimate_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_two_ultimate_beds_lost_bedwars ?? 0,
      bblr: (json.eight_two_ultimate_beds_broken_bedwars || 0) / (json.eight_two_ultimate_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_two_ultimate_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_two_ultimate_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_two_ultimate_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_two_ultimate_emerald_resources_collected_bedwars ?? 0
      }
    },
    ultimateFours: {
      games: json.four_four_ultimate_games_played_bedwars ?? 0,
      winstreak: json.four_four_ultimate_winstreak ?? 0,
      wins: json.four_four_ultimate_wins_bedwars ?? 0,
      losses: json.four_four_ultimate_losses_bedwars ?? 0,
      wlr: (json.four_four_ultimate_wins_bedwars || 0) / (json.four_four_ultimate_losses_bedwars || 1),
      finalKills: json.four_four_ultimate_final_kills_bedwars ?? 0,
      finalDeaths: json.four_four_ultimate_final_deaths_bedwars ?? 0,
      fkdr: (json.four_four_ultimate_final_kills_bedwars || 0) / (json.four_four_ultimate_final_deaths_bedwars || 1),
      kills: json.four_four_ultimate_kills_bedwars ?? 0,
      deaths: json.four_four_ultimate_deaths_bedwars ?? 0,
      kdr: (json.four_four_ultimate_kills_bedwars || 0) / (json.four_four_ultimate_deaths_bedwars || 1),
      bedsBroken: json.four_four_ultimate_beds_broken_bedwars ?? 0,
      bedsLost: json.four_four_ultimate_beds_lost_bedwars ?? 0,
      bblr: (json.four_four_ultimate_beds_broken_bedwars || 0) / (json.four_four_ultimate_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.four_four_ultimate_iron_resources_collected_bedwars ?? 0,
        gold: json.four_four_ultimate_gold_resources_collected_bedwars ?? 0,
        diamond: json.four_four_ultimate_diamond_resources_collected_bedwars ?? 0,
        emerald: json.four_four_ultimate_emerald_resources_collected_bedwars ?? 0
      }
    },
    ultimateSolo: {
      games: json.eight_one_ultimate_games_played_bedwars ?? 0,
      winstreak: json.eight_one_ultimate_winstreak ?? 0,
      wins: (json as any).eight_one_ultimate_wins ?? 0,
      losses: json.eight_one_ultimate_losses_bedwars ?? 0,
      wlr: (json as any).eight_one_ultimate_wins_bedwars / (json as any).eight_one_ultimate_losses_bedwars ?? 0,
      finalKills: json.eight_one_ultimate_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_one_ultimate_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_one_ultimate_final_kills_bedwars || 0) / (json.eight_one_ultimate_final_deaths_bedwars || 1),
      kills: json.eight_one_ultimate_kills_bedwars ?? 0,
      deaths: json.eight_one_ultimate_deaths_bedwars ?? 0,
      kdr: (json.eight_one_ultimate_kills_bedwars || 0) / (json.eight_one_ultimate_deaths_bedwars || 1),
      bedsBroken: json.eight_one_ultimate_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_one_ultimate_beds_lost_bedwars ?? 0,
      bblr: (json.eight_one_ultimate_beds_broken_bedwars || 0) / (json.eight_one_ultimate_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_one_ultimate_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_one_ultimate_gold_resources_collected_bedwars ?? 0,
        diamond: (json as any).eight_one_ultimate_diamond_resources_collected_bedwars ?? 0,
        emerald: (json as any).eight_one_ultimate_emerald_resources_collected_bedwars ?? 0
      }
    },
    voidlessDoubles: {
      games: json.eight_two_voidless_games_played_bedwars ?? 0,
      winstreak: json.eight_two_voidless_winstreak ?? 0,
      wins: json.eight_two_voidless_wins_bedwars ?? 0,
      losses: json.eight_two_voidless_losses_bedwars ?? 0,
      wlr: (json.eight_two_voidless_wins_bedwars || 0) / (json.eight_two_voidless_losses_bedwars || 1),
      finalKills: json.eight_two_voidless_final_kills_bedwars ?? 0,
      finalDeaths: json.eight_two_voidless_final_deaths_bedwars ?? 0,
      fkdr: (json.eight_two_voidless_final_kills_bedwars || 0) / (json.eight_two_voidless_final_deaths_bedwars || 1),
      kills: json.eight_two_voidless_kills_bedwars ?? 0,
      deaths: json.eight_two_voidless_deaths_bedwars ?? 0,
      kdr: (json.eight_two_voidless_kills_bedwars || 0) / (json.eight_two_voidless_deaths_bedwars || 1),
      bedsBroken: json.eight_two_voidless_beds_broken_bedwars ?? 0,
      bedsLost: json.eight_two_voidless_beds_lost_bedwars ?? 0,
      bblr: (json.eight_two_voidless_beds_broken_bedwars || 0) / (json.eight_two_voidless_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.eight_two_voidless_iron_resources_collected_bedwars ?? 0,
        gold: json.eight_two_voidless_gold_resources_collected_bedwars ?? 0,
        diamond: json.eight_two_voidless_diamond_resources_collected_bedwars ?? 0,
        emerald: json.eight_two_voidless_emerald_resources_collected_bedwars ?? 0
      }
    },
    voidlessFours: {
      games: json.four_four_voidless_games_played_bedwars ?? 0,
      winstreak: json.four_four_voidless_winstreak ?? 0,
      wins: json.four_four_voidless_wins_bedwars ?? 0,
      losses: json.four_four_voidless_losses_bedwars ?? 0,
      wlr: (json.four_four_voidless_wins_bedwars || 0) / (json.four_four_voidless_losses_bedwars || 1),
      finalKills: json.four_four_voidless_final_kills_bedwars ?? 0,
      finalDeaths: json.four_four_voidless_final_deaths_bedwars ?? 0,
      fkdr: (json.four_four_voidless_final_kills_bedwars || 0) / (json.four_four_voidless_final_deaths_bedwars || 1),
      kills: json.four_four_voidless_kills_bedwars ?? 0,
      deaths: json.four_four_voidless_deaths_bedwars ?? 0,
      kdr: (json.four_four_voidless_kills_bedwars || 0) / (json.four_four_voidless_deaths_bedwars || 1),
      bedsBroken: json.four_four_voidless_beds_broken_bedwars ?? 0,
      bedsLost: json.four_four_voidless_beds_lost_bedwars ?? 0,
      bblr: (json.four_four_voidless_beds_broken_bedwars || 0) / (json.four_four_voidless_beds_lost_bedwars || 1),
      itemsCollected: {
        iron: json.four_four_voidless_iron_resources_collected_bedwars ?? 0,
        gold: json.four_four_voidless_gold_resources_collected_bedwars ?? 0,
        diamond: json.four_four_voidless_diamond_resources_collected_bedwars ?? 0,
        emerald: json.four_four_voidless_emerald_resources_collected_bedwars ?? 0
      }
    }
  };
}
