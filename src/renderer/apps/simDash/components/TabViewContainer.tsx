import React from 'react';
import {
    Box,
    Typography,
    Container,
    Tabs,
    Tab as MuiTab,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { 
    selectOpenTabs, 
    selectActiveTabId, 
    setActiveTab, 
    closeTab, 
    selectActiveTabData 
} from '@/simDash/store/slices/tabSlice';

import LeagueScheduleView from '@/simDash/pages/LeagueScheduleView';
import MLBMatchupView from '@/simDash/pages/MLBMatchupView/MLBMatchupView';
import SettingsView from '@/simDash/pages/SettingsView';

import type { Tab } from '@/types/league';

// ---------- Main component ----------

const TabViewContainer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const openTabs = useSelector(selectOpenTabs);
    const activeTabId = useSelector(selectActiveTabId);
    const activeTabData = useSelector(selectActiveTabData);

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
                            key={tab.matchId} 
                            matchId={tab.matchId}
                            league={tab.league} 
                            date={tab.date} 
                            dateTime={tab.dateTime}
                            participant1={tab.participant1} 
                            participant2={tab.participant2} 
                            daySequence={tab.daySequence} 
                        />;
            case 'settings':
                return <SettingsView league={tab.league}/>;
            default:
                return <Typography>Unknown tab type</Typography>;
        }
    };

    return (
        <>
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
                sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    mb: '64px'
                }} 
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
        </>
    );
};

export default TabViewContainer; 