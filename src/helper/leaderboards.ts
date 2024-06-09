import { GlobalFonts, createCanvas } from "@napi-rs/canvas";
import Database from "better-sqlite3";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type GuildChannel,
  type Message,
} from "discord.js";
import config from "../config.json" with { type: "json" };
import { textChannels } from "../events/discord/ready.js";
import { fetchGexpForMember } from "../handlers/databaseHandler.js";
import type { HypixelGuildMember as BaseHypixelGuildMember } from "../types/global";
import {
  abbreviateNumber,
  formatNumber,
  getDaysInGuild,
  sleep,
} from "./clientUtils.js";
import { rgbaColor } from "./constants.js";

type HypixelGuildMember = BaseHypixelGuildMember & { [key: string]: number };

const db = new Database("guild.db");
GlobalFonts.registerFromPath("./fonts/Minecraft Regular.ttf", "Minecraft");

async function generateLeaderboardImage(message: string[]) {
  const canvas = createCanvas(750, message.length * 39 + 10);
  const ctx = canvas.getContext("2d");
  let width = 5;
  let height = 29;
  for (let i = 0; i < 16; i++) {
    let splitMessageSpace: string[];
    try {
      splitMessageSpace = message[i].split(" ");
    } catch (e) {
      continue;
    }
    for (const msg in splitMessageSpace) {
      if (!splitMessageSpace[msg].startsWith("§"))
        splitMessageSpace[msg] = `§r${splitMessageSpace[msg]}`;
    }
    const splitMessage = splitMessageSpace.join(" ").split(/[§\n]/g);
    splitMessage.shift();
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowColor = "#131313";
    ctx.shadowBlur = 0.001;
    ctx.font = "40px Minecraft";

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
  return canvas.toBuffer("image/png");
}

function fetchData(order: keyof HypixelGuildMember): HypixelGuildMember[] {
  if (order === "lifetimeGexp") {
    const data = db
      .prepare("SELECT * FROM guildMembers")
      .all() as HypixelGuildMember[];
    for (const member of data) {
      const gexpHistory = fetchGexpForMember(member.uuid);
      member.lifetimeGexp = gexpHistory.lifetimeGexp;
    }
    data.sort((a, b) => a.lifetimeGexp - b.lifetimeGexp);
    return data;
  }

  if (order === "dailyGexp") {
    const data = db
      .prepare("SELECT * FROM guildMembers")
      .all() as HypixelGuildMember[];
    for (const member of data) {
      const gexpHistory = fetchGexpForMember(member.uuid);
      member.dailyGexp = gexpHistory.dailyGexp;
    }
    data.sort((a, b) => a.dailyGexp - b.dailyGexp);
    return data;
  }
  if (order === "daysInGuild") {
    const data = db
      .prepare("SELECT * FROM guildMembers")
      .all() as HypixelGuildMember[];
    for (const member of data) {
      member.daysInGuild = getDaysInGuild(member.joined, member.baseDays);
    }
    data.sort((a, b) => a.daysInGuild - b.daysInGuild);
    return data;
  }

  return db
    .prepare(
      `SELECT uuid, nameColor, "${order}" FROM guildMembers ORDER BY "${order}" ASC`,
    )
    .all() as HypixelGuildMember[];
}

function generateEntries(
  data: HypixelGuildMember[],
  order: keyof HypixelGuildMember,
): string[] {
  const leaderboard: string[] = [];

  for (const i in data) {
    const value = data[i][order];
    let formattedValue: string | number;

    switch (order) {
      case "networth":
        formattedValue = abbreviateNumber(value);
        break;
      case "weeklyGexp":
      case "lifetimeGexp":
        formattedValue = abbreviateNumber(value);
        break;
      case "playtime":
        formattedValue = `${(value / 3600).toFixed(1)}H`;
        break;
      default:
        formattedValue = formatNumber(value);
    }

    leaderboard.push(
      `§e${data.length - Number(i)}. ${
        data[i].nameColor
      } §7— §e${formattedValue}`,
    );
  }
  return leaderboard;
}

async function generateLeaderboard(
  channel: GuildChannel,
  order: keyof HypixelGuildMember,
) {
  if (channel.isThread() && channel.archived) {
    await channel.setArchived(false);
    return;
  }

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
  for (const message of messages) {
    messageArray.push(message[1]);
  }

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
              .setLabel("Scroll To Top")
              .setStyle(ButtonStyle.Link)
              .setURL(messageArray[messageArray.length - 1].url)
              .setEmoji(config.emojis.up3d),
          )
        : undefined;

    const content =
      index === 8
        ? `**Last Update**: <t:${Math.floor(Date.now() / 1000)}:R>`
        : "";

    await message.edit({
      content,
      files: [image],
      components: row ? [row] : [],
    });
  }
}

export default async function leaderboards() {
  const leaderboardChannels = [
    { channel: textChannels.daysInGuild, name: "daysInGuild" },
    { channel: textChannels.weeklyGexp, name: "weeklyGexp" },
    { channel: textChannels.dailyGexp, name: "dailyGexp" },
    { channel: textChannels.playtime, name: "playtime" },
    { channel: textChannels.guildMessages, name: "messages" },
    { channel: textChannels.bwStars, name: "bwStars" },
    { channel: textChannels.bwFkdr, name: "bwFkdr" },
    { channel: textChannels.duelsWins, name: "duelsWins" },
    { channel: textChannels.duelsWlr, name: "duelsWlr" },
    { channel: textChannels.networth, name: "networth" },
    { channel: textChannels.skillAverage, name: "skillAverage" },
    { channel: textChannels.lifetimeGexp, name: "lifetimeGexp" },
    { channel: textChannels.achievementPoints, name: "achievementPoints" },
    { channel: textChannels.networkLevel, name: "networkLevel" },
    { channel: textChannels.swLevel, name: "swLevel" },
    { channel: textChannels.sbLevel, name: "sbLevel" },
    { channel: textChannels.quests, name: "quests" },
  ];

  setInterval(
    async () => {
      for (const { channel, name } of leaderboardChannels) {
        await generateLeaderboard(channel, name);
        await sleep(3000);
      }
    },
    10 * 60 * 1000,
  );
}
