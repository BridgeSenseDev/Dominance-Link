// eslint-disable-next-line import/extensions
import { StringObject } from '../types/global.d.js';

export const levelingXp = [
  50, 125, 200, 300, 500, 750, 1000, 1500, 2000, 3500, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000,
  200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000,
  1600000, 1700000, 1800000, 1900000, 2000000, 2100000, 2200000, 2300000, 2400000, 2500000, 2600000, 2750000, 2900000,
  3100000, 3400000, 3700000, 4000000, 4300000, 4600000, 4900000, 5200000, 5500000, 5800000, 6100000, 6400000, 6700000,
  7000000
];

export const rgbaColor: StringObject = {
  0: 'rgba(0,0,0,1)',
  1: 'rgba(0,0,170,1)',
  2: 'rgba(0,170,0,1)',
  3: 'rgba(0,170,170,1)',
  4: 'rgba(170,0,0,1)',
  5: 'rgba(170,0,170,1)',
  6: 'rgba(255,170,0,1)',
  7: 'rgba(170,170,170,1)',
  8: 'rgba(85,85,85,1)',
  9: 'rgba(85,85,255,1)',
  a: 'rgba(85,255,85,1)',
  b: 'rgba(85,255,255,1)',
  c: 'rgba(255,85,85,1)',
  d: 'rgba(255,85,255,1)',
  e: 'rgba(255,255,85,1)',
  f: 'rgba(255,255,255,1)',
  g: 'rgb(194, 206, 227)',
  h: 'rgb(161, 171, 189)',
  i: 'rgb(129, 137, 151)',
  j: 'rgb(117, 124, 138)'
};

export const rankColor: StringObject = {
  DARK_BLUE: '§1',
  DARK_AQUA: '§3',
  DARK_RED: '§4',
  BLACK: '§0',
  DARK_PURPLE: '§5',
  DARK_GREEN: '§2',
  GOLD: '§6',
  GRAY: '§7',
  DARK_GRAY: '§8',
  BLUE: '§9',
  GREEN: '§a',
  AQUA: '§b',
  RED: '§c',
  LIGHT_PURPLE: '§d',
  YELLOW: '§e',
  WHITE: '§f'
};

export const ranks: StringObject = {
  GUILDMASTER: '[GM]',
  Leader: '[Leader]',
  Staff: '[Staff]',
  Pro: '[Pro]',
  Active: '[Active]',
  Member: '[Member]'
};

export const roles: StringObject = {
  '[Staff]': '1005725104430395452',
  '[Pro]': '1031566725432492133',
  '[Active]': '950083054326677514',
  '[Member]': '1031926129822539786',
  notifications: '789800580314824744',
  polls: '1039191632207151104',
  qotd: '829991529857810452',
  events: '655711286755065856',
  bot_updates: '1039190833552961538',
  bedwars: '903995572392984576',
  duels: '903996109096103986',
  skyblock: '903996220551360642',
  skywars: '903996253589880832'
};
