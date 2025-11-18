import Database from "bun:sqlite";
import {
  type Client,
  EmbedBuilder,
  type GuildMember,
  type Role,
} from "discord.js";
import config from "../../config.json" with { type: "json" };
import { archiveMember, fetchMember } from "../../handlers/databaseHandler.js";
import { invis } from "../../helper/constants.js";
import { hypixel } from "../../index.js";
import { textChannels } from "./clientReady.ts";

const db = new Database("guild.db");

export default async function execute(_client: Client, member: GuildMember) {
  if (member.guild.id !== "242357942664429568") return;

  const memberData = fetchMember(member.id);
  if (memberData) {
    const { uuid } = memberData;
    const player = await hypixel.getPlayer(uuid).catch(() => null);
    if (!player || player.isRaw()) {
      return await archiveMember(member);
    }

    const discord = player.socialMedia.discord;

    if (discord === member.user.tag) {
      const guild = await hypixel
        .getGuild("player", uuid, {})
        .catch(() => null);
      if (guild && !guild.isRaw() && guild.name.toLowerCase() === "dominance") {
        db.prepare("UPDATE guildMembers SET discord = ? WHERE uuid = ?").run(
          member.user.id,
          uuid,
        );
        await member.roles.add(
          member.guild?.roles.cache.get(config.roles.slayer) as Role,
        );
      }
      await member.setNickname(player.nickname);
      await member.roles.add(
        member.guild?.roles.cache.get(config.roles.verified) as Role,
      );
      await member.roles.remove(
        member.guild?.roles.cache.get(config.roles.unverified) as Role,
      );
    }
  }

  const embed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setTitle(":wave: Welcome to Dominance!")
    .setDescription(
      `Welcome to the Dominance Community **${member.displayName}**!\n\n**Here's a list of things to help you get started:**\n\n**${config.emojis.rules} | Community Info**\n\`•\` Learn about our community and rules in <#1031245971662835834>\n\n**:ballot_box_with_check: | Verification**\n\`•\` Verify by clicking the verify button in <#1031568019522072677>\n\n**:loudspeaker: | Announcements**\n\`•\` Stay up to date by checking out <#1031257076065914930>\n\n**:pencil: | Want to join us?**\n\`•\` Learn how to in <#1017099269372657724>\n\n**:question: | Need help?**\n \`•\` Feel free to open a ticket in <#867160066704146482>\n\n${config.emojis.hypixel} [Hypixel Forum Post](https://dominance.cf/forums)${invis}${invis}🌐 [Website](https://dominance.cf/)`,
    );
  await textChannels["welcome"].send({
    content: member.toString(),
    embeds: [embed],
  });
}
