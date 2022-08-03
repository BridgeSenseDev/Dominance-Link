const db = require('better-sqlite3')('matrix.db');
const { google } = require('googleapis');
const keys = require('../keys.json');
const config = require('../config.json');
const { UUIDtoName } = require('./utils');

const ranks = {
  GUILDMASTER: '[GM]', Owner: '[Owner]', Manager: '[MNG]', Officer: '[OFC]', Active: '[Active]', Crew: '[Crew]', 'Trial Member': '[Trial]',
};
const sheet = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ['https://www.googleapis.com/auth/spreadsheets'],
);

sheet.authorize((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Successfully connected to spreadsheet');
  }
});

async function database() {
  setInterval(async () => {
    const members = [];
    const guild = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&name=Matrix`)).json()).guild.members;
    for (let i = 0; i < guild.length; i += 1) {
      members.push(guild[i].uuid);
      const tag = ranks[guild[i].rank];
      let weeklyGexp = 0;
      for (let j = 0; j < 7; j += 1) {
        weeklyGexp += (Object.values(guild[i].expHistory)[j]);
      }
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, tag) VALUES (?, ?, ?)').run(guild[i].uuid, 0, tag);
      db.prepare('UPDATE guildMembers SET (tag, weeklyGexp, dailyGexp, joined) = (?, ?, ?, ?) WHERE uuid = (?)').run(tag, weeklyGexp, Object.values(guild[i].expHistory)[0], guild[i].joined, guild[i].uuid);
    }
    let placeholders = '?';
    for (let i = 0; i < members.length - 1; i += 1) {
      placeholders += ', ?';
    }
    db.prepare(`DELETE FROM guildMembers WHERE uuid NOT IN (${placeholders})`).run(members);
  }, 5 * 60 * 1000);
}

async function gsrun(sheet, client) {
  setInterval(async () => {
    const gsapi = google.sheets({ version: 'v4', auth: sheet });
    const data = db.prepare('SELECT * FROM guildMembers').all();
    const array = [];
    await gsapi.spreadsheets.values.clear({ spreadsheetId: '1YiNxpvH9FZ6Cl6ZQmBV07EvORvsVTAiq5kD1FgJiKEE', range: 'Guild API!A2:I126' });
    for (let i = 0; i < data.length; i += 1) {
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

module.exports = {
  database,
  gsrun,
  sheet,
};
