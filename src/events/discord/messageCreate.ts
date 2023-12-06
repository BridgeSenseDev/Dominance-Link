import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Message, TextChannel } from 'discord.js';
import Database from 'better-sqlite3';
import { google } from 'googleapis';
import Mexp from 'math-expression-evaluator';
import { addXp, discordToUuid, formatMentions, uuidToName } from '../../helper/utils.js';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { textChannels } from './ready.js';
import { discordRoles } from '../../helper/constants.js';
import { Count, NumberObject } from '../../types/global.d.js';
import { fetchGuildMember } from '../../handlers/databaseHandler.js';

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

  if (/(?:\d{1,3}\.){2,3}\d{1,3}/g.test(message)) {
    return true;
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

  if (channel.id === textChannels.counting.id) {
    const expression = content.split(' ')[0];
    try {
      const count = new Mexp().eval(expression, [], {});
      if (count) {
        const currentCount = db.prepare('SELECT * FROM counting ORDER BY count DESC LIMIT 1').get() as Count;
        if (currentCount.count + 1 === count && currentCount.discord !== author.id) {
          await message.react('a:atick:986173414723162113');
          db.prepare('INSERT INTO counting (count, discord) VALUES (?, ?)').run(count, author.id);
        } else {
          await message.react('a:across:986170696512204820');
        }
      }
    } catch (e) {
      await message.react('a:across:986170696512204820');
    }
  }

  if (![textChannels.minecraftLink.id, textChannels.officerChat.id].includes(channel.id)) return;

  const uuid = discordToUuid(author.id);
  let user = fetchGuildMember(author.id);

  const messageContent = (await formatMentions(client, message))!.replace(/\n/g, '').replace(/[^\x00-\x7F]/g, '*');
  let tag;

  if (!user) {
    if (!uuid) {
      await member!.roles.add(member!.guild.roles.cache.get(discordRoles.unverified)!);
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> <@${author.id}> Please verify first in <#907911357582704640>`);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (member?.roles.cache.has(discordRoles.Break)) {
      tag = '[Break]';
    }

    db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(author.id, uuid);
    user = fetchGuildMember(author.id);
  } else {
    tag = user.tag;
  }

  const name = await uuidToName(uuid!);
  const messageLength = `/gc ${name} ${user!.tag}: ${messageContent}`.length;

  // Automod
  if (await checkProfanity(content)) {
    try {
      await (channel as TextChannel).permissionOverwrites.edit(member!, {
        SendMessages: false
      });
    } catch (e) {
      /* empty */
    }

    let embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
      .setDescription(
        `<@${author.id}> has been muted from <#${textChannels.minecraftLink.id}>.\nThis mute will be reviewed by staff ASAP.`
      );

    await message.reply({ embeds: [embed] });

    embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle(`AutoMod has blocked a message in <#${textChannels.minecraftLink.id}>`)
      .setDescription(
        `**<@${author.id}> has been muted from <#${textChannels.minecraftLink.id}>.**\n**Message: **${content}`
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('removeMute')
        .setLabel('Remove Mute')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(':three_oclock_3d:1029704628310388796')
    );

    await textChannels.automod.send({ embeds: [embed], components: [row] });
    return;
  }

  if (messageLength > 256) {
    await message.reply(`Character limit exceeded (${messageLength})`);
    return;
  }

  if (channel.id === textChannels.minecraftLink.id) {
    await chat(`/gc ${name} ${tag}: ${messageContent}`);
  } else if (channel.id === textChannels.officerChat.id) {
    await chat(`/oc ${name} ${tag}: ${messageContent}`);
  }

  await message.delete();

  db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
}
