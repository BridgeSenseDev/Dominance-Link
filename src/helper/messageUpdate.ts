import Database from "better-sqlite3";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  escapeMarkdown,
} from "discord.js";
import config from "../config.json" assert { type: "json" };
import { messages } from "../events/discord/ready.js";
import type { BreakMember, HypixelGuildMember } from "../types/global";
import { uuidToName } from "./clientUtils.js";
import { bullet, dividers, invis, sub } from "./constants.js";
import { formatDate } from "./utils.js";

const db = new Database("guild.db");

export async function unverifiedUpdate() {
  setInterval(async () => {
    const data = db
      .prepare("SELECT * FROM guildMembers")
      .all() as HypixelGuildMember[];
    const names = [];

    for (let i = data.length - 1; i >= 0; i--) {
      if (!data[i].discord) {
        names.push(await uuidToName(data[i].uuid));
      }
    }
    names.sort();

    let description =
      "List of guild members who are unverified / not in the discord\n";
    for (const name of names) {
      description += `\n${name}`;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle("Unlinked Members")
      .setDescription(escapeMarkdown(description));
    await messages.unverified.edit({ content: "", embeds: [embed] });
  }, 60 * 1000);
}

export async function reqsUpdate() {
  setInterval(async () => {
    const data = db
      .prepare("SELECT * FROM guildMembers WHERE reqs = 0")
      .all() as HypixelGuildMember[];
    const names = [];

    for (let i = data.length - 1; i >= 0; i--) {
      names.push(await uuidToName(data[i].uuid));
    }
    names.sort();

    let description =
      "List of guild members who don't meet guild requirements\n";
    for (const name of names) {
      description += `\n${name}`;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle("Guild Requirements")
      .setDescription(escapeMarkdown(description));
    await messages.requirements.edit({ content: "", embeds: [embed] });
  }, 60 * 1000);
}

export async function breakUpdate() {
  setInterval(async () => {
    const data = db.prepare("SELECT * FROM breaks").all() as BreakMember[];
    let description = "";
    for (const i in data) {
      description += `\n${bullet} ${await uuidToName(data[i].uuid)} <#${
        data[i].thread
      }>`;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setAuthor({ name: "Dominance Break Forms", iconURL: config.guild.icon })
      .setDescription(
        `**How it Works:**\n\n${bullet} You can make a break form to inform staff of upcoming inactivity\n${bullet} Members on ` +
          `break retain their original permissions\n${bullet} You may be kicked from the guild based on your break length\n${invis}` +
          `${sub} Staff will consider your days in guild before kicking\n${bullet} You can rejoin anytime by messaging ` +
          `${config.minecraft.ign} in-game\n\n${dividers(
            23,
          )}\n\n**Members on Break:**\n${description}`,
      )
      .setFooter({
        text: `Updated ${formatDate(new Date())}`,
        iconURL: config.guild.icon,
      });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("break")
        .setLabel("Break Form")
        .setStyle(ButtonStyle.Success)
        .setEmoji(config.emojis.moon),
    );
    await messages.break.edit({ embeds: [embed], components: [row] });
  }, 60 * 1000);
}
