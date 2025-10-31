import Database from "bun:sqlite";
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ForumThreadChannel,
} from "discord.js";
import config from "../config.json" with { type: "json" };
import { textChannels } from "../events/discord/ready.ts";
import { fetchGexpForMembers } from "../handlers/databaseHandler.ts";
import type { HypixelGuildMember as BaseHypixelGuildMember } from "../types/global";
import { abbreviateNumber, formatNumber, sleep } from "./clientUtils.js";
import { rgbaColor } from "./constants.js";
import { camelCaseToWords } from "./utils.ts";

type HypixelGuildMember = BaseHypixelGuildMember & { [key: string]: number };

const db = new Database("guild.db");
GlobalFonts.registerFromPath("./fonts/Minecraft Regular.ttf", "Minecraft");

const sortOrder = [
  "zombiesKills",
  "zombiesWins",
  "pitPrestige",
  "mmWins",
  "networth",
  "weeklyGexp",
  "playtime",
  "messages",
  "bwStars",
  "bwFkdr",
  "bridgeWins",
  "bridgeWlr",
  "duelsWins",
  "duelsWlr",
  "skillAverage",
  "achievementPoints",
  "networkLevel",
  "swLevel",
  "sbLevel",
  "quests",
  "lifetimeGexp",
  "dailyGexp",
  "daysInGuild",
];

const canvasWidth = 1000;
const canvasHeight = 540;
const rectHeight = 40;
const verticalSpacing = 10;
const borderRadius = 15;
const boxColor = "#1F2124";
const defaultTextColor = "#ffffff";
const font = "42px Minecraft";

// Column dimensions
const leftColumnX = 20;
const leftColumnWidth = 100;
const middleColumnX = leftColumnX + leftColumnWidth + 10;
const middleColumnWidth = 540;
const rightColumnX = middleColumnX + middleColumnWidth + 10;
const rightColumnWidth = 300;

function drawRoundedRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
}

async function generateLeaderboardPageImage(
  page: number,
  data: HypixelGuildMember[],
  stat: string,
) {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  ctx.fillStyle = defaultTextColor;
  ctx.textAlign = "center";

  // Modified startIndex calculation
  const startIndex = page * 10;
  const endIndex = Math.min(startIndex + 10, data.length);
  const pageData = data.slice(startIndex, endIndex);

  // Draw header row
  const headerY = 0;
  ctx.fillStyle = boxColor;
  drawRoundedRect(
    ctx,
    leftColumnX,
    headerY,
    leftColumnWidth,
    rectHeight,
    borderRadius,
    true,
  );
  drawRoundedRect(
    ctx,
    middleColumnX,
    headerY,
    middleColumnWidth,
    rectHeight,
    borderRadius,
    true,
  );
  drawRoundedRect(
    ctx,
    rightColumnX,
    headerY,
    rightColumnWidth,
    rectHeight,
    borderRadius,
    true,
  );
  ctx.fillStyle = defaultTextColor;
  const posTextMetrics = ctx.measureText("Pos");
  const posTextHeight =
    posTextMetrics.actualBoundingBoxAscent +
    posTextMetrics.actualBoundingBoxDescent;
  const posVerticalOffset = (rectHeight - posTextHeight) / 2;
  ctx.fillText(
    "Pos",
    leftColumnX + leftColumnWidth / 2,
    headerY + posVerticalOffset + posTextMetrics.actualBoundingBoxAscent,
  );

  const namesTextMetrics = ctx.measureText("Players");
  const namesTextHeight =
    namesTextMetrics.actualBoundingBoxAscent +
    namesTextMetrics.actualBoundingBoxDescent;
  const namesVerticalOffset = (rectHeight - namesTextHeight) / 2;
  ctx.fillText(
    "Players",
    middleColumnX + middleColumnWidth / 2,
    headerY + namesVerticalOffset + namesTextMetrics.actualBoundingBoxAscent,
  );

  const statTextMetrics = ctx.measureText(stat);
  const statTextHeight =
    statTextMetrics.actualBoundingBoxAscent +
    statTextMetrics.actualBoundingBoxDescent;
  const statVerticalOffset = (rectHeight - statTextHeight) / 2;

  let compactStat = camelCaseToWords(stat);
  if (stat === "achievementPoints") {
    compactStat = "AP";
  }
  ctx.fillText(
    compactStat,
    rightColumnX + rightColumnWidth / 2,
    headerY + statVerticalOffset + statTextMetrics.actualBoundingBoxAscent,
  );

  for (let i = 0; i < pageData.length; i++) {
    const y = (i + 1) * (rectHeight + verticalSpacing); // Start drawing after the header
    const member = pageData[i];

    const pos = startIndex + i + 1;
    const nameColor = member.nameColor;
    let statValue: string | number = formatNumber(
      member[stat as keyof HypixelGuildMember],
    );

    if (
      stat === "networth" ||
      stat === "weeklyGexp" ||
      stat === "lifetimeGexp"
    ) {
      statValue = abbreviateNumber(member[stat as keyof HypixelGuildMember]);
    } else if (stat === "playtime") {
      statValue = `${(member[stat as keyof HypixelGuildMember] / 3600).toFixed(1)}H`;
    }

    // Draw backgrounds
    ctx.fillStyle = boxColor;
    drawRoundedRect(
      ctx,
      leftColumnX,
      y,
      leftColumnWidth,
      rectHeight,
      borderRadius,
      true,
    );
    drawRoundedRect(
      ctx,
      middleColumnX,
      y,
      middleColumnWidth,
      rectHeight,
      borderRadius,
      true,
    );
    drawRoundedRect(
      ctx,
      rightColumnX,
      y,
      rightColumnWidth,
      rectHeight,
      borderRadius,
      true,
    );

    // Draw Position
    const posValueTextMetrics = ctx.measureText(`#${pos}`);
    const posValueTextHeight =
      posValueTextMetrics.actualBoundingBoxAscent +
      posValueTextMetrics.actualBoundingBoxDescent;
    const posValueVerticalOffset = (rectHeight - posValueTextHeight) / 2;

    if (pos === 1) {
      ctx.fillStyle = "#FFD700"; // Gold
    } else if (pos === 2) {
      ctx.fillStyle = "#C0C0C0"; // Silver
    } else if (pos === 3) {
      ctx.fillStyle = "#CD7F32"; // Bronze
    } else {
      ctx.fillStyle = defaultTextColor;
    }
    ctx.fillText(
      `#${pos}`,
      leftColumnX + leftColumnWidth / 2,
      y + posValueVerticalOffset + posValueTextMetrics.actualBoundingBoxAscent,
    );

    // Draw Player Name with Colors
    const splitMessage = nameColor.split(/[§\n]/g);
    splitMessage.shift();

    let totalNameWidth = 0;
    for (const msg of splitMessage) {
      const currentMessage = msg.substring(1);
      totalNameWidth += ctx.measureText(currentMessage).width;
    }

    let nameWidth = middleColumnX + (middleColumnWidth - totalNameWidth) / 2;

    ctx.textAlign = "left";
    for (const msg of splitMessage) {
      const colorCode = rgbaColor[msg.charAt(0)];
      const currentMessage = msg.substring(1);
      if (colorCode) {
        ctx.fillStyle = colorCode;
      }
      const namePartTextMetrics = ctx.measureText(currentMessage);
      const namePartTextHeight =
        namePartTextMetrics.actualBoundingBoxAscent +
        namePartTextMetrics.actualBoundingBoxDescent;
      const namePartVerticalOffset = (rectHeight - namePartTextHeight) / 2;
      ctx.fillText(
        currentMessage,
        nameWidth,
        y +
          namePartVerticalOffset +
          namePartTextMetrics.actualBoundingBoxAscent,
      );
      nameWidth += ctx.measureText(currentMessage).width;
    }

    // Draw Stat Value
    ctx.fillStyle = defaultTextColor;
    ctx.textAlign = "center";
    const statValueTextMetrics = ctx.measureText(camelCaseToWords(statValue));
    const statValueTextHeight =
      statValueTextMetrics.actualBoundingBoxAscent +
      statValueTextMetrics.actualBoundingBoxDescent;
    const statValueVerticalOffset = (rectHeight - statValueTextHeight) / 2;
    ctx.fillText(
      statValue,
      rightColumnX + rightColumnWidth / 2,
      y +
        statValueVerticalOffset +
        statValueTextMetrics.actualBoundingBoxAscent,
    );
  }

  return canvas.toBuffer("image/png");
}

function fetchData(order: keyof HypixelGuildMember): HypixelGuildMember[] {
  if (order === "lifetimeGexp") {
    let data = db
      .prepare("SELECT * FROM guildMembers")
      .all() as HypixelGuildMember[];

    data = fetchGexpForMembers(data);

    data.sort((a, b) => b["lifetimeGexp"] - a["lifetimeGexp"]);
    return data;
  }

  if (order === "dailyGexp") {
    let data = db
      .prepare("SELECT * FROM guildMembers")
      .all() as HypixelGuildMember[];

    data = fetchGexpForMembers(data);

    data.sort((a, b) => b["dailyGexp"] - a["dailyGexp"]);
    return data;
  }
  if (order === "daysInGuild") {
    let data = db
      .prepare("SELECT * FROM guildMembers")
      .all() as HypixelGuildMember[];

    data = fetchGexpForMembers(data);

    data.sort((a, b) => b["daysInGuild"] - a["daysInGuild"]);
    return data;
  }

  const orderDirection = sortOrder.includes(order as string) ? "DESC" : "ASC";

  return db
    .prepare(
      `SELECT uuid, nameColor, "${order}" FROM guildMembers ORDER BY "${order}" ${orderDirection}`,
    )
    .all() as HypixelGuildMember[];
}

export const getLbEmbedForPage = async (
  page: number,
  lb: string,
): Promise<[EmbedBuilder, AttachmentBuilder | null]> => {
  if (!sortOrder.includes(lb)) {
    throw new Error(`Invalid leaderboard type: ${lb}`);
  }

  const data = fetchData(lb as keyof HypixelGuildMember);
  const image = await generateLeaderboardPageImage(page, data, lb);
  const attachment = new AttachmentBuilder(image, { name: "leaderboard.png" });

  return [
    new EmbedBuilder().setImage(`attachment://${attachment.name}`).setFooter({
      text: `Page ${page + 1} of ${Math.ceil(data.length / 10)}`, // Modified Footer
    }),
    attachment,
  ];
};

async function generateLeaderboard(
  channel: ForumThreadChannel,
  order: keyof HypixelGuildMember,
) {
  if (channel.isThread() && channel.archived) {
    await channel.setArchived(false);
    return;
  }

  const lbName = order as string;
  const embed = await getLbEmbedForPage(0, lbName);

  if (!channel.isThread()) {
    return;
  }

  const starterMessage = await channel.fetchStarterMessage();

  const content = `**Last Update**: <t:${Math.floor(Date.now() / 1000)}:R>`;
  const paginatorRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${order}LbLeftPage`)
      .setEmoji(config.emojis.leftArrow)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`${order}LbRightPage`)
      .setEmoji(config.emojis.rightArrow)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${order}LbSearch`)
      .setEmoji(config.emojis.search)
      .setStyle(ButtonStyle.Primary),
  );

  if (starterMessage && embed[1]) {
    await starterMessage.edit({
      content,
      embeds: [embed[0]],
      components: [paginatorRow],
      files: [embed[1]],
    });
  }
}

export default async function leaderboards() {
  const leaderboardChannels = [
    { channel: textChannels["daysInGuild"], name: "daysInGuild" },
    { channel: textChannels["weeklyGexp"], name: "weeklyGexp" },
    { channel: textChannels["dailyGexp"], name: "dailyGexp" },
    { channel: textChannels["playtime"], name: "playtime" },
    { channel: textChannels["guildMessages"], name: "messages" },
    { channel: textChannels["bwStars"], name: "bwStars" },
    { channel: textChannels["bwFkdr"], name: "bwFkdr" },
    { channel: textChannels["duelsWins"], name: "duelsWins" },
    { channel: textChannels["duelsWlr"], name: "duelsWlr" },
    { channel: textChannels["networth"], name: "networth" },
    { channel: textChannels["skillAverage"], name: "skillAverage" },
    { channel: textChannels["lifetimeGexp"], name: "lifetimeGexp" },
    { channel: textChannels["achievementPoints"], name: "achievementPoints" },
    { channel: textChannels["networkLevel"], name: "networkLevel" },
    { channel: textChannels["swLevel"], name: "swLevel" },
    { channel: textChannels["sbLevel"], name: "sbLevel" },
    { channel: textChannels["quests"], name: "quests" },
    { channel: textChannels["bridgeWins"], name: "bridgeWins" },
    { channel: textChannels["bridgeWlr"], name: "bridgeWlr" },
    { channel: textChannels["mmWins"], name: "mmWins" },
    { channel: textChannels["pitPrestige"], name: "pitPrestige" },
    { channel: textChannels["zombiesKills"], name: "zombiesKills" },
    { channel: textChannels["zombiesWins"], name: "zombiesWins" },
  ];

  setInterval(
    async () => {
      for (const { channel, name } of leaderboardChannels) {
        if (!channel.isThread()) continue;

        await generateLeaderboard(channel, name);
        await sleep(3000);
      }
    },
    10 * 60 * 1000,
  );
}

export const getMemberLeaderboardPage = (
  memberUuid: string,
  leaderboardName: string,
): number | null => {
  if (!sortOrder.includes(leaderboardName)) {
    return null;
  }

  const leaderboardData = fetchData(
    leaderboardName as keyof HypixelGuildMember,
  );
  const memberIndex = leaderboardData.findIndex(
    (member) => member.uuid === memberUuid,
  );
  if (memberIndex === -1) {
    return null;
  }

  return Math.floor(memberIndex / 10);
};
