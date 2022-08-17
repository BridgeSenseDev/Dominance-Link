const {
  Client, GatewayIntentBits, EmbedBuilder,
} = require('discord.js');
const config = require('../config.json');
const { formatDate } = require('../helper/utils');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  rest: { rejectOnRateLimit: (rateLimitData) => rateLimitData },
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const rulesEmbed = new EmbedBuilder()
    .setColor(0x206694)
    .setAuthor({ name: 'Server Rules', iconURL: config.guild.icon })
    .setDescription('════ ⋆★⋆ ════\n\n**[General Rules]**\n• Discord alts are forbidden\n• Follow [Discord TOS](https://discord.com/terms) and \
    [Hypixel Rules](http://hypixel.net/rules)\n• No harassment or toxicity\n• No racism or politics\n• All kinds of NSFW are not allowed\n• No spamming / mass \
    pinging\n• No DDoSing / doxing\n\n════ ⋆★⋆ ════\n\n**[Chat Rules]**\n• No sending watchdog reports in discord / guild chat\n• No unsolicited chat advertising\n\
    • Chat in the correct channels\n• No overuse of bad language\n• No discussion of inappropriate topics\n• No talking about self-harm, or other deeply negative \
    experiences\n\n════ ⋆★⋆ ════\n\n**[Punishments]**\nFirst offense: 12 hour mute + warning\nSecond offense: 24 hour mute + warning\nThird offense: 48 hour mute \
    + warning\nFourth offense: Kick from the guild / discord\n\n**When reporting, contact a staff member and NEVER public shame**\n\nWarnings will be issued before \
    mutes in light cases\n\nYou will be muted if you continue after receiving a warning\nWhen muted, you *should* get a DM from staff with the reason\n\n════ ⋆★⋆ ════')
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });

  const guideEmbed = new EmbedBuilder()
    .setColor(0x206694)
    .setAuthor({ name: 'Matrix Guide', iconURL: config.guild.icon })
    .setDescription(`════ ⋆★⋆ ════\n\n**[FAQ]**\n\`Q:\` **How many times can i rejoin the guild?**\n> There is no limit, but you have to wait before reapplying\n\n\
    \`Q:\` **Where can i apply?**\n> Discord / Google Forms, info in <#672129456575610900>\n\n\`Q:\` **How do i rankup once in the guild?**\n> Learn about guild ranks in \
    <#660448787147390977>\n\n\`Q:\` **How much GEXP do i need to get every week?**\n> ${config.guild.gexpReq} GEXP per week\n\n\`Q:\` **Can public members participate in \
    events**?\n> Yes\n\n════ ⋆★⋆ ════\n\n**[Socials]**\n<:discord:963609407390883860> [Discord Invite](https://bit.ly/DiscordMatrix)\n<:twitter:968021865064988742> \
    [Twitter](https://twitter.com/MatrixHypixel)\n<:twitch:968022010498273280> [Twitch Channel](https://www.twitch.tv/matrix_guild)\n<:hypixel:968022561940209664> \
    [Hypixel Forum Post](https://bit.ly/MatrixForums)\n\n════ ⋆★⋆ ════\n\n**[Guild Capes]**\n:white_large_square: [Light Background Cape](https://bit.ly/3Klyt79)\n\
    :black_large_square: [Dark Background Cape](https://bit.ly/3ueDmte)\n:purple_square: [Pink Cape](https://bit.ly/3jb0nXz)\n:yellow_square: [Yellow Cape White \
    Background](https://bit.ly/3udsd) (By @Lennos#3244)\n:yellow_square: [Yellow Cape Black Background](https://bit.ly/3Jdkajx) (By @Lennos#3244)\n\n════ ⋆★⋆ ════`)
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    })
    .setImage('https://cdn.discordapp.com/attachments/986281342457237624/1001507558357471242/Screenshot_2022-04-29_152830.png');

  const channel = client.channels.cache.get('741305186441494548');
  await channel.send({ embeds: [rulesEmbed, guideEmbed] });
});

client.login(config.keys.discordBotToken);
