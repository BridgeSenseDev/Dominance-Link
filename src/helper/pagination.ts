import {
  ActionRowBuilder,
  type AttachmentBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  type EmbedBuilder,
  type MessageActionRowComponentBuilder,
  type ModalSubmitInteraction,
} from "discord.js";
import config from "../config.json";

export default async function pagination(
  initialPage: number,
  lb: string,
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | ModalSubmitInteraction,
  getEmbedForPage: (
    page: number,
    lb: string,
  ) => Promise<[EmbedBuilder, AttachmentBuilder | null]>,
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

  let page = initialPage;

  const initialEmbed = await getEmbedForPage(page, lb);

  const message = await interaction.editReply({
    embeds: [initialEmbed[0]],
    components,
    ...(initialEmbed[1] ? { files: [initialEmbed[1]] } : {}),
  });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000,
  });

  collector.on("collect", async (collectorInteraction) => {
    await collectorInteraction.deferUpdate();

    const disabledPaginatorRow =
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("tempLeftPage")
          .setEmoji(config.emojis.leftArrow)
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("tempRightPage")
          .setEmoji(config.emojis.rightArrow)
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
      );

    await collectorInteraction.editReply({
      components: actionsRows
        ? [...actionsRows.flat(), disabledPaginatorRow]
        : [disabledPaginatorRow],
    });

    if (collectorInteraction.customId === "tempLeftPage") {
      if (page <= 0) {
        page = totalPages - 1;
      } else {
        page--;
      }
    } else if (collectorInteraction.customId === "tempRightPage") {
      if (page >= totalPages - 1) {
        page = 0;
      } else {
        page++;
      }
    }

    components = actionsRows
      ? [...actionsRows.flat(), paginatorRow]
      : [paginatorRow];

    const embed = await getEmbedForPage(page, lb);
    await collectorInteraction.editReply({
      embeds: [embed[0]],
      components: components,
      ...(embed[1] ? { files: [embed[1]] } : {}),
    });
  });

  collector.on("end", async () => {
    const embed = await getEmbedForPage(page, lb);
    await interaction.editReply({
      embeds: [embed[0]],
      components: [],
      ...(embed[1] ? { files: [embed[1]] } : {}),
    });
  });
}
