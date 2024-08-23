import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.json" with { type: "json" };
import {
  generateHeadUrl,
  hypixelApiErrorEmbed,
} from "../helper/clientUtils.js";
import requirementsEmbed from "../helper/requirements.js";
import { hypixel } from "../index.js";

export const data = new SlashCommandBuilder()
  .setName("reqs")
  .setDescription("Check if you meet our guild requirements")
  .addStringOption((option) =>
    option
      .setName("ign")
      .setDescription("Your minecraft username")
      .setRequired(true),
  );
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const ign = interaction.options.getString("ign");

  const player = await hypixel.getPlayer(ign ?? "").catch(async (e) => {
    await interaction.editReply(hypixelApiErrorEmbed(e.message));
    return;
  });

  if (!player) return;

  const requirementData = await requirementsEmbed(player.uuid, player);
  let color: number;
  if (requirementData.reqs === 2) {
    color = config.colors.green;
  } else if (requirementData.reqs === 1) {
    color = config.colors.yellow;
  } else {
    color = config.colors.red;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
    .setDescription(requirementData.embed)
    .setThumbnail(generateHeadUrl(player.uuid, player.nickname));
  await interaction.editReply({ embeds: [embed] });
}
