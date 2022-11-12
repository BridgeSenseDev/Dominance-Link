import Database from 'better-sqlite3';
import { EmbedBuilder, escapeMarkdown } from 'discord.js';
import { uuidToName } from './utils.js';
import config from '../config.json' assert { type: 'json' };
import { messages } from '../events/discord/ready.js';

const db = new Database('guild.db');

export default async function unverified() {
  setInterval(async () => {
    const data = db.prepare('SELECT * FROM guildMembers').all();
    let description = 'List of guild members who are unverified / not in the discord\n';
    for (let i = data.length - 1; i >= 0; i -= 1) {
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
