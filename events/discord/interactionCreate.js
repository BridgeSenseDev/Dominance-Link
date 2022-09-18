const roles = {
  notifications: '789800580314824744', qotd: '829991529857810452', tournaments: '676497290084614155', events: '655711286755065856', minievents: '674710457826672641', talking: '956226601790615612', youtube: '956996151268241478', twitch: '1010698416994656307', gexpparty: '872068100823068733', lbw: '964344698699415632', arcade: '903994956413300767', bedwars: '903995572392984576', blitz: '903995954800259184', buildbattle: '903996023138045952', classicgames: '903996067627040778', duels: '903996109096103986', housing: '1006057221462966303', megawalls: '987119811345657977', murdermystery: '903996153476046899', pit: '903996188930506762', skyblock: '903996220551360642', skywars: '903996253589880832', smashheroes: '903996286070587392', tnt: '903996313954299924', uhc: '903996345789083728',
};
const {
  EmbedBuilder, InteractionType, TextInputBuilder, ModalBuilder, TextInputStyle, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, ChannelType, SelectMenuBuilder,
} = require('discord.js');
const db = require('better-sqlite3')('matrix.db');
const { nameToUUID, UUIDtoName } = require('../../helper/utils');
const { requirements } = require('../../helper/requirements');
const config = require('../../config.json');

module.exports = {
  execute: async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    } else if (interaction.isSelectMenu()) {
      await interaction.deferUpdate({ ephemeral: true });
      const user = await client.users.fetch(interaction.customId);
      const embed = new EmbedBuilder()
        .setColor(0xe74d3c)
        .setTitle('Your Matrix application has been denied')
        .setDescription(`**Reason:** ${interaction.values}`);
      await user.send({ embeds: [embed] });
      await interaction.editReply({ content: 'Successfully denied', components: [] });
    } else if (interaction.isButton()) {
      if (interaction.customId === 'requirements') {
        await interaction.deferReply({ ephemeral: true });
        let uuid; let playerData;
        try {
          ({ uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(interaction.user.id));
          playerData = (await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json()).player;
        } catch (e) {
          await interaction.member.roles.add(interaction.guild.roles.cache.get('907911526118223912'));
          const embed = new EmbedBuilder()
            .setColor(0xe74d3c)
            .setTitle('Error')
            .setDescription('Please verify first in <#907911357582704640>');
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        const requirementData = await requirements(uuid, playerData);
        const embed = new EmbedBuilder()
          .setColor(requirementData.color)
          .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
          .setDescription(`**Current Guild:** \`${requirementData.guild[0]}\`\n\n${requirementData.requirements}`)
          .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
        await interaction.editReply({ embeds: [embed] });
      } else if (interaction.customId === 'apply') {
        if (db.prepare('SELECT uuid FROM members WHERE discord = ?').get(interaction.user.id) === undefined) {
          await interaction.member.roles.add(interaction.guild.roles.cache.get('907911526118223912'));
          const embed = new EmbedBuilder()
            .setColor(0xe74d3c)
            .setTitle('Error')
            .setDescription('Please verify first in <#907911357582704640>');
          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
        const modal = new ModalBuilder()
          .setCustomId('applications')
          .setTitle('Matrix Application');
        const q1Input = new TextInputBuilder()
          .setCustomId('q1Input')
          .setLabel('What games do you mainly play?')
          .setStyle(TextInputStyle.Short);
        const q2Input = new TextInputBuilder()
          .setCustomId('q2Input')
          .setLabel('Why should we accept you? (4 sentences)')
          .setStyle(TextInputStyle.Paragraph);
        const q3Input = new TextInputBuilder()
          .setCustomId('q3Input')
          .setLabel('Do you know anyone from the guild?')
          .setStyle(TextInputStyle.Paragraph);
        const firstActionRow = new ActionRowBuilder().addComponents(q1Input);
        const secondActionRow = new ActionRowBuilder().addComponents(q2Input);
        const thirdActionRow = new ActionRowBuilder().addComponents(q3Input);
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
        await interaction.showModal(modal);
      } else if (interaction.customId === 'accept') {
        await interaction.deferReply({ ephemeral: true });
        const name = await interaction.message.embeds[0].data.fields[0].value;
        const discordId = await interaction.message.embeds[0].data.fields[3].value.slice(2, -1);
        const uuid = await nameToUUID(name);
        const user = await client.users.fetch(discordId);
        interaction.guild.channels.create({
          name: `🔴 ${name}`,
          type: ChannelType.GuildText,
          parent: '1020948893204217856',
        }).then(async (channel) => {
          await channel.permissionOverwrites.edit(user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
          const embed = new EmbedBuilder()
            .setColor(0x2ecc70)
            .setTitle(`Congrats ${name}, your application has been accepted!`)
            .setDescription('**How to get started:**\n`1.` **Join The Guild**\nYou can get invited to the guild at anytime without staff. Just type `/msg MatrixLink .` \
            or if you are muted, type `/immuted MatrixLink`\n\n`2.` **Familiarize Yourself**\nHang out with other guild members in <#1016840866322714684> or talk in-game \
            using <#1016734361472729088>. Don\'t miss out on weekly announcements in <#795342812538863676>\n\n`3.` **Confused?**\nFeel free to ask any questions here, only \
            ping staff if needed!')
            .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
          db.prepare('INSERT INTO waitlist (uuid, discord, time, channel) VALUES (?, ?, ?, ?)').run(uuid, discordId, Math.floor(Date.now() / 1000), channel.id);
          await channel.send({ content: user.toString(), embeds: [embed] });
          await interaction.editReply('Application accepted');
          await interaction.message.delete();
        });
      } else if (interaction.customId === 'deny') {
        const discordId = await interaction.message.embeds[0].data.fields[3].value.slice(2, -1);
        const row = new ActionRowBuilder()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId(discordId)
              .setPlaceholder('Select a reason')
              .addOptions(
                {
                  label: 'Not meeting guild requirements',
                  value: 'Not meeting guild requirements',
                },
                {
                  label: 'Not writing enough on your application',
                  value: 'Not writing enough on your application',
                },
                {
                  label: 'Being a guild hopper',
                  value: 'Being a guild hopper',
                },
                {
                  label: 'Being a known hacker/cheater',
                  value: 'Being a known hacker/cheater',
                },
                {
                  label: 'Being toxic',
                  value: 'Being toxic',
                },
              ),
          );
        await interaction.reply({ components: [row], ephemeral: true });
        await interaction.message.delete();
      } else if (interaction.customId in roles) {
        const roleId = roles[interaction.customId];
        let msg;
        // eslint-disable-next-line no-underscore-dangle
        if (interaction.member._roles.includes(roleId)) {
          await interaction.member.roles.remove(roleId);
          msg = `<:minus:1005843963686686730> <@&${roleId}>`;
        } else {
          await interaction.member.roles.add(roleId);
          msg = `<:add:1005843961652453487> <@&${roleId}>`;
        }
        await interaction.reply({ content: msg, ephemeral: true });
      }
    } else if (interaction.type === InteractionType.ModalSubmit) {
      await interaction.deferReply({ ephemeral: true });
      const q1 = interaction.fields.getTextInputValue('q1Input');
      const q2 = interaction.fields.getTextInputValue('q2Input');
      const q3 = interaction.fields.getTextInputValue('q3Input');

      const { uuid } = db.prepare('SELECT uuid FROM members WHERE discord = ?').get(interaction.user.id);
      const playerData = (await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json()).player;
      const requirementData = await requirements(uuid, playerData);
      const name = await UUIDtoName(uuid);

      const embed = new EmbedBuilder()
        .setColor(requirementData.color)
        .setTitle(`${interaction.user.tag}'s Application`)
        .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`)
        .setDescription(`:one: **What games do you mainly play?**\n${q1}\n\n:two: **Why should we accept you? (4 sentences)**\n${q2}\n\n:three: \
        **Do you know anyone from the guild?**\n${q3}\n\n════ ⋆★⋆ ════\n\n**[Requirements]**\n${requirementData.requirements}`)
        .addFields(
          { name: '<:name:1011937788851138585> IGN: ', value: name, inline: true },
          { name: ':pencil: Meeting Requirements: ', value: requirementData.reqs, inline: true },
          { name: ':shield: Guild: ', value: requirementData.guild[0], inline: true },
          { name: '<:mention:913408059425058817> Discord: ', value: `<@${interaction.user.id}>`, inline: true },
          { name: '<:month:982237517581537350> Discord Member Since: ', value: `<t:${Math.floor(interaction.member.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: '<:clock_:969185417712775168> Created: ', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        );

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('accept')
            .setStyle(ButtonStyle.Success)
            .setLabel('Accept')
            .setEmoji('a:atick:986173414723162113'),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId('deny')
            .setStyle(ButtonStyle.Danger)
            .setLabel('Deny')
            .setEmoji('a:across:986170696512204820'),
        );
      await applicationsChannel.send({ components: [row], embeds: [embed] });
      await interaction.editReply({ content: 'Your application was received successfully!', ephemeral: true });
    }
  },
};
