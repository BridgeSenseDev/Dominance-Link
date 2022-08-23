const roles = {
  notifications: '789800580314824744', qotd: '829991529857810452', tournaments: '676497290084614155', events: '655711286755065856', minievents: '674710457826672641', talking: '956226601790615612', youtube: '956996151268241478', twitch: '1010698416994656307', gexpparty: '872068100823068733', lbw: '964344698699415632', arcade: '903994956413300767', bedwars: '903995572392984576', blitz: '903995954800259184', buildbattle: '903996023138045952', classicgames: '903996067627040778', duels: '903996109096103986', housing: '1006057221462966303', megawalls: '987119811345657977', murdermystery: '903996153476046899', pit: '903996188930506762', skyblock: '903996220551360642', skywars: '903996253589880832', smashheroes: '903996286070587392', tnt: '903996313954299924', uhc: '903996345789083728',
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
