import { RawPlayer } from './raw/RawPlayer.js';

export type MojangAPIResponse =
  | {
      name: string;
      id: string;
    }
  | {
      error: 'BadRequestException';
      errorMessage: string;
    }
  | {
      error: 'TooManyRequestsException';
      errorMessage: string;
    };

export type PlayerResponse =
  | {
      success: true;
      player: RawPlayer;
    }
  | {
      success: false;
      cause: string;
    }
  | {
      success: false;
      cause: 'Invalid API key';
    }
  | {
      success: false;
      cause: 'Key throttle';
      throttle: boolean;
      global: boolean;
    };

export type StatusResponse =
  | {
      success: true;
      uuid: string;
      session: {
        online: boolean;
        gameType: string;
        mode?: string;
        map?: string;
      };
    }
  | {
      success: false;
      cause: string;
    }
  | {
      success: false;
      cause: 'Invalid API key';
    }
  | {
      success: false;
      cause: 'Key throttle';
      throttle: boolean;
      global: boolean;
    };

export type GuildResponse =
  | {
      success: true;
      guild?: {
        _id: string;
        name: string;
        name_lower: string;
        coins?: number;
        coinsEver?: number;
        created: number;
        members: Array<{
          uuid: string;
          rank: string;
          joined: number;
          questParticipation: number;
          expHistory: {
            [date: string]: number;
          };
        }>;
        ranks: Array<{
          name: string;
          default: boolean;
          tag: string | null;
          created: number;
          priority: number;
        }>;
        achievements: {
          [name: string]: number;
        };
        exp: number;
        publiclyListed: boolean;
        description: string;
        tag: string;
        tagColor: string;
        guildExpByGameType: {
          SKYBLOCK: number;
          GINGERBREAD: number;
          SUPER_SMASH: number;
          REPLAY: number;
          UHC: number;
          BUILD_BATTLE: number;
          SPEED_UHC: number;
          ARCADE: number;
          QUAKECRAFT: number;
          DUELS: number;
          SKYWARS: number;
          WALLS3: number;
          VAMPIREZ: number;
          BEDWARS: number;
          PIT: number;
          BATTLEGROUND: number;
          WALLS: number;
          MURDER_MYSTERY: number;
          MCGO: number;
          TNTGAMES: number;
          PAINTBALL: number;
          ARENA: number;
          PROTOTYPE: number;
          LEGACY: number;
          SMP: number;
          SURVIVAL_GAMES: number;
          HOUSING: number;
        };
      };
    }
  | {
      success: false;
      cause: string;
    }
  | {
      success: false;
      cause: 'Invalid API key';
    }
  | {
      success: false;
      cause: 'Key throttle';
      throttle: boolean;
      global: boolean;
    };

export type SkyblockProfilesResponse =
  | {
      success: true;
      profiles: {
        profile_id: string;
        members: {
          [uuid: string]: {
            pets?: [];
            fairy_exchanges?: number;
            dungeons?: {};
            temp_stat_buffs?: [];
            fishing_treasure_caught?: number;
            slayer_bosses?: {};
            active_effects?: [];
            nether_island_player_data?: {};
            jacob2?: {};
            stats?: {};
            death_count?: number;
            harp_quest?: {};
            experimentation?: {};
            first_join_hub?: number;
            personal_bank_upgrade?: number;
            fairy_souls_collected?: number;
            bestiary?: {};
            tutorial?: [];
            perks?: {};
            visited_zones?: [];
            quests?: {};
            coin_purse?: number;
            autopet?: {};
            inv_armor?: {};
            accessory_bag_storage?: {};
            leveling?: {
              experience?: number;
              completions?: {};
              completed_tasks?: [];
              migrated?: boolean;
            };
            crafted_generators?: [];
            visited_modes?: [];
            achievement_spawned_island_types?: [];
            disabled_potion_effects?: [];
            mining_core?: {};
            trophy_fish?: {};
            forge?: {};
            fairy_souls?: number;
            objectives?: {};
            last_death?: number;
            first_join?: number;
            slayer_quest?: {};
            paused_effects?: [];
            experience_skill_runecrafting?: number;
            experience_skill_mining?: number;
            equippment_contents?: {};
            unlocked_coll_tiers?: [];
            experience_skill_alchemy?: number;
            backpack_contents?: {};
            quiver?: {};
            experience_skill_taming?: number;
            sacks_counts?: {};
            essence_undead?: number;
            talisman_bag?: {};
            backpack_icons?: {};
            experience_skill_combat?: number;
            essence_diamond?: number;
            fishing_bag?: {};
            experience_skill_farming?: number;
            wardrobe_equipped_slot?: number;
            collection?: {};
            essence_dragon?: number;
            experience_skill_social2?: number;
            essence_gold?: number;
            ender_chest_contents?: {};
            wardrobe_contents?: {};
            potion_bag?: {};
            experience_skill_enchanting?: number;
            personal_vault_contents?: {};
            experience_skill_fishing?: number;
            inv_contents?: {};
            essence_ice?: number;
            essence_wither?: number;
            essence_spider?: number;
            experience_skill_foraging?: number;
            candy_inventory_contents?: {};
            experience_skill_carpentry?: number;
          };
        };
        community_upgrades: {};
        last_save: number;
        cute_name: string;
        selected: boolean;
        banking: {
          balance: number;
          transactions: [];
        };
      }[];
    }
  | {
      success: false;
      cause: string;
    }
  | {
      success: false;
      cause: 'Invalid API key';
    }
  | {
      success: false;
      cause: 'Key throttle';
      throttle: boolean;
      global: boolean;
    };
