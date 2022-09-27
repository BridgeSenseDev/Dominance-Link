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
  const rolesEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Roles Info', iconURL: config.guild.icon })
    .addFields(
      {
        name: '<a:economy:1006182871314219169> Economy Roles',
        value: '`-` <@&348938634227089411>\n`-` <@&348946342707462144>\n`-` <@&349212066164244480>\n`-` <@&457922084601856002>\n'
          + '`-` <@&465226964677165056>\n`-` <@&477063574309830667>\n`-` <@&488352345613271070>\n`-` <@&488352447819939861>\n'
          + '`-` <@&488352481634418710>\n`-` <@&488352526110818304>\n`-` <@&488352546579152907>\n`-` <@&488352576568557568>\n'
          + '`-` <@&488352607807733791>\n`-` <@&488352623884500992>\n`-` <@&488352639671599125>\n`-` <@&800074267944681512>',
        inline: true,
      },
      {
        name: '<:mention:913408059425058817> Gamemode Roles',
        value: '**Request roles in <#867160066704146482> by making a ticket**\n`-` <@&998657309846802432> | 15+ Stars\n`-` '
          + '<@&998659208427884634> | 25+ Stars\n`-` <@&998658850649542727> | 5k+ Wins\n`-` <@&998665819955404920> | 10k+ Wins\n`-` '
          + '<@&998657747606319244> | 500m+ Networth, 35+ Skill Average\n`-` <@&998665889568268370> | 1b+ Networth, 45+ Skill Average'
          + '\n`-` <@&998931115551248435> | 6k+ Wins\n`-` <@&998667281208987678> | 15k+ Wins\n`-` <@&998666895635001404> | 200+ Hypixel '
          + 'Level\n`-` <@&996831106454270102> | 250+ Hypixel Level\n`-` <@&965374934564098109> | 6.5k+ A.P.\n`-` <@&998932384089120789> '
          + '| 10k+ A.P.\n`-` <@&989254751822684201> | 100+ Stars, 500+ Wins\n`-` <@&989255125870735420> | 150+ Stars, 750+ Wins\n`-` '
          + '<@&989255372026036296> | 175+ Stars, 1000+ Wins\n`-` <@&1001480839110070312> | 300+ Stars, 2500+ Wins\n`-` '
          + '<@&998934960192897064> | Collect all "Pro" gamemode ranks',
        inline: true,
      },
      {
        name: '\u200B', value: '\u200B', inline: false,
      },
      {
        name: '<a:talking:1004962079154896967> Discord Activity Roles',
        value: '`-` <@&755123236114792468>\n`-` <@&755122545488822534>\n`-` <@&919717471936729139>\n`-` <@&932284834791960628>\n`-` '
          + '<@&755122903640440954>\n`-` <@&919688791361466368>\n`-` <@&932285662751756338>\n`-` <@&932285657903161374>\n`-` '
          + '<@&932285654266683442>\n`-` <@&755123430256279633>\n`-` <@&932285660688175144>\n`-` <@&932285662202318908>',
        inline: true,
      },
      {
        name: '<:staff:1006186955941347419> Ex Matrix Member Roles',
        value: '`-` <@&807955811250733076> | Was in guild for 6+ months\n`-` <@&910315929160781825> | Must have been staff for over '
          + 'a year\n`-` <@&817133925834162177>',
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
    );

  const notificationsRow2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('youtube')
        .setLabel('Youtube')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('a:ayoutube:999685789917122650'),
      new ButtonBuilder()
        .setCustomId('twitch')
        .setLabel('Twitch')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(':twitch1:1010787855976636457'),
      new ButtonBuilder()
        .setCustomId('gexpparty')
        .setLabel('GEXP Party')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(':party:1006203392886050886'),
      new ButtonBuilder()
        .setCustomId('lbw')
        .setLabel('LBW')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(':bedwars:1006049483383115867'),
    );

  const notificationsEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Notification Roles', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1005133447712473108/notification-bell_1.png' })
    .setDescription('Use the buttons below to select notification pings\nRed buttons are for guild members');

  const gamemodesRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('arcade')
        .setLabel('Arcade')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':arcade:1006049485656424599'),
      new ButtonBuilder()
        .setCustomId('bedwars')
        .setLabel('Bedwars')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':bedwars:1006049483383115867'),
      new ButtonBuilder()
        .setCustomId('blitz')
        .setLabel('Blitz')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':blitzsg:1006049481860587610'),
      new ButtonBuilder()
        .setCustomId('buildbattle')
        .setLabel('Build Battle')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':buildbattle:1006049480061222922'),
      new ButtonBuilder()
        .setCustomId('classicgames')
        .setLabel('Classic Games')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':classicgames:1006049478001819839'),
    );

  const gamemodesRow2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('duels')
        .setLabel('Duels')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':duels:1006051301534212147'),
      new ButtonBuilder()
        .setCustomId('housing')
        .setLabel('Housing')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':housing:1006051299520950314'),
      new ButtonBuilder()
        .setCustomId('murdermystery')
        .setLabel('Murder Mystery')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':murdermystery:1006051297549619201'),
      new ButtonBuilder()
        .setCustomId('pit')
        .setLabel('Pit')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':pit:1006051293741187183'),
      new ButtonBuilder()
        .setCustomId('skyblock')
        .setLabel('Skyblock')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':skyblock:1006051295695745065'),
    );

  const gamemodesRow3 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('skywars')
        .setLabel('Skywars')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':skywars:1006052635062829066'),
      new ButtonBuilder()
        .setCustomId('smashheroes')
        .setLabel('Smash Heroes')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':smashheroes:1006052633133457519'),
      new ButtonBuilder()
        .setCustomId('tnt')
        .setLabel('Tnt')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':tnt:1006052631258599564'),
      new ButtonBuilder()
        .setCustomId('uhc')
        .setLabel('Uhc')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(':uhc:1006052628893020221'),
      new ButtonBuilder()
        .setCustomId('megawalls')
        .setLabel('Mega Walls')
        .setStyle(ButtonStyle.Success)
        .setEmoji(':megawalls:1006054180093448273'),
    );

  const gamemodesEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Gamemode Roles', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1006054852381651034/DdNypQdN_400x400.png' })
    .setDescription('Use the buttons below to select what gamemodes you like to play\nThese roles can be mentioned!');

  const channel = client.channels.cache.get('583661446202785815');
  if (channel?.type === ChannelType.GuildText) {
    await channel.send({ embeds: [rolesEmbed] });
    await channel.send({
      components: [notificationsRow, notificationsRow2],
      embeds: [notificationsEmbed],
    });
    await channel.send({
      components: [gamemodesRow, gamemodesRow2, gamemodesRow3],
      embeds: [gamemodesEmbed],
    });
  }
});

client.login(config.keys.discordBotToken);
