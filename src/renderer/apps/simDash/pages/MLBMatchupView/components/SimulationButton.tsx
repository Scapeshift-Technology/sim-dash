import React, { useState, useEffect } from 'react';
import {
    Button,
    ButtonGroup,
    Menu,
    MenuItem,
    CircularProgress,
    Box,
    Tooltip
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
    selectActiveConfig,
    selectActiveConfigLoading,
    selectLeagueStatCaptureConfigurations,
    selectLeagueStatCaptureConfigurationsLoading
} from '@/simDash/store/slices/statCaptureSettingsSlice';
import {
    selectParkEffectsEnabled,
    selectGameParkEffectsStatus,
    selectGameParkEffectsError
} from '@/simDash/store/slices/simInputsSlice';

interface SimulationButtonProps {
    simType: SimType | undefined;
    isSimulating: boolean;
    disabled: boolean;
    seriesGames?: { [key: string]: any };
    liveGameData: MlbLiveDataApiResponse | undefined;
    leagueName: LeagueName;
    matchId: number;
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
    matchId,
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
    const parkEffectsEnabled = useSelector((state: RootState) => selectParkEffectsEnabled(state, leagueName, matchId));
    const parkEffectsStatus = useSelector((state: RootState) => selectGameParkEffectsStatus(state, leagueName, matchId));
    const parkEffectsError = useSelector((state: RootState) => selectGameParkEffectsError(state, leagueName, matchId));

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

    // ---------- Render ----------

    const isGameLive = liveGameData && liveGameData.gameData.status.abstractGameState === 'Live';
    const isParkEffectsLoading = parkEffectsEnabled && parkEffectsStatus === 'loading';
    const isParkEffectsError = parkEffectsEnabled && (parkEffectsStatus === 'failed' || !!parkEffectsError);
    const isButtonDisabled = disabled || isParkEffectsLoading || isParkEffectsError;

    const getButtonText = () => {
        if (isSimulating) return 'Running...';
        if (isParkEffectsLoading) return 'Loading Park Effects...';
        if (isParkEffectsError) return 'Park Effects Error';
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

    const getTooltipText = () => {
        if (isParkEffectsLoading) {
            return 'Waiting for park effects to load...';
        }
        if (isParkEffectsError) {
            return 'Park effects failed to load. Please refresh to try again.';
        }
        return '';
    };

    const buttonGroup = (
        <ButtonGroup
            variant="contained"
            color="primary"
            size="large"
            disabled={isButtonDisabled}
            sx={{ 
                flexGrow: 1,
                '& .MuiButton-root': {
                    height: '100%'
                }
            }}
        >
            <Button
                onClick={() => onRunSimulation(simType)}
                startIcon={(isSimulating || isParkEffectsLoading) ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                sx={{ flexGrow: 1 }}
            >
                {getButtonText()}
            </Button>
            <Button
                size="small"
                onClick={handleClick}
                sx={{ 
                    width: '32px', 
                    minWidth: '32px',
                    height: '100% !important',
                    minHeight: '100% !important'
                }}
            >
                <ArrowDropDownIcon />
            </Button>
        </ButtonGroup>
    );

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {(isParkEffectsLoading || isParkEffectsError) ? (
                <Tooltip title={getTooltipText()} arrow placement="top">
                    <div style={{ flexGrow: 1, height: '100%', display: 'flex' }}>
                        {buttonGroup}
                    </div>
                </Tooltip>
            ) : (
                buttonGroup
            )}

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