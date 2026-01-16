import {
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type Role,
} from "discord.js";
import { google } from "googleapis";
import type { JWT } from "googleapis-common";
import { schedule } from "node-cron";
import config from "../config.json";
import { textChannels } from "../events/discord/clientReady.ts";
import {
  archiveGuildMember,
  archiveMember,
  createGuildMember,
  fetchGuildMember,
} from "../handlers/databaseHandler.js";
import { chat } from "../handlers/workerHandler.js";
import client, { db, hypixel } from "../index.js";
import type { HypixelGuildMember, StringObject } from "../types/global";
import {
  abbreviateNumber,
  doubleDigits,
  getDaysInGuild,
  rankTagF,
  uuidToName,
} from "./clientUtils.js";
import {
  bwPrestiges,
  GUILD_ROLES,
  type GuildRoleKey,
  getEffectiveGameRole,
  getGuildMemberRoleIds,
  getMemberRoleKeys,
  getRoleByInGameTag,
  isInGameTagStaff,
} from "./constants.js";
import { checkRequirements } from "./requirements.js";
import { ensureDayExists, fetchSkyBlockStats } from "./utils.js";

export const sheet = new google.auth.JWT({
  email: config.sheets.clientEmail,
  key: config.sheets.privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

sheet.authorize();

const roleOrder = getMemberRoleKeys();

function getHighestDaysRole(days: number): GuildRoleKey {
  const memberRoles = Object.entries(GUILD_ROLES)
    .filter(([, role]) => !role.isStaff)
    .sort(([, a], [, b]) => b.daysThreshold - a.daysThreshold);

  for (const [key, role] of memberRoles) {
    if (days >= role.daysThreshold) {
      return key as GuildRoleKey;
    }
  }
  return "titan";
}

async function setDiscordNicknames(member: GuildMember, ign: string) {
  const { displayName } = member;

  if (!displayName.toUpperCase().includes(ign.toUpperCase())) {
    if (/\(.*?\)/.test(displayName.split(" ")[1])) {
      await member.setNickname(
        displayName.replace(displayName.split(" ")[0], ign),
      );
    } else {
      await member.setNickname(ign);
    }
  } else if (!displayName.includes(ign)) {
    await member.setNickname(displayName.replace(new RegExp(ign, "gi"), ign));
  }
}

async function assignMemberRoles(
  member: GuildMember,
  currentRole: GuildRoleKey,
  roles: Record<string, Role>,
) {
  const targetIndex = roleOrder.indexOf(currentRole);
  for (let i = 0; i < roleOrder.length; i++) {
    const role = roleOrder[i];
    const shouldHaveRole = i >= targetIndex;
    if (shouldHaveRole) {
      if (!member.roles.cache.has(roles[role].id)) {
        await member.roles.add(roles[role].id);
      }
    } else if (member.roles.cache.has(roles[role].id)) {
      await member.roles.remove(roles[role].id);
    }
  }
}

async function assignDaysRoles(member: GuildMember, daysInGuild: number) {
  const dayRoles = Object.keys(config.roles.days).map(Number);
  let highestRole = 0;

  for (const day of dayRoles) {
    if (daysInGuild >= day) {
      highestRole = day;
    }
  }

  if (highestRole) {
    await member.roles.add(
      (config.roles.days as { [key: string]: string })[highestRole.toString()],
    );
  }

  for (const day of dayRoles) {
    if (
      day !== highestRole &&
      member.roles.cache.has(
        (config.roles.days as { [key: string]: string })[day.toString()],
      )
    ) {
      await member.roles.remove(
        (config.roles.days as { [key: string]: string })[day.toString()],
      );
    }
  }
}

export async function weekly() {
  schedule(
    "55 12 * * 0",
    async () => {
      const roleDesc: StringObject = {};
      const assignedMembers = new Set();

      const allMembers = db
        .prepare(
          "SELECT uuid, discord, weeklyGexp, joined, baseDays FROM guildMembers ORDER BY weeklyGexp DESC",
        )
        .all() as HypixelGuildMember[];

      for (const member of allMembers) {
        const daysInGuild = getDaysInGuild(member.joined, member.baseDays);
        const highestDaysRole = getHighestDaysRole(daysInGuild);

        let weeklyRole: GuildRoleKey = "titan";
        let highestThreshold = 0;

        for (const key of getMemberRoleKeys()) {
          const role = GUILD_ROLES[key];
          if (
            role.gexpThreshold <= member.weeklyGexp &&
            role.gexpThreshold >= highestThreshold
          ) {
            weeklyRole = key;
            highestThreshold = role.gexpThreshold;
          }
        }

        const daysIndex = roleOrder.indexOf(highestDaysRole);
        const gexpIndex = roleOrder.indexOf(weeklyRole);

        const assignRoleBasedOnDays = daysIndex < gexpIndex;

        const targetRole = assignRoleBasedOnDays
          ? highestDaysRole
          : (weeklyRole as GuildRoleKey);

        const roleData = GUILD_ROLES[targetRole];
        const tagToSave = roleData.inGameTag ?? `[${roleData.displayName}]`;

        db.prepare("UPDATE guildMembers SET targetRank = ? WHERE uuid = ?").run(
          tagToSave,
          member.uuid,
        );

        if (!assignedMembers.has(member.uuid)) {
          assignedMembers.add(member.uuid);
          roleDesc[targetRole] = `${
            roleDesc[targetRole] || ""
          }\n\`${await uuidToName(member.uuid)}\` - \`${
            assignRoleBasedOnDays
              ? `${daysInGuild} days`
              : abbreviateNumber(member.weeklyGexp)
          }\``;
        }
      }

      const date = new Date();
      date.setDate(date.getDate() - 1);
      const previous = `${doubleDigits(date.getDate())}/${doubleDigits(
        date.getMonth() + 1,
      )}/${date.getFullYear()}`;
      date.setDate(date.getDate() - 6);
      const prevWeek = `${doubleDigits(date.getDate())}/${doubleDigits(
        date.getMonth() + 1,
      )}/${date.getFullYear()}`;

      const description = getMemberRoleKeys()
        .filter((role) => role !== "titan" && roleDesc[role])
        .map(
          (role) =>
            `Congrats to the following **${GUILD_ROLES[role].displayName}** members:${roleDesc[role]}`,
        )
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`Weekly Roles Update ${prevWeek} - ${previous}`)
        .setDescription(
          `${description}\n\n**Detailed stats can be found in https://dominance.bridgesense.dev/stats**`,
        )
        .setImage(config.guild.banner);

      await textChannels["announcements"].send({
        content: "<@&1031926129822539786>",
        embeds: [embed],
      });
    },
    {
      timezone: "Asia/Hong_Kong",
    },
  );
}

export async function database() {
  setInterval(async () => {
    const guild = await hypixel.getGuild("name", "Dominance").catch(() => null);
    if (!guild || guild.isRaw()) return;

    ensureDayExists();

    for (const member of guild.members) {
      const data = fetchGuildMember(member.uuid);
      const { joinedAtTimestamp, uuid, rank, expHistory } = member;

      if (!uuid) continue;

      let weeklyGexp = 0;
      let currentDay = null;
      let currentDailyExp = 0;

      if (Array.isArray(expHistory) && expHistory.length > 0) {
        weeklyGexp = expHistory.reduce((acc, cur) => acc + cur.exp, 0);
        currentDay = expHistory[0].day;
        currentDailyExp = expHistory[0].exp;
      }

      await createGuildMember(uuid);

      if (data && data.joined === "0") {
        db.prepare("UPDATE guildMembers SET (joined) = ? WHERE uuid = ?").run(
          joinedAtTimestamp,
          data.uuid,
        );
      }

      db.prepare(
        "UPDATE guildMembers SET (tag, weeklyGexp) = (?, ?) WHERE uuid = ?",
      ).run(`[${rank ?? 0}]`, weeklyGexp ?? 0, uuid);

      if (currentDailyExp) {
        db.prepare(
          `UPDATE gexpHistory SET ("${currentDay}") = (?) WHERE uuid = ?`,
        ).run(currentDailyExp, uuid);
      }
    }

    const hypixelMemberUuids = guild.members.map((member: any) => member.uuid);

    const uuidsToCheck = [
      ...(db.prepare("SELECT uuid FROM guildMembers").all() as {
        uuid: string;
      }[]),
      ...(db.prepare("SELECT uuid FROM gexpHistory").all() as {
        uuid: string;
      }[]),
    ];

    for (const uuid of uuidsToCheck) {
      if (!hypixelMemberUuids.includes(uuid.uuid)) {
        await archiveGuildMember(null, uuid.uuid);
      }
    }
  }, 60 * 1000);
}

export async function gsrun(sheets: JWT) {
  setInterval(
    async () => {
      const gsapi = google.sheets({ version: "v4", auth: sheets });
      const data = db
        .prepare("SELECT * FROM guildMembers ORDER BY weeklyGexp DESC")
        .all() as HypixelGuildMember[];
      const guild = await hypixel
        .getGuild("name", "Dominance")
        .catch(() => null);
      if (!guild || guild.isRaw()) return;

      type HypixelGuildMemberWithExpHistory = HypixelGuildMember & {
        [key: string]: number;
      };

      const array = await Promise.all(
        data.map(async (member) => {
          const memberWithExpHistory: HypixelGuildMemberWithExpHistory =
            member as HypixelGuildMemberWithExpHistory;

          memberWithExpHistory.name = await uuidToName(
            memberWithExpHistory.uuid,
          );

          const memberToUpdate = guild.members.find(
            (m: any) => m.uuid === memberWithExpHistory.uuid,
          );
          if (memberToUpdate) {
            for (const day of memberToUpdate.expHistory) {
              memberWithExpHistory[day.day] = day.exp;
            }
          }

          const discordTag = memberWithExpHistory.discord
            ? ((await client.users.fetch(memberWithExpHistory.discord))?.tag ??
              null)
            : null;

          const { name, ...rest } = memberWithExpHistory;

          const expHistory = Object.keys(rest).reduce(
            (acc: { [key: string]: unknown }, key) => {
              if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                acc[key] = rest[key];
                delete rest[key];
              }
              return acc;
            },
            {},
          );

          return [
            name,
            discordTag,
            ...Object.values(expHistory),
            ...Object.values(rest),
          ];
        }),
      );

      const options = {
        spreadsheetId: "1YiNxpvH9FZ6Cl6ZQmBV07EvORvsVTAiq5kD1FgJiKEE",
        range: "Guild API!A2",
        valueInputOption: "USER_ENTERED",
        resource: { values: array },
      };

      try {
        await gsapi.spreadsheets.values.clear({
          spreadsheetId: "1YiNxpvH9FZ6Cl6ZQmBV07EvORvsVTAiq5kD1FgJiKEE",
          range: "Guild API!A2:Z126",
        });
        await gsapi.spreadsheets.values.update(options);
      } catch (_error) {}
    },
    6 * 60 * 1000,
  );
}

export async function players() {
  let count = 0;
  const guild = client.guilds.cache.get("242357942664429568") as Guild;

  function getRole(roleId: string) {
    return guild.roles.cache.get(roleId) as Role;
  }

  const roles = {
    unverified: getRole(config.roles.unverified),
    break: getRole(config.roles.break),
    titan: getRole(config.roles.slayer),
    elite: getRole(config.roles.elite),
    hero: getRole(config.roles.hero),
    supreme: getRole(config.roles.supreme),
    dominator: getRole(config.roles.dominator),
    goat: getRole(config.roles.goat),
    jrModerator: getRole(config.roles.jrModerator),
    moderator: getRole(config.roles.moderator),
    headModerator: getRole(config.roles.headModerator),
  };

  setInterval(
    async () => {
      const discordId = db
        .prepare("SELECT discord FROM guildMembers")
        .all()
        .map((i) => (i as { discord: string }).discord);
      const members = Array.from(roles.titan.members).concat(
        Array.from(roles.elite.members),
        Array.from(roles.hero.members),
        Array.from(roles.supreme.members),
        Array.from(roles.dominator.members),
        Array.from(roles.goat.members),
        Array.from(roles.jrModerator.members),
        Array.from(roles.moderator.members),
        Array.from(roles.headModerator.members),
      );
      for (const member of members) {
        if (!discordId.includes(member[0])) {
          await member[1].roles.remove(getGuildMemberRoleIds());
        }
      }
    },
    5 * 60 * 1000,
  );

  setInterval(async () => {
    const data = db
      .prepare("SELECT * FROM guildMembers LIMIT 1 OFFSET ?")
      .get(count) as HypixelGuildMember;

    count++;
    if (count === 126) {
      count = 0;
    }

    if (!data || !data.uuid || !data.tag) {
      return;
    }

    const _inGameRole = data.tag.replace(/[[\]]/g, "");
    const targetRole = data.targetRank ?? "";

    const player = await hypixel.getPlayer(data.uuid).catch(() => null);
    if (!player || player.isRaw()) return;

    const bw = player.stats.BedWars;
    const duels = player.stats.Duels;
    const sw = player.stats.SkyWars;
    const mm = player.stats.MurderMystery;
    const bridge = duels.bridge;
    const zombies = player.stats.Arcade.zombies;
    const pit = player.stats.Pit;

    const sbData = await fetchSkyBlockStats(player.uuid);
    const networth = sbData ? sbData.networth : 0;
    const skillAverage = sbData ? sbData.skillAverage : 0;
    const sbLevel = sbData ? sbData.level : 0;

    if (data.targetRank && data.targetRank !== data.tag) {
      const ign = await uuidToName(data.uuid);
      const currentRoleKey = getRoleByInGameTag(data.tag);
      const targetRoleKey = getRoleByInGameTag(data.targetRank);

      if (targetRoleKey && currentRoleKey) {
        const currentPriority = GUILD_ROLES[currentRoleKey].priority;

        const effectiveTargetRoleKey = getEffectiveGameRole(targetRoleKey);
        const effectiveTargetPriority =
          GUILD_ROLES[effectiveTargetRoleKey].priority;

        const isCurrentStaff = isInGameTagStaff(data.tag);
        const isTargetStaff = isInGameTagStaff(data.targetRank);

        if (!isCurrentStaff && !isTargetStaff) {
          if (effectiveTargetPriority < currentPriority) {
            chat(`/g promote ${ign}`);
          } else if (effectiveTargetPriority > currentPriority) {
            chat(`/g demote ${ign}`);
          }
        }
      }
    }

    if (data.discord) {
      let member: GuildMember | undefined;
      try {
        member = await guild.members.fetch(data.discord);
      } catch (_e) {
        await archiveMember(null, data.discord);
        return;
      }

      const bwRole = bwPrestiges[Math.floor(bw.level / 100) * 100];
      for (const roleId of Object.values(bwPrestiges)) {
        if (member.roles.cache.has(roleId) && roleId !== bwRole) {
          await member.roles.remove(roleId);
        }
      }
      if (bwRole) {
        await member.roles.add(bwRole);
      }

      if (!isInGameTagStaff(data.tag)) {
        await setDiscordNicknames(member, player.nickname);
      }

      const memberRoles = member.roles.cache.map((role) => role.id);

      if (!memberRoles.includes(config.roles.slayer)) {
        await member.roles.add(roles.titan);
      }

      if (memberRoles.includes(config.roles.unverified)) {
        await member.roles.remove(roles.unverified);
      }

      if (targetRole) {
        const targetRoleKey = getRoleByInGameTag(targetRole);
        if (targetRoleKey) {
          await assignMemberRoles(member, targetRoleKey, roles);
        }
      }

      await assignDaysRoles(member, getDaysInGuild(data.joined, data.baseDays));
    }

    db.prepare(
      "UPDATE guildMembers SET (nameColor, reqs, bwStars, bwFkdr, duelsWins, duelsWlr, networth, skillAverage, swLevel, achievementPoints, networkLevel, sbLevel, quests, bridgeWins, bridgeWlr, mmWins, pitPrestige, zombiesKills, zombiesWins) = (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) WHERE uuid = ?",
    ).run(
      rankTagF(player) ?? "",
      (await checkRequirements(data.uuid, player)) ? 1 : 0,
      bw.level,
      bw.finals.total.ratio,
      duels.wins,
      duels.WLR,
      Math.round(networth * 100) / 100,
      Math.round(skillAverage * 100) / 100,
      sw.level,
      player.achievements.points,
      player.level.level,
      sbLevel,
      player.achievements.achievements["generalQuestMaster"],
      bridge.wins,
      bridge.WLR,
      mm.wins,
      pit.prestige,
      zombies.zombieKills,
      zombies.wins,
      data.uuid,
    );
  }, 7 * 1000);

  setInterval(
    async () => {
      const breakMembers = db
        .prepare("SELECT discord FROM breaks")
        .all()
        .map((i) => (i as { discord: string }).discord);
      for (const member of Array.from(roles.break.members)) {
        if (!breakMembers.includes(member[0])) {
          await member[1].roles.remove(roles.break);
        }
      }
    },
    5 * 60 * 1000,
  );
}
