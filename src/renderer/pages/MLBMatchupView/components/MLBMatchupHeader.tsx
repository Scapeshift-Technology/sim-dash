import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import MLBSimulationResultsSummary from '@/components/simulation/MLBSimulationResultsSummary';
import type { SimHistoryEntry } from '@/types/simHistory';

interface MLBMatchupHeaderProps {
    participant1: string;
    participant2: string;
    date: string;
    isSimulating: boolean;
    simError: string | null;
    simResults: SimHistoryEntry[] | undefined;
    simStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    lineupData: any; // TODO: Add proper type
    hasInvalidLeans: boolean;
    onRefresh: () => void;
    onRunSimulation: () => void;
}

const MLBMatchupHeader: React.FC<MLBMatchupHeaderProps> = ({
    participant1,
    participant2,
    date,
    isSimulating,
    simError,
    simResults,
    simStatus,
    lineupData,
    hasInvalidLeans,
    onRefresh,
    onRunSimulation
}) => {
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
                        {date}
                    </Typography>
                </Box>
                <IconButton 
                    onClick={onRefresh}
                    size="small"
                    sx={{ ml: 2 }}
                    disabled={!lineupData}
                >
                    <RefreshIcon />
                </IconButton>
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
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={isSimulating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                        onClick={onRunSimulation}
                        disabled={isSimulating || !lineupData || hasInvalidLeans}
                        sx={{ 
                            height: '100%', 
                            width: '100%',
                            py: '8px',
                            px: '16px'
                        }}
                    >
                        {isSimulating ? 'Running...' : 'Run Simulation'}
                    </Button>
                </Box>
                <Box sx={{ 
                    flex: '0 0 200px',
                    maxWidth: '200px'
                }}>
                    <MLBSimulationResultsSummary
                        awayTeamName={participant1}
                        homeTeamName={participant2}
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