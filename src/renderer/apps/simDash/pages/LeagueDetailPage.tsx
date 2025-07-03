import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Container } from '@mui/material';
import { AppDispatch } from '@/store/store';
import { initializeLeague } from '@/simDash/store/slices/scheduleSlice';
import { initializeLeagueSimInputs } from '@/simDash/store/slices/simInputsSlice';
import { openLeagueTab, selectOpenTabs } from '@/simDash/store/slices/tabSlice';
import { LeagueName } from '@@/types/league';
import TabViewContainer from '@/simDash/components/TabViewContainer';

const LeagueDetailPage: React.FC = () => {
    const { leagueName } = useParams<{ leagueName: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const openTabs = useSelector(selectOpenTabs);

    // Decode the league name from URL
    const decodedLeagueName = leagueName ? decodeURIComponent(leagueName) : '';

    // ---------- useEffect ----------

    useEffect(() => {
        if (decodedLeagueName) {
            dispatch(initializeLeague(decodedLeagueName));
            dispatch(initializeLeagueSimInputs(decodedLeagueName as LeagueName));
            
            // Open the league tab to ensure we have the schedule view available
            dispatch(openLeagueTab(decodedLeagueName as LeagueName));
        }
    }, [dispatch, decodedLeagueName]);

    // ---------- Render ----------

    if (!decodedLeagueName) {
        return (
            <Container sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">
                    League not found
                </Typography>
            </Container>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TabViewContainer />
        </Box>
    );
};

export default LeagueDetailPage; 