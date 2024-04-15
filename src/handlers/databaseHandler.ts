import Database from "better-sqlite3";
import type { GuildMember } from "discord.js";
import type { SkyblockMember } from "hypixel-api-reborn";
import config from "../config.json" assert { type: "json" };
import {
  formatDateForDb,
  getDaysInGuild,
  getESTDate,
  rankTagF,
} from "../helper/clientUtils.js";
import { guildMemberRoles } from "../helper/constants.js";
import { checkRequirements } from "../helper/requirements.js";
import { ensureDayExists } from "../helper/utils.js";
import { hypixel } from "../index.js";
import type {
  GexpHistory,
  GuildMemberArchive,
  Member,
  StringObject,
} from "../types/global";

const db = new Database("guild.db");

interface HypixelGuildMember {
  uuid: string;
  discord: string | null;
  messages: number;
  tag: string;
  weeklyGexp: number;
  joined: string;
  baseDays: number;
  targetRank: string | null;
  playtime: number;
  nameColor: string;
  reqs: 0 | 1;
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

export function fetchMember(identifier: string): Member | null {
  const member = db
    .prepare("SELECT * FROM members WHERE discord = ? OR uuid = ?")
    .get(identifier, identifier) as Member | null;
  return member || null;
}

export async function createMember(
  member: GuildMember,
  uuid: string,
): Promise<void> {
  let messages = 0;
  let xp = 0;

  const memberArchive = db
    .prepare("SELECT * FROM memberArchives WHERE discord = ? OR uuid = ?")
    .get(member.id, uuid) as Member;

  if (memberArchive) {
    ({ messages, xp } = memberArchive);
    db.prepare("DELETE FROM memberArchives WHERE discord = ? OR uuid = ?").run(
      member.id,
      uuid,
    );
  }

  const memberData = fetchMember(member.id) || fetchMember(uuid);

  if (memberData) {
    ({ messages, xp } = memberData);
    db.prepare("DELETE FROM members WHERE discord = ? OR uuid = ?").run(
      member.id,
      uuid,
    );
  }

  db.prepare("UPDATE guildMembers SET discord = ? WHERE uuid = ?").run(
    member.id,
    uuid,
  );
  db.prepare(
    "INSERT INTO members (discord, uuid, messages, xp) VALUES (?, ?, ?, ?)",
  ).run(member.id, uuid, messages, xp);

  await member.roles.remove(config.roles.unverified);
  await member.roles.add(config.roles.verified);
}

export async function archiveMember(
  member: GuildMember | null,
  discordId?: string,
): Promise<void> {
  const identifier = member ? member.id : discordId;
  if (!identifier) return;

  const memberData = fetchMember(identifier);

  if (memberData) {
    db.prepare(
      "INSERT INTO memberArchives (discord, uuid, messages, xp) VALUES (?, ?, ?, ?)",
    ).run(
      memberData.discord,
      memberData.uuid,
      memberData.messages,
      memberData.xp,
    );

    db.prepare("DELETE FROM members WHERE discord = ?").run(memberData.discord);

    db.prepare("UPDATE guildMembers SET discord = NULL WHERE discord = ?").run(
      memberData.discord,
    );
  }

  if (member) {
    await member.roles.add(config.roles.unverified);
    await member.roles.remove(config.roles.verified);
    for (const role of [...guildMemberRoles, config.roles.break]) {
      if (member.roles.cache.has(role)) {
        await member.roles.remove(role);
      }
    }
  }
}

export function fetchGuildMember(
  identifier: string,
): HypixelGuildMember | null {
  const guildMember = db
    .prepare("SELECT * FROM guildMembers WHERE discord = ? OR uuid = ?")
    .get(identifier, identifier) as HypixelGuildMember | null;
  return guildMember || null;
}

export async function createGuildMember(uuid: string): Promise<void> {
  const member = fetchGuildMember(uuid);
  const gexpHistory = db
    .prepare("SELECT * FROM gexpHistory WHERE uuid = ?")
    .get(uuid);

  if (member && gexpHistory) {
    return;
  }

  const player = await hypixel.getPlayer(uuid);
  if (!player) {
    throw new Error(`Player with UUID ${uuid} not found`);
  }

  if (!member) {
    let messages = 0;
    let playtime = 0;
    let baseDays = 0;

    if (
      db.prepare("SELECT * FROM guildMemberArchives WHERE uuid = ?").get(uuid)
    ) {
      const memberArchive = db
        .prepare("SELECT * FROM guildMemberArchives WHERE uuid = ?")
        .get(uuid) as GuildMemberArchive;
      ({ messages, playtime, baseDays } = memberArchive);
      db.prepare("DELETE FROM guildMemberArchives WHERE uuid = ?").run(uuid);
    }

    let discord: string | null = null;
    if (fetchMember(uuid)?.discord) {
      discord = fetchMember(uuid)?.discord ?? null;
    }

    let networth = 0;
    let sbSkillAverage = 0;
    let sbLevel = 0;
    const sbMember = await hypixel.getSkyblockMember(uuid).catch(() => null);
    if (sbMember) {
      const profile = sbMember.values().next().value as SkyblockMember;
      networth = (await profile.getNetworth()).networth ?? 0;
      sbSkillAverage = profile.skills.average;
      sbLevel = profile.level;
    }

    const guildMember: HypixelGuildMember = {
      uuid: player.uuid,
      discord: discord ?? "",
      messages,
      tag: "",
      weeklyGexp: 0,
      joined: "0",
      baseDays,
      targetRank: null,
      playtime,
      nameColor: rankTagF(player) ?? "",
      reqs: (await checkRequirements(uuid, player)) ? 1 : 0,
      bwStars: player.stats?.bedwars?.level ?? 0,
      bwFkdr: player.stats?.bedwars?.finalKDRatio ?? 0,
      duelsWins: player.stats?.duels?.wins ?? 0,
      duelsWlr: player.stats?.duels?.WLRatio ?? 0,
      networth,
      skillAverage: sbSkillAverage,
      swLevel: player.stats?.skywars?.level ?? 0,
      achievementPoints: player.achievementPoints ?? 0,
      networkLevel: player.level ?? 0,
      sbLevel: sbLevel ?? 0,
      quests: (player.achievements.generalQuestMaster as number) ?? 0,
    };

    db.prepare(
      "INSERT INTO guildMembers (uuid, discord, messages, tag, weeklyGexp, joined, baseDays, targetRank, playtime, nameColor, reqs, bwStars, bwFkdr, duelsWins, duelsWlr, networth, skillAverage, swLevel, achievementPoints, networkLevel, sbLevel, quests) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run([
      guildMember.uuid,
      guildMember.discord,
      guildMember.messages,
      guildMember.tag,
      guildMember.weeklyGexp,
      guildMember.joined,
      guildMember.baseDays,
      guildMember.targetRank,
      guildMember.playtime,
      guildMember.nameColor,
      guildMember.reqs,
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
      guildMember.quests,
    ]);
  }

  if (!gexpHistory) {
    const gexpArchive = db
      .prepare("SELECT * FROM gexpHistoryArchives WHERE uuid = ?")
      .get(uuid);
    if (gexpArchive) {
      db.prepare(
        "INSERT INTO gexpHistory SELECT * FROM gexpHistoryArchives WHERE uuid = ?",
      ).run(uuid);
      db.prepare("DELETE FROM gexpHistoryArchives WHERE uuid = ?").run(uuid);
    } else {
      db.prepare("INSERT INTO gexpHistory (uuid) VALUES (?)").run(uuid);
    }
  }
}

export async function archiveGuildMember(
  member: GuildMember | null,
  uuid?: string,
): Promise<void> {
  const identifier = member ? member.id : uuid;
  if (!identifier) return;

  const guildMemberData = fetchGuildMember(identifier);

  if (guildMemberData) {
    db.prepare(
      "INSERT INTO guildMemberArchives (uuid, discord, messages, playtime, baseDays) VALUES (?, ?, ?, ?, ?)",
    ).run(
      guildMemberData.uuid,
      guildMemberData.discord,
      guildMemberData.messages,
      guildMemberData.playtime,
      getDaysInGuild(guildMemberData.joined, guildMemberData.baseDays),
    );

    db.prepare("DELETE FROM guildMembers WHERE uuid = ?").run(
      guildMemberData.uuid,
    );
  }

  const gexpHistoryData = db
    .prepare("SELECT * FROM gexpHistory WHERE uuid = ?")
    .get(guildMemberData ? guildMemberData.uuid : uuid) as GexpHistory;
  if (gexpHistoryData) {
    db.prepare(
      "INSERT INTO gexpHistoryArchives SELECT * FROM gexpHistory WHERE uuid = ?",
    ).run(gexpHistoryData.uuid);
    db.prepare("DELETE FROM gexpHistory WHERE uuid = ?").run(
      gexpHistoryData.uuid,
    );
  }

  if (member) {
    for (const role of [...guildMemberRoles, config.roles.break]) {
      if (member.roles.cache.has(role)) {
        await member.roles.remove(role);
      }
    }
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
  const tableInfo = db
    .prepare("PRAGMA table_info(gexpHistory)")
    .all() as StringObject[];

  ensureDayExists(today);

  const sevenDaysAgo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 6,
  );
  const thirtyDaysAgo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 29,
  );

  const dailyGexp = db
    .prepare(
      `SELECT "${formatDateForDb(today)}" FROM gexpHistory WHERE uuid = ?`,
    )
    .pluck()
    .get(uuid) as number;

  const weeklyDates = getDatesBetween(sevenDaysAgo, today);
  const monthlyDates = getDatesBetween(thirtyDaysAgo, today);

  const weeklyColumns = weeklyDates.map((date) => `"${date}"`).join(", ");
  const monthlyColumns = monthlyDates.map((date) => `"${date}"`).join(", ");

  let weeklyGexp = 0;
  const weeklyColumnsArray = weeklyColumns.split(", ");
  for (const column of weeklyColumnsArray) {
    const query = `SELECT IFNULL(SUM(${column}), 0) FROM gexpHistory WHERE uuid = ?`;
    weeklyGexp += db.prepare(query).pluck().get(uuid) as number;
  }

  let monthlyGexp = 0;
  const monthlyColumnsArray = monthlyColumns.split(", ");
  for (const column of monthlyColumnsArray) {
    const query = `SELECT IFNULL(SUM(${column}), 0) FROM gexpHistory WHERE uuid = ?`;
    monthlyGexp += db.prepare(query).pluck().get(uuid) as number;
  }

  const lifetimeGexp = db
    .prepare(
      `SELECT ${tableInfo
        .map((column) => column.name)
        .filter((name) => name !== "uuid")
        .map((name) => `IFNULL(SUM("${name}"), 0)`)
        .join(" + ")} FROM gexpHistory WHERE uuid = ?`,
    )
    .pluck()
    .get(uuid) as number;

  return {
    dailyGexp: dailyGexp || 0,
    weeklyGexp: weeklyGexp || 0,
    monthlyGexp: monthlyGexp || 0,
    lifetimeGexp: lifetimeGexp || 0,
  };
}

export function fetchTotalLifetimeGexp(): number {
  const gexpHistories = db
    .prepare("SELECT * FROM gexpHistory")
    .all() as GexpHistory[];
  let totalLifetimeGexp = 0;

  for (const gexpHistory of gexpHistories) {
    for (const key in gexpHistory) {
      if (key !== "uuid") {
        totalLifetimeGexp += Number(gexpHistory[key]);
      }
    }
  }

  return totalLifetimeGexp;
}

export function fetchTotalWeeklyGexp(): number {
  const gexpHistories = db
    .prepare("SELECT * FROM gexpHistory")
    .all() as GexpHistory[];
  let totalWeeklyGexp = 0;

  const sevenDaysAgo = getESTDate();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const gexpHistory of gexpHistories) {
    for (const key in gexpHistory) {
      if (key !== "uuid" && new Date(key) >= sevenDaysAgo) {
        totalWeeklyGexp += Number(gexpHistory[key]);
      }
    }
  }

  return totalWeeklyGexp;
}
