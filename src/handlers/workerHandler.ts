import { EmbedBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { textChannels, worker } from "../events/discord/ready.js";
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

export function chat(message: string) {
  worker.postMessage({ type: "send", content: message });
}

export function quit() {
  worker.postMessage({ type: "quit" });
}

export function autoRejoin() {
  setInterval(async () => {
    const status = await hypixel.getStatus(config.minecraft.ign);
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
      await textChannels.botStatus.send({ embeds: [embed] });
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
