import React from 'react';
import {
    FormControl,
    TextField
} from '@mui/material';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { selectNumGames, updateNumGames } from '@/simDash/store/slices/simulationStatusSlice';

import { LeagueName } from '@@/types/league';

// ---------- Main component ----------

interface NumberOfGamesSettingsProps {
    leagueName: LeagueName;
}

const NumberOfGamesSettings: React.FC<NumberOfGamesSettingsProps> = ({ leagueName }) => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------
    
    const numGames = useSelector((state: RootState) => selectNumGames(state));

    // ---------- Event handlers ----------

    const handleCustomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value) || 0;
        
        if (value >= 1000) {
            dispatch(updateNumGames(value));
        } else {
            console.log('Invalid games value (must be >= 1000):', value);
            dispatch(updateNumGames(1000));
        }
    };

    // ---------- Render ----------

    return (
        <FormControl size="small" fullWidth>
            <TextField
                size="small"
                type="number"
                label="Number of Games"
                value={numGames}
                onChange={handleCustomChange}
                slotProps={{
                    htmlInput: {
                        min: 1000,
                        max: 1000000,
                        step: 1000
                    }
                }}
                sx={{ 
                    '& .MuiInputBase-input': {
                        fontSize: '0.875rem'
                    }
                }}
            />
        </FormControl>
    );
};

export default NumberOfGamesSettings; 