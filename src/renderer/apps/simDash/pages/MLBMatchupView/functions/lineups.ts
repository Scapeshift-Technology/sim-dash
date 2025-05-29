import { MatchupLineups, TeamLineup } from "@/preload";
import { MlbLiveDataApiResponse, Player, TeamType } from "@@/types/mlb";
import { 
  createCurrentLineup, createCurrentBench, createCurrentUnavailableHitters,
  createCurrentStartingPitcher, createCurrentBullpen,
  createCurrentUnavailablePitchers
 } from "@@/services/mlb/utils/gameState";

// ---------- Main functions ----------

function createLiveMatchupLineups(gameLineups: MatchupLineups, liveGameData: MlbLiveDataApiResponse): MatchupLineups | undefined {
  try {
    // Lineups
    const awayTeamLineup = createLiveTeamLineup(
      gameLineups.away,
      liveGameData,
      gameLineups.away.teamName,
      'away'
    );
    const homeTeamLineup = createLiveTeamLineup(
      gameLineups.home,
      liveGameData,
      gameLineups.home.teamName,
      'home'
    );

    return {
      away: awayTeamLineup as TeamLineup,
      home: homeTeamLineup as TeamLineup
    };
  } catch (error) {
    console.error('Error creating live matchup lineups:', error);
    return undefined;
  }
}

export { createLiveMatchupLineups }

// ---------- Helper functions ----------

function createLiveTeamLineup(teamLineup: TeamLineup, liveGameData: MlbLiveDataApiResponse, teamName: string, teamType: TeamType): TeamLineup {
  // Lineup
  const lineup: Player[] = createCurrentLineup(
    teamLineup, 
    liveGameData.liveData.boxscore.teams[teamType].battingOrder
  );

  // Bench
  const bench: Player[] = createCurrentBench(
    teamLineup,
    liveGameData.liveData.boxscore.teams[teamType].bench
  );

  // Unavailable hitters
  const unavailableHitters: Player[] = createCurrentUnavailableHitters(
    teamLineup,
    liveGameData,
    teamType
  );

  // Starting pitcher
  const startingPitcher: Player = createCurrentStartingPitcher(
    teamLineup,
    liveGameData,
    teamType
  );

  // Bullpen
  const bullpen: Player[] = createCurrentBullpen(
    teamLineup, 
    liveGameData.liveData.boxscore.teams[teamType].bullpen,
    liveGameData.liveData.boxscore.teams[teamType].pitchers
  );

  // Unavailable pitchers
  const unavailablePitchers: Player[] = createCurrentUnavailablePitchers(
    teamLineup,
    liveGameData,
    teamType
  );

  // Return
  return {
    lineup: lineup,
    startingPitcher: startingPitcher,
    bullpen: bullpen,
    bench: bench,

    unavailableHitters: unavailableHitters,
    unavailablePitchers: unavailablePitchers,
    
    teamName: teamName
  }
}


