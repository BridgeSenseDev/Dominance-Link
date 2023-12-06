import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Role,
  User,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import Database from 'better-sqlite3';
import config from '../config.json' assert { type: 'json' };
import { discordRoles } from '../helper/constants.js';
import { hypixel } from '../index.js';
import { createMember, fetchMember } from '../handlers/databaseHandler.js';

const db = new Database('guild.db');

export const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Manually verify a member')
  .addStringOption((option) => option.setName('ign').setDescription('IGN / UUID of member').setRequired(true))
  .addUserOption((option) => option.setName('discord').setDescription('Discord Member').setRequired(true));

async function verify(
  interaction: ChatInputCommandInteraction,
  ign: string,
  discordUser: User
): Promise<EmbedBuilder | undefined> {
  let discordMember;
  let uuid;
  let name: string;

  try {
    discordMember = await interaction.guild!.members.fetch(discordUser.id);
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> ${discordUser} is not in the discord server`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  try {
    const playerData = (await (await fetch(`https://playerdb.co/api/player/minecraft/${ign}`)).json()).data.player;
    uuid = playerData.raw_id;
    name = playerData.username;
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> [${ign}](https://mcuuid.net/?q=${ign}) does not exist`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (!uuid || !name) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> [${ign}](https://mcuuid.net/?q=${ign}) does not exist`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  let member = fetchMember(uuid);
  if (member) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Caution')
      .setDescription(
        `<:warning_3d:1144472923885801532> **\`${name}\`** is already verified to the discord account <@${member.discord}>\nAre you **CERTAIN** ` +
          `you want to replace <@${member.discord}> with ${discordUser}?`
      );
    return embed;
  }

  member = fetchMember(discordUser.id);
  if (member) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Caution')
      .setDescription(
        `<:warning_3d:1144472923885801532> ${discordUser} is already verified to [this](https://namemc.com/search?q=${member.uuid}) ` +
          `minecraft account\n\nAre you **CERTAIN** you want to replace [this](https://namemc.com/search?q=${member.uuid}) account with [this](https://namemc.com/search?q=${uuid}) account?`
      );
    return embed;
  }

  let player;
  try {
    player = await hypixel.getPlayer(uuid);
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Caution')
      .setDescription(
        `<:warning_3d:1144472923885801532> Hypixel API request for **\`${name}\`**'s discord tag failed\nError: ${e}` +
          `\n\nAre you **CERTAIN** \`${name}\`'s discord account is ${discordUser}?`
      );
    return embed;
  }

  const discord = player.socialMedia.find((media) => media.name === 'Discord')?.link;

  if (!discord) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Caution')
      .setDescription(
        `<:warning_3d:1144472923885801532> **\`${name}\`** doesn't have a discord linked on hypixel\n\nAre you **CERTAIN** that \`${name}\`'s ` +
          `discord account is ${discordUser}?`
      );
    return embed;
  }

  if (discord === discordUser.tag) {
    createMember(discordMember, uuid);

    const { displayName } = discordMember;
    if (!displayName.toUpperCase().includes(name.toUpperCase())) {
      if (/\(.*?\)/.test(displayName.split(' ')[1])) {
        await discordMember.setNickname(displayName.replace(displayName.split(' ')[0], name));
      } else {
        await discordMember.setNickname(name);
      }
    } else if (!displayName.includes(name)) {
      await discordMember.setNickname(displayName.replace(new RegExp(name, 'gi'), name));
    }

    let guild;
    try {
      guild = await hypixel.getGuild('player', uuid, {});
    } catch (e) {
      /* empty */
    }

    if (!guild || guild.name.toLowerCase() !== 'dominance') {
      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle('Verification Successful')
        .setDescription(
          `<a:atick:986173414723162113> **\`${name}\`** is not in Dominance\n<:add:1005843961652453487>\
              Added: <@&445669382539051008>\n<:minus:1005843963686686730> Removed: <@&${discordRoles.unverified}>`
        )
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        );
      await interaction.editReply({ embeds: [embed] });
    } else {
      await discordMember.roles.add(interaction.guild!.roles.cache.get(discordRoles.slayer) as Role);
      db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(discordUser.id, uuid);
      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle('Verification Successful')
        .setDescription(
          `<a:atick:986173414723162113> **\`${name}\`** is in Dominance\n<:add:1005843961652453487> Added: <@&445669382539051008>, ` +
            `<@&1031926129822539786>\n<:minus:1005843963686686730> Removed: <@&${discordRoles.unverified}>`
        )
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        );
      await interaction.editReply({ embeds: [embed] });
    }
  } else {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Caution')
      .setDescription(
        `<:warning_3d:1144472923885801532> \`${name}\` has the discord name **${discord}** on hypixel\nIt does not match ` +
          `their discord name **${discordUser.tag}**\n\nAre you **CERTAIN** \`${name}\`'s discord account is ${discordUser}?`
      );
    return embed;
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!config.admins.includes(interaction.member!.user.id)) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> You do not have permission to use this command`);
    return interaction.editReply({ embeds: [embed] });
  }

  const ign = interaction.options.getString('ign')!;
  const discordUser = interaction.options.getUser('discord')!;
  const verifyErrorEmbed = await verify(interaction, ign, discordUser);

  if (verifyErrorEmbed) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('confirmVerification')
        .setStyle(ButtonStyle.Success)
        .setLabel('Confirm')
        .setEmoji('a:checkmark:1011799454959022081'),
      new ButtonBuilder()
        .setCustomId('denyVerification')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Deny')
        .setEmoji('a:across:986170696512204820')
    );

    const message = await interaction.editReply({ embeds: [verifyErrorEmbed], components: [row] });
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60 * 1000
    });

    collector.on('collect', async (collectorInteraction) => {
      if (collectorInteraction.customId === 'confirmVerification') {
        await collectorInteraction.deferReply();

        const playerData = (await (await fetch(`https://playerdb.co/api/player/minecraft/${ign}`)).json()).data.player;
        const uuid = playerData.raw_id;
        const name = playerData.username;
        const discordMember = await interaction.guild!.members.fetch(discordUser.id);

        createMember(discordMember, uuid);

        const embed = new EmbedBuilder()
          .setColor(config.colors.green)
          .setTitle(`${discordUser.tag} has been manually verified`)
          .setDescription(
            `${discordUser} has been manually verified to the minecraft account \`${name}\` and their roles has been updated` +
              `\n\nIf they are a guild member, they should be added to the guild members database soon and given the member role`
          );
        collectorInteraction.editReply({ embeds: [embed] });
      } else if (collectorInteraction.customId === 'denyVerification') {
        await collectorInteraction.deferReply();

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle(`${discordUser.tag}'s manual verification has been cancelled`);
        collectorInteraction.editReply({ embeds: [embed] });
      }
    });
  }
}
