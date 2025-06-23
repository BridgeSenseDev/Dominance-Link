import Database from "bun:sqlite";
import { promisify } from "node:util";
import { google } from "googleapis";
import config from "../config.json" with { type: "json" };
import { fetchGexpForMember } from "../handlers/databaseHandler.ts";
import {
  type MessageObject,
  chat,
  waitForMessage,
} from "../handlers/workerHandler.ts";
import { hypixel } from "../index.ts";
import type { NumberObject, StringObject } from "../types/global";
import type {
  ICommentsAnalyzeRequest,
  ICommentsAnalyzeResponse,
  ICommentsApi,
} from "../types/perspective.ts";
import {
  formatDateForDb,
  getDaysInGuild,
  sleep,
  updateTable,
  uuidToName,
} from "./clientUtils.js";
import messageToImage from "./messageToImage.ts";

const db = new Database("guild.db");

export function formatDate(dateObj: Date) {
  let suffix: string;
  const date = dateObj.getDate();
  switch (date % 10) {
    case 1:
      suffix = "st";
      break;
    case 2:
      suffix = "nd";
      break;
    case 3:
      suffix = "rd";
      break;
    default:
      suffix = "th";
  }
  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][dateObj.getMonth()];
  return `${date + suffix} ${month} ${dateObj.getFullYear()}`;
}

export function ensureDayExists(day: Date) {
  const tableInfo = db
    .prepare("PRAGMA table_info(gexpHistory)")
    .all() as StringObject[];
  const columnExists = tableInfo.some(
    (column) => column["name"] === formatDateForDb(day),
  );

  if (!columnExists) {
    db.prepare(
      `ALTER TABLE gexpHistory ADD COLUMN "${formatDateForDb(
        day,
      )}" INTEGER DEFAULT 0`,
    ).run();
    db.prepare(
      `ALTER TABLE gexpHistoryArchives ADD COLUMN "${formatDateForDb(
        day,
      )}" INTEGER`,
    ).run();
  }

  updateTable("2022-10-17", formatDateForDb(day));
}

export async function getProfanityScores(message: string) {
  let filteredMessage: string = message;

  filteredMessage = filteredMessage.replace(/\*([^*]+)\*/g, "$1");

  const connectClient = async () =>
    (
      await google.discoverAPI(
        "https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1",
      )
    )["comments"] as ICommentsApi;

  const analyzeRequest: ICommentsAnalyzeRequest = {
    comment: {
      text: filteredMessage,
    },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
      SEXUALLY_EXPLICIT: {},
    },
  };

  const client = await connectClient();
  const analyze = promisify(client.analyze);

  let response: ICommentsAnalyzeResponse;
  try {
    response = await analyze({
      key: config.keys.googleCloud,
      resource: analyzeRequest,
    });
  } catch (e) {
    return null;
  }

  const { attributeScores } = response.data;
  return attributeScores;
}

export const limits: NumberObject = {
  TOXICITY: 0.85,
  SEVERE_TOXICITY: 0.5,
  IDENTITY_ATTACK: 0.6,
  INSULT: 0.8,
  PROFANITY: 0.7,
  THREAT: 0.8,
  SEXUALLY_EXPLICIT: 0.8,
  OBSCENE: 0.8,
};

export async function checkProfanity(message: string) {
  const attributeScores = await getProfanityScores(message);
  if (!attributeScores) {
    return false;
  }

  for (const attribute in attributeScores) {
    const attributeScore =
      attributeScores[attribute as keyof typeof attributeScores];
    if (
      attributeScore &&
      "summaryScore" in attributeScore &&
      attributeScore.summaryScore.value >
        limits[attribute as keyof typeof attributeScores]
    ) {
      return true;
    }
  }

  return false;
}

export function generateID(length: number) {
  let result = "";

  const characters = "abcde0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function timeAgo(input: Date | number) {
  const date = input instanceof Date ? input : new Date(input);

  const ranges: { [key: string]: number } = {
    years: 3600 * 24 * 365,
    months: 3600 * 24 * 30,
    weeks: 3600 * 24 * 7,
    days: 3600 * 24,
    hours: 3600,
    minutes: 60,
    seconds: 1,
  };

  const secondsElapsed = (date.getTime() - Date.now()) / 1000;

  for (const key in ranges) {
    const rangeInSeconds = ranges[key as keyof typeof ranges];

    if (Math.abs(secondsElapsed) >= rangeInSeconds) {
      const delta = secondsElapsed / rangeInSeconds;
      const unitAbbreviation = key.charAt(0);
      return `${Math.round(Math.abs(delta))}${unitAbbreviation} ago`;
    }
  }
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export async function generateGuildAnnouncement(
  message: string,
  color: string,
) {
  return await messageToImage(
    `§${color}-------------------------------------------------------------§r${message}§${color}-------------------------------------------------------------`,
  );
}

export function camelCaseToWords(s: string) {
  const result = s.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

async function kickPlayer() {
  const guild = await hypixel.getGuild("name", "Dominance");

  const membersSorted = guild.members
    .filter(
      (member) =>
        !["Owner", "GUILDMASTER"].includes(member.rank) &&
        getDaysInGuild(member.joinedAtTimestamp.toString(), 0) >= 7,
    )
    .sort((a, b) => a.weeklyExperience - b.weeklyExperience);

  const breakUuids: string[] = [];
  for (const breakMember of db.prepare("SELECT uuid FROM breaks").all() as [
    { uuid: string },
  ]) {
    breakUuids.push(breakMember.uuid);
  }

  for (const member of membersSorted.slice(0, 5)) {
    if (breakUuids.includes(member.uuid)) {
      chat(
        `/g kick ${await uuidToName(member.uuid)} Break. Check the #break channel in discord to rejoin when ready!`,
      );
      return;
    }
  }

  const nonStaffLowestMonthly = membersSorted
    .filter(
      (member) =>
        member.rank !== "Moderator" && !breakUuids.includes(member.uuid),
    )
    .slice(0, 5)
    .sort(
      (a, b) =>
        fetchGexpForMember(a.uuid).monthlyGexp -
        fetchGexpForMember(b.uuid).monthlyGexp,
    );

  for (const member of nonStaffLowestMonthly) {
    chat(
      `/g kick ${await uuidToName(member.uuid)} Least active player. You can reapply once active again!`,
    );
  }
}

export async function handleGuildInvite(
  name: string,
  retry = false,
): Promise<MessageObject | null> {
  chat(`/g invite ${name}`);

  const receivedMessage = await waitForMessage(
    [
      "to your guild. They have 5 minutes to accept.",
      "You cannot invite this player to your guild!",
      "They will have 5 minutes to accept once they come online!",
      "is already in another guild!",
      "is already in your guild!",
      "to your guild! Wait for them to accept!",
      `Can't find a player by the name of '${name}'`,
      "Your guild is full!",
    ],
    7000,
  );

  if (retry && receivedMessage?.string.includes("Your guild is full!")) {
    await kickPlayer();
    await sleep(2000);
    return handleGuildInvite(name);
  }

  return receivedMessage;
}
