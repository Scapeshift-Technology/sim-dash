import React from 'react';
import {
    FormControlLabel,
    Checkbox,
    Typography,
    CircularProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface EffectsCheckboxProps {
    effectType: string; // e.g., "Park Effects", "Umpire Effects"
    enabled: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null | undefined;
    onToggle: () => void;
    onRetry?: () => void; // Optional retry function for when there's an error
}

const EffectsCheckbox: React.FC<EffectsCheckboxProps> = ({ 
    effectType, 
    enabled, 
    status, 
    error, 
    onToggle,
    onRetry
}) => {
    // ---------- State ----------

    const isLoading = status === 'loading';
    const hasError = status === 'failed' || !!error;
    const hasLoaded = status === 'succeeded';
    const isIdle = status === 'idle';

    // ---------- Handlers ----------

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onToggle();
    };

    // ---------- Render ----------

    const getLabelText = () => {
        if (isLoading) return `${effectType} (Loading...)`;
        if (hasError) return `${effectType} (Failed to load)`;
        return effectType;
    };

    const getLabelColor = () => {
        if (hasError) return 'error.main';
        if (isLoading || isIdle) return 'text.secondary';
        return 'text.primary';
    };

    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={enabled}
                    onChange={handleChange}
                    size="small"
                    disabled={!hasLoaded}
                    sx={{ 
                        p: 0.25,
                        '& .MuiSvgIcon-root': { fontSize: 16 }
                    }}
                />
            }
            label={
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontSize: '0.75rem',
                            color: getLabelColor()
                        }}
                    >
                        {getLabelText()}
                    </Typography>
                    {isLoading && (
                        <CircularProgress size={10} />
                    )}
                    {hasError && onRetry && (
                        <Tooltip title="Retry loading">
                            <IconButton 
                                onClick={onRetry}
                                size="small"
                                sx={{ 
                                    p: 0.25, 
                                    ml: 0.25,
                                    '& .MuiSvgIcon-root': { fontSize: 12 }
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
            }
            sx={{
                m: 0,
                '& .MuiFormControlLabel-label': {
                    fontSize: '0.75rem'
                }
            }}
        />
    );
};

export default EffectsCheckbox; 