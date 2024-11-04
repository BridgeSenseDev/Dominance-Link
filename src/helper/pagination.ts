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
      .setCustomId("leftPage")
      .setEmoji(config.emojis.leftArrow)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("rightPage")
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
    if (collectorInteraction.customId === "leftPage") {
      page--;
    } else if (collectorInteraction.customId === "rightPage") {
      page++;
    }

    paginatorRow.components[0].setDisabled(page === 0);
    paginatorRow.components[1].setDisabled(page === totalPages - 1);

    const currentEmbed = await getEmbedForPage(page);

    components = actionsRows
      ? [...actionsRows.flat(), paginatorRow]
      : [paginatorRow];

    await collectorInteraction.update({ embeds: [currentEmbed], components });
  });

  collector.on("end", async () => {
    await interaction.editReply({
      embeds: [await getEmbedForPage(page)],
      components: [],
    });
  });
}
