import { MlbLiveDataApiResponse, PlayResult } from "@/types/mlb";
import { MlbGameApiPlay } from "@/types/mlb/mlb-api";

import { mlbEventToSimEvent } from "../../utils/events";

// ---------- Main function ----------

/**
 * Convert a game's past plays from the MLB API live game feed to sim plays.
 * 
 * @param liveGameData - The live game data from the MLB API
 * @returns An array of sim plays
 */
function pastPlaysToSimPlays(liveGameData: MlbLiveDataApiResponse): PlayResult[] {
  if (!liveGameData.liveData.plays.allPlays) return [];
  const simPlays: PlayResult[] = [];

  for (const play of liveGameData.liveData.plays.allPlays) {
    simPlays.push(pastPlayToSimPlay(play));
  }

  return simPlays;
}

export { pastPlaysToSimPlays };

// ---------- Helper functions ----------

function pastPlayToSimPlay(pastPlay: MlbGameApiPlay): PlayResult {
  // Get bases before play
  const runnerOriginBases = new Set(pastPlay.result.runners.map(runner => runner.movement.originBase || null).filter(base => base !== null));
  const basesBefore = [
    runnerOriginBases.has('1B'),
    runnerOriginBases.has('2B'),
    runnerOriginBases.has('3B')
  ];

  // Get bases after the play
  const basesAfter = [
    pastPlay.matchup.postOnFirst ? true : false,
    pastPlay.matchup.postOnSecond ? true : false,
    pastPlay.matchup.postOnThird ? true : false
  ]

  // Make play result
  const simPlay: PlayResult = {
    batterID: pastPlay.matchup.batter.id,
    pitcherID: pastPlay.matchup.pitcher.id,
    eventType: mlbEventToSimEvent(pastPlay.result.eventType),

    runsOnPlay: pastPlay.result.rbi,
    inning: pastPlay.about.inning,
    topInning: pastPlay.about.isTopInning,
    outs: pastPlay.about.outs,
    outsOnPlay: pastPlay.count.outs,
    awayScore: pastPlay.result.awayScore,
    homeScore: pastPlay.result.homeScore,
    basesBefore: basesBefore,
    basesAfter: basesAfter
  }

  return simPlay;
}


