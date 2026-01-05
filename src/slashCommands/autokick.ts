import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.json";
import { kickPlayer } from "../helper/utils.js";

export const data = new SlashCommandBuilder()
  .setName("autokick")
  .setDescription(
    "Automatically kicks the most inactive player from the guild.",
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!config.admins.includes(interaction.user.id)) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} You do not have permission to use this command`,
      );
    return interaction.editReply({ embeds: [embed] });
  }

  const player = await kickPlayer();

  const embed = new EmbedBuilder()
    .setColor(config.colors.green)
    .setTitle("Success")
    .setDescription(
      `${config.emojis.aTick} Auto-kick of \`${player}\` successful.`,
    );

  await interaction.editReply({ embeds: [embed] });
}
