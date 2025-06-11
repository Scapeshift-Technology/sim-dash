import React from 'react';
import {
    FormControlLabel,
    Checkbox,
    Typography,
    CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { 
    toggleParkEffects, 
    selectParkEffectsEnabled,
    selectGameParkEffectsStatus,
    selectGameParkEffectsError
} from '@/simDash/store/slices/simInputsSlice';
import { LeagueName } from '@@/types/league';

interface ParkEffectsCheckboxProps {
    matchId: number;
    leagueName: LeagueName;
}

const ParkEffectsCheckbox: React.FC<ParkEffectsCheckboxProps> = ({ matchId, leagueName }) => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------

    const enabled = useSelector((state: RootState) => selectParkEffectsEnabled(state, leagueName, matchId));
    const parkEffectsStatus = useSelector((state: RootState) => selectGameParkEffectsStatus(state, leagueName, matchId));
    const parkEffectsError = useSelector((state: RootState) => selectGameParkEffectsError(state, leagueName, matchId));

    const isLoading = parkEffectsStatus === 'loading';
    const hasError = parkEffectsStatus === 'failed' || !!parkEffectsError;

    // ---------- Handlers ----------

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(toggleParkEffects({ league: leagueName, matchId }));
    };

    // ---------- Render ----------

    const getLabelText = () => {
        if (isLoading) return 'Park Effects (Loading...)';
        if (hasError) return 'Park Effects (Error)';
        return 'Park Effects';
    };

    const getLabelColor = () => {
        if (hasError) return 'error.main';
        if (isLoading) return 'text.secondary';
        return 'text.primary';
    };

    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={enabled}
                    onChange={handleChange}
                    size="small"
                    disabled={isLoading || hasError}
                />
            }
            label={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontSize: '0.875rem',
                            color: getLabelColor()
                        }}
                    >
                        {getLabelText()}
                    </Typography>
                    {isLoading && (
                        <CircularProgress size={12} />
                    )}
                </div>
            }
        />
    );
};

export default ParkEffectsCheckbox; 