import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  type TextChannel,
} from "discord.js";
import config from "../config.json" assert { type: "json" };
import { bullet, dividers, invis, sub } from "../helper/constants.js";
import { formatDate } from "../helper/utils.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on("ready", async () => {
  console.log(`[DISCORD] Logged in as ${client.user?.tag}`);
  const requirementsEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: "Guild Requirements", iconURL: config.guild.icon })
    .setDescription(
      `**We have NO GEXP requirements\nClick the button below to check if you meet our requirements**\n\n${dividers(
        23,
      )}\n\n**Requirements: **\n\n**You can join if you meet at least one of these requirements:**\n${bullet}**\
				Achievement Points**\n${invis}${sub} \`9,000\` Achievement Points\n${bullet}**Bedwars 1**\n${invis}${sub} \
				\`500\` Stars\n${invis}${sub} \`3\` FKDR\n${bullet}**Bedwars 2**\n${invis}${sub} \`150\` Stars\n${invis}${sub}\
				\`5\` FKDR\n${bullet}**Duels 1**\n${invis}${sub} \`10,000\` Wins\n${invis}${sub} \`2\` WLR\n${bullet}**Duels \
				2**\n${invis}${sub} \`5,000\` Wins\n${invis}${sub} \`3\` WLR\n${bullet}**Skywars 1**\n${invis}${sub} \`15\` \
				Stars\n${invis}${sub} \`1\` KDR\n${bullet}**Skywars 2**\n${invis}${sub} \`10\` Stars\n${invis}${sub} \`1.5\`\
				 KDR\n${bullet}**Skyblock (API ON)**\n${invis}${sub} \`3b\` Networth\n${invis}${sub} \`40\` Skill Average`,
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });

  const requirementsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("requirements")
      .setLabel("Check Requirements")
      .setStyle(ButtonStyle.Success)
      .setEmoji(config.emojis.aTick),
  );

  const applicationsEmbed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: "Applications", iconURL: config.guild.icon })
    .setDescription(
      `**Click the button below to apply**\nYou **WILL NOT** get a response if rejected and your dms are closed\n\n\
			${dividers(23)}\n\n**Rejoining:**\n\n${bullet} If your application gets rejected wait **3 weeks** \
			before reapplying\n${bullet} Wait **1 month** before reapplying if you get kicked / leave\n${bullet} Wait **2 \
			months** before reapplying if you get kicked within a month\n${bullet} You can reapply **unlimited** times\n\n\
			${dividers(
        23,
      )}\n\n**What You Could Get Denied For:**\n\n${bullet} Having an offensive mc name/profile\n${bullet} Being \
			toxic\n${bullet} Being a known cheater\n${bullet} Not writing enough on your application\n${bullet} Not meeting\
			 our requirements\n${bullet} Being a guild hopper`,
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon,
    });

  const applicationsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("apply")
      .setLabel("Apply")
      .setStyle(ButtonStyle.Success)
      .setEmoji(config.emojis.aCheckmark),
  );

  const channel = client.channels.cache.get(
    "1017099269372657724",
  ) as TextChannel;
  await channel.send({
    components: [requirementsRow],
    embeds: [requirementsEmbed],
  });
  await channel.send({
    components: [applicationsRow],
    embeds: [applicationsEmbed],
  });
});

client.login(config.keys.discordBotToken);
