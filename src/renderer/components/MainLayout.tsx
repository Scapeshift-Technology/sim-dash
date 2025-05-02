import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Button,
    AppBar,
    Toolbar,
    Container,
    CssBaseline,
    Tabs,
    Tab as MuiTab,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { AppDispatch } from '../store/store';
import { logoutUser, selectUsername } from '../store/slices/authSlice';
import { 
    selectOpenTabs, 
    selectActiveTabId, 
    setActiveTab, 
    closeTab, 
    selectActiveTabData 
} from '../store/slices/leagueSlice';
import type { Tab } from '../store/slices/leagueSlice';
import Sidebar from './Sidebar';
import LeagueScheduleView from './LeagueScheduleView';
import MLBMatchupView from './MLBMatchupView';

const MainLayout: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const username = useSelector(selectUsername);
    const openTabs = useSelector(selectOpenTabs);
    const activeTabId = useSelector(selectActiveTabId);
    const activeTabData = useSelector(selectActiveTabData);
    const [drawerWidth, setDrawerWidth] = useState(240);
    const minDrawerWidth = 150;
    const maxDrawerWidth = 500;

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const handleResize = useCallback((newWidth: number) => {
        setDrawerWidth(Math.max(minDrawerWidth, Math.min(newWidth, maxDrawerWidth)));
    }, [minDrawerWidth, maxDrawerWidth]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        dispatch(setActiveTab(newValue));
    };

    const handleCloseTab = (event: React.MouseEvent, tabIdToClose: string) => {
        event.stopPropagation();
        dispatch(closeTab(tabIdToClose));
    };

    const renderTabContent = (tab: Tab | undefined) => {
        if (!tab) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Select a league from the sidebar or open a matchup.</Typography>
                </Box>
            );
        }

        switch (tab.type) {
            case 'league':
                return <LeagueScheduleView key={tab.id} league={tab.league} />;
            case 'matchup':
                return <MLBMatchupView 
                            key={tab.id} 
                            league={tab.league} 
                            date={tab.date} 
                            participant1={tab.participant1} 
                            participant2={tab.participant2} 
                            daySequence={tab.daySequence} 
                        />;
            default:
                return <Typography>Unknown tab type</Typography>;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        SimDash
                    </Typography>
                    <Typography id="welcome-message" sx={{ mr: 2 }}>Welcome, {username || 'User'}!</Typography>
                    <Button id="logout-button" color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Sidebar currentWidth={drawerWidth} onResize={handleResize} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Toolbar />

                {openTabs.length > 0 && (
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={activeTabId ?? false}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="Open tabs"
                        >
                            {openTabs.map((tab) => (
                                <MuiTab
                                    key={tab.id}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {tab.type === 'league' ? tab.league : tab.label}
                                            <IconButton
                                                size="small"
                                                component="div"
                                                onClick={(e) => handleCloseTab(e, tab.id)}
                                                sx={{ ml: 1 }}
                                            >
                                                <CloseIcon fontSize="inherit" />
                                            </IconButton>
                                        </Box>
                                    }
                                    value={tab.id}
                                    id={`tab-${tab.id}`}
                                    aria-controls={`tabpanel-${tab.id}`}
                                />
                            ))}
                        </Tabs>
                    </Box>
                )}

                <Container 
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }} 
                    maxWidth={false}
                >
                    <Box 
                        role="tabpanel"
                        hidden={!activeTabData}
                        id={`tabpanel-${activeTabData?.id ?? ''}`}
                        aria-labelledby={`tab-${activeTabData?.id ?? ''}`}
                        sx={{ flexGrow: 1, overflow: 'auto' }}
                    >
                       {renderTabContent(activeTabData)}
                    </Box>
                </Container>
            </Box>
            
            <Box 
                component="footer" 
                sx={{ 
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2, 
                    textAlign: 'center', 
                    borderTop: 1, 
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    height: '64px',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    SimDash Footer
                </Typography>
            </Box>
        </Box>
    );
};

export default MainLayout; 