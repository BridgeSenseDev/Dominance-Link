import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Database from 'better-sqlite3';
import config from '../config.json' assert {type: 'json'};

const db = new Database('matrix.db');

export const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Verify to gain access to our public channels')
  .addStringOption((option) => option.setName('ign')
    .setDescription('Your minecraft username')
    .setRequired(true));
export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  let uuid; let disc; let name;
  const ign = interaction.options.getString('ign');
  try {
    uuid = (await (await fetch(`https://playerdb.co/api/player/minecraft/${ign}`)).json()).data.player.raw_id;
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
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
    if (name === undefined) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> **${ign}** is an invalid IGN`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
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
      db.prepare('INSERT OR IGNORE INTO members (discord) VALUES (?)').run(interaction.user.id);
      db.prepare('UPDATE members SET uuid = ? WHERE discord = ?').run(uuid, interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle('Successful')
        .setDescription(`<a:atick:986173414723162113> Verification successful, **${name}** is not in Matrix\n<:add:1005843961652453487>\
                  Added: <@&445669382539051008>\n<:minus:1005843963686686730> Removed: <@&907911526118223912>`)
        .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
      await interaction.editReply({ embeds: [embed] });
    } else if (guild.name_lower === 'matrix') {
      await interaction.member.roles.add(interaction.guild.roles.cache.get('753172820133150772'));
      db.prepare('INSERT OR IGNORE INTO members (discord) VALUES (?)').run(interaction.user.id);
      db.prepare('UPDATE members SET uuid = ? WHERE discord = ?').run(uuid, interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle('Successful')
        .setDescription(`<a:atick:986173414723162113> Verification successful, **${name}** is in Matrix\n<:add:1005843961652453487> Added: \
                    <@&445669382539051008>, <@&753172820133150772>\n<:minus:1005843963686686730> Removed: <@&907911526118223912>`)
        .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
      await interaction.editReply({ embeds: [embed] });
    } else {
      db.prepare('INSERT OR IGNORE INTO members (discord) VALUES (?)').run(interaction.user.id);
      db.prepare('UPDATE members SET uuid = ? WHERE discord = ?').run(uuid, interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle('Successful')
        .setDescription(`<a:atick:986173414723162113> Verification successful, **${name}** is not in Matrix\n<:add:1005843961652453487>\
                    Added: <@&445669382539051008>\n<:minus:1005843963686686730> Removed: <@&907911526118223912>`)
        .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
      await interaction.editReply({ embeds: [embed] });
    }
  } else {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820>${name} has a different discord account linked on hypixel\nThe discord tag **${disc}**\
                     linked on hypixel does not match your discord tag **${interaction.user.tag}**`);
    await interaction.editReply({ embeds: [embed] });
  }
}
