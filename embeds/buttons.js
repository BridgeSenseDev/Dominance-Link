import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
} from 'discord.js';
import config from '../config.json' assert { type: "json" };

async function notificationRoles(client, channelId) {
  const channel = client.channels.cache.get(channelId);
  const row = new ActionRowBuilder()
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
        .setEmoji('a:events:845903921280319508'),
      new ButtonBuilder()
        .setCustomId('minievents')
        .setLabel('Mini Events')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('a:confetti:999682055099134102'),
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('talking')
        .setLabel('Talking')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('a:talking:1004962079154896967'),
      new ButtonBuilder()
        .setCustomId('youtube')
        .setLabel('Youtube')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('a:ayoutube:999685789917122650'),
      new ButtonBuilder()
        .setCustomId('twitch')
        .setLabel('Twitch')
        .setStyle(ButtonStyle.Secondary)
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

  const embed = new EmbedBuilder()
    .setColor(config.color.discordGray)
    .setAuthor({ name: 'Notification Roles', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1005133447712473108/notification-bell_1.png' })
    .setDescription('Use the buttons below to select notification pings\nRed buttons are for guild members');
  await channel.send({ components: [row, row2], embeds: [embed] });
}

async function gamemodeRoles(client, channelId) {
  const channel = client.channels.cache.get(channelId);
  const row = new ActionRowBuilder()
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

  const row2 = new ActionRowBuilder()
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

  const row3 = new ActionRowBuilder()
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
  const embed = new EmbedBuilder()
    .setColor(config.color.yellow)
    .setAuthor({ name: 'Gamemode Roles', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1006054852381651034/DdNypQdN_400x400.png' })
    .setDescription('Use the buttons below to select what gamemodes you like to play\nThese roles can be mentioned!');
  await channel.send({ components: [row, row2, row3], embeds: [embed] });
}

async function applications(client, channelId) {
  const channel = client.channels.cache.get(channelId);
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('apply')
        .setLabel('Apply')
        .setStyle(ButtonStyle.Success)
        .setEmoji('a:checkmark:1011799454959022081'),
    );

  const embed = new EmbedBuilder()
    .setColor(config.color.yellow)
    .setAuthor({ name: 'Applications', iconURL: config.guild.icon })
    .setDescription('**Click the button below to apply**\nYou **WILL NOT** get a response if you\'re rejected and your dm\'s are closed\n\n════ ⋆★⋆ ════\n\n**[Rejoining]**\n\
    `-` If your application gets rejected wait **3 weeks** before reapplying\n`-` Wait **1 month** before reapplying if you get kicked / leave\n`-` Wait **2 months** before \
    reapplying if you get kicked within a month\n`-` You can reapply **unlimited** times\n\n════ ⋆★⋆ ════')
    .setThumbnail('https://cdn.discordapp.com/attachments/986281342457237624/1011808965920825345/web-browser.png');
  await channel.send({ components: [row], embeds: [embed] });
}

export {
  notificationRoles,
  gamemodeRoles,
  applications,
};
