import { ChannelType, Client, VoiceChannel, VoiceState } from 'discord.js';
import { sleep } from '../../helper/utils.js';
import { voiceChannels } from './ready.js';

interface VoiceChannelWithBotAndQueue {
  channel: VoiceChannel;
  queue: any;
}

function isVoiceChannelWithBotAndQueue(channel: VoiceChannel, client: Client): VoiceChannelWithBotAndQueue | null {
  if (channel.type === ChannelType.GuildVoice && channel.members.has(client.user!.id)) {
    const queue = client.distube.getQueue(channel.guild);
    if (queue && queue.songs) {
      return { channel, queue };
    }
  }
  return null;
}

export default async function execute(client: Client, oldState: VoiceState, newState: VoiceState): Promise<void> {
  const voiceChannelsWithBotAndQueue: VoiceChannelWithBotAndQueue[] = [];

  newState.guild.channels.cache.forEach((channel) => {
    const voiceChannelWithBotAndQueue = isVoiceChannelWithBotAndQueue(channel as VoiceChannel, client);
    if (voiceChannelWithBotAndQueue) {
      voiceChannelsWithBotAndQueue.push(voiceChannelWithBotAndQueue);
    }
  });

  if (voiceChannelsWithBotAndQueue.length > 0) {
    voiceChannelsWithBotAndQueue.forEach(({ channel, queue }) => {
      if (channel.members.size > 1) {
        if (queue.paused) {
          queue.resume();
        }
      } else if (channel.members.size === 1) {
        if (!queue.paused) {
          queue.pause();
        }
      }
    });
  } else {
    await sleep(5000);
    await client.distube.play(
      voiceChannels.music,
      'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=38b7fafb48fb4e35'
    );
    const newQueue = client.distube.getQueue(voiceChannels.music.guild);
    newQueue?.setRepeatMode(2);
    await client.distube.shuffle(voiceChannels.music.guild);
  }
}
