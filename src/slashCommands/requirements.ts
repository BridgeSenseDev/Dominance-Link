import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import requirementsEmbed from '../helper/requirements.js';
import { hypixel } from '../index.js';
import { generateHeadUrl } from '../helper/utils.js';

export const data = new SlashCommandBuilder()
  .setName('reqs')
  .setDescription('Check if you meet our guild requirements')
  .addStringOption((option) => option.setName('ign').setDescription('Your minecraft username').setRequired(true));
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const ign = interaction.options.getString('ign')!;

  let player;
  try {
    player = await hypixel.getPlayer(ign);
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`${config.emojis.aCross} ${e}`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const requirementData = await requirementsEmbed(player.uuid, player);

  const embed = new EmbedBuilder()
    .setColor(requirementData.color)
    .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
    .setDescription(requirementData.requirementEmbed)
    .setThumbnail(generateHeadUrl(player.uuid, player.nickname));
  await interaction.editReply({ embeds: [embed] });
}
