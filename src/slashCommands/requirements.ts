import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.json' assert {type: 'json'};
import requirements from '../helper/requirements.js';

export const data = new SlashCommandBuilder()
  .setName('reqs')
  .setDescription('Check if you meet our guild requirements')
  .addStringOption((option) => option.setName('ign')
    .setDescription('Your minecraft username')
    .setRequired(true));
export async function execute(interaction) {
  await interaction.deferReply();
  let uuid; let playerData;
  const ign = interaction.options.getString('ign');
  try {
    uuid = (await (await fetch(`https://playerdb.co/api/player/minecraft/${ign}`)).json()).data.player.raw_id;
    playerData = (await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json()).player;
    if (playerData.displayname === undefined) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> **${ign}** is an invalid IGN`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> **${ign}** is an invalid IGN`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const requirementData = await requirements(uuid, playerData);

  const embed = new EmbedBuilder()
    .setColor(requirementData.color)
    .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
    .setDescription(`**Current Guild:** \`${requirementData.guild[0]}\`\n\n${requirementData.requirementEmbed}`)
    .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
  await interaction.editReply({ embeds: [embed] });
}
