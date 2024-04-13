import Database from "better-sqlite3";
import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  type TextChannel,
  type ThreadChannel,
} from "discord.js";
import config from "../config.json" assert { type: "json" };
import { chat, waitForMessage } from "../handlers/workerHandler.js";
import {
  discordToUuid,
  getMemberRejoinChannel,
  isStaff,
  nameToUuid,
} from "../helper/clientUtils.js";
import messageToImage from "../helper/messageToImage.js";

const db = new Database("guild.db");
db.defaultSafeIntegers(true);

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
  chat(`/g invite ${name}`);

  const receivedMessage = await waitForMessage(
    [
      "to your guild. They have 5 minutes to accept.",
      "You cannot invite this player to your guild!",
      "They will have 5 minutes to accept once they come online!",
      "is already in another guild!",
      "is already in your guild!",
      "to your guild! Wait for them to accept!",
      `Can't find a player by the name of '${name}'`,
    ],
    5000,
  );

  let channel: TextChannel | ThreadChannel | undefined;
  let mention: string | undefined;
  if (name) {
    const uuid = await nameToUuid(name);
    if (uuid) {
      ({ channel, mention } = getMemberRejoinChannel(uuid));
    }
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
