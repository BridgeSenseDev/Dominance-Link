import { schedule } from 'node-cron';
import { EmbedBuilder } from 'discord.js';
import Database from 'better-sqlite3';
import config from '../config.json' assert { type: 'json' };
import { channels } from '../events/discord/ready.js';
import { doubleDigits, hypixelRequest } from './utils.js';
import { NumberObject, StringObject } from '../types/global.d.js';

const db = new Database('guild.db');

function gexpGained(gained: number): [string, number] {
  if (gained >= 0) {
    return ['<:up1:969182381485482064> Gained', config.colors.green];
  }
  return ['<:down:969182381162500097> Lost', config.colors.red];
}

export default async function gexpWatch() {
  schedule('00 50 11 * * 0-6', async () => {
    const guildThumbnails: StringObject = {
      rebel: `https://cdn.discordapp.com/attachments/986281342457237624/1001705614264778803/a_96a019775f60ebe70d0e5ea3d762ff57.webp`,
      cronos: `https://cdn.discordapp.com/attachments/986281342457237624/1001839326033879080/ezgif-1-9402e80289.png`,
      dawns: `https://cdn.discordapp.com/icons/406305465341837313/bdabc7a8bd14a701e104ec9800c12fd1.webp?size=4096&width=656&height=656`,
      abyss: `https://cdn.discordapp.com/icons/549722930251300865/a_581a4ba9007bfc5b62d27e4bd89a0d67.webp?size=4096&width=656&height=656`,
      lucid: `https://cdn.discordapp.com/avatars/1014274693596983326/9d5bddb15cd0b0ef69035198f1d68914.webp?size=4096&width=656&height=656`
    };
    const gexpUrls: StringObject = {
      dominance: `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Dominance`,
      rebel: `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Rebel`,
      cronos: `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Cronos`,
      dawns: `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=The%20Dawns%20Awakening`,
      abyss: `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=The%20Abyss`,
      lucid: `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Lucid`
    };
    const guildGexp: NumberObject = {};
    for (const i in gexpUrls) {
      guildGexp[i] = (await hypixelRequest(gexpUrls[i])).guild.exp;
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
    let gained = guildGexp.dominance - db.prepare('SELECT gexp FROM dominanceWatch WHERE date=?').get(previous).gexp;
    db.prepare('INSERT INTO dominanceWatch (date, gexp, gained) VALUES (?, ?, ?)').run(
      today,
      guildGexp.dominance,
      gained
    );

    for (const i in guildGexp) {
      if (i === 'dominance') {
        continue;
      }
      const daily = db.prepare(`SELECT separation FROM ${i}Watch WHERE date=?`).get(previous).separation;
      const weekly = db.prepare(`SELECT separation FROM ${i}Watch WHERE date=?`).get(prevWeek).separation;
      const monthly = db.prepare(`SELECT separation FROM ${i}Watch WHERE date=?`).get(prevMonth).separation;
      const difference = guildGexp.dominance - guildGexp[i];
      gained = difference - daily;
      db.prepare(`INSERT INTO ${i}Watch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)`).run(
        today,
        guildGexp[i],
        difference,
        gained
      );
      embeds.push(
        new EmbedBuilder()
          .setColor(gexpGained(gained)[1])
          .setTitle(`We are ${difference.toLocaleString()} GEXP ahead of ${i.charAt(0).toUpperCase() + i.slice(1)}`)
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
          .setThumbnail(guildThumbnails[i])
      );
    }
    await channels.guildWatch.send({ embeds });
  });
}
