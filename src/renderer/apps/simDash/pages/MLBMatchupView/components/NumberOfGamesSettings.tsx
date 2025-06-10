import React, { useEffect, useState } from 'react';
import {
    FormControl,
    TextField,
    Tooltip
} from '@mui/material';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { selectNumGames, updateNumGames } from '@/simDash/store/slices/simulationStatusSlice';

// ---------- Constants ----------

const MIN_GAMES = 10000;
const MAX_GAMES = 1000000;

// ---------- Main component ----------

const NumberOfGamesSettings = () => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------
    
    const numGames = useSelector((state: RootState) => selectNumGames(state));
    const [localInputValue, setLocalInputValue] = useState<string>(numGames.toString());
    const [localInputError, setLocalInputError] = useState<string | null>(null);

    // ---------- Effects ----------

    useEffect(() => {
        setLocalInputValue(numGames.toString());
        setLocalInputError(null);
    }, [numGames]);

    // ---------- Event handlers ----------

    const handleCustomChange = () => {
        try {
            const value = parseInt(localInputValue) || 0;
        
            if (value < MIN_GAMES) {
                setLocalInputError('Minimum 10,000 games required');
            } else if (value >= MAX_GAMES) {
                setLocalInputError('Maximum 1,000,000 games allowed');
            } else {
                dispatch(updateNumGames(value));
                setLocalInputError(null);
            }
        } catch (error) {
            console.error('Invalid games value:', error);
            setLocalInputError('Please enter a valid number');
        }
    };

    const handleLocalInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalInputValue(event.target.value);
        // Clear error while typing so they get immediate feedback when it becomes valid
        if (localInputError) {
            const value = parseInt(event.target.value) || 0;
            if (value >= MIN_GAMES && value <= MAX_GAMES) {
                setLocalInputError(null);
            }
        }
    };

    // ---------- Render ----------

    const textField = (
        <TextField
            size="small"
            type="number"
            label="Number of Games"
            value={localInputValue}
            onChange={handleLocalInputChange}
            onBlur={handleCustomChange}
            error={!!localInputError} // Red border when error exists
            slotProps={{
                htmlInput: {
                    min: MIN_GAMES,
                    max: MAX_GAMES,
                    step: 1000
                }
            }}
            sx={{ 
                '& .MuiInputBase-input': {
                    fontSize: '0.875rem'
                }
            }}
        />
    );

    return (
        <FormControl size="small" fullWidth>
            {localInputError ? (
                <Tooltip title={localInputError} arrow placement="top">
                    {textField}
                </Tooltip>
            ) : (
                textField
            )}
        </FormControl>
    );
};

export default NumberOfGamesSettings; 