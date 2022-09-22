import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.json' assert {type: "json"};

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the current song');
export async function execute(interaction) {
  await interaction.deferReply();
  const client = (await import('../index.js')).default;
  const queue = client.distube.getQueue(interaction.guild);
  if (!queue) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.yellow)
      .setDescription('<:red_exclamation_mark_3d:1022140163800969306> The queue is empty!');
    await interaction.editReply({ embeds: [embed] });
    return;
  } if (!queue.autoplay && queue.songs.length <= 1) {
    queue.stop();
    const embed = new EmbedBuilder()
      .setColor(config.colors.yellow)
      .setDescription('<:right_arrow_3d:1022139507585327124> Skipped! The queue is empty.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  const song = await queue.skip();
  const embed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setDescription(`<:right_arrow_3d:1022139507585327124> Skipped! Now playing:\n[${song.name}](${song.url})`);
  await interaction.editReply({ embeds: [embed] });
}
