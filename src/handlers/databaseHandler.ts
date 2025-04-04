import { Database } from "bun:sqlite";
import type { GuildMember } from "discord.js";
import config from "../config.json" with { type: "json" };
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
  HypixelGuildMember as BaseHypixelGuildMember,
  BreakMember,
  GexpHistory,
  GuildMemberArchive,
  HypixelGuildMember,
  Member,
} from "../types/global";

const db = new Database("guild.db");

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

  const player = await hypixel.getPlayer(uuid).catch(() => null);
  if (!player) {
    return;
  }

  if (!member) {
    let messages = 0;
    let playtime = 0;
    let baseDays = null;

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
    const sbMember = (
      await hypixel.getSkyblockProfiles(uuid).catch(() => null)
    )?.find((profile) => profile.selected)?.me;
    if (sbMember) {
      networth = (await sbMember.getNetworth()).networth ?? 0;
      sbSkillAverage = sbMember.skills.average;
      sbLevel = sbMember.level;
    }

    const guildMember: HypixelGuildMember = {
      uuid: player.uuid,
      discord: discord ?? "",
      messages: messages,
      tag: "",
      weeklyGexp: 0,
      joined: "0",
      baseDays: baseDays,
      targetRank: null,
      playtime: playtime,
      nameColor: rankTagF(player) ?? "",
      reqs: (await checkRequirements(uuid, player)) ? 1 : 0,
      bwStars: player.stats?.bedwars?.level ?? 0,
      bwFkdr: player.stats?.bedwars?.finalKDRatio ?? 0,
      duelsWins: player.stats?.duels?.wins ?? 0,
      duelsWlr: player.stats?.duels?.WLRatio ?? 0,
      networth: networth,
      skillAverage: sbSkillAverage,
      swLevel: player.stats?.skywars?.level ?? 0,
      achievementPoints: player.achievementPoints ?? 0,
      networkLevel: player.level ?? 0,
      sbLevel: sbLevel ?? 0,
      quests: (player.achievements["generalQuestMaster"] as number) ?? 0,
      bridgeWins: player.stats?.duels?.bridge.wins ?? 0,
      bridgeWlr:
        (player.stats?.duels?.bridge.wins ?? 0) /
        (player.stats?.duels?.bridge.losses ?? 0),
      mmWins: player.stats?.murdermystery?.wins ?? 0,
      pitPrestige: player.stats?.pit?.prestige ?? 0,
    };

    db.query(
      "INSERT OR IGNORE INTO guildMembers (uuid, discord, messages, tag, weeklyGexp, joined, baseDays, targetRank, playtime, nameColor, reqs, bwStars, bwFkdr, duelsWins, duelsWlr, networth, skillAverage, swLevel, achievementPoints, networkLevel, sbLevel, quests, bridgeWins, bridgeWlr, mmWins, pitPrestige) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26)",
    ).run(
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
      guildMember.bridgeWins,
      guildMember.bridgeWlr,
      guildMember.mmWins,
      guildMember.pitPrestige,
    );
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
      db.prepare("INSERT OR IGNORE INTO gexpHistory (uuid) VALUES (?)").run(
        uuid,
      );
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
  const breaks = db
    .prepare("SELECT discord, thread FROM breaks WHERE uuid = ?")
    .get(guildMemberData?.uuid ?? "") as BreakMember | null;

  if (guildMemberData) {
    db.prepare(
      "INSERT INTO guildMemberArchives (uuid, discord, messages, playtime, baseDays) VALUES (?, ?, ?, ?, ?)",
    ).run(
      guildMemberData.uuid,
      guildMemberData.discord,
      guildMemberData.messages,
      guildMemberData.playtime,
      breaks
        ? getDaysInGuild(guildMemberData.joined, guildMemberData.baseDays)
        : 0,
    );

    db.prepare("DELETE FROM guildMembers WHERE uuid = ?").run(
      guildMemberData.uuid,
    );
  }

  const gexpHistoryData = db
    .query("SELECT * FROM gexpHistory WHERE uuid = ?1")
    .get(
      guildMemberData?.uuid ? guildMemberData.uuid : (uuid ?? ""),
    ) as GexpHistory;
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
      if (breaks && role === config.roles.break) continue;

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

function calculateGexpForRow(row: GexpHistory, today: Date): GexpResult {
  const { uuid: _, ...stats } = row;

  let lifetimeGexp = 0;
  for (const key in stats) {
    lifetimeGexp += Number(stats[key]) || 0;
  }

  const todayStr = formatDateForDb(today);
  const dailyGexp = Number(stats[todayStr]) || 0;

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  let weeklyGexp = 0;
  let monthlyGexp = 0;

  for (const key in stats) {
    const date = new Date(key);
    if (Number.isNaN(date.getTime())) continue;

    const gexp = Number(stats[key]) || 0;
    if (date >= sevenDaysAgo && date <= today) {
      weeklyGexp += gexp;
    }
    if (date >= thirtyDaysAgo && date <= today) {
      monthlyGexp += gexp;
    }
  }

  return {
    dailyGexp,
    weeklyGexp,
    monthlyGexp,
    lifetimeGexp,
  };
}

export function fetchGexpForMembers(
  members: (BaseHypixelGuildMember & { [key: string]: number })[],
): (BaseHypixelGuildMember & { [key: string]: number })[] {
  if (members.length === 0) return members;

  const today = getESTDate();
  ensureDayExists(today);

  const uuids = members.map((member) => member.uuid);

  const placeholders = uuids.map(() => "?").join(", ");

  const query = `SELECT * FROM gexpHistory WHERE uuid IN (${placeholders})`;
  const rows = db.prepare(query).all(...uuids) as GexpHistory[];

  const gexpMap = new Map<string, GexpHistory>();
  for (const row of rows) {
    gexpMap.set(row.uuid, row);
  }

  for (const member of members) {
    const row = gexpMap.get(member.uuid);
    let gexpResult: GexpResult;
    if (row) {
      gexpResult = calculateGexpForRow(row, today);
    } else {
      gexpResult = {
        dailyGexp: 0,
        weeklyGexp: 0,
        monthlyGexp: 0,
        lifetimeGexp: 0,
      };
    }

    member["dailyGexp"] = gexpResult.dailyGexp;
    member["monthlyGexp"] = gexpResult.monthlyGexp;
    member["lifetimeGexp"] = gexpResult.lifetimeGexp;
  }

  return members;
}

export function fetchGexpForMember(uuid: string): GexpResult {
  const today = getESTDate();
  ensureDayExists(today);

  const row = db
    .prepare("SELECT * FROM gexpHistory WHERE uuid = ?")
    .get(uuid) as GexpHistory | undefined;

  if (!row) {
    return { dailyGexp: 0, weeklyGexp: 0, monthlyGexp: 0, lifetimeGexp: 0 };
  }

  return calculateGexpForRow(row, today);
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
