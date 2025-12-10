import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  type TextChannel,
  type ThreadChannel,
} from "discord.js";
import config from "../config.json";
import {
  discordToUuid,
  getMemberRejoinChannel,
  isStaff,
  nameToUuid,
} from "../helper/clientUtils.js";
import messageToImage from "../helper/messageToImage.js";
import { handleGuildInvite } from "../helper/utils.js";

export const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Invites the given user to the guild.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Minecraft Username")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!(await isStaff(discordToUuid(interaction.user.id) ?? ""))) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} You do not have permission to use this command`,
      );
    return interaction.editReply({ embeds: [embed] });
  }

  const name = interaction.options.getString("name");
  if (!name) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(`${config.emojis.aCross} No name provided.`);
    return interaction.editReply({ embeds: [embed] });
  }

  const receivedMessage = await handleGuildInvite(name, true);

  let channel: TextChannel | ThreadChannel | undefined;
  let mention: string | undefined;
  const uuid = await nameToUuid(name);
  if (uuid) {
    ({ channel, mention } = getMemberRejoinChannel(uuid));
  }

  if (!receivedMessage) {
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle("Caution")
        .setDescription(`${config.emojis.aCross} Guild invite timed out.`);
      await channel.send({ content: mention, embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Caution")
      .setDescription(`${config.emojis.aCross} Guild invite timed out.`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (channel) {
    await channel.send({
      content: mention,
      files: [
        await messageToImage(
          `§b-------------------------------------------------------------§r ${receivedMessage.motd} §b-------------------------------------------------------------`,
        ),
      ],
    });
  }

  await interaction.editReply({
    files: [
      await messageToImage(
        `§b-------------------------------------------------------------§r ${receivedMessage.motd} §b-------------------------------------------------------------`,
      ),
    ],
  });
}
