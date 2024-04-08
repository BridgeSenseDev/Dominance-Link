import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel, ThreadChannel } from 'discord.js';
import Database from 'better-sqlite3';
import { chat, waitForMessage } from '../handlers/workerHandler.js';
import messageToImage from '../helper/messageToImage.js';
import config from '../config.json' assert { type: 'json' };
import { discordToUuid, isStaff } from '../helper/utils.js';
import client from '../index.js';
import { WaitlistMember, BreakMember } from '../types/global.js';

const db = new Database('guild.db');
db.defaultSafeIntegers(true);

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Invites the given user to the guild.')
  .addStringOption((option) => option.setName('name').setDescription('Minecraft Username').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!(await isStaff(discordToUuid(interaction.user.id) ?? ''))) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`${config.emojis.aCross} You do not have permission to use this command`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  const name = interaction.options.getString('name');
  chat(`/g invite ${name}`);

  const receivedMessage = await waitForMessage(
    [
      'to your guild. They have 5 minutes to accept.',
      'You cannot invite this player to your guild!',
      'They will have 5 minutes to accept once they come online!',
      'is already in another guild!',
      'is already in your guild!',
      'to your guild! Wait for them to accept!',
      `Can't find a player by the name of '${name}'`
    ],
    5000
  );

  const waitlist = db.prepare('SELECT discord, channel FROM waitlist WHERE uuid = ?').get(name) as WaitlistMember;
  const breaks = db.prepare('SELECT discord, thread FROM breaks WHERE uuid = ?').get(name) as BreakMember;
  let channel;
  let content;
  if (waitlist) {
    channel = client.channels.cache.get(waitlist.channel) as TextChannel;
    content = `<@${waitlist.discord}>`;
  } else if (breaks) {
    channel = client.channels.cache.get(breaks.thread) as ThreadChannel;
    content = `<@${breaks.discord}>`;
  }

  if (!receivedMessage) {
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle('Caution')
        .setDescription(`${config.emojis.aCross} Guild invite timed out.`);
      await channel.send({ content, embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Caution')
      .setDescription(`${config.emojis.aCross} Guild invite timed out.`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (channel) {
    await channel.send({
      content,
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${receivedMessage.motd} §b-------------------------------------------------------------`
        )
      ]
    });
  }

  await interaction.editReply({
    files: [
      await messageToImage(
        `§b-------------------------------------------------------------§r ${receivedMessage.motd} §b-------------------------------------------------------------`
      )
    ]
  });
}
