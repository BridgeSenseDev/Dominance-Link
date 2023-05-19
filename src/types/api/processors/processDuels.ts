import { RawDuels } from '../raw/RawDuels.js';
import { Duels } from '../processed/Duels.js';
import { cutOff, romanize } from '../../../helper/utils.js';
import { duelsDivisions } from '../../../helper/constants.js';

function prettyPrintSkywarsKit(kit: string) {
  switch (kit) {
    case 'kit_ranked_ranked_armorer':
      return 'Armorer';
    case 'kit_ranked_ranked_athlete':
      return 'Athlete';
    case 'kit_ranked_ranked_blacksmith':
      return 'Blacksmith';
    case 'kit_ranked_ranked_bowman':
      return 'Bowman';
    case 'kit_ranked_ranked_champion':
      return 'Champion';
    case 'kit_ranked_ranked_healer':
      return 'Healer';
    case 'kit_ranked_ranked_hound':
      return 'Hound';
    case 'kit_ranked_ranked_magician':
      return 'Magician';
    case 'kit_ranked_ranked_paladin':
      return 'Paladin';
    case 'kit_ranked_ranked_pyromancer':
      return 'Pyromancer';
    case 'kit_ranked_ranked_scout':
      return 'Scout';
    case 'kit_advanced_solo_armorer':
      return 'Armorer';
    case 'kit_basic_solo_armorsmith':
      return 'Armorsmith';
    case 'kit_basic_solo_batguy':
      return 'Batguy';
    case 'kit_advanced_solo_cannoneer':
      return 'Cannoneer';
    case 'kit_basic_solo_default':
      return 'Default';
    case 'kit_basic_solo_disco':
      return 'Disco';
    case 'kit_basic_solo_ecologist':
      return 'Ecologist';
    case 'kit_advanced_solo_enchanter':
      return 'Enchanted';
    case 'kit_mythical_end-lord':
      return 'End Lord';
    case 'kit_advanced_solo_enderman':
      return 'Enderman';
    case 'kit_basic_solo_energix':
      return 'Energix';
    case 'kit_advanced_solo_farmer':
      return 'Farmer';
    case 'kit_basic_solo_fisherman':
      return 'Fisherman';
    case 'kit_mythical_fishmonger':
      return 'Fishmonger';
    case 'kit_basic_solo_frog':
      return 'Frog';
    case 'kit_basic_solo_grenade':
      return 'Grenade';
    case 'kit_advanced_solo_hunter':
      return 'Hunter';
    case 'kit_advanced_solo_jester':
      return 'Jester';
    case 'kit_advanced_solo_knight':
      return 'Knight';
    case 'kit_mythical_monster-trainer':
      return 'Monster Trainer';
    case 'kit_mythical_nether-lord':
      return 'Nether Lord';
    case 'kit_basic_solo_pharaoh':
      return 'Pharaoh';
    case 'kit_advanced_solo_pig-rider':
      return 'Pig Rider';
    case 'kit_basic_solo_princess':
      return 'Princess';
    case 'kit_basic_solo_rookie':
      return 'Rookie';
    case 'kit_advanced_solo_salmon':
      return 'Salmon';
    case 'kit_basic_solo_scout':
      return 'Scout';
    case 'kit_advanced_solo_sloth':
      return 'Sloth';
    case 'kit_basic_solo_snowman':
      return 'Snowman';
    case 'kit_basic_solo_speleologist':
      return 'Speleologist';
    case 'kit_mythical_thundermeister':
      return 'Thundermeister';
    case 'kit_basic_solo_troll':
      return 'Troll';
    case 'kit_attacking_team_enderman':
      return 'Enderman';
    case 'kit_attacking_team_energix':
      return 'Energix';
    case 'kit_attacking_team_engineer':
      return 'Engineer';
    case 'kit_attacking_team_fisherman':
      return 'Fisherman';
    case 'kit_attacking_team_grenade':
      return 'Grenade';
    case 'kit_attacking_team_hunter':
      return 'Hunter';
    case 'kit_attacking_team_knight':
      return 'Knight';
    case 'kit_attacking_team_pig-rider':
      return 'Pig Rider';
    case 'kit_attacking_team_salmon':
      return 'Salmon';
    case 'kit_attacking_team_scout':
      return 'Scout';
    case 'kit_attacking_team_snowman':
      return 'Snowman';
    case 'kit_defending_team_armorer':
      return 'Armorer';
    case 'kit_defending_team_baseball-player':
      return 'Baseball Player';
    case 'kit_defending_team_disco':
      return 'Disco';
    case 'kit_defending_team_farmer':
      return 'Farmer';
    case 'kit_defending_team_frog':
      return 'Frog';
    case 'kit_defending_team_golem':
      return 'Golem';
    case 'kit_defending_team_guardian':
      return 'Guardian';
    case 'kit_mining_team_cannoneer':
      return 'Cannoneer';
    case 'kit_mining_team_speleologist':
      return 'Speleologist';
    case 'kit_supporting_team_armorsmith':
      return 'Armorsmith';
    case 'kit_supporting_team_ecologist':
      return 'Ecologist';
    case 'kit_supporting_team_enchanter':
      return 'Enchanter';
    case 'kit_supporting_team_healer':
      return 'Healer';
    case 'kit_supporting_team_pharaoh':
      return 'Pharoah';
    case 'kit_supporting_team_princess':
      return 'Princess';
    case 'kit_supporting_team_pyro':
      return 'Pyro';
    case 'kit_supporting_team_rookie':
      return 'Rookie';
    case 'kit_supporting_team_zookeeper':
      return 'Zookeeper';
    default:
      return 'None';
  }
}

function getDivision(json: RawDuels, mode: string | null = null) {
  for (const div of duelsDivisions.slice().reverse()) {
    const prestige = (json as any)[`${mode || 'all_modes'}_${div.key}_title_prestige`];
    if (prestige) {
      return `${div.name} ${romanize(prestige)}`;
    }
  }
  return null;
}

export default function processDuels(json: RawDuels): Duels {
  let [bridgeWins, bridgeLosses, uhcWins, uhcLosses, uhcDeaths, uhcKills] = Array(12).fill(0);
  bridgeWins += json.bridge_duel_wins ?? 0;
  bridgeWins += json.bridge_doubles_wins ?? 0;
  bridgeWins += json.bridge_threes_wins ?? 0;
  bridgeWins += json.bridge_four_wins ?? 0;
  bridgeWins += json.bridge_2v2v2v2_wins ?? 0;
  bridgeWins += json.bridge_3v3v3v3_wins ?? 0;
  // bridgeWins += json.capture_duel_wins ?? 0
  bridgeWins += json.capture_threes_wins ?? 0;
  bridgeLosses += json.bridge_duel_losses ?? 0;
  bridgeLosses += json.bridge_doubles_losses ?? 0;
  bridgeLosses += json.bridge_threes_losses ?? 0;
  bridgeLosses += json.bridge_four_losses ?? 0;
  bridgeLosses += json.bridge_2v2v2v2_losses ?? 0;
  bridgeLosses += json.bridge_3v3v3v3_losses ?? 0;
  // bridgeLosses += json.capture_duel_losses ?? 0
  bridgeLosses += json.capture_threes_losses ?? 0;
  const bridgeWlr = (bridgeWins || 0) / (bridgeLosses || 1);
  const bridgeKdr = (json.bridge_kills || 0) / (json.bridge_deaths || 1);
  uhcWins += json.uhc_duel_wins ?? 0;
  uhcWins += json.uhc_doubles_wins ?? 0;
  uhcWins += json.uhc_four_wins ?? 0;
  uhcWins += json.uhc_meetup_wins ?? 0;
  uhcLosses += json.uhc_duel_losses ?? 0;
  uhcLosses += json.uhc_doubles_losses ?? 0;
  uhcLosses += json.uhc_four_losses ?? 0;
  uhcLosses += json.uhc_meetup_losses ?? 0;
  uhcDeaths += json.uhc_duel_deaths ?? 0;
  uhcDeaths += json.uhc_doubles_deaths ?? 0;
  uhcDeaths += json.uhc_four_deaths ?? 0;
  uhcDeaths += json.uhc_meetup_deaths ?? 0;
  uhcKills += json.uhc_duel_kills ?? 0;
  uhcKills += json.uhc_doubles_kills ?? 0;
  uhcKills += json.uhc_four_kills ?? 0;
  uhcKills += json.uhc_meetup_kills ?? 0;
  const uhcWlr = (uhcWins || 0) / (uhcLosses || 1);
  const uhcKdr = (uhcKills || 0) / (uhcDeaths || 1);

  return {
    general: {
      blocks_placed: json.blocks_placed ?? 0,
      bow_hits: json.bow_hits ?? 0,
      bow_shots: json.bow_shots ?? 0,
      chest_history: json.duels_chest_history ?? [],
      chests: json.duels_chests ?? 0,
      coins: json.coins ?? 0,
      damage_dealt: json.damage_dealt ?? 0,
      deaths: json.deaths ?? 0,
      games_played: json.games_played_duels ?? 0,
      goals: json.goals ?? 0,
      golden_apples_eaten: json.golden_apples_eaten ?? 0,
      heal_pots_used: json.heal_pots_used ?? 0,
      health_regenerated: json.health_regenerated ?? 0,
      kills: json.kills ?? 0,
      kit_wins: json.kit_wins ?? 0,
      losses: json.losses ?? 0,
      maps_won_on: json.maps_won_on ?? [],
      melee_hits: json.melee_hits ?? 0,
      melee_swings: json.melee_swings ?? 0,
      meters_travelled: json.meters_travelled ?? 0,
      rounds_played: json.rounds_played ?? 0,
      wins: json.wins ?? 0,
      bow_ratio: cutOff((json.bow_hits || 0) / (json.bow_shots || 1)),
      kdr: cutOff((json.kills || 0) / (json.deaths || 1)),
      win_ratio: cutOff((json.wins || 0) / (json.games_played_duels || 1)),
      wlr: cutOff((json.wins || 0) / (json.losses || 1)),
      melee_ratio: cutOff((json.melee_hits || 0) / (json.melee_swings || 1)),
      division: getDivision(json) ?? '',
      rookie_title_prestige: json.all_modes_rookie_title_prestige ?? 0,
      iron_title_prestige: json.all_modes_iron_title_prestige ?? 0,
      gold_title_prestige: json.all_modes_gold_title_prestige ?? 0,
      diamond_title_prestige: json.all_modes_diamond_title_prestige ?? 0,
      master_title_prestige: json.all_modes_master_title_prestige ?? 0,
      legend_title_prestige: json.all_modes_legend_title_prestige ?? 0,
      grandmaster_title_prestige: json.all_modes_grandmaster_title_prestige ?? 0,
      godlike_title_prestige: json.all_modes_godlike_title_prestige ?? 0,
      winstreaks: {
        best: {
          overall: json.best_overall_winstreak ?? 0,
          bridge: json.best_bridge_winstreak ?? 0,
          uhc: json.best_uhc_winstreak ?? 0,
          skywars: json.best_skywars_winstreak ?? 0,
          classic_duel: json.best_classic_winstreak ?? 0,
          op_duel: json.best_op_winstreak ?? 0,
          sw_duel: json.best_winstreak_mode_sw_duel ?? 0,
          bridge_doubles: json.best_winstreak_mode_bridge_doubles ?? 0,
          uhc_duel: json.duels_winstreak_best_uhc_duel ?? 0,
          bridge_duel: json.best_winstreak_mode_bridge_duel ?? 0,
          combo_duel: json.best_combo_winstreak ?? 0,
          sumo_duel: json.best_sumo_winstreak ?? 0,
          sw_doubles: json.best_winstreak_mode_sw_doubles ?? 0,
          uhc_doubles: json.best_winstreak_mode_uhc_doubles ?? 0,
          bridge_3v3v3v3: json.best_winstreak_mode_bridge_3v3v3v3 ?? 0,
          bowspleef_duel: json.best_winstreak_mode_bowspleef_duel ?? 0,
          bridge_four: json.best_winstreak_mode_bridge_four ?? 0,
          mw_duel: json.best_winstreak_mode_mw_duel ?? 0,
          potion_duel: json.best_winstreak_mode_potion_duel ?? 0,
          uhc_four: json.best_winstreak_mode_uhc_four ?? 0,
          op_doubles: json.best_winstreak_mode_op_doubles ?? 0,
          bow_duel: json.best_bow_winstreak ?? 0,
          blitz_duel: json.best_blitz_winstreak ?? 0,
          mw_doubles: json.best_winstreak_mode_mw_doubles ?? 0,
          bridge_2v2v2v2: json.best_winstreak_mode_bridge_2v2v2v2 ?? 0,
          uhc_meetup: json.best_winstreak_mode_uhc_meetup ?? 0
        },
        current: {
          overall: json.current_winstreak ?? 0,
          bridge: json.current_bridge_winstreak ?? 0,
          uhc: json.current_uhc_winstreak ?? 0,
          skywars: json.current_skywars_winstreak ?? 0,
          classic_duel: json.current_classic_winstreak ?? 0,
          op_duel: json.current_op_winstreak ?? 0,
          sw_duel: json.current_winstreak_mode_sw_duel ?? 0,
          bridge_doubles: json.current_winstreak_mode_bridge_doubles ?? 0,
          uhc_duel: json.current_winstreak_mode_uhc_duel ?? 0,
          bridge_duel: json.current_winstreak_mode_bridge_duel ?? 0,
          combo_duel: json.current_combo_winstreak ?? 0,
          sumo_duel: json.current_sumo_winstreak ?? 0,
          sw_doubles: json.current_winstreak_mode_sw_doubles ?? 0,
          uhc_doubles: json.current_winstreak_mode_uhc_doubles ?? 0,
          bridge_3v3v3v3: json.current_winstreak_mode_bridge_3v3v3v3 ?? 0,
          bowspleef_duel: json.current_winstreak_mode_bowspleef_duel ?? 0,
          bridge_four: json.current_winstreak_mode_bridge_four ?? 0,
          mw_duel: json.current_winstreak_mode_mw_duel ?? 0,
          potion_duel: json.current_winstreak_mode_potion_duel ?? 0,
          uhc_four: json.current_winstreak_mode_uhc_four ?? 0,
          op_doubles: json.current_winstreak_mode_op_doubles ?? 0,
          bow_duel: json.current_bow_winstreak ?? 0,
          blitz_duel: json.current_blitz_winstreak ?? 0,
          mw_doubles: json.current_winstreak_mode_mw_doubles ?? 0,
          bridge_2v2v2v2: json.current_winstreak_mode_bridge_2v2v2v2 ?? 0,
          uhc_meetup: json.current_winstreak_mode_uhc_meetup ?? 0
        }
      },
      packages: json.packages ?? []
    },
    settings: {
      active_cosmetics: {
        auras: json.active_auras ?? '',
        cage: json.active_cage ?? '',
        cosmetictitle: json.active_cosmetictitle ?? '',
        emblem: json.active_emblem ?? '',
        goal: json.active_goal ?? '',
        hat: json.active_hat ?? '',
        kill_effect: json.active_kill_effect ?? '',
        killmessages: json.active_killmessages ?? '',
        projectile_trail: json.active_projectile_trail ?? '',
        victory_dance: json.active_victory_dance ?? '',
        weaponpacks: json.active_weaponpacks ?? ''
      },
      chat_enabled: json.chat_enabled === 'on' ?? true,
      kit_menu_option: json.kit_menu_option === 'on' ?? true,
      show_lb_option: json.show_lb_option === 'on' ?? true
    },
    gamemodes: {
      blitz_duel: {
        division: getDivision(json, 'blitz_duel') ?? '',
        blocks_placed: json.blitz_duel_blocks_placed ?? 0,
        bow_ratio: cutOff((json.blitz_duel_bow_hits || 0) / (json.blitz_duel_bow_shots || 1)),
        bow_hits: json.blitz_duel_bow_hits ?? 0,
        bow_shots: json.blitz_duel_bow_shots ?? 0,
        damage_dealt: json.blitz_duel_damage_dealt ?? 0,
        deaths: json.blitz_duel_deaths ?? 0,
        health_regenerated: json.blitz_duel_health_regenerated ?? 0,
        kills: json.blitz_duel_kills ?? 0,
        kit: json.blitz_duels_kit ?? '',
        losses: json.blitz_duel_losses ?? 0,
        melee_ratio: cutOff((json.blitz_duel_melee_hits || 0) / (json.blitz_duel_melee_swings || 1)),
        melee_hits: json.blitz_duel_melee_hits ?? 0,
        melee_swings: json.blitz_duel_melee_swings ?? 0,
        rounds_played: json.blitz_duel_rounds_played ?? 0,
        wins: json.blitz_duel_wins ?? 0,
        wlr: cutOff((json.blitz_duel_wins || 0) / (json.blitz_duel_losses || 1)),
        kdr: cutOff((json.blitz_duel_kills || 0) / (json.blitz_duel_deaths || 1)),
        current_winstreak: json.current_blitz_winstreak ?? 0,
        best_winstreak: json.best_blitz_winstreak ?? 0
      },
      bridge: {
        division: getDivision(json, 'bridge') ?? '',
        best_winstreak: json.best_bridge_winstreak ?? 0,
        current_winstreak: json.current_bridge_winstreak ?? 0,
        deaths: json.bridge_deaths ?? 0,
        goals: json.goals ?? 0,
        kills: json.bridge_kills ?? 0,
        losses: bridgeLosses ?? 0,
        map_wins: json.bridgeMapWins ?? [],
        rookie_title_prestige: json.bridge_rookie_title_prestige ?? 0,
        wins: bridgeWins ?? 0,
        captures: json.captures ?? 0,
        wlr: cutOff(bridgeWlr),
        kdr: cutOff(bridgeKdr),
        duels: {
          best_winstreak: json.best_winstreak_mode_bridge_duel ?? 0,
          current_winstreak: json.current_winstreak_mode_bridge_duel ?? 0,
          blocks_placed: json.bridge_duel_blocks_placed ?? 0,
          bow_ratio: cutOff((json.bridge_duel_bow_hits || 0) / (json.bridge_duel_bow_shots || 1)),
          bow_hits: json.bridge_duel_bow_hits ?? 0,
          bow_shots: json.bridge_duel_bow_shots ?? 0,
          damage_dealt: json.bridge_duel_damage_dealt ?? 0,
          deaths: json.bridge_duel_bridge_deaths ?? 0,
          goals: json.bridge_duel_goals ?? 0,
          health_regenerated: json.bridge_duel_health_regenerated ?? 0,
          kills: json.bridge_duel_bridge_kills ?? 0,
          losses: json.bridge_duel_losses ?? 0,
          melee_ratio: cutOff((json.bridge_duel_melee_hits || 0) / (json.bridge_duel_melee_swings || 1)),
          melee_hits: json.bridge_duel_melee_hits ?? 0,
          melee_swings: json.bridge_duel_melee_swings ?? 0,
          rounds_played: json.bridge_duel_rounds_played ?? 0,
          wlr: cutOff((json.bridge_duel_wins || 0) / (json.bridge_duel_losses || 1)),
          wins: json.bridge_duel_wins ?? 0
        },
        doubles: {
          best_winstreak: json.best_winstreak_mode_bridge_doubles ?? 0,
          current_winstreak: json.current_winstreak_mode_bridge_doubles ?? 0,
          blocks_placed: json.bridge_doubles_blocks_placed ?? 0,
          bow_ratio: cutOff((json.bridge_doubles_bow_hits || 0) / (json.bridge_doubles_bow_shots || 1)),
          bow_hits: json.bridge_doubles_bow_hits ?? 0,
          bow_shots: json.bridge_doubles_bow_shots ?? 0,
          damage_dealt: json.bridge_doubles_damage_dealt ?? 0,
          deaths: json.bridge_doubles_bridge_deaths ?? 0,
          goals: json.bridge_doubles_goals ?? 0,
          health_regenerated: json.bridge_doubles_health_regenerated ?? 0,
          kills: json.bridge_doubles_bridge_kills ?? 0,
          losses: json.bridge_doubles_losses ?? 0,
          melee_ratio: cutOff((json.bridge_doubles_melee_hits || 0) / (json.bridge_doubles_melee_swings || 1)),
          melee_hits: json.bridge_doubles_melee_hits ?? 0,
          melee_swings: json.bridge_doubles_melee_swings ?? 0,
          rounds_played: json.bridge_doubles_rounds_played ?? 0,
          wlr: cutOff((json.bridge_doubles_wins || 0) / (json.bridge_doubles_losses || 1)),
          wins: json.bridge_doubles_wins ?? 0
        },
        fours: {
          best_winstreak: json.best_winstreak_mode_bridge_four ?? 0,
          current_winstreak: json.current_winstreak_mode_bridge_four ?? 0,
          blocks_placed: json.bridge_four_blocks_placed ?? 0,
          bow_ratio: cutOff((json.bridge_four_bow_hits || 0) / (json.bridge_four_bow_shots || 1)),
          bow_hits: json.bridge_four_bow_hits ?? 0,
          bow_shots: json.bridge_four_bow_shots ?? 0,
          damage_dealt: json.bridge_four_damage_dealt ?? 0,
          deaths: json.bridge_four_bridge_deaths ?? 0,
          goals: json.bridge_four_goals ?? 0,
          health_regenerated: json.bridge_four_health_regenerated ?? 0,
          kills: json.bridge_four_bridge_kills ?? 0,
          losses: json.bridge_four_losses ?? 0,
          melee_ratio: cutOff((json.bridge_four_melee_hits || 0) / (json.bridge_four_melee_swings || 1)),
          melee_hits: json.bridge_four_melee_hits ?? 0,
          melee_swings: json.bridge_four_melee_swings ?? 0,
          rounds_played: json.bridge_four_rounds_played ?? 0,
          wlr: cutOff((json.bridge_four_wins || 0) / (json.bridge_four_losses || 1)),
          wins: json.bridge_four_wins ?? 0
        },
        threes: {
          best_winstreak: json.best_winstreak_mode_bridge_threes ?? 0,
          current_winstreak: json.current_winstreak_mode_bridge_threes ?? 0,
          blocks_placed: json.bridge_threes_blocks_placed ?? 0,
          bow_ratio: cutOff((json.bridge_threes_bow_hits || 0) / (json.bridge_threes_bow_shots || 1)),
          bow_hits: json.bridge_threes_bow_hits ?? 0,
          bow_shots: json.bridge_threes_bow_shots ?? 0,
          damage_dealt: json.bridge_threes_damage_dealt ?? 0,
          deaths: json.bridge_threes_bridge_deaths ?? 0,
          goals: json.bridge_threes_goals ?? 0,
          health_regenerated: json.bridge_threes_health_regenerated ?? 0,
          kills: json.bridge_threes_bridge_kills ?? 0,
          losses: json.bridge_threes_losses ?? 0,
          melee_ratio: cutOff((json.bridge_threes_melee_hits || 0) / (json.bridge_threes_melee_swings || 1)),
          melee_hits: json.bridge_threes_melee_hits ?? 0,
          melee_swings: json.bridge_threes_melee_swings ?? 0,
          rounds_played: json.bridge_threes_rounds_played ?? 0,
          wlr: cutOff((json.bridge_threes_wins || 0) / (json.bridge_threes_losses || 1)),
          wins: json.bridge_threes_wins ?? 0
        },
        capture_threes: {
          best_winstreak: json.best_winstreak_mode_capture_threes ?? 0,
          current_winstreak: json.current_winstreak_mode_capture_threes ?? 0,
          blocks_placed: json.capture_threes_blocks_placed ?? 0,
          bow_ratio: cutOff((json.capture_threes_bow_hits || 0) / (json.capture_threes_bow_shots || 1)),
          bow_hits: json.capture_threes_bow_hits ?? 0,
          bow_shots: json.capture_threes_bow_shots ?? 0,
          damage_dealt: json.capture_threes_damage_dealt ?? 0,
          deaths: json.capture_threes_bridge_deaths ?? 0,
          captures: json.capture_threes_captures ?? 0,
          health_regenerated: json.capture_threes_health_regenerated ?? 0,
          kills: json.capture_threes_bridge_kills ?? 0,
          losses: json.capture_threes_losses ?? 0,
          melee_ratio: cutOff((json.capture_threes_melee_hits || 0) / (json.capture_threes_melee_swings || 1)),
          melee_hits: json.capture_threes_melee_hits ?? 0,
          melee_swings: json.capture_threes_melee_swings ?? 0,
          rounds_played: json.capture_threes_rounds_played ?? 0,
          wlr: cutOff((json.capture_threes_wins || 0) / (json.capture_threes_losses || 1)),
          wins: json.capture_threes_wins ?? 0
        },
        capture_duels: {
          best_winstreak: json.best_winstreak_mode_capture_duel ?? 0,
          current_winstreak: json.current_winstreak_mode_capture_duel ?? 0,
          blocks_placed: json.capture_duel_blocks_placed ?? 0,
          bow_ratio: cutOff((json.capture_duel_bow_hits || 0) / (json.capture_duel_bow_shots || 1)),
          bow_hits: json.capture_duel_bow_hits ?? 0,
          bow_shots: json.capture_duel_bow_shots ?? 0,
          damage_dealt: json.capture_duel_damage_dealt ?? 0,
          deaths: json.capture_duel_bridge_deaths ?? 0,
          captures: json.capture_duel_captures ?? 0,
          health_regenerated: json.capture_duel_health_regenerated ?? 0,
          kills: json.capture_duel_bridge_kills ?? 0,
          losses: json.capture_duel_losses ?? 0,
          melee_ratio: cutOff((json.capture_duel_melee_hits || 0) / (json.capture_duel_melee_swings || 1)),
          melee_hits: json.capture_duel_melee_hits ?? 0,
          melee_swings: json.capture_duel_melee_swings ?? 0,
          rounds_played: json.capture_duel_rounds_played ?? 0,
          wlr: cutOff((json.capture_duel_wins || 0) / (json.capture_duel_losses || 1)),
          wins: json.capture_duel_wins ?? 0
        },
        '2v2': {
          best_winstreak: json.best_winstreak_mode_bridge_2v2v2v2 ?? 0,
          current_winstreak: json.current_winstreak_mode_bridge_2v2v2v2 ?? 0,
          blocks_placed: json.bridge_2v2v2v2_blocks_placed ?? 0,
          bow_ratio: cutOff((json.bridge_2v2v2v2_bow_hits || 0) / (json.bridge_2v2v2v2_bow_shots || 1)),
          bow_hits: json.bridge_2v2v2v2_bow_hits ?? 0,
          bow_shots: json.bridge_2v2v2v2_bow_shots ?? 0,
          damage_dealt: json.bridge_2v2v2v2_damage_dealt ?? 0,
          deaths: json.bridge_2v2v2v2_bridge_deaths ?? 0,
          goals: json.bridge_2v2v2v2_goals ?? 0,
          health_regenerated: json.bridge_2v2v2v2_health_regenerated ?? 0,
          kills: json.bridge_2v2v2v2_bridge_kills ?? 0,
          losses: json.bridge_2v2v2v2_losses ?? 0,
          melee_ratio: cutOff((json.bridge_2v2v2v2_melee_hits || 0) / (json.bridge_2v2v2v2_melee_swings || 1)),
          melee_hits: json.bridge_2v2v2v2_melee_hits ?? 0,
          melee_swings: json.bridge_2v2v2v2_melee_swings ?? 0,
          rounds_played: json.bridge_2v2v2v2_rounds_played ?? 0,
          wlr: cutOff((json.bridge_2v2v2v2_wins || 0) / (json.bridge_2v2v2v2_losses || 1)),
          wins: json.bridge_2v2v2v2_wins ?? 0
        },
        '3v3': {
          best_winstreak: json.best_winstreak_mode_bridge_3v3v3v3 ?? 0,
          current_winstreak: json.current_winstreak_mode_bridge_3v3v3v3 ?? 0,
          blocks_placed: json.bridge_3v3v3v3_blocks_placed ?? 0,
          bow_ratio: cutOff((json.bridge_3v3v3v3_bow_hits || 0) / (json.bridge_3v3v3v3_bow_shots || 1)),
          bow_hits: json.bridge_3v3v3v3_bow_hits ?? 0,
          bow_shots: json.bridge_3v3v3v3_bow_shots ?? 0,
          damage_dealt: json.bridge_3v3v3v3_damage_dealt ?? 0,
          deaths: json.bridge_3v3v3v3_bridge_deaths ?? 0,
          goals: json.bridge_3v3v3v3_goals ?? 0,
          health_regenerated: json.bridge_3v3v3v3_health_regenerated ?? 0,
          kills: json.bridge_3v3v3v3_bridge_kills ?? 0,
          losses: json.bridge_3v3v3v3_losses ?? 0,
          melee_ratio: cutOff((json.bridge_3v3v3v3_melee_hits || 0) / (json.bridge_3v3v3v3_melee_swings || 1)),
          melee_hits: json.bridge_3v3v3v3_melee_hits ?? 0,
          melee_swings: json.bridge_3v3v3v3_melee_swings ?? 0,
          rounds_played: json.bridge_3v3v3v3_rounds_played ?? 0,
          wlr: cutOff((json.bridge_3v3v3v3_wins || 0) / (json.bridge_3v3v3v3_losses || 1)),
          wins: json.bridge_3v3v3v3_wins ?? 0
        }
      },
      bow_duel: {
        division: getDivision(json, 'bow_duel') ?? '',
        best_winstreak: json.best_winstreak_mode_bow_duel ?? 0,
        current_winstreak: json.current_winstreak_mode_bow_duel ?? 0,
        wlr: cutOff((json.bow_duel_wins || 0) / (json.bow_duel_losses || 1)),
        kdr: cutOff((json.bow_duel_kills || 0) / (json.bow_duel_deaths || 1)),
        bow_ratio: cutOff((json.bow_duel_bow_hits || 0) / (json.bow_duel_bow_shots || 1)),
        bow_hits: json.bow_duel_bow_hits ?? 0,
        bow_shots: json.bow_duel_bow_shots ?? 0,
        damage_dealt: json.bow_duel_damage_dealt ?? 0,
        deaths: json.bow_duel_deaths ?? 0,
        health_regenerated: json.bow_duel_health_regenerated ?? 0,
        kills: json.bow_duel_kills ?? 0,
        losses: json.bow_duel_losses ?? 0,
        rounds_played: json.bow_duel_rounds_played ?? 0,
        wins: json.bow_duel_wins ?? 0
      },
      bowspleef_duel: {
        division: getDivision(json, 'bowspleef_duel') ?? '',
        best_winstreak: json.best_winstreak_mode_bowspleef_duel ?? 0,
        current_winstreak: json.current_winstreak_mode_bowspleef_duel ?? 0,
        wlr: cutOff((json.bowspleef_duel_wins || 0) / (json.bowspleef_duel_losses || 1)),
        bow_shots: json.bowspleef_duel_bow_shots ?? 0,
        deaths: json.bowspleef_duel_deaths ?? 0,
        losses: json.bowspleef_duel_losses ?? 0,
        rounds_played: json.bowspleef_duel_rounds_played ?? 0,
        wins: json.bowspleef_duel_wins ?? 0
      },
      boxing_duel: {
        division: getDivision(json, 'boxing_duel') ?? '',
        best_winstreak: json.best_winstreak_mode_boxing_duel ?? 0,
        current_winstreak: json.current_winstreak_mode_boxing_duel ?? 0,
        wlr: cutOff((json.boxing_duel_wins || 0) / (json.boxing_duel_losses || 1)),
        kdr: cutOff((json.boxing_duel_kills || 0) / (json.boxing_duel_deaths || 1)),
        deaths: json.boxing_duel_deaths ?? 0,
        health_regenerated: json.boxing_duel_health_regenerated ?? 0,
        kills: json.boxing_duel_kills ?? 0,
        losses: json.boxing_duel_losses ?? 0,
        melee_ratio: cutOff((json.boxing_duel_melee_hits || 0) / (json.boxing_duel_melee_swings || 1)),
        melee_hits: json.boxing_duel_melee_hits ?? 0,
        melee_swings: json.boxing_duel_melee_swings ?? 0,
        rounds_played: json.boxing_duel_rounds_played ?? 0,
        wins: json.boxing_duel_wins ?? 0
      },
      classic_duel: {
        division: getDivision(json, 'classic_duel') ?? '',
        best_winstreak: json.best_winstreak_mode_classic_duel ?? 0,
        current_winstreak: json.current_winstreak_mode_classic_duel ?? 0,
        wlr: cutOff((json.classic_duel_wins || 0) / (json.classic_duel_losses || 1)),
        kdr: cutOff((json.classic_duel_kills || 0) / (json.classic_duel_deaths || 1)),
        bow_ratio: cutOff((json.classic_duel_bow_hits || 0) / (json.classic_duel_bow_shots || 1)),
        bow_hits: json.classic_duel_bow_hits ?? 0,
        bow_shots: json.classic_duel_bow_shots ?? 0,
        damage_dealt: json.classic_duel_damage_dealt ?? 0,
        deaths: json.classic_duel_deaths ?? 0,
        health_regenerated: json.classic_duel_health_regenerated ?? 0,
        kills: json.classic_duel_kills ?? 0,
        losses: json.classic_duel_losses ?? 0,
        melee_ratio: cutOff((json.classic_duel_melee_hits || 0) / (json.classic_duel_melee_swings || 1)),
        melee_hits: json.classic_duel_melee_hits ?? 0,
        melee_swings: json.classic_duel_melee_swings ?? 0,
        rounds_played: json.classic_duel_rounds_played ?? 0,
        wins: json.classic_duel_wins ?? 0
      },
      combo_duel: {
        division: getDivision(json, 'combo_duel') ?? '',
        best_winstreak: json.best_winstreak_mode_combo_duel ?? 0,
        current_winstreak: json.current_winstreak_mode_combo_duel ?? 0,
        wlr: cutOff((json.combo_duel_wins || 0) / (json.combo_duel_losses || 1)),
        kdr: cutOff((json.combo_duel_kills || 0) / (json.combo_duel_deaths || 1)),
        golden_apples_eaten: json.combo_duel_golden_apples_eaten ?? 0,
        deaths: json.combo_duel_deaths ?? 0,
        health_regenerated: json.combo_duel_health_regenerated ?? 0,
        kills: json.combo_duel_kills ?? 0,
        losses: json.combo_duel_losses ?? 0,
        melee_ratio: cutOff((json.combo_duel_melee_hits || 0) / (json.combo_duel_melee_swings || 1)),
        melee_hits: json.combo_duel_melee_hits ?? 0,
        melee_swings: json.combo_duel_melee_swings ?? 0,
        rounds_played: json.combo_duel_rounds_played ?? 0,
        wins: json.combo_duel_wins ?? 0
      },
      mega_walls_duel: {
        division: getDivision(json, 'mega_walls_duel') ?? '',
        best_winstreak: json.best_winstreak_mode_mw_duel ?? 0,
        current_winstreak: json.current_winstreak_mode_mw_duel ?? 0,
        wlr: cutOff((json.mw_duel_wins || 0) / (json.mw_duel_losses || 1)),
        kdr: cutOff((json.mw_duel_kills || 0) / (json.mw_duel_deaths || 1)),
        blocks_placed: json.mw_duel_blocks_placed ?? 0,
        bow_ratio: cutOff((json.mw_duel_bow_hits || 0) / (json.mw_duel_bow_shots || 1)),
        bow_hits: json.mw_duel_bow_hits ?? 0,
        bow_shots: json.mw_duel_bow_shots ?? 0,
        damage_dealt: json.mw_duel_damage_dealt ?? 0,
        deaths: json.mw_duel_deaths ?? 0,
        health_regenerated: json.mw_duel_health_regenerated ?? 0,
        kills: json.mw_duel_kills ?? 0,
        class: json.mw_duels_class ?? '',
        losses: json.mw_duel_losses ?? 0,
        melee_ratio: cutOff((json.mw_duel_melee_hits || 0) / (json.mw_duel_melee_swings || 1)),
        melee_hits: json.mw_duel_melee_hits ?? 0,
        melee_swings: json.mw_duel_melee_swings ?? 0,
        rounds_played: json.mw_duel_rounds_played ?? 0,
        wins: json.mw_duel_wins ?? 0
      },
      mega_walls_doubles: {
        division: getDivision(json, 'mega_walls_doubles') ?? '',
        best_winstreak: json.best_winstreak_mode_mw_doubles ?? 0,
        current_winstreak: json.current_winstreak_mode_mw_doubles ?? 0,
        blocks_placed: json.mw_doubles_blocks_placed ?? 0,
        bow_ratio: cutOff((json.mw_doubles_bow_hits || 0) / (json.mw_doubles_bow_shots || 1)),
        bow_hits: json.mw_doubles_bow_hits ?? 0,
        bow_shots: json.mw_doubles_bow_shots ?? 0,
        damage_dealt: json.mw_doubles_damage_dealt ?? 0,
        health_regenerated: json.mw_doubles_health_regenerated ?? 0,
        kills: json.mw_doubles_kills ?? 0,
        melee_ratio: cutOff((json.mw_doubles_melee_hits || 0) / (json.mw_doubles_melee_swings || 1)),
        melee_hits: json.mw_doubles_melee_hits ?? 0,
        melee_swings: json.mw_doubles_melee_swings ?? 0,
        rounds_played: json.mw_doubles_rounds_played ?? 0,
        wins: json.mw_doubles_wins ?? 0
      },
      op: {
        division: getDivision(json, 'op') ?? '',
        best_winstreak: (json.best_winstreak_mode_op_duel ?? 0) + (json.best_winstreak_mode_op_doubles ?? 0),
        current_winstreak: (json.current_winstreak_mode_op_duel ?? 0) + (json.current_winstreak_mode_op_doubles ?? 0),
        wlr: cutOff(
          ((json.op_duel_wins || 0) + (json.op_doubles_wins || 0)) /
            ((json.op_duel_losses || 0) + (json.op_doubles_losses || 0) || 1)
        ),
        kdr: cutOff(
          ((json.op_duel_kills || 0) + (json.op_doubles_kills || 0)) /
            ((json.op_duel_deaths || 0) + (json.op_doubles_deaths || 0) || 1)
        ),
        damage_dealt: (json.op_duel_damage_dealt ?? 0) + (json.op_doubles_damage_dealt ?? 0),
        deaths: (json.op_duel_deaths ?? 0) + (json.op_doubles_deaths ?? 0),
        health_regenerated: (json.op_duel_health_regenerated ?? 0) + (json.op_doubles_health_regenerated ?? 0),
        kills: (json.op_duel_kills ?? 0) + (json.op_doubles_kills ?? 0),
        losses: (json.op_duel_losses ?? 0) + (json.op_doubles_losses ?? 0),
        melee_ratio: cutOff(
          ((json.op_duel_melee_hits || 0) + (json.op_doubles_melee_hits || 0)) /
            ((json.op_duel_melee_swings || 0) + (json.op_doubles_melee_swings || 0) || 1)
        ),
        melee_hits: (json.op_duel_melee_hits ?? 0) + (json.op_doubles_melee_hits ?? 0),
        melee_swings: (json.op_duel_melee_swings ?? 0) + (json.op_doubles_melee_swings ?? 0),
        rounds_played: (json.op_duel_rounds_played ?? 0) + (json.op_doubles_rounds_played ?? 0),
        wins: (json.op_duel_wins ?? 0) + (json.op_doubles_wins ?? 0),
        duels: {
          best_winstreak: json.best_winstreak_mode_op_duel ?? 0,
          current_winstreak: json.current_winstreak_mode_op_duel ?? 0,
          wlr: cutOff((json.op_duel_wins || 0) / (json.op_duel_losses || 1)),
          kdr: cutOff((json.op_duel_kills || 0) / (json.op_duel_deaths || 1)),
          damage_dealt: json.op_duel_damage_dealt ?? 0,
          deaths: json.op_duel_deaths ?? 0,
          health_regenerated: json.op_duel_health_regenerated ?? 0,
          kills: json.op_duel_kills ?? 0,
          losses: json.op_duel_losses ?? 0,
          melee_ratio: cutOff((json.op_duel_melee_hits || 0) / (json.op_duel_melee_swings || 1)),
          melee_hits: json.op_duel_melee_hits ?? 0,
          melee_swings: json.op_duel_melee_swings ?? 0,
          rounds_played: json.op_duel_rounds_played ?? 0,
          wins: json.op_duel_wins ?? 0
        },
        doubles: {
          best_winstreak: json.best_winstreak_mode_op_doubles ?? 0,
          current_winstreak: json.current_winstreak_mode_op_doubles ?? 0,
          wlr: cutOff((json.op_doubles_wins || 0) / (json.op_doubles_losses || 1)),
          kdr: cutOff((json.op_doubles_kills || 0) / (json.op_doubles_deaths || 1)),
          damage_dealt: json.op_doubles_damage_dealt ?? 0,
          deaths: json.op_doubles_deaths ?? 0,
          health_regenerated: json.op_doubles_health_regenerated ?? 0,
          kills: json.op_doubles_kills ?? 0,
          losses: json.op_doubles_losses ?? 0,
          melee_ratio: cutOff((json.op_doubles_melee_hits || 0) / (json.op_doubles_melee_swings || 1)),
          melee_hits: json.op_doubles_melee_hits ?? 0,
          melee_swings: json.op_doubles_melee_swings ?? 0,
          rounds_played: json.op_doubles_rounds_played ?? 0,
          wins: json.op_doubles_wins ?? 0
        }
      },
      parkour_eight: {
        division: getDivision(json, 'parkour_eight') ?? '',
        best_winstreak: json.best_winstreak_mode_parkour_eight ?? 0,
        current_winstreak: json.current_winstreak_mode_parkour_eight ?? 0,
        wins: json.parkour_eight_wins ?? 0,
        losses: json.parkour_eight_losses ?? 0,
        deaths: json.parkour_eight_deaths ?? 0,
        rounds_played: json.parkour_eight_rounds_played ?? 0,
        wlr: cutOff((json.parkour_eight_wins || 0) / (json.parkour_eight_losses || 1))
      },
      potion_duel: {
        division: getDivision(json, 'potion_duel') ?? '',
        best_winstreak: json.best_winstreak_mode_potion_duel ?? 0,
        current_winstreak: json.current_winstreak_mode_potion_duel ?? 0,
        wlr: cutOff((json.potion_duel_wins || 0) / (json.potion_duel_losses || 1)),
        kdr: cutOff((json.potion_duel_kills || 0) / (json.potion_duel_deaths || 1)),
        damage_dealt: json.potion_duel_damage_dealt ?? 0,
        deaths: json.potion_duel_deaths ?? 0,
        health_regenerated: json.potion_duel_health_regenerated ?? 0,
        kills: json.potion_duel_kills ?? 0,
        losses: json.potion_duel_losses ?? 0,
        melee_ratio: cutOff((json.potion_duel_melee_hits || 0) / (json.potion_duel_melee_swings || 1)),
        melee_hits: json.potion_duel_melee_hits ?? 0,
        melee_swings: json.potion_duel_melee_swings ?? 0,
        rounds_played: json.potion_duel_rounds_played ?? 0,
        heal_pots_used: json.heal_pots_used ?? 0,
        wins: json.potion_duel_wins ?? 0
      },
      uhc: {
        division: getDivision(json, 'uhc') ?? '',
        deaths: uhcDeaths,
        kills: uhcKills,
        current_winstreak: json.current_uhc_winstreak,
        best_winstreak: json.best_uhc_winstreak,
        wins: uhcWins,
        losses: uhcLosses,
        wlr: cutOff(uhcWlr),
        kdr: cutOff(uhcKdr),
        duels: {
          best_winstreak: json.best_winstreak_mode_uhc_duel ?? 0,
          current_winstreak: json.current_winstreak_mode_uhc_duel ?? 0,
          wlr: cutOff((json.uhc_duel_wins || 0) / (json.uhc_duel_losses || 1)),
          kdr: cutOff((json.uhc_duel_kills || 0) / (json.uhc_duel_deaths || 1)),
          blocks_placed: json.uhc_duel_blocks_placed ?? 0,
          golden_apples_eaten: json.uhc_duel_golden_apples_eaten ?? 0,
          deaths: json.uhc_duel_deaths ?? 0,
          damage_dealt: json.uhc_duel_damage_dealt ?? 0,
          health_regenerated: json.uhc_duel_health_regenerated ?? 0,
          kills: json.uhc_duel_kills ?? 0,
          losses: json.uhc_duel_losses ?? 0,
          melee_ratio: cutOff((json.uhc_duel_melee_hits || 0) / (json.uhc_duel_melee_swings || 1)),
          melee_hits: json.uhc_duel_melee_hits ?? 0,
          melee_swings: json.uhc_duel_melee_swings ?? 0,
          rounds_played: json.uhc_duel_rounds_played ?? 0,
          wins: json.uhc_duel_wins ?? 0,
          bow_ratio: cutOff((json.uhc_duel_bow_hits || 0) / (json.uhc_duel_bow_shots || 1)),
          bow_hits: json.uhc_duel_bow_hits ?? 0,
          bow_shots: json.uhc_duel_bow_shots ?? 0
        },
        doubles: {
          best_winstreak: json.best_winstreak_mode_uhc_doubles ?? 0,
          current_winstreak: json.current_winstreak_mode_uhc_doubles ?? 0,
          wlr: cutOff((json.uhc_doubles_wins || 0) / (json.uhc_doubles_losses || 1)),
          kdr: cutOff((json.uhc_doubles_kills || 0) / (json.uhc_doubles_deaths || 1)),
          blocks_placed: json.uhc_doubles_blocks_placed ?? 0,
          golden_apples_eaten: json.uhc_doubles_golden_apples_eaten ?? 0,
          deaths: json.uhc_doubles_deaths ?? 0,
          damage_dealt: json.uhc_doubles_damage_dealt ?? 0,
          health_regenerated: json.uhc_doubles_health_regenerated ?? 0,
          kills: json.uhc_doubles_kills ?? 0,
          losses: json.uhc_doubles_losses ?? 0,
          melee_ratio: cutOff((json.uhc_doubles_melee_hits || 0) / (json.uhc_doubles_melee_swings || 1)),
          melee_hits: json.uhc_doubles_melee_hits ?? 0,
          melee_swings: json.uhc_doubles_melee_swings ?? 0,
          rounds_played: json.uhc_doubles_rounds_played ?? 0,
          wins: json.uhc_doubles_wins ?? 0,
          bow_ratio: cutOff((json.uhc_doubles_bow_hits || 0) / (json.uhc_doubles_bow_shots || 1)),
          bow_hits: json.uhc_doubles_bow_hits ?? 0,
          bow_shots: json.uhc_doubles_bow_shots ?? 0
        },
        fours: {
          best_winstreak: json.best_winstreak_mode_uhc_four ?? 0,
          current_winstreak: json.current_winstreak_mode_uhc_four ?? 0,
          wlr: cutOff((json.uhc_four_wins || 0) / (json.uhc_four_losses || 1)),
          kdr: cutOff((json.uhc_four_kills || 0) / (json.uhc_four_deaths || 1)),
          blocks_placed: json.uhc_four_blocks_placed ?? 0,
          golden_apples_eaten: json.uhc_four_golden_apples_eaten ?? 0,
          deaths: json.uhc_four_deaths ?? 0,
          damage_dealt: json.uhc_four_damage_dealt ?? 0,
          health_regenerated: json.uhc_four_health_regenerated ?? 0,
          kills: json.uhc_four_kills ?? 0,
          losses: json.uhc_four_losses ?? 0,
          melee_ratio: cutOff((json.uhc_four_melee_hits || 0) / (json.uhc_four_melee_swings || 1)),
          melee_hits: json.uhc_four_melee_hits ?? 0,
          melee_swings: json.uhc_four_melee_swings ?? 0,
          rounds_played: json.uhc_four_rounds_played ?? 0,
          wins: json.uhc_four_wins ?? 0,
          bow_ratio: cutOff((json.uhc_four_bow_hits || 0) / (json.uhc_four_bow_shots || 1)),
          bow_hits: json.uhc_four_bow_hits ?? 0,
          bow_shots: json.uhc_four_bow_shots ?? 0
        },
        meetup: {
          best_winstreak: json.best_winstreak_mode_uhc_meetup ?? 0,
          current_winstreak: json.current_winstreak_mode_uhc_meetup ?? 0,
          wlr: cutOff((json.uhc_meetup_wins || 0) / (json.uhc_meetup_losses || 1)),
          kdr: cutOff((json.uhc_meetup_kills || 0) / (json.uhc_meetup_deaths || 1)),
          blocks_placed: json.uhc_meetup_blocks_placed ?? 0,
          deaths: json.uhc_meetup_deaths ?? 0,
          damage_dealt: json.uhc_meetup_damage_dealt ?? 0,
          health_regenerated: json.uhc_meetup_health_regenerated ?? 0,
          kills: json.uhc_meetup_kills ?? 0,
          losses: json.uhc_meetup_losses ?? 0,
          melee_ratio: cutOff((json.uhc_meetup_melee_hits || 0) / (json.uhc_meetup_melee_swings || 1)),
          melee_hits: json.uhc_meetup_melee_hits ?? 0,
          melee_swings: json.uhc_meetup_melee_swings ?? 0,
          rounds_played: json.uhc_meetup_rounds_played ?? 0,
          wins: json.uhc_meetup_wins ?? 0,
          bow_ratio: cutOff((json.uhc_meetup_bow_hits || 0) / (json.uhc_meetup_bow_shots || 1)),
          bow_hits: json.uhc_meetup_bow_hits ?? 0,
          bow_shots: json.uhc_meetup_bow_shots ?? 0
        }
      },
      skywars: {
        division: getDivision(json, 'skywars') ?? '',
        current_winstreak: json.current_skywars_winstreak,
        best_winstreak: json.best_skywars_winstreak,
        wlr: cutOff(
          ((json.sw_duel_wins || 0) + (json.sw_doubles_wins || 0)) /
            ((json.sw_duel_losses || 0) + (json.sw_doubles_losses || 0) || 1)
        ),
        kdr: cutOff(
          ((json.sw_duel_kills || 0) + (json.sw_doubles_kills || 0)) /
            ((json.sw_duel_deaths || 0) + (json.sw_doubles_deaths || 0) || 1)
        ),
        blocks_placed: (json.sw_duel_blocks_placed ?? 0) + (json.sw_doubles_blocks_placed ?? 0),
        bow_ratio: cutOff((json.sw_duel_bow_hits || 0) / (json.sw_duel_bow_shots || 1)),
        bow_hits: (json.sw_duel_bow_hits ?? 0) + (json.sw_doubles_bow_hits ?? 0),
        bow_shots: (json.sw_duel_bow_shots ?? 0) + (json.sw_doubles_bow_shots ?? 0),
        damage_dealt: (json.sw_duel_damage_dealt ?? 0) + (json.sw_doubles_damage_dealt ?? 0),
        deaths: (json.sw_duel_deaths ?? 0) + (json.sw_doubles_deaths ?? 0),
        health_regenerated: (json.sw_duel_health_regenerated ?? 0) + (json.sw_doubles_health_regenerated ?? 0),
        kills: (json.sw_duel_kills ?? 0) + (json.sw_doubles_kills ?? 0),
        losses: (json.sw_duel_losses ?? 0) + (json.sw_doubles_losses ?? 0),
        melee_ratio: cutOff(
          ((json.sw_duel_melee_hits || 0) + (json.sw_doubles_melee_hits || 0)) /
            ((json.sw_duel_melee_swings || 0) + (json.sw_doubles_melee_swings || 0) || 1)
        ),
        melee_hits: (json.sw_duel_melee_hits ?? 0) + (json.sw_doubles_melee_hits ?? 0),
        melee_swings: (json.sw_duel_melee_swings ?? 0) + (json.sw_doubles_melee_swings ?? 0),
        rounds_played: (json.sw_duel_rounds_played ?? 0) + (json.sw_doubles_rounds_played ?? 0),
        wins: (json.sw_duel_wins ?? 0) + (json.sw_doubles_wins ?? 0),
        doubles: {
          best_winstreak: json.best_winstreak_mode_sw_doubles ?? 0,
          current_winstreak: json.current_winstreak_mode_sw_doubles ?? 0,
          wlr: cutOff((json.sw_doubles_wins || 0) / (json.sw_doubles_losses || 1)),
          kdr: cutOff((json.sw_doubles_kills || 0) / (json.sw_doubles_deaths || 1)),
          blocks_placed: json.sw_doubles_blocks_placed ?? 0,
          bow_ratio: cutOff((json.sw_doubles_bow_hits || 0) / (json.sw_doubles_bow_shots || 1)),
          bow_hits: json.sw_doubles_bow_hits ?? 0,
          bow_shots: json.sw_doubles_bow_shots ?? 0,
          damage_dealt: json.sw_doubles_damage_dealt ?? 0,
          deaths: json.sw_doubles_deaths ?? 0,
          health_regenerated: json.sw_doubles_health_regenerated ?? 0,
          kills: json.sw_doubles_kills ?? 0,
          losses: json.sw_doubles_losses ?? 0,
          melee_ratio: cutOff((json.sw_doubles_melee_hits || 0) / (json.sw_doubles_melee_swings || 1)),
          melee_hits: json.sw_doubles_melee_hits ?? 0,
          melee_swings: json.sw_doubles_melee_swings ?? 0,
          rounds_played: json.sw_doubles_rounds_played ?? 0,
          wins: json.sw_doubles_wins ?? 0
        },
        duels: {
          best_winstreak: json.best_winstreak_mode_sw_duel ?? 0,
          current_winstreak: json.current_winstreak_mode_sw_duel ?? 0,
          kit: prettyPrintSkywarsKit(json.sw_duels_kit_new3 ?? ''),
          kit_raw: json.sw_duels_kit_new3 ?? '',
          wlr: cutOff((json.sw_duel_wins || 0) / (json.sw_duel_losses || 1)),
          kdr: cutOff((json.sw_duel_kills || 0) / (json.sw_duel_deaths || 1)),
          blocks_placed: json.sw_duel_blocks_placed ?? 0,
          bow_ratio: cutOff((json.sw_duel_bow_hits || 0) / (json.sw_duel_bow_shots || 1)),
          bow_hits: json.sw_duel_bow_hits ?? 0,
          bow_shots: json.sw_duel_bow_shots ?? 0,
          damage_dealt: json.sw_duel_damage_dealt ?? 0,
          deaths: json.sw_duel_deaths ?? 0,
          health_regenerated: json.sw_duel_health_regenerated ?? 0,
          kills: json.sw_duel_kills ?? 0,
          losses: json.sw_duel_losses ?? 0,
          melee_ratio: cutOff((json.sw_duel_melee_hits || 0) / (json.sw_duel_melee_swings || 1)),
          melee_hits: json.sw_duel_melee_hits ?? 0,
          melee_swings: json.sw_duel_melee_swings ?? 0,
          rounds_played: json.sw_duel_rounds_played ?? 0,
          wins: json.sw_duel_wins ?? 0
        }
      },
      sumo: {
        division: getDivision(json, 'sumo') ?? '',
        best_winstreak: json.best_sumo_winstreak ?? 0,
        current_winstreak: json.current_sumo_winstreak ?? 0,
        wlr: cutOff((json.sumo_duel_wins || 0) / (json.sumo_duel_losses || 1)),
        kdr: cutOff((json.sumo_duel_kills || 0) / (json.sumo_duel_deaths || 1)),
        deaths: json.sumo_duel_deaths ?? 0,
        kills: json.sumo_duel_kills ?? 0,
        losses: json.sumo_duel_losses ?? 0,
        melee_ratio: cutOff((json.sumo_duel_melee_hits || 0) / (json.sumo_duel_melee_swings || 1)),
        melee_hits: json.sumo_duel_melee_hits ?? 0,
        melee_swings: json.sumo_duel_melee_swings ?? 0,
        rounds_played: json.sumo_duel_rounds_played ?? 0,
        wins: json.sumo_duel_wins ?? 0
      }
    }
  };
}
