import { rankColor } from './constants.js';

export async function nameToUUID(name) {
  try {
    return (await (await fetch(`https://playerdb.co/api/player/minecraft/${name}`)).json()).data.player.raw_id;
  } catch (e) {
    return null;
  }
}

export async function UUIDtoName(uuid) {
  try {
    return (await (await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`)).json()).data.player.username;
  } catch (e) {
    return null;
  }
}

export async function formatMentions(client, message) {
  let msg = message.content;
  if (msg.includes('<@') && msg.includes('>') && !msg.includes('<@&')) {
    const guildId = message.guild.id;
    const mentions = msg.match(/<@!?\d+>/g);
    const members = await client.guilds.cache.get(guildId)?.members?.fetch();
    Object.keys(mentions).forEach((mention) => {
      const user = members.get(mention.replace(/[^0-9]/g, ''));
      if (user) {
        msg = msg.replace(mention, `@${user.user.username}`);
      } else {
        msg = msg.replace(mention, '@Unknown User');
      }
    });
  }

  if (msg.includes('<@&') && msg.includes('>')) {
    const guildId = message.guild.id;
    const mentions = msg.match(/<@&\d+>/g);
    const roles = await client.guilds.cache.get(guildId)?.roles.fetch();
    Object.keys(mentions).forEach((mention) => {
      const role = roles.get(mention.replace(/[^0-9]/g, ''));
      if (role) {
        msg = msg.replace(mention, `@${role.name}`);
      } else {
        msg = msg.replace(mention, '@Unknown Role');
      }
    });
  }

  if (msg.includes('<#') && msg.includes('>')) {
    const { guild } = message;
    const mentions = msg.match(/<#\d+>/g);
    Object.keys(mentions).forEach((mention) => {
      msg = msg.replace(mention, `#${guild?.channels?.cache?.get(mention.replace(/[^0-9]/g, ''))?.name || 'deleted-channel'}`);
    });
  }

  if ((msg.includes('<a:') || msg.includes('<:')) && msg.includes('>')) {
    const mentions = [...(msg?.match(/<a:\w+:\d+>/g) || []), ...(msg?.match(/<:\w+:\d+>/g) || [])];
    Object.keys(mentions).forEach((mention) => {
      const emojiName = mention.replace(/[0-9]/g, '').replace(/<a:/g, '').replace(/:>/g, '').replace(/<:/g, '');
      msg = msg.replace(mention, `:${emojiName}:`);
    });
  }
  return msg;
}

export function getLevel(experience) {
  const EXP_NEEDED = [100000, 150000, 250000, 500000, 750000, 1000000, 1250000,
    1500000, 2000000, 2500000, 2500000, 2500000, 2500000, 2500000, 3000000];
  let exp = experience;
  let level = 0;

  for (let i = 0; i <= 1000; i += 1) {
    let need = 0;
    if (i >= EXP_NEEDED.length) {
      need = EXP_NEEDED[EXP_NEEDED.length - 1];
    } else {
      need = EXP_NEEDED[i];
    }

    if ((exp - need) < 0) {
      return Math.round((level + (exp / need)) * 100) / 100;
    }

    level += 1;
    exp -= need;
  }
  return 1000;
}

export async function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(dateObj) {
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
    default: suffix = 'th';
  }
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][dateObj.getMonth()];
  return `${date + suffix} ${month} ${dateObj.getFullYear()}`;
}

export function removeSectionSymbols(message) {
  let msg = message;
  let pos = msg.indexOf('\u00A7');
  while (pos !== -1) {
    msg = msg.slice(0, pos) + msg.slice(pos + 1);
    msg = msg.slice(0, pos) + msg.slice(pos + 1);
    pos = msg.indexOf('\u00A7');
  }
  return msg;
}

export function formatNumber(num) {
  if (num === null) {
    return null;
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function abbreviateNumber(num) {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function nameColor(player) {
  if (player.rank) {
    return player;
  }
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') {
    let monthlyPlusColor = rankColor[player.rankPlusColor];
    if (monthlyPlusColor === undefined) {
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
    if (monthlyPlusColor === undefined) {
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
