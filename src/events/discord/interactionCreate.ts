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
  SelectMenuBuilder,
  Client,
  Interaction,
  GuildMember,
  Role,
  Guild
} from 'discord.js';
import Database from 'better-sqlite3';
import { nameToUuid, removeSectionSymbols, uuidToName } from '../../helper/utils.js';
import requirements from '../../helper/requirements.js';
import config from '../../config.json' assert { type: 'json' };
import { channels } from './ready.js';
import { roles } from '../../helper/constants.js';

const db = new Database('guild.db');

const names = db.prepare('SELECT nameColor FROM guildMembers ORDER BY weeklyGexp DESC').all();
const choices: string[] = [];
for (let i = 0; i < names.length; i++) {
  if (names[i].nameColor !== null) {
    choices.push(
      removeSectionSymbols(names[i].nameColor).split(' ')[removeSectionSymbols(names[i].nameColor).split(' ').length - 1]
    );
  }
}

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
    const focusedValue = interaction.options.getFocused();
    const filtered = choices
      .filter((choice) => choice.toLowerCase().startsWith(focusedValue.toLowerCase()))
      .slice(0, 25);
    await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
  } else if (interaction.isStringSelectMenu()) {
    await interaction.deferReply({ ephemeral: true });
    const user = await client.users.fetch(interaction.customId);
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Your Dominance application has been denied')
      .setDescription(`**Reason:** ${interaction.values}`);
    await user.send({ embeds: [embed] });
    await interaction.editReply({ content: 'Successfully denied', components: [] });
  } else if (interaction.isButton()) {
    if (interaction.customId in roles) {
      const roleId = roles[interaction.customId];
      let msg;
      await interaction.deferReply({ ephemeral: true });
      // eslint-disable-next-line no-underscore-dangle
      if (member.roles.resolve(roleId)) {
        await member.roles.remove(roleId);
        msg = `<:minus:1005843963686686730> <@&${roleId}>`;
      } else {
        await member.roles.add(roleId);
        msg = `<:add:1005843961652453487> <@&${roleId}>`;
      }
      await interaction.editReply({ content: msg });
    } else if (interaction.customId === 'requirements') {
      let uuid;
      let playerData;
      await interaction.deferReply({ ephemeral: true });
      try {
        ({ uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(interaction.user.id));
        playerData = (
          await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json()
        ).player;
      } catch (e) {
        await member.roles.add(interaction.guild!.roles.cache.get('907911526118223912') as Role);
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle('Error')
          .setDescription('Please verify first in <#1031568019522072677>');
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      const requirementData = await requirements(uuid, playerData);
      const embed = new EmbedBuilder()
        .setColor(requirementData.color)
        .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
        .setDescription(`**Current Guild:** \`${requirementData.guild[0]}\`\n\n${requirementData.requirementEmbed}`)
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
    } else if (interaction.customId === 'apply') {
      if (db.prepare('SELECT uuid FROM members WHERE discord = ?').get(interaction.user.id) === undefined) {
        await member.roles.add(interaction.guild!.roles.cache.get('907911526118223912') as Role);
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
        .setLabel('Why should we accept you? (4+ sentences)')
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
      const name = await interaction.message.embeds[0].data.fields![0].value;
      const discordId = await interaction.message.embeds[0].data.fields![3].value.slice(2, -1);
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
              `**How to get started:**\n${config.emojis.bullet} **Join The Guild**\nYou can be invited to the guild anytime without ` +
                `staff. Just type \`/msg DominanceLink .\` in-game or if you are muted, type \`/immuted DominanceLink\`\n\n` +
                `You won't be able to see guild channels until you have joined in-game\n\n${config.emojis.bullet} **Confused?**\n` +
                `Feel free to ask any questions here, only ping staff if needed!`
            )
            .setThumbnail(
              `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
            );
          db.prepare('INSERT INTO waitlist (uuid, discord, time, channel) VALUES (?, ?, ?, ?)').run(
            uuid,
            discordId,
            Math.floor(Date.now() / 1000),
            channel.id
          );
          await channel.send({ content: user.toString(), embeds: [embed] });
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
          await channels.applicationLogs.send({ embeds: [applicationEmbed] });
          await interaction.editReply('Application accepted');
          await interaction.message.delete();
        });
    } else if (interaction.customId === 'deny') {
      const discordId = await interaction.message.embeds[0].data.fields![3].value.slice(2, -1);
      const name = await interaction.message.embeds[0].data.fields![0].value;
      const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder().setCustomId(discordId).setPlaceholder('Select a reason').addOptions(
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
      await interaction.reply({ components: [row], ephemeral: true });
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
      await channels.applicationLogs.send({ embeds: [applicationEmbed] });
      await interaction.message.delete();
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'verification') {
      await interaction.deferReply({ ephemeral: true });
      let uuid;
      let disc;
      let name;
      const ign = interaction.fields.getTextInputValue('verificationInput');
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
      const { player } = await (
        await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)
      ).json();
      try {
        name = player.displayname;
        disc = player.socialMedia.links.DISCORD;
      } catch (e) {
        if (name === undefined) {
          const embed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle('Verification Unsuccessful')
            .setDescription(`<a:across:986170696512204820> **${ign}** is an invalid IGN`);
          await interaction.editReply({ embeds: [embed] });
          return;
        }
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
      if (disc === interaction.user.tag) {
        let guildInfo;
        await member.roles.remove(interaction.guild!.roles.cache.get('907911526118223912') as Role);
        await member.roles.add(interaction.guild!.roles.cache.get('445669382539051008') as Role);
        const { guild } = await (
          await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&player=${uuid}`)
        ).json();
        if (guild === null) {
          guildInfo = 'is not in Dominance';
        } else if (guild.name_lower === 'dominance') {
          await member.roles.add(interaction.guild!.roles.cache.get(roles['[Member]']) as Role);
          guildInfo = 'is in Dominance';
        } else {
          guildInfo = 'is not in Dominance';
        }
        db.prepare('INSERT OR IGNORE INTO members (discord) VALUES (?)').run(interaction.user.id);
        db.prepare('UPDATE members SET uuid = ? WHERE discord = ?').run(uuid, interaction.user.id);
        const embed = new EmbedBuilder()
          .setColor(config.colors.green)
          .setTitle('Verification Successful')
          .setDescription(
            `<a:atick:986173414723162113> **${name}** ${guildInfo}\n<:add:1005843961652453487>\
                    Added: <@&445669382539051008>\n<:minus:1005843963686686730> Removed: <@&907911526118223912>`
          )
          .setThumbnail(
            `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
          );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder().setColor(config.colors.red).setTitle('Verification Unsuccessful')
          .setDescription(`<a:across:986170696512204820>${name} has a different discord account linked on hypixel\nThe discord tag **${disc}**\
                        linked on hypixel does not match your discord tag **${interaction.user.tag}**`);
        await interaction.editReply({ embeds: [embed] });
      }
    } else if (interaction.customId === 'applications') {
      await interaction.deferReply({ ephemeral: true });
      const q1 = interaction.fields.getTextInputValue('q1Input');
      const q2 = interaction.fields.getTextInputValue('q2Input');
      const q3 = interaction.fields.getTextInputValue('q3Input');

      const { uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(interaction.user.id);
      const playerData = (
        await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json()
      ).player;
      const requirementData = await requirements(uuid, playerData);
      const name = await uuidToName(uuid);

      const applicationEmbed = new EmbedBuilder()
        .setColor(requirementData.color)
        .setTitle(`${interaction.user.tag}'s Application`)
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        )
        .setDescription(
          `<:keycap_1_3d:1029711346297737277> **What games do you mainly play?**\n${q1}\n\n<:keycap_2_3d:1029711344414507038> ` +
            `**Why should we accept you? (4 sentences)**\n${q2}\n\n<:keycap_3_3d:1029711342468345888> **Do you know anyone from ` +
            `the guild?**\n${q3}\n\n════ ⋆★⋆ ════\n\n**[Requirements]**\n${requirementData.requirementEmbed}`
        )
        .addFields(
          { name: '<:user:1029703318924165120> IGN: ', value: name, inline: true },
          {
            name: '<:page_with_curl_3d:1029706324881199126> Meeting Requirements: ',
            value: requirementData.reqs,
            inline: true
          },
          { name: ':shield: Guild: ', value: requirementData.guild[0], inline: true },
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
      await channels.applications.send({ components: [row], embeds: [applicationEmbed] });
      const replyEmbed = new EmbedBuilder()
        .setColor(requirementData.color)
        .setTitle(`${interaction.user.tag}'s application has been received`)
        .setThumbnail(
          `https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`
        )
        .setDescription(
          `<:keycap_1_3d:1029711346297737277> **What games do you mainly play?**\n${q1}\n\n<:keycap_2_3d:1029711344414507038> ` +
            `**Why should we accept you? (4 sentences)**\n${q2}\n\n<:keycap_3_3d:1029711342468345888> **Do you know anyone from the ` +
            `guild?**\n${q3}\n\n════ ⋆★⋆ ════\n\n**[Info]**\nApplications usually receive a response within 24 hours\nYou will be ` +
            `**pinged** in this server if you have been accepted\nYou will receive a dm if you are rejected **unless** your dm's are closed`
        );
      await interaction.editReply({ embeds: [replyEmbed] });
    }
  }
}
