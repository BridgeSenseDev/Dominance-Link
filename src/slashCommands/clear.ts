import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export const data = new SlashCommandBuilder().setName('clear').setDescription('Clear the queue');
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
  queue.stop();
  const embed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setDescription(`<:wastebasket_3d:1054307993199575080> Cleared! Queue cleared by ${interaction.user}`);
  await interaction.followUp({ embeds: [embed] });
}
