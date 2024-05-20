import fs from "node:fs";
import { type Client, Collection, REST, Routes } from "discord.js";
import config from "../config.json" with { type: "json" };

export default async function discordCommands(client: Client) {
  client.commands = new Collection();
  const commandFiles = fs.readdirSync("./slashCommands/");
  const commands = [];
  const globalCommands = [];

  for (const file of commandFiles) {
    const command = await import(`../slashCommands/${file}`);
    if (["member", "automod"].includes(command.data.name)) {
      globalCommands.push(command.data.toJSON());
      if (command.data.name) {
        client.commands.set(command.data.name, command);
      }
    } else {
      commands.push(command.data.toJSON());
      if (command.data.name) {
        client.commands.set(command.data.name, command);
      }
    }
  }

  const clientId = "960769680765771806";
  const guildId = "242357942664429568";
  const rest = new REST({ version: "10" }).setToken(
    config.keys.discordBotToken,
  );

  await (async () => {
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      await rest.put(Routes.applicationCommands(clientId), {
        body: globalCommands,
      });
      console.log("[DISCORD] Successfully reloaded application commands.");
    } catch (error) {
      console.error(error);
    }
  })();
}
