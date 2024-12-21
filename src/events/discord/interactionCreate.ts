import Database from "bun:sqlite";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type Client,
  ComponentType,
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type Interaction,
  ModalBuilder,
  type Role,
  StringSelectMenuBuilder,
  type TextChannel,
  TextInputBuilder,
  TextInputStyle,
  type ThreadChannel,
} from "discord.js";
import config from "../../config.json" with { type: "json" };
import {
  archiveMember,
  createMember,
  fetchGuildMember,
  fetchMember,
} from "../../handlers/databaseHandler.js";
import { chat, waitForMessage } from "../../handlers/workerHandler.ts";
import { hypixelApiErrorEmbed } from "../../helper/clientUtils.js";
import {
  abbreviateNumber,
  discordToUuid,
  formatNumber,
  generateHeadUrl,
  getDaysInGuild,
  nameToUuid,
  removeSectionSymbols,
  uuidToName,
} from "../../helper/clientUtils.js";
import { bullet, dividers } from "../../helper/constants.js";
import {
  getLbEmbedForPage,
  getMemberLeaderboardPage,
} from "../../helper/leaderboards.ts";
import pagination from "../../helper/pagination.ts";
import requirementsEmbed from "../../helper/requirements.js";
import {
  camelCaseToWords,
  generateGuildAnnouncement,
} from "../../helper/utils.ts";
import { hypixel } from "../../index.js";
import type { BreakMember } from "../../types/global";
import { textChannels } from "./ready.js";

const db = new Database("guild.db");

export default async function execute(
  client: Client,
  interaction: Interaction,
) {
  const member = interaction.member as GuildMember;
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isAutocomplete()) {
    const rows = db
      .prepare("SELECT nameColor FROM guildMembers ORDER BY weeklyGexp DESC")
      .all() as { nameColor: string }[];

    const nameColorArray = rows.map((row) => row.nameColor);

    const choices: string[] = nameColorArray
      .filter(Boolean)
      .map(
        (nameColor) =>
          removeSectionSymbols(nameColor).split(" ")[
            nameColor.split(" ").length - 1
          ],
      );

    const focusedValue = interaction.options.getFocused();
    const filtered = choices
      .filter((choice) =>
        choice.toLowerCase().startsWith(focusedValue.toLowerCase()),
      )
      .slice(0, 25);
    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice })),
    );
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith("baseDays")) {
      if (!config.admins.includes(interaction.member?.user.id ?? "")) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(
            `${config.emojis.aCross} You do not have permission to use this`,
          );
        return interaction.editReply({ embeds: [embed] });
      }

      const uuidPattern = /baseDays(\w+)/;
      const match = interaction.customId.match(uuidPattern);
      const extractedUuid = match ? match[1] : "";

      if (!extractedUuid) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(`${config.emojis.aCross} Failed to extract uuid`);
        return interaction.editReply({ embeds: [embed] });
      }

      const modal = new ModalBuilder()
        .setCustomId(`setBaseDays${extractedUuid}`)
        .setTitle("Set Base Days");
      const name = new TextInputBuilder()
        .setCustomId("baseDaysInput")
        .setLabel("Previous amount of days in guild")
        .setStyle(TextInputStyle.Short);
      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(name);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId.endsWith("LbLeftPage")) {
      await interaction.deferReply({ ephemeral: true });
      const lbName = interaction.customId.split("LbLeftPage")[0];
      const totalPages =
        Math.floor(
          (
            db.prepare("SELECT COUNT(*) AS total FROM guildMembers").get() as {
              total: number;
            }
          ).total / 10,
        ) + 1;
      await pagination(
        totalPages - 1,
        lbName,
        interaction,
        getLbEmbedForPage,
        totalPages,
      );
    } else if (interaction.customId.endsWith("LbRightPage")) {
      await interaction.deferReply({ ephemeral: true });
      const lbName = interaction.customId.split("LbRightPage")[0];
      const totalPages =
        Math.floor(
          (
            db.prepare("SELECT COUNT(*) AS total FROM guildMembers").get() as {
              total: number;
            }
          ).total / 10,
        ) + 1;
      await pagination(1, lbName, interaction, getLbEmbedForPage, totalPages);
    } else if (interaction.customId.endsWith("LbSearch")) {
      const lbName = interaction.customId.split("LbSearch")[0];

      const uuid = discordToUuid(interaction.user.id);
      if (!uuid) {
        await member.roles.add(
          interaction.guild?.roles.cache.get(config.roles.unverified) as Role,
        );
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription("Please verify first in <#1031568019522072677>");
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      let username = "";
      if (db.prepare("SELECT * FROM guildMembers WHERE uuid = ?").get(uuid)) {
        username = (await uuidToName(uuid)) ?? "";
      }

      const modal = new ModalBuilder()
        .setCustomId(`${lbName}LbSearchModal`)
        .setTitle(`${camelCaseToWords(lbName)} LB Search`);
      const name = new TextInputBuilder()
        .setCustomId("name")
        .setLabel("THE MINECRAFT USERNAME OF A GUILD MEMBER")
        .setValue(username ?? "")
        .setStyle(TextInputStyle.Short);
      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(name);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId in config.autoRoles) {
      const roleId =
        config.autoRoles[interaction.customId as keyof typeof config.autoRoles];
      let msg: string;
      await interaction.deferReply({ ephemeral: true });
      if (member.roles.resolve(roleId)) {
        await member.roles.remove(roleId);
        msg = `${config.emojis.minus} <@&${roleId}>`;
      } else {
        await member.roles.add(roleId);
        msg = `${config.emojis.add} <@&${roleId}>`;
      }
      await interaction.editReply({ content: msg });
    } else if (interaction.customId === "requirements") {
      const uuid = discordToUuid(interaction.user.id);
      await interaction.deferReply({ ephemeral: true });
      if (!uuid) {
        await member.roles.add(
          interaction.guild?.roles.cache.get(config.roles.unverified) as Role,
        );
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription("Please verify first in <#1031568019522072677>");
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const playerResponse = await hypixel.getPlayer(uuid).catch(async (e) => {
        await interaction.editReply(hypixelApiErrorEmbed(e.message));
      });

      if (!playerResponse) return;

      const requirementData = await requirementsEmbed(uuid, playerResponse);
      let color: number;
      if (requirementData.reqs === 2) {
        color = config.colors.green;
      } else if (requirementData.reqs === 1) {
        color = config.colors.yellow;
      } else {
        color = config.colors.red;
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: requirementData.author, iconURL: config.guild.icon })
        .setDescription(requirementData.embed)
        .setThumbnail(generateHeadUrl(uuid, playerResponse.nickname));
      await interaction.editReply({ embeds: [embed] });
    } else if (interaction.customId === "verify") {
      const modal = new ModalBuilder()
        .setCustomId("verification")
        .setTitle("Verification");
      const name = new TextInputBuilder()
        .setCustomId("verificationInput")
        .setLabel("PLEASE ENTER YOUR MINECRAFT USERNAME")
        .setStyle(TextInputStyle.Short);
      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(name);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId === "unVerify") {
      await interaction.deferReply({ ephemeral: true });

      const memberData = fetchMember(interaction.user.id);

      if (!memberData) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setDescription(
            `${config.emojis.aCross} <@${interaction.user.id}> is already unverified`,
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      await archiveMember(member);

      const embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setDescription(
          `${config.emojis.aTick} <@${interaction.user.id}> has been successfully unverified`,
        );
      await interaction.editReply({ embeds: [embed] });
    } else if (interaction.customId === "apply") {
      const uuid = discordToUuid(interaction.user.id);
      if (!uuid) {
        await member.roles.add(
          interaction.guild?.roles.cache.get(config.roles.unverified) as Role,
        );
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription("Please verify first in <#1031568019522072677>");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      const modal = new ModalBuilder()
        .setCustomId("applications")
        .setTitle("Dominance Application");
      const q1Input = new TextInputBuilder()
        .setCustomId("q1Input")
        .setLabel("What games do you main / have good stats in?")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100);
      const q2Input = new TextInputBuilder()
        .setCustomId("q2Input")
        .setLabel("Why should we accept you?")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000);
      const q3Input = new TextInputBuilder()
        .setCustomId("q3Input")
        .setLabel("Do you know anyone from the guild?")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(200);
      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(q1Input);
      const secondActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(q2Input);
      const thirdActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(q3Input);
      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId === "accept") {
      await interaction.deferReply({ ephemeral: true });

      const name = interaction.message.embeds[0].data.fields?.[0].value;
      const discordId =
        interaction.message.embeds[0].data.fields?.[3].value.slice(2, -1);

      if (!name) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(`${config.emojis.aCross} Failed to fetch uuid`);
        return interaction.editReply({ embeds: [embed] });
      }

      if (!discordId) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(
            `${config.emojis.aCross} Failed to extract discord ID`,
          );
        return interaction.editReply({ embeds: [embed] });
      }

      const uuid = await nameToUuid(name);
      const user = await client.users.fetch(discordId);
      (interaction.guild as Guild).channels
        .create({
          name: `⌛┃${name}`,
          type: ChannelType.GuildText,
          parent: "1020948893204217856",
        })
        .then(async (channel) => {
          await channel.permissionOverwrites.edit(user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
          const embed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle(`Congrats ${name}, your application has been accepted!`)
            .setDescription(
              `${bullet} **Accept your invite!**\nIf you are not currently in a guild and have your guild invites \
                enabled, you should have already received an invite.\n\n${bullet} **Didn't receive an invite?**\nYou \
                can request another invite by sending \`/g join ${config.minecraft.ign}\` in-game. Your join request \
                will be automatically accepted.\n\n${bullet} **Note**\nYou will not have access to Discord member \
                channels until you have accepted the in-game invite.n\nThis application will be closed. \
                <t:${Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60}:R> if you don't join the guild by then\n\n\
                ${bullet} **Confused?**\nFeel free to ask questions here!`,
            )
            .setThumbnail(generateHeadUrl(uuid ?? "", name));
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("closeApplication")
              .setStyle(ButtonStyle.Danger)
              .setLabel("Close Application")
              .setEmoji(config.emojis.locked3d),
          );
          db.prepare(
            "INSERT INTO waitlist (uuid, discord, time, channel) VALUES (?, ?, ?, ?)",
          ).run(uuid, discordId, Math.floor(Date.now() / 1000), channel.id);
          await channel.send({
            content: user.toString(),
            embeds: [embed],
            components: [row],
          });
          const applicationEmbed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle(`${name}'s application has been accepted`)
            .setDescription(
              interaction.message.embeds[0].data.description ?? "",
            )
            .addFields(
              {
                name: `${config.emojis.user} Accepted By`,
                value: interaction.user.toString(),
                inline: true,
              },
              {
                name: `${config.emojis.page} Meeting Reqs`,
                value:
                  interaction.message.embeds[0].data.fields?.[1].value ?? "",
                inline: true,
              },
              {
                name: ":shield: Guild: ",
                value:
                  interaction.message.embeds[0].data.fields?.[2].value ?? "",
                inline: true,
              },
            );
          await textChannels["applicationLogs"].send({
            embeds: [applicationEmbed],
          });
          await interaction.deleteReply();
          await interaction.message.delete();

          chat(`/g invite ${name}`);

          const receivedMessage = await waitForMessage(
            [
              "to your guild. They have 5 minutes to accept.",
              "You cannot invite this player to your guild!",
              "They will have 5 minutes to accept once they come online!",
              "is already in another guild!",
              "is already in your guild!",
              "to your guild! Wait for them to accept!",
            ],
            5000,
          );

          if (!receivedMessage) {
            chat(`/msg ${name} Guild invite failed.`);

            const embed = new EmbedBuilder()
              .setColor(config.colors.red)
              .setTitle("Caution")
              .setDescription(
                `${config.emojis.aCross} Guild invite timed out.`,
              );
            await channel.send({ content: user.toString(), embeds: [embed] });

            return;
          }

          chat(`/msg ${name} ${receivedMessage.string}`);

          await channel.send({
            content: user.toString(),
            files: [await generateGuildAnnouncement(receivedMessage.motd, "b")],
          });
        });
    } else if (interaction.customId === "deny") {
      const discordId =
        interaction.message.embeds[0].data.fields?.[3].value.slice(2, -1);

      if (!discordId) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(
            `${config.emojis.aCross} Failed to extract discord ID`,
          );
        return interaction.editReply({ embeds: [embed] });
      }

      const name = interaction.message.embeds[0].data.fields?.[0].value;
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(discordId)
          .setPlaceholder("Select a reason")
          .addOptions(
            {
              label: "Not meeting guild requirements",
              value: "Not meeting guild requirements",
            },
            {
              label: "Not writing enough on your application",
              value: "Not writing enough on your application",
            },
            {
              label: "Being a guild hopper",
              value: "Being a guild hopper",
            },
            {
              label: "Being a known hacker / cheater",
              value: "Being a known hacker / cheater",
            },
            {
              label: "Being toxic",
              value: "Being toxic",
            },
          ),
      );
      const message = await interaction.reply({
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60 * 1000,
      });

      collector.on("collect", async (collectorInteraction) => {
        if (collectorInteraction.isStringSelectMenu()) {
          await collectorInteraction.deferReply({ ephemeral: true });
          const user = await client.users.fetch(collectorInteraction.customId);
          const embed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle("Your Dominance application has been denied")
            .setDescription(`**Reason:** ${collectorInteraction.values}`);
          try {
            await user.send({ embeds: [embed] });
          } catch (e) {
            /* empty */
          }
          const applicationEmbed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle(`${name}'s application has been denied`)
            .setDescription(
              interaction.message.embeds[0].data.description ?? "",
            )
            .addFields(
              {
                name: `${config.emojis.user} Denied By`,
                value: interaction.user.toString(),
                inline: true,
              },
              {
                name: `${config.emojis.page} Meeting Reqs`,
                value:
                  interaction.message.embeds[0].data.fields?.[1].value ?? "",
                inline: true,
              },
              {
                name: `${config.emojis.clock} Application Made`,
                value:
                  interaction.message.embeds[0].data.fields?.[5].value ?? "",
                inline: true,
              },
            );
          await textChannels["applicationLogs"].send({
            embeds: [applicationEmbed],
          });
          await interaction.deleteReply();
          await interaction.message.delete();
          await collectorInteraction.deleteReply();
          collector.stop();
        }
      });
    } else if (interaction.customId === "break") {
      const modal = new ModalBuilder()
        .setCustomId("breakModal")
        .setTitle("Break Form");
      const q1Input = new TextInputBuilder()
        .setCustomId("q1Input")
        .setLabel("How long will you be inactive for?")
        .setStyle(TextInputStyle.Short);
      const q2Input = new TextInputBuilder()
        .setCustomId("q2Input")
        .setLabel("What is your reason for inactivity?")
        .setStyle(TextInputStyle.Paragraph);
      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(q1Input);
      const secondActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(q2Input);
      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId === "endBreak") {
      await interaction.deferReply({ fetchReply: true });

      const breakData = db
        .prepare("SELECT * FROM breaks WHERE discord = ?")
        .get(
          interaction.message.embeds[0].fields[1].value.slice(2, -1),
        ) as BreakMember;

      if (interaction.channel?.isThread() && !breakData) {
        await interaction.channel.setLocked(true);
        return interaction.deleteReply();
      }

      const name = await uuidToName(breakData.uuid);
      if (interaction.user.id !== breakData.discord) {
        const breakMember = interaction.guild?.members.cache.get(
          breakData.discord,
        ) as GuildMember;
        if (!config.admins.includes(interaction.member?.user.id ?? "")) {
          const embed = new EmbedBuilder()
            .setColor(config.colors.discordGray)
            .setDescription("Only admins can close this application");
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        const confirmationEmbed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setTitle("End Break Confirmation")
          .setDescription(
            `Please confirm that you want to end **${name}'s** break`,
          );
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("confirm")
            .setStyle(ButtonStyle.Success)
            .setLabel("Confirm")
            .setEmoji(config.emojis.aCheckmark),
        );
        const message = await interaction.editReply({
          embeds: [confirmationEmbed],
          components: [row],
        });
        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60 * 1000,
        });

        collector.on("collect", async (collectorInteraction) => {
          if (collectorInteraction.customId === "confirm") {
            await collectorInteraction.deferReply();
            if (breakMember !== undefined) {
              await breakMember.roles.remove(
                interaction.guild?.roles.cache.get(config.roles.break) as Role,
              );
            }
            db.prepare("DELETE FROM breaks WHERE discord = ?").run(
              breakData.discord,
            );
            const embed = new EmbedBuilder()
              .setColor(config.colors.discordGray)
              .setTitle(
                `${await uuidToName(breakData.uuid)}'s Break Has Been Ended`,
              )
              .setDescription("This thread has been archived.");
            await interaction.deleteReply();
            await collectorInteraction.editReply({ embeds: [embed] });
            await (collectorInteraction.channel as ThreadChannel).setLocked();
            await (collectorInteraction.channel as ThreadChannel).setArchived();
            collector.stop();
          }
        });
        return;
      }
      if (!fetchGuildMember(breakData.uuid)) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setDescription(
            `Please rejoin the guild before closing the break form.\nYou can rejoin by messaging ${config.minecraft.ign} in Hypixel`,
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      db.prepare("DELETE FROM breaks WHERE discord = ?").run(
        interaction.user.id,
      );
      await member.roles.remove(
        interaction.guild?.roles.cache.get(config.roles.break) as Role,
      );
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`Welcome back, ${await uuidToName(breakData.uuid)}!`)
        .setDescription("This thread has been archived. Enjoy your stay!");
      await interaction.editReply({ embeds: [embed] });
      await (interaction.channel as ThreadChannel).setLocked();
      await (interaction.channel as ThreadChannel).setArchived();
    } else if (interaction.customId === "closeApplication") {
      if (!config.admins.includes(interaction.member?.user.id ?? "")) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setDescription("Only admins can close this application");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle("Close Confirmation")
        .setDescription(
          "Please confirm that you want to close this application",
        );
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm")
          .setStyle(ButtonStyle.Success)
          .setLabel("Confirm")
          .setEmoji(config.emojis.aCheckmark),
      );
      const message = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60 * 1000,
      });

      collector.on("collect", async (collectorInteraction) => {
        if (collectorInteraction.customId === "confirm") {
          db.prepare("DELETE FROM waitlist WHERE channel = ?").run(
            collectorInteraction.channelId,
          );
          await collectorInteraction.channel?.delete();
          collector.stop();
        }
      });
    } else if (interaction.customId === "removeMute") {
      await interaction.deferReply();
      const timeoutMember = await interaction.guild?.members.fetch(
        interaction.message.embeds[0].description?.match(/<@(\d+)>/)?.[1] ?? "",
      );

      if (!timeoutMember) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription("Failed to fetch timeout member");

        return interaction.editReply({ embeds: [embed] });
      }

      try {
        await textChannels["minecraftLink"].permissionOverwrites.delete(
          timeoutMember,
        );
      } catch (e) {
        /* empty */
      }

      try {
        await textChannels["officerChat"].permissionOverwrites.delete(
          timeoutMember,
        );
      } catch (e) {
        /* empty */
      }

      let embed = new EmbedBuilder()
        .setColor(config.colors.green)
        .setTitle("Timeout Removed")
        .setDescription(
          "After manual review, your timeout has been removed.\nAuto mod filters can be tested using </automod:1159506896043118622> in <#1017269021927817236>",
        );

      await timeoutMember.send({ embeds: [embed] });

      embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle(
          `AutoMod has blocked a message in <#${textChannels["minecraftLink"].id}>`,
        )
        .setDescription(
          `**<@${timeoutMember.id}> timeout has been removed by ${
            interaction.user
          }**\n${interaction.message.embeds[0].description?.split("\n")[1]}`,
        );
      await interaction.message.edit({ embeds: [embed], components: [] });
      await interaction.deleteReply();
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("setBaseDays")) {
      await interaction.deferReply({ ephemeral: true });

      const uuidPattern = /setBaseDays(\w+)/;
      const match = interaction.customId.match(uuidPattern);
      const extractedUuid = match ? match[1] : "";

      if (!extractedUuid) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(`${config.emojis.aCross} Failed to extract uuid`);
        return interaction.editReply({ embeds: [embed] });
      }

      const baseDays = interaction.fields.getTextInputValue("baseDaysInput");

      if (Number.isNaN(Number.parseInt(baseDays, 10))) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(`${config.emojis.aCross} Invalid base days`);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const days = Number.parseInt(baseDays, 10);
        db.prepare("UPDATE guildMembers SET baseDays = ? WHERE uuid = ?").run(
          days,
          extractedUuid,
        );

        const guildMember = fetchGuildMember(extractedUuid);

        if (!guildMember) {
          const embed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle("Error")
            .setDescription(
              `${config.emojis.aCross} Failed to fetch guild member`,
            );
          return interaction.editReply({ embeds: [embed] });
        }
        const embed = new EmbedBuilder()
          .setColor(config.colors.green)
          .setTitle("Base Days Change Successful")
          .setDescription(
            `${config.emojis.aTick} **${await uuidToName(
              extractedUuid,
            )}**\nCurrent days in guild: \`` +
              `${abbreviateNumber(
                (new Date().getTime() -
                  new Date(Number.parseInt(guildMember.joined, 10)).getTime()) /
                  (1000 * 3600 * 24),
              )}\`` +
              `\nPrevious days in guild: \`${abbreviateNumber(
                guildMember.baseDays ?? 0,
              )}\`\nTotal days in guild: \`` +
              `${abbreviateNumber(
                getDaysInGuild(guildMember.joined, guildMember.baseDays),
              )}\``,
          );

        await interaction.editReply({ embeds: [embed] });
      }
    } else if (interaction.customId === "verification") {
      await interaction.deferReply({ ephemeral: true });

      let name: string;
      let uuid: string;
      const ign = interaction.fields.getTextInputValue("verificationInput");

      try {
        const playerData = (
          await (
            await fetch(`https://playerdb.co/api/player/minecraft/${ign}`)
          ).json()
        ).data.player;
        uuid = playerData.raw_id;
        name = playerData.username;
      } catch (e) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(
            `${config.emojis.aCross} [${ign}](https://mcuuid.net/?q=${ign}) does not exist`,
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (!uuid || !name) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(
            `${config.emojis.aCross} [${ign}](https://mcuuid.net/?q=${ign}) does not exist`,
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      let memberData = fetchMember(uuid);

      if (memberData) {
        if (memberData.discord === interaction.user.id) {
          await member.roles.remove(
            interaction.guild?.roles.cache.get(config.roles.unverified) as Role,
          );
          await member.roles.add(
            interaction.guild?.roles.cache.get(config.roles.verified) as Role,
          );
        }

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Verification Unsuccessful")
          .setDescription(
            `${config.emojis.aCross} **\`${name}\`** is already verified to the discord account <@${memberData.discord}>`,
          );
        interaction.editReply({ embeds: [embed] });
        return;
      }

      memberData = fetchMember(interaction.user.id);
      if (memberData) {
        if (memberData.uuid === uuid) {
          await member.roles.remove(
            interaction.guild?.roles.cache.get(config.roles.unverified) as Role,
          );
          await member.roles.add(
            interaction.guild?.roles.cache.get(config.roles.verified) as Role,
          );
        }

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Verification Unsuccessful")
          .setDescription(
            `${config.emojis.aCross} ${interaction.user} is already verified to [this](https://namemc.com/search?q=${memberData.uuid}) minecraft account`,
          );
        interaction.editReply({ embeds: [embed] });
        return;
      }

      const player = await hypixel
        .getPlayer(uuid, { guild: true })
        .catch(async (e) => {
          await interaction.editReply(hypixelApiErrorEmbed(e.message));
        });

      if (!player) return;

      name = player.nickname;
      const discord = player.socialMedia.find(
        (media) => media.name === "Discord",
      )?.link;

      if (!discord) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Verification Unsuccessful")
          .setDescription(
            `${config.emojis.aCross} **${name}** doesn't have a discord linked on hypixel\nPlease link your social \
						media following [this tutorial](https://www.youtube.com/watch?v=gqUPbkxxKLI&feature=emb_title)`,
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (discord === interaction.user.tag) {
        await createMember(member, uuid);

        const { displayName } = member;
        if (!displayName.toUpperCase().includes(name.toUpperCase())) {
          if (/\(.*?\)/.test(displayName.split(" ")[1])) {
            await member.setNickname(
              displayName.replace(displayName.split(" ")[0], name),
            );
          } else {
            await member.setNickname(name);
          }
        } else if (!displayName.includes(name)) {
          await member.setNickname(
            displayName.replace(new RegExp(name, "gi"), name),
          );
        }

        if (!player.guild || player.guild.name.toLowerCase() !== "dominance") {
          const embed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle("Verification Successful")
            .setDescription(
              `${config.emojis.aTick} **${name}** is not in Dominance\n${config.emojis.add}\
                    Added: <@&445669382539051008>\n${config.emojis.minus} Removed: <@&${config.roles.unverified}>`,
            )
            .setThumbnail(generateHeadUrl(uuid, name));

          await interaction.editReply({ embeds: [embed] });
        } else {
          await member.roles.add(
            interaction.guild?.roles.cache.get(config.roles.slayer) as Role,
          );
          db.prepare("UPDATE guildMembers SET discord = ? WHERE uuid = ?").run(
            interaction.user.id,
            uuid,
          );
          const embed = new EmbedBuilder()
            .setColor(config.colors.green)
            .setTitle("Verification Successful")
            .setDescription(
              `${config.emojis.aTick} **${name}** is in Dominance\n${config.emojis.add}\
                      Added: <@&445669382539051008>, <@&1031926129822539786>\n${config.emojis.minus} Removed: <@&${config.roles.unverified}>`,
            )
            .setThumbnail(generateHeadUrl(uuid, name));
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Verification Unsuccessful")
          .setDescription(`${config.emojis.aCross}${name} has a different discord account linked on hypixel\nThe discord tag **${discord}**\
                        linked on hypixel does not match your discord tag **${interaction.user.tag}**`);
        await interaction.editReply({ embeds: [embed] });
      }
    } else if (interaction.customId === "applications") {
      await interaction.deferReply({ ephemeral: true });
      const q1 = interaction.fields.getTextInputValue("q1Input");
      const q2 = interaction.fields.getTextInputValue("q2Input");
      const q3 = interaction.fields.getTextInputValue("q3Input");

      const uuid = discordToUuid(interaction.user.id);
      if (!uuid) return;

      const playerResponse = await hypixel
        .getPlayer(uuid, { guild: true })
        .catch(async (e) => {
          await interaction.editReply(hypixelApiErrorEmbed(e.message));
        });
      if (!playerResponse) return;

      const requirementData = await requirementsEmbed(uuid, playerResponse);
      const name = (await uuidToName(uuid)) ?? "";
      let color: number;
      let meetingReqs: string;
      if (requirementData.reqs === 2) {
        color = config.colors.green;
        meetingReqs = "Primary";
      } else if (requirementData.reqs === 1) {
        color = config.colors.yellow;
        meetingReqs = "Secondary";
      } else {
        color = config.colors.red;
        meetingReqs = "False";
      }

      const applicationEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${interaction.user.tag}'s Application`)
        .setThumbnail(generateHeadUrl(uuid, name))
        .setDescription(
          `${config.emojis.keycap1_3d} **What games do you mainly play?**\n${q1}\n\n${config.emojis.keycap2_3d} ` +
            `**Why should we accept you?**\n${q2}\n\n${config.emojis.keycap3_3d} **Do you know anyone from the guild?**\n${q3}` +
            `\n\n${dividers(21)}\n\n**Requirements:**\n\n${
              requirementData.embed
            }`,
        )
        .addFields(
          {
            name: `${config.emojis.user} IGN: `,
            value: name,
            inline: true,
          },
          {
            name: `${config.emojis.page} Meeting Requirements: `,
            value: meetingReqs,
            inline: true,
          },
          {
            name: ":shield: Guild: ",
            value: playerResponse.guild?.name ?? "None",
            inline: true,
          },
          {
            name: `${config.emojis.mention} Discord: `,
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: `${config.emojis.calendar3d} Discord Member Since: `,
            value: `<t:${Math.floor((member.joinedTimestamp ?? 0) / 1000)}:R>`,
            inline: true,
          },
          {
            name: `${config.emojis.clock} Created: `,
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true,
          },
        );

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("accept")
            .setStyle(ButtonStyle.Success)
            .setLabel("Accept")
            .setEmoji(config.emojis.aTick),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("deny")
            .setStyle(ButtonStyle.Danger)
            .setLabel("Deny")
            .setEmoji(config.emojis.aCross),
        );
      await textChannels["applications"].send({
        components: [row],
        embeds: [applicationEmbed],
      });
      const replyEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${interaction.user.tag}'s application has been received`)
        .setThumbnail(generateHeadUrl(uuid, name))
        .setDescription(
          `${
            config.emojis.keycap1_3d
          } **What games do you mainly play?**\n${q1}\n\n${
            config.emojis.keycap2_3d
          } **Why should we accept you?**\n${q2}\n\n${
            config.emojis.keycap3_3d
          } **Do you know anyone from the guild?**\n${q3}\n\n${dividers(
            21,
          )}\n\n**Info:**\n\n${bullet} Applications usually receive a response within 24 hours\n${bullet} You will be **pinged** in this server if you have been accepted\n${bullet} You will receive a dm if rejected **unless** your dms are closed`,
        );
      await interaction.editReply({ embeds: [replyEmbed] });
    } else if (interaction.customId === "breakModal") {
      await interaction.deferReply({ ephemeral: true });

      const q1 = interaction.fields.getTextInputValue("q1Input");
      const q2 = interaction.fields.getTextInputValue("q2Input");

      const uuid = discordToUuid(interaction.user.id) as string;
      const name = (await uuidToName(uuid)) ?? "";
      const thread = db
        .prepare("SELECT thread FROM breaks WHERE discord = ?")
        .get(interaction.user.id) as BreakMember;
      if (thread) {
        const replyEmbed = new EmbedBuilder()
          .setColor(config.colors.discordGray)
          .setTitle("Error!")
          .setDescription(
            `You already have an active break form in <#${thread.thread}>`,
          )
          .setThumbnail(generateHeadUrl(uuid, name));
        await interaction.editReply({ embeds: [replyEmbed] });
        return;
      }

      const guildMember = fetchGuildMember(interaction.user.id);
      if (guildMember === null) {
        await member.roles.remove(config.roles.slayer);

        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription("You are not a guild member!");

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const { joined, weeklyGexp } = guildMember;

      const embed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`${name}'s Break Application`)
        .setThumbnail(generateHeadUrl(uuid, name))
        .setDescription(
          `${config.emojis.keycap1_3d} **How long will you be inactive for?**\n${q1}\n\n${config.emojis.keycap2_3d} ` +
            `**What is your reason for inactivity?**\n${q2}`,
        )
        .addFields(
          {
            name: `${config.emojis.calendar3d} Days in Guild: `,
            value: `<t:${Math.floor(Number(joined) / 1000)}:R>`,
            inline: true,
          },
          {
            name: `${config.emojis.mention} Discord: `,
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: `${config.emojis.gexp} Weekly Gexp: `,
            value: `\`${formatNumber(weeklyGexp)}\``,
            inline: true,
          },
        );
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("endBreak")
          .setLabel("End Break")
          .setStyle(ButtonStyle.Danger)
          .setEmoji(config.emojis.calendar3d),
      );
      const threadChannel = await (
        interaction.channel as TextChannel
      ).threads.create({
        name,
        type: ChannelType.PrivateThread,
        invitable: false,
      });
      await threadChannel.join();
      await threadChannel.members.add(interaction.user);
      await threadChannel.send({ embeds: [embed], components: [row] });

      const replyEmbed = new EmbedBuilder()
        .setColor(config.colors.discordGray)
        .setTitle(`${name}'s break form has been received`)
        .setDescription(
          `You may update your break status in <#${threadChannel.id}>`,
        )
        .setThumbnail(generateHeadUrl(uuid, name));
      await interaction.editReply({ embeds: [replyEmbed] });
      db.prepare(
        "INSERT INTO breaks (uuid, discord, thread, time, reason) VALUES (?, ?, ?, ?, ?)",
      ).run(uuid, interaction.user.id, threadChannel.id, q1, q2);
      await member.roles.add(
        interaction.guild?.roles.cache.get(config.roles.break) as Role,
      );

      await textChannels["break"].send({ embeds: [embed] });
    } else if (interaction.customId.endsWith("LbSearchModal")) {
      await interaction.deferReply({ ephemeral: true });

      const lbName = interaction.customId.split("LbSearchModal")[0];
      const name = interaction.fields.getTextInputValue("name");
      const uuid = await nameToUuid(name);

      if (!uuid) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription("Invalid username");
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const totalPages =
        Math.floor(
          (
            db.prepare("SELECT COUNT(*) AS total FROM guildMembers").get() as {
              total: number;
            }
          ).total / 10,
        ) + 1;
      const page = getMemberLeaderboardPage(uuid, lbName);

      if (page === null) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.red)
          .setTitle("Error")
          .setDescription(
            `${name} not found in ${camelCaseToWords(lbName)} leaderboard`,
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      await pagination(
        page,
        lbName,
        interaction,
        getLbEmbedForPage,
        totalPages,
      );
    }
  }
}
