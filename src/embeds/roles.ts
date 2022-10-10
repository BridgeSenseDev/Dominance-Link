import {
  Client, GatewayIntentBits, EmbedBuilder, ChannelType, ButtonBuilder, ActionRowBuilder,
  ButtonStyle,
} from 'discord.js';
import config from '../config.json' assert {type: 'json'};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.on('ready', async () => {
  // eslint-disable-next-line no-console
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);
  const rolesEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Roles Info', iconURL: config.guild.icon })
    .addFields(
      {
        name: '<a:economy:1006182871314219169> Economy Roles',
        value: '`-` <@&800074267944681512>\n`-` <@&488352639671599125>\n`-` <@&488352623884500992>\n`-` <@&488352607807733791>\n'
          + '`-` <@&1028890537979297853>\n`-` <@&488352576568557568>\n`-` <@&488352546579152907>\n`-` <@&488352526110818304>\n'
          + '`-` <@&488352505953255440>\n`-` <@&488352481634418710>\n`-` <@&488352447819939861>\n`-` <@&488352345613271070>\n'
          + '`-` <@&477063574309830667>\n`-` <@&465226964677165056>\n`-` <@&1028900715189514350>\n`-` <@&349212066164244480>\n'
          + '`-` <@&348946342707462144>\n`-` <@&348938634227089411>',
        inline: true,
      },
      {
        name: '<a:talking:1004962079154896967> Discord Activity Roles',
        value: '`-` <@&755123430256279633>\n`-` <@&932285657903161374>\n`-` <@&919688791361466368>\n`-` <@&932284834791960628>\n`-` '
          + '<@&755122545488822534>\n`-` <@&755123236114792468>',
        inline: true,
      },
      {
        name: '\u200B', value: '\u200B', inline: false,
      },
      {
        name: '<:staff:1006186955941347419> Ex Matrix Member Roles',
        value: '`-` <@&910315929160781825> | Staff for 1+ years\n`-` <@&817133925834162177>',
        inline: true,
      },
    );

  const notificationsRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('notifications')
        .setLabel('Notifications')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('a:anotif:999683838357807235'),
      new ButtonBuilder()
        .setCustomId('qotd')
        .setLabel('QOTD')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('a:aquestion:999684566220558507'),
      new ButtonBuilder()
        .setCustomId('tournaments')
        .setLabel('Tournaments')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('a:atrophy:999641153190248499'),
      new ButtonBuilder()
        .setCustomId('events')
        .setLabel('Events')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('a:confetti:999682055099134102'),
      new ButtonBuilder()
        .setCustomId('youtube')
        .setLabel('Youtube')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('a:ayoutube:999685789917122650'),
    );

  const notificationsEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Notification Roles', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1005133447712473108/notification-bell_1.png' })
    .setDescription('Use the buttons below to select notification pings\nRed buttons are for guild members');

  const gamemodesRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('bedwars')
        .setLabel('Bedwars')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':bedwars:1006049483383115867'),
      new ButtonBuilder()
        .setCustomId('duels')
        .setLabel('Duels')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':duels:1006051301534212147'),
      new ButtonBuilder()
        .setCustomId('skyblock')
        .setLabel('Skyblock')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':skyblock:1006051295695745065'),
      new ButtonBuilder()
        .setCustomId('skywars')
        .setLabel('Skywars')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':skywars:1006052635062829066'),
    );

  const gamemodesEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Gamemode Roles', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1006054852381651034/DdNypQdN_400x400.png' })
    .setDescription('Use the buttons below to select what gamemodes you like to play\nThese roles can be mentioned!');

  const channel = client.channels.cache.get('583661446202785815');
  if (channel?.type === ChannelType.GuildText) {
    await channel.send({ embeds: [rolesEmbed] });
    await channel.send({
      components: [notificationsRow],
      embeds: [notificationsEmbed],
    });
    await channel.send({
      components: [gamemodesRow],
      embeds: [gamemodesEmbed],
    });
  }
});

client.login(config.keys.discordBotToken);
