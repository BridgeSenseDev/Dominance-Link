import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export const data = new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue');
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const client = (await import('../index.js')).default;
  const queue = client.distube.getQueue(interaction.guild!);
  if (!queue) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setDescription('<:red_exclamation_mark_3d:1022140163800969306> The queue is empty!');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  await queue.shuffle();
  const embed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setDescription(
      `<:shuffle_3d:1054658931982618625> Shuffled! View the new queue through </queue:1054295451916042320>)`
    );
  await interaction.editReply({ embeds: [embed] });
}
