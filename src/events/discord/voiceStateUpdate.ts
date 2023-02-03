import { ChannelType, Client, VoiceState } from 'discord.js';
import { sleep } from '../../helper/utils.js';
import { channels } from './ready.js';

export default async function execute(client: Client, oldState: VoiceState, newState: VoiceState) {
  if (
    newState.guild.channels.cache.some(
      (channel) => channel.type === ChannelType.GuildVoice && channel.members.has(client.user!.id)
    )
  ) {
    for (const channel of Array.from(newState.guild.channels.cache.values())) {
      if (!channel.isVoiceBased()) return;
      for (const member of Array.from(channel.members.values())) {
        if (member.id !== client.user!.id) continue;
        if (channel.members.size > 1) {
          const queue = client.distube.getQueue(newState.guild);
          if (!queue) return;
          if (queue.paused) {
            queue.resume(newState.guild);
          }
        } else if (channel.members.size === 1) {
          const queue = client.distube.getQueue(newState.guild);
          if (!queue) return;
          if (!queue.paused) {
            queue.pause(newState.guild);
          }
        }
      }
    }
  } else {
    await sleep(5000);
    await client.distube.play(
      channels.music,
      'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=86cc479f1d954174'
    );
    client.distube.getQueue(channels.music.guild).setRepeatMode(2);
    await client.distube.shuffle(channels.music.guild);
  }
}
