import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Alert
} from '@mui/material';
import type { AppDispatch } from '@/store/store';
import {
    selectUserDefaultParty,
    selectCurrentParty,
    selectAvailableParties,
    setCurrentParty
} from '@/store/slices/authSlice';

const PartySelector: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const userDefaultParty = useSelector(selectUserDefaultParty);
    const currentParty = useSelector(selectCurrentParty);
    const availableParties = useSelector(selectAvailableParties);
    
    const [displayedParty, setDisplayedParty] = useState(currentParty || '');

    // Update displayed party when current party changes
    useEffect(() => {
        setDisplayedParty(currentParty || '');
    }, [currentParty]);

    const handlePartyChange = (event: any) => {
        setDisplayedParty(event.target.value as string);
    };

    const handlePartySave = () => {
        dispatch(setCurrentParty(displayedParty));
    };

    // Don't render if no parties available
    if (availableParties.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                mb: 1
            }}>
                <Typography>Change party:</Typography>
                <Box sx={{ 
                    display: 'flex',
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    flex: 1,
                    maxWidth: { xs: '100%', sm: '500px' }
                }}>
                    <FormControl 
                        size='small' 
                        sx={{ 
                            minWidth: { xs: '100%', sm: 200 },
                        }}
                    >
                        <InputLabel id="chosen-party-select-label">Selected Party</InputLabel>
                        <Select
                            labelId="chosen-party-select-label"
                            id="chosen-party-select"
                            value={displayedParty}
                            label="Selected Party"
                            onChange={handlePartyChange}
                        >
                            {availableParties.map((party: string) => (
                                <MenuItem key={party} value={party}>{party}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {displayedParty !== currentParty && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handlePartySave}
                            aria-label="Confirm party change"
                            sx={{
                                alignSelf: { xs: 'stretch', sm: 'center' },
                                height: { xs: '36px', sm: '32px' }
                            }}
                        >
                            Confirm
                        </Button>
                    )}
                </Box>
            </Box>
            <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ ml: 0.5 }}
            >
                All actions will be performed as this party across the app.
                {currentParty && ` Your currently selected party is ${currentParty}.`}
            </Typography>
        </Box>
    );
};

export default PartySelector; 