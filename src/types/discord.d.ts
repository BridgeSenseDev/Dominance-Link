import type { Collection } from "discord.js";
import type { DisTube } from "distube";

export interface SlashCommandJsonData {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, SlashCommandJsonData>;
    distube: DisTube;
  }
}
