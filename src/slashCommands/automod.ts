import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import config from "../config.json" with { type: "json" };
import { getProfanityScores, limits } from "../helper/utils.js";

export const data = new SlashCommandBuilder()
  .setName("automod")
  .setDescription("Test Dominance Link automod filters")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("The message you want automod to check")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const message = interaction.options.getString("message");

  if (!message) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(`${config.emojis.aCross} Message missing`);
    return interaction.editReply({ embeds: [embed] });
  }

  const scores = await getProfanityScores(message);

  const fields = [];
  let passesAutomod = true;

  if (!scores) {
    return;
  }

  for (const attribute in scores) {
    const attributeScore = scores[attribute as keyof typeof scores];
    if (attributeScore && "summaryScore" in attributeScore) {
      const score = attributeScore.summaryScore.value;
      const emoji =
        score > limits[attribute] ? config.emojis.aCross : config.emojis.aTick;
      fields.push({
        name: attribute,
        value: `${emoji} ${score.toFixed(2)} / ${limits[attribute]}`,
      });
      if (score > limits[attribute]) {
        passesAutomod = false;
      }
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`Message Passes Automod: ${passesAutomod ? "Yes" : "No"}`)
    .addFields(...fields)
    .setColor(passesAutomod ? config.colors.green : config.colors.red);

  await interaction.editReply({ embeds: [embed] });
}
