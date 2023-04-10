import Database from 'better-sqlite3';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { messages } from '../events/discord/ready.js';
import { dividers } from './constants.js';
import { formatNumber, hypixelRequest, uuidToName } from './utils.js';
import { WeeklyChallengeMember } from '../types/global.d.js';

const db = new Database('guild.db');

export async function updateWeeklyChallenges() {
  const members = db
    .prepare('SELECT * FROM weeklyChallenges')
    .all()
    .map((member: unknown) => member as WeeklyChallengeMember);

  for (let i = 0; i < members.length; i++) {
    const { player } = await hypixelRequest(`https://api.hypixel.net/player?uuid=${members[i].uuid}`);
    let current = player;
    for (const obj of config.guild.weeklyChallenges.stat) {
      current = current[obj];
    }
    db.prepare('UPDATE weeklyChallenges SET current = ? WHERE uuid = ?').run(current, members[i].uuid);
    members[i].difference = current - members[i].initial;
  }

  members.sort((a, b) => {
    if (a.difference && b.difference) {
      return b.difference - a.difference;
    }
    return 0;
  });

  let participants = '';
  for (let i = 0; i < members.length; i++) {
    participants += `\n${i + 1}. **${await uuidToName(members[i].uuid)}** - \`${formatNumber(
      members[i].difference!
    )}\``;
  }

  const time = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() + (7 - new Date().getDay()),
    11,
    50
  ).getTime();

  const embed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setTitle(`${config.guild.weeklyChallenges.name} Weekly Challenge`)
    .setDescription(
      `**Challenge Info:**\n\n${config.emojis.bullet} Get \`${formatNumber(config.guild.weeklyChallenges.req)}\` ${
        config.guild.weeklyChallenges.name
      } before <t:${Math.floor(time / 1000)}:F>\n${config.emojis.bullet} Reward: \`${formatNumber(
        config.guild.weeklyChallenges.reward
      )}\` Points\n\n${dividers(26)}\n\n**Participants:**\n\n${participants}`
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('joinChallenge')
      .setStyle(ButtonStyle.Success)
      .setLabel('Join Challenge')
      .setEmoji('a:atrophy:999641153190248499')
  );

  const weeklyChallengesMessage = messages.weeklyChallenges as Message;
  await weeklyChallengesMessage.edit({
    embeds: [embed],
    components: [row]
  });
}

export function weeklyChallengesInterval(): void {
  setInterval(() => {
    updateWeeklyChallenges();
  }, 1 * 60 * 1000);
}
