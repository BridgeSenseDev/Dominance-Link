import { readFileSync } from "node:fs";
import { Image, createCanvas } from "@napi-rs/canvas";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.json" with { type: "json" };
import {
  fetchGexpForMember,
  fetchGuildMember,
  fetchMember,
  fetchTotalLifetimeGexp,
  fetchTotalWeeklyGexp,
} from "../handlers/databaseHandler.js";
import {
  abbreviateNumber,
  getDaysInGuild,
  nameToUuid,
} from "../helper/clientUtils.js";
import renderBox, { renderSkin } from "../helper/render.js";
import type { StringObject } from "../types/global";

const tagColorCodes: StringObject = {
  "[Slayer]": "§2[Slayer]",
  "[Hero]": "§6[Hero]",
  "[Elite]": "§5[Elite]",
  "[Staff]": "§c[Staff]",
  "[Owner]": "§4[Owner]",
  "[GM]": "§4[GM]",
};

export const data = new SlashCommandBuilder()
  .setName("member")
  .setDescription("View individual guild member stats")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Minecraft username")
      .setRequired(true)
      .setAutocomplete(true),
  );

function daysColor(days: number) {
  if (days > 500) {
    return "§4";
  }
  if (days > 400) {
    return "§c";
  }
  if (days > 300) {
    return "§5";
  }
  if (days > 200) {
    return "§6";
  }
  if (days > 100) {
    return "§2";
  }
  return "§a";
}

function formatUnixTimestamp(unixTimestamp: number): string {
  // Convert Unix timestamp to milliseconds
  const date = new Date(unixTimestamp * 1000);

  // Extract date components
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-based in JavaScript
  const year = date.getFullYear();

  // Extract time components and convert to 12-hour format
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  hours = hours || 12;

  // Format date and time
  return `${day.toString().padStart(2, "0")}/${month
    .toString()
    .padStart(2, "0")}/${year} ${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${ampm}`;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const uuid = await nameToUuid(interaction.options.getString("name") ?? "");
  if (!uuid) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} **${interaction.options.getString(
          "name",
        )}** is an invalid IGN`,
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const guildMember = fetchGuildMember(uuid);
  if (!guildMember) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} **${interaction.options.getString(
          "name",
        )}** is not in Dominance`,
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const gexpHistory = fetchGexpForMember(uuid);

  const canvas = createCanvas(591, 568);
  const ctx = canvas.getContext("2d");
  const image = new Image();
  image.src = readFileSync("./images/member_bg.png");
  ctx.filter = "blur(6px)";
  ctx.drawImage(image, 0, 0);
  ctx.filter = "none";

  renderBox(
    ctx,
    {
      x: 13,
      y: 14,
      width: 125,
      height: 132,
    },
    {
      text: "",
      font: "40px Minecraft",
    },
  );

  renderBox(
    ctx,
    {
      x: 146,
      y: 14,
      width: 432,
      height: 52,
    },
    {
      text: guildMember.nameColor,
      font: "40px Minecraft",
    },
  );

  renderBox(
    ctx,
    {
      x: 146,
      y: 74,
      width: 432,
      height: 32,
    },
    {
      text: `§7Joined At: §3${formatUnixTimestamp(
        Number.parseInt(guildMember.joined, 10) / 1000,
      )}`,
      font: "20px Minecraft",
    },
  );

  renderBox(
    ctx,
    {
      x: 146,
      y: 114,
      width: 124,
      height: 32,
    },
    {
      text: tagColorCodes[guildMember.tag],
      font: "22px Minecraft Bold",
    },
  );

  renderBox(
    ctx,
    {
      x: 278,
      y: 114,
      width: 300,
      height: 32,
    },
    {
      text: "§cLifetime §fGuild Stats",
      font: "20px Minecraft Bold",
    },
  );

  let y = 154;
  let x = 13;

  const dcMessages = fetchMember(uuid)?.messages ?? 0;

  const mainData = [
    ["§aDaily GEXP", `§a${abbreviateNumber(gexpHistory.dailyGexp)}`],
    ["§aWeekly GEXP", `§a${abbreviateNumber(gexpHistory.weeklyGexp)}`],
    ["§aMonthly GEXP", `§a${abbreviateNumber(gexpHistory.monthlyGexp)}`],
    ["§cLifetime GEXP", `§c${abbreviateNumber(gexpHistory.lifetimeGexp)}`],
    [
      "§cGEXP / Day",
      `§c${abbreviateNumber(
        gexpHistory.lifetimeGexp /
          Number(
            (new Date().getTime() -
              new Date(Number.parseInt(guildMember.joined, 10)).getTime()) /
              (1000 * 3600 * 24),
          ),
      )}`,
    ],
    [
      "§cDays In Guild",
      `§c${abbreviateNumber(
        (new Date().getTime() -
          new Date(Number.parseInt(guildMember.joined, 10)).getTime()) /
          (1000 * 3600 * 24),
      )}`,
    ],
    ["§6Playtime", `§6${(guildMember.playtime / 3600).toFixed(1)}H`],
    ["§6MC Messages", `§6${abbreviateNumber(guildMember.messages)}`],
    ["§6DC Messages", `§6${abbreviateNumber(dcMessages)}`],
  ];

  for (let i = 0; i < 9; i++) {
    if (i % 3 === 0 && i !== 0) {
      x = 13;
      y += 88;
    }
    renderBox(
      ctx,
      {
        x,
        y,
        width: 183,
        height: 80,
      },
      {
        header: mainData[i][0],
        text: mainData[i][1],
        font: "30px Minecraft",
        textY: [24, 6],
      },
    );
    x += 191;
  }

  renderBox(
    ctx,
    {
      x: 13,
      y: 418,
      width: 279,
      height: 54,
    },
    {
      header: "§bWeekly Guild Contribution",
      text: `§b${(
        (guildMember.weeklyGexp / fetchTotalWeeklyGexp()) *
        100
      ).toFixed(1)}%`,
      font: "20px Minecraft",
      textY: [19, 9],
    },
  );

  renderBox(
    ctx,
    {
      x: 299,
      y: 418,
      width: 279,
      height: 54,
    },
    {
      header: "§bLifetime Guild Contribution",
      text: `§b${(
        (gexpHistory.lifetimeGexp / fetchTotalLifetimeGexp()) *
        100
      ).toFixed(1)}%`,
      font: "20px Minecraft",
      textY: [19, 9],
    },
  );

  renderBox(
    ctx,
    {
      x: 13,
      y: 480,
      width: 565,
      height: 32,
    },
    {
      text: `§7Total Days In Guild: ${daysColor(
        getDaysInGuild(guildMember.joined, guildMember.baseDays),
      )}${abbreviateNumber(
        getDaysInGuild(guildMember.joined, guildMember.baseDays),
      )} Days`,
      font: "20px Minecraft",
    },
  );

  renderBox(
    ctx,
    {
      x: 13,
      y: 521,
      width: 565,
      height: 34,
    },
    {
      text: "§gDo§hmin§ian§jce",
      font: "20px Minecraft Bold",
    },
  );

  await renderSkin(ctx, { x: 15, y: 14, width: 126, height: 132 }, uuid);

  if (config.admins.includes(interaction.member?.user.id ?? "")) {
    const memberDaysRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`baseDays${uuid}`)
        .setLabel("Change base days")
        .setStyle(ButtonStyle.Secondary),
    );
    await interaction.editReply({
      files: [canvas.toBuffer("image/png")],
      components: [memberDaysRow],
    });
    return;
  }

  await interaction.editReply({ files: [canvas.toBuffer("image/png")] });
}
