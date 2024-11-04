import Database from "bun:sqlite";
import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.json" with { type: "json" };
import { discordToUuid, uuidToName } from "../helper/clientUtils.js";
import pagination from "../helper/pagination.js";
import type { Count } from "../types/global";

const db = new Database("guild.db");

export const data = new SlashCommandBuilder()
  .setName("count")
  .setDescription("View counting stats");
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ fetchReply: true });

  const counts = db.prepare("SELECT * FROM counting").all() as Count[];
  const currentCount = db
    .prepare("SELECT * FROM counting ORDER BY count DESC LIMIT 1")
    .get() as Count;

  const userCountsArray = Object.entries(
    counts.reduce((acc: Record<string, number>, { discord }: Count) => {
      acc[discord] = (acc[discord] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([discord, count]: [string, number]) => ({ discord, count }))
    .sort((a: Count, b: Count) => b.count - a.count);

  const totalPages = Math.ceil(userCountsArray.length / 12);

  const getEmbedForPage = async (page: number): Promise<EmbedBuilder> => {
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle("Counting Leaderboards")
      .setFooter({
        text: `Page ${page + 1} of ${totalPages} | Current count: ${currentCount.count + 1}`,
      });

    const startIndex = page * 12;

    for (const [j, { discord, count }] of userCountsArray
      .slice(startIndex, startIndex + 12)
      .entries()) {
      const place = startIndex + j + 1;
      let customEmoji: string | undefined;

      if (place === 1) {
        customEmoji = config.emojis.gold;
      } else if (place === 2) {
        customEmoji = config.emojis.silver;
      } else if (place === 3) {
        customEmoji = config.emojis.bronze;
      } else {
        customEmoji = config.emojis.bullet;
      }

      embed.addFields({
        name: `#${place} - ${await uuidToName(discordToUuid(discord) ?? "")}`,
        value: `${customEmoji} ${count}`,
        inline: true,
      });
    }

    return embed;
  };

  await pagination(interaction, getEmbedForPage, totalPages);
}
