import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { chat, waitForMessage } from '../handlers/workerHandler.js';
import messageToImage from '../helper/messageToImage.js';
import config from '../config.json' assert { type: 'json' };
import { discordToUuid, isStaff } from '../helper/utils.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mutes the given user for a given amount of time.')
  .addStringOption((option) =>
    option.setName('name').setDescription('Minecraft Username').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) => option.setName('time').setDescription("Time e.g. ('1h' / '1d')").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  if (!(await isStaff(discordToUuid(interaction.user.id) ?? ''))) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> You do not have permission to use this command`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  const name = interaction.options.getString('name');
  const time = interaction.options.getString('time');

  if (await isStaff(name!)) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Error')
      .setDescription(`<a:across:986170696512204820> Guild staff cannot be muted through this command.`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  chat(`/g mute ${name} ${time}`);

  const receivedMessage = await waitForMessage(
    [
      'You cannot mute someone for less than a minute',
      `Invalid usage! '/guild mute <player/everyone> <time>'`,
      `${name} is not in your guild!`,
      'This player is already muted!',
      `${name} for ${time}`,
      `Can't find a player by the name of '${name}'`
    ],
    5000
  );

  if (!receivedMessage) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle('Caution')
      .setDescription(`<a:across:986170696512204820> Guild mute timed out.`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  await interaction.editReply({
    files: [
      await messageToImage(
        `§b-------------------------------------------------------------§r ${receivedMessage.motd} §b-------------------------------------------------------------`
      )
    ]
  });
}
