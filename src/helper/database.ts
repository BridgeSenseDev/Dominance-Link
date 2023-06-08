import { google } from 'googleapis';
import Database from 'better-sqlite3';
import { getNetworth } from 'skyhelper-networth';
import { JWT } from 'google-auth-library';
import { Client, Guild, Role } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { uuidToName, skillAverage, uuidToDiscord } from './utils.js';
import { bwPrestiges, duelsDivisionRoles, ranks, roles } from './constants.js';
import { HypixelGuildMember } from '../types/global.d.js';
import { fetchGuildByName, fetchPlayerRaw, fetchSkyblockProfiles } from '../api.js';
import { processPlayer } from '../types/api/processors/processPlayers.js';

const db = new Database('guild.db');

export const sheet = new google.auth.JWT(config.sheets.clientEmail, undefined, config.sheets.privateKey, [
  'https://www.googleapis.com/auth/spreadsheets'
]);

sheet.authorize();

export async function database() {
  setInterval(async () => {
    const response = await fetchGuildByName('Dominance');
    if (!response.success || !response.guild) {
      return;
    }

    const members = response.guild.members.map((member) => {
      const { uuid, rank, expHistory, joined } = member;
      const tag = ranks[rank];
      const weeklyGexp = Object.values(expHistory).reduce((acc, cur) => acc + cur, 0);
      const firstExpKey = Object.keys(expHistory)[0];
      const firstExpValue = Object.values(expHistory)[0];

      if (db.prepare('SELECT * FROM guildMemberArchives WHERE uuid = ?').get(uuid)) {
        db.prepare(`INSERT INTO guildMembers SELECT * FROM guildMemberArchives WHERE uuid = ?`).run(uuid);
        db.prepare('DELETE FROM guildMemberArchives WHERE uuid = ?').run(uuid);
      }
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);

      try {
        db.prepare(
          `UPDATE guildMembers SET (tag, weeklyGexp, joined, "${firstExpKey}") = (?, ?, ?, ?) WHERE uuid = ?`
        ).run(tag, weeklyGexp, joined, firstExpValue, uuid);
      } catch {
        db.prepare(`ALTER TABLE guildMembers ADD COLUMN "${firstExpKey}" INTEGER`).run();
        db.prepare(`ALTER TABLE guildMemberArchives ADD COLUMN "${firstExpKey}" INTEGER`).run();
        db.prepare(
          `UPDATE guildMembers SET (tag, weeklyGexp, joined, "${firstExpKey}") = (?, ?, ?, ?) WHERE uuid = ?`
        ).run(tag, weeklyGexp, joined, firstExpValue, uuid);
      }

      return uuid;
    });

    const placeholders = members.map(() => '?').join(', ');

    db.prepare(`INSERT INTO guildMemberArchives SELECT * FROM guildMembers WHERE uuid NOT IN (${placeholders})`).run(
      members
    );
    db.prepare(`DELETE FROM guildMembers WHERE uuid NOT IN (${placeholders})`).run(members);
    db.prepare('DELETE FROM guildMembers WHERE uuid IS NULL').run();
  }, 60 * 1000);
}

export async function gsrun(sheets: JWT, client: Client) {
  setInterval(async () => {
    const gsapi = google.sheets({ version: 'v4', auth: sheets });
    const data = db.prepare('SELECT * FROM guildMembers').all() as HypixelGuildMember[];
    const response = await fetchGuildByName('Dominance');
    if (!response.success || !response.guild) {
      return;
    }
    const guildMembers = response.guild.members;
    const array = [];
    for (let i = data.length - 1; i >= 0; i--) {
      for (let j = Object.keys(data[i]).length; j >= 0; j--) {
        if (
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(Object.keys(data[i])[j]) &&
          !Object.keys(guildMembers[0].expHistory).includes(Object.keys(data[i])[j])
        ) {
          delete data[i][Object.keys(data[i])[j]];
        }
      }
      const { uuid } = data[i];
      data[i].name = await uuidToName(uuid);
      if (data[i].discord) {
        try {
          data[i].discordTag = (await client.users.fetch(data[i].discord)).tag;
        } catch (e) {
          data[i].discordTag = null;
        }
      } else {
        const discordId = uuidToDiscord(uuid);
        if (discordId) {
          db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(discordId, uuid);
          data[i].discord = discordId;
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
  const noLiferRole = guild.roles.cache.get(roles['[NoLifer]']) as Role;
  const proRole = guild.roles.cache.get(roles['[Pro]']) as Role;
  const staffRole = guild.roles.cache.get(roles['[Staff]']) as Role;
  let count = 0;

  setInterval(async () => {
    const discordId = db
      .prepare('SELECT discord FROM guildMembers')
      .all()
      .map((i) => (i as { discord: string }).discord);
    const members = Array.from(memberRole.members).concat(
      Array.from(noLiferRole.members),
      Array.from(proRole.members),
      Array.from(staffRole.members)
    );
    for (const member of members) {
      if (!discordId.includes(member[0])) {
        await member[1].roles.remove([memberRole, noLiferRole, proRole]);
      }
    }
  }, 5 * 60 * 1000);

  setInterval(async () => {
    const data = db.prepare('SELECT * FROM guildMembers LIMIT 1 OFFSET ?').get(count) as HypixelGuildMember;
    if (!data || !data.uuid || !data.tag) {
      return;
    }
    count++;

    const skyblockProfilesResponse = await fetchSkyblockProfiles(data.uuid);
    if (!skyblockProfilesResponse.success) {
      return;
    }
    const { profiles } = skyblockProfilesResponse;

    const playerRawResponse = await fetchPlayerRaw(data.uuid);
    if (!playerRawResponse.success) {
      return;
    }
    const processedPlayer = processPlayer(playerRawResponse.player, ['duels', 'bedwars', 'skywars']);

    let networth = 0;
    let sa = 0;

    const bwFkdr = +(processedPlayer.stats.Bedwars?.overall.fkdr.toFixed(1) ?? 0);
    const bwStars = processedPlayer.stats.Bedwars?.star ?? 0;
    const duelsWins = processedPlayer.stats.Duels?.general.wins ?? 0;
    const duelsWlr = +(processedPlayer.stats.Duels?.general.wlr.toFixed(1) ?? 0);

    if (profiles) {
      const profile = profiles.find((i: any) => i.selected);
      if (profile) {
        const profileData = profile.members[data.uuid];
        const bankBalance = profile.banking?.balance;
        ({ networth } = await getNetworth(profileData, bankBalance));
        sa = await skillAverage(profileData);
      }
    }

    if (data.discord) {
      let member;
      try {
        member = await guild.members.fetch(data.discord);
      } catch (e) {
        db.prepare('UPDATE guildMembers SET (discord) = null WHERE uuid = ?').run(data.uuid);
        return;
      }

      const bwRole = bwPrestiges[Math.floor(bwStars / 100) * 100];
      for (const roleId of Object.values(bwPrestiges)) {
        if (member.roles.cache.has(roleId) && roleId !== bwRole) {
          await member.roles.remove(roleId);
        }
      }
      if (bwRole) {
        await member.roles.add(bwRole);
      }

      let highestRole = null;
      for (const wins in duelsDivisionRoles) {
        if (duelsWins >= parseInt(wins, 10)) {
          highestRole = duelsDivisionRoles[wins];
        }
      }

      for (const wins in duelsDivisionRoles) {
        const roleId = duelsDivisionRoles[wins];
        if (highestRole === roleId) {
          await member.roles.add(roleId);
        } else if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId);
        }
      }

      if (!['[Owner]', '[GM]'].includes(data.tag)) {
        const ign = processedPlayer.username;
        await member.roles.add(memberRole);
        const { displayName } = member;
        if (!displayName.toUpperCase().includes(ign.toUpperCase())) {
          if (/\(.*?\)/.test(displayName.split(' ')[1])) {
            await member.setNickname(displayName.replace(displayName.split(' ')[0], ign));
          } else {
            await member.setNickname(ign);
          }
        } else if (!displayName.includes(ign)) {
          await member.setNickname(displayName.replace(new RegExp(ign, 'gi'), ign));
        }
        if (!['[Member]', '[Staff]'].includes(data.tag)) {
          await member.roles.add(guild.roles.cache.get(roles[data.tag]) as Role);
        }
        if (data.tag === '[Member]') {
          await member.roles.remove(noLiferRole);
          await member.roles.remove(proRole);
          await member.roles.remove(staffRole);
        }
        if (data.tag === '[Pro]') {
          await member.roles.remove(noLiferRole);
          await member.roles.remove(staffRole);
        }
        if (data.tag === '[NoLifer]') {
          await member.roles.remove(staffRole);
        }
      }
    }

    if (networth) {
      db.prepare(
        'UPDATE guildMembers SET (nameColor, bwStars, bwFkdr, duelsWins, duelsWlr, networth, skillAverage) = (?, ?, ?, ?, ?, ?, ?) WHERE uuid = ?'
      ).run(
        processedPlayer.rankTagF,
        bwStars,
        bwFkdr,
        duelsWins,
        duelsWlr,
        Math.round(networth * 100) / 100,
        Math.round(sa * 100) / 100,
        data.uuid
      );
    } else {
      db.prepare(
        'UPDATE guildMembers SET (nameColor, bwStars, bwFkdr, duelsWins, duelsWlr) = (?, ?, ?, ?, ?) WHERE uuid = ?'
      ).run(processedPlayer.rankTagF, bwStars, bwFkdr, duelsWins, duelsWlr, data.uuid);
    }

    if (count === 126) {
      count = 0;
    }
  }, 7 * 1000);

  setInterval(async () => {
    const breakMembers = db
      .prepare('SELECT discord FROM breaks')
      .all()
      .map((i) => (i as { discord: string }).discord);
    for (const member of Array.from(breakRole.members)) {
      if (!breakMembers.includes(member[0])) {
        await member[1].roles.remove(breakRole);
      }
    }
  }, 5 * 60 * 1000);
}
