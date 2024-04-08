import {
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  ComponentType
} from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export default async function pagination(
  interaction: ChatInputCommandInteraction<CacheType>,
  embeds: EmbedBuilder[],
  actionsRows?: ActionRowBuilder<MessageActionRowComponentBuilder>[]
) {
  const paginatorRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('leftPage')
      .setEmoji(config.emojis.leftArrow)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
    new ButtonBuilder().setCustomId('rightPage').setEmoji(config.emojis.rightArrow).setStyle(ButtonStyle.Success)
  );

  let components = actionsRows ? [...actionsRows.flat(), paginatorRow] : [paginatorRow];
  const message = await interaction.editReply({ embeds: [embeds[0]], components });
  let page = 0;

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000
  });

  collector.on('collect', async (collectorInteraction) => {
    if (collectorInteraction.customId === 'leftPage') {
      page--;
    } else if (collectorInteraction.customId === 'rightPage') {
      page++;
    }

    if (page === embeds.length - 1) {
      paginatorRow.components[1].setDisabled(true);
    } else {
      paginatorRow.components[1].setDisabled(false);
    }
    if (page === 0) {
      paginatorRow.components[0].setDisabled(true);
    } else {
      paginatorRow.components[0].setDisabled(false);
    }

    components = actionsRows ? [...actionsRows.flat(), paginatorRow] : [paginatorRow];
    await collectorInteraction.update({ embeds: [embeds[page]], components });
  });

  collector.on('end', async () => {
    await interaction.editReply({ embeds: [embeds[page]], components: [] });
  });
}
