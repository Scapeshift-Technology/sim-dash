import { PlayResult } from "@/types/mlb";

export interface GameTimeframe {
  endInning?: number;  // undefined means full game
  topInningEnd?: boolean;  // true means include top of inning
}

export function getScoreAtTimeframe(plays: PlayResult[], timeframe: GameTimeframe): { homeScore: number, awayScore: number } {
  if (!timeframe.endInning) {
    // Full game - use last play's score
    const lastPlay = plays[plays.length - 1];
    return {
      homeScore: lastPlay.homeScore + (!lastPlay.topInning ? lastPlay.runsOnPlay : 0),
      awayScore: lastPlay.awayScore + (lastPlay.topInning ? lastPlay.runsOnPlay : 0),
    };
  }

  // Find the last play before or at the specified inning
  for (let i = plays.length - 1; i >= 0; i--) {
    const play = plays[i];
    if (play.inning < timeframe.endInning || 
        (play.inning === timeframe.endInning && 
         (!timeframe.topInningEnd || !play.topInning))) {
      return {
        homeScore: play.homeScore + (!play.topInning ? play.runsOnPlay : 0),
        awayScore: play.awayScore + (play.topInning ? play.runsOnPlay : 0),
      };
    }
  }

  // Shouldn't get here if plays array is valid
  console.error('getScoreAtTimeframe: No play found at or before specified inning');
  return { homeScore: 0, awayScore: 0 };
}

export function getScoreForType(
  plays: PlayResult[],
  type: 'combined' | 'home' | 'away',
  period: 'fullGame' | 'firstFive'
): number {
  const timeframe: GameTimeframe = period === 'fullGame' 
    ? {} 
    : { endInning: 5, topInningEnd: false };

  const { homeScore, awayScore } = getScoreAtTimeframe(plays, timeframe);

  switch (type) {
    case 'combined':
      return homeScore + awayScore;
    case 'home':
      return homeScore;
    case 'away':
      return awayScore;
  }
} 