import { EmbedBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { textChannels, worker } from "../events/discord/ready.js";
import { sleep } from "../helper/clientUtils.ts";
import { generateID } from "../helper/utils.ts";
import { hypixel } from "../index.js";

interface MessageObject {
  type: string;
  string: string;
  motd: string;
  messagePosition: string;
}

export async function startBot() {
  const client = (await import("../index.js")).default;
  worker.postMessage({ type: "startBot" });

  worker.on("message", async (msg: MessageObject) => {
    if (msg.type === "message") {
      const event = await import("../events/minecraft/message.js");
      await event.default(client, msg.string, msg.motd, msg.messagePosition);
    }

    if (msg.type === "spawn") {
      const event = await import("../events/minecraft/spawn.js");
      await event.default();
    }
  });
}

export function chat(message: string, n = 0) {
  const attemptCount = n;

  const listener = async (msg?: MessageObject) => {
    if (
      msg?.string?.includes(
        "You are sending commands too fast! Please slow down.",
      )
    ) {
      worker.removeListener("message", listener);
      const newAttemptCount = attemptCount + 1;

      if (newAttemptCount >= 2) {
        return chat(
          "/gc Command failed to send message after 5 attempts. Please try again later.",
        );
      }

      await sleep(250);
      return chat(message, newAttemptCount);
    }

    if (msg?.string?.includes("You cannot say the same message twice!")) {
      worker.removeListener("message", listener);
      const newAttemptCount = attemptCount + 1;

      if (newAttemptCount >= 2) {
        return chat(
          "/gc Command failed to send message after 5 attempts. Please try again later.",
        );
      }

      await sleep(250);
      return chat(`${message} - ${generateID(24)}`, newAttemptCount);
    }
  };

  worker.once("message", listener);
  worker.postMessage({ type: "send", content: message });

  setTimeout(() => {
    worker.removeListener("message", listener);
  }, 5000);
}

export function quit() {
  worker.postMessage({ type: "quit" });
}

export function autoRejoin() {
  setInterval(async () => {
    const status = await hypixel
      .getStatus(config.minecraft.ign)
      .catch(() => null);
    if (!status) return;

    if (!status.online) {
      console.log("[MINECRAFT] Restarting bot");
      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle("Disconnected")
        .setDescription(
          `${config.minecraft.ign} has been disconnected from hypixel. Trying to reconnect...`,
        )
        .addFields({
          name: `${config.emojis.clock} Time`,
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        });
      await textChannels["botStatus"].send({ embeds: [embed] });
      try {
        quit();
      } catch (err) {
        /* empty */
      }
      worker.postMessage({ type: "restartBot" });
    }
  }, 60 * 1000);
}

export async function waitForMessage(
  inputStrings: string[],
  timeoutDuration = 30000,
): Promise<MessageObject | null> {
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, timeoutDuration);
  });

  return Promise.race([
    new Promise<MessageObject>((resolve) => {
      const messageListener = (msg: MessageObject) => {
        if (
          msg &&
          msg.type === "message" &&
          inputStrings.some((str) => msg.string.includes(str))
        ) {
          worker.off("message", messageListener);
          resolve(msg);
        }
      };

      worker.on("message", messageListener);
    }),
    timeoutPromise,
  ]);
}
