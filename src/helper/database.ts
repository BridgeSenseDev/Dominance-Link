import { google } from 'googleapis';
import { schedule } from 'node-cron';
import Database from 'better-sqlite3';
import { getNetworth } from 'skyhelper-networth';
import { JWT } from 'google-auth-library';
import { Client, EmbedBuilder, Guild, Role } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { uuidToName, skillAverage, uuidToDiscord, doubleDigits } from './utils.js';
import { bwPrestiges, duelsDivisionRoles, ranks, roles } from './constants.js';
import { DiscordMember, HypixelGuildMember } from '../types/global.d.js';
import { fetchGuildByName, fetchPlayerRaw, fetchSkyblockProfiles } from '../api.js';
import { processPlayer } from '../types/api/processors/processPlayers.js';
import { textChannels } from '../events/discord/ready.js';
import { chat } from '../handlers/workerHandler.js';

const db = new Database('guild.db');

export const sheet = new google.auth.JWT(config.sheets.clientEmail, undefined, config.sheets.privateKey, [
  'https://www.googleapis.com/auth/spreadsheets'
]);

sheet.authorize();

function calculatePointsFromGexp(weeklyGexp: number) {
  if (weeklyGexp >= 1000000) return 225;
  if (weeklyGexp >= 750000) return 150;
  if (weeklyGexp >= 600000) return 120;
  if (weeklyGexp >= 500000) return 100;
  if (weeklyGexp >= 400000) return 80;
  if (weeklyGexp >= 250000) return 60;
  if (weeklyGexp >= 200000) return 50;
  if (weeklyGexp >= 175000) return 45;
  if (weeklyGexp >= 150000) return 40;
  return 0;
}

export async function weekly(client: Client) {
  schedule('50 11 * * 0', async () => {
    const guildResponse = await fetchGuildByName('Dominance');
    if (!guildResponse.success || !guildResponse.guild) {
      return;
    }

    const { members } = guildResponse.guild;
    const memberPoints: Array<[uuid: string, points: number]> = [];

    for (const member of members) {
      const weeklyGexp = (Object.values(member.expHistory) as number[]).reduce((acc, cur) => acc + cur, 0);
      const points = calculatePointsFromGexp(weeklyGexp);
      if (points !== 0) {
        memberPoints.push([member.uuid, points]);
      }
    }

    memberPoints.sort((a, b) => b[1] - a[1]);

    memberPoints[0][1] += 25;
    memberPoints[1][1] += 15;
    memberPoints[2][1] += 10;
    for (const member of memberPoints) {
      db.prepare('UPDATE guildMembers SET points = points + (?) WHERE uuid = ?').run(member[1], member[0]);
    }
  });

  schedule('55 11 * * 0', async () => {
    let noLiferDesc = '';
    let proDesc = '';

    const noLiferReq = db
      .prepare(
        "SELECT uuid, discord, points, weeklyGexp FROM guildMembers WHERE points >= (?) AND tag != '[Staff]' ORDER BY points DESC"
      )
      .all(100) as HypixelGuildMember[];
    const topNoLifer = db
      .prepare(
        "SELECT uuid, discord, points, weeklyGexp FROM guildMembers WHERE tag != '[Staff]' ORDER BY points DESC LIMIT 3"
      )
      .all() as HypixelGuildMember[];
    const staffNoLifer = db
      .prepare(
        "SELECT uuid, discord, points, weeklyGexp FROM guildMembers WHERE points >= (?) AND tag = '[Staff]' ORDER BY points"
      )
      .all(100) as HypixelGuildMember[];

    const proReq = db
      .prepare(
        "SELECT uuid, discord, points, weeklyGexp FROM guildMembers WHERE points >= (?) AND points < (?) AND tag != '[Staff]' ORDER BY points DESC"
      )
      .all(50, 100) as HypixelGuildMember[];
    const topPro = db
      .prepare(
        "SELECT uuid, discord, points, weeklyGexp FROM guildMembers WHERE tag != '[Staff]' ORDER BY points DESC LIMIT 20"
      )
      .all() as HypixelGuildMember[];
    const staffPro = db
      .prepare(
        "SELECT uuid, discord, points, weeklyGexp FROM guildMembers WHERE points >= (?) AND points < (?) AND tag = '[Staff]' ORDER BY points DESC LIMIT 20"
      )
      .all(50, 100) as HypixelGuildMember[];

    const member = db
      .prepare(
        "SELECT uuid, discord, points, weeklyGexp FROM guildMembers WHERE points < (?) AND tag != '[Staff]' ORDER BY points DESC"
      )
      .all(50) as HypixelGuildMember[];

    let noLifer = noLiferReq;
    let pro = proReq;

    if (noLifer.length < 3) {
      const additionalMembers = topNoLifer.filter(
        (guildMember) => !noLiferReq.find((req) => req.uuid === guildMember.uuid)
      );
      noLifer = noLifer.concat(additionalMembers.slice(0, 3 - noLifer.length));
    }

    pro = pro.filter((proMember) => !noLifer.find((noLiferMember) => noLiferMember.uuid === proMember.uuid));

    if (pro.length < 20) {
      const additionalMembers = topPro.filter((guildMember) => !proReq.find((req) => req.uuid === guildMember.uuid));
      pro = pro.concat(additionalMembers.slice(0, 20 - pro.length));
    }

    noLifer = noLifer.concat(staffNoLifer);
    pro = pro.concat(staffPro);

    noLifer.sort((a, b) => b.points - a.points);
    pro.sort((a, b) => b.points - a.points);

    for (const i in noLifer) {
      db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[NoLifer]', noLifer[i].uuid);
      if (noLifer[i].discord) {
        noLiferDesc += `\n\`${parseInt(i, 10) + 1}.\` ${await uuidToName(noLifer[i].uuid)} (${await client.users.fetch(
          noLifer[i].discord
        )}) - ${noLifer[i].points}`;
      } else {
        noLiferDesc += `\n\`${parseInt(i, 10) + 1}.\` ${await uuidToName(noLifer[i].uuid)} - ${noLifer[i].points}`;
      }
    }

    for (const i in pro) {
      db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[Pro]', pro[i].uuid);
      if (pro[i].discord) {
        proDesc += `\n\`${parseInt(i, 10) + 1}.\` ${await uuidToName(pro[i].uuid)} (${await client.users.fetch(
          pro[i].discord
        )}) - ${pro[i].points}`;
      } else {
        proDesc += `\n\`${parseInt(i, 10) + 1}.\` ${await uuidToName(pro[i].uuid)} - ${pro[i].points}`;
      }
    }

    for (const i in member) {
      db.prepare('UPDATE guildMembers SET targetRank = ? WHERE uuid = ?').run('[Member]', member[i].uuid);
    }

    const date = new Date();
    date.setDate(date.getDate() - 1);
    const previous = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
    date.setDate(date.getDate() - 6);
    const prevWeek = `${doubleDigits(date.getDate())}/${doubleDigits(date.getMonth() + 1)}/${date.getFullYear()}`;

    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle(`Weekly Roles Update ${prevWeek} - ${previous}`)
      .setDescription(
        `Congrats to the following **NoLifer** members${noLiferDesc}\n\nCongrats to the following **Pro** members${proDesc}\n\n**Detailed ` +
          `stats can be found in https://dominance.cf/sheets**`
      )
      .setImage(config.guild.banner);

    await textChannels.announcements.send({ content: '<@&1031926129822539786>', embeds: [embed] });

    db.prepare('UPDATE guildMembers SET points = 0;').run();
  });
}

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
      db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, points , messages, playtime) VALUES (?, ?, ?, ?)').run(
        uuid,
        0,
        0,
        0
      );

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
  setInterval(
    async () => {
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
    },
    6 * 60 * 1000
  );
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

  setInterval(
    async () => {
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
    },
    5 * 60 * 1000
  );

  setInterval(async () => {
    const data = db.prepare('SELECT * FROM guildMembers LIMIT 1 OFFSET ?').get(count) as HypixelGuildMember;

    count++;
    if (count === 126) {
      count = 0;
    }

    if (!data || !data.uuid || !data.tag) {
      return;
    }

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

    if (data.targetRank && !['[Staff]', '[Owner]', '[GM]'].includes(data.tag) && data.targetRank !== data.tag) {
      const ign = await uuidToName(data.uuid);
      if (data.targetRank === '[NoLifer]') {
        await chat(`/g promote ${ign}`);
      } else if (data.targetRank === '[Pro]') {
        if (data.tag === '[Member]') {
          await chat(`/g promote ${ign}`);
        } else if (data.tag === '[NoLifer]') {
          await chat(`/g demote ${ign}`);
        }
      } else if (data.targetRank === '[Member]') {
        await chat(`/g demote ${ign}`);
      }
    }

    if (data.discord) {
      let member;
      try {
        member = await guild.members.fetch(data.discord);
      } catch (e) {
        db.prepare('UPDATE guildMembers SET (discord) = null WHERE uuid = ?').run(data.uuid);
        const memberData = db.prepare('SELECT * FROM members WHERE discord = ?').get(data.discord) as DiscordMember;
        if (!memberData) {
          return;
        }
        db.prepare('INSERT INTO memberArchives (discord, uuid, messages, xp) VALUES (?, ?, ?, ?)').run(
          memberData.discord,
          memberData.uuid,
          memberData.messages,
          memberData.xp
        );
        db.prepare('DELETE FROM members WHERE discord = ?').run(data.discord);
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
  }, 7 * 1000);

  setInterval(
    async () => {
      const breakMembers = db
        .prepare('SELECT discord FROM breaks')
        .all()
        .map((i) => (i as { discord: string }).discord);
      for (const member of Array.from(breakRole.members)) {
        if (!breakMembers.includes(member[0])) {
          await member[1].roles.remove(breakRole);
        }
      }
    },
    5 * 60 * 1000
  );
}
