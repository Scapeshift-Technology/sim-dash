import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Container, List, ListItem, ListItemText, CircularProgress, Paper } from '@mui/material';
import { selectAllLeagues, selectLeaguesLoading } from '@/simDash/store/slices/leagueSlice';
import { League } from '@@/types/league';

const LeaguesHomePage: React.FC = () => {
    const leagues = useSelector(selectAllLeagues);
    const loading = useSelector(selectLeaguesLoading);

    if (loading === 'pending' || loading === 'idle') {
        return (
            <Container sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading leagues...</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                League Dashboard
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    How to Use:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    1. Select a league from the sidebar to view its schedule
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    2. Click on any matchup row to open detailed analysis in a new tab
                </Typography>
                <Typography variant="body1">
                    3. Use the tabs at the top to switch between different matchups and league views
                </Typography>
            </Paper>

            {leagues.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Available Leagues ({leagues.length})
                    </Typography>
                    <Paper sx={{ mt: 2 }}>
                        <List>
                            {leagues.map((league: League) => (
                                <ListItem key={league.League.trim()}>
                                    <ListItemText 
                                        primary={league.League.trim()}
                                        secondary="Click from sidebar to view schedule and open matchup tabs"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Box>
            )}
        </Container>
    );
};

export default LeaguesHomePage; 