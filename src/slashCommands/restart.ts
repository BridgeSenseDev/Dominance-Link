import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.json" with { type: "json" };
import { worker } from "../events/discord/clientReady.ts";
import type { MessageObject } from "../handlers/workerHandler.js";
import { discordToUuid, isStaff } from "../helper/clientUtils.js";

export const data = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Restart the minecraft bot.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!(await isStaff(discordToUuid(interaction.user.id) ?? ""))) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} You do not have permission to use this command`,
      );
    return interaction.editReply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setColor(config.colors.red)
    .setTitle("Restarting...")
    .setDescription("The bot is restarting. This might take a few seconds.");
  await interaction.editReply({ embeds: [embed] });

  worker.postMessage({ type: "restartBot" });

  worker.on("message", async (msg: MessageObject) => {
    if (msg.type === "spawn") {
      const event = await import("../events/minecraft/spawn.js");
      await event.default();

      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle("Successful")
        .setDescription("The bot has been restarted successfully");
      await interaction.editReply({ embeds: [embed] });
    }
  });
}
