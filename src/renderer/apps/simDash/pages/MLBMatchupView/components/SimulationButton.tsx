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

interface SimulationButtonProps {
    isSimulating: boolean;
    disabled: boolean;
    seriesGames?: { [key: string]: any };
    onRunSimulation: (isSeries: boolean) => void;
}

const SimulationButton: React.FC<SimulationButtonProps> = ({
    isSimulating,
    disabled,
    seriesGames,
    onRunSimulation
}) => {
    // ---------- State ----------

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [seriesSimMode, setSeriesSimMode] = useState<boolean>(false);

    // ---------- Handlers ----------

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (option: string) => {
        setSeriesSimMode(option === 'series');
        handleClose();
    };

    // ---------- Render ----------

    if (!seriesGames) {
        return (
            <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={isSimulating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={() => onRunSimulation(seriesSimMode)}
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
                    onClick={() => onRunSimulation(seriesSimMode)}
                    startIcon={isSimulating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                    sx={{ width: '100%' }}
                >
                    {isSimulating ? 'Running...' : seriesSimMode ? 'Simulate Series' : 'Simulate Game'}
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
                <MenuItem onClick={() => handleMenuItemClick('series')}>Simulate Series</MenuItem>
            </Menu>
        </>
    );
};

export default SimulationButton; 