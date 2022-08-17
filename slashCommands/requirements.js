const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

const validSkills = ['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'];

function skillAverage(skills) {
  let levels = 0;
  for (const i in skills) {
    if (validSkills.includes(i)) {
      levels += skills[i].level;
    }
  }
  return levels / 8;
}

function weeklyGexp(members, uuid) {
  let weeklyGexp = 0;
  for (const i in members) {
    if (uuid === members[i].uuid) {
      for (let j = 0; j < 7; j += 1) {
        weeklyGexp += (Object.values(members[i].expHistory)[j]);
      }
    }
  }
  return weeklyGexp;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reqs')
    .setDescription('Check if you meet our guild requirements')
    .addStringOption((option) => option.setName('ign')
      .setDescription('Your minecraft username')
      .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    let uuid; let player; let name; let skyblockData; let guildData; let guild;
    let bedwars; let duels; let skywars; let skyblock;
    const ign = interaction.options.getString('ign');
    try {
      uuid = (await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${ign}`)).json()).id;
      ({ player } = await (await fetch(`https://api.hypixel.net/player?key=${config.keys.hypixelApiKey}&uuid=${uuid}`)).json());
      name = player.displayname;
      skyblockData = (await (await fetch(`http://192.168.1.119:3000/v1/profiles/${name}?key=matrixlink`)).json());
      guildData = (await (await fetch(`https://api.hypixel.net/guild?key=${config.keys.hypixelApiKey}&player=${uuid}`)).json()).guild;
    } catch (e) {
      const embed = new EmbedBuilder()
        .setColor(0xe74d3c)
        .setTitle('Error')
        .setDescription(`<a:across:986170696512204820> **${ign}** is an invalid IGN`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Get player data
    try {
      bedwars = [player.achievements.bedwars_level, Math.round((
        player.stats.Bedwars.final_kills_bedwars / player.stats.Bedwars.final_deaths_bedwars)
        * 100) / 100];
    } catch (e) {
      bedwars = ['No Bedwars Data', 'No Bedwars Data'];
    }
    if (bedwars[0] === undefined) {
      bedwars = ['No Bedwars Data', 'No Bedwars Data'];
    }

    try {
      duels = [player.stats.Duels.wins, Math.round((player.stats.Duels.wins
        / player.stats.Duels.losses) * 100) / 100];
    } catch (e) {
      duels = ['No Duels Data', 'No Duels Data'];
    }
    if (duels[0] === undefined) {
      duels = ['No Duels Data', 'No Duels Data'];
    }

    try {
      skywars = [player.stats.SkyWars.levelFormatted, Math.round((player.stats.SkyWars.kills
        / player.stats.SkyWars.deaths) * 100) / 100];
    } catch (e) {
      skywars = ['No SkyWars Data', 'No SkyWars Data'];
    }
    if (skywars[0] === undefined) {
      skywars = ['No SkyWars Data', 'No SkyWars Data'];
    }

    try {
      skyblock = [skyblockData.networth.total_networth, skillAverage(skyblockData.skills)];
    } catch (e) {
      skyblock = ['No Skyblock Data / API Disabled', 'No Skyblock Data / API Disabled'];
    }

    try {
      guild = [guildData.name, weeklyGexp(guildData.members, uuid)];
    } catch (e) {
      guild = ['None', 'Not in a guild'];
    }

    // Check requirements
    let requirements = '';
    let meetingReqs = false;
    let author; let color;

    if (bedwars[0] > 200 && bedwars[1] > 3 && bedwars[0] !== 'No Bedwars Data') {
      meetingReqs = true;
      requirements += ':green_circle: You meet our **Bedwars Requirements!**\n';
    } else {
      requirements += ':red_circle: You don\'t meet our **Bedwars Requirements!**\n';
    }
    if (bedwars[0] === 'No Bedwars Data') {
      requirements += '<a:across:986170696512204820> **Bedwars Stars:** `No Bedwars Data`\n<a:across:986170696512204820> **Bedwars FKDR:** `No Bedwars Data`\n\n';
    } else {
      if (bedwars[0] > 200) {
        requirements += `<a:atick:986173414723162113> **Bedwars Stars:** \`${bedwars[0]}\`\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Bedwars Stars:** \`${bedwars[0]} / 300\`\n`;
      }
      if (bedwars[1] > 3) {
        requirements += `<a:atick:986173414723162113> **Bedwars FKDR:** \`${bedwars[1]}\`\n\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Bedwars FKDR:** \`${bedwars[1]} / 3\`\n\n`;
      }
    }

    if (duels[0] > 10000 && duels[1] > 2 && duels[0] !== 'No Duels Data') {
      meetingReqs = true;
      requirements += ':green_circle: You meet our **Duels Requirements!**\n';
    } else {
      requirements += ':red_circle: You don\'t meet our **Duels Requirements!**\n';
    }
    if (duels[0] === 'No Duels Data') {
      requirements += '<a:across:986170696512204820> **Duels Wins:** `No Duels Data`\n<a:across:986170696512204820> **Duels WLR:** `No Duels Data`\n\n';
    } else {
      if (duels[0] > 10000) {
        requirements += `<a:atick:986173414723162113> **Duels Wins:** \`${duels[0]}\`\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Duels Wins:** \`${duels[0]} / 10,000\`\n`;
      }
      if (duels[1] > 2) {
        requirements += `<a:atick:986173414723162113> **Duels WLR:** \`${duels[1]}\`\n\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Duels WLR:** \`${duels[1]} / 2\`\n\n`;
      }
    }

    if (skywars[0] > 10000 && skywars[1] > 2 && skywars[0] !== 'No SkyWars Data') {
      meetingReqs = true;
      requirements += ':green_circle: You meet our **Skywars Requirements!**\n';
    } else {
      requirements += ':red_circle: You don\'t meet our **Skywars Requirements!**\n';
    }
    if (skywars[0] === 'No SkyWars Data') {
      requirements += '<a:across:986170696512204820> **Skywars Stars:** `No Skywars Data`\n<a:across:986170696512204820> **Skywars KDR:** `No Skywars Data`\n\n';
    } else {
      if (skywars[0] > 10000) {
        requirements += `<a:atick:986173414723162113> **Skywars Stars:** \`${skywars[0]}\`\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Skywars Stars:** \`${skywars[0]} / 12☆\`\n`;
      }
      if (skywars[1] > 1.5) {
        requirements += `<a:atick:986173414723162113> **Skywars KDR:** \`${skywars[1]}\`\n\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Skywars KDR:** \`${skywars[1]} / 1.5\`\n\n`;
      }
    }

    if (skyblock[0] > 500000000 && skyblock[1] > 30 && skyblock[0] !== 'No Skyblock Data / API Disabled') {
      meetingReqs = true;
      requirements += ':green_circle: You meet our **Skyblock Requirements!**\n';
    } else {
      requirements += ':red_circle: You don\'t meet our **Skyblock Requirements!**\n';
    }
    if (skyblock[0] === 'No Skyblock Data / API Disabled') {
      requirements += '<a:across:986170696512204820> **Skyblock Networth:** `No Skyblock Data / API Disabled`\n<a:across:986170696512204820> **Skyblock Skill \
      Average:** `No Skyblock Data / API Disabled`\n\n';
    } else {
      if (skyblock[0] > 10000) {
        requirements += `<a:atick:986173414723162113> **Skyblock Networth:** \`${skyblock[0]}\`\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Skyblock Networth:** \`${skyblock[0]} / 500m\`\n`;
      }
      if (skyblock[1] > 2) {
        requirements += `<a:atick:986173414723162113> **Skyblock Skill Average:** \`${skyblock[1]}\`\n\n`;
      } else {
        requirements += `<a:across:986170696512204820> **Skyblock Skill Average:** \`${skyblock[1]} / 30\`\n\n`;
      }
    }

    if (guild[1] > config.guild.gexpReq && guild[0] !== 'None') {
      meetingReqs = true;
      requirements += `:green_circle: You meet our **GEXP Requirements!**\n<a:atick:986173414723162113> **Weekly GEXP** \`${guild[1]}\`\n`;
    } else if (guild[0] === 'None') {
      requirements += ':red_circle: You don\'t meet our **GEXP Requirements!**\n<a:across:986170696512204820> **Weekly GEXP:** `Not in a guild`\n';
    } else {
      requirements += `:red_circle: You don't meet our **GEXP Requirements!**\n<a:across:986170696512204820> **Weekly GEXP:** \`${guild[1]}\` / \`150k\`\n`;
    }

    if (meetingReqs) {
      author = `${name} meets Matrix requirements!`;
      color = 0x2ecc70;
    } else {
      author = `${name} does not meet Matrix requirements!`;
      color = 0xe74d3c;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: author, iconURL: config.guild.icon })
      .setDescription(`**Current Guild:** \`${guild[0]}\`\n\n${requirements}`)
      .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=160&default=MHF_Steve&overlay&id=c5d2e47fddf04254900423bb014ff1cd`);
    await interaction.editReply({ embeds: [embed] });
  },
};
