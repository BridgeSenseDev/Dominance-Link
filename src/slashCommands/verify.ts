import Database from "better-sqlite3";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  type Role,
  SlashCommandBuilder,
  type User,
} from "discord.js";
import config from "../config.json" assert { type: "json" };
import { createMember, fetchMember } from "../handlers/databaseHandler.js";
import { generateHeadUrl, nameToUuid } from "../helper/clientUtils.js";
import { hypixel } from "../index.js";

const db = new Database("guild.db");

export const data = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Manually verify a member")
  .addStringOption((option) =>
    option
      .setName("ign")
      .setDescription("IGN / UUID of member")
      .setRequired(true),
  )
  .addUserOption((option) =>
    option
      .setName("discord")
      .setDescription("Discord Member")
      .setRequired(true),
  );

async function verify(
  interaction: ChatInputCommandInteraction,
  ign: string,
  discordUser: User,
): Promise<EmbedBuilder | undefined> {
  const discordMember = await interaction.guild?.members.fetch(discordUser.id);
  if (!discordMember) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} ${discordUser} is not in the discord server`,
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const uuid = await nameToUuid(ign);
  if (!uuid) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} [${ign}](https://mcuuid.net/?q=${ign}) does not exist`,
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const player = await hypixel.getPlayer(uuid);
  const name = player.nickname;
  if (!player) {
    return new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Caution")
      .setDescription(
        `${config.emojis.warning3d} Hypixel API request for **\`${name}\`**'s discord tag failed\n\nAre you **CERTAIN\
        ** \`${name}\`'s discord account is ${discordUser}?`,
      );
  }

  let member = fetchMember(uuid);
  if (member) {
    return new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Caution")
      .setDescription(
        `${config.emojis.warning3d} **\`${name}\`** is already verified to the discord account <@${member.discord}>\n\
				Are you **CERTAIN** you want to replace <@${member.discord}> with ${discordUser}?`,
      );
  }

  member = fetchMember(discordUser.id);
  if (member) {
    return new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Caution")
      .setDescription(
        `${config.emojis.warning3d} ${discordUser} is already verified to [this](https://namemc.com/search?q=${member.uuid}) ` +
          `minecraft account\n\nAre you **CERTAIN** you want to replace [this](https://namemc.com/search?q=${member.uuid}) account with [this](https://namemc.com/search?q=${uuid}) account?`,
      );
  }

  const discord = player.socialMedia.find(
    (media) => media.name === "Discord",
  )?.link;

  if (!discord) {
    return new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Caution")
      .setDescription(
        `${config.emojis.warning3d} **\`${name}\`** doesn't have a discord linked on hypixel\n\nAre you **CERTAIN** that \`${name}\`'s ` +
          `discord account is ${discordUser}?`,
      );
  }

  if (discord === discordUser.tag) {
    await createMember(discordMember, uuid);

    const { displayName } = discordMember;
    if (!displayName.toUpperCase().includes(name.toUpperCase())) {
      if (/\(.*?\)/.test(displayName.split(" ")[1])) {
        await discordMember.setNickname(
          displayName.replace(displayName.split(" ")[0], name),
        );
      } else {
        await discordMember.setNickname(name);
      }
    } else if (!displayName.includes(name)) {
      await discordMember.setNickname(
        displayName.replace(new RegExp(name, "gi"), name),
      );
    }

    const guild = await hypixel.getGuild("player", uuid, {});

    if (!guild || guild.name.toLowerCase() !== "dominance") {
      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle("Verification Successful")
        .setDescription(
          `${config.emojis.aTick} **\`${name}\`** is not in Dominance\n${config.emojis.add}\
              Added: <@&445669382539051008>\n${config.emojis.minus} Removed: <@&${config.roles.unverified}>`,
        )
        .setThumbnail(generateHeadUrl(uuid, name));
      await interaction.editReply({ embeds: [embed] });
    } else {
      await discordMember.roles.add(
        interaction.guild?.roles.cache.get(config.roles.slayer) as Role,
      );
      db.prepare("UPDATE guildMembers SET discord = ? WHERE uuid = ?").run(
        discordUser.id,
        uuid,
      );
      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle("Verification Successful")
        .setDescription(
          `${config.emojis.aTick} **\`${name}\`** is in Dominance\n${config.emojis.add} Added: <@&445669382539051008>, ` +
            `<@&1031926129822539786>\n${config.emojis.minus} Removed: <@&${config.roles.unverified}>`,
        )
        .setThumbnail(generateHeadUrl(uuid, name));
      await interaction.editReply({ embeds: [embed] });
    }
  } else {
    return new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Caution")
      .setDescription(
        `${config.emojis.warning3d} \`${name}\` has the discord name **${discord}** on hypixel\nIt does not match ` +
          `their discord name **${discordUser.tag}**\n\nAre you **CERTAIN** \`${name}\`'s discord account is ${discordUser}?`,
      );
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!config.admins.includes(interaction.member?.user.id ?? "")) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} You do not have permission to use this command`,
      );
    return interaction.editReply({ embeds: [embed] });
  }

  const ign = interaction.options.getString("ign");
  const discordUser = interaction.options.getUser("discord");

  if (!discordUser) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("Error")
      .setDescription(
        `${config.emojis.aCross} Failed to get passed in discord user`,
      );
    return interaction.editReply({ embeds: [embed] });
  }

  const verifyErrorEmbed = await verify(interaction, ign ?? "", discordUser);

  if (verifyErrorEmbed) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("confirmVerification")
        .setStyle(ButtonStyle.Success)
        .setLabel("Confirm")
        .setEmoji(config.emojis.aCheckmark),
      new ButtonBuilder()
        .setCustomId("denyVerification")
        .setStyle(ButtonStyle.Danger)
        .setLabel("Deny")
        .setEmoji(config.emojis.aCross),
    );

    const message = await interaction.editReply({
      embeds: [verifyErrorEmbed],
      components: [row],
    });
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60 * 1000,
    });

    collector.on("collect", async (collectorInteraction) => {
      if (collectorInteraction.customId === "confirmVerification") {
        await collectorInteraction.deferReply();

        const playerData = (
          await (
            await fetch(`https://playerdb.co/api/player/minecraft/${ign}`)
          ).json()
        ).data.player;
        const uuid = playerData.raw_id;
        const name = playerData.username;
        const discordMember = await interaction.guild?.members.fetch(
          discordUser.id,
        );

        if (discordMember) {
          await createMember(discordMember, uuid);
        }

        const embed = new EmbedBuilder()
          .setColor(config.colors.green)
          .setTitle(`${discordUser.tag} has been manually verified`)
          .setDescription(
            `${discordUser} has been manually verified to the minecraft account \`${name}\` and their roles has been updated\n\nIf they are a guild member, they should be added to the guild members database soon and given the member role`,
          );
        await collectorInteraction.editReply({ embeds: [embed] });
      } else if (collectorInteraction.customId === "denyVerification") {
        await collectorInteraction.deferReply();

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle(
            `${discordUser.tag}'s manual verification has been cancelled`,
          );
        await collectorInteraction.editReply({ embeds: [embed] });
      }
    });
  }
}
