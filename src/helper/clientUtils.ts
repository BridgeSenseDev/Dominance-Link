import Database from "better-sqlite3";
import { demojify } from "discord-emoji-converter";
import {
  EmbedBuilder,
  type Message,
  type TextChannel,
  type ThreadChannel,
} from "discord.js";
import type { Player } from "hypixel-api-reborn";
import config from "../config.json" assert { type: "json" };
import { fetchGuildMember, fetchMember } from "../handlers/databaseHandler.js";
import client from "../index";
import type {
  BreakMember,
  StringObject,
  WaitlistMember,
} from "../types/global.js";
import { rankColor } from "./constants.js";

const db = new Database("guild.db");

export async function nameToUuid(name: string): Promise<string | null> {
  try {
    return (
      await (
        await fetch(`https://playerdb.co/api/player/minecraft/${name}`)
      ).json()
    ).data.player.raw_id;
  } catch (e) {
    try {
      return (
        await (
          await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
        ).json()
      ).id;
    } catch (err) {
      return null;
    }
  }
}

export async function uuidToName(uuid: string): Promise<string | null> {
  try {
    return (
      await (
        await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`)
      ).json()
    ).data.player.username;
  } catch (e) {
    try {
      return (
        await (
          await fetch(`https://api.mojang.com/user/profile/${uuid}`)
        ).json()
      ).name;
    } catch (err) {
      return null;
    }
  }
}

export async function formatMentions(message: Message) {
  let msg = message.content;
  const guild = message.guild;

  if (msg.includes("<@") && msg.includes(">") && !msg.includes("<@&")) {
    const mentions = msg.match(/<@!?\d+>/g);
    const members = await guild?.members.fetch();
    if (mentions) {
      for (const mention of mentions) {
        const user = members?.get(mention.replace(/[^0-9]/g, ""));
        if (user) {
          msg = msg.replace(mention, `@${user.user.username}`);
        } else {
          msg = msg.replace(mention, "@Unknown User");
        }
      }
    }
  }

  if (msg.includes("<@&") && msg.includes(">")) {
    const mentions = msg.match(/<@&\d+>/g);
    const roles = await guild?.roles.fetch();
    if (mentions) {
      for (const mention of mentions) {
        const role = roles?.get(mention.replace(/[^0-9]/g, ""));
        if (role) {
          msg = msg.replace(mention, `@${role.name}`);
        } else {
          msg = msg.replace(mention, "@Unknown Role");
        }
      }
    }
  }

  if (msg.includes("<#") && msg.includes(">")) {
    const mentions = msg.match(/<#\d+>/g);
    if (mentions) {
      for (const mention of mentions) {
        msg = msg.replace(
          mention,
          `#${
            guild?.channels.cache.get(mention.replace(/[^0-9]/g, ""))?.name ||
            "deleted-channel"
          }`,
        );
      }
    }
  }

  if ((msg.includes("<a:") || msg.includes("<:")) && msg.includes(">")) {
    const emojis = [
      ...(msg.match(/<a:\w+:\d+>/g) || []),
      ...(msg.match(/<:\w+:\d+>/g) || []),
    ];
    for (const emoji of emojis) {
      const emojiName = emoji
        .replace(/[0-9]/g, "")
        .replace(/<a:/g, "")
        .replace(/:>/g, "")
        .replace(/<:/g, "");
      msg = msg.replace(emoji, `:${emojiName}:`);
    }
  }

  try {
    return demojify(msg);
  } catch (e) {
    return msg;
  }
}

export function getLevel(exp: number) {
  const expNeeded = [
    100000, 150000, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000,
    2500000, 2500000, 2500000, 2500000, 2500000, 3000000,
  ];
  let level = 0;
  let currentExp = exp; // Create a local variable to hold the current experience

  for (let i = 0; i <= 1000; i++) {
    let need = 0;
    if (i >= expNeeded.length) {
      need = expNeeded[expNeeded.length - 1];
    } else {
      need = expNeeded[i];
    }

    if (currentExp - need < 0) {
      return Math.round((level + currentExp / need) * 100) / 100;
    }

    level++;
    currentExp -= need; // Modify the local variable instead of the parameter
  }
  return 1000;
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function removeSectionSymbols(message: string) {
  let modifiedMessage = message;
  let pos = modifiedMessage.indexOf("\u00A7");
  while (pos !== -1) {
    modifiedMessage =
      modifiedMessage.slice(0, pos) + modifiedMessage.slice(pos + 1);
    modifiedMessage =
      modifiedMessage.slice(0, pos) + modifiedMessage.slice(pos + 1);
    pos = modifiedMessage.indexOf("\u00A7");
  }
  return modifiedMessage;
}

export function formatNumber(number: number) {
  if (!number) {
    return 0;
  }

  let formattedNumber: string;

  if (number % 1 !== 0) {
    const roundedNumber = Number.parseFloat(number.toPrecision(3));
    formattedNumber = roundedNumber.toString();
  } else {
    formattedNumber = number.toString();
  }

  return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function abbreviateNumber(number: number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

export function doubleDigits(number: number) {
  if (number.toString().length === 1) {
    return `0${number}`;
  }
  return number;
}

export async function addXp(discordId = "", ign = "") {
  if (!discordId) {
    const uuid = await nameToUuid(ign);
    if (!uuid) {
      return;
    }
    if (uuid in global.lastMessage) {
      if (Date.now() / 1000 - Number(global.lastMessage[uuid]) >= 60) {
        db.prepare("UPDATE members SET xp = xp + ? WHERE uuid = ?").run(
          Math.floor(Math.random() * 11 + 15),
          uuid,
        );
        global.lastMessage[uuid] = Math.floor(Date.now() / 1000).toString();
      }
    } else {
      db.prepare("UPDATE members SET xp = xp + ? WHERE uuid = ?").run(
        Math.floor(Math.random() * 11 + 15),
        uuid,
      );
      global.lastMessage[uuid] = Math.floor(Date.now() / 1000).toString();
    }
    return;
  }

  db.prepare(
    "UPDATE members SET (messages) = messages + 1 WHERE discord = (?)",
  ).run(discordId);
  if (discordId in global.lastMessage) {
    if (Date.now() / 1000 - Number(global.lastMessage[discordId]) >= 60) {
      db.prepare("UPDATE members SET xp = xp + ? WHERE discord = ?").run(
        Math.floor(Math.random() * 11 + 15),
        discordId,
      );
      global.lastMessage[discordId] = Math.floor(Date.now() / 1000).toString();
    }
  } else {
    db.prepare("UPDATE members SET xp = xp + ? WHERE discord = ?").run(
      Math.floor(Math.random() * 11 + 15),
      discordId,
    );
    global.lastMessage[discordId] = Math.floor(Date.now() / 1000).toString();
  }
}

export function timeStringToSeconds(time: string) {
  const timeValue = Number.parseInt(time, 10) * 1000;
  if (Number.isNaN(timeValue)) {
    return null;
  }
  switch (time.charAt(time.length - 1)) {
    case "s":
      return timeValue;
    case "m":
      return timeValue * 60;
    case "h":
      return timeValue * 60 * 60;
    case "d":
      return timeValue * 60 * 60 * 24;
    default:
      return null;
  }
}

export function uuidToDiscord(uuid: string): string | null {
  const member = fetchMember(uuid);
  if (member) {
    return member.discord;
  }
  return null;
}

export function discordToUuid(discordId: string): string | null {
  const member = fetchMember(discordId);
  if (member) {
    return member.uuid;
  }
  return null;
}

export function hypixelApiError(cause: string) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle("Hypixel API Error")
        .setDescription(
          `Couldn't get a response from the API\nCause: \`${cause}\``,
        ),
    ],
  };
}

export function toCamelCase(str: string): string {
  return str
    .replace(/^\w|[A-Z]|\b\w/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, "");
}

export function getLevelDetails(totalXP: number) {
  let level = 0;
  let currentXP = totalXP;
  let xpForNextLevel: number;
  for (
    xpForNextLevel = 5 * level ** 2 + 50 * level + 100;
    currentXP >= xpForNextLevel;
    xpForNextLevel = 5 * level ** 2 + 50 * level + 100
  ) {
    currentXP -= xpForNextLevel;
    level++;
  }
  const xpForCurrentLevel = currentXP;
  const xpTillNextLevel = xpForNextLevel - xpForCurrentLevel;

  return {
    currentLevel: level,
    xpInCurrentLevel: xpForCurrentLevel,
    xpTillNextLevel,
  };
}

export function rankTagF(player: Player) {
  if (!player) {
    return "";
  }

  if (player.rank === "Default") {
    return `§7${player.nickname}`;
  }
  if (player.rank === "VIP") {
    return `§a[VIP] ${player.nickname}`;
  }
  if (player.rank === "VIP+") {
    return `§a[VIP§6+§a] ${player.nickname}`;
  }
  if (player.rank === "MVP") {
    return `§b[MVP] ${player.nickname}`;
  }

  const plusColor = rankColor[player.plusColor?.toCode() ?? "RED"];

  if (player.rank === "MVP+") {
    return `§b[MVP${plusColor}+§b] ${player.nickname}`;
  }
  if (player.rank === "MVP++") {
    if (!player.prefixColor || player.prefixColor.toCode() === "GOLD") {
      return `§6[MVP${plusColor}++§6] ${player.nickname}`;
    }
    return `§b[MVP${plusColor}++§b] ${player.nickname}`;
  }
}

export function formatDateForDb(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getESTDate(): Date {
  const date = new Date();
  return new Date(
    date.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
}

export function updateTable(startDate: string, endDate: string) {
  const columns = db
    .prepare("PRAGMA table_info(gexpHistory)")
    .all() as StringObject[];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (const column of columns) {
    const date = column.name;
    if (date === "uuid") continue;
    if (!dateRegex.test(date)) {
      db.exec(`ALTER TABLE gexpHistory DROP COLUMN ${date}`);
    }
  }

  for (
    let currentDate = new Date(startDate);
    currentDate <= new Date(endDate);
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const date = `"${currentDate.toISOString().split("T")[0]}"`;
    if (!columns.some((column) => `"${column.name}"` === date)) {
      db.exec(`ALTER TABLE gexpHistory ADD COLUMN ${date} INTEGER`);
      db.exec(`ALTER TABLE gexpHistoryArchives ADD COLUMN ${date} INTEGER`);
    }
  }
}

function isValidUUID(uuid: string) {
  const uuidRegex =
    /([0-9a-f]{8})(?:-|)([0-9a-f]{4})(?:-|)(4[0-9a-f]{3})(?:-|)([89ab][0-9a-f]{3})(?:-|)([0-9a-f]{12})/;
  return uuidRegex.test(uuid);
}

export async function isStaff(identifier: string) {
  const uuid = isValidUUID(identifier)
    ? identifier
    : await nameToUuid(identifier);
  if (!uuid) return false;
  const guildMember = fetchGuildMember(uuid);
  if (!guildMember) return false;
  return ["[GUILDMASTER]", "[Owner]", "[Staff]"].includes(guildMember.tag);
}

export function generateHeadUrl(uuid: string, name: string) {
  return `https://heads.discordsrv.com/head.png?uuid=${uuid}&name=${name}&overlay`;
}

export function getDaysInGuild(joined: string, baseDays: number) {
  const daysSinceJoin =
    (new Date().getTime() - new Date(Number.parseInt(joined, 10)).getTime()) /
    (1000 * 3600 * 24);
  return daysSinceJoin + baseDays;
}

export function getMemberRejoinChannel(uuid: string) {
  const waitlist = db
    .prepare("SELECT discord, channel FROM waitlist WHERE uuid = ?")
    .get(uuid) as WaitlistMember | null;
  const breaks = db
    .prepare("SELECT discord, thread FROM breaks WHERE uuid = ?")
    .get(uuid) as BreakMember | null;

  if (waitlist) {
    return {
      channel: client.channels.cache.get(waitlist.channel) as TextChannel,
      mention: `<@${waitlist.discord}>`,
    };
  }
  if (breaks) {
    return {
      channel: client.channels.cache.get(breaks.thread) as ThreadChannel,
      mention: `<@${breaks.discord}>`,
    };
  }
  return { channel: undefined, mention: undefined };
}
