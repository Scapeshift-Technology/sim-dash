import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    List, ListItemButton, ListItemText, CircularProgress, Typography, Box
} from '@mui/material';

import { AppDispatch } from '@/store/store';
import { fetchLeagues, selectAllLeagues, selectLeaguesLoading, selectLeaguesError } from '@/simDash/store/slices/leagueSlice';
import { initializeLeague } from '@/simDash/store/slices/scheduleSlice';
import { initializeLeagueSimInputs } from '@/simDash/store/slices/simInputsSlice';
import { selectIsAuthenticated, selectDatabaseConnectionStatus } from '@/store/slices/authSlice';

import { League, LeagueName } from '@@/types/league';

import GenericSidebar from '@/layouts/components/GenericSidebar';

// ---------- Main component ----------

interface LeagueSidebarProps {
    currentWidth: number;
    onResize: (newWidth: number) => void;
}

const LeagueSidebar: React.FC<LeagueSidebarProps> = ({ currentWidth, onResize }) => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // ---------- State ----------

    const leagues = useSelector(selectAllLeagues);
    const loading = useSelector(selectLeaguesLoading);
    const error = useSelector(selectLeaguesError);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const databaseStatus = useSelector(selectDatabaseConnectionStatus);

    // ---------- Handlers ----------

    const handleLeagueClick = (leagueName: string) => {
        console.log(`League clicked: ${leagueName}`);
        // Navigate to league-specific page instead of opening tab
        navigate(`/leagues/${encodeURIComponent(leagueName.trim())}`);
    };

    // ---------- useEffect ----------

    useEffect(() => {    
        const canFetch = loading === 'idle' && isAuthenticated && databaseStatus === 'connected';
        
        if (canFetch) {
            dispatch(fetchLeagues());
        }
    }, [dispatch, loading, isAuthenticated, databaseStatus, leagues.length]);

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
                {leagues.map((league: League) => {
                    const leagueName = league.League.trim();
                    const leaguePath = `/leagues/${encodeURIComponent(leagueName)}`;
                    const isActive = location.pathname.startsWith(leaguePath);
                    
                    return (
                        <ListItemButton
                            key={leagueName}
                            selected={isActive}
                            onClick={() => handleLeagueClick(leagueName)}
                        >
                            <ListItemText primary={leagueName} />
                        </ListItemButton>
                    );
                })}
            </List>
        );
    }

    return (
        <GenericSidebar currentWidth={currentWidth} onResize={onResize}>
            {content}
        </GenericSidebar>
    );
};

export default LeagueSidebar; 