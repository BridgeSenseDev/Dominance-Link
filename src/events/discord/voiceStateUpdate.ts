import { Client, VoiceState } from 'discord.js';
import { channels } from './ready.js';

export default async function execute(client: Client, oldState: VoiceState, newState: VoiceState) {
  if (channels.music.members.size > 1) {
    const queue = client.distube.getQueue(newState.guild);
    if (queue === undefined) return;
    if (queue.paused) {
      queue.resume(newState.guild);
    }
  } else if (channels.music.members.size === 1) {
    const queue = client.distube.getQueue(newState.guild);
    if (queue === undefined) return;
    if (!queue.paused) {
      queue.pause(newState.guild);
    }
  }
}
