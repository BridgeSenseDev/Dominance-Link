const roles = {
  notifications: '789800580314824744', qotd: '829991529857810452', tournaments: '676497290084614155', events: '655711286755065856', minievents: '674710457826672641', talking: '956226601790615612', youtube: '956996151268241478',
};

module.exports = {
  execute: async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    } else if (interaction.isButton()) {
      const roleId = roles[interaction.customId];
      let msg;
      // eslint-disable-next-line no-underscore-dangle
      if (interaction.member._roles.includes(roleId)) {
        await interaction.member.roles.remove(roleId);
        msg = `<:minus:1005843963686686730> <@&${roleId}>`;
      } else {
        await interaction.member.roles.add(roleId);
        msg = `<:add:1005843961652453487> <@&${roleId}>`;
      }
      await interaction.reply({ content: msg, ephemeral: true });
    }
  },
};
