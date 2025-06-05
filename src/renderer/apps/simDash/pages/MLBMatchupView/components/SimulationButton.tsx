import React, { useState, useEffect } from 'react';
import {
    Button,
    ButtonGroup,
    Menu,
    MenuItem,
    CircularProgress,
    Box,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { MlbLiveDataApiResponse } from '@@/types/mlb';
import { SimType } from '@@/types/mlb/mlb-sim';
import { LeagueName } from '@@/types/league';

import { RootState, AppDispatch } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { 
    initializeLeague,
    getActiveStatCaptureConfiguration,
    getLeagueStatCaptureConfigurations,
    setActiveStatCaptureConfiguration,
    selectActiveConfig,
    selectActiveConfigLoading,
    selectLeagueStatCaptureConfigurations,
    selectLeagueStatCaptureConfigurationsLoading
} from '@/simDash/store/slices/statCaptureSettingsSlice';

interface SimulationButtonProps {
    simType: SimType | undefined;
    isSimulating: boolean;
    disabled: boolean;
    seriesGames?: { [key: string]: any };
    liveGameData: MlbLiveDataApiResponse | undefined;
    leagueName: LeagueName;
    onRunSimulation: (simType: SimType) => void;
    onChangeSimType: (simType: SimType) => void;
}

const SimulationButton: React.FC<SimulationButtonProps> = ({
    simType,
    isSimulating,
    disabled,
    seriesGames,
    liveGameData,
    leagueName,
    onRunSimulation,
    onChangeSimType
}) => {
    const dispatch = useDispatch<AppDispatch>();
    simType = simType ?? 'game'; // Default mode if simType is not provided

    // ---------- Redux State ----------
    
    const activeConfig = useSelector((state: RootState) => selectActiveConfig(state, leagueName));
    const activeConfigLoading = useSelector((state: RootState) => selectActiveConfigLoading(state, leagueName));
    const leagueConfigurations = useSelector((state: RootState) => selectLeagueStatCaptureConfigurations(state, leagueName));
    const leagueConfigurationsLoading = useSelector((state: RootState) => selectLeagueStatCaptureConfigurationsLoading(state, leagueName));

    // ---------- State ----------

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    // ---------- Effects ----------

    useEffect(() => {
        dispatch(initializeLeague(leagueName));
        if (!activeConfig && !activeConfigLoading) {
            dispatch(getActiveStatCaptureConfiguration(leagueName));
        }
        if (leagueConfigurations.length === 0 && !leagueConfigurationsLoading) {
            dispatch(getLeagueStatCaptureConfigurations(leagueName));
        }
    }, [dispatch, leagueName, activeConfig, leagueConfigurations]);

    // ---------- Handlers ----------

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (option: SimType) => {
        onChangeSimType(option);
        handleClose();
    };

    const handleActiveConfigChange = async (configName: string) => {
        if (!configName) return;
        
        try {
            await dispatch(setActiveStatCaptureConfiguration({ 
                configName, 
                leagueName: leagueName 
            })).unwrap();

            await dispatch(getActiveStatCaptureConfiguration(leagueName));
        } catch (error) {
            console.error('Error setting active config:', error);
        }
    };

    // ---------- Render ----------

    const isGameLive = liveGameData && liveGameData.gameData.status.abstractGameState === 'Live';

    const getButtonText = () => {
        if (isSimulating) return 'Running...';
        switch (simType) {
            case 'series':
                return 'Simulate Series';
            case 'live':
                return 'Simulate Live Game';
            case 'custom':
                return 'Simulate Custom Game';
            case 'game':
            default:
                return 'Simulate Game';
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Configuration Selector */}
            <FormControl size="small" fullWidth>
                <InputLabel>Configuration</InputLabel>
                <Select
                    value={activeConfig?.name || ''}
                    label="Configuration"
                    disabled={leagueConfigurationsLoading}
                    onChange={(e) => handleActiveConfigChange(e.target.value)}
                    sx={{ fontSize: '0.875rem' }}
                >
                    {leagueConfigurations.map((config) => (
                        <MenuItem key={config.name} value={config.name}>
                            {config.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Simulation Button */}
            <ButtonGroup
                variant="contained"
                color="primary"
                size="large"
                disabled={disabled}
                sx={{ 
                    flexGrow: 1,
                    '& .MuiButton-root': {
                        height: '100%'
                    }
                }}
            >
                <Button
                    onClick={() => onRunSimulation(simType)}
                    startIcon={isSimulating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                    sx={{ flexGrow: 1 }}
                >
                    {getButtonText()}
                </Button>
                <Button
                    size="small"
                    onClick={handleClick}
                    sx={{ width: '32px', minWidth: '32px' }}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>

            {/* Simulation Type Menu */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={() => handleMenuItemClick('game')}>Simulate Game</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('custom')}>Simulate Custom Game</MenuItem>
                {seriesGames && <MenuItem onClick={() => handleMenuItemClick('series')}>Simulate Series</MenuItem>}
                {isGameLive && <MenuItem onClick={() => handleMenuItemClick('live')}>Simulate Live Game</MenuItem>}
            </Menu>
        </Box>
    );
};

export default SimulationButton; 