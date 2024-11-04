import { Database } from "bun:sqlite";
import { Mutex } from "async-mutex";
import {
  type Client,
  EmbedBuilder,
  type Guild,
  type Role,
  type TextChannel,
  type ThreadChannel,
  WebhookClient,
} from "discord.js";
import config from "../../config.json" with { type: "json" };
import {
  archiveGuildMember,
  createGuildMember,
  fetchGuildMember,
} from "../../handlers/databaseHandler.js";
import {
  getReqs,
  handleMinecraftCommands,
} from "../../handlers/minecraftCommands.ts";
import { chat, waitForMessage } from "../../handlers/workerHandler.js";
import {
  addXp,
  nameToUuid,
  timeStringToSeconds,
  uuidToDiscord,
} from "../../helper/clientUtils.js";
import messageToImage from "../../helper/messageToImage.js";
import { hypixel } from "../../index.ts";
import type {
  BreakMember,
  HypixelGuildMember,
  WaitlistMember,
} from "../../types/global";
import { textChannels } from "../discord/ready.js";

const db = new Database("guild.db");

global.playtime = {};
let logMessages = "";
const logWebhook = new WebhookClient({ url: config.keys.logWebhookUrl });
const gcWebhook = new WebhookClient({ url: config.keys.gcWebhookUrl });
const ocWebhook = new WebhookClient({ url: config.keys.ocWebhookUrl });
const messageCache: string[] = [];
const mutex = new Mutex();

export async function logInterval() {
  setInterval(async () => {
    await mutex.runExclusive(async () => {
      if (logMessages.length === 0) return;

      if (logMessages.length > 2000) {
        await logWebhook.send({
          content: logMessages.substring(0, 2000),
          username: "Dominance",
          avatarURL: config.guild.icon,
        });
        logMessages = logMessages.substring(2000);
        return;
      }

      await logWebhook.send({
        content: logMessages,
        username: "Dominance",
        avatarURL: config.guild.icon,
      });

      logMessages = "";
    });
  }, 1000);
}

export default async function execute(
  client: Client,
  msg: string,
  rawMsg: string,
  messagePosition: string,
) {
  if (messagePosition !== "chat" || msg.trim() === "") return;

  await mutex.runExclusive(() => {
    if (msg.includes("@everyone") || msg.includes("@here")) {
      logMessages += `${msg.replace("@", "")}\n`;
    } else {
      logMessages += `${msg}\n`;
    }
  });

  if (messageCache.length >= 20) messageCache.shift();
  messageCache.push(msg);

  if (isLobbyJoinMessage(msg)) {
    chat("/limbo");
    return;
  }

  console.log(isGuildJoinRequestMessage(msg));

  if (isGuildMessage(msg)) {
    await gcWebhook.send({
      username: "Dominance",
      avatarURL: config.guild.icon,
      files: [await messageToImage(rawMsg)],
    });

    const author = msg.match(/Guild\s*>\s*(?:\[[^\]]+]\s*)?(\w+)/)?.[1];
    if (!author) return;

    const authorUuid = await nameToUuid(author);
    if (authorUuid) {
      await createGuildMember(authorUuid);
      await addXp(authorUuid);
    }

    return handleMinecraftCommands("gc", msg, author);
  }

  if (isOfficerMessage(msg)) {
    await ocWebhook.send({
      username: "Dominance",
      avatarURL: config.guild.icon,
      files: [await messageToImage(rawMsg)],
    });

    const author = msg.match(/Officer\s*>\s*(?:\[[^\]]+]\s*)?(\w+)/)?.[1];
    if (!author) return;

    const authorUuid = await nameToUuid(author);
    if (authorUuid) {
      await createGuildMember(authorUuid);
      await addXp(authorUuid);
    }

    return handleMinecraftCommands("oc", msg, author);
  }

  if (isPrivateMessage(msg)) {
    const author = msg.match(/From (\[.*])? *(.+):/)?.[2];
    if (!author) return;

    const authorUuid = await nameToUuid(author);
    if (!authorUuid) return;

    const waitlist = db
      .prepare("SELECT discord, channel FROM waitlist WHERE uuid = ?")
      .get(authorUuid) as WaitlistMember;
    const breaks = db
      .prepare("SELECT discord, thread FROM breaks WHERE uuid = ?")
      .get(authorUuid) as BreakMember;

    if (waitlist || breaks) {
      chat(`/g invite ${author}`);

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

      let channel: TextChannel | ThreadChannel | undefined;
      let content: string | undefined;

      if (waitlist) {
        channel = client.channels.cache.get(waitlist.channel) as TextChannel;
        content = `<@${waitlist.discord}>`;
      } else if (breaks) {
        channel = client.channels.cache.get(breaks.thread) as ThreadChannel;
        content = `<@${breaks.discord}>`;
      }

      if (!receivedMessage) {
        chat(`/msg ${author} Guild invite failed.`);

        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(config.colors.red)
            .setTitle("Caution")
            .setDescription(`${config.emojis.aCross} Guild invite timed out.`);
          await channel.send({ content, embeds: [embed] });
        }
        return;
      }

      chat(`/msg ${author} ${receivedMessage.string}`);

      if (channel) {
        await channel.send({
          content,
          files: [await generateGuildAnnouncement(receivedMessage.motd, "b")],
        });
      }
    }

    return;
  }

  if (isLoginMessage(msg)) {
    const [name] = msg.replace(/Guild > |:/g, "").split(" ");
    global.playtime[name] = Math.floor(Date.now() / 1000);

    return;
  }

  if (isLogoutMessage(msg)) {
    const [name] = msg.replace(/Guild > |:/g, "").split(" ");
    const uuid = await nameToUuid(name);

    const time = Math.floor(Date.now() / 1000) - global.playtime[name];
    if (!Number.isNaN(time)) {
      delete global.playtime[name];

      if (uuid) {
        await createGuildMember(uuid);
      }

      db.prepare(
        "UPDATE guildMembers SET playtime = playtime + (?) WHERE uuid = (?)",
      ).run(time, uuid);
    }

    return;
  }

  if (
    isJoinMessage(msg) ||
    isLeaveMessage(msg) ||
    isPromotionMessage(msg) ||
    isDemotionMessage(msg) ||
    isKickMessage(msg) ||
    isUserMuteMessage(msg) ||
    isUserUnmuteMessage(msg) ||
    isGuildMuteMessage(msg) ||
    isGuildUnmuteMessage(msg)
  ) {
    await gcWebhook.send({
      username: "Dominance",
      avatarURL: config.guild.icon,
      files: [await generateGuildAnnouncement(rawMsg, "b")],
    });

    await textChannels["guildLogs"].send({
      files: [await generateGuildAnnouncement(rawMsg, "b")],
    });
  }

  if (isJoinMessage(msg)) {
    return await handleGuildJoin(client, msg);
  }

  if (isLeaveMessage(msg) || isKickMessage(msg)) {
    let name = msg.split(" ")[msg.split(" ").indexOf("left") - 1];
    if (!name) {
      name = msg.split(" ")[msg.split(" ").indexOf("was") - 1];
    }

    const uuid = await nameToUuid(name);
    if (!uuid) return;

    let member = null;
    const discordId = uuidToDiscord(uuid);
    if (discordId) {
      try {
        member = await textChannels["guildChat"].guild.members.fetch(discordId);
      } catch (e) {
        /* empty */
      }
    }

    return await archiveGuildMember(member, uuid);
  }

  if (isGuildLevelUpMessage(msg)) {
    const level = msg.split(" ")[msg.split(" ").indexOf("Level") + 1];
    const image = await generateGuildAnnouncement(
      `§f§l                                                        LEVEL UP!§r                                                       §f                                §6The Guild has reached Level ${level}`,
      "6",
    );

    await gcWebhook.send({
      username: "Dominance",
      avatarURL: config.guild.icon,
      files: [image],
    });
    await textChannels["guildLogs"].send({
      files: [image],
    });
    await textChannels["publicAnnouncements"].send({
      files: [image],
    });

    return;
  }

  if (isUserMuteMessage(msg)) {
    const uuid = await nameToUuid(
      msg.split(" ")[msg.split(" ").indexOf("for") - 1],
    );
    if (!uuid) return;

    const time = timeStringToSeconds(msg.split(" ")[msg.split(" ").length - 1]);

    const discordId = uuidToDiscord(uuid);
    if (!discordId) return;

    const guild = client.guilds.cache.get("242357942664429568") as Guild;
    const member = await guild.members.fetch(discordId);

    return await member.timeout(time, "Muted in-game");
  }

  if (isUserUnmuteMessage(msg)) {
    const uuid = await nameToUuid(msg.split(" ")[msg.split(" ").length - 1]);
    if (!uuid) return;

    const discordId = uuidToDiscord(uuid);
    if (!discordId) return;

    const guild = client.guilds.cache.get("242357942664429568") as Guild;
    const member = await guild.members.fetch(discordId);

    return await member.timeout(null, "Un muted in-game");
  }

  if (isGuildOnlineMessage(msg)) {
    global.onlineMembers = Number.parseInt(
      msg.split("Online Members: ")[1],
      10,
    );

    return;
  }

  if (isGuildOfflineMessage(msg)) {
    let includes = 0;

    for (let i = messageCache.length - 1; i >= 0; i--) {
      if (
        messageCache[i].includes("Guild Name:") ||
        messageCache[i].includes("Total Members:") ||
        messageCache[i].includes("Online Members:") ||
        messageCache[i].includes("Offline Members:")
      ) {
        includes++;
      }

      if (includes === 4) {
        global.guildOnline = messageCache.splice(i);
        break;
      }
    }

    return;
  }

  if (isRepeatMessage(msg)) {
    await gcWebhook.send({
      username: "Dominance",
      avatarURL: config.guild.icon,
      files: [
        await generateGuildAnnouncement(
          "§cYou cannot say the same message twice!",
          "6",
        ),
      ],
    });

    return;
  }

  if (isGuildJoinRequestMessage(msg)) {
    console.log(msg);
    const ign = /(\S+)\s+has requested/.exec(msg)?.[1];
    console.log(ign);
    if (!ign) {
      return;
    }

    const player = await hypixel.getPlayer(ign).catch(() => null);
    console.log(player);

    if (!player) {
      return;
    }

    chat(await getReqs("oc", player));
  }
}

async function handleGuildJoin(client: Client, msg: string) {
  const name = msg.split(" ")[msg.split(" ").indexOf("joined") - 1];
  const uuid = await nameToUuid(name);
  if (!uuid) return;

  const funFact = await getFunFact();

  await createGuildMember(uuid);

  await handleWaitlist(client, uuid);
  await handleBreak(client, uuid, name, funFact);

  const guildMember = fetchGuildMember(uuid);
  const message = buildGuildMessage(name, guildMember, funFact);
  chat(`/gc ${message}`);

  await handleDiscordMember(uuid, name, guildMember, funFact);
}

async function getFunFact(): Promise<string> {
  const funFacts = await (
    await fetch("https://api.api-ninjas.com/v1/facts", {
      method: "GET",
      headers: { "X-Api-Key": config.keys.apiNinjasKey },
    })
  ).json();
  return funFacts[0].fact.length < 150 ? funFacts[0].fact : "";
}

async function handleWaitlist(client: Client, uuid: string) {
  try {
    const { channel } = db
      .prepare("SELECT channel FROM waitlist WHERE uuid = ?")
      .get(uuid) as WaitlistMember;
    await client.channels.cache.get(channel)?.delete();
    db.prepare("DELETE FROM waitlist WHERE uuid = ?").run(uuid);
  } catch (e) {
    /* empty */
  }
}

async function handleBreak(
  client: Client,
  uuid: string,
  name: string,
  funFact: string,
) {
  try {
    const breakData = db
      .prepare("SELECT * FROM breaks WHERE uuid = ?")
      .get(uuid) as BreakMember;
    const member = await textChannels["guildChat"].guild.members.fetch(
      breakData.discord,
    );
    const thread = client.channels.cache.get(breakData.thread) as ThreadChannel;

    db.prepare("DELETE FROM breaks WHERE uuid = ?").run(uuid);
    await member.roles.remove(
      thread.guild?.roles.cache.get(config.roles.break) as Role,
    );
    await member.roles.add(config.roles.slayer);

    const embed = new EmbedBuilder()
      .setColor(config.colors.discordGray)
      .setTitle(`Welcome back, ${name}!`)
      .setDescription(
        "This thread has been archived and closed. Enjoy your stay!",
      );
    await thread.send({ embeds: [embed] });
    await thread.setArchived();
    await thread.setLocked();

    db.prepare("UPDATE guildMembers SET discord = ? WHERE uuid = ?").run(
      breakData.discord,
      uuid,
    );
    chat(`/gc Welcome back from your break, ${name}! ${funFact}`);
    await textChannels["guildChat"].send(
      `${config.emojis.aWave} Welcome back from your break, <@${breakData.discord}>! ${funFact}`,
    );
    return;
  } catch (e) {
    /* empty */
  }
}

function buildGuildMessage(
  name: string,
  guildMember: HypixelGuildMember | null,
  funFact: string,
): string {
  if (!guildMember) return `Welcome to Dominance, ${name}! ${funFact}`;

  if (guildMember.baseDays === null) {
    return `🆕 Welcome to Dominance, ${name}! ${funFact}`;
  }
  if (guildMember.baseDays === 0) {
    return `🏠 Welcome back to Dominance, ${name}! Your days in guild have been reset as you are not on a break. ${funFact}`;
  }
  if (guildMember.baseDays > 0) {
    return `💤 Welcome back from your break, ${name}! You have previously been in the guild for ${guildMember.baseDays} days. ${funFact}`;
  }

  return `🆕 Welcome to Dominance, ${name}! ${funFact}`;
}

async function handleDiscordMember(
  uuid: string,
  name: string,
  guildMember: HypixelGuildMember | null,
  funFact: string,
) {
  const discordId = uuidToDiscord(uuid);
  let discordMessage: string;

  if (discordId) {
    db.prepare("UPDATE guildMembers SET discord = ? WHERE uuid = ?").run(
      discordId,
      uuid,
    );
    discordMessage = buildGuildMessage(`<@${discordId}>`, guildMember, funFact);
    await textChannels["guildChat"].send(discordMessage);

    const member =
      await textChannels["guildChat"].guild.members.fetch(discordId);
    await member.roles.add(config.roles.slayer);
  } else {
    discordMessage = buildGuildMessage(name, guildMember, funFact);
    await textChannels["guildChat"].send(discordMessage);
  }
}

async function generateGuildAnnouncement(message: string, color: string) {
  return await messageToImage(
    `§${color}-------------------------------------------------------------§r${message}§${color}-------------------------------------------------------------`,
  );
}

function isLobbyJoinMessage(message: string) {
  return (
    (message.endsWith(" the lobby!") || message.endsWith(" the lobby! <<<")) &&
    message.includes("[MVP+")
  );
}

function isGuildMessage(message: string) {
  return message.startsWith("Guild >") && message.includes(":");
}

function isOfficerMessage(message: string) {
  return message.startsWith("Officer >") && message.includes(":");
}

function isPrivateMessage(message: string) {
  return message.startsWith("From") && message.includes(":");
}

function isLoginMessage(message: string) {
  return (
    message.startsWith("Guild >") &&
    message.endsWith("joined.") &&
    !message.includes(":")
  );
}

function isLogoutMessage(message: string) {
  return (
    message.startsWith("Guild >") &&
    message.endsWith("left.") &&
    !message.includes(":")
  );
}

function isJoinMessage(message: string) {
  return message.includes("joined the guild!") && !message.includes(":");
}

function isLeaveMessage(message: string) {
  return message.includes("left the guild!") && !message.includes(":");
}

function isKickMessage(message: string) {
  return (
    message.includes("was kicked from the guild by") && !message.includes(":")
  );
}

function isGuildLevelUpMessage(message: string) {
  return (
    message.includes("The guild has reached Level") && !message.includes(":")
  );
}

function isPromotionMessage(message: string) {
  return message.includes("was promoted from") && !message.includes(":");
}

function isDemotionMessage(message: string) {
  return message.includes("was demoted from") && !message.includes(":");
}

function isUserMuteMessage(message: string) {
  return (
    message.includes("has muted") &&
    message.includes("for") &&
    !message.includes(":")
  );
}

function isUserUnmuteMessage(message: string) {
  return message.includes("has unmuted") && !message.includes(":");
}

function isGuildMuteMessage(message: string) {
  return (
    message.includes("has muted the guild chat for") && !message.includes(":")
  );
}

function isGuildUnmuteMessage(message: string) {
  return (
    message.includes("has unmuted the guild chat!") && !message.includes(":")
  );
}

function isGuildOnlineMessage(message: string) {
  return message.includes("Online Members: ");
}

function isGuildOfflineMessage(message: string) {
  return message.includes("Offline Members: ");
}

function isRepeatMessage(message: string) {
  return message === "You cannot say the same message twice!";
}

function isGuildJoinRequestMessage(message: string) {
  return message.includes("has requested to join the Guild!");
}
