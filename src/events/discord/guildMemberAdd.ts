import { Client, EmbedBuilder, GuildMember, Role } from 'discord.js';
import Database from 'better-sqlite3';
import { Guild } from 'hypixel-api-reborn';
import config from '../../config.json' assert { type: 'json' };
import { invis } from '../../helper/constants.js';
import { textChannels } from './ready.js';
import { hypixel } from '../../index.js';
import { fetchMember } from '../../handlers/databaseHandler.js';

const db = new Database('guild.db');

export default async function execute(client: Client, member: GuildMember) {
  if (member.guild.id !== '242357942664429568') return;

  const memberData = fetchMember(member.id);
  if (memberData) {
    const { uuid } = memberData;
    const player = await hypixel.getPlayer(uuid);

    const discord = player.socialMedia.find((media) => media.name === 'Discord')?.link;

    if (discord === member.user.tag) {
      const guild = (await hypixel.getGuild('player', uuid, {}).catch(() => {
        /* empty */
      })) as Guild;

      if (guild?.name?.toLowerCase() === 'dominance') {
        db.prepare('UPDATE guildMembers SET discord = ? WHERE uuid = ?').run(member.user.id, uuid);
        await member.roles.add(member.guild!.roles.cache.get(config.roles.slayer) as Role);
      }
      await member.setNickname(player.nickname);
      await member.roles.add(member.guild!.roles.cache.get(config.roles.verified) as Role);
      await member.roles.remove(member.guild!.roles.cache.get(config.roles.unverified) as Role);
    }
  }

  const embed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setTitle(':wave: Welcome to Dominance!')
    .setDescription(
      `Welcome to the Dominance Community **${member.displayName}**!\n\n**Here's a list of things to help you ` +
        `get started:**\n\n**${config.emojis.rules} | Community Info**\n\`•\` Learn about our community and rules in ` +
        `<#1031245971662835834>\n\n**:ballot_box_with_check: | Verification**\n\`•\` Verify by clicking the verify button ` +
        `in <#1031568019522072677>\n\n**:loudspeaker: | Announcements**\n\`•\` Stay up to date by checking out ` +
        `<#1031257076065914930>\n\n**:pencil: | Want to join us?**\n\`•\` Learn how to in <#1017099269372657724>\n\n**:question: ` +
        `| Need help?**\n \`•\` Feel free to open a ticket in <#867160066704146482>\n\n${config.emojis.hypixel} [Hypixel ` +
        `Forum Post](https://dominance.cf/forums)${invis}${invis}🌐 [Website](https://dominance.cf/)`
    );
  await textChannels.welcome.send({ content: member.toString(), embeds: [embed] });
}
