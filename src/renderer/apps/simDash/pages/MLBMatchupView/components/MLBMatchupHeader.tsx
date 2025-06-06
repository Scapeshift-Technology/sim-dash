import React from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Alert,
    Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';

import MLBSimulationResultsSummary from '@/simDash/components/simulation/MLBSimulationResultsSummary';
import SimulationButton from './SimulationButton';

import { useDispatch } from 'react-redux';
import { openSettingsTab } from '@/simDash/store/slices/tabSlice';
import { AppDispatch } from '@/store/store';

import { MlbLiveDataApiResponse } from '@@/types/mlb';
import { SimType } from '@@/types/mlb/mlb-sim';
import { LeagueName } from '@@/types/league';
import type { SimHistoryEntry } from '@/types/simHistory';

// ---------- Main component ----------

interface MLBMatchupHeaderProps {
    participant1: string;
    participant2: string;
    daySequence: number | undefined;
    dateTime: string;
    isSimulating: boolean;
    simError: string | null;
    simResults: SimHistoryEntry[] | undefined;
    simStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    simType: SimType | undefined;
    lineupData: any; // TODO: Add proper type
    hasInvalidLeans: boolean;
    seriesGames?: { [key: string]: any };
    liveGameData: MlbLiveDataApiResponse | undefined;
    leagueName: LeagueName;
    onRefresh: () => void;
    onRunSimulation: (simType: SimType) => void;
    onChangeSimType: (simType: SimType) => void;
}

const MLBMatchupHeader: React.FC<MLBMatchupHeaderProps> = ({
    participant1,
    participant2,
    daySequence,
    dateTime,
    isSimulating,
    simError,
    simResults,
    simStatus,
    simType,
    lineupData,
    hasInvalidLeans,
    seriesGames,
    liveGameData,
    leagueName,
    onRefresh,
    onRunSimulation,
    onChangeSimType
}) => {
    const dispatch = useDispatch<AppDispatch>();
    
    // ---------- State ----------

    const localDateTime = new Date(dateTime);
    const timeString = localDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const dateString = localDateTime.toLocaleDateString();

    // ---------- Event handlers ----------

    const handleSimSettingsClick = () => {
        dispatch(openSettingsTab({
            league: leagueName
        }));
    };

    // ---------- Rendering ----------

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 2, 
                mb: 3,
                backgroundColor: 'background.paper'
            }}
        >
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
            }}>
                <Box>
                    <Typography variant="h5" gutterBottom>
                        {participant1} @ {participant2}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        {dateString} • {timeString}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title="Reload lineups">
                        <IconButton 
                            onClick={onRefresh}
                            size="small"
                            disabled={!lineupData}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Capture Configuration Settings">
                        <IconButton 
                            size="small" 
                            onClick={handleSimSettingsClick}
                            sx={{ mr: 1 }}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            {simError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {simError}
                </Alert>
            )}
            <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'stretch'
            }}>
                <Box sx={{ 
                    flex: '0 0 200px',
                    maxWidth: '200px'
                }}>
                    <SimulationButton
                        simType={simType}
                        isSimulating={isSimulating}
                        disabled={isSimulating || !lineupData || hasInvalidLeans}
                        seriesGames={seriesGames}
                        liveGameData={liveGameData}
                        leagueName={leagueName}
                        onRunSimulation={onRunSimulation}
                        onChangeSimType={onChangeSimType}
                    />
                </Box>
                <Box sx={{ 
                    flex: '0 0 200px',
                    maxWidth: '200px'
                }}>
                    <MLBSimulationResultsSummary
                        awayTeamName={participant1}
                        homeTeamName={participant2}
                        daySequence={daySequence}
                        displayHistory={true}
                        simHistory={simResults || []}
                        isLoading={simStatus === 'loading'}
                    />
                </Box>
            </Box>
        </Paper>
    );
};

export default MLBMatchupHeader; 