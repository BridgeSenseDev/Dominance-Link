const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
} = require('discord.js');

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
    );

  const embed = new EmbedBuilder()
    .setColor(0x2f3136)
    .setAuthor({ name: 'Notification Roles', iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1005133447712473108/notification-bell_1.png' })
    .setDescription('Use the buttons below to select notification pings');
  await channel.send({ components: [row, row2], embeds: [embed] });
}

module.exports = {
  notificationRoles,
};
