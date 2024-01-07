import { StringObject } from '../types/global.d.js';
import config from '../config.json' assert { type: 'json' };

export const duelsDivisions = [
  { name: 'Rookie', key: 'rookie' },
  { name: 'Iron', key: 'iron' },
  { name: 'Gold', key: 'gold' },
  { name: 'Diamond', key: 'diamond' },
  { name: 'Master', key: 'master' },
  { name: 'Legend', key: 'legend' },
  { name: 'Grandmaster', key: 'grandmaster' },
  { name: 'Supreme', key: 'supreme' },
  { name: 'WORLD ELITE', key: 'world_elite' },
  { name: 'WORLD MASTER', key: 'world_master' },
  { name: "WORLD'S BEST", key: 'worlds_best' }
];

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

export const hypixelRoles = {
  goat: { name: 'Goat', gexp: 600000, days: 1000 },
  dominator: { name: 'Dominator', gexp: 400000, days: 600 },
  supreme: { name: 'Supreme', gexp: 250000, days: 300 },
  hero: { name: 'Hero', gexp: 175000, days: 100 },
  elite: { name: 'Elite', gexp: 125000, days: 50 }
} as const;

export const discordRoles = {
  owner: '1066802933687132190',
  headStaff: '1038567890158354563',
  seniorStaff: '844591760294281226',
  developer: '1031236481026637914',
  staff: '1005725104430395452',
  goat: '1142652461425889371',
  dominator: '1142652458355658873',
  supreme: '1142652454450778132',
  hero: '950083054326677514',
  elite: '1031566725432492133',
  slayer: '1031926129822539786',
  verified: '445669382539051008',
  unverified: '907911526118223912',
  Break: '817133925834162177',
  notifications: '789800580314824744',
  polls: '1039191632207151104',
  qotd: '829991529857810452',
  events: '655711286755065856',
  bot_updates: '1039190833552961538',
  bedwars: '903995572392984576',
  duels: '903996109096103986',
  skyblock: '903996220551360642',
  skywars: '903996253589880832'
} as const;

export const bwPrestiges: { [key: number]: string } = {
  100: '1108963209165152277',
  200: '1108963205058940979',
  300: '1108963202236170315',
  400: '1108963194367651880',
  500: '1108963207554535504',
  600: '1108963199216275469',
  700: '1108963187879055481',
  800: '1108999881755983902',
  900: '1108999896171814972',
  1000: '1108999798469701652',
  1100: '1108999911334236200',
  1200: '1108999905030176779',
  1300: '1108999902186438687',
  1400: '1108999890102652938',
  1500: '1108999880011153449',
  1600: '1108999892833144873',
  1700: '1108999886638166077',
  1800: '1108999908440166470',
  1900: '1108999899187515453',
  2000: '1108999884230635571',
  2100: '1109042181068554330',
  2200: '1109042195299827753',
  2300: '1109042207954051153',
  2400: '1109042204825112597',
  2500: '1109042187225804841',
  2600: '1109042211024281621',
  2700: '1109042192422543361',
  2800: '1109042216015495178',
  2900: '1109042201658392636'
};

export const duelsDivisionRoles: { [key: number]: string } = {
  100: '1112678406052642826',
  200: '1112678409659764746',
  500: '1112678412184727572',
  1000: '1112678414277677137',
  2000: '1112678416001552454',
  4000: '1112683733129121832',
  10000: '1112683744428556368',
  20000: '1112683753274343504',
  50000: '1112683756852084848',
  100000: '1112684312479932466',
  200000: '1112684316837826622'
};

export function dividers(amount: number) {
  return config.emojis.divider.repeat(amount);
}

export const { bullet } = config.emojis;

export const { sub } = config.emojis;

export const { invis } = config.emojis;
