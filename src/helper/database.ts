import { schedule } from 'node-cron';
import { google } from 'googleapis';
import Database from 'better-sqlite3';
import keys from '../keys.json' assert {type: 'json'};
import config from '../config.json' assert {type: 'json'};
import { UUIDtoName } from './utils.js';

const db = new Database('matrix.db');

const ranks = {
  GUILDMASTER: '[GM]', Owner: '[Owner]', Manager: '[MNG]', Officer: '[OFC]', Active: '[Active]', Crew: '[Crew]', 'Trial Member': '[Trial]',
};
const sheet = new google.auth.JWT(
  keys.clientEmail,
  null,
  keys.privateKey,
  ['https://www.googleapis.com/auth/spreadsheets'],
);

sheet.authorize((err) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.log(`[SHEETS] ${err}`);
  } else {
    // eslint-disable-next-line no-console
    console.log('[SHEETS] Successfully connected to spreadsheet');
  }
});

async function weekly() {
  schedule('00 50 11 * * 0', async () => {
    const guild = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Matrix`)).json()).guild.members;
    for (let i = 0; i < guild.length; i += 1) {
      let weeklyGexp = 0;
      for (let j = 0; j < 7; j += 1) {
        weeklyGexp += Number(Object.values(guild[i].expHistory)[j]);
      }
      const tag = ranks[guild[i].rank];
      if (tag.indexOf(['[Active]', '[Crew]']) !== -1) {
        if (weeklyGexp > 200000) {
          db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[Active]', guild[i].uuid);
        } else {
          db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[Crew]', guild[i].uuid);
        }
      } else {
        db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run(tag, guild[i].uuid);
      }
    }
  });
}

async function database() {
  setInterval(async () => {
    const members = [];
    const guild = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Matrix`)).json()).guild.members;
    try {
      db.prepare(`ALTER TABLE guildMembers ADD COLUMN "${Object.keys(guild[0].expHistory)[0]}" INTEGER`).run();
    } catch (err) {
      // Continue regardless of error
    }
    for (let i = 0; i < guild.length; i += 1) {
      members.push(guild[i].uuid);
      const tag = ranks[guild[i].rank];
      let weeklyGexp = 0;
      for (let j = 0; j < 7; j += 1) {
        weeklyGexp += Number(Object.values(guild[i].expHistory)[j]);
      }
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, tag) VALUES (?, ?, ?)').run(guild[i].uuid, 0, tag);
      db.prepare(`UPDATE guildMembers SET (tag, weeklyGexp, joined, "${Object.keys(guild[i].expHistory)[0]}") = (?, ?, ?, ?) WHERE uuid = (?)`).run(tag, weeklyGexp, guild[i].joined, Object.values(guild[i].expHistory)[0], guild[i].uuid);
    }
    let placeholders = '?';
    for (let i = 0; i < members.length - 1; i += 1) {
      placeholders += ', ?';
    }
    db.prepare(`DELETE FROM guildMembers WHERE uuid NOT IN (${placeholders})`).run(members);
    db.prepare('DELETE FROM guildMembers WHERE uuid IS NULL').run();
  }, 5 * 60 * 1000);
}

async function gsrun(sheets, client) {
  setInterval(async () => {
    const gsapi = google.sheets({ version: 'v4', auth: sheets });
    const data = db.prepare('SELECT * FROM guildMembers').all();
    const guild = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Matrix`)).json()).guild.members;
    const array = [];
    await gsapi.spreadsheets.values.clear({ spreadsheetId: '1YiNxpvH9FZ6Cl6ZQmBV07EvORvsVTAiq5kD1FgJiKEE', range: 'Guild API!A2:P126' });
    for (let i = 0; i < data.length; i += 1) {
      for (let j = 0; j < Object.keys(data[i]).length; j += 1) {
        if (/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(Object.keys(data[i])[j]) && Object.keys(guild[0].expHistory).indexOf(Object.keys(data[i])[j]) === -1) {
          delete data[i][Object.keys(data[i])[j]];
        }
      }
      // eslint-disable-next-line no-await-in-loop
      data[i].name = await UUIDtoName(data[i].uuid);
      if (data[i].discord) {
        // eslint-disable-next-line no-await-in-loop
        data[i].discordTag = (await client.users.fetch(data[i].discord)).tag;
      } else {
        data[i].discordTag = null;
      }
      array.push((Object.values(data[i])));
    }
    const options = {
      spreadsheetId: '1YiNxpvH9FZ6Cl6ZQmBV07EvORvsVTAiq5kD1FgJiKEE',
      range: 'Guild API!A2',
      valueInputOption: 'USER_ENTERED',
      resource: { values: array },
    };
    await gsapi.spreadsheets.values.update(options);
  }, 10 * 60 * 1000);
}

export {
  database,
  gsrun,
  sheet,
  weekly,
};
