import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Drawer, List, ListItemButton, ListItemText, CircularProgress, Typography, Box, Toolbar
} from '@mui/material';
import { AppDispatch, RootState } from '../store/store'; // Adjust path if needed
import { fetchLeagues, selectAllLeagues, selectLeaguesLoading, selectLeaguesError } from '../store/slices/leagueSlice'; // Adjust path if needed

const drawerWidth = 240; // Define a standard width for the drawer

const Sidebar: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const leagues = useSelector(selectAllLeagues);
    const loading = useSelector(selectLeaguesLoading);
    const error = useSelector(selectLeaguesError);

    useEffect(() => {
        // Fetch leagues only if the state is idle (initial load)
        if (loading === 'idle') {
            console.log("Sidebar useEffect: Dispatching fetchLeagues");
            dispatch(fetchLeagues());
        }
    }, [dispatch, loading]); // Dependency array includes dispatch and loading status

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
                {/* Optionally add a retry button */}
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
                {leagues.map((league) => (
                    <ListItemButton
                        key={league.League}
                        // Add onClick handler later for tab management
                        // onClick={() => handleLeagueClick(league.League)}
                    >
                        <ListItemText primary={league.League.trim()} />
                    </ListItemButton>
                ))}
            </List>
        );
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            <Toolbar /> {/* Provides spacing below the AppBar if one exists */}
            <Box sx={{ overflow: 'auto' }}>
                {content}
            </Box>
        </Drawer>
    );
};

export default Sidebar; 