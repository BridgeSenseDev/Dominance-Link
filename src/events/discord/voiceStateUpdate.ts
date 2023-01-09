import { ChannelType, Client, Collection, GuildMember, VoiceState } from 'discord.js';
import { channels } from './ready.js';

export default async function execute(client: Client, oldState: VoiceState, newState: VoiceState) {
  if (newState.guild.channels.cache.some(channel => channel.type === ChannelType.GuildVoice && channel.members.has(client.user!.id))) {
    newState.guild.channels.cache.forEach((channel) => {
      if (!channel.isVoiceBased()) return
      for (const member of  channel.members as Collection<string, GuildMember>) {
        if (member[1].id !== client.user!.id) continue;
        if (channel.members.size > 1) {
          const queue = client.distube.getQueue(newState.guild);
          if (queue === undefined) return;
          if (queue.paused) {
            queue.resume(newState.guild);
          }
        } else if (channel.members.size === 1) {
          const queue = client.distube.getQueue(newState.guild);
          if (queue === undefined) return;
          if (!queue.paused) {
            queue.pause(newState.guild);
          }
        }
      }
    })
  } else {
    await client.distube.play(
      channels.music,
      'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=86cc479f1d954174'
    );
    client.distube.getQueue(channels.music.guild).setRepeatMode(2);
    await client.distube.shuffle(channels.music.guild);
  }
}
