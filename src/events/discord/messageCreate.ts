import Database from "bun:sqlite";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
  EmbedBuilder,
  type Message,
  type TextChannel,
} from "discord.js";
import Mex from "math-expression-evaluator";
import config from "../../config.json" with { type: "json" };
import { fetchGuildMember } from "../../handlers/databaseHandler.js";
import { chat } from "../../handlers/workerHandler.js";
import {
  addXp,
  discordToUuid,
  formatMentions,
  uuidToName,
} from "../../helper/clientUtils.js";
import { checkProfanity } from "../../helper/utils.js";
import type { Count } from "../../types/global";
import { textChannels } from "./clientReady.ts";

const db = new Database("guild.db");

export default async function execute(_client: Client, message: Message) {
  const { guildId, author, content, channel, member } = message;
  if (guildId !== "242357942664429568") return;

  if (author.bot) {
    if (
      message.webhookId &&
      message.embeds[0]?.author?.name.includes("[bot]")
    ) {
      await message.delete();
    }

    return;
  }

  await addXp(author.id, message.channel);

  if (content.toLowerCase().includes("dominance")) {
    await message.react(":dominance:1060579574347472946");
  }

  if (channel.id === textChannels["chatLogs"].id) {
    chat(message.content);
  }

  if (channel.id === textChannels["counting"].id) {
    const expression = content.split(" ")[0];
    try {
      const count = new Mex().eval(expression, [], {});
      if (count) {
        const currentCount = db
          .prepare("SELECT * FROM counting ORDER BY count DESC LIMIT 1")
          .get() as Count;
        if (
          currentCount.count + 1 === count &&
          currentCount.discord !== author.id
        ) {
          await message.react(config.emojis.aTick);
          db.prepare("INSERT INTO counting (count, discord) VALUES (?, ?)").run(
            count,
            author.id,
          );
        } else {
          await message.react(config.emojis.aCross);
        }
      }
    } catch (_e) {
      await message.react(config.emojis.aCross);
    }
  }

  if (
    ![
      textChannels["minecraftLink"].id,
      textChannels["officerChat"].id,
    ].includes(channel.id)
  )
    return;

  const uuid = discordToUuid(author.id);
  let user = fetchGuildMember(author.id);

  const messageContent = (await formatMentions(message))
    ?.replace(/\n/g, "")
    .replace(/[^\u0020-\u007E]/g, "*");

  let tag = "";

  if (!user) {
    if (!uuid) {
      await member?.roles.add(config.roles.unverified);
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle("Error")
        .setDescription(
          `${config.emojis.aCross} <@${author.id}> Please verify first in <#907911357582704640>`,
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (member?.roles.cache.has(config.roles.break)) {
      tag = "[Break]";
    }

    db.prepare("UPDATE guildMembers SET discord = ? WHERE uuid = ?").run(
      author.id,
      uuid,
    );
    user = fetchGuildMember(author.id);
  } else {
    tag = user.tag;
  }

  if (tag === "[Moderator]") {
    tag = "[MOD]";
  }

  const name = await uuidToName(uuid ?? "");
  const messageLength = `/gc ${name} ${user?.tag}: ${messageContent}`.length;

  // Auto mod
  if (await checkProfanity(content)) {
    if (member) {
      try {
        await (channel as TextChannel).permissionOverwrites.edit(member, {
          SendMessages: false,
        });
      } catch (_e) {
        /* empty */
      }
    }

    let embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle(
        `AutoMod has blocked a message in <#${textChannels["minecraftLink"].id}>`,
      )
      .setDescription(
        `<@${author.id}> has been muted from <#${textChannels["minecraftLink"].id}>.\nThis mute will be reviewed by staff ASAP.`,
      );

    await message.reply({ embeds: [embed] });

    embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle(
        `AutoMod has blocked a message in <#${textChannels["minecraftLink"].id}>`,
      )
      .setDescription(
        `**<@${author.id}> has been muted from <#${textChannels["minecraftLink"].id}>.**\n**Message: **${content}`,
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("removeMute")
        .setLabel("Remove Mute")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(config.emojis.clock),
    );

    await textChannels["automod"].send({ embeds: [embed], components: [row] });
    return;
  }

  if (messageLength > 256) {
    await message.reply(`Character limit exceeded (${messageLength})`);
    return;
  }

  if (channel.id === textChannels["minecraftLink"].id) {
    chat(`/gc ${name} ${tag}: ${messageContent}`);
  } else if (channel.id === textChannels["officerChat"].id) {
    chat(`/oc ${name} ${tag}: ${messageContent}`);
  }

  await message.delete();

  // Count as in-game message, but xp is already added
  db.prepare(
    "UPDATE guildMembers SET messages = messages + 1 WHERE uuid = (?)",
  ).run(uuid);
}
