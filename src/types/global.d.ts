/* eslint-disable no-unused-expressions */
/* eslint-disable no-lone-blocks */
/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */

import { Channel, WebhookClient } from 'discord.js';

interface StringObject {
  [key: string]: string;
}

interface NumberObject {
  [key: string]: number;
}

interface DiscordMember {
  discord: string;
  uuid: string;
  messages: number;
  xp: number;
}

interface HypixelGuildMember {
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
  discordTag?: string | null;
}

interface BreakMember {
  uuid: string;
  discord: string;
  thread: string;
  time: string;
  reason: string;
}

interface WaitlistMember {
  uuid: string;
  discord: string;
  time: string;
  channel: string;
}

interface WeeklyChallengeMember {
  uuid: string;
  discord: string;
  initial: number;
  current: number;
  difference?: number;
}

declare global {
  var onlineMembers: number;
  var guildOnline: string[];
  var playtime: NumberObject;
  var lastMessage: StringObject;
}
