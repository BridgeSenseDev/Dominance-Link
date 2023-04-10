import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Message } from 'discord.js';
import Database from 'better-sqlite3';
import { addXp, discordToUuid, formatMentions, getProxy, uuidToName } from '../../helper/utils.js';
import config from '../../config.json' assert { type: 'json' };
import { chat } from '../../handlers/workerHandler.js';
import { channels } from './ready.js';
import { roles } from '../../helper/constants.js';
import { HypixelGuildMember } from '../../types/global.d.js';

const db = new Database('guild.db');

async function checkProfanity(message: string) {
  const agent = getProxy();
  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.keys.openAi}`
    },
    body: JSON.stringify({ input: message, model: 'text-moderation-latest' }),
    agent
  } as any);
  const { results } = await response.json();
  return results[0].flagged;
}

export default async function execute(client: Client, message: Message) {
  const { guildId, author, content, channel, member } = message;
  if (guildId !== '242357942664429568' || author.bot) return;
  addXp(author.id);

  if (content.toLowerCase().includes('dominance')) {
    await message.react(':dominance:1060579574347472946');
  }

  if (channel.id === channels.chatLogs.id) {
    await chat(message.content);
  }

  if (![channels.minecraftLink.id, channels.officerChat.id].includes(channel.id)) return;

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
          .setTitle(`AutoMod has blocked a message in <#${channels.minecraftLink.id}>`)
          .setDescription(`**<@${author.id}> has been timed out until <t:${timestamp}:f>**\n**Message: **${content}`);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('removeTimeout')
            .setLabel('Remove Timeout')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(':three_oclock_3d:1029704628310388796')
        );
        await channels.automod.send({ embeds: [embed], components: [row] });
        return;
      }

      const messageContent = (await formatMentions(client, message))!.replace(/\n/g, '').replace(/[^\x00-\x7F]/g, '*');
      const name = await uuidToName(uuid!);
      const messageLength = `/gc ${name} [Break]: ${messageContent}`.length;

      if (messageLength > 256) {
        await channels.minecraftLink.send(`Character limit exceeded (${messageLength})`);
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

  if (channel.id === channels.minecraftLink.id) {
    if (await checkProfanity(content)) {
      try {
        await message.member!.timeout(12 * 60 * 60 * 1000);
      } catch (e) {
        /* empty */
      }
      const timestamp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle(`AutoMod has blocked a message in <#${channels.minecraftLink.id}>`)
        .setDescription(`**<@${author.id}> has been timed out until <t:${timestamp}:f>**\n**Message: **${content}`);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('removeTimeout')
          .setLabel('Remove Timeout')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(':three_oclock_3d:1029704628310388796')
      );
      await channels.automod.send({ embeds: [embed], components: [row] });
      return;
    }

    if (messageLength > 256) {
      await channels.minecraftLink.send(`Character limit exceeded (${messageLength})`);
      return;
    }

    await chat(`/gc ${await uuidToName(user.uuid)} ${user.tag}: ${messageContent}`);
    await message.delete();
  } else if (channel.id === channels.officerChat.id) {
    if (await checkProfanity(content)) {
      try {
        await message.member!.timeout(12 * 60 * 60 * 1000);
      } catch (e) {
        /* empty */
      }
      const timestamp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle(`AutoMod has blocked a message in <#${channels.minecraftLink.id}>`)
        .setDescription(`**<@${author.id}> has been timed out until <t:${timestamp}:f>**\n**Message: **${content}`);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('removeTimeout')
          .setLabel('Remove Timeout')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(':three_oclock_3d:1029704628310388796')
      );
      await channels.automod.send({ embeds: [embed], components: [row] });
      return;
    }

    if (messageLength > 256) {
      await channels.minecraftLink.send(`Character limit exceeded (${messageLength})`);
      return;
    }

    await chat(`/oc ${await uuidToName(user.uuid)} ${user.tag}: ${messageContent}`);
    await message.delete();
  } else if (channel.id === channels.chatLogs.id) {
    await chat(messageContent);
  }

  db.prepare('UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)').run(uuid);
}
