import React, { useState } from 'react';
import {
    Button,
    ButtonGroup,
    Menu,
    MenuItem,
    CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { MlbLiveDataApiResponse } from '@@/types/mlb';
import { SimType } from '@@/types/mlb/mlb-sim';

interface SimulationButtonProps {
    simType: SimType | undefined;
    isSimulating: boolean;
    disabled: boolean;
    seriesGames?: { [key: string]: any };
    liveGameData: MlbLiveDataApiResponse | undefined;
    onRunSimulation: (simType: SimType) => void;
    onChangeSimType: (simType: SimType) => void;
}

const SimulationButton: React.FC<SimulationButtonProps> = ({
    simType,
    isSimulating,
    disabled,
    seriesGames,
    liveGameData,
    onRunSimulation,
    onChangeSimType
}) => {
    simType = simType ?? 'game'; // Default mode if simType is not provided

    // ---------- State ----------

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

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
    const showDropdown = seriesGames || isGameLive;

    if (!showDropdown) {
        return (
            <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={isSimulating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={() => onRunSimulation('game')}
                disabled={disabled}
                sx={{ 
                    height: '100%', 
                    width: '100%',
                    py: '8px',
                    px: '16px'
                }}
            >
                {isSimulating ? 'Running...' : 'Run Simulation'}
            </Button>
        );
    }

    const getButtonText = () => {
        if (isSimulating) return 'Running...';
        switch (simType) {
            case 'series':
                return 'Simulate Series';
            case 'live':
                return 'Simulate Live Game';
            case 'game':
            default:
                return 'Simulate Game';
        }
    };

    return (
        <>
            <ButtonGroup
                variant="contained"
                color="primary"
                size="large"
                disabled={disabled}
                sx={{ 
                    height: '100%', 
                    width: '100%',
                }}
            >
                <Button
                    onClick={() => onRunSimulation(simType)}
                    startIcon={isSimulating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                    sx={{ width: '100%' }}
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
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={() => handleMenuItemClick('game')}>Simulate Game</MenuItem>
                {seriesGames && <MenuItem onClick={() => handleMenuItemClick('series')}>Simulate Series</MenuItem>}
                {isGameLive && <MenuItem onClick={() => handleMenuItemClick('live')}>Simulate Live Game</MenuItem>}
            </Menu>
        </>
    );
};

export default SimulationButton; 