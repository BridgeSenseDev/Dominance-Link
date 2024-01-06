import { Canvas, FontLibrary } from '@julusian/skia-canvas';
import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import Database from 'better-sqlite3';
import { ButtonStyle, GuildChannel, Message } from 'discord.js';
import { rgbaColor } from './constants.js';
import { abbreviateNumber, formatNumber, sleep } from './utils.js';
import { textChannels } from '../events/discord/ready.js';
import { HypixelGuildMember } from '../types/global.d.js';
import { fetchGexpForMember } from '../handlers/databaseHandler.js';

const db = new Database('guild.db');
FontLibrary.use('Minecraft', './fonts/Minecraft Regular.ttf');

async function generateLeaderboardImage(message: string[]) {
  const canvas = new Canvas(750, message.length * 39 + 10);
  const ctx = canvas.getContext('2d');
  let width = 5;
  let height = 29;
  for (let i = 0; i < 16; i++) {
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

function fetchData(order: keyof HypixelGuildMember): HypixelGuildMember[] {
  if (order === 'lifetimeGexp') {
    const data = db.prepare('SELECT * FROM guildMembers').all() as HypixelGuildMember[];
    for (const member of data) {
      const gexpHistory = fetchGexpForMember(member.uuid);
      member.lifetimeGexp = gexpHistory.lifetimeGexp;
    }
    data.sort((a, b) => a.lifetimeGexp - b.lifetimeGexp);
    return data;
  }
  return db
    .prepare(`SELECT uuid, nameColor, "${order}" FROM guildMembers ORDER BY "${order}" ASC`)
    .all() as HypixelGuildMember[];
}

function generateEntries(data: HypixelGuildMember[], order: keyof HypixelGuildMember): string[] {
  const leaderboard: string[] = [];

  for (const i in data) {
    const value = data[i][order];
    let formattedValue: string | number;

    switch (order) {
      case 'networth':
        formattedValue = abbreviateNumber(value);
        break;
      case 'weeklyGexp':
      case 'lifetimeGexp':
        formattedValue = abbreviateNumber(value);
        break;
      case 'playtime':
        formattedValue = `${(value / 3600).toFixed(1)}H`;
        break;
      default:
        formattedValue = formatNumber(value);
    }

    leaderboard.push(`§e${data.length - Number(i)}. ${data[i].nameColor} §7— §e${formattedValue}`);
  }
  return leaderboard;
}

async function generateLeaderboard(channel: GuildChannel, order: keyof HypixelGuildMember) {
  const images = [];
  const data = fetchData(order);
  const leaderboard = generateEntries(data, order);

  const sliceSize = 15;
  const totalItems = leaderboard.length;

  let startIndex = Math.max(0, totalItems - sliceSize);
  let endIndex = totalItems;

  while (endIndex > 0) {
    const slice = leaderboard.slice(startIndex, endIndex);
    images.push(await generateLeaderboardImage(slice));
    endIndex = startIndex;
    startIndex = Math.max(0, endIndex - sliceSize);
  }

  if (!channel.isTextBased()) {
    return;
  }

  const messageArray: Message[] = [];
  const messages = await channel.messages.fetch({ limit: 100 });
  messages.forEach((message) => messageArray.push(message));

  for (const [index, message] of messageArray.entries()) {
    const image = images[index];

    if (!image) {
      await message.edit({});
      continue;
    }

    const row =
      index === 0
        ? new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('Scroll To Top')
              .setStyle(ButtonStyle.Link)
              .setURL(messageArray[messageArray.length - 1].url)
              .setEmoji({ id: '1036842301428875304' })
          )
        : undefined;

    const content = index === 8 ? `**Last Update**: <t:${Math.floor(Date.now() / 1000)}:R>` : '';

    await message.edit({
      content,
      files: [image],
      components: row ? [row] : []
    });
  }
}

export default async function leaderboards() {
  setInterval(async () => {
    generateLeaderboard(textChannels.weeklyGexp, 'weeklyGexp');
    await sleep(3000);
    generateLeaderboard(
      textChannels.dailyGexp,
      Object.keys(db.prepare('SELECT * FROM guildMembers').get() as HypixelGuildMember[])[
        Object.keys(db.prepare('SELECT * FROM guildMembers').get() as HypixelGuildMember[]).length - 1
      ]
    );
    await sleep(3000);
    generateLeaderboard(textChannels.playtime, 'playtime');
    await sleep(3000);
    generateLeaderboard(textChannels.guildMessages, 'messages');
    await sleep(3000);
    generateLeaderboard(textChannels.bwStars, 'bwStars');
    await sleep(3000);
    generateLeaderboard(textChannels.bwFkdr, 'bwFkdr');
    await sleep(3000);
    generateLeaderboard(textChannels.duelsWins, 'duelsWins');
    await sleep(3000);
    generateLeaderboard(textChannels.duelsWlr, 'duelsWlr');
    await sleep(3000);
    generateLeaderboard(textChannels.networth, 'networth');
    await sleep(3000);
    generateLeaderboard(textChannels.skillAverage, 'skillAverage');
    await sleep(3000);
    generateLeaderboard(textChannels.lifetimeGexp, 'lifetimeGexp');
    await sleep(3000);
    generateLeaderboard(textChannels.achievementPoints, 'achievementPoints');
    await sleep(3000);
    generateLeaderboard(textChannels.networkLevel, 'networkLevel');
    await sleep(3000);
    generateLeaderboard(textChannels.swLevel, 'swLevel');
    await sleep(3000);
    generateLeaderboard(textChannels.sbLevel, 'sbLevel');
    await sleep(3000);
    generateLeaderboard(textChannels.quests, 'quests');
  }, 60 * 1000);
}
