import { registerFont, createCanvas } from 'canvas';
import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import Database from 'better-sqlite3';
import { ButtonStyle, Message } from 'discord.js';
import { rgbaColor } from './constants.js';
import { formatNumber, sleep } from './utils.js';
import { messages } from '../events/discord/ready.js';

const db = new Database('guild.db');
registerFont('./MinecraftRegular-Bmg3.ttf', { family: 'Minecraft' });

function generateLeaderboardImage(message: string[]) {
  const canvas = createCanvas(750, message.length * 39 + 6);
  const ctx = canvas.getContext('2d');
  let width = 5;
  let height = 29;
  for (let i = 0; i < 13; i += 1) {
    let splitMessageSpace: string[];
    try {
      splitMessageSpace = message[i].split(' ');
    } catch (e) {
      continue;
    }
    splitMessageSpace.forEach((msg, j) => {
      if (!msg.startsWith('§')) splitMessageSpace[j] = `§r${msg}`;
    });
    const splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
    splitMessage.shift();
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowColor = '#131313';
    ctx.font = '40px Minecraft';

    // eslint-disable-next-line no-loop-func
    Object.values(splitMessage).forEach((msg: string) => {
      const colorCode = rgbaColor[msg.charAt(0)];
      const currentMessage = msg.substring(1);
      if (colorCode) {
        ctx.fillStyle = colorCode;
      }
      ctx.fillText(currentMessage, width, height);
      width += ctx.measureText(currentMessage).width;
    });
    width = 5;
    height += 40;
  }
  return canvas.toBuffer();
}

async function generateLeaderboard(message: Message, order: string) {
  const data = db.prepare(`SELECT uuid, nameColor, "${order}" FROM guildMembers ORDER BY "${order}" DESC`).all();
  const leaderboard = [];
  const images = [];

  if (order === 'playtime') {
    for (let i = 0; i < data.length; i += 1) {
      leaderboard.push(`§e${i + 1}. ${data[i].nameColor} §7— §e${(data[i][order] / 3600).toFixed(1)} H`);
    }
  } else {
    for (let i = 0; i < data.length; i += 1) {
      leaderboard.push(`§e${i + 1}. ${data[i].nameColor} §7— §e${formatNumber(data[i][order])}`);
    }
  }
  for (let i = 12; i < 130; i += 13) {
    images.push(generateLeaderboardImage(leaderboard.slice(i - 12, i + 1)));
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
      Object.keys(db.prepare('SELECT * FROM guildMembers').get())[
        Object.keys(db.prepare('SELECT * FROM guildMembers').get()).length - 1
      ]
    );
    await sleep(1000);
    generateLeaderboard(messages.playtime, 'playtime');
    await sleep(1000);
    generateLeaderboard(messages.guildMessages, 'messages');
    await sleep(1000);
    generateLeaderboard(messages.bwStars, 'bwStars');
    await sleep(1000);
    generateLeaderboard(messages.bwFkdr, 'bwFkdr');
    await sleep(1000);
    generateLeaderboard(messages.duelsWins, 'duelsWins');
    await sleep(1000);
    generateLeaderboard(messages.duelsWlr, 'duelsWlr');
  }, 5 * 60 * 1000);
}
