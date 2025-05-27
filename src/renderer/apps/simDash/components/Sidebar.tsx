import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    List, ListItemButton, ListItemText, CircularProgress, Typography, Box
} from '@mui/material';
import { AppDispatch } from '@/store/store';
import { fetchLeagues, selectAllLeagues, selectLeaguesLoading, selectLeaguesError } from '@/simDash/store/slices/leagueSlice';
import { openLeagueTab } from '@/simDash/store/slices/tabSlice';
import { initializeLeague } from '@/simDash/store/slices/scheduleSlice';
import { initializeLeagueSimInputs } from '@/simDash/store/slices/simInputsSlice';
import { League, LeagueName } from '@@/types/league';
import GenericSidebar from '@/layouts/components/GenericSidebar';

interface SidebarProps {
    currentWidth: number;
    onResize: (newWidth: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentWidth, onResize }) => {
    const dispatch: AppDispatch = useDispatch();

    // ---------- State ----------

    const leagues = useSelector(selectAllLeagues);
    const loading = useSelector(selectLeaguesLoading);
    const error = useSelector(selectLeaguesError);

    // ---------- Handlers ----------

    const handleLeagueClick = (leagueName: string) => {
        console.log(`League clicked: ${leagueName}`);
        dispatch(openLeagueTab(leagueName as LeagueName));
    };

    // ---------- useEffect ----------

    useEffect(() => {
        // Fetch leagues only if the state is idle (initial load)
        if (loading === 'idle') {
            console.log("Sidebar useEffect: Dispatching fetchLeagues");
            dispatch(fetchLeagues());
        }
    }, [dispatch, loading]);

    useEffect(() => { // Effect to initialize schedule state for leagues
        if (loading === 'succeeded' && leagues.length > 0) {
            console.log("Initializing schedule state for leagues:", leagues);
            leagues.forEach((league: League) => {
                dispatch(initializeLeague(league.League.trim()));
                console.log("Initialized schedule state for league:", league.League.trim());
                dispatch(initializeLeagueSimInputs(league.League.trim() as LeagueName));
                console.log("Initialized sim inputs for league:", league.League.trim());
            });
        }
    }, [dispatch, loading, leagues]);

    // ---------- Render content ----------

    let content;
    if (loading === 'pending' || loading === 'idle') {
        content = (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
            </Box>
        );
    } else if (error) {
        content = (
            <Box padding={2}>
                <Typography color="error">Error: {error}</Typography>
                <button onClick={() => dispatch(fetchLeagues())}>Retry</button>
            </Box>
        );
    } else if (leagues.length === 0) {
        content = (
             <Box padding={2}>
                 <Typography>No leagues found.</Typography>
             </Box>
         );
    } else {
        content = (
            <List>
                {leagues.map((league: League) => (
                    <ListItemButton
                        key={league.League.trim()}
                        onClick={() => handleLeagueClick(league.League.trim())}
                    >
                        <ListItemText primary={league.League.trim()} />
                    </ListItemButton>
                ))}
            </List>
        );
    }

    return (
        <GenericSidebar currentWidth={currentWidth} onResize={onResize}>
            {content}
        </GenericSidebar>
    );
};

export default Sidebar; 