import React, { useEffect } from 'react';
import { Box } from '@mui/material';

import FolderTabs, { FolderTab } from './components/FolderTabs';
import MainMarketsTab from './components/MainMarketsTab';
import OUPropsTab from './components/OUPropsTab';
import YesNoTab from './components/YesNoTab';

import { useDispatch } from 'react-redux';
import { initializeLeague } from '@/apps/simDash/store/slices/statCaptureSettingsSlice';

// ---------- Constants ----------

const LEAGUE_NAME = 'MLB';

// ---------- Main component ----------

const MLBSettingsView: React.FC = () => {

    // ---------- Redux ----------

    const dispatch = useDispatch();

    // ---------- Effects ----------

    useEffect(() => {
        dispatch(initializeLeague(LEAGUE_NAME)); // If the settings already exist, they won't be overwritten
    }, [dispatch]);

    // ---------- Tab configuration ----------

    const settingsTabs: FolderTab[] = [
        {
            id: 'main-markets',
            label: 'Main Markets',
            content: <MainMarketsTab leagueName={LEAGUE_NAME}/>
        },
        {
            id: 'ou-props',
            label: 'O/U Props',
            content: <OUPropsTab/>
        },
        {
            id: 'yesno-props',
            label: 'Yes/No Props',
            content: <YesNoTab/>
        }
    ];

    // ---------- Render ----------

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            mt: 2,
            flexGrow: 1,
            minHeight: 0
        }}>
            <FolderTabs 
                tabs={settingsTabs}
                leagueName={LEAGUE_NAME}
                ariaLabel="MLB simulation settings tabs"
            />
        </Box>
    );
};

export default MLBSettingsView;