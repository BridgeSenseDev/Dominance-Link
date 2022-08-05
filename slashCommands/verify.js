const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify to gain access to our public channels')
    .addStringOption((option) => option.setName('ign')
      .setDescription('Your minecraft username')
      .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let uuid;
    let disc;
    const ign = interaction.options.getString('ign');
    try {
      uuid = (await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${ign}`)).json()).id;
      uuid = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
    } catch (e) {
      const embed = new EmbedBuilder()
        .setColor(0xe74d3c)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> **${ign}** is an invalid IGN`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    const { player } = (await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json());
    const name = player.displayname;
    try {
      disc = player.socialMedia.links.DISCORD;
    } catch (e) {
      const embed = new EmbedBuilder()
        .setColor(0xe74d3c)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> **${name}** doesn't have a discord linked on hypixel\nPlease link your social media\
                 following [this](https://www.youtube.com/watch?v=gqUPbkxxKLI&feature=emb_title) tutorial`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    if (disc === interaction.user.tag) {
      await interaction.member.roles.remove(interaction.guild.roles.cache.get('907911526118223912'));
      await interaction.member.roles.add(interaction.guild.roles.cache.get('445669382539051008'));
      const { guild } = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&player=${uuid}`)).json());
      if (guild === null) {
        const embed = new EmbedBuilder()
          .setColor(0x2ecc70)
          .setTitle('Successful')
          .setDescription(`<a:atick:986173414723162113> Verification successful, **${name}** is not in Matrix\n<:plus:925735955837636648>\
                  Added: <@&445669382539051008>\n<:minus:926070848593494047> Removed: <@&907911526118223912>`)
          .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
        await interaction.editReply({ embeds: [embed] });
      } else if (guild.name_lower === 'matrix') {
        await interaction.member.roles.add(interaction.guild.roles.cache.get('753172820133150772'));
        const embed = new EmbedBuilder()
          .setColor(0x2ecc70)
          .setTitle('Successful')
          .setDescription(`<a:atick:986173414723162113> Verification successful, **${name}** is in Matrix\n<:plus:925735955837636648> Added: \
                    <@&445669382539051008>, <@&753172820133150772>\n<:minus:926070848593494047> Removed: <@&907911526118223912>`)
          .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x2ecc70)
          .setTitle('Successful')
          .setDescription(`<a:atick:986173414723162113> Verification successful, **${name}** is not in Matrix\n<:plus:925735955837636648>\
                    Added: <@&445669382539051008>\n<:minus:926070848593494047> Removed: <@&907911526118223912>`)
          .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
        await interaction.editReply({ embeds: [embed] });
      }
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xe74d3c)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820>${name} has a different discord account linked on hypixel\nThe discord tag **${disc}**\
                     linked on hypixel does not match your discord tag **${interaction.user.tag}**`);
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
