import Database from "bun:sqlite";
import {
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type Role,
} from "discord.js";
import { google } from "googleapis";
import type { JWT } from "googleapis-common";
import { schedule } from "node-cron";
import config from "../config.json" with { type: "json" };
import { textChannels } from "../events/discord/ready.js";
import {
  archiveGuildMember,
  archiveMember,
  createGuildMember,
  fetchGuildMember,
} from "../handlers/databaseHandler.js";
import { chat } from "../handlers/workerHandler.js";
import client, { hypixel } from "../index.js";
import type {
  HypixelGuildMember,
  HypixelRoleKeys,
  StringObject,
} from "../types/global";
import {
  abbreviateNumber,
  doubleDigits,
  getDaysInGuild,
  getESTDate,
  rankTagF,
  uuidToName,
} from "./clientUtils.js";
import { bwPrestiges, guildMemberRoles, hypixelRoles } from "./constants.js";
import { checkRequirements } from "./requirements.js";
import { ensureDayExists } from "./utils.js";

const db = new Database("guild.db");

export const sheet = new google.auth.JWT(
  config.sheets.clientEmail,
  undefined,
  config.sheets.privateKey,
  ["https://www.googleapis.com/auth/spreadsheets"],
);

sheet.authorize();

const roleOrder = ["slayer", "elite", "hero", "supreme", "dominator", "goat"];

function getHighestDaysRole(days: number) {
  return (
    Object.keys(hypixelRoles).find(
      (role) => days >= hypixelRoles[role as keyof typeof hypixelRoles].days,
    ) || "slayer"
  );
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
  currentRole: string,
  roles: { [key: string]: Role },
) {
  for (const role of roleOrder) {
    if (role === "slayer" || role === currentRole) {
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
        const weeklyRole =
          Object.keys(hypixelRoles).find(
            (role) =>
              hypixelRoles[role as keyof typeof hypixelRoles].gexp <=
              member.weeklyGexp,
          ) || "slayer";

        const assignRoleBasedOnDays =
          roleOrder.indexOf(highestDaysRole) > roleOrder.indexOf(weeklyRole);

        const targetRole = assignRoleBasedOnDays ? highestDaysRole : weeklyRole;
        db.prepare("UPDATE guildMembers SET targetRank = ? WHERE uuid = ?").run(
          `[${hypixelRoles[targetRole as HypixelRoleKeys].name}]`,
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

      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`Weekly Roles Update ${prevWeek} - ${previous}`)
        .setDescription(
          `${Object.entries(roleDesc)
            .filter(([role]) => role !== "slayer")
            .filter(([, desc]) => desc.trim() !== "")
            .map(
              ([role, desc]) =>
                `Congrats to the following **${
                  hypixelRoles[role as HypixelRoleKeys].name
                }** members:${desc}`,
            )
            .join(
              "\n\n",
            )}\n\n**Detailed stats can be found in https://dominance.cf/sheets**`,
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
    if (!guild) return;

    ensureDayExists(getESTDate());

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

      db.prepare(
        `UPDATE gexpHistory SET ("${currentDay}") = (?) WHERE uuid = ?`,
      ).run(currentDailyExp ?? 0, uuid);
    }

    const hypixelMemberUuids = guild.members.map((member) => member.uuid);

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
        .prepare("SELECT * FROM guildMembers")
        .all() as HypixelGuildMember[];
      const guild = await hypixel
        .getGuild("name", "Dominance")
        .catch(() => null);
      if (!guild) return;

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
            (m) => m.uuid === memberWithExpHistory.uuid,
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

          const { name, discord, nameColor, targetRank, ...rest } =
            memberWithExpHistory;

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

      array.sort((a, b) => {
        if (typeof a[4] === "number" && typeof b[4] === "number") {
          return b[4] - a[4];
        }
        return 0;
      });

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
      } catch (error) {}
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
    slayer: getRole(config.roles.slayer),
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
      const members = Array.from(roles.slayer.members).concat(
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
          await member[1].roles.remove(guildMemberRoles);
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

    const inGameRole = data.tag.replace(/[\[\]]/g, "");
    const targetRole = data.targetRank?.slice(1, -1) ?? "";

    const player = await hypixel.getPlayer(data.uuid).catch(() => null);
    if (!player) return;

    const bwFkdr = +(player.stats?.bedwars?.finalKDRatio.toFixed(1) ?? 0);
    const bwStars = player.stats?.bedwars?.level ?? 0;
    const duelsWins = player.stats?.duels?.wins ?? 0;
    const duelsWlr = +(player.stats?.duels?.WLRatio.toFixed(1) ?? 0);

    let networth = 0;
    let sbSkillAverage = 0;
    let sbLevel = 0;
    const sbMember = (
      await hypixel.getSkyblockProfiles(player.uuid).catch(() => null)
    )?.find((profile) => profile.selected)?.me;
    if (sbMember) {
      networth = (await sbMember.getNetworth()).networth ?? 0;
      sbSkillAverage = sbMember.skills.average;
      sbLevel = sbMember.level;
    }

    if (
      data.targetRank &&
      !["[Moderator]", "[Owner]", "[GUILDMASTER]"].includes(data.tag) &&
      data.targetRank !== data.tag
    ) {
      const ign = await uuidToName(data.uuid);
      if (data.targetRank === "[Hero]") {
        chat(`/g promote ${ign}`);
      } else if (data.targetRank === "[Elite]") {
        if (data.tag === "[Slayer]") {
          chat(`/g promote ${ign}`);
        } else if (data.tag === "[Hero]") {
          chat(`/g demote ${ign}`);
        }
      } else if (data.targetRank === "[Slayer]") {
        chat(`/g demote ${ign}`);
      } else if (["[Slayer]", "[Elite]"].includes(data.tag)) {
        chat(`/g promote ${ign}`);
      }
    } else if (!data.targetRank && ["Elite", "Hero"].includes(inGameRole)) {
      const ign = await uuidToName(data.uuid);
      chat(`/g demote ${ign}`);
    }

    if (data.discord) {
      let member: GuildMember | undefined;
      try {
        member = await guild.members.fetch(data.discord);
      } catch (e) {
        await archiveMember(null, data.discord);
        return;
      }

      // Bedwars roles
      const bwRole = bwPrestiges[Math.floor(bwStars / 100) * 100];
      for (const roleId of Object.values(bwPrestiges)) {
        if (member.roles.cache.has(roleId) && roleId !== bwRole) {
          await member.roles.remove(roleId);
        }
      }
      if (bwRole) {
        await member.roles.add(bwRole);
      }

      if (!["[Owner]", "[GUILDMASTER]"].includes(data.tag)) {
        await setDiscordNicknames(member, player.nickname);
      }

      const memberRoles = member.roles.cache.map((role) => role.id);

      if (!memberRoles.includes(config.roles.slayer)) {
        await member.roles.add(roles.slayer);
      }

      if (!memberRoles.includes(config.roles.unverified)) {
        await member.roles.remove(roles.unverified);
      }

      if (targetRole) {
        await assignMemberRoles(member, targetRole.toLowerCase(), roles);
      }

      await assignDaysRoles(member, getDaysInGuild(data.joined, data.baseDays));
    }

    const swLevel = player.stats?.skywars?.level ?? 0;
    const { achievementPoints, level } = player;
    const quests = player.achievements["generalQuestMaster"] as number;
    const bridgeWins = player.stats?.duels?.bridge.wins ?? 0;
    const bridgeWlr =
      (player.stats?.duels?.bridge.wins ?? 0) /
      (player.stats?.duels?.bridge.losses ?? 0);
    const mmWins = player.stats?.murdermystery?.wins ?? 0;
    const pitPrestige = player.stats?.pit?.prestige ?? 0;

    db.prepare(
      "UPDATE guildMembers SET (nameColor, reqs, bwStars, bwFkdr, duelsWins, duelsWlr, networth, skillAverage, swLevel, achievementPoints, networkLevel, sbLevel, quests, bridgeWins, bridgeWlr, mmWins, pitPrestige) = (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) WHERE uuid = ?",
    ).run(
      rankTagF(player) ?? "",
      (await checkRequirements(data.uuid, player)) ? 1 : 0,
      bwStars,
      bwFkdr,
      duelsWins,
      duelsWlr,
      Math.round(networth * 100) / 100,
      Math.round(sbSkillAverage * 100) / 100,
      swLevel,
      achievementPoints,
      level,
      sbLevel,
      quests,
      bridgeWins,
      bridgeWlr,
      mmWins,
      pitPrestige,
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
