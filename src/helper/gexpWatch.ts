import Database from "bun:sqlite";
import { EmbedBuilder } from "discord.js";
import { schedule } from "node-cron";
import config from "../config.json" with { type: "json" };
import { textChannels } from "../events/discord/ready.js";
import { hypixel } from "../index.js";
import type { NumberObject, StringObject } from "../types/global";
import { doubleDigits, toCamelCase } from "./clientUtils.js";

const db = new Database("guild.db");

interface GuildWatch {
  date: string;
  gexp: number;
  separation: number;
  gained: number;
}

function gexpGained(gained: number): [string, number] {
  if (gained >= 0) {
    return [`${config.emojis.up} Gained`, config.colors.green];
  }
  return [`${config.emojis.down} Lost`, config.colors.red];
}

// Format "DD/MM/YYYY"
function getPreviousDate(date: string) {
  const currentDate = new Date(date.split("/").reverse().join("-"));
  currentDate.setDate(currentDate.getDate() - 1);
  return `${doubleDigits(currentDate.getDate())}/${doubleDigits(
    currentDate.getMonth() + 1,
  )}/${currentDate.getFullYear()}`;
}

function ensureDataForDate(date: string, guild: string) {
  let currentDate = date;
  let existingData = db
    .prepare(`SELECT * FROM ${guild}Watch WHERE date = ?`)
    .get(currentDate) as GuildWatch;

  // Loop backward until it finds the most recent filled-in date
  while (!existingData) {
    currentDate = getPreviousDate(currentDate);
    existingData = db
      .prepare(`SELECT * FROM ${guild}Watch WHERE date = ?`)
      .get(currentDate) as GuildWatch;
  }

  db.prepare(
    `INSERT OR IGNORE INTO ${guild}Watch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)`,
  ).run(date, existingData.gexp, existingData.separation, 0);
}

export default async function gexpWatch() {
  schedule(
    "00 55 12 * * 0-6",
    async () => {
      const guildThumbnails: StringObject = {
        rebel:
          "https://cdn.discordapp.com/attachments/986281342457237624/1001705614264778803/a_96a019775f60ebe70d0e5ea3d762ff57.webp",
        sailorMoon:
          "https://cdn.discordapp.com/attachments/986281342457237624/1001839326033879080/ezgif-1-9402e80289.png",
        dawns:
          "https://cdn.discordapp.com/icons/406305465341837313/bdabc7a8bd14a701e104ec9800c12fd1.webp?size=4096&width=656&height=656",
        lucid:
          "https://cdn.discordapp.com/avatars/1014274693596983326/9d5bddb15cd0b0ef69035198f1d68914.webp?size=4096&width=656&height=656",
        leman:
          "https://cdn.discordapp.com/icons/672088522852663297/3764b2ec1103bcb8d1f034791d4be16b.webp?size=4096&width=656&height=656",
      };
      const guildNames: StringObject = {
        dominance: "Dominance",
        rebel: "Rebel",
        sailorMoon: "Sailor Moon",
        dawns: "The Dawns Awakening",
        lucid: "Lucid",
        leman: "Leman",
      };
      const guildGexp: NumberObject = {};

      for (const i in guildNames) {
        const guildResponse = await hypixel.getGuild("name", guildNames[i], {});
        guildGexp[i] = guildResponse.experience;
      }

      const date = new Date();
      const today = `${doubleDigits(date.getDate())}/${doubleDigits(
        date.getMonth() + 1,
      )}/${date.getFullYear()}`;
      date.setDate(date.getDate() - 1);
      const previous = `${doubleDigits(date.getDate())}/${doubleDigits(
        date.getMonth() + 1,
      )}/${date.getFullYear()}`;
      date.setDate(date.getDate() - 6);
      const prevWeek = `${doubleDigits(date.getDate())}/${doubleDigits(
        date.getMonth() + 1,
      )}/${date.getFullYear()}`;
      date.setDate(date.getDate() - 23);
      const prevMonth = `${doubleDigits(date.getDate())}/${doubleDigits(
        date.getMonth() + 1,
      )}/${date.getFullYear()}`;
      const unix = Math.floor(Date.now() / 1000);
      const embeds = [];

      // Dominance
      ensureDataForDate(previous, "dominance");
      let gained =
        guildGexp["dominance"] -
        (
          db
            .prepare("SELECT gexp FROM dominanceWatch WHERE date = ?")
            .get(previous) as GuildWatch
        ).gexp;
      db.prepare(
        "INSERT OR IGNORE INTO dominanceWatch (date, gexp, gained) VALUES (?, ?, ?)",
      ).run(today, guildGexp["dominance"], gained);

      for (const guildName in guildGexp) {
        if (guildName === "dominance") {
          continue;
        }

        ensureDataForDate(previous, guildName);
        const daily = (
          db
            .prepare(`SELECT separation FROM ${guildName}Watch WHERE date=?`)
            .get(previous) as GuildWatch
        ).separation;

        ensureDataForDate(prevWeek, guildName);
        const weekly = (
          db
            .prepare(`SELECT separation FROM ${guildName}Watch WHERE date=?`)
            .get(prevWeek) as GuildWatch
        ).separation;

        ensureDataForDate(prevMonth, guildName);
        const monthly = (
          db
            .prepare(`SELECT separation FROM ${guildName}Watch WHERE date=?`)
            .get(prevMonth) as GuildWatch
        ).separation;

        const difference = guildGexp["dominance"] - guildGexp[guildName];
        gained = difference - daily;
        db.prepare(
          `INSERT OR IGNORE INTO ${guildName}Watch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)`,
        ).run(today, guildGexp[guildName], difference, gained);

        embeds.push(
          new EmbedBuilder()
            .setColor(gexpGained(gained)[1])
            .setTitle(
              `We are ${difference.toLocaleString()} GEXP ahead of ${toCamelCase(
                guildName,
              )}`,
            )
            .setDescription(
              `${gexpGained(gained)[0]} **${Math.abs(
                gained,
              ).toLocaleString()}** GEXP\n${
                config.emojis.clock
              } Recorded <t:${unix}:R>`,
            )
            .addFields(
              {
                name: `${config.emojis.week} Weekly`,
                value: `${gexpGained(difference - weekly)[0]} **${Math.abs(
                  difference - weekly,
                ).toLocaleString()}** GEXP`,
                inline: true,
              },
              {
                name: `${config.emojis.calendar3d} Monthly`,
                value: `${gexpGained(difference - monthly)[0]} **${Math.abs(
                  difference - monthly,
                ).toLocaleString()}** GEXP`,
                inline: true,
              },
            )
            .setThumbnail(guildThumbnails[guildName]),
        );
      }
      await textChannels["guildWatch"].send({ embeds });
    },
    {
      timezone: "Asia/Hong_Kong",
    },
  );
}
