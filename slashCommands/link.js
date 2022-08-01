const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('better-sqlite3')('matrix.db');
const config = require('../config.json');

const ranks = {
  GUILDMASTER: '[GM]', Manager: '[MNG]', Officer: '[OFC]', Active: '[Active]', Crew: '[Crew]', 'Trial Member': '[Trial]',
};
const roles = {
  'Trial Member': '753172820133150772', Crew: '242360892346466312', Active: '950083054326677514', Officer: '766347970094170221', Manager: '848906700291571742',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your minecraft account to your discord account')
    .addStringOption((option) => option.setName('ign')
      .setDescription('Your minecraft username')
      .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let uuid;
    let disc;
    let name;
    const ign = interaction.options.getString('ign');
    try {
      uuid = (await (await fetch(`https://playerdb.co/api/player/minecraft/${ign}`)).json()).data.player.id;
    } catch (e) {
      const embed = new EmbedBuilder()
        .setColor(0xe74d3c)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> **${ign}** is an invalid IGN`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    const { player } = (await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json());
    try {
      name = player.displayname;
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
      let rank;
      let added = 'None';
      const { guild } = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&player=${uuid}`)).json());
      if (guild.name_lower === 'matrix') {
        for (let i = 0; i < guild.members.length; i += 1) {
          if (guild.members[i].uuid === uuid) {
            rank = guild.members[i].rank;
            db.prepare('INSERT OR IGNORE INTO guild_members (uuid, discord, tag) VALUES (?, ?, ?)').run(uuid, interaction.user.id, ranks[rank]);
            break;
          }
        }
        if (!interaction.member.roles.cache.has(roles[rank])) {
          await interaction.member.roles.add(interaction.guild.roles.cache.get(roles[rank]));
          await interaction.member.setNickname(name);
          added = `<@${roles[rank]}>`;
        }
        const embed = new EmbedBuilder()
          .setColor(0x2ecc70)
          .setTitle('Successful')
          .setDescription(`<a:atick:986173414723162113> Verification successful, **${name}** is in Matrix\n<:plus:925735955837636648> Added: \
                    ${added}\n<:minus:926070848593494047> Removed: None`)
          .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xe74d3c)
          .setTitle('Error')
          .setDescription(`<a:across:986170696512204820> ${name} is not in Matrix`);
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
