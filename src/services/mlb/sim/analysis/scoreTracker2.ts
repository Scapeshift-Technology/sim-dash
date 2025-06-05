import { PlayResult } from "@/types/mlb";
import { PeriodTypeCode, PeriodKey } from "@/types/statCaptureConfig";

// ---------- New types ----------

export type ScoreAtPeriod = {
    homeScore: number;
    awayScore: number;
}

// ---------- Main function ----------

export function getScoreForPeriod(
  plays: PlayResult[], 
  periodTypeCode: PeriodTypeCode, 
  periodNumber: number
): ScoreAtPeriod {
  switch (periodTypeCode) {
    case 'M':
      if (periodNumber === 0) {
        return getFullGameScore(plays);
      }
      throw new Error(`Invalid period number ${periodNumber} for Match period type`);
    
    case 'H':
      if (periodNumber === 1) {
        return getScoreAtInning(plays, 5);
      }
      throw new Error(`Invalid period number ${periodNumber} for Half period type`);
    
    case 'I':
      if (periodNumber === 1) {
        return getScoreAtInning(plays, periodNumber);
      } else {
        const currentScore = getScoreAtInning(plays, periodNumber);
        const priorScore = getScoreAtInning(plays, periodNumber - 1);
        return {
          homeScore: currentScore.homeScore - priorScore.homeScore,
          awayScore: currentScore.awayScore - priorScore.awayScore,
        }
      }
    default:
      throw new Error(`Unknown period type code: ${periodTypeCode}`);
  }
}

function getFullGameScore(plays: PlayResult[]): ScoreAtPeriod {
  if (plays.length === 0) {
    return { homeScore: 0, awayScore: 0 };
  }
  
  const lastPlay = plays[plays.length - 1];
  return {
    homeScore: lastPlay.homeScore + (!lastPlay.topInning ? lastPlay.runsOnPlay : 0),
    awayScore: lastPlay.awayScore + (lastPlay.topInning ? lastPlay.runsOnPlay : 0),
  };
}

function getScoreAtInning(
  plays: PlayResult[], 
  endInning: number
): ScoreAtPeriod {
  for (let i = plays.length - 1; i >= 0; i--) {
    const play = plays[i];
    if (play.inning <= endInning) {
      return {
        homeScore: play.homeScore + (!play.topInning ? play.runsOnPlay : 0),
        awayScore: play.awayScore + (play.topInning ? play.runsOnPlay : 0),
      };
    }
  }

  console.error(`getScoreAtInning: No play found at or before inning ${endInning}`);
  return { homeScore: 0, awayScore: 0 };
}

export function getScoreForTypeAndPeriod(
  plays: PlayResult[],
  type: 'combined' | 'home' | 'away',
  periodTypeCode: PeriodTypeCode,
  periodNumber: number
): number {
  const { homeScore, awayScore } = getScoreForPeriod(plays, periodTypeCode, periodNumber);

  switch (type) {
    case 'combined':
      return homeScore + awayScore;
    case 'home':
      return homeScore;
    case 'away':
      return awayScore;
  }
} 
