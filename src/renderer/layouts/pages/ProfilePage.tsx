import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Button, TextField, Alert, CircularProgress } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    selectUsername, 
    selectHasPartyRole, 
    selectAuthLoading, 
    selectAuthError,
    checkRoleMembership,
    registerUserParty,
    unregisterUserParty
} from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';

const ProfilePage: React.FC = () => {
    const username = useSelector(selectUsername);
    const hasPartyRole = useSelector(selectHasPartyRole);
    const isLoading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    
    const [partyName, setPartyName] = useState('');
    const [showRegistration, setShowRegistration] = useState(false);

    useEffect(() => {
        // Check role membership when component mounts
        dispatch(checkRoleMembership());
    }, [dispatch]);

    const handleClose = () => {
        navigate('/');
    };

    const handleRegisterClick = () => {
        setShowRegistration(true);
        setPartyName('');
    };

    const handleRegisterSubmit = async () => {
        if (partyName.trim() && partyName.length <= 16) {
            await dispatch(registerUserParty(partyName.trim()));
            // Refresh role status after registration
            dispatch(checkRoleMembership());
            setShowRegistration(false);
            setPartyName('');
        }
    };

    const handleUnregister = async () => {
        await dispatch(unregisterUserParty());
        // Refresh role status after unregistration
        dispatch(checkRoleMembership());
    };

    const handleCancelRegistration = () => {
        setShowRegistration(false);
        setPartyName('');
    };

    const renderRegistrationSection = () => {
        if (hasPartyRole === null) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                        Checking registration status...
                    </Typography>
                </Box>
            );
        }

        if (hasPartyRole) {
            return (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        You are currently registered for party functionality.
                    </Typography>
                    <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleUnregister}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Unregistering...' : 'Unregister'}
                    </Button>
                </Box>
            );
        }

        if (showRegistration) {
            return (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Enter a party name (up to 16 characters):
                    </Typography>
                    <TextField
                        fullWidth
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                        placeholder="Party name"
                        inputProps={{ maxLength: 16 }}
                        sx={{ mb: 2 }}
                        helperText={`${partyName.length}/16 characters`}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                            variant="contained" 
                            onClick={handleRegisterSubmit}
                            disabled={!partyName.trim() || isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleCancelRegistration}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            );
        }

        return (
            <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    You are not currently registered for party functionality.
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={handleRegisterClick}
                    disabled={isLoading}
                >
                    Register
                </Button>
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
                {/* Close Button */}
                <IconButton
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'text.primary',
                            backgroundColor: 'action.hover'
                        }
                    }}
                    aria-label="close profile page"
                >
                    <Close />
                </IconButton>

                <Typography variant="h4" component="h1" gutterBottom>
                    User Profile
                </Typography>
                
                <Typography variant="h6" sx={{ mb: 3 }}>
                    Welcome, {username || 'User'}!
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {renderRegistrationSection()}
            </Paper>
        </Box>
    );
};

export default ProfilePage; 