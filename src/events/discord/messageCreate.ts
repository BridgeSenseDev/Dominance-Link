import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Message } from 'discord.js';
import Database from 'better-sqlite3';
import { google } from 'googleapis';
import { addXp, discordToUuid, formatMentions, uuidToName } from '../../helper/utils.js';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { textChannels } from './ready.js';
import { roles } from '../../helper/constants.js';
import { HypixelGuildMember, NumberObject } from '../../types/global.d.js';

const db = new Database('guild.db');

async function checkProfanity(message: string) {
  const limits: NumberObject = {
    TOXICITY: 0.7,
    SEVERE_TOXICITY: 0.5,
    IDENTITY_ATTACK: 0.6,
    INSULT: 0.8,
    PROFANITY: 0.7,
    THREAT: 0.8,
    SEXUALLY_EXPLICIT: 0.8,
    OBSCENE: 0.8
  };

  message = message.replace(/\*([^*]+)\*/g, '$1');
  message = message.replace(/_([^_]+)_/g, '$1');
  message = message.replace(/\*\*([^*]+)\*\*/g, '$1');
  message = message.replace(/__([^_]+)__/g, '$1');
  message = message.replace(/\|\|([^|]+)\|\|/g, '$1');
  message = message.replace(/~([^~]+)~/g, '$1');
  message = message.replace(/~~([^~]+)~~/g, '$1');
  message = message.replace(/`([^`]+)`/g, '$1');
  message = message.replace(/```([^`]+)```/g, '$1');
  message = message.replace(/:([^:]+):/g, '$1');

  const client = (await google.discoverAPI(
    'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1'
  )) as any;

  const analyzeRequest = {
    comment: {
      text: message
    },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
      SEXUALLY_EXPLICIT: {}
    }
  };

  const analyzeRequestNotEn = {
    comment: {
      text: message
    },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {}
    }
  };

  let response;
  try {
    response = await client.comments.analyze({
      key: config.keys.googleCloud,
      resource: analyzeRequest
    });
  } catch (e) {
    try {
      response = await client.comments.analyze({
        key: config.keys.googleCloud,
        resource: analyzeRequestNotEn
      });
    } catch (err) {
      return false;
    }
  }

  const { attributeScores } = response.data;
  for (const attribute in attributeScores) {
    if (attributeScores[attribute].summaryScore.value > limits[attribute]) {
      return true;
    }
  }

  return false;
}

export default async function execute(client: Client, message: Message) {
  const { guildId, author, content, channel, member } = message;
  if (guildId !== '242357942664429568' || author.bot) return;
  addXp(author.id);

  if (content.toLowerCase().includes('dominance')) {
    await message.react(':dominance:1060579574347472946');
  }

  if (channel.id === textChannels.chatLogs.id) {
    await chat(message.content);
  }

  if (![textChannels.minecraftLink.id, textChannels.officerChat.id].includes(channel.id)) return;

  const uuid = discordToUuid(author.id);
  let user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(author.id) as HypixelGuildMember;

  if (!user) {
    if (!uuid) {
      await member!.roles.add(member!.guild.roles.cache.get(roles.unverified)!);
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> <@${author.id}> Please verify first in <#907911357582704640>`);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (member?.roles.cache.has(roles.Break)) {
      if (await checkProfanity(content)) {
        try {
          await message.member!.timeout(12 * 60 * 60 * 1000);
        } catch (e) {
          /* empty */
        }
        const timestamp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
          .setDescription(`**<@${author.id}> has been timed out until <t:${timestamp}:f>**\n**Message: **${content}`);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('removeTimeout')
            .setLabel('Remove Timeout')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(':three_oclock_3d:1029704628310388796')
        );
        await textChannels.automod.send({ embeds: [embed], components: [row] });
        return;
      }

      const messageContent = (await formatMentions(client, message))!.replace(/\n/g, '').replace(/[^\x00-\x7F]/g, '*');
      const name = await uuidToName(uuid!);
      const messageLength = `/gc ${name} [Break]: ${messageContent}`.length;

      if (messageLength > 256) {
        await textChannels.minecraftLink.send(`Character limit exceeded (${messageLength})`);
        return;
      }

      await chat(`/gc ${name} [Break]: ${messageContent}`);
      await message.delete();
      return;
    }

    db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(author.id, uuid);
    user = db.prepare('SELECT uuid, tag FROM guildMembers WHERE discord = ?').get(author.id) as HypixelGuildMember;
  }

  const messageContent = (await formatMentions(client, message))!.replace(/\n/g, '').replace(/[^\x00-\x7F]/g, '*');
  const messageLength = `/gc ${await uuidToName(user.uuid)} ${user.tag}: ${messageContent}`.length;

  if (channel.id === textChannels.minecraftLink.id) {
    if (await checkProfanity(content)) {
      try {
        await message.member!.timeout(12 * 60 * 60 * 1000);
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
          .setDescription(
            `**You have been timed out for 12 hours. A staff member will review this as soon as possible**`
          );
        await channel.send({ content: `<@${author.id}>>`, embeds: [embed] });
      } catch (e) {
        /* empty */
      }
      const timestamp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
        .setDescription(`**<@${author.id}> has been timed out until <t:${timestamp}:f>**\n**Message: **${content}`);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('removeTimeout')
          .setLabel('Remove Timeout')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(':three_oclock_3d:1029704628310388796')
      );
      await textChannels.automod.send({ embeds: [embed], components: [row] });
      return;
    }

    if (messageLength > 256) {
      await textChannels.minecraftLink.send(`Character limit exceeded (${messageLength})`);
      return;
    }

    await chat(`/gc ${await uuidToName(user.uuid)} ${user.tag}: ${messageContent}`);
    await message.delete();
  } else if (channel.id === textChannels.officerChat.id) {
    if (await checkProfanity(content)) {
      try {
        await message.member!.timeout(12 * 60 * 60 * 1000);
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
          .setDescription(
            `**You have been timed out for 12 hours. A staff member will review this as soon as possible**`
          );
        await channel.send({ content: `<@${author.id}>>`, embeds: [embed] });
      } catch (e) {
        /* empty */
      }
      const timestamp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
        .setDescription(`**<@${author.id}> has been timed out until <t:${timestamp}:f>**\n**Message: **${content}`);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('removeTimeout')
          .setLabel('Remove Timeout')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(':three_oclock_3d:1029704628310388796')
      );
      await textChannels.automod.send({ embeds: [embed], components: [row] });
      return;
    }

    if (messageLength > 256) {
      await textChannels.minecraftLink.send(`Character limit exceeded (${messageLength})`);
      return;
    }

    await chat(`/oc ${await uuidToName(user.uuid)} ${user.tag}: ${messageContent}`);
    await message.delete();
  } else if (channel.id === textChannels.chatLogs.id) {
    await chat(messageContent);
  }

  db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
}
