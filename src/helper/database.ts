import { google } from 'googleapis';
import Database from 'better-sqlite3';
import { getNetworth } from 'skyhelper-networth';
import { JWT } from 'google-auth-library';
import { Client, Guild, Role } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { nameColor, uuidToName, skillAverage, hypixelRequest } from './utils.js';
import { ranks, roles } from './constants.js';

const db = new Database('guild.db');

export const sheet = new google.auth.JWT(config.sheets.clientEmail, undefined, config.sheets.privateKey, [
  'https://www.googleapis.com/auth/spreadsheets'
]);

sheet.authorize((err) => {
  if (err) {
    console.log(`[SHEETS] ${err}`);
  } else {
    console.log('[SHEETS] Successfully connected to spreadsheet');
  }
});

export async function database() {
  setInterval(async () => {
    const members = [];
    const guild = (await hypixelRequest(`https://api.hypixel.net/guild?name=Dominance`)).guild.members;
    for (const member of guild) {
      members.push(member.uuid);
      const tag = ranks[member.rank];
      const weeklyGexp = (Object.values(member.expHistory) as number[]).reduce((acc, cur) => acc + cur, 0);
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime, tag) VALUES (?, ?, ?, ?)').run(
        member.uuid,
        0,
        0,
        tag
      );
      try {
        db.prepare(
          `UPDATE guildMembers SET (tag, weeklyGexp, joined, "${
            Object.keys(member.expHistory)[0]
          }") = (?, ?, ?, ?) WHERE uuid = (?)`
        ).run(tag, weeklyGexp, member.joined, Object.values(member.expHistory)[0], member.uuid);
      } catch {
        db.prepare(`ALTER TABLE guildMembers ADD COLUMN "${Object.keys(member.expHistory)[0]}" INTEGER`).run();
        db.prepare(
          `UPDATE guildMembers SET (tag, weeklyGexp, joined, "${
            Object.keys(member.expHistory)[0]
          }") = (?, ?, ?, ?) WHERE uuid = (?)`
        ).run(tag, weeklyGexp, member.joined, Object.values(member.expHistory)[0], member.uuid);
      }
    }
    let placeholders = '?';
    placeholders += ', ?'.repeat(members.length - 1);
    db.prepare(`DELETE FROM guildMembers WHERE uuid NOT IN (${placeholders})`).run(members);
    db.prepare('DELETE FROM guildMembers WHERE uuid IS NULL').run();
  }, 1 * 60 * 1000);
}

export async function gsrun(sheets: JWT, client: Client) {
  setInterval(async () => {
    const gsapi = google.sheets({ version: 'v4', auth: sheets });
    const data = db.prepare('SELECT * FROM guildMembers').all();
    const guild = (await hypixelRequest(`https://api.hypixel.net/guild?name=Dominance`)).guild.members;
    const array = [];
    for (let i = data.length - 1; i >= 0; i--) {
      for (let j = Object.keys(data[i]).length; j >= 0; j--) {
        if (
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(Object.keys(data[i])[j]) &&
          !Object.keys(guild[0].expHistory).includes(Object.keys(data[i])[j])
        ) {
          delete data[i][Object.keys(data[i])[j]];
        }
      }
      data[i].name = await uuidToName(data[i].uuid);
      if (data[i].discord) {
        try {
          data[i].discordTag = (await client.users.fetch(data[i].discord)).tag;
        } catch (e) {
          data[i].discordTag = null;
        }
      } else {
        const discordId = db.prepare('SELECT discord FROM members WHERE uuid = ?').get(data[i].uuid);
        if (discordId) {
          db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(discordId.discord, data[i].uuid);
          data[i].discord = discordId.discord;
          try {
            data[i].discordTag = (await client.users.fetch(data[i].discord)).tag;
          } catch (e) {
            data[i].discordTag = null;
          }
        } else {
          data[i].discordTag = null;
        }
      }
      array.push(Object.values(data[i]));
    }
    array.sort((a: any, b: any) => b[4] - a[4]);
    const options = {
      spreadsheetId: '1YiNxpvH9FZ6Cl6ZQmBV07EvORvsVTAiq5kD1FgJiKEE',
      range: 'Guild API!A2',
      valueInputOption: 'USER_ENTERED',
      resource: { values: array }
    };
    await gsapi.spreadsheets.values.clear({
      spreadsheetId: '1YiNxpvH9FZ6Cl6ZQmBV07EvORvsVTAiq5kD1FgJiKEE',
      range: 'Guild API!A2:Z126'
    });
    await gsapi.spreadsheets.values.update(options);
  }, 6 * 60 * 1000);
}

export async function players() {
  const client = (await import('../index.js')).default;
  const guild = client.guilds.cache.get('242357942664429568') as Guild;
  const breakRole = guild.roles.cache.get(roles.Break) as Role;
  const memberRole = guild.roles.cache.get(roles['[Member]']) as Role;
  const activeRole = guild.roles.cache.get(roles['[Active]']) as Role;
  const proRole = guild.roles.cache.get(roles['[Pro]']) as Role;
  const staffRole = guild.roles.cache.get(roles['[Staff]']) as Role;
  let count = 0;

  setInterval(async () => {
    const discordId = db
      .prepare('SELECT discord FROM guildMembers')
      .all()
      .map((i) => i.discord);
    const members = Array.from(memberRole.members).concat(
      Array.from(activeRole.members),
      Array.from(proRole.members),
      Array.from(staffRole.members)
    );
    for (const member of members) {
      if (!discordId.includes(member[0])) {
        await member[1].roles.remove([memberRole, activeRole, proRole]);
      }
    }
  }, 5 * 60 * 1000);

  setInterval(async () => {
    const data = db.prepare('SELECT * FROM guildMembers LIMIT 1 OFFSET ?').get(count);
    if (!data) {
      return;
    }
    count++;
    let profiles;
    let player;
    try {
      ({ profiles } = await hypixelRequest(`https://api.hypixel.net/skyblock/profiles?uuid=${data.uuid}`));
      ({ player } = await hypixelRequest(`https://api.hypixel.net/player?uuid=${data.uuid}`));
    } catch (e) {
      return;
    }
    if (data.discord) {
      let member;
      try {
        member = await guild.members.fetch(data.discord);
      } catch (e) {
        db.prepare('UPDATE guildMembers SET (discord) = null WHERE uuid = ?').run(data.uuid);
      }
      if (!['[Owner]', '[GM]'].includes(data.tag) && member) {
        const ign = await uuidToName(data.uuid);
        await member.roles.add(memberRole);
        if (!member.displayName.includes(ign)) {
          await member.setNickname(ign);
        }
        if (!data.tag.includes(['[Member]', '[Staff]'])) {
          await member.roles.add(guild.roles.cache.get(roles[data.tag]) as Role);
        }
        if (data.tag === '[Member]') {
          await member.roles.remove(activeRole);
          await member.roles.remove(proRole);
          await member.roles.remove(staffRole);
        }
        if (data.tag === '[Active]') {
          await member.roles.remove(proRole);
          await member.roles.remove(staffRole);
        }
        if (data.tag === '[Pro]') {
          await member.roles.remove(staffRole);
        }
      }
    }
    const { stats } = player;
    let bwStars = '0';
    let bwFkdr = '0';
    let duelsWins = '0';
    let duelsWlr = '0';
    let networth = 0;
    let sa = 0;

    if (player.achievements.bedwars_level) {
      bwStars = player.achievements.bedwars_level;
    }
    if (stats.Bedwars.final_kills_bedwars / stats.Bedwars.final_deaths_bedwars) {
      bwFkdr = (stats.Bedwars.final_kills_bedwars / stats.Bedwars.final_deaths_bedwars).toFixed(1);
    } else if (
      Number.isNaN(stats.Bedwars.final_kills_bedwars / stats.Bedwars.final_deaths_bedwars) &&
      stats.Bedwars.final_kills_bedwars
    ) {
      bwFkdr = stats.Bedwars.final_kills_bedwars;
    }
    if (stats.Duels.wins) {
      duelsWins = stats.Duels.wins;
    }
    if (stats.Duels.wins / stats.Duels.losses) {
      duelsWlr = (stats.Duels.wins / stats.Duels.losses).toFixed(1);
    } else if (Number.isNaN(stats.Duels.wins / stats.Duels.losses) && stats.Duels.wins) {
      duelsWlr = stats.Duels.wins;
    }

    if (profiles) {
      const profile = profiles.find((i: any) => i.selected);
      const profileData = profile.members[data.uuid];
      const bankBalance = profile.banking?.balance;
      ({ networth } = await getNetworth(profileData, bankBalance));
      sa = await skillAverage(profileData);
    }

    db.prepare(
      'UPDATE guildMembers SET (nameColor, bwStars, bwFkdr, duelsWins, duelsWlr, networth, skillAverage) = (?, ?, ?, ?, ?, ?, ?) WHERE uuid = ?'
    ).run(
      nameColor(player),
      bwStars,
      bwFkdr,
      duelsWins,
      duelsWlr,
      Math.round(networth * 100) / 100,
      Math.round(sa * 100) / 100,
      data.uuid
    );
    if (count === 126) {
      count = 0;
    }
  }, 7 * 1000);

  setInterval(async () => {
    const breakMembers = db
      .prepare('SELECT discord FROM breaks')
      .all()
      .map((i) => i.discord);
    for (const member of Array.from(breakRole.members)) {
      if (!breakMembers.includes(member[0])) {
        await member[1].roles.remove(breakRole);
      }
    }
  }, 5 * 60 * 1000);
}
