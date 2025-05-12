import React from 'react';
import {
    Select,
    MenuItem,
    FormControl,
    SelectChangeEvent
} from '@mui/material';
import { Position } from '@/types/mlb';

interface PositionSelectorProps {
    value: string;
    onChange: (position: Position) => void;
    disabled?: boolean;
}

const BATTER_POSITIONS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'TBD'];
const PITCHER_POSITIONS: Position[] = ['SP', 'RP'];

const PositionSelector: React.FC<PositionSelectorProps> = ({
    value,
    onChange,
    disabled = false
}) => {
    const handleChange = (event: SelectChangeEvent) => {
        onChange(event.target.value as Position);
    };

    // Determine which positions to show based on current value
    const availablePositions = PITCHER_POSITIONS.includes(value as Position) 
        ? PITCHER_POSITIONS 
        : BATTER_POSITIONS;

    return (
        <FormControl 
            size="small" 
            sx={{ 
                minWidth: 60,
                '& .MuiSelect-select': {
                    py: 0.5,
                    px: 1
                }
            }}
        >
            <Select
                value={value}
                onChange={handleChange}
                disabled={disabled}
                size="small"
                sx={{
                    fontSize: '0.875rem',
                    '& .MuiSelect-select': {
                        py: 0.5
                    }
                }}
            >
                {availablePositions.map((position) => (
                    <MenuItem 
                        key={position} 
                        value={position}
                        sx={{ fontSize: '0.875rem' }}
                    >
                        {position}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default PositionSelector; 