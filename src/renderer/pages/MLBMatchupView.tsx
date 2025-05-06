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
    Divider,
    Button
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { MatchupLineups, TeamLineup, Player, MLBMatchupViewProps } from '@/types/mlb';

function renderPlayerEntry(player: Player) {
  return (
    <ListItemText primary={`${player.battingOrder ? player.battingOrder + '. ' : ''}${player.name} | Pos: ${player.position ?? 'N/A'}`} />
  )
  {/* TODO: Display relevant player stats */}
}

const MLBMatchupView: React.FC<MLBMatchupViewProps> = ({ 
    league,
    date,
    participant1,
    participant2,
    daySequence 
}) => {
    // ---------- State ----------
    const [lineupData, setLineupData] = useState<MatchupLineups | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ---------- Effect ----------
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

    // ---------- Handlers ----------
    const handleRunSimulation = async () => {
        console.log('Running simulation for:', { participant1, participant2, date });

        const results = await window.electronAPI.simulateMatchupMLB({
          numGames: 50000
        });
        console.log('Simulation results:', results);
    };

    // ---------- Render functions ----------
    const renderTeamLineup = (teamName: string, teamData: TeamLineup | undefined) => {
        if (!teamData) return <Typography>Lineup data unavailable.</Typography>;

        const renderPlayerList = (players: Player[], subheader: string) => (
          <List 
            dense 
            subheader={
              <ListSubheader sx={{ lineHeight: '30px', pb: 0 }}>
                {subheader}
              </ListSubheader>
            }
            sx={{ pt: 0 }}
          >
                {players.map((player) => (
                    <ListItem key={player.id} sx={{ py: 0 }}>
                        {renderPlayerEntry(player)}
                    </ListItem>
                ))}
            </List>
        );

        return (
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>{teamName} Details</Typography>
            <Divider sx={{ mb: 1 }}/>
            
            {renderPlayerList([teamData.startingPitcher], 'Starting Pitcher')}
            {renderPlayerList(teamData.lineup, 'Batting Order')}
            {renderPlayerList(teamData.bullpen, 'Bullpen')}
            {/* Add Bench here later */}
          </Paper>
        );
    };

    // ---------- Render ----------
    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!lineupData) return <Alert severity="info">No lineup data found.</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Matchup: {participant1} @ {participant2} ({date})
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleRunSimulation}
                >
                    Run Simulation
                </Button>
            </Box>
            <Grid container spacing={2}>
                <Box sx={{ width: { xs: '12', md: '6' }, p: 1 }}>
                    {renderTeamLineup(`${participant1} (Away)`, lineupData.away)}
                </Box>
                <Box sx={{ width: { xs: '12', md: '6' }, p: 1 }}>
                    {renderTeamLineup(`${participant2} (Home)`, lineupData.home)}
                </Box>
            </Grid>
        </Box>
    );
};

export default MLBMatchupView; 