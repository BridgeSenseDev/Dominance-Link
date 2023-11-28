import { Client, EmbedBuilder, Guild, Role, TextChannel, ThreadChannel, WebhookClient } from 'discord.js';
import { getNetworth } from 'skyhelper-networth';
import { Player } from 'hypixel-api-reborn';
import Database from 'better-sqlite3';
import {
  abbreviateNumber,
  addXp,
  formatNumber,
  nameToUuid,
  skillAverage,
  timeStringToSeconds,
  uuidToDiscord
} from '../../helper/utils.js';
import messageToImage from '../../helper/messageToImage.js';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { textChannels } from '../discord/ready.js';
import { discordRoles } from '../../helper/constants.js';
import { BreakMember, WaitlistMember } from '../../types/global.d.js';
import { hypixel } from '../../index.js';

const db = new Database('guild.db');
db.defaultSafeIntegers(true);

global.playtime = {};
let logMessages = '';
const logWebhook = new WebhookClient({ url: config.keys.logWebhookUrl });
const gcWebhook = new WebhookClient({ url: config.keys.gcWebhookUrl });
const ocWebhook = new WebhookClient({ url: config.keys.ocWebhookUrl });
const messageCache: string[] = [];

export async function logInterval() {
  setInterval(async () => {
    if (logMessages.length === 0) return;
    if (logMessages.includes('@')) {
      logMessages.replace('@', '');
    }
    if (logMessages.length > 2000) {
      await logWebhook.send({
        content: logMessages.substring(0, 2000),
        username: 'Dominance',
        avatarURL: config.guild.icon
      });
      logMessages = logMessages.substring(2000);
      return;
    }
    await logWebhook.send({
      content: logMessages,
      username: 'Dominance',
      avatarURL: config.guild.icon
    });
    logMessages = '';
  }, 5 * 1000);
}

export default async function execute(client: Client, msg: string, rawMsg: string, messagePosition: string) {
  if (messagePosition !== 'chat') return;
  if (msg.trim() === '') return;
  // Limbo Check
  if (msg.includes('"server"')) {
    const parsedMessage = JSON.parse(msg);
    if (parsedMessage.server !== 'limbo') {
      await chat('\u00a7');
    } else return;
  }
  if (msg.includes('@everyone') || msg.includes('@here')) {
    logMessages += `${msg.replace('@', '')}\n`;
  } else {
    logMessages += `${msg}\n`;
  }
  if (messageCache.length >= 20) messageCache.shift();
  messageCache.push(msg);

  // Guild Chat
  if (msg.includes('Guild >')) {
    if (msg.includes('joined.')) {
      let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
      let uuid = await nameToUuid(name);
      if (!uuid) {
        [name] = msg.replace(/Guild > |:/g, '').split(' ');
        uuid = await nameToUuid(name);
      }
      global.playtime[name] = Math.floor(Date.now() / 1000);
      return;
    }
    if (msg.includes('left.')) {
      let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
      let uuid = await nameToUuid(name);
      if (!uuid) {
        [name] = msg.replace(/Guild > |:/g, '').split(' ');
        uuid = await nameToUuid(name);
      }
      const time = Math.floor(Date.now() / 1000) - global.playtime[name];
      if (!Number.isNaN(time)) {
        delete global.playtime[name];
        if (db.prepare('SELECT * FROM guildMemberArchives WHERE uuid = ?').get(uuid)) {
          db.prepare(`INSERT INTO guildMembers SELECT * FROM guildMemberArchives WHERE uuid = ?`).run(uuid);
          db.prepare('DELETE FROM guildMemberArchives WHERE uuid = ?').run(uuid);
        }
        db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);
        db.prepare('UPDATE guildMembers SET playtime = playtime + (?) WHERE uuid = (?)').run(time, uuid);
      }
      return;
    }
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [await messageToImage(rawMsg)]
    });
    let [, name] = msg.replace(/Guild > |:/g, '').split(' ');
    let uuid = await nameToUuid(name);
    if (!uuid) {
      [name] = msg.replace(/Guild > |:/g, '').split(' ');
      uuid = await nameToUuid(name);
    }

    if (uuid) {
      addXp('', uuid);
    }

    if (db.prepare('SELECT * FROM guildMemberArchives WHERE uuid = ?').get(uuid)) {
      db.prepare(`INSERT INTO guildMembers SELECT * FROM guildMemberArchives WHERE uuid = ?`).run(uuid);
      db.prepare('DELETE FROM guildMemberArchives WHERE uuid = ?').run(uuid);
    }
    db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);
    db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);

    if (msg.includes('!bw') && msg.replace(/Guild > |:/g, '').split(' ').length <= 7) {
      if (!msg.endsWith('!bw')) {
        name = msg.split('!bw ')[1]?.split(' ')[0];
      }

      const player = (await hypixel.getPlayer(name).catch(async (e) => {
        await chat(`/gc Error: ${e}`);
      })) as Player;
      if (!player) return;

      const bedwars = player.stats?.bedwars;
      const star = bedwars?.level ?? 0;
      const rankTag = player.rank === 'Default' ? '' : `[${player.rank}] `;
      const fk = formatNumber(bedwars?.finalKills ?? 0);
      const fkdr = formatNumber(bedwars?.finalKDRatio ?? 0);
      const wins = formatNumber(bedwars?.wins ?? 0);
      const wlr = formatNumber(bedwars?.WLRatio ?? 0);
      const ws = formatNumber(bedwars?.winstreak ?? 0);

      await chat(`/gc [${star}✫] ${rankTag}FK: ${fk} FKDR: ${fkdr} W: ${wins} WLR: ${wlr} WS: ${ws}`);
    } else if (msg.includes('!d') && msg.replace(/Guild > |:/g, '').split(' ').length <= 7) {
      if (!msg.endsWith('!d')) {
        name = msg.split('!d ')[1]?.split(' ')[0];
      }

      const player = (await hypixel.getPlayer(name).catch(async (e) => {
        await chat(`/gc Error: ${e}`);
      })) as Player;
      if (!player) return;

      const duels = player.stats?.duels;
      const division = duels?.division ? '' : `[${duels?.division}] `;
      const rankTag = player.rank === 'Default' ? '' : `[${player.rank}] `;
      const wins = formatNumber(duels?.wins ?? 0);
      const wlr = formatNumber(duels?.WLRatio ?? 0);
      const cws = formatNumber(duels?.winstreak ?? 0);
      const bws = formatNumber(duels?.bestWinstreak ?? 0);

      await chat(`/gc ${division}${rankTag} W: ${wins} WLR: ${wlr} CWS: ${cws} BWS: ${bws}`);
    } else if (msg.includes('!sb') && msg.replace(/Guild > |:/g, '').split(' ').length <= 7) {
      if (!msg.endsWith('!sb')) {
        name = msg.split('!sb ')[1]?.split(' ')[0];
      }

      const player = (await hypixel.getPlayer(name).catch(async (e) => {
        await chat(`/gc Error: ${e}`);
      })) as Player;
      if (!player) return;

      const skyblockProfilesResponse = (await hypixel.getSkyblockProfiles(name, { raw: true }).catch(async (e) => {
        await chat(`/gc Error: ${e}`);
      })) as any;

      if (!skyblockProfilesResponse.success) {
        await chat(`/gc Error: ${skyblockProfilesResponse.cause}`);
        return;
      }
      if (!skyblockProfilesResponse.profiles) {
        await chat(`/gc Error: No profiles found for ${name}`);
        return;
      }

      const { profiles } = skyblockProfilesResponse;
      const profile = profiles.find((i: any) => i.selected);
      const bankBalance = profile.banking?.balance;
      const networth = abbreviateNumber((await getNetworth(profile, bankBalance)).networth);
      const sa = formatNumber(await skillAverage(profile));
      const level = Math.floor(profile.leveling?.experience ? profile.leveling.experience / 100 : 0);
      const rankTag = player.rank === 'Default' ? '' : `[${player.rank}] `;

      await chat(`/gc [${level}] ${rankTag} NW: ${networth} SA: ${sa}`);
    }
  } else if (msg.includes('Officer >')) {
    await ocWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [await messageToImage(rawMsg)]
    });
    let [, name] = msg.replace(/Officer > |:/g, '').split(' ');
    let uuid = await nameToUuid(name);
    if (!uuid) {
      [name] = msg.replace(/Officer > |:/g, '').split(' ');
      uuid = await nameToUuid(name);
    }
    db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
    if (uuid) {
      addXp('', uuid);
    }
  } else if (msg.includes('From')) {
    let [, , name] = msg.split(' ');
    name = name.slice(0, -1);
    let uuid = await nameToUuid(name);
    if (!uuid) {
      [, name] = msg.split(' ');
      name = name.slice(0, -1);
      uuid = await nameToUuid(name);
    }
    const waitlist = db.prepare('SELECT discord, channel FROM waitlist WHERE uuid = ?').get(uuid);
    const breaks = db.prepare('SELECT discord, thread FROM breaks WHERE uuid = ?').get(uuid);
    if (waitlist || breaks) {
      await chat(`/g invite ${name}`);
    }
  } else if (msg.includes('The Guild has reached Level')) {
    const level = msg.split(' ')[msg.split(' ').indexOf('Level') + 1];
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          `§6-------------------------------------------------------------§r§f§l                                                        LEVEL ` +
            `UP!§r                                                       §f                                §6The Guild has reached Level ${level}` +
            `§6-------------------------------------------------------------`
        )
      ]
    });
    await textChannels.guildLogs.send({
      files: [
        await messageToImage(
          `§6-------------------------------------------------------------§r§f§l                                                        LEVEL ` +
            `UP!§r                                                       §f                                §6The Guild has reached Level ${level}` +
            `§6-------------------------------------------------------------`
        )
      ]
    });
    await textChannels.publicAnnouncements.send({
      files: [
        await messageToImage(
          `§6-------------------------------------------------------------§r§f§l                                                        LEVEL ` +
            `UP!§r                                                       §f                                §6The Guild has reached Level ${level}` +
            `§6-------------------------------------------------------------`
        )
      ]
    });
  } else if (msg.includes('Offline Members:')) {
    let includes = 0;
    for (let i = messageCache.length - 1; i >= 0; i--) {
      if (
        messageCache[i].includes('Guild Name:') ||
        messageCache[i].includes('Total Members:') ||
        messageCache[i].includes('Online Members:') ||
        messageCache[i].includes('Offline Members:')
      )
        includes++;
      if (includes === 4) {
        global.guildOnline = messageCache.splice(i);
        break;
      }
    }
  } else if (msg.includes('Online Members:')) {
    global.onlineMembers = parseInt(msg.split('Online Members: ')[1], 10);
  } else if (msg.includes('cannot say the same message')) {
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          '§6-------------------------------------------------------------§r §cYou cannot say the same message twice!§6-------------------------------------------------------------'
        )
      ]
    });
  } else if (msg.includes(' has muted ')) {
    await textChannels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
    const uuid = await nameToUuid(msg.split(' ')[msg.split(' ').indexOf('for') - 1]);
    if (!uuid) return;
    const time = timeStringToSeconds(msg.split(' ')[msg.split(' ').length - 1]);
    const discordId = uuidToDiscord(uuid);
    if (!discordId) return;
    const guild = client.guilds.cache.get('242357942664429568') as Guild;
    const member = await guild.members.fetch(discordId);
    await member.timeout(time, 'Muted in-game');
  } else if (msg.includes(' has unmuted ')) {
    await textChannels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
    const uuid = await nameToUuid(msg.split(' ')[msg.split(' ').length - 1]);
    if (!uuid) return;
    const discordId = uuidToDiscord(uuid);
    if (!discordId) return;
    const guild = client.guilds.cache.get('242357942664429568') as Guild;
    const member = await guild.members.fetch(discordId);
    await member.timeout(null, 'Unmuted in-game');
  } else if (
    msg.includes('left the guild!') ||
    msg.includes('was promoted') ||
    msg.includes('was kicked') ||
    msg.includes('was demoted')
  ) {
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
    await textChannels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
  } else if (msg.includes('joined the guild!')) {
    let funFact;
    const name = msg.split(' ')[msg.split(' ').indexOf('joined') - 1];
    const uuid = await nameToUuid(name);
    if (!uuid) return;
    const funFacts = await (
      await fetch('https://api.api-ninjas.com/v1/facts?limit=3', {
        method: 'GET',
        headers: { 'X-Api-Key': config.keys.apiNinjasKey }
      })
    ).json();
    for (const i of funFacts) {
      if (i.fact.length < 150) {
        funFact = i.fact;
        break;
      }
    }
    await gcWebhook.send({
      username: 'Dominance',
      avatarURL: config.guild.icon,
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });
    await textChannels.guildLogs.send({
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${rawMsg} §b-------------------------------------------------------------`
        )
      ]
    });

    if (db.prepare('SELECT * FROM guildMemberArchives WHERE uuid = ?').get(uuid)) {
      db.prepare(`INSERT INTO guildMembers SELECT * FROM guildMemberArchives WHERE uuid = ?`).run(uuid);
      db.prepare('DELETE FROM guildMemberArchives WHERE uuid = ?').run(uuid);
    }
    db.prepare('INSERT OR IGNORE INTO guildMembers (uuid, messages, playtime) VALUES (?, ?, ?)').run(uuid, 0, 0);

    try {
      const { channel } = db.prepare('SELECT channel FROM waitlist WHERE uuid = ?').get(uuid) as WaitlistMember;
      await client.channels.cache.get(channel)!.delete();
      db.prepare('DELETE FROM waitlist WHERE uuid = ?').run(uuid);
    } catch (e) {
      /* empty */
    }
    try {
      const breakData = db.prepare('SELECT * FROM breaks WHERE uuid = ?').get(uuid) as BreakMember;
      const member = await textChannels.guildChat.guild.members.fetch(breakData.discord);
      const thread = client.channels.cache.get(breakData.thread) as ThreadChannel;
      db.prepare('DELETE FROM breaks WHERE uuid = ?').run(uuid);
      await member.roles.remove(thread.guild!.roles.cache.get(discordRoles.Break) as Role);
      await member.roles.add(discordRoles.slayer);
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`Welcome back, ${name}!`)
        .setDescription(`This thread has been archived and closed. Enjoy your stay!`);
      await thread.send({ embeds: [embed] });
      await thread.setArchived();
      await thread.setLocked();
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(breakData.discord, uuid);
      await chat(`/gc Welcome back from your break, ${name}! ${funFact}`);
      await textChannels.guildChat.send(
        `<a:wave_animated:1036265311390928897> Welcome back from your break, <@${breakData.discord}>! ${funFacts[2].fact}`
      );
      return;
    } catch (e) {
      /* empty */
    }
    await chat(`/gc Welcome to Dominance, ${name}! ${funFact}`);
    const discordId = uuidToDiscord(uuid);
    if (discordId) {
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(discordId, uuid);
      await textChannels.guildChat.send(
        `<a:wave_animated:1036265311390928897> Welcome to Dominance, <@${discordId}>! ${funFacts[2].fact}`
      );
      const member = await textChannels.guildChat.guild.members.fetch(discordId);
      await member.roles.add(discordRoles.slayer);
    } else {
      await textChannels.guildChat.send(
        `<a:wave_animated:1036265311390928897> Welcome to Dominance, ${name}! ${funFacts[2].fact}`
      );
    }
  } else if (msg.includes('have 5 minutes to accept') && msg.includes('invite')) {
    let name;
    if (msg.includes('offline invite')) {
      name = msg.split(' ')[msg.split(' ').indexOf('They') - 1].slice(0, -1);
    } else {
      name = msg.split(' ')[msg.split(' ').indexOf('to') - 1];
    }
    const uuid = await nameToUuid(name);
    const waitlist = db.prepare('SELECT discord, channel FROM waitlist WHERE uuid = ?').get(uuid) as WaitlistMember;
    const breaks = db.prepare('SELECT discord, thread FROM breaks WHERE uuid = ?').get(uuid) as BreakMember;
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setDescription(`${name} has been invited to the guild`);
    if (waitlist) {
      const channel = client.channels.cache.get(waitlist.channel) as TextChannel;
      await channel.send({ content: `<@${waitlist.discord}>`, embeds: [embed] });
    } else if (breaks) {
      const channel = client.channels.cache.get(breaks.thread) as ThreadChannel;
      await channel.send({ content: `<@${breaks.discord}>`, embeds: [embed] });
    }
  } else if (msg.includes('is already in another guild!')) {
    const name = msg.split(' ')[msg.split(' ').indexOf('is') - 1];
    const uuid = await nameToUuid(name);
    const waitlist = db.prepare('SELECT discord, channel FROM waitlist WHERE uuid = ?').get(uuid) as WaitlistMember;
    const breaks = db.prepare('SELECT discord, thread FROM breaks WHERE uuid = ?').get(uuid) as BreakMember;
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle(`${name} is in another guild`)
      .setDescription(`Please leave your current guild`);
    if (waitlist) {
      const channel = client.channels.cache.get(waitlist.channel) as TextChannel;
      await channel.send({ content: `<@${waitlist.discord}>`, embeds: [embed] });
    } else if (breaks) {
      const channel = client.channels.cache.get(breaks.thread) as ThreadChannel;
      await channel.send({ content: `<@${breaks.discord}>`, embeds: [embed] });
    }
  }
  if (msg.includes('left the guild!') || msg.includes('was kicked')) {
    let name = msg.split(' ')[msg.split(' ').indexOf('left') - 1];
    if (!name) {
      name = msg.split(' ')[msg.split(' ').indexOf('was') - 1];
    }
    const uuid = await nameToUuid(name);
    if (!uuid) return;
    const discordId = uuidToDiscord(uuid);

    db.prepare(`INSERT INTO guildMemberArchives SELECT * FROM guildMembers WHERE uuid = ?`).run(uuid);
    db.prepare('DELETE FROM guildMembers WHERE uuid = ?').run(uuid);

    if (discordId) {
      try {
        const member = await textChannels.guildChat.guild.members.fetch(discordId);
        await member.roles.remove(discordRoles.slayer);
        await member.roles.remove(discordRoles.elite);
        await member.roles.remove(discordRoles.hero);
        await member.roles.remove(discordRoles.godlike);
        await member.roles.remove(discordRoles.dominator);
        await member.roles.remove(discordRoles.goat);
        await member.roles.remove(discordRoles.staff);
      } catch (e) {
        /* empty */
      }
    }
  }
}
