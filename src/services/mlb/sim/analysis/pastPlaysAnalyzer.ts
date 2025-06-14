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
  };

  return simPlays;
}

export { pastPlaysToSimPlays };

// ---------- Helper functions ----------

function pastPlayToSimPlay(pastPlay: MlbGameApiPlay): PlayResult {
  // Get bases before play
  const baseRunnersBefore: (number | null)[] = [null, null, null]; // [1B, 2B, 3B]
  for (const runner of pastPlay.runners) {
    if (runner.movement.originBase && runner.details.runner.id) {
      switch (runner.movement.originBase) {
        case '1B':
          baseRunnersBefore[0] = runner.details.runner.id;
          break;
        case '2B':
          baseRunnersBefore[1] = runner.details.runner.id;
          break;
        case '3B':
          baseRunnersBefore[2] = runner.details.runner.id;
          break;
      }
    }
  }

  // Get base runners after the play
  const baseRunnersAfter: (number | null)[] = [
    pastPlay.matchup.postOnFirst ? pastPlay.matchup.postOnFirst.id : null,
    pastPlay.matchup.postOnSecond ? pastPlay.matchup.postOnSecond.id : null,
    pastPlay.matchup.postOnThird ? pastPlay.matchup.postOnThird.id : null
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
    baseRunnersBefore: baseRunnersBefore,
    baseRunnersAfter: baseRunnersAfter
  }

  return simPlay;
}


