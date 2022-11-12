import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
  console.log(`[DISCORD] Logged in as ${client.user!.tag}`);
  const verifyEmbed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setAuthor({
      name: 'Upvotes',
      iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1029771493749559336/1375-upvote.png'
    })
    .setDescription(
      'By upvoting our server, you will not only help support us but also receive a special role!\n`-` ' +
        '[DISBOARD](https://disboard.org/nl/dashboard/servers)\n`-` [Top.gg](https://top.gg/servers/242357942664429568/vote)'
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    });

  const channel = client.channels.cache.get('757377294045282425') as TextChannel;
  await channel.send({ embeds: [verifyEmbed] });
});

client.login(config.keys.discordBotToken);
