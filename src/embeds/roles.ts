import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  TextChannel
} from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { bullet } from '../helper/constants.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
  const rolesEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Roles Info', iconURL: config.guild.icon })
    .addFields(
      {
        name: `${config.emojis.aEconomy} Economy Roles`,
        value:
          `${bullet} <@&349212066164244480>\n${bullet} <@&348938634227089411>\n` +
          `${bullet} <@&1028900715189514350>\n${bullet} <@&348946342707462144>\n` +
          `${bullet} <@&465226964677165056>\n${bullet} <@&477063574309830667>\n` +
          `${bullet} <@&488352345613271070>\n${bullet} <@&488352481634418710>\n` +
          `${bullet} <@&488352447819939861>\n${bullet} <@&488352505953255440>\n` +
          `${bullet} <@&488352546579152907>`,
        inline: true
      },
      {
        name: `${config.emojis.aEconomy} Economy Roles`,
        value:
          `${bullet} <@&488352526110818304>\n${bullet} <@&488352576568557568>\n` +
          `${bullet} <@&1028890537979297853>\n${bullet} <@&488352607807733791>\n` +
          `${bullet} <@&488352623884500992>\n${bullet} <@&488352639671599125>\n` +
          `${bullet} <@&800074267944681512>\n${bullet} <@&1120155168256839680>\n` +
          `${bullet} <@&1120155457110163566>\n${bullet} <@&1120157621471678665>\n` +
          `${bullet} <@&1120157854557544498>`,
        inline: true
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: true
      },
      {
        name: `${config.emojis.aTalking} Discord Activity Roles`,
        value:
          `${bullet} <@&1226228193602699304>\n${bullet} <@&1226228134962008124>\n` +
          `${bullet} <@&1226228052921548871>`,
        inline: true
      },
      {
        name: `${config.emojis.staff} Guild Member Roles`,
        value:
          `${bullet} ${config.roles.recruitmentStaff}\n${bullet} ${config.roles.eventStaff}\n` +
          `${bullet} ${config.roles.goat}\n${bullet} ${config.roles.dominator}\n` +
          `${bullet} ${config.roles.supreme}\n${bullet} ${config.roles.hero}\n` +
          `${bullet} ${config.roles.elite}\n${bullet} ${config.roles.slayer}\n`+
          `${bullet} ${config.roles.slayer}\n${bullet} ${config.roles.break}\n`,
        inline: true
      }
    );

  const notificationsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('notifications')
      .setLabel('Notifications')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(config.emojis.aBell),
    new ButtonBuilder()
      .setCustomId('polls')
      .setLabel('Polls')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(config.emojis.poll),
    new ButtonBuilder()
      .setCustomId('qotd')
      .setLabel('QOTD')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(config.emojis.aQuestion),
    new ButtonBuilder()
      .setCustomId('events')
      .setLabel('Events')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(config.emojis.aConfetti),
    new ButtonBuilder()
      .setCustomId('bot_updates')
      .setLabel('Bot Updates')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(config.emojis.aDiscordbot)
  );

  const notificationsEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({
      name: 'Notification Roles',
      iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1005133447712473108/notification-bell_1.png'
    })
    .setDescription('Use the buttons below to select notification pings');

  const gamemodesRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('bedwars')
      .setLabel('Bedwars')
      .setStyle(ButtonStyle.Success)
      .setEmoji(config.emojis.bedwars),
    new ButtonBuilder()
      .setCustomId('duels')
      .setLabel('Duels')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(config.emojis.duels),
    new ButtonBuilder()
      .setCustomId('skyblock')
      .setLabel('Skyblock')
      .setStyle(ButtonStyle.Success)
      .setEmoji(config.emojis.skyblock),
    new ButtonBuilder()
      .setCustomId('skywars')
      .setLabel('Skywars')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(config.emojis.skywars)
  );

  const gamemodesEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({
      name: 'Gamemode Roles',
      iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1006054852381651034/DdNypQdN_400x400.png'
    })
    .setDescription('Use the buttons below to select what gamemodes you like to play\nThese roles can be mentioned!');

  const channel = client.channels.cache.get('1039170240623427584') as TextChannel;
  await channel.send({ embeds: [rolesEmbed] });
  await channel.send({
    components: [notificationsRow],
    embeds: [notificationsEmbed]
  });
  await channel.send({
    components: [gamemodesRow],
    embeds: [gamemodesEmbed]
  });
});

client.login(config.keys.discordBotToken);