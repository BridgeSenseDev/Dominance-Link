const { EmbedBuilder } = require('discord.js');

module.exports = {
  execute: async (client, member) => {
    if (member.guild.id !== '242357942664429568') return;
    const embed = new EmbedBuilder()
      .setColor(0xfee65c)
      .setTitle(':wave: Welcome to Matrix!')
      .setDescription(`Welcome to the Matrix Community **${member.displayName}**!\n\n**Here's a list of things to help you \
      get started:**\n\n**<:rules:969478807927021599> | Community Info**\n\`•\`Learn about our community and rules in \
      <#741305186441494548>\n\n**:ballot_box_with_check: | Verification**\n\`•\` Verify using the \`/verify\` command \
      in <#907911357582704640>\n\n**:loudspeaker: | Announcements**\n\`•\` Stay up to date by checking out \
      <#628973562618707991>\n\n**:pencil: | Want to join us?**\n\`•\`Learn how to in <#498179573847031824>\n\n**:question: \
      | Need help?**\n \`•\` Feel free to open a ticket in <#867160066704146482>\n\n<:hypixel:968022561940209664> [Hypixel \
      Forum Post](https://bit.ly/MatrixForums) ㅤㅤ<:twitter:968021865064988742> [Twitter Page](https://twitter.com/MatrixHypixel)\
      ㅤㅤ<:twitch:968022010498273280> [Twitch Channel](https://www.twitch.tv/matrix_guild)`)
      .setImage('https://cdn.discordapp.com/attachments/986281342457237624/1001507558357471242/Screenshot_2022-04-29_152830.png');
    await member.send({ embeds: [embed] }).catch((() => {}));
  },
};
