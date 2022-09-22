import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.json' assert {type: "json"};

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a track of playlist by proving a link or search query')
  .addStringOption((option) => option.setName('link-or-query')
    .setDescription('Link or search query')
    .setRequired(true));
export async function execute(interaction) {
  await interaction.deferReply();
  const client = (await import('../index.js')).default;
  const voiceChannel = client.channels.cache.get('1021832811835052122');
  try {
    await client.distube.play(voiceChannel, interaction.options.getString('link-or-query'), { textChannel: interaction.channel, member: interaction.member });
  } catch (err) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setDescription('<:cross_mark_3d:1022156671671357550> Unknown song / playlist');
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  const { songs } = client.distube.getQueue(interaction.guild);
  if (songs[songs.length - 1].playlist) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.yellow)
      .setAuthor({ name: 'Added to queue', iconURL: interaction.user.displayAvatarURL() })
      .setDescription(`**Playlist:** [${songs[songs.length - 1].playlist.name}](${songs[songs.length - 1].playlist.url})`)
      .setThumbnail(songs[songs.length - 1].playlist.thumbnail)
      .addFields(
        {
          name: 'Requested By',
          value: interaction.user.toString(),
          inline: true,
        },
        {
          name: 'Queue',
          value: `${songs.length} songs - \`${client.distube.getQueue(interaction.guild).formattedDuration}\``,
          inline: true,
        },
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  const embed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setAuthor({ name: 'Added to queue', iconURL: interaction.user.displayAvatarURL() })
    .setDescription(`[${songs[songs.length - 1].name}](${songs[songs.length - 1].url})`)
    .setThumbnail(songs[songs.length - 1].thumbnail)
    .addFields(
      {
        name: 'Requested By',
        value: interaction.user.toString(),
        inline: true,
      },
      {
        name: 'Duration',
        value: `\`${songs[songs.length - 1].formattedDuration}\``,
        inline: true,
      },
      {
        name: 'Queue',
        value: `${songs.length} songs - \`${client.distube.getQueue(interaction.guild).formattedDuration}\``,
        inline: true,
      },
    );
  await interaction.editReply({ embeds: [embed] });
}
