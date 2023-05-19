import { setTimeout as setTimeoutAsync } from 'timers/promises';
import {
  GuildResponse,
  MojangAPIResponse,
  PlayerResponse,
  SkyblockProfilesResponse,
  StatusResponse
} from './types/api/api.js';
import config from './config.json' assert { type: 'json' };
import { nameToUuid } from './helper/utils.js';

async function fetchJsonEndpoint<T>(endpoint: string, query: any): Promise<T> {
  let request: Response;
  try {
    request = await fetch(`https://api.hypixel.net${endpoint}?${new URLSearchParams(query)}`);
  } catch (e) {
    if (e instanceof TypeError && e.message === 'fetch failed') {
      return {
        success: false,
        cause: 'ConnectTimeoutError: Connect Timeout Error'
      } as T;
    }
    return {
      success: false,
      cause: 'Unknown'
    } as T;
  }
  while (request.status === 429) {
    if (request.headers.has('RateLimit-Reset')) {
      await setTimeoutAsync(parseInt(request.headers.get('RateLimit-Reset')!, 10) * 1000);
    } else await setTimeoutAsync(1000);

    request = await fetch(`https://api.hypixel.net${endpoint}?${new URLSearchParams(query)}`);
  }
  return request.json();
}

export function dashedUUID(input: string): string {
  return `${input.substring(0, 8)}-${input.substring(8, 12)}-${input.substring(12, 16)}-${input.substring(
    16,
    20
  )}-${input.substring(20)}`;
}

export async function resolveUsername(input: string, dashes: boolean = true): Promise<string> {
  if (!input.includes('-') || input.length < 17) {
    try {
      const uuidResponse: MojangAPIResponse = await (
        await fetch(`https://api.mojang.com/users/profiles/minecraft/${input}`)
      ).json();
      if ('id' in uuidResponse) {
        return dashes ? dashedUUID(uuidResponse.id) : uuidResponse.id;
      }
      throw new Error('Failed to fetch UUID');
    } catch (e) {
      const uuid = await nameToUuid(input);
      if (!uuid) {
        return input;
      }
      return uuid;
    }
  } else {
    return input;
  }
}

export async function fetchPlayerRaw(player: string): Promise<PlayerResponse> {
  const resolvedInput = await resolveUsername(player);
  return (await fetchJsonEndpoint('/player', {
    uuid: resolvedInput,
    key: config.keys.hypixelApiKey
  })) as PlayerResponse;
}

export async function fetchStatus(player: string): Promise<StatusResponse> {
  const resolvedInput = await resolveUsername(player);
  return (await fetchJsonEndpoint('/status', {
    uuid: resolvedInput,
    key: config.keys.hypixelApiKey
  })) as StatusResponse;
}

export async function fetchGuildByPlayer(player: string): Promise<GuildResponse> {
  const resolvedInput = await resolveUsername(player);
  return fetchJsonEndpoint('/guild', {
    player: resolvedInput,
    key: config.keys.hypixelApiKey
  });
}

export async function fetchGuildByName(name: string): Promise<GuildResponse> {
  return (await fetchJsonEndpoint('/guild', {
    name,
    key: config.keys.hypixelApiKey
  })) as GuildResponse;
}

export async function fetchSkyblockProfiles(player: string): Promise<SkyblockProfilesResponse> {
  const resolvedInput = await resolveUsername(player);
  try {
    return (await fetchJsonEndpoint('/skyblock/profiles', {
      uuid: resolvedInput,
      key: config.keys.hypixelApiKey
    })) as SkyblockProfilesResponse;
  } catch (e) {
    return {
      success: false,
      cause: 'Unknown'
    };
  }
}
