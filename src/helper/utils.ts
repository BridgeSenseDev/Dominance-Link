import Database from "bun:sqlite";
import { promisify } from "node:util";
import { google } from "googleapis";
import config from "../config.json" with { type: "json" };
import type { NumberObject, StringObject } from "../types/global";
import { formatDateForDb, updateTable } from "./clientUtils.js";

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
    (column) => column.name === formatDateForDb(day),
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
    ).comments as ICommentsApi;

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

export async function checkProfanity(message: string) {
  const limits: NumberObject = {
    TOXICITY: 0.7,
    SEVERE_TOXICITY: 0.5,
    IDENTITY_ATTACK: 0.6,
    INSULT: 0.8,
    PROFANITY: 0.7,
    THREAT: 0.8,
    SEXUALLY_EXPLICIT: 0.8,
    OBSCENE: 0.8,
  };

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
