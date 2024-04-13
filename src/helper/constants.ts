import config from "../config.json" assert { type: "json" };
import type { StringObject } from "../types/global";

export const guildMemberRoles = [
  config.roles.seniorStaff,
  config.roles.recruitmentStaff,
  config.roles.eventStaff,
  config.roles.goat,
  config.roles.dominator,
  config.roles.supreme,
  config.roles.hero,
  config.roles.elite,
  config.roles.slayer,
];

export const rgbaColor: StringObject = {
  0: "rgba(0,0,0,1)",
  1: "rgba(0,0,170,1)",
  2: "rgba(0,170,0,1)",
  3: "rgba(0,170,170,1)",
  4: "rgba(170,0,0,1)",
  5: "rgba(170,0,170,1)",
  6: "rgba(255,170,0,1)",
  7: "rgba(170,170,170,1)",
  8: "rgba(85,85,85,1)",
  9: "rgba(85,85,255,1)",
  a: "rgba(85,255,85,1)",
  b: "rgba(85,255,255,1)",
  c: "rgba(255,85,85,1)",
  d: "rgba(255,85,255,1)",
  e: "rgba(255,255,85,1)",
  f: "rgba(255,255,255,1)",
  g: "rgb(194, 206, 227)",
  h: "rgb(161, 171, 189)",
  i: "rgb(129, 137, 151)",
  j: "rgb(117, 124, 138)",
};

export const rankColor: StringObject = {
  DARK_BLUE: "§1",
  DARK_AQUA: "§3",
  DARK_RED: "§4",
  BLACK: "§0",
  DARK_PURPLE: "§5",
  DARK_GREEN: "§2",
  GOLD: "§6",
  GRAY: "§7",
  DARK_GRAY: "§8",
  BLUE: "§9",
  GREEN: "§a",
  AQUA: "§b",
  RED: "§c",
  LIGHT_PURPLE: "§d",
  YELLOW: "§e",
  WHITE: "§f",
};

export const hypixelRoles = {
  goat: { name: "Goat", gexp: 600000, days: 1000 },
  dominator: { name: "Dominator", gexp: 400000, days: 600 },
  supreme: { name: "Supreme", gexp: 250000, days: 300 },
  hero: { name: "Hero", gexp: 175000, days: 100 },
  elite: { name: "Elite", gexp: 125000, days: 50 },
} as const;

export const bwPrestiges: { [key: number]: string } = {
  100: "1108963209165152277",
  200: "1108963205058940979",
  300: "1108963202236170315",
  400: "1108963194367651880",
  500: "1108963207554535504",
  600: "1108963199216275469",
  700: "1108963187879055481",
  800: "1108999881755983902",
  900: "1108999896171814972",
  1000: "1108999798469701652",
  1100: "1108999911334236200",
  1200: "1108999905030176779",
  1300: "1108999902186438687",
  1400: "1108999890102652938",
  1500: "1108999880011153449",
  1600: "1108999892833144873",
  1700: "1108999886638166077",
  1800: "1108999908440166470",
  1900: "1108999899187515453",
  2000: "1108999884230635571",
  2100: "1109042181068554330",
  2200: "1109042195299827753",
  2300: "1109042207954051153",
  2400: "1109042204825112597",
  2500: "1109042187225804841",
  2600: "1109042211024281621",
  2700: "1109042192422543361",
  2800: "1109042216015495178",
  2900: "1109042201658392636",
};

export function dividers(amount: number) {
  return config.emojis.divider.repeat(amount);
}

export const { bullet } = config.emojis;

export const { sub } = config.emojis;

export const { invis } = config.emojis;
