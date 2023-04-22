import { Client, EmbedBuilder, GuildMember, Role } from 'discord.js';
import Database from 'better-sqlite3';
import config from '../../config.json' assert { type: 'json' };
import { invis, roles } from '../../helper/constants.js';
import { channels } from './ready.js';
import { hypixelRequest } from '../../helper/utils.js';
import { DiscordMember } from '../../types/global.d.js';

const db = new Database('guild.db');

export default async function execute(client: Client, member: GuildMember) {
  if (member.guild.id !== '242357942664429568') return;
  if (db.prepare('SELECT * FROM members WHERE discord = ?').get(member.user.id)) {
    let name;
    let disc;
    const { uuid } = db.prepare('SELECT * FROM members WHERE discord = ?').get(member.user.id) as DiscordMember;
    const { player } = await hypixelRequest(`https://api.hypixel.net/player?uuid=${uuid}`);
    try {
      name = player.displayname;
      disc = player.socialMedia.links.DISCORD;
    } catch (e) {
      return;
    }
    if (disc === member.user.tag) {
      const { guild } = await hypixelRequest(`https://api.hypixel.net/guild?player=${uuid}`);
      if (guild && guild.name_lower === 'dominance') {
        db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(member.user.id, uuid);
        await member.roles.add(member.guild!.roles.cache.get(roles['[Member]']) as Role);
      }
      await member.setNickname(name);
      await member.roles.add(member.guild!.roles.cache.get(roles.verified) as Role);
      await member.roles.remove(member.guild!.roles.cache.get(roles.unverified) as Role);
    }
  }

  const embed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setTitle(':wave: Welcome to Dominance!')
    .setDescription(
      `Welcome to the Dominance Community **${member.displayName}**!\n\n**Here's a list of things to help you ` +
        `get started:**\n\n**<:rules:969478807927021599> | Community Info**\n\`•\` Learn about our community and rules in ` +
        `<#1031245971662835834>\n\n**:ballot_box_with_check: | Verification**\n\`•\` Verify by clicking the verify button ` +
        `in <#1031568019522072677>\n\n**:loudspeaker: | Announcements**\n\`•\` Stay up to date by checking out ` +
        `<#1031257076065914930>\n\n**:pencil: | Want to join us?**\n\`•\` Learn how to in <#1017099269372657724>\n\n**:question: ` +
        `| Need help?**\n \`•\` Feel free to open a ticket in <#867160066704146482>\n\n<:hypixel:968022561940209664> [Hypixel ` +
        `Forum Post](https://dominance.cf/forums)${invis}${invis}<:twitter:968021865064988742> [Twitter Page](https://twitter.com/` +
        `MatrixHypixel)${invis}${invis}🌐 [Website](https://dominance.cf/)`
    );
  await channels.welcome.send({ content: member.toString(), embeds: [embed] });
}
