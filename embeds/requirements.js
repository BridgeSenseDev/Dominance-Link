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
  const embed = new EmbedBuilder()
    .setColor(0x206694)
    .setAuthor({ name: 'Guild Requirements', iconURL: config.guild.icon })
    .setDescription(`**By joining our guild you accept all our guild rules\nOur current GEXP requirement is \`${config.guild.gexpReq}\` per week**\n\n════ ⋆★⋆ ════\n\n**\
    [Requirements]**\n**Use \`/reqs\` in <#746069031102054500> to check if you meet our guild requirements!\nYou have to meet at least one of the following categories of \
    requirements to join:**\n\`Bedwars\`\n\`-\` 200 Stars\n\`-\` 3 FKDR\n\`Duels\`\n\`-\` 10k Wins\n\`-\` 2 WLR\n\`Skywars\`\n\`-\` 12 Stars\n\`-\` 1.5 KDR\n\
    \`Skyblock (API On)\`\n\`-\` 500m Networth\n\`-\` 30 Skill Average\n\`GEXP\`\n\`-\` Proof of earning \`${config.guild.gexpReq}\` GEXP in a week\n\n════ ⋆★⋆ ════\n\n**\
    [Applications]**\n\`-\` If your application gets rejected wait **1 week** before reapplying\n\`-\` Wait **1 month** before reapplying if you get kicked / leave\n\`-\` \
    Wait **2 months** before reapplying if you get kicked within a month\n\`-\` You can rejoin **unlimited** times\n\`-\` **We don't accept weekend players**\n\`-\` You can \
    apply in <#672129456575610900>\n\n════ ⋆★⋆ ════\n\n**[What You Could Get Rejected For]**\n\`1\` Having an offensive mc name/profile\n\`2\` Being toxic\n\`3\` Being a \
    known hacker/cheater\n\`4\` Not writing enough on your application\n\`5\` Not meeting our requirements\n\`6\` Being a guild hopper\n\n════ ⋆★⋆ ════\n\n**[General Info]**\n\
    \`-\` You can fill in a break form if you aren't able to meet GEXP reqs\n\`-\` If you have questions/concerns, feel free to DM any staff member\n\`-\` Your discord \
    nickname must match your in game name\n\`-\` You can check your GEXP by doing \`/g member IGN\` in <#746069031102054500>\n\`-\` Afking gamemodes is at your own risk\
    \n\n════ ⋆★⋆ ════`)
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });
  const channel = client.channels.cache.get('498179573847031824');
  await channel.send({ embeds: [embed] });
});

client.login(config.keys.discordBotToken);
