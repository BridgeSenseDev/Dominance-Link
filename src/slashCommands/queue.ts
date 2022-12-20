import {
  SlashCommandBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType
} from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export const data = new SlashCommandBuilder().setName('queue').setDescription('Lists the music queue');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const client = (await import('../index.js')).default;
  const queue = client.distube.getQueue(interaction.guild);

  if (!queue) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setDescription('<:cross_mark_3d:1022156671671357550> There is nothing playing!');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  const songs: string[] = [];
  for (let i = 1; i < queue.songs.length; i++) {
    songs.push(`**${i}.** [${queue.songs[i].name}](${queue.songs[i].url}) - \`${queue.songs[i].formattedDuration}\`\n`);
  }
  let embedsLength: number;
  if (songs.length % 10 === 0) {
    embedsLength = songs.length / 10;
  } else {
    embedsLength = Math.floor(songs.length / 10) + 1;
  }
  const getRow = (id: number) => {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('prev_embed')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(':last_track_button_3d:1054305193984016414')
        .setDisabled(id === 0),
      new ButtonBuilder()
        .setCustomId('clear')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Clear')
        .setEmoji(':wastebasket_3d:1054307993199575080'),
      new ButtonBuilder()
        .setCustomId('next_embed')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(':next_track_button_3d:1054305191312240730')
        .setDisabled(id === embedsLength - 1)
    );
    return row;
  };
  const embeds: EmbedBuilder[] = [];
  for (let i = 0; i < embedsLength; i++) {
    let embedDescription =
      `**Playing**: [${queue.songs[0].name}](${queue.songs[0].url})\nDuration: \`${queue.songs[0].formattedDuration}\` - Requested ` +
      `by ${queue.songs[0].member}\n\n**Next songs:**\n`;
    embedDescription += songs.splice(0, 10).join('');
    embeds.push(
      new EmbedBuilder()
        .setDescription(embedDescription)
        .setColor(config.colors.discordGray)
        .setFooter({
          text: `Page ${i + 1}/${embedsLength} • ${queue.songs.length} songs • Duration: ${queue.formattedDuration}`,
          iconURL: config.guild.icon
        })
    );
  }

  let id = 0;
  interaction.editReply({ embeds: [embeds[id]], components: [getRow(id)] });

  const collector = interaction.channel!.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 2 * 60 * 1000
  });

  collector.on('collect', async (button: ButtonInteraction) => {
    await button.deferUpdate();

    if (button.customId !== 'prev_embed' && button.customId !== 'next_embed' && button.customId !== 'clear') {
      return;
    }

    if (button.customId === 'prev_embed') {
      --id;
    } else if (button.customId === 'next_embed') {
      ++id;
    } else if (button.customId === 'clear') {
      queue.stop();
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setDescription(`<:wastebasket_3d:1054307993199575080> Cleared! Queue cleared by ${interaction.user}`);
      await interaction.followUp({ embeds: [embed] });
      return;
    }

    if (button.user !== interaction.user) {
      await button.reply({
        embeds: [embeds[id]],
        ephemeral: true
      });
      return;
    }

    await interaction.editReply({
      embeds: [embeds[id]],
      components: [getRow(id)]
    });
  });

  collector.on('end', async () => {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('prev_embed')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(':last_track_button_3d:1054305193984016414')
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('clear')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Clear')
        .setEmoji(':wastebasket_3d:1054307993199575080')
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next_embed')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(':next_track_button_3d:1054305191312240730')
        .setDisabled(true)
    );
    await interaction.editReply({
      embeds: [embeds[id]],
      components: [row]
    });
  });
}
