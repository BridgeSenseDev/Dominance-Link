import { schedule } from 'node-cron';
import { EmbedBuilder } from 'discord.js';
import Database from 'better-sqlite3';
import config from '../config.json' assert { type: 'json' };
import { channels } from '../events/discord/ready.js';
import { doubleDigits } from './utils.js';

const db = new Database('guild.db');

function gexpGained(gained: number): [string, number] {
  let desc;
  let color;
  if (gained >= 0) {
    desc = '<:up1:969182381485482064> Gained';
    color = 0x2ecc70;
  } else {
    desc = '<:down:969182381162500097> Lost';
    color = config.colors.red;
  }
  return [desc, color];
}

export default async function gexpWatch() {
  schedule('00 50 11 * * 0-6', async () => {
    const urls = [
      `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Dominance`,
      `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Cronos`,
      `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Rebel`,
      `https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=The%20Dawns%20Awakening`
    ];
    const guildGexp = [];
    for (let i = 0; i < urls.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      guildGexp.push((await (await fetch(urls[i])).json()).guild.exp);
    }
    const date = new Date();
    const today = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 1);
    const previous = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 6);
    const prevWeek = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 30);
    const prevMonth = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    const unix = Math.floor(Date.now() / 1000);

    // Dominance
    let result = db.prepare('SELECT gexp FROM dominanceWatch WHERE date=?').get(previous).gexp;
    let gained = guildGexp[0] - result;
    db.prepare('INSERT INTO dominanceWatch (date, gexp, gained) VALUES (?, ?, ?)').run(today, guildGexp[0], gained);

    // Rebel
    result = db.prepare('SELECT separation FROM rebelWatch WHERE date=?').get(previous).separation;
    let weekly = db.prepare('SELECT separation FROM rebelWatch WHERE date=?').get(prevWeek).separation;
    let monthly = db.prepare('SELECT separation FROM rebelWatch WHERE date=?').get(prevMonth).separation;
    let difference = guildGexp[0] - guildGexp[2];
    gained = difference - result;
    db.prepare('INSERT INTO rebelWatch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)').run(
      today,
      guildGexp[2],
      difference,
      gained
    );
    const rebelEmbed = new EmbedBuilder()
      .setColor(gexpGained(gained)[1])
      .setTitle(`We are ${difference.toLocaleString()} GEXP ahead of Rebel`)
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
          value: `${gexpGained(difference - monthly)[0]} **${Math.abs(difference - monthly).toLocaleString()}** GEXP`,
          inline: true
        }
      )
      .setThumbnail(
        'https://cdn.discordapp.com/attachments/986281342457237624/1001705614264778803/a_96a019775f60ebe70d0e5ea3d762ff57.webp'
      );

    // Cronos
    result = db.prepare('SELECT separation FROM cronosWatch WHERE date=?').get(previous).separation;
    weekly = db.prepare('SELECT separation FROM cronosWatch WHERE date=?').get(prevWeek).separation;
    monthly = db.prepare('SELECT separation FROM cronosWatch WHERE date=?').get(prevMonth).separation;
    difference = guildGexp[0] - guildGexp[1];
    gained = difference - result;
    db.prepare('INSERT INTO cronosWatch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)').run(
      today,
      guildGexp[1],
      difference,
      gained
    );
    const cronosEmbed = new EmbedBuilder()
      .setColor(gexpGained(gained)[1])
      .setTitle(`We are ${difference.toLocaleString()} GEXP ahead of Cronos`)
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
          value: `${gexpGained(difference - monthly)[0]} **${Math.abs(difference - monthly).toLocaleString()}** GEXP`,
          inline: true
        }
      )
      .setThumbnail(
        'https://cdn.discordapp.com/attachments/986281342457237624/1001839326033879080/ezgif-1-9402e80289.png'
      );

    // Dawns
    result = db.prepare('SELECT separation FROM dawnsWatch WHERE date=?').get(previous).separation;
    weekly = db.prepare('SELECT separation FROM dawnsWatch WHERE date=?').get(prevWeek).separation;
    monthly = db.prepare('SELECT separation FROM dawnsWatch WHERE date=?').get(prevMonth).separation;
    difference = guildGexp[0] - guildGexp[3];
    gained = difference - result;
    db.prepare('INSERT INTO dawnsWatch (date, gexp, separation, gained) VALUES (?, ?, ?, ?)').run(
      today,
      guildGexp[1],
      difference,
      gained
    );
    const dawnsEmbed = new EmbedBuilder()
      .setColor(gexpGained(gained)[1])
      .setTitle(`We are ${difference.toLocaleString()} GEXP ahead of The Dawns Awakening`)
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
          value: `${gexpGained(difference - monthly)[0]} **${Math.abs(difference - monthly).toLocaleString()}** GEXP`,
          inline: true
        }
      )
      .setThumbnail(
        'https://cdn.discordapp.com/attachments/986281342457237624/1001839294165561505/9faa8886a380dbea8e35c053df43799e.webp'
      );
    await channels.guildWatch.send({ embeds: [rebelEmbed, cronosEmbed, dawnsEmbed] });
  });
}
