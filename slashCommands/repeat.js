import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.json' assert {type: "json"};

export const data = new SlashCommandBuilder()
  .setName('repeat')
  .setDescription('Repeat songs')
  .addSubcommand((subcommand) => subcommand
    .setName('all')
    .setDescription('Repeat all songs in queue'))
  .addSubcommand((subcommand) => subcommand
    .setName('off')
    .setDescription('Play the queue normally'))
  .addSubcommand((subcommand) => subcommand
    .setName('single')
    .setDescription('Repeat the current song'));
export async function execute(interaction) {
  await interaction.deferReply();
  const client = (await import('../index.js')).default;
  const queue = client.distube.getQueue(interaction.guild);
  switch (interaction.options.getSubcommand()) {
    case 'off':
      queue.setRepeatMode(0);
      const embed0 = new EmbedBuilder()
        .setColor(config.colors.yellow)
        .setDescription('<:stop_sign_3d:1022169854469476422> Playing the queue **normally**');
      await interaction.editReply({ embeds: [embed0] });
      break;
    case 'single':
      queue.setRepeatMode(1);
      const embed1 = new EmbedBuilder()
        .setColor(config.colors.yellow)
        .setDescription('<:repeat_single_button_3d:1022167927077740555> Now looping the **current track**');
      await interaction.editReply({ embeds: [embed1] });
      break;
    case 'all':
      queue.setRepeatMode(2);
      const embed2 = new EmbedBuilder()
        .setColor(config.colors.yellow)
        .setDescription('<:repeat_button_3d:1022167924334661632> Now looping the **queue**');
      await interaction.editReply({ embeds: [embed2] });
      break;
    default:
  }
}
