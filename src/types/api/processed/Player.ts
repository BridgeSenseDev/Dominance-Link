import { Duels } from './Duels.js';
import { Bedwars } from './Bedwars.js';
import { Skywars } from './Skywars.js';

export interface Player {
  uuid: string;
  username: string;
  nameHistory: string[];
  rank: string;
  rankPlusColor: string;
  rankTag: string;
  rankTagF: string;
  prefix: string;
  karma: number;
  exp: number;
  level: number;
  mcVersion: string;
  firstLogin: number;
  lastLogin: number;
  lastLogout: number;
  giftsSent: number;
  giftsReceived: number;
  links: {
    DISCORD: string;
    TWITCH: string;
    YOUTUBE: string;
    TWITTER: string;
    INSTAGRAM: string;
    HYPIXEL: string;
  };
  stats: {
    Duels?: Duels;
    Bedwars?: Bedwars;
    Skywars?: Skywars;
  };
}
