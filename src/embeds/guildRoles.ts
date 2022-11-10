import { Client, GatewayIntentBits, EmbedBuilder, ChannelType } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { formatDate } from '../helper/utils.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', async () => {
  // eslint-disable-next-line no-console
  console.log(`[DISCORD] Logged in as ${client.user.tag}`);
  const verifyEmbed = new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setAuthor({
      name: 'Guild Roles',
      iconURL: 'https://cdn.discordapp.com/attachments/986281342457237624/1029652686624268328/1288-discord-role.png'
    })
    .setDescription(
      '════ ⋆★⋆ ════\n\n**[Staff Roles]**\n`-` <@&1016513036313448579> | Our current Owner, <@814456051080495155>\n' +
        '`-` <@&1028376729611411526> | Leaders and senior members of our staff team\n`-` <@&1029049249377296516> | Helps invite new ' +
        'members to our guild\n`-` <@&1028318704506781746> | Hosts fun events for our guild and public members\n`-` <@&809316106405806090> ' +
        '| People who make me and this discord possible\n\n════ ⋆★⋆ ════\n\n**[Guild Member Roles]**\n`-` <@&422058505781116928> | ' +
        '500 Days in the guild\n`-` <@&439781938572820480> | 250k Weekly GEXP\n`-` <@&950083054326677514> | 200k Weekly GEXP\n`-` ' +
        '<@&753172820133150772> | 100k Weekly GEXP'
    )
    .setFooter({
      text: `Updated ${formatDate(new Date())}`,
      iconURL: config.guild.icon
    });

  const channel = client.channels.cache.get('660448787147390977');
  if (channel?.type === ChannelType.GuildText) {
    await channel.send({ embeds: [verifyEmbed] });
  }
});

client.login(config.keys.discordBotToken);
