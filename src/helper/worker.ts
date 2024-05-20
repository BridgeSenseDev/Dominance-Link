import { parentPort } from "node:worker_threads";
import mineflayer from "mineflayer";
import config from "../config.json" with { type: "json" };

let bot: mineflayer.Bot;

parentPort?.on("message", async (msg) => {
  if (msg.type === "startBot") {
    bot = mineflayer.createBot({
      host: "mc.hypixel.net",
      auth: "microsoft",
      username: config.minecraft.ign,
      version: "1.8.9",
      viewDistance: "tiny",
      chatLengthLimit: 256,
      defaultChatPatterns: false,
    });

    bot.on("error", (error) => {
      if (error.message.includes("ETIMEDOUT")) {
        console.log("Connection timed out");
      } else {
        console.error("An error occurred:", error);
      }
    });

    bot.on("message", (message, messagePosition) => {
      parentPort?.postMessage({
        type: "message",
        string: message.toString(),
        motd: message.toMotd(),
        messagePosition,
      });
    });

    bot.on("login", () => {
      parentPort?.postMessage({ type: "login" });
    });
  } else if (msg.type === "restartBot") {
    bot.quit();
    bot = mineflayer.createBot({
      host: "mc.hypixel.net",
      auth: "microsoft",
      username: config.minecraft.ign,
      version: "1.8.9",
      viewDistance: "tiny",
      chatLengthLimit: 256,
      defaultChatPatterns: false,
    });

    bot.on("error", (error) => {
      if (error.message.includes("ETIMEDOUT")) {
        console.log("Connection timed out");
      } else {
        console.error("An error occurred");
      }
    });

    bot.on("message", (message, messagePosition) => {
      parentPort?.postMessage({
        type: "message",
        string: message.toString(),
        motd: message.toMotd(),
        messagePosition,
      });
    });

    bot.on("login", () => {
      parentPort?.postMessage({ type: "login" });
    });
  } else if (msg.type === "send") {
    bot.chat(msg.content);
  }
});
