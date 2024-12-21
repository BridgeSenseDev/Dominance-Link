import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  type EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import config from "../config.json" with { type: "json" };

export default async function pagination(
  interaction: ChatInputCommandInteraction,
  getEmbedForPage: (page: number) => Promise<EmbedBuilder>,
  totalPages: number,
  actionsRows?: ActionRowBuilder<MessageActionRowComponentBuilder>[],
) {
  const paginatorRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("tempLeftPage")
      .setEmoji(config.emojis.leftArrow)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("tempRightPage")
      .setEmoji(config.emojis.rightArrow)
      .setStyle(ButtonStyle.Success),
  );

  let components = actionsRows
    ? [...actionsRows.flat(), paginatorRow]
    : [paginatorRow];

  let page = 0;

  const initialEmbed = await getEmbedForPage(page);

  const message = await interaction.editReply({
    embeds: [initialEmbed],
    components,
  });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000,
  });

  collector.on("collect", async (collectorInteraction) => {
    await collectorInteraction.deferUpdate()
    if (collectorInteraction.customId === "tempLeftPage") {
      if (page === 0) {
        page = totalPages - 1;
      } else {
        page--;
      }
    } else if (collectorInteraction.customId === "tempRightPage") {
      if (page === totalPages - 1) {
        page = 0
      } else {
        page++;
      }
    }

    const currentEmbed = await getEmbedForPage(page);

    components = actionsRows
      ? [...actionsRows.flat(), paginatorRow]
      : [paginatorRow];

    await collectorInteraction.editReply({ embeds: [currentEmbed], components });
  });

  collector.on("end", async () => {
    await interaction.editReply({
      embeds: [await getEmbedForPage(page)],
      components: [],
    });
  });
}
