import Database from 'better-sqlite3';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Message, TextChannel } from 'discord.js';
import cron from 'node-cron';
import fs from 'fs';
import config from '../config.json' assert { type: 'json' };
import { messages } from '../events/discord/ready.js';
import { dividers } from './constants.js';
import { formatNumber, uuidToName } from './utils.js';
import { WeeklyChallengeMember } from '../types/global.d.js';
import { fetchPlayerRaw } from '../api.js';

const db = new Database('guild.db');

export async function updateWeeklyChallenges() {
  if (!config.guild.weeklyChallenges.name) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle(`This week's challenge has not been set yet.`);
    const weeklyChallengesMessage = messages.weeklyChallenges as Message;
    await weeklyChallengesMessage.edit({
      embeds: [embed]
    });
    return;
  }

  const members = db
    .prepare('SELECT * FROM weeklyChallenges')
    .all()
    .map((member: unknown) => member as WeeklyChallengeMember);

  for (let i = 0; i < members.length; i++) {
    const playerRawResponse = await fetchPlayerRaw(members[i].uuid);
    let current;
    if (!playerRawResponse.success) {
      current = 0;
    } else {
      current = playerRawResponse.player;
      for (const obj of config.guild.weeklyChallenges.stat) {
        current = current[obj] as any;
      }
    }
    db.prepare('UPDATE weeklyChallenges SET current = ? WHERE uuid = ?').run(current, members[i].uuid);
    members[i].difference = current - members[i].initial;
  }

  members.sort((a, b) => {
    if (a.difference !== undefined && b.difference !== undefined) {
      if (a.difference !== b.difference) {
        return b.difference - a.difference;
      }
      return b.initial - a.initial;
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
      } before <t:${Math.floor(time / 1000)}:F>\n${config.emojis.bullet} **Reward:** \`${formatNumber(
        config.guild.weeklyChallenges.reward
      )}\` Points\n\n${dividers(26)}\n\n**Participants:**\n${participants}`
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

export async function resetWeeklyChallenges(client: Client) {
  cron.schedule('50 11 * * 0', async () => {
    const members = db.prepare('SELECT * FROM weeklyChallenges').all() as WeeklyChallengeMember[];
    let winners = '';

    for (const member of members) {
      member.difference = member.current - member.initial;
    }

    members.sort((a, b) => {
      if (a.difference !== undefined && b.difference !== undefined) {
        if (a.difference !== b.difference) {
          return b.difference - a.difference;
        }
        return b.initial - a.initial;
      }
      return 0;
    });

    let count = 1;
    for (const member of members) {
      if (member.difference! >= config.guild.weeklyChallenges.req) {
        db.prepare('UPDATE guildMembers SET points = points + 25 WHERE uuid = ?').run(member.uuid);
        winners += `\n${count}. **${await uuidToName(member.uuid)}** - \`${formatNumber(member.difference!)}\``;
        count++;
      }
    }

    const now = new Date();
    const prevWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });

    const today = new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle(`${prevWeek} - ${today} Weekly Challenge`)
      .setDescription(
        `**Congrats to the following members on completing the weekly challenge!**\n${
          config.emojis.bullet
        } Get \`${formatNumber(config.guild.weeklyChallenges.req)}\` ${
          config.guild.weeklyChallenges.name
        } before <t:${Math.floor(new Date().getTime() / 1000)}:F>\n${config.emojis.bullet} **Reward:** \`${formatNumber(
          config.guild.weeklyChallenges.reward
        )}\` Points\n${config.emojis.bullet} **Participants:** \`${members.length}\`\n\n${dividers(
          26
        )}\n\n**Winners:**\n${winners}`
      );

    const weeklyChallengesMessage = messages.weeklyChallenges as Message;
    await weeklyChallengesMessage.edit({
      embeds: [embed],
      components: []
    });

    const weeklyChallengesChannel = client.channels.cache.get(config.messages.weeklyChallenges[0]) as TextChannel;
    const message = await weeklyChallengesChannel.send({ embeds: [embed] });
    config.messages.weeklyChallenges[1] = message.id;
    config.guild.weeklyChallenges.name = '';
    db.prepare('DELETE FROM weeklyChallenges').run();
    fs.writeFile('./config.json', JSON.stringify(config, null, 2), () => {});
    messages.weeklyChallenges = message;
    updateWeeklyChallenges();
  });
}

export function weeklyChallengesInterval(client: Client) {
  resetWeeklyChallenges(client);
  setInterval(() => {
    updateWeeklyChallenges();
  }, 1 * 60 * 1000);
}
