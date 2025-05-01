import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Drawer, List, ListItemButton, ListItemText, CircularProgress, Typography, Box, Toolbar
} from '@mui/material';
import { AppDispatch } from '../store/store'; // Adjust path if needed
import { fetchLeagues, selectAllLeagues, selectLeaguesLoading, selectLeaguesError, openTab } from '../store/slices/leagueSlice'; // Adjust path if needed and added openTab

// Define props for Sidebar, including width and resize handler
interface SidebarProps {
    currentWidth: number;
    onResize: (newWidth: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentWidth, onResize }) => {
    const dispatch: AppDispatch = useDispatch();
    const leagues = useSelector(selectAllLeagues);
    const loading = useSelector(selectLeaguesLoading);
    const error = useSelector(selectLeaguesError);
    const sidebarRef = useRef<HTMLDivElement>(null); // Ref for the drawer element
    const isResizing = useRef(false); // Ref to track resizing state

    useEffect(() => {
        // Fetch leagues only if the state is idle (initial load)
        if (loading === 'idle') {
            console.log("Sidebar useEffect: Dispatching fetchLeagues");
            dispatch(fetchLeagues());
        }
    }, [dispatch, loading]); // Dependency array includes dispatch and loading status

    // Click handler for league items
    const handleLeagueClick = (league: { League: string }) => {
        console.log(`League clicked: ${league.League.trim()}`);
        dispatch(openTab(league)); // Dispatch action to open/focus tab
    };

    // Mouse move handler for resizing
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        console.log('Mouse move:', e.clientX);
        // Calculate new width based on mouse position relative to the viewport left
        const newWidth = e.clientX; // Simplified: assumes sidebar starts at clientX=0
        onResize(newWidth); // Call the resize handler passed from MainLayout
    }, [onResize]);

    // Mouse up handler to stop resizing
    const handleMouseUp = useCallback(() => {
        console.log('Mouse up, stopping resize');
        isResizing.current = false;
        // Remove global listeners when resizing stops
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        // Optional: Remove user-select styling from body
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }, [handleMouseMove]); // handleMouseMove is stable due to useCallback

    // Mouse down handler to start resizing
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        console.log('Mouse down, starting resize');
        e.preventDefault(); // Prevent text selection during drag
        isResizing.current = true;
        // Add global listeners to track mouse movement outside the handle
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        // Optional: Prevent text selection while resizing
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [handleMouseMove, handleMouseUp]); // Dependencies are stable callbacks

     // Cleanup listeners on component unmount
     useEffect(() => {
         return () => {
             // Ensure listeners are removed if component unmounts while resizing
             window.removeEventListener('mousemove', handleMouseMove);
             window.removeEventListener('mouseup', handleMouseUp);
         };
     }, [handleMouseMove, handleMouseUp]); // Effect depends on the handlers

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
                        key={league.League.trim()}
                        onClick={() => handleLeagueClick(league)}
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
                width: currentWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: currentWidth, boxSizing: 'border-box' },
            }}
            ref={sidebarRef}
        >
            <Toolbar /> {/* Provides spacing below the AppBar if one exists */}
            <Box sx={{ overflow: 'auto', flexGrow: 1, position: 'relative' }}>
                {content}
            </Box>
            {/* Resizer Handle - replace Divider with a more prominent handle */}
            <Box
                onMouseDown={handleMouseDown}
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '10px',
                    height: '100%',
                    cursor: 'col-resize',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    },
                    zIndex: 1200, // Ensure it's above drawer content but below AppBar
                }}
            />
        </Drawer>
    );
};

export default Sidebar; 