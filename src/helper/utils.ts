import { Client, Message } from 'discord.js';
import Database from 'better-sqlite3';
import { rankColor, levelingXp } from './constants.js';
import config from '../config.json' assert { type: 'json' };

const db = new Database('guild.db');

export async function nameToUuid(name: string) {
  try {
    return (await (await fetch(`https://playerdb.co/api/player/minecraft/${name}`)).json()).data.player.raw_id;
  } catch (e) {
    return null;
  }
}

export async function uuidToName(uuid: string) {
  try {
    return (await (await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`)).json()).data.player.username;
  } catch (e) {
    return null;
  }
}

export async function formatMentions(client: Client, message: Message) {
  let msg = message.content;
  const guild = message.guild!;
  if (msg.includes('<@') && msg.includes('>') && !msg.includes('<@&')) {
    const mentions = msg.match(/<@!?\d+>/g)!;
    const members = await guild.members.fetch();
    for (const mention of mentions) {
      const user = members.get(mention.replace(/[^0-9]/g, ''));
      if (user) {
        msg = msg.replace(mention, `@${user.user.username}`);
      } else {
        msg = msg.replace(mention, `@Unknown User`);
      }
    }
  }

  if (msg.includes('<@&') && msg.includes('>')) {
    const mentions = msg.match(/<@&\d+>/g)!;
    const roles = await guild.roles.fetch();
    for (const mention of mentions) {
      const role = roles.get(mention.replace(/[^0-9]/g, ''));
      if (role) {
        msg = msg.replace(mention, `@${role.name}`);
      } else {
        msg = msg.replace(mention, `@Unknown Role`);
      }
    }
  }

  if (msg.includes('<#') && msg.includes('>')) {
    const mentions = msg.match(/<#\d+>/g)!;
    for (const mention of mentions) {
      msg = msg.replace(
        mention,
        `#${guild.channels.cache.get(mention.replace(/[^0-9]/g, ''))!.name || 'deleted-channel'}`
      );
    }

    if ((msg.includes('<a:') || msg.includes('<:')) && msg.includes('>')) {
      const emojis = [...(msg.match(/<a:\w+:\d+>/g) || []), ...(msg.match(/<:\w+:\d+>/g) || [])];
      for (const emoji of emojis) {
        const emojiName = emoji.replace(/[0-9]/g, '').replace(/<a:/g, '').replace(/:>/g, '').replace(/<:/g, '');
        msg = msg.replace(emoji, `:${emojiName}:`);
      }
    }
  }
  return msg;
}

export function getLevel(exp: number) {
  const expNeeded = [
    100000, 150000, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 2500000, 2500000, 2500000,
    2500000, 3000000
  ];
  let level = 0;

  for (let i = 0; i <= 1000; i++) {
    let need = 0;
    if (i >= expNeeded.length) {
      need = expNeeded[expNeeded.length - 1];
    } else {
      need = expNeeded[i];
    }

    if (exp - need < 0) {
      return Math.round((level + exp / need) * 100) / 100;
    }

    level++;
    exp -= need;
  }
  return 1000;
}

export async function sleep(ms: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(dateObj: Date) {
  let suffix;
  const date = dateObj.getDate();
  if (date > 3 && date < 21) suffix = 'th';
  switch (date % 10) {
    case 1:
      suffix = 'st';
      break;
    case 2:
      suffix = 'nd';
      break;
    case 3:
      suffix = 'rd';
      break;
    default:
      suffix = 'th';
  }
  const month = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ][dateObj.getMonth()];
  return `${date + suffix} ${month} ${dateObj.getFullYear()}`;
}

export function removeSectionSymbols(message: string) {
  let pos = message.indexOf('\u00A7');
  while (pos !== -1) {
    message = message.slice(0, pos) + message.slice(pos + 1);
    message = message.slice(0, pos) + message.slice(pos + 1);
    pos = message.indexOf('\u00A7');
  }
  return message;
}

export function formatNumber(number: number) {
  if (!number) {
    return null;
  }
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function abbreviateNumber(number: number) {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(number);
}

export function nameColor(player: any) {
  if (player.rank) {
    return player;
  }
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') {
    let monthlyPlusColor = rankColor[player.rankPlusColor];
    if (!monthlyPlusColor) {
      monthlyPlusColor = '§c';
    }
    if (player.monthlyRankColor === 'GOLD') {
      return `§6[MVP${monthlyPlusColor}++§6] ${player.displayname}`;
    }
    if (player.monthlyRankColor === 'AQUA') {
      return `§b[MVP${monthlyPlusColor}++§b] ${player.displayname}`;
    }
  }
  if (player.newPackageRank === 'MVP_PLUS') {
    let monthlyPlusColor = rankColor[player.rankPlusColor];
    if (!monthlyPlusColor) {
      monthlyPlusColor = '§c';
    }
    return `§b[MVP${monthlyPlusColor}+§b] ${player.displayname}`;
  }
  if (player.newPackageRank === 'MVP') {
    return `§b[MVP] ${player.displayname}`;
  }
  if (player.newPackageRank === 'VIP_PLUS') {
    return `§a[VIP§6+§a] ${player.displayname}`;
  }
  if (player.newPackageRank === 'VIP') {
    return `§a[VIP] ${player.displayname}`;
  }
  return `§7${player.displayname}`;
}

export function doubleDigits(number: number) {
  if (number.toString().length === 1) {
    return `0${number}`;
  }
  return number;
}

async function xpToLevel(exp: number, cap: number) {
  for (let i = 0; i < cap; i++) {
    if (exp - levelingXp[i] > 0) {
      exp -= levelingXp[i];
    } else {
      return i + exp / levelingXp[i];
    }
  }
  return cap;
}

export async function skillAverage(player: any) {
  let levels = 0;
  levels += await xpToLevel(player.experience_skill_farming, 60);
  levels += await xpToLevel(player.experience_skill_mining, 60);
  levels += await xpToLevel(player.experience_skill_combat, 60);
  levels += await xpToLevel(player.experience_skill_foraging, 50);
  levels += await xpToLevel(player.experience_skill_fishing, 50);
  levels += await xpToLevel(player.experience_skill_enchanting, 60);
  levels += await xpToLevel(player.experience_skill_alchemy, 50);
  levels += await xpToLevel(player.experience_skill_taming, 50);
  if (Number.isNaN(levels)) {
    return 0;
  }
  return levels / 8;
}

export function addXp(discordId: string) {
  if (discordId in global.lastMessage) {
    if (Date.now() / 1000 - Number(global.lastMessage[discordId]) >= 60) {
      db.prepare('UPDATE members SET xp = xp + ? WHERE discord = ?').run(
        Math.floor(Math.random() * 11 + 15),
        discordId
      );
    }
  } else {
    db.prepare('UPDATE members SET xp = xp + ? WHERE discord = ?').run(Math.floor(Math.random() * 11 + 15), discordId);
  }
  db.prepare('UPDATE members SET (messages) = messages + 1 WHERE discord = (?)').run(discordId);
  global.lastMessage[discordId] = Math.floor(Date.now() / 1000).toString();
}

export async function hypixelRequest(url: string) {
  try {
    return await (
      await fetch(url, {
        headers: { 'API-Key': config.keys.hypixelApiKey }
      })
    ).json();
  } catch (e) {
    throw new Error("Couldn't get a response from the API");
  }
}
