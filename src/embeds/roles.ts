import { EmbedBuilder } from 'discord.js';
import config from '../config.json' assert {type: 'json'};

export default async function roles(client, channelId) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.discordGray)
    .setAuthor({ name: 'Roles Info', iconURL: config.guild.icon })
    .addFields(
      {
        name: '<a:economy:1006182871314219169> Economy Roles',
        value: '`-` <@&348938634227089411>\n`-` <@&348946342707462144>\n`-` <@&349212066164244480>\n`-` <@&457922084601856002>\n'
          + '`-` <@&465226964677165056>\n`-` <@&477063574309830667>\n`-` <@&488352345613271070>\n`-` <@&488352447819939861>\n'
          + '`-` <@&488352481634418710>\n`-` <@&488352526110818304>\n`-` <@&488352546579152907>\n`-` <@&488352576568557568>\n'
          + '`-` <@&488352607807733791>\n`-` <@&488352623884500992>\n`-` <@&488352639671599125>\n`-` <@&800074267944681512>',
        inline: true,
      },
      {
        name: '<:mention:913408059425058817> Gamemode Ranks',
        value: '**Request roles in <#985624536265416767> / make a ticket**\n`-` <@&998657309846802432> | 15+ Stars\n`-` '
          + '<@&998659208427884634> | 25+ Stars\n`-` <@&998658850649542727> | 5k+ Wins\n`-` <@&998665819955404920> | 10k+ Wins\n`-` '
          + '<@&998657747606319244> | 500m+ Networth, 35+ Skill Average\n`-` <@&998665889568268370> | 1b+ Networth, 45+ Skill Average'
          + '\n`-` <@&998931115551248435> | 6k+ Wins\n`-` <@&998667281208987678> | 15k+ Wins\n`-` <@&998666895635001404> | 200+ Hypixel '
          + 'Level\n`-` <@&996831106454270102> | 250+ Hypixel Level\n`-` <@&965374934564098109> | 6.5k+ A.P.\n`-` <@&998932384089120789> '
          + '| 10k+ A.P.\n`-` <@&989254751822684201> | 100+ Stars, 500+ Wins\n`-` <@&989255125870735420> | 150+ Stars, 750+ Wins\n`-` '
          + '<@&989255372026036296> | 175+ Stars, 1000+ Wins\n`-` <@&1001480839110070312> | 300+ Stars, 2500+ Wins\n`-` '
          + '<@&998934960192897064> | Collect all "Pro" gamemode ranks',
        inline: true,
      },
      {
        name: '\u200B', value: '\u200B', inline: false,
      },
      {
        name: '<a:talking:1004962079154896967> Discord Activity Roles',
        value: '`-` <@&755123236114792468>\n`-` <@&755122545488822534>\n`-` <@&919717471936729139>\n`-` <@&932284834791960628>\n`-` '
          + '<@&755122903640440954>\n`-` <@&919688791361466368>\n`-` <@&932285662751756338>\n`-` <@&932285657903161374>\n`-` '
          + '<@&932285654266683442>\n`-` <@&755123430256279633>\n`-` <@&932285660688175144>\n`-` <@&932285662202318908>',
        inline: true,
      },
      {
        name: '<:staff:1006186955941347419> Ex Matrix Member Roles',
        value: '`-` <@&807955811250733076> | Was in guild for 6+ months\n`-` <@&910315929160781825> | Must have been staff for over '
          + 'a year\n`-` <@&817133925834162177>',
        inline: true,
      },
    );
  const channel = client.channels.cache.get(channelId);
  await channel.send({ embeds: [embed] });
}
