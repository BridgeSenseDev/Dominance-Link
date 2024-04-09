import { Client, EmbedBuilder, Guild, Role, TextChannel, ThreadChannel, WebhookClient } from 'discord.js';
import { Player, SkyblockMember } from 'hypixel-api-reborn';
import Database from 'better-sqlite3';
import {
  abbreviateNumber,
  addXp,
  formatNumber,
  nameToUuid,
  timeStringToSeconds,
  uuidToDiscord
} from '../../helper/utils.js';
import messageToImage from '../../helper/messageToImage.js';
import config from '../../config.json' assert { type: 'json' };
import { chat, waitForMessage } from '../../handlers/workerHandler.js';
import { textChannels } from '../discord/ready.js';
import { BreakMember, WaitlistMember } from '../../types/global.d.js';
import { hypixel } from '../../index.js';
import { archiveGuildMember, createGuildMember } from '../../handlers/databaseHandler.js';

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

function getBedwarsStats(player: Player) {
  const bedwars = player.stats?.bedwars;
  const star = bedwars?.level ?? 0;
  const rankTag = player.rank === 'Default' ? '' : `[${player.rank}] `;
  const fk = formatNumber(bedwars?.finalKills ?? 0);
  const fkdr = formatNumber(bedwars?.finalKDRatio ?? 0);
  const wins = formatNumber(bedwars?.wins ?? 0);
  const wlr = formatNumber(bedwars?.WLRatio ?? 0);
  const ws = formatNumber(bedwars?.winstreak ?? 0);

  return `/gc [${star}✫] ${rankTag}${player.nickname} FK: ${fk} FKDR: ${fkdr} W: ${wins} WLR: ${wlr} WS: ${ws}`;
}

function getDuelsStats(player: Player) {
  const duels = player.stats?.duels;
  const division = duels?.division ? '' : `[${duels?.division}] `;
  const rankTag = player.rank === 'Default' ? '' : `[${player.rank}] `;
  const wins = formatNumber(duels?.wins ?? 0);
  const wlr = formatNumber(duels?.WLRatio ?? 0);
  const cws = formatNumber(duels?.winstreak ?? 0);
  const bws = formatNumber(duels?.bestWinstreak ?? 0);

  return `/gc ${division}${rankTag}${player.nickname} W: ${wins} WLR: ${wlr} CWS: ${cws} BWS: ${bws}`;
}

async function getSkyblockStats(player: Player) {
  let sbMember;
  try {
    sbMember = await hypixel.getSkyblockMember(player.uuid).catch(() => null);
  } catch (e) {
    return `/gc Error: ${e}`;
  }

  if (sbMember) {
    const profile = sbMember.values().next().value as SkyblockMember;
    const { networth } = (await profile.getNetworth()) ?? 0;
    const sbSkillAverage = profile.skills.average;
    const sbLevel = profile.level;
    const rankTag = player.rank === 'Default' ? '' : `[${player.rank}] `;

    return `/gc [${sbLevel}] ${rankTag}${player.nickname} NW: ${abbreviateNumber(networth)} SA: ${formatNumber(sbSkillAverage)}`;
  }
  return `/gc Error: No profiles found for ${player.nickname}`;
}

export default async function execute(client: Client, msg: string, rawMsg: string, messagePosition: string) {
  if (messagePosition !== 'chat') return;
  if (msg.trim() === '') return;

  if (msg.includes('@everyone') || msg.includes('@here')) {
    logMessages += `${msg.replace('@', '')}\n`;
  } else {
    logMessages += `${msg}\n`;
  }
  if (messageCache.length >= 20) messageCache.shift();
  messageCache.push(msg);

  if (msg.startsWith('{"server":')) {
    // Limbo check
    const parsedMessage = JSON.parse(msg);
    if (parsedMessage.server !== 'limbo') {
      chat('\u00a7');
      return;
    }
  } else if (msg.startsWith('Guild >')) {
    if (msg.endsWith('joined.') && !msg.includes(':')) {
      const [name] = msg.replace(/Guild > |:/g, '').split(' ');
      global.playtime[name] = Math.floor(Date.now() / 1000);
      return;
    }

    if (msg.endsWith('left.') && !msg.includes(':')) {
      const [name] = msg.replace(/Guild > |:/g, '').split(' ');
      const uuid = await nameToUuid(name);

      const time = Math.floor(Date.now() / 1000) - global.playtime[name];
      if (!Number.isNaN(time)) {
        delete global.playtime[name];

        if (uuid) {
          createGuildMember(uuid);
        }

        db.prepare('UPDATE guildMembers SET playtime = playtime + (?) WHERE uuid = (?)').run(time, uuid);
      }
      return;
    }

    const author = msg.match(/Guild\s*>\s*(?:\[[^\]]+\]\s*)?(\w+)/)?.[1];
    if (msg.includes(':') && author) {
      // Guild message
      await gcWebhook.send({
        username: 'Dominance',
        avatarURL: config.guild.icon,
        files: [await messageToImage(rawMsg)]
      });

      const authorUuid = await nameToUuid(author);
      if (authorUuid) {
        createGuildMember(authorUuid);
        addXp('', authorUuid);
        db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(authorUuid);
      }

      // In-game commands
      const command = /!(\w+)/.exec(msg)?.[1];
      if (command) {
        let ign = /!\w+\s+(\S+)/.exec(msg)?.[1];
        if (!ign) {
          ign = author;
        }

        const player = await hypixel.getPlayer(ign).catch(async (e) => {
          chat(`/gc Error: ${e}`);
        });
        if (!player) return;

        switch (command) {
          case 'bw':
          case 'bedwars': {
            chat(getBedwarsStats(player));
            break;
          }
          case 'd':
          case 'duels': {
            chat(getDuelsStats(player));
            break;
          }
          case 'sb':
          case 'skyblock': {
            chat(await getSkyblockStats(player));
          }
        }
      }
    }
  } else if (msg.startsWith('Officer >')) {
    const author = msg.match(/Officer\s*>\s*(?:\[[^\]]+\]\s*)?(\w+)/)?.[1];
    if (msg.includes(':') && author) {
      // Officer message
      await ocWebhook.send({
        username: 'Dominance',
        avatarURL: config.guild.icon,
        files: [await messageToImage(rawMsg)]
      });

      const authorUuid = await nameToUuid(author);
      if (authorUuid) {
        createGuildMember(authorUuid);
        addXp('', authorUuid);
        db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(authorUuid);
      }
    }
  } else if (msg.startsWith('From')) {
    const author = msg.match(/From (\[.*\])? *(.+):/)?.[2];
    if (!author) return;

    const authorUuid = await nameToUuid(author);
    if (!authorUuid) return;

    const waitlist = db
      .prepare('SELECT discord, channel FROM waitlist WHERE uuid = ?')
      .get(authorUuid) as WaitlistMember;
    const breaks = db.prepare('SELECT discord, thread FROM breaks WHERE uuid = ?').get(authorUuid) as BreakMember;

    if (waitlist || breaks) {
      chat(`/g invite ${author}`);

      const receivedMessage = await waitForMessage(
        [
          'to your guild. They have 5 minutes to accept.',
          'You cannot invite this player to your guild!',
          'They will have 5 minutes to accept once they come online!',
          'is already in another guild!',
          'is already in your guild!',
          'to your guild! Wait for them to accept!'
        ],
        5000
      );

      let channel;
      let content;
      if (waitlist) {
        channel = client.channels.cache.get(waitlist.channel) as TextChannel;
        content = `<@${waitlist.discord}>`;
      } else if (breaks) {
        channel = client.channels.cache.get(breaks.thread) as ThreadChannel;
        content = `<@${breaks.discord}>`;
      }

      if (!receivedMessage) {
        chat(`/msg ${author} Guild invite failed.`);

        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle('Caution')
            .setDescription(`${config.emojis.aCross} Guild invite timed out.`);
          await channel.send({ content, embeds: [embed] });
        }
        return;
      }

      chat(`/msg ${author} ${receivedMessage.string}`);

      if (channel) {
        await channel.send({
          content,
          files: [
            await messageToImage(
              `§b-------------------------------------------------------------§r ${receivedMessage.motd} §b-------------------------------------------------------------`
            )
          ]
        });
      }
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

    createGuildMember(uuid);

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
      await member.roles.remove(thread.guild!.roles.cache.get(config.roles.break) as Role);
      await member.roles.add(config.roles.slayer);
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`Welcome back, ${name}!`)
        .setDescription(`This thread has been archived and closed. Enjoy your stay!`);
      await thread.send({ embeds: [embed] });
      await thread.setArchived();
      await thread.setLocked();
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(breakData.discord, uuid);
      chat(`/gc Welcome back from your break, ${name}! ${funFact}`);
      await textChannels.guildChat.send(
        `${config.emojis.aWave} Welcome back from your break, <@${breakData.discord}>! ${funFacts[2].fact}`
      );
      return;
    } catch (e) {
      /* empty */
    }
    chat(`/gc Welcome to Dominance, ${name}! ${funFact}`);
    const discordId = uuidToDiscord(uuid);
    if (discordId) {
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(discordId, uuid);
      await textChannels.guildChat.send(
        `${config.emojis.aWave} Welcome to Dominance, <@${discordId}>! ${funFacts[2].fact}`
      );
      const member = await textChannels.guildChat.guild.members.fetch(discordId);
      await member.roles.add(config.roles.slayer);
    } else {
      await textChannels.guildChat.send(`${config.emojis.aWave} Welcome to Dominance, ${name}! ${funFacts[2].fact}`);
    }
  }
  if (msg.includes('left the guild!') || msg.includes('was kicked')) {
    let name = msg.split(' ')[msg.split(' ').indexOf('left') - 1];
    if (!name) {
      name = msg.split(' ')[msg.split(' ').indexOf('was') - 1];
    }

    const uuid = await nameToUuid(name);
    if (!uuid) return;

    let member = null;
    const discordId = uuidToDiscord(uuid);
    if (discordId) {
      try {
        member = await textChannels.guildChat.guild.members.fetch(discordId);
      } catch (e) {
        /* empty */
      }
    }

    archiveGuildMember(member, uuid);
  }
}
