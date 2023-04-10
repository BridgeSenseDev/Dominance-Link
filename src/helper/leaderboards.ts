import { Canvas, FontLibrary } from 'skia-canvas';
import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import Database from 'better-sqlite3';
import { ButtonStyle, Message } from 'discord.js';
import { rgbaColor } from './constants.js';
import { abbreviateNumber, formatNumber, sleep } from './utils.js';
import { messages } from '../events/discord/ready.js';
import { HypixelGuildMember } from '../types/global.d.js';

const db = new Database('guild.db');
FontLibrary.use('Minecraft', './fonts/Minecraft Regular.ttf');

async function generateLeaderboardImage(message: string[]) {
  const canvas = new Canvas(750, message.length * 39 + 6);
  const ctx = canvas.getContext('2d');
  let width = 5;
  let height = 29;
  for (let i = 0; i < 13; i++) {
    let splitMessageSpace: string[];
    try {
      splitMessageSpace = message[i].split(' ');
    } catch (e) {
      continue;
    }
    for (const msg in splitMessageSpace) {
      if (!splitMessageSpace[msg].startsWith('§')) splitMessageSpace[msg] = `§r${splitMessageSpace[msg]}`;
    }
    const splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
    splitMessage.shift();
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowColor = '#131313';
    ctx.font = '40px Minecraft';

    for (const msg of splitMessage) {
      const colorCode = rgbaColor[msg.charAt(0)];
      const currentMessage = msg.substring(1);
      if (colorCode) {
        ctx.fillStyle = colorCode;
      }
      ctx.fillText(currentMessage, width, height);
      width += ctx.measureText(currentMessage).width;
    }
    width = 5;
    height += 40;
  }
  const buffer = await canvas.toBuffer('png');
  return buffer;
}

async function generateLeaderboard(message: Message, order: keyof HypixelGuildMember) {
  const data = db
    .prepare(`SELECT uuid, nameColor, "${order}" FROM guildMembers ORDER BY "${order}" ASC`)
    .all() as HypixelGuildMember[];
  const leaderboard: string[] = [];
  const images = [];

  if (order === 'networth') {
    for (const i in data) {
      leaderboard.push(`§e${data.length - Number(i)}. ${data[i].nameColor} §7— §e${abbreviateNumber(data[i][order])}`);
    }
  } else if (order === 'playtime') {
    for (const i in data) {
      leaderboard.push(
        `§e${data.length - Number(i)}. ${data[i].nameColor} §7— §e${(data[i][order] / 3600).toFixed(1)}H`
      );
    }
  } else if (
    order === 'weeklyGexp' ||
    order ===
      (Object.keys(db.prepare('SELECT * FROM guildMembers').get() as HypixelGuildMember)[
        Object.keys(db.prepare('SELECT * FROM guildMembers').get() as HypixelGuildMember).length - 1
      ] as keyof HypixelGuildMember)
  ) {
    for (const i in data) {
      leaderboard.push(`§e${data.length - Number(i)}. ${data[i].nameColor} §7— §e${abbreviateNumber(data[i][order])}`);
    }
  } else {
    for (const i in data) {
      leaderboard.push(`§e${data.length - Number(i)}. ${data[i].nameColor} §7— §e${formatNumber(data[i][order])}`);
    }
  }
  for (let i = 12; i < 130; i += 13) {
    images.push(await generateLeaderboardImage(leaderboard.slice(i - 12, i + 1)));
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Scroll To Top')
      .setStyle(ButtonStyle.Link)
      .setURL(message.url)
      .setEmoji({ id: '1036842301428875304' })
  );
  await message.edit({
    content: `**Last Update**: <t:${Math.floor(Date.now() / 1000)}:R>`,
    files: images,
    components: [row]
  });
}

export default async function leaderboards() {
  setInterval(async () => {
    generateLeaderboard(messages.weeklyGexp, 'weeklyGexp');
    await sleep(1000);
    generateLeaderboard(
      messages.dailyGexp,
      Object.keys(db.prepare('SELECT * FROM guildMembers').get() as HypixelGuildMember[])[
        Object.keys(db.prepare('SELECT * FROM guildMembers').get() as HypixelGuildMember[]).length - 1
      ]
    );
    await sleep(3000);
    generateLeaderboard(messages.playtime, 'playtime');
    await sleep(3000);
    generateLeaderboard(messages.guildMessages, 'messages');
    await sleep(3000);
    generateLeaderboard(messages.bwStars, 'bwStars');
    await sleep(3000);
    generateLeaderboard(messages.bwFkdr, 'bwFkdr');
    await sleep(3000);
    generateLeaderboard(messages.duelsWins, 'duelsWins');
    await sleep(3000);
    generateLeaderboard(messages.duelsWlr, 'duelsWlr');
    await sleep(3000);
    generateLeaderboard(messages.duelsWlr, 'duelsWlr');
    await sleep(3000);
    generateLeaderboard(messages.networth, 'networth');
    await sleep(3000);
    generateLeaderboard(messages.skillAverage, 'skillAverage');
  }, 10 * 60 * 1000);
}
