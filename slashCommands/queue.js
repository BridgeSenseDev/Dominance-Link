import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Displays the current queue of tracks');
export async function execute(interaction) {
  await interaction.deferReply();
  const { client } = import('../index.js');
  console.log(client.distube.getQueue(interaction.guild).songs);
  console.log(client.distube.getQueue(interaction.guild).songs[0].playlist);
  interaction.editReply('Recieved');
}
