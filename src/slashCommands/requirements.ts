import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import requirements from '../helper/requirements.js';
import { hypixel } from '../index.js';

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
      .setDescription(`<a:across:986170696512204820> ${e}`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const requirementData = await requirements(player.uuid, player);

  const embed = new EmbedBuilder()
    .setColor(requirementData.color)
    .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
    .setDescription(requirementData.requirementEmbed)
    .setThumbnail(
      `https://crafatar.com/avatars/${player.uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
    );
  await interaction.editReply({ embeds: [embed] });
}
