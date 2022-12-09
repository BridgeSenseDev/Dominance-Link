import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextChannel
} from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
  const requirementsEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Guild Requirements', iconURL: config.guild.icon })
    .setDescription(
      `**Our current GEXP requirement is \`${config.guild.gexpReq}\` per week\nClick the button below to check if you \
    meet our requirements**\n\n════ ⋆★⋆ ════\n\n**[Requirements]**\n**You can join if you meet at least one of these requirements:**\n\
    \`Achievement Points\`\n\`-\` 9,000 Achievement Points\n\`Bedwars 1\`\n\`-\` 300 Stars\n\`-\` 2 FKDR\n\`Bedwars 2\`\n\`-\` 150 \
    Stars\n\`-\` 5 FKDR\n\`Duels 1\`\n\`-\` 6,500 Wins\n\`-\` 2 WLR\n\`Duels 2\`\n\`-\` 3,000 Wins\n\`-\` 4 WLR\n\`Skywars 1\`\n\`-\` 12 Stars\n\`-\` \
    1 KDR\n\`Skywars 2\`\n\`-\` 10 Stars\n\`-\` 1.5 KDR\n\`Skyblock (API On)\`\n\`-\` 500m Networth\n\`-\` 25 Skill Average\n\n\
    ════ ⋆★⋆ ════`
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    });

  const requirementsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('requirements')
      .setLabel('Check Requirements')
      .setStyle(ButtonStyle.Success)
      .setEmoji('a:checkmark:1011799454959022081')
  );

  const applicationsEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Applications', iconURL: config.guild.icon })
    .setDescription(
      "**Click the button below to apply**\nYou **WILL NOT** get a response if you're rejected and your dm's are closed" +
        '\n\n════ ⋆★⋆ ════\n\n**[Rejoining]**\n`-` If your application gets rejected wait **3 weeks** before reapplying\n`-` Wait ' +
        '**1 month** before reapplying if you get kicked / leave\n`-` Wait **2 months** before reapplying if you get kicked within a ' +
        'month\n`-` You can reapply **unlimited** times\n\n════ ⋆★⋆ ════\n\n**[What You Could Get Denied For]**\n`1` Having an offensive ' +
        'mc name/profile\n`2` Being toxic\n`3` Being a known cheater\n`4` Not writing enough on your application\n`5` Not meeting our ' +
        'requirements\n`6` Being a guild hopper\n\n════ ⋆★⋆ ════'
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    });

  const applicationsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('apply')
      .setLabel('Apply')
      .setStyle(ButtonStyle.Success)
      .setEmoji('a:checkmark:1011799454959022081')
  );

  const channel = client.channels.cache.get('1017099269372657724') as TextChannel;
  await channel.send({ components: [requirementsRow], embeds: [requirementsEmbed] });
  await channel.send({ components: [applicationsRow], embeds: [applicationsEmbed] });
});

client.login(config.keys.discordBotToken);
