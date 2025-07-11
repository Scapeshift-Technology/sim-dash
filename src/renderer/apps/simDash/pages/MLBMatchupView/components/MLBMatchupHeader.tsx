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

import MLBSimulationResultsSummary from '@/simDash/components/MLBSimulationResultsSummary';
import SimulationButton from './SimulationButton';
import AdvancedSimulationSettings from './AdvancedSimulationSettings';
import NumberOfGamesSettings from './NumberOfGamesSettings';
import CaptureConfigDropdown from '@/apps/simDash/components/CaptureConfigDropdown';
import ParkEffectsCheckbox from './ParkEffectsCheckbox';
import UmpireEffectsCheckbox from './UmpireEffectsCheckbox';
import BaseRunningModelSettings from './BaseRunningModelSettings';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { selectNumGames } from '@/apps/simDash/store/slices/simulationStatusSlice';
import { selectActiveConfig } from '@/apps/simDash/store/slices/statCaptureSettingsSlice';

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
    matchId: number;
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
    matchId,
    onRefresh,
    onRunSimulation,
    onChangeSimType
}) => {
    const dispatch = useDispatch<AppDispatch>();
    
    // ---------- State ----------

    const localDateTime = new Date(dateTime);
    const timeString = localDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const dateString = localDateTime.toLocaleDateString();

    const numGames = useSelector((state: RootState) => selectNumGames(state));
    const currentConfig = useSelector((state: RootState) => selectActiveConfig(state, leagueName));

    // ---------- Helper functions ----------

    const formatNumGames = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
        }
        return num.toString();
    };

    const createLabel = (): string => {
        const numGamesPart = formatNumGames(numGames);
        const configPart = currentConfig?.name || 'No Config';
        const fullLabel = `Advanced settings - ${numGamesPart} games • ${configPart}`;

       return fullLabel;
    };

    // ---------- Event handlers ----------

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
                        matchId={matchId}
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
                        matchId={matchId}
                        displayHistory={true}
                        simHistory={simResults || []}
                        isLoading={simStatus === 'loading'}
                    />
                </Box>
            </Box>
            
            {/* Advanced Settings */}
            <Box sx={{ maxWidth: '420px', mt: 2 }}>
                <AdvancedSimulationSettings caption={createLabel()}>
                    <NumberOfGamesSettings />
                    <CaptureConfigDropdown leagueName={leagueName} />
                    <BaseRunningModelSettings leagueName={leagueName} matchId={matchId} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <ParkEffectsCheckbox matchId={matchId} leagueName={leagueName} />
                        <UmpireEffectsCheckbox matchId={matchId} leagueName={leagueName} />
                    </Box>
                </AdvancedSimulationSettings>
            </Box>
        </Paper>
    );
};

export default MLBMatchupHeader; 