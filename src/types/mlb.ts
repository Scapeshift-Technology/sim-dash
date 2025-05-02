// Define types related to MLB lineups and player stats

export interface Stats {
    adj_perc_K: number;
    adj_perc_BB: number;
    // Add other relevant stats as needed...
    // Example: wOBA, FIP, etc.
}

export interface PlayerStats {
    hitVsL?: Stats; // Optional: A pitcher won't have hitting stats
    hitVsR?: Stats; // Optional: A pitcher won't have hitting stats
    pitchVsL?: Stats; // Optional: A batter won't have pitching stats
    pitchVsR?: Stats; // Optional: A batter won't have pitching stats
}

export interface Player {
    id: number; // Unique player identifier (e.g., MLBAM ID)
    name: string;
    position?: string; // e.g., 'P', 'C', '1B', 'SS', 'LF', etc.
    battingOrder?: number; // For players in the lineup
    stats?: PlayerStats; // Include if stats are readily available
}

export interface TeamLineup {
    lineup: Player[]; // Players in batting order
    startingPitcher: Player;
    bullpen: Player[]; // Relief pitchers available
    // bench?: Player[]; // Future: players on the bench
}

export interface MatchupLineups {
    home: TeamLineup;
    away: TeamLineup;
} 

export interface MLBMatchupViewProps {
    league: string;
    date: string;
    participant1: string; // Away Team
    participant2: string; // Home Team
    daySequence?: number;
}
