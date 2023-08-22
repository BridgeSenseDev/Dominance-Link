/* eslint-disable no-var */
/* eslint-disable vars-on-top */
import { hypixelRoles } from '../helper/constants';

export interface StringObject {
  [key: string]: string;
}

export interface NumberObject {
  [key: string]: number;
}

export interface DiscordMember {
  discord: string;
  uuid: string;
  messages: number;
  xp: number;
}

export interface HypixelGuildMember {
  uuid: string;
  discord: string;
  messages: number;
  tag: string;
  weeklyGexp: number;
  joined: number;
  targetRank: string;
  playtime: number;
  nameColor: string;
  bwStars: number;
  bwFkdr: number;
  duelsWins: number;
  duelsWlr: number;
  networth: number;
  skillAverage: string;
  swLevel: number;
  swKdr: number;
  [date: string]: number;
  name?: string | null;
  discordTag?: string | null;
}

export interface BreakMember {
  uuid: string;
  discord: string;
  thread: string;
  time: string;
  reason: string;
}

export interface WaitlistMember {
  uuid: string;
  discord: string;
  time: string;
  channel: string;
}

export interface Count {
  count: number;
  discord: string;
}

export type HypixelRoleKeys = keyof typeof hypixelRoles;

declare global {
  var onlineMembers: number;
  var guildOnline: string[];
  var dominanceGexp: number;
  var rebelGexp: number;
  var playtime: NumberObject;
  var lastMessage: StringObject;
}
