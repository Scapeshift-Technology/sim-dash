import { ColumnConfig } from "@/simDash/components/Inline";
import { GameMetadataMLB, MatchupLineups } from "@@/types/mlb";
import { ReducedMatchupLineups } from "@@/types/simHistory";

const convertTableToTSV = (data: Record<string, any>[], columns: ColumnConfig[]): string => {
  // Create header row using column labels
  const headers = columns.map(col => col.label).join('\t');

  // Convert each data row
  const rows = data.map(row => {
    return columns
    .map(col => {
      const value = row[col.name];
      if (value === null || value === undefined) return '';
    
      // Handle different data types
      switch (col.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'time':
        return new Date(value).toLocaleTimeString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
      }
    })
    .join('\t');
  });

  // Combine headers and rows
  return [headers, ...rows].join('\n');
};

function convertLineupsToTSV(
    gameLineups: MatchupLineups | ReducedMatchupLineups | null, 
    gameMetadata: GameMetadataMLB | null,
    awayTeamName: string | null, 
    homeTeamName: string | null
): string {
    if (!gameLineups || !gameMetadata || !awayTeamName || !homeTeamName) return '';

    const { away, home } = gameLineups;
    const rows: string[] = [];

    // Add lineup source
    rows.push(`Lineup Source\t${gameMetadata.lineupsSource}`);
    
    // Add header row
    rows.push(`Position\t${awayTeamName}\t${homeTeamName}`);

    // Add starting pitchers
    const awayStartingPitcher = (away.startingPitcher as any)?.fullName || away.startingPitcher?.name || '';
    const homeStartingPitcher = (home.startingPitcher as any)?.fullName || home.startingPitcher?.name || '';
    rows.push(`Pitcher\t${awayStartingPitcher}\t${homeStartingPitcher}`);

    // Add batters
    const maxBatters = Math.max(away.lineup.length, home.lineup.length);
    for (let i = 0; i < maxBatters; i++) {
        const awayBatterName = (away.lineup[i] as any)?.fullName || away.lineup[i]?.name || '';
        const homeBatterName = (home.lineup[i] as any)?.fullName || home.lineup[i]?.name || '';
        rows.push(`Batter${i + 1}\t${awayBatterName}\t${homeBatterName}`);
    }

    return rows.join('\n');
}

export { convertTableToTSV, convertLineupsToTSV };