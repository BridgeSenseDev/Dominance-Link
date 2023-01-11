import Database from 'better-sqlite3';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, escapeMarkdown } from 'discord.js';
import { formatDate, uuidToName } from './utils.js';
import config from '../config.json' assert { type: 'json' };
import { messages } from '../events/discord/ready.js';
import { bullet, sub, invis, dividers } from './constants.js';

const db = new Database('guild.db');

export async function unverifiedUpdate() {
  setInterval(async () => {
    const data = db.prepare('SELECT * FROM guildMembers').all();
    let description = 'List of guild members who are unverified / not in the discord\n';
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].discord === null) {
        description += `\n${await uuidToName(data[i].uuid)}`;
      }
    }
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle('Unlinked Members')
      .setDescription(escapeMarkdown(description));
    await messages.unverified.edit({ embeds: [embed] });
  }, 30 * 1000);
}

export async function breakUpdate() {
  setInterval(async () => {
    const data = db.prepare('SELECT * FROM breaks').all();
    let description = '';
    for (let i = 0; i < data.length; i++) {
      description += `\n${bullet} ${await uuidToName(data[i].uuid)}`;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setAuthor({ name: 'Dominance Break Forms', iconURL: config.guild.icon })
      .setDescription(
        `**How it Works:**\n\n${bullet} You can make a break form to inform staff of upcoming inactivity\n${bullet} Members on ` +
          `break retain their original permissions\n${bullet} You may be kicked from the guild based on your break length\n${invis}` +
          `${sub} Staff will consider your days in guild before kicking\n${bullet} You can rejoin anytime by messaging DominanceLink ` +
          `in-game\n\n${dividers(23)}\n\n**Members on Break:**\n${description}`
      )
      .setFooter({
        text: `Updated ${formatDate(new Date())}`,
        iconURL: config.guild.icon
      });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('break').setLabel('Break Form').setStyle(ButtonStyle.Secondary).setEmoji('💤')
    );
    await messages.break.edit({ embeds: [embed], components: [row] });
  }, 30 * 1000);
}
