import {
  EmbedBuilder,
  InteractionType,
  TextInputBuilder,
  ModalBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  Interaction,
  GuildMember,
  Role,
  Guild,
  TextChannel,
  ThreadChannel,
  ComponentType,
  StringSelectMenuBuilder
} from 'discord.js';
import Database from 'better-sqlite3';
import {
  discordToUuid,
  formatNumber,
  hypixelApiError,
  nameToUuid,
  removeSectionSymbols,
  uuidToName
} from '../../helper/utils.js';
import requirementsEmbed from '../../helper/requirements.js';
import config from '../../config.json' assert { type: 'json' };
import { textChannels } from './ready.js';
import { bullet, dividers, discordRoles } from '../../helper/constants.js';
import { BreakMember } from '../../types/global.d.js';
import { hypixel } from '../../index.js';
import { archiveMember, createMember, fetchGuildMember, fetchMember } from '../../handlers/databaseHandler.js';

const db = new Database('guild.db');

export default async function execute(client: Client, interaction: Interaction) {
  const member = interaction.member as GuildMember;
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  } else if (interaction.isAutocomplete()) {
    const nameColorArray = db
      .prepare('SELECT nameColor FROM guildMembers ORDER BY weeklyGexp DESC')
      .pluck()
      .all() as Array<string>;
    const choices: string[] = nameColorArray
      .filter(Boolean)
      .map((nameColor) => removeSectionSymbols(nameColor).split(' ')[nameColor.split(' ').length - 1]);

    const focusedValue = interaction.options.getFocused();
    const filtered = choices
      .filter((choice) => choice.toLowerCase().startsWith(focusedValue.toLowerCase()))
      .slice(0, 25);
    await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
  } else if (interaction.isButton()) {
    if (interaction.customId in discordRoles) {
      const roleId = discordRoles[interaction.customId as keyof typeof discordRoles];
      let msg;
      await interaction.deferReply({ ephemeral: true });
      if (member.roles.resolve(roleId)) {
        await member.roles.remove(roleId);
        msg = `<:minus:1005843963686686730> <@&${roleId}>`;
      } else {
        await member.roles.add(roleId);
        msg = `<:add:1005843961652453487> <@&${roleId}>`;
      }
      await interaction.editReply({ content: msg });
    } else if (interaction.customId === 'requirements') {
      const uuid = discordToUuid(interaction.user.id);
      await interaction.deferReply({ ephemeral: true });
      if (!uuid) {
        await member.roles.add(interaction.guild!.roles.cache.get(discordRoles.unverified) as Role);
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription('Please verify first in <#1031568019522072677>');
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const playerResponse = await hypixel.getPlayer(uuid).catch(async (e) => {
        await interaction.editReply(hypixelApiError(e.message));
      });

      if (!playerResponse) return;

      const requirementData = await requirementsEmbed(uuid, playerResponse);
      const embed = new EmbedBuilder()
        .setColor(requirementData.color)
        .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
        .setDescription(requirementData.requirementEmbed)
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        );
      await interaction.editReply({ embeds: [embed] });
    } else if (interaction.customId === 'verify') {
      const modal = new ModalBuilder().setCustomId('verification').setTitle('Verification');
      const name = new TextInputBuilder()
        .setCustomId('verificationInput')
        .setLabel('PLEASE ENTER YOUR MINECRAFT USERNAME')
        .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(name);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId === 'unverify') {
      await interaction.deferReply({ ephemeral: true });

      const memberData = fetchMember(interaction.user.id);

      if (!memberData) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setDescription(`<a:across:986170696512204820> <@${interaction.user.id}> is already unverified`);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      archiveMember(member);

      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setDescription(`<a:atick:986173414723162113> <@${interaction.user.id}> has been successfully unverified`);
      await interaction.editReply({ embeds: [embed] });
    } else if (interaction.customId === 'apply') {
      const uuid = discordToUuid(interaction.user.id);
      if (!uuid) {
        await member.roles.add(interaction.guild!.roles.cache.get(discordRoles.unverified) as Role);
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription('Please verify first in <#1031568019522072677>');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      const modal = new ModalBuilder().setCustomId('applications').setTitle('Dominance Application');
      const q1Input = new TextInputBuilder()
        .setCustomId('q1Input')
        .setLabel('What games do you main / have good stats in?')
        .setStyle(TextInputStyle.Short);
      const q2Input = new TextInputBuilder()
        .setCustomId('q2Input')
        .setLabel('Why should we accept you?')
        .setStyle(TextInputStyle.Paragraph);
      const q3Input = new TextInputBuilder()
        .setCustomId('q3Input')
        .setLabel('Do you know anyone from the guild?')
        .setStyle(TextInputStyle.Paragraph);
      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(q1Input);
      const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(q2Input);
      const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(q3Input);
      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId === 'accept') {
      await interaction.deferReply({ ephemeral: true });
      const name = interaction.message.embeds[0].data.fields![0].value;
      const discordId = interaction.message.embeds[0].data.fields![3].value.slice(2, -1);
      const uuid = await nameToUuid(name);
      const user = await client.users.fetch(discordId);
      (interaction.guild as Guild).channels
        .create({
          name: `⌛┃${name}`,
          type: ChannelType.GuildText,
          parent: '1020948893204217856'
        })
        .then(async (channel) => {
          await channel.permissionOverwrites.edit(user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
          const embed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle(`Congrats ${name}, your application has been accepted!`)
            .setDescription(
              `**How to get started:**\n\n${bullet} **Join The Guild**\nYou can be invited to the guild anytime without ` +
                `staff. Just type \`/msg ${config.minecraft.ign} .\` in-game or if you are muted, type \`/immuted ` +
                `${config.minecraft.ign}\`\n\nYou won't be able to see guild channels until you have joined in-game\n\n${bullet} ` +
                `**Confused?**\nFeel free to ask any questions here, only ping staff if needed!`
            )
            .setThumbnail(
              `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
            );
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('closeApplication')
              .setStyle(ButtonStyle.Danger)
              .setLabel('Close Application')
              .setEmoji(':locked_3d:1088398545092083792')
          );
          db.prepare('INSERT INTO waitlist (uuid, discord, time, channel) VALUES (?, ?, ?, ?)').run(
            uuid,
            discordId,
            Math.floor(Date.now() / 1000),
            channel.id
          );
          await channel.send({ content: user.toString(), embeds: [embed], components: [row] });
          const applicationEmbed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle(`${name}'s application has been accepted`)
            .setDescription(interaction.message.embeds[0].data.description!)
            .addFields(
              { name: '<:user:1029703318924165120> Accepted By', value: interaction.user.toString(), inline: true },
              {
                name: '<:page_with_curl_3d:1029706324881199126> Meeting Reqs',
                value: interaction.message.embeds[0].data.fields![1].value,
                inline: true
              },
              {
                name: '<:three_oclock_3d:1029704628310388796> Application Made',
                value: interaction.message.embeds[0].data.fields![5].value,
                inline: true
              }
            );
          await textChannels.applicationLogs.send({ embeds: [applicationEmbed] });
          await interaction.deleteReply();
          await interaction.message.delete();
        });
    } else if (interaction.customId === 'deny') {
      const discordId = interaction.message.embeds[0].data.fields![3].value.slice(2, -1);
      const name = interaction.message.embeds[0].data.fields![0].value;
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder().setCustomId(discordId).setPlaceholder('Select a reason').addOptions(
          {
            label: 'Not meeting guild requirements',
            value: 'Not meeting guild requirements'
          },
          {
            label: 'Not writing enough on your application',
            value: 'Not writing enough on your application'
          },
          {
            label: 'Being a guild hopper',
            value: 'Being a guild hopper'
          },
          {
            label: 'Being a known hacker / cheater',
            value: 'Being a known hacker / cheater'
          },
          {
            label: 'Being toxic',
            value: 'Being toxic'
          }
        )
      );
      const message = await interaction.reply({ components: [row], ephemeral: true, fetchReply: true });
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60 * 1000
      });

      collector.on('collect', async (collectorInteraction) => {
        if (collectorInteraction.isStringSelectMenu()) {
          await collectorInteraction.deferReply({ ephemeral: true });
          const user = await client.users.fetch(collectorInteraction.customId);
          const embed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle('Your Dominance application has been denied')
            .setDescription(`**Reason:** ${collectorInteraction.values}`);
          try {
            await user.send({ embeds: [embed] });
          } catch (e) {
            /* empty */
          }
          const applicationEmbed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle(`${name}'s application has been denied`)
            .setDescription(interaction.message.embeds[0].data.description!)
            .addFields(
              { name: '<:user:1029703318924165120> Denied By', value: interaction.user.toString(), inline: true },
              {
                name: '<:page_with_curl_3d:1029706324881199126> Meeting Reqs',
                value: interaction.message.embeds[0].data.fields![1].value,
                inline: true
              },
              {
                name: '<:three_oclock_3d:1029704628310388796> Application Made',
                value: interaction.message.embeds[0].data.fields![5].value,
                inline: true
              }
            );
          await textChannels.applicationLogs.send({ embeds: [applicationEmbed] });
          await interaction.deleteReply();
          await interaction.message.delete();
          await collectorInteraction.deleteReply();
          collector.stop();
        }
      });
    } else if (interaction.customId === 'break') {
      const modal = new ModalBuilder().setCustomId('breakModal').setTitle('Break Form');
      const q1Input = new TextInputBuilder()
        .setCustomId('q1Input')
        .setLabel('How long will you be inactive for?')
        .setStyle(TextInputStyle.Short);
      const q2Input = new TextInputBuilder()
        .setCustomId('q2Input')
        .setLabel('What is your reason for inactivity?')
        .setStyle(TextInputStyle.Paragraph);
      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(q1Input);
      const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(q2Input);
      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId === 'endBreak') {
      await interaction.deferReply({ fetchReply: true });
      const breakData = db
        .prepare('SELECT * FROM breaks WHERE discord = ?')
        .get(interaction.message.embeds[0].fields[1].value.slice(2, -1)) as BreakMember;
      const name = await uuidToName(breakData.uuid);
      if (interaction.user.id !== breakData.discord) {
        const breakMember = interaction.guild?.members.cache.get(breakData.discord) as GuildMember;
        if (!config.admins.includes(interaction.member!.user.id)) {
          const embed = new EmbedBuilder()
            .setColor(config.colors.discordGray)
            .setDescription(`Only admins can close this application`);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        const confirmationEmbed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setTitle(`End Break Confirmation`)
          .setDescription(`Please confirm that you want to end **${name}'s** break`);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('confirm')
            .setStyle(ButtonStyle.Success)
            .setLabel('Confirm')
            .setEmoji('a:checkmark:1011799454959022081')
        );
        const message = await interaction.editReply({ embeds: [confirmationEmbed], components: [row] });
        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60 * 1000
        });

        collector.on('collect', async (collectorInteraction) => {
          if (collectorInteraction.customId === 'confirm') {
            await collectorInteraction.deferReply();
            if (breakMember !== undefined) {
              await breakMember.roles.remove(interaction.guild!.roles.cache.get(discordRoles.Break) as Role);
            }
            db.prepare('DELETE FROM breaks WHERE discord = ?').run(breakData.discord);
            const embed = new EmbedBuilder()
              .setColor(config.colors.discordGray)
              .setTitle(`${await uuidToName(breakData.uuid)}'s Break Has Been Ended`)
              .setDescription(`This thread has been archived.`);
            await interaction.deleteReply();
            await collectorInteraction.editReply({ embeds: [embed] });
            await (collectorInteraction.channel as ThreadChannel).setLocked();
            await (collectorInteraction.channel as ThreadChannel).setArchived();
            collector.stop();
          }
        });
        return;
      }
      if (!fetchGuildMember(breakData.uuid)) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setDescription(
            `Please rejoin the guild before closing the break form.\nYou can rejoin by messaging ${config.minecraft.ign} in Hypixel`
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      db.prepare('DELETE FROM breaks WHERE discord = ?').run(interaction.user.id);
      await member.roles.remove(interaction.guild!.roles.cache.get(discordRoles.Break) as Role);
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`Welcome back, ${await uuidToName(breakData.uuid)}!`)
        .setDescription(`This thread has been archived. Enjoy your stay!`);
      await interaction.editReply({ embeds: [embed] });
      await (interaction.channel as ThreadChannel).setLocked();
      await (interaction.channel as ThreadChannel).setArchived();
    } else if (interaction.customId === 'closeApplication') {
      if (!config.admins.includes(interaction.member!.user.id)) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setDescription(`Only admins can close this application`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`Close Confirmation`)
        .setDescription(`Please confirm that you want to close this application`);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm')
          .setStyle(ButtonStyle.Success)
          .setLabel('Confirm')
          .setEmoji('a:checkmark:1011799454959022081')
      );
      const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60 * 1000
      });

      collector.on('collect', async (collectorInteraction) => {
        if (collectorInteraction.customId === 'confirm') {
          db.prepare('DELETE FROM waitlist WHERE channel = ?').run(collectorInteraction.channelId);
          await collectorInteraction.channel?.delete();
          collector.stop();
        }
      });
    } else if (interaction.customId === 'removeMute') {
      await interaction.deferReply();
      const timeoutMember = await interaction.guild!.members.fetch(
        interaction.message.embeds[0].description!.match(/<@(\d+)>/)?.[1]!
      );

      try {
        await textChannels.minecraftLink.permissionOverwrites.delete(timeoutMember);
      } catch (e) {
        /* empty */
      }

      try {
        await textChannels.officerChat.permissionOverwrites.delete(timeoutMember);
      } catch (e) {
        /* empty */
      }

      let embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle('Timeout Removed')
        .setDescription(
          `After manual review, your timeout has been removed.\nAutomod filters can be tested using </automod:1159506896043118622> in <#1017269021927817236>`
        );

      await timeoutMember.send({ embeds: [embed] });

      embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
        .setDescription(
          `**<@${timeoutMember.id}> timeout has been removed by ${interaction.user}**\n${
            interaction.message.embeds[0].description!.split('\n')[1]
          }`
        );
      await interaction.message.edit({ embeds: [embed], components: [] });
      await interaction.deleteReply();
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'verification') {
      await interaction.deferReply({ ephemeral: true });

      let name;
      let uuid;
      const ign = interaction.fields.getTextInputValue('verificationInput');

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

      let memberData = fetchMember(uuid);

      if (memberData) {
        if (memberData.discord === interaction.user.id) {
          await member.roles.remove(interaction.guild!.roles.cache.get(discordRoles.unverified) as Role);
          await member.roles.add(interaction.guild!.roles.cache.get(discordRoles.verified) as Role);
        }

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Verification Unsuccessful')
          .setDescription(
            `<a:across:986170696512204820> **\`${name}\`** is already verified to the discord account <@${memberData.discord}>`
          );
        interaction.editReply({ embeds: [embed] });
        return;
      }

      memberData = fetchMember(interaction.user.id);
      if (memberData) {
        if (memberData.uuid === uuid) {
          await member.roles.remove(interaction.guild!.roles.cache.get(discordRoles.unverified) as Role);
          await member.roles.add(interaction.guild!.roles.cache.get(discordRoles.verified) as Role);
        }

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Verification Unsuccessful')
          .setDescription(
            `<a:across:986170696512204820> ${interaction.user} is already verified to [this](https://namemc.com/search?q=${memberData.uuid}) ` +
              `minecraft account`
          );
        interaction.editReply({ embeds: [embed] });
        return;
      }

      const playerResponse = await hypixel.getPlayer(uuid).catch(async (e) => {
        await interaction.editReply(hypixelApiError(e.message));
      });

      if (!playerResponse) return;

      name = playerResponse.nickname;
      const discord = playerResponse.socialMedia.find((media) => media.name === 'Discord')?.link;

      if (!discord) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Verification Unsuccessful')
          .setDescription(
            `<a:across:986170696512204820> **${name}** doesn't have a discord linked on hypixel\nPlease link your social media` +
              `following [this tutorial](https://www.youtube.com/watch?v=gqUPbkxxKLI&feature=emb_title)`
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (discord === interaction.user.tag) {
        await createMember(member, uuid);

        const { displayName } = member;
        if (!displayName.toUpperCase().includes(name.toUpperCase())) {
          if (/\(.*?\)/.test(displayName.split(' ')[1])) {
            await member.setNickname(displayName.replace(displayName.split(' ')[0], name));
          } else {
            await member.setNickname(name);
          }
        } else if (!displayName.includes(name)) {
          await member.setNickname(displayName.replace(new RegExp(name, 'gi'), name));
        }

        const guild = await hypixel.getGuild('player', uuid, {});
        if (!guild || guild.name.toLowerCase() !== 'dominance') {
          const embed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle('Verification Successful')
            .setDescription(
              `<a:atick:986173414723162113> **${name}** is not in Dominance\n<:add:1005843961652453487>\
                    Added: <@&445669382539051008>\n<:minus:1005843963686686730> Removed: <@&${discordRoles.unverified}>`
            )
            .setThumbnail(
              `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
            );

          await interaction.editReply({ embeds: [embed] });
        } else {
          await member.roles.add(interaction.guild!.roles.cache.get(discordRoles.slayer) as Role);
          db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(interaction.user.id, uuid);
          const embed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle('Verification Successful')
            .setDescription(
              `<a:atick:986173414723162113> **${name}** is in Dominance\n<:add:1005843961652453487>\
                      Added: <@&445669382539051008>, <@&1031926129822539786>\n<:minus:1005843963686686730> Removed: <@&${discordRoles.unverified}>`
            )
            .setThumbnail(
              `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
            );
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = new EmbedBuilder().setColor(config.colors.red).setTitle('Verification Unsuccessful')
          .setDescription(`<a:across:986170696512204820>${name} has a different discord account linked on hypixel\nThe discord tag **${discord}**\
                        linked on hypixel does not match your discord tag **${interaction.user.tag}**`);
        await interaction.editReply({ embeds: [embed] });
      }
    } else if (interaction.customId === 'applications') {
      await interaction.deferReply({ ephemeral: true });
      const q1 = interaction.fields.getTextInputValue('q1Input');
      const q2 = interaction.fields.getTextInputValue('q2Input');
      const q3 = interaction.fields.getTextInputValue('q3Input');

      const uuid = discordToUuid(interaction.user.id)!;
      const playerResponse = await hypixel.getPlayer(uuid).catch(async (e) => {
        await interaction.editReply(hypixelApiError(e.message));
      });

      if (!playerResponse) return;

      const requirementData = await requirementsEmbed(uuid, playerResponse);
      const name = (await uuidToName(uuid))!;

      const applicationEmbed = new EmbedBuilder()
        .setColor(requirementData.color)
        .setTitle(`${interaction.user.tag}'s Application`)
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        )
        .setDescription(
          `<:keycap_1_3d:1029711346297737277> **What games do you mainly play?**\n${q1}\n\n<:keycap_2_3d:1029711344414507038> ` +
            `**Why should we accept you?**\n${q2}\n\n<:keycap_3_3d:1029711342468345888> **Do you know anyone from the guild?**\n${q3}` +
            `\n\n${dividers(21)}\n\n**Requirements:**\n\n${requirementData.requirementEmbed}`
        )
        .addFields(
          { name: '<:user:1029703318924165120> IGN: ', value: name, inline: true },
          {
            name: '<:page_with_curl_3d:1029706324881199126> Meeting Requirements: ',
            value: requirementData.reqs,
            inline: true
          },
          { name: ':shield: Guild: ', value: playerResponse.guild?.name ?? 'None', inline: true },
          { name: '<:mention:913408059425058817> Discord: ', value: `<@${interaction.user.id}>`, inline: true },
          {
            name: '<:calendar_3d:1029713106550657055> Discord Member Since: ',
            value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`,
            inline: true
          },
          {
            name: '<:three_oclock_3d:1029704628310388796> Created: ',
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true
          }
        );

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('accept')
            .setStyle(ButtonStyle.Success)
            .setLabel('Accept')
            .setEmoji('a:atick:986173414723162113')
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId('deny')
            .setStyle(ButtonStyle.Danger)
            .setLabel('Deny')
            .setEmoji('a:across:986170696512204820')
        );
      await textChannels.applications.send({ components: [row], embeds: [applicationEmbed] });
      const replyEmbed = new EmbedBuilder()
        .setColor(requirementData.color)
        .setTitle(`${interaction.user.tag}'s application has been received`)
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        )
        .setDescription(
          `<:keycap_1_3d:1029711346297737277> **What games do you mainly play?**\n${q1}\n\n<:keycap_2_3d:1029711344414507038> ` +
            `**Why should we accept you?**\n${q2}\n\n<:keycap_3_3d:1029711342468345888> **Do you know anyone from the guild?**\n${q3}` +
            `\n\n${dividers(
              21
            )}\n\n**Info:**\n\n${bullet} Applications usually receive a response within 24 hours\n${bullet} You will ` +
            `be **pinged** in this server if you have been accepted\n${bullet} You will receive a dm if rejected **unless** your dm's ` +
            `are closed`
        );
      await interaction.editReply({ embeds: [replyEmbed] });
    } else if (interaction.customId === 'breakModal') {
      await interaction.deferReply({ ephemeral: true });

      const q1 = interaction.fields.getTextInputValue('q1Input');
      const q2 = interaction.fields.getTextInputValue('q2Input');

      const uuid = discordToUuid(interaction.user.id) as string;
      const name = (await uuidToName(uuid))!;
      const thread = db.prepare('SELECT thread FROM breaks WHERE discord = ?').get(interaction.user.id) as BreakMember;
      if (thread) {
        const replyEmbed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setTitle(`Error!`)
          .setDescription(`You already have an active break form in <#${thread.thread}>`)
          .setThumbnail(
            `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
          );
        await interaction.editReply({ embeds: [replyEmbed] });
        return;
      }

      const guildMember = fetchGuildMember(interaction.user.id);
      if (guildMember === null) {
        await member.roles.remove(discordRoles.slayer);

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription('You are not a guild member!');

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const { joined, weeklyGexp } = guildMember;

      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`${name}'s Break Application`)
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        )
        .setDescription(
          `<:keycap_1_3d:1029711346297737277> **How long will you be inactive for?**\n${q1}\n\n<:keycap_2_3d:1029711344414507038> ` +
            `**What is your reason for inactivity?**\n${q2}`
        )
        .addFields(
          {
            name: '<:calendar_3d:1029713106550657055> Days in Guild: ',
            value: `<t:${Math.floor(Number(joined) / 1000)}:R>`,
            inline: true
          },
          { name: '<:mention:913408059425058817> Discord: ', value: `<@${interaction.user.id}>`, inline: true },
          { name: '<:gexp:1062398074573574226> Weekly Gexp: ', value: `\`${formatNumber(weeklyGexp)!}\``, inline: true }
        );
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('endBreak')
          .setLabel('End Break')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(':calendar_3d:1029713106550657055')
      );
      const threadChannel = await (interaction.channel as TextChannel).threads.create({
        name,
        type: ChannelType.PrivateThread,
        invitable: false
      });
      await threadChannel.join();
      await threadChannel.members.add(interaction.user);
      await threadChannel.send({ embeds: [embed], components: [row] });

      const replyEmbed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`${name}'s break form has been received`)
        .setDescription(`You may update your break status in <#${threadChannel.id}>`)
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        );
      await interaction.editReply({ embeds: [replyEmbed] });
      db.prepare('INSERT INTO breaks (uuid, discord, thread, time, reason) VALUES (?, ?, ?, ?, ?)').run(
        uuid,
        interaction.user.id,
        threadChannel.id,
        q1,
        q2
      );
      await member.roles.add(interaction.guild!.roles.cache.get(discordRoles.Break) as Role);

      await textChannels.break.send({ embeds: [embed] });
    }
  }
}
