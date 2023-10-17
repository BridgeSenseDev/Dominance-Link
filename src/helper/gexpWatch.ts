import { schedule } from 'node-cron';
import { EmbedBuilder } from 'discord.js';
import Database from 'better-sqlite3';
import config from '../config.json' assert { type: 'json' };
import { textChannels } from '../events/discord/ready.js';
import { doubleDigits, formatNumber, sleep } from './utils.js';
import { NumberObject, StringObject } from '../types/global.d.js';
import { fetchGuildByName } from '../api.js';
import { chat } from '../handlers/workerHandler.js';

const db = new Database('guild.db');

interface GuildWatch {
  date: string;
  gexp: number;
  separation: number;
  gained: number;
}

function gexpGained(gained: number): [string, number] {
  if (gained >= 0) {
    return ['<:up1:969182381485482064> Gained', config.colors.green];
  }
  return ['<:down:969182381162500097> Lost', config.colors.red];
}

// Format "DD/MM/YYYY"
function getPreviousDate(date: string) {
  const currentDate = new Date(date.split('/').reverse().join('-'));
  currentDate.setDate(currentDate.getDate() - 1);
  return `${doubleDigits(currentDate.getDate())}/${doubleDigits(
    currentDate.getMonth() + 1
  )}/${currentDate.getFullYear()}`;
}

function ensureDataForDate(date: string, guild: string) {
  let currentDate = date;
  let existingData = db.prepare(`SELECT * FROM ${guild}Watch WHERE date = ?`).get(currentDate) as GuildWatch;

  // Loop backward until it finds the most recent filled-in date
  while (!existingData) {
    currentDate = getPreviousDate(currentDate);
    existingData = db.prepare(`SELECT * FROM ${guild}Watch WHERE date = ?`).get(currentDate) as GuildWatch;
  }

  db.prepare(`INSERT OR IGNORE INTO ${guild}Watch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)`).run(
    date,
    existingData.gexp,
    existingData.separation,
    0
  );
}

export async function gexpWatch() {
  schedule('00 50 11 * * 0-6', async () => {
    const guildThumbnails: StringObject = {
      rebel: `https://cdn.discordapp.com/attachments/986281342457237624/1001705614264778803/a_96a019775f60ebe70d0e5ea3d762ff57.webp`,
      cronos: `https://cdn.discordapp.com/attachments/986281342457237624/1001839326033879080/ezgif-1-9402e80289.png`,
      dawns: `https://cdn.discordapp.com/icons/406305465341837313/bdabc7a8bd14a701e104ec9800c12fd1.webp?size=4096&width=656&height=656`,
      abyss: `https://cdn.discordapp.com/icons/549722930251300865/a_581a4ba9007bfc5b62d27e4bd89a0d67.webp?size=4096&width=656&height=656`,
      lucid: `https://cdn.discordapp.com/avatars/1014274693596983326/9d5bddb15cd0b0ef69035198f1d68914.webp?size=4096&width=656&height=656`
    };
    const guildNames: StringObject = {
      dominance: 'Dominance',
      rebel: 'Rebel',
      cronos: 'Sailor Moon',
      dawns: 'The Dawns Awakening',
      abyss: 'The Abyss',
      lucid: 'Lucid'
    };
    const guildGexp: NumberObject = {};

    for (const i in guildNames) {
      const guildResponse = await fetchGuildByName(guildNames[i]);
      if (guildResponse.success && guildResponse.guild) {
        guildGexp[i] = guildResponse.guild.exp;
      }
    }

    const date = new Date();
    const today = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 1);
    const previous = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 6);
    const prevWeek = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 23);
    const prevMonth = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    const unix = Math.floor(Date.now() / 1000);
    const embeds = [];

    // Dominance
    ensureDataForDate(previous, 'dominance');
    let gained =
      guildGexp.dominance -
      (db.prepare('SELECT gexp FROM dominanceWatch WHERE date = ?').get(previous) as GuildWatch).gexp;
    db.prepare('INSERT OR IGNORE INTO dominanceWatch (date, gexp, gained) VALUES (?, ?, ?)').run(
      today,
      guildGexp.dominance,
      gained
    );

    for (const guildName in guildGexp) {
      if (guildName === 'dominance') {
        continue;
      }

      ensureDataForDate(previous, guildName);
      const daily = (db.prepare(`SELECT separation FROM ${guildName}Watch WHERE date=?`).get(previous) as GuildWatch)
        .separation;

      ensureDataForDate(prevWeek, guildName);
      const weekly = (db.prepare(`SELECT separation FROM ${guildName}Watch WHERE date=?`).get(prevWeek) as GuildWatch)
        .separation;

      ensureDataForDate(prevMonth, guildName);
      const monthly = (db.prepare(`SELECT separation FROM ${guildName}Watch WHERE date=?`).get(prevMonth) as GuildWatch)
        .separation;

      const difference = guildGexp.dominance - guildGexp[guildName];
      gained = difference - daily;
      db.prepare(`INSERT OR IGNORE INTO ${guildName}Watch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)`).run(
        today,
        guildGexp[guildName],
        difference,
        gained
      );
      embeds.push(
        new EmbedBuilder()
          .setColor(gexpGained(gained)[1])
          .setTitle(
            `We are ${difference.toLocaleString()} GEXP ahead of ${
              guildName.charAt(0).toUpperCase() + guildName.slice(1)
            }`
          )
          .setDescription(
            `${gexpGained(gained)[0]} **${Math.abs(
              gained
            ).toLocaleString()}** GEXP\n<:clock_:969185417712775168> Recorded <t:${unix}:R>`
          )
          .addFields(
            {
              name: '<:week:982237517233414194> Weekly',
              value: `${gexpGained(difference - weekly)[0]} **${Math.abs(difference - weekly).toLocaleString()}** GEXP`,
              inline: true
            },
            {
              name: '<:calendar_3d:1029713106550657055> Monthly',
              value: `${gexpGained(difference - monthly)[0]} **${Math.abs(
                difference - monthly
              ).toLocaleString()}** GEXP`,
              inline: true
            }
          )
          .setThumbnail(guildThumbnails[guildName])
      );
    }
    await textChannels.guildWatch.send({ embeds });
  });
}

export async function gexpUpdate() {
  schedule('0 * * * *', async () => {
    const dominanceResponse = await fetchGuildByName('Dominance');
    const rebelResponse = await fetchGuildByName('Rebel');

    if (!rebelResponse.success || !dominanceResponse.success) {
      return;
    }

    if (!dominanceResponse.guild?.exp || !rebelResponse.guild?.exp) {
      return;
    }

    const dominanceGexp = dominanceResponse.guild.exp;
    const rebelGexp = rebelResponse.guild.exp;
    const gained = dominanceGexp - rebelGexp - (global.dominanceGexp - global.rebelGexp);
    const absoluteGained = Math.abs(gained);
    const gainedText = gained >= 0 ? 'gained' : 'lost';
    const difference = dominanceGexp - rebelGexp;
    const absoluteDifference = Math.abs(difference);
    const differenceText = difference >= 0 ? 'ahead of' : 'behind';

    await chat(`/gc We earned ${formatNumber(dominanceGexp - global.dominanceGexp)} GEXP in the past hour`);
    await sleep(1000);
    await chat(
      `/gc We ${gainedText} ${formatNumber(absoluteGained)} GEXP over rebel and are now ${formatNumber(
        absoluteDifference
      )} GEXP ${differenceText} them`
    );

    global.dominanceGexp = dominanceGexp;
    global.rebelGexp = rebelGexp;
  });
}
