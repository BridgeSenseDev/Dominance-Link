/* eslint-disable no-var */
/* eslint-disable vars-on-top */
import type { hypixelRoles } from "../helper/constants";

export interface StringObject {
  [key: string]: string;
}

export interface NumberObject {
  [key: string]: number;
}

interface Member {
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
  joined: string;
  baseDays: number;
  targetRank: string | null;
  playtime: number;
  nameColor: string;
  bwStars: number;
  bwFkdr: number;
  duelsWins: number;
  duelsWlr: number;
  networth: number;
  skillAverage: number;
  swLevel: number;
  name?: string | null;
  discordTag?: string | null;
  [date: string]: number;
}

interface GuildMemberArchive {
  uuid: string;
  discord: string | null;
  messages: number;
  baseDays: number;
  playtime: number;
}

interface GexpHistory {
  uuid: string;
  [date: string]: string | number;
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
  var playtime: NumberObject;
  var lastMessage: StringObject;
}
