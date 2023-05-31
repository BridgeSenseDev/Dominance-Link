import { ChannelType, Client, VoiceState } from 'discord.js';
import { voiceChannels } from './ready.js';
import { discordToUuid, uuidToName } from '../../helper/utils.js';

export default async function execute(client: Client, oldState: VoiceState, newState: VoiceState): Promise<void> {
  if (oldState.channelId !== newState.channelId && newState.member) {
    if (newState.channel === voiceChannels.createVc) {
      const uuid = discordToUuid(newState.member.id) ?? '';
      const name = (await uuidToName(uuid)) ?? newState.member.displayName ?? 'Unknown';
      const newChannel = await newState.guild.channels.create({
        name: `${name}'s Channel`,
        type: ChannelType.GuildVoice,
        parent: voiceChannels.createVc.parent,
        position: newState.channel.position + 3
      });
      await newState.member.voice.setChannel(newChannel);
    }
  }

  if (oldState.channel) {
    if (oldState.channel.members.size === 0 && oldState.channel.name.endsWith("'s Channel")) {
      await oldState.channel.delete();
    }
  }
}
