import React, { useState, useEffect } from 'react';
import {
    Box, 
    Typography, 
    CircularProgress, 
    Alert, 
    Grid, 
    Paper, 
    List, 
    ListItem, 
    ListItemText,
    ListSubheader,
    Divider
} from '@mui/material';

// Import the lineup types
import type { MatchupLineups, TeamLineup, Player } from '../../types/mlb';

interface MLBMatchupViewProps {
    league: string;
    date: string;
    participant1: string; // Away Team
    participant2: string; // Home Team
    daySequence?: number;
}

const MLBMatchupView: React.FC<MLBMatchupViewProps> = ({ 
    league,
    date,
    participant1,
    participant2,
    daySequence 
}) => {
    const [lineupData, setLineupData] = useState<MatchupLineups | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLineup = async () => {
            setLoading(true);
            setError(null);
            setLineupData(null);
            console.log(`MLBMatchupView: Fetching lineup for ${participant1} @ ${participant2} on ${date}`);
            try {
                const data = await window.electronAPI.fetchMlbLineup({
                    league,
                    date,
                    participant1,
                    participant2,
                    daySequence
                });
                console.log("MLBMatchupView: Received lineup data:", data);
                setLineupData(data);
            } catch (err: any) {
                console.error('Error fetching MLB lineup:', err);
                setError(err.message || 'Failed to fetch lineup data');
            } finally {
                setLoading(false);
            }
        };

        fetchLineup();
    }, [league, date, participant1, participant2, daySequence]); // Refetch if props change

    // Helper function to render a team's lineup details
    const renderTeamLineup = (teamName: string, teamData: TeamLineup | undefined) => {
        if (!teamData) return <Typography>Lineup data unavailable.</Typography>;

        const renderPlayerList = (players: Player[], subheader: string) => (
            <List dense subheader={<ListSubheader>{subheader}</ListSubheader>}>
                {players.map((player) => (
                    <ListItem key={player.id}>
                        <ListItemText 
                            primary={`${player.battingOrder ? player.battingOrder + '. ' : ''}${player.name}`}
                            secondary={`ID: ${player.id} | Pos: ${player.position ?? 'N/A'}`} 
                        />
                         {/* TODO: Display relevant player stats */}
                    </ListItem>
                ))}
            </List>
        );

        return (
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>{teamName} Details</Typography>
                <Divider sx={{ mb: 1 }}/>
                
                <Typography variant="subtitle1">Starting Pitcher:</Typography>
                <List dense>
                    <ListItem>
                       <ListItemText 
                            primary={teamData.startingPitcher.name}
                            secondary={`ID: ${teamData.startingPitcher.id} | Pos: P`} 
                        />
                         {/* TODO: Display relevant pitcher stats */}
                    </ListItem>
                </List>
                
                {renderPlayerList(teamData.lineup, 'Batting Order')}
                {renderPlayerList(teamData.bullpen, 'Bullpen')}
                 {/* Add Bench here later */}
            </Paper>
        );
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!lineupData) return <Alert severity="info">No lineup data found.</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Matchup: {participant1} @ {participant2} ({date})
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    {renderTeamLineup(`${participant1} (Away)`, lineupData.away)}
                </Grid>
                <Grid item xs={12} md={6}>
                    {renderTeamLineup(`${participant2} (Home)`, lineupData.home)}
                </Grid>
            </Grid>
        </Box>
    );
};

export default MLBMatchupView; 