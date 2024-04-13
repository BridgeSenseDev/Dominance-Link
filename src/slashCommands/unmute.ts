import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.json" assert { type: "json" };
import { chat, waitForMessage } from "../handlers/workerHandler.js";
import { discordToUuid, isStaff } from "../helper/clientUtils.js";
import messageToImage from "../helper/messageToImage.js";

export const data = new SlashCommandBuilder()
  .setName("unmute")
  .setDescription("Un mutes the given user.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Minecraft Username")
      .setRequired(true)
      .setAutocomplete(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!(await isStaff(discordToUuid(interaction.user.id) ?? ""))) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} You do not have permission to use this command`,
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const name = interaction.options.getString("name");

  if (await isStaff(name ?? "")) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} Guild staff cannot be unmuted through this command.`,
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  chat(`/g unmute ${name}`);

  const receivedMessage = await waitForMessage(
    [
      "This player is not muted!",
      `${config.minecraft.ign} has unmuted`,
      `${name} is not in your guild!`,
      `Can't find a player by the name of '${name}'`,
    ],
    5000,
  );

  if (!receivedMessage) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Caution")
      .setDescription(`${config.emojis.aCross} Guild unmute timed out.`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  await interaction.editReply({
    files: [
      await messageToImage(
        `§b-------------------------------------------------------------§r ${receivedMessage.motd} §b-------------------------------------------------------------`,
      ),
    ],
  });
}
