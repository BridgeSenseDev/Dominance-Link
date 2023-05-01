import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { bullet, dividers, invis, sub } from '../helper/constants.js';
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
  const rulesEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Server Rules', iconURL: config.guild.icon })
    .setDescription(
      `**General Rules:**\n\n${bullet} Discord alts are forbidden\n${bullet} Follow [Discord TOS](https://discord.com/terms) and ` +
        `[Hypixel Rules](https://hypixel.net/rules)\n${bullet} No harassment or toxicity\n${bullet} No racism or politics\n${bullet} ` +
        `All kinds of NSFW are not allowed\n${bullet} No spamming / mass pinging\n${bullet} No DDoSing / doxing\n\n${dividers(22)}\n\n` +
        `**Chat Rules:**\n\n${bullet} No unsolicited chat advertising\n${bullet} Chat in the correct channels\n${bullet} No overuse of ` +
        `bad language\n${bullet} No discussion of inappropriate topics\n${bullet} No talking about self-harm / other deeply negative ` +
        `experiences\n${bullet} No pinging staff members without valid reason`
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    });

  const guideEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Dominance Guide', iconURL: config.guild.icon })
    .setDescription(
      `**FAQ:**\n\n${bullet} **How many times can I rejoin the guild?**\n${invis}${sub} There is no limit, but you have to wait ` +
        `before reapplying\n\n${bullet} **Where can I apply?**\n${invis}${sub}<#1017099269372657724>\n\n${bullet} **How do I rankup ` +
        `once in the guild?**\n${invis}${sub} Learn about guild ranks in <#660448787147390977>\n\n${bullet} **How much GEXP do I need ` +
        `to get every week?**\n${invis}${sub} ${config.guild.gexpReq} GEXP per week\n\n${bullet} **Can public members participate in ` +
        `events**?\n${invis}${sub} Yes\n\n${dividers(22)}\n\n** Socials:**\n\n<:discord:963609407390883860> [Discord Invite]` +
        `(https://dominance.cf/discord)\n<:twitter:968021865064988742> [Twitter](https://twitter.com/MatrixHypixel)\n🌐 ` +
        `[Website](https://dominance.cf/)\n<:hypixel:968022561940209664> [Hypixel Forum Post](https://dominance.cf/forums)`
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    })
    .setImage(config.guild.banner);

  const channel = client.channels.cache.get('1031245971662835834') as TextChannel;
  await channel.send({ embeds: [rulesEmbed, guideEmbed] });
});

client.login(config.keys.discordBotToken);
