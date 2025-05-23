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
    isSimulating: boolean;
    disabled: boolean;
    seriesGames?: { [key: string]: any };
    liveGameData: MlbLiveDataApiResponse | undefined;
    onRunSimulation: (simType: SimType) => void;
}

const SimulationButton: React.FC<SimulationButtonProps> = ({
    isSimulating,
    disabled,
    seriesGames,
    liveGameData,
    onRunSimulation
}) => {
    // ---------- State ----------

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [simulationType, setSimulationType] = useState<SimType>('game');

    // ---------- Handlers ----------

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (option: SimType) => {
        setSimulationType(option);
        handleClose();
    };

    // ---------- Render ----------

    const showDropdown = seriesGames || liveGameData;

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
        switch (simulationType) {
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
                    onClick={() => onRunSimulation(simulationType)}
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
                {liveGameData && <MenuItem onClick={() => handleMenuItemClick('live')}>Sim From Live Startpoint</MenuItem>}
            </Menu>
        </>
    );
};

export default SimulationButton; 