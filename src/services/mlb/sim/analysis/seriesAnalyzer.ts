import { SeriesProbsMLB, SimResultsMLB } from "@/types/bettingResults";

function calculateSeriesWinProbability(gameResults: {[key: number]: SimResultsMLB}): SeriesProbsMLB | undefined {
  if (Object.keys(gameResults).length !== 3) {
    return;
  }
  // Extract win probabilities for each game
  const game1HomeWinProb = gameResults[1].sides.home.fullGame["0"].success / gameResults[1].sides.home.fullGame["0"].total;
const game2HomeWinProb = gameResults[2].sides.home.fullGame["0"].success / gameResults[2].sides.home.fullGame["0"].total;
const game3HomeWinProb = gameResults[3].sides.home.fullGame["0"].success / gameResults[3].sides.home.fullGame["0"].total;

  // Calculate series win probability for home team
  const homeSeriesWinProb = (
    // Win all 3 games
    (game1HomeWinProb * game2HomeWinProb * game3HomeWinProb) +
    // Win exactly 2 games (3 possible combinations)
    (game1HomeWinProb * game2HomeWinProb * (1 - game3HomeWinProb)) +
    (game1HomeWinProb * (1 - game2HomeWinProb) * game3HomeWinProb) +
    ((1 - game1HomeWinProb) * game2HomeWinProb * game3HomeWinProb)
  );

  return {
    home: {
      winPercent: homeSeriesWinProb,
      lossPercent: 1 - homeSeriesWinProb
    },
    away: {
      winPercent: 1 - homeSeriesWinProb,
      lossPercent: homeSeriesWinProb
    }
  };
}

export { calculateSeriesWinProbability };