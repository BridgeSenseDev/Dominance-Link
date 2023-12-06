import Database from 'better-sqlite3';
import { getNetworth } from 'skyhelper-networth';
import { GuildMember } from 'discord.js';
import { hypixel } from '../index.js';
import { formatDateForDb, getESTDate, rankTagF, skillAverage, updateTable } from '../helper/utils.js';
import { NumberObject, StringObject } from '../types/global.js';
import { discordRoles } from '../helper/constants.js';

const db = new Database('guild.db');

interface Member {
  discord: string;
  uuid: string;
  messages: number;
  xp: number;
}

interface HypixelGuildMember {
  uuid: string;
  discord: string | null;
  messages: number;
  tag: string;
  weeklyGexp: number;
  joined: number;
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
  achievementPoints: number;
  networkLevel: number;
  sbLevel: number;
  quests: number;
}

interface GexpHistory {
  uuid: string;
  [date: string]: string | number;
}

export function fetchMember(identifier: string): Member | null {
  const member = db
    .prepare('SELECT * FROM members WHERE discord = ? OR uuid = ?')
    .get(identifier, identifier) as Member | null;
  return member || null;
}

export async function createMember(member: GuildMember, uuid: string): Promise<void> {
  let messages = 0;
  let xp = 0;

  const memberArchive = db
    .prepare('SELECT * FROM memberArchives WHERE discord = ? OR uuid = ?')
    .get(member.id, uuid) as Member;

  if (memberArchive) {
    ({ messages, xp } = memberArchive);
    db.prepare('DELETE FROM memberArchives WHERE discord = ? OR uuid = ?').run(member.id, uuid);
  }

  const memberData = fetchMember(member.id) || fetchMember(uuid);

  if (memberData) {
    ({ messages, xp } = memberData);
    db.prepare('DELETE FROM members WHERE discord = ? OR uuid = ?').run(member.id, uuid);
  }

  db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(member.id, uuid);
  db.prepare('INSERT INTO members (discord, uuid, messages, xp) VALUES (?, ?, ?, ?)').run(
    member.id,
    uuid,
    messages,
    xp
  );

  await member.roles.remove(discordRoles.unverified);
  await member.roles.add(discordRoles.verified);
}

export async function archiveMember(member: GuildMember | null, discordId?: string): Promise<void> {
  const identifier = member ? member.id : discordId;
  const memberData = fetchMember(identifier!);

  if (memberData) {
    db.prepare('INSERT INTO memberArchives (discord, uuid, messages, xp) VALUES (?, ?, ?, ?)').run(
      memberData.discord,
      memberData.uuid,
      memberData.messages,
      memberData.xp
    );

    db.prepare('DELETE FROM members WHERE discord = ?').run(memberData.discord);

    db.prepare('UPDATE guildMembers SET discord = NULL WHERE discord = ?').run(memberData.discord);
  }

  if (member) {
    await member.roles.add(discordRoles.unverified);
    for (const role of [
      discordRoles.verified,
      discordRoles.slayer,
      discordRoles.elite,
      discordRoles.hero,
      discordRoles.godlike,
      discordRoles.dominator,
      discordRoles.goat,
      discordRoles.staff
    ]) {
      if (member.roles.cache.has(role)) {
        await member.roles.remove(role);
      }
    }
  }
}

export function fetchGuildMember(identifier: string): HypixelGuildMember | null {
  const guildMember = db
    .prepare('SELECT * FROM guildMembers WHERE discord = ? OR uuid = ?')
    .get(identifier, identifier) as HypixelGuildMember | null;
  return guildMember || null;
}

export async function createGuildMember(uuid: string): Promise<void> {
  if (fetchGuildMember(uuid)) {
    return;
  }

  const player = await hypixel.getPlayer(uuid);
  if (!player) {
    throw new Error(`Player with UUID ${uuid} not found`);
  }

  let messages = 0;
  let playtime = 0;

  if (db.prepare('SELECT * FROM guildMemberArchives WHERE uuid = ?').get(uuid)) {
    const memberArchive = db.prepare('SELECT * FROM guildMemberArchives WHERE uuid = ?').get(uuid) as NumberObject;
    ({ messages, playtime } = memberArchive);
    db.prepare('DELETE FROM guildMemberArchives WHERE uuid = ?').run(uuid);
  }

  let discord = null;
  if (fetchMember(uuid)?.discord) {
    discord = fetchMember(uuid)!.discord;
  }

  let networth = 0;
  let sa = 0;
  let sbLevel = 0;
  const skyblockProfiles = (await hypixel.getSkyblockProfiles(uuid, { raw: true })) as any;
  if (skyblockProfiles.success) {
    const { profiles } = skyblockProfiles;
    if (profiles) {
      const profile = profiles.find((i: any) => i.selected);
      if (profile) {
        const profileData = profile.members[uuid];
        const bankBalance = profile.banking?.balance;
        ({ networth } = await getNetworth(profileData, bankBalance));
        sa = await skillAverage(profileData);
        sbLevel = Math.floor(profileData.leveling?.experience ? profileData.leveling.experience / 100 : 0);
      }
    }
  }

  const guildMember: HypixelGuildMember = {
    uuid: player.uuid,
    discord,
    messages,
    tag: '',
    weeklyGexp: 0,
    joined: 0,
    targetRank: null,
    playtime,
    nameColor: rankTagF(player) ?? '',
    bwStars: player.stats?.bedwars?.level ?? 0,
    bwFkdr: player.stats?.bedwars?.finalKDRatio ?? 0,
    duelsWins: player.stats?.duels?.wins ?? 0,
    duelsWlr: player.stats?.duels?.WLRatio ?? 0,
    networth,
    skillAverage: sa,
    swLevel: player.stats?.skywars?.level ?? 0,
    achievementPoints: player.achievementPoints ?? 0,
    networkLevel: player.level ?? 0,
    sbLevel: sbLevel ?? 0,
    quests: (player.achievements.generalQuestMaster as number) ?? 0
  };

  db.prepare(
    'INSERT INTO guildMembers (uuid, discord, messages, tag, weeklyGexp, joined, targetRank, playtime, nameColor, bwStars, bwFkdr, duelsWins, duelsWlr, networth, skillAverage, swLevel, achievementPoints, networkLevel, sbLevel, quests) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run([
    guildMember.uuid,
    guildMember.discord,
    guildMember.messages,
    guildMember.tag,
    guildMember.weeklyGexp,
    guildMember.joined,
    guildMember.targetRank,
    guildMember.playtime,
    guildMember.nameColor,
    guildMember.bwStars,
    guildMember.bwFkdr,
    guildMember.duelsWins,
    guildMember.duelsWlr,
    guildMember.networth,
    guildMember.skillAverage,
    guildMember.swLevel,
    guildMember.achievementPoints,
    guildMember.networkLevel,
    guildMember.sbLevel,
    guildMember.quests
  ]);
}

export async function archiveGuildMember(member: GuildMember | null, uuid?: string): Promise<void> {
  const identifier = member ? member.id : uuid;
  const guildMemberData = fetchGuildMember(identifier!);

  if (guildMemberData) {
    db.prepare('INSERT INTO guildMemberArchives (uuid, discord, messages, playtime) VALUES (?, ?, ?, ?)').run(
      guildMemberData.uuid,
      guildMemberData.discord,
      guildMemberData.messages,
      guildMemberData.playtime
    );

    db.prepare('DELETE FROM guildMembers WHERE uuid = ?').run(guildMemberData.uuid);
  }

  if (member) {
    await member.roles.remove(discordRoles.slayer);
    await member.roles.remove(discordRoles.elite);
    await member.roles.remove(discordRoles.hero);
    await member.roles.remove(discordRoles.godlike);
    await member.roles.remove(discordRoles.dominator);
    await member.roles.remove(discordRoles.goat);
    await member.roles.remove(discordRoles.staff);
  }
}

interface GexpResult {
  dailyGexp: number;
  weeklyGexp: number;
  monthlyGexp: number;
  lifetimeGexp: number;
}

function getDatesBetween(startDate: Date, endDate: Date): string[] {
  const dates = [];

  while (startDate <= endDate) {
    dates.push(formatDateForDb(new Date(startDate)));
    startDate.setDate(startDate.getDate() + 1);
  }

  return dates;
}

export function fetchGexpForMember(uuid: string): GexpResult {
  const today = getESTDate();

  const tableInfo = db.prepare('PRAGMA table_info(gexpHistory)').all() as StringObject[];
  const columnExists = tableInfo.some((column) => column.name === formatDateForDb(today));

  if (!columnExists) {
    db.prepare(`ALTER TABLE gexpHistory ADD COLUMN "${formatDateForDb(today)}" INTEGER DEFAULT 0`).run();
    db.prepare(`ALTER TABLE gexpHistoryArchives ADD COLUMN "${formatDateForDb(today)}" INTEGER`).run();
  }

  updateTable('2022-10-17', formatDateForDb(today));

  const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);

  const dailyGexp = db
    .prepare(`SELECT "${formatDateForDb(today)}" FROM gexpHistory WHERE uuid = ?`)
    .pluck()
    .get(uuid) as number;

  const weeklyDates = getDatesBetween(sevenDaysAgo, today);
  const monthlyDates = getDatesBetween(thirtyDaysAgo, today);

  const weeklyColumns = weeklyDates.map((date) => `"${date}"`).join(', ');
  const monthlyColumns = monthlyDates.map((date) => `"${date}"`).join(', ');

  let weeklyGexp = 0;
  const weeklyColumnsArray = weeklyColumns.split(', ');
  for (const column of weeklyColumnsArray) {
    const query = `SELECT SUM(${column}) FROM gexpHistory WHERE uuid = ?`;
    weeklyGexp += db.prepare(query).pluck().get(uuid) as number;
  }

  let monthlyGexp = 0;
  const monthlyColumnsArray = monthlyColumns.split(', ');
  for (const column of monthlyColumnsArray) {
    const query = `SELECT SUM(${column}) FROM gexpHistory WHERE uuid = ?`;
    monthlyGexp += db.prepare(query).pluck().get(uuid) as number;
  }

  const lifetimeGexp = db
    .prepare(
      `SELECT ${tableInfo
        .map((column) => column.name)
        .filter((name) => name !== 'uuid')
        .map((name) => `IFNULL(SUM(${name}), 0)`)
        .join(' + ')} FROM gexpHistory WHERE uuid = ?`
    )
    .pluck()
    .get(uuid) as number;

  return {
    dailyGexp: dailyGexp || 0,
    weeklyGexp: weeklyGexp || 0,
    monthlyGexp: monthlyGexp || 0,
    lifetimeGexp: lifetimeGexp || 0
  };
}

export function fetchTotalLifetimeGexp(): number {
  const gexpHistories = db.prepare('SELECT * FROM gexpHistory').all() as GexpHistory[];
  let totalLifetimeGexp = 0;

  for (const gexpHistory of gexpHistories) {
    for (const key in gexpHistory) {
      if (key !== 'uuid') {
        totalLifetimeGexp += Number(gexpHistory[key]);
      }
    }
  }

  return totalLifetimeGexp;
}

export function fetchTotalWeeklyGexp(): number {
  const gexpHistories = db.prepare('SELECT * FROM gexpHistory').all() as GexpHistory[];
  let totalWeeklyGexp = 0;

  const sevenDaysAgo = getESTDate();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const gexpHistory of gexpHistories) {
    for (const key in gexpHistory) {
      if (key !== 'uuid' && new Date(key) >= sevenDaysAgo) {
        totalWeeklyGexp += Number(gexpHistory[key]);
      }
    }
  }

  return totalWeeklyGexp;
}
