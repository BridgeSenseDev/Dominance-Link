import { schedule } from 'node-cron';
import { google } from 'googleapis';
import Database from 'better-sqlite3';
import { getNetworth } from 'skyhelper-networth';
import { JWT } from 'google-auth-library';
import { Client, EmbedBuilder, Guild, Role } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { doubleDigits, formatNumber, nameColor, uuidToName, skillAverage, hypixelRequest } from './utils.js';
import { ranks, roles } from './constants.js';
import { channels } from '../events/discord/ready.js';
import { chat } from '../handlers/workerHandler.js';

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

export async function weekly(client: Client) {
  schedule('00 50 11 * * 0', async () => {
    const guild = (await hypixelRequest(`https://api.hypixel.net/guild?name=Dominance`)).guild.members;
    for (let i = 0; i < guild.length; i++) {
      let weeklyGexp = 0;
      for (let j = 0; j < 7; j++) {
        weeklyGexp += Number(Object.values(guild[i].expHistory)[j]);
      }
      const tag = ranks[guild[i].rank];
      if (['[Staff]', '[Pro]', '[Active]', '[Member]'].includes(tag)) {
        if (weeklyGexp > 250000) {
          db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[Pro]', guild[i].uuid);
        } else if (weeklyGexp > 150000) {
          db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[Active]', guild[i].uuid);
        } else {
          db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[Member]', guild[i].uuid);
        }
      } else {
        db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run(tag, guild[i].uuid);
      }
    }
  });

  schedule('00 55 11 * * 0', async () => {
    let proDesc = '';
    let activeDesc = '';
    const pro = db
      .prepare('SELECT uuid, discord, weeklyGexp FROM guildMembers WHERE targetRank = ? ORDER BY weeklyGexp DESC')
      .all('[Pro]');
    const active = db
      .prepare('SELECT uuid, discord, weeklyGexp FROM guildMembers WHERE targetRank = ? ORDER BY weeklyGexp DESC')
      .all('[Active]');
    for (let i = 0; i < pro.length; i++) {
      if (pro[i].discord !== null) {
        proDesc += `\n\`${i + 1}.\` ${await uuidToName(pro[i].uuid)} (${await client.users.fetch(
          pro[i].discord
        )}) - ${formatNumber(pro[i].weeklyGexp)}`;
      } else {
        proDesc += `\n\`${i + 1}.\` ${await uuidToName(pro[i].uuid)} - ${formatNumber(pro[i].weeklyGexp)}`;
      }
    }
    for (let i = 0; i < active.length; i++) {
      if (active[i].discord !== null) {
        activeDesc += `\n\`${i + 1}.\` ${await uuidToName(active[i].uuid)} (${await client.users.fetch(
          active[i].discord
        )}) - ${formatNumber(active[i].weeklyGexp)}`;
      } else {
        activeDesc += `\n\`${i + 1}.\` ${await uuidToName(active[i].uuid)} - ${formatNumber(active[i].weeklyGexp)}`;
      }
    }
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const previous = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 6);
    const prevWeek = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle(`Weekly Roles Update ${previous} - ${prevWeek}`)
      .setDescription(
        `Congrats to the following **PRO** members${proDesc}\n\nCongrats to the following **ACTIVE** members${activeDesc}\n\n**Detailed ` +
          `stats can be found in https://dominance.cf/sheets**`
      )
      .setImage(config.guild.banner);
    await channels.announcements.send({ content: '<@&1031926129822539786>', embeds: [embed] });
  });
}

export async function database() {
  setInterval(async () => {
    const members = [];
    const guild = (await hypixelRequest(`https://api.hypixel.net/guild?name=Dominance`)).guild.members;
    for (let i = 0; i < guild.length; i++) {
      members.push(guild[i].uuid);
      const tag = ranks[guild[i].rank];
      let weeklyGexp = 0;
      for (let j = 0; j < 7; j++) {
        weeklyGexp += Number(Object.values(guild[i].expHistory)[j]);
      }
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime, tag) VALUES (?, ?, ?, ?)').run(
        guild[i].uuid,
        0,
        0,
        tag
      );
      try {
        db.prepare(
          `UPDATE guildMembers SET (tag, weeklyGexp, joined, "${
            Object.keys(guild[i].expHistory)[0]
          }") = (?, ?, ?, ?) WHERE uuid = (?)`
        ).run(tag, weeklyGexp, guild[i].joined, Object.values(guild[i].expHistory)[0], guild[i].uuid);
      } catch {
        db.prepare(`ALTER TABLE guildMembers ADD COLUMN "${Object.keys(guild[i].expHistory)[0]}" INTEGER`).run();
        db.prepare(
          `UPDATE guildMembers SET (tag, weeklyGexp, joined, "${
            Object.keys(guild[i].expHistory)[0]
          }") = (?, ?, ?, ?) WHERE uuid = (?)`
        ).run(tag, weeklyGexp, guild[i].joined, Object.values(guild[i].expHistory)[0], guild[i].uuid);
      }
    }
    let placeholders = '?';
    for (let i = 0; i < members.length - 1; i++) {
      placeholders += ', ?';
    }
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
        if (discordId !== undefined) {
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
    for (let i = 0; i < members.length; i++) {
      if (!discordId.includes(members[i][0])) {
        await members[i][1].roles.remove([memberRole, activeRole, proRole]);
      }
    }
  }, 5 * 60 * 1000);
  setInterval(async () => {
    const data = db.prepare('SELECT * FROM guildMembers LIMIT 1 OFFSET ?').get(count);
    let member;
    if (data !== undefined) {
      if (data.discord !== null) {
        try {
          member = await guild.members.fetch(data.discord);
        } catch (e) {
          db.prepare('UPDATE guildMembers SET (discord) = null WHERE uuid = ?').run(data.uuid);
        }
        if (!['[Owner]', '[GM]'].includes(data.tag) && member !== undefined) {
          const ign = await uuidToName(data.uuid);
          await member.roles.add(memberRole);
          if (data.targetRank !== null && data.tag !== '[Staff]' && data.targetRank !== data.tag) {
            if (data.targetRank === '[Pro]') {
              await chat(`/g promote ${ign}`);
            } else if (data.targetRank === '[Active]') {
              if (data.tag === '[Member]') {
                await chat(`/g promote ${ign}`);
              } else if (data.tag === '[Pro]') {
                await chat(`/g demote ${ign}`);
              }
            } else if (data.targetRank === '[Member]') {
              await chat(`/g demote ${ign}`);
            }
          }
          if (!member.displayName.includes(ign)) {
            await member.setNickname(ign);
          }
          if (!data.tag.includes(['[Member]'])) {
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
      const { player } = await hypixelRequest(`https://api.hypixel.net/player?uuid=${data.uuid}`);
      const { stats } = player;
      let bwStars;
      let bwFkdr;
      let duelsWins;
      let duelsWlr;
      try {
        bwStars = player.achievements.bedwars_level;
      } catch (e) {
        bwStars = 0;
      }
      try {
        bwFkdr = (stats.Bedwars.final_kills_bedwars / stats.Bedwars.final_deaths_bedwars).toFixed(1);
      } catch (e) {
        bwFkdr = 0;
      }
      if (Number.isNaN(Number(bwFkdr))) {
        bwFkdr = 0;
      }
      try {
        duelsWins = stats.Duels.wins;
      } catch (e) {
        duelsWins = 0;
      }
      if (duelsWins === undefined) {
        duelsWins = 0;
      }
      try {
        duelsWlr = (stats.Duels.wins / stats.Duels.losses).toFixed(1);
      } catch (e) {
        duelsWlr = 0;
      }
      if (Number.isNaN(Number(duelsWlr))) {
        duelsWlr = 0;
      }
      let profileData;
      let bankBalance;
      let networth;
      let sa = 0;
      const { profiles } = await hypixelRequest(`https://api.hypixel.net/skyblock/profiles?uuid=${data.uuid}`);
      if (profiles === null) {
        networth = 0;
      } else {
        profiles.forEach((i: any) => {
          if (i.selected === true) {
            profileData = i.members[data.uuid];
            bankBalance = i.banking?.balance;
          }
        });
        if (profileData === undefined) {
          networth = 0;
        } else {
          ({ networth } = await getNetworth(profileData, bankBalance));
          sa = await skillAverage(profileData);
        }
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
    }
    count++;
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
