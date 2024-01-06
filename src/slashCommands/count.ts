import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import Database from 'better-sqlite3';
import config from '../config.json' assert { type: 'json' };
import { Count } from '../types/global.d.js';
import { discordToUuid, uuidToName } from '../helper/utils.js';
import pagination from '../helper/pagination.js';

const db = new Database('guild.db');

export const data = new SlashCommandBuilder().setName('count').setDescription('View counting stats');
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ fetchReply: true });

  const counts = db.prepare('SELECT * FROM counting').all() as Count[];
  const currentCount = db.prepare('SELECT * FROM counting ORDER BY count DESC LIMIT 1').get() as Count;

  const userCountsArray = Object.entries(
    counts.reduce(
      (acc: Record<string, number>, { discord }: Count) => ({ ...acc, [discord]: (acc[discord] || 0) + 1 }),
      {}
    )
  )
    .map(([discord, count]: [string, number]) => ({ discord, count }))
    .sort((a: Count, b: Count) => b.count - a.count);

  const pages = Array.from({ length: Math.ceil(userCountsArray.length / 12) }, (_, i) =>
    userCountsArray.slice(i * 12, i * 12 + 12)
  );

  const embeds: EmbedBuilder[] = [];

  for (const [i, page] of pages.entries()) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle('Counting Leaderboards')
      .setFooter({ text: `Page ${i + 1} of ${pages.length} | Current count: ${currentCount.count + 1}` });

    for (const [j, { discord, count }] of page.entries()) {
      const place = i * 10 + j + 1;
      let customEmoji;
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
        name: `#${place} - ${await uuidToName(discordToUuid(discord)!)}`,
        value: `${customEmoji} ${count}`,
        inline: true
      });
    }

    embeds.push(embed);
  }

  await pagination(interaction, embeds);
}
