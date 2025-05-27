import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Button, TextField, Alert, CircularProgress, Divider, Card, CardContent } from '@mui/material';
import { Close, ContentCopy } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    selectUsername, 
    selectHasPartyRole, 
    selectRegistrationLoading, 
    selectAuthError,
    selectTelegramToken,
    selectTelegramTokenExpiration,
    selectTelegramTokenLoading,
    checkRoleMembership,
    registerUserParty,
    unregisterUserParty,
    generateTelegramToken
} from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';

const ProfilePage: React.FC = () => {
    const username = useSelector(selectUsername);
    const hasPartyRole = useSelector(selectHasPartyRole);
    const isRegistrationLoading = useSelector(selectRegistrationLoading);
    const error = useSelector(selectAuthError);
    const telegramToken = useSelector(selectTelegramToken);
    const telegramTokenExpiration = useSelector(selectTelegramTokenExpiration);
    const isTelegramTokenLoading = useSelector(selectTelegramTokenLoading);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    
    const [partyName, setPartyName] = useState('');
    const [showRegistration, setShowRegistration] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

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

    const handleGenerateTelegramToken = async () => {
        await dispatch(generateTelegramToken());
    };

    const handleCopyToken = async () => {
        if (telegramToken) {
            try {
                await navigator.clipboard.writeText(telegramToken);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy token:', err);
            }
        }
    };

    const formatExpirationDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (err) {
            return dateString;
        }
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
                        disabled={isRegistrationLoading}
                    >
                        {isRegistrationLoading ? 'Unregistering...' : 'Unregister'}
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
                            disabled={!partyName.trim() || isRegistrationLoading}
                        >
                            {isRegistrationLoading ? 'Registering...' : 'Register'}
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleCancelRegistration}
                            disabled={isRegistrationLoading}
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
                    disabled={isRegistrationLoading}
                >
                    Register
                </Button>
            </Box>
        );
    };

    const renderTelegramTokenSection = () => {
        return (
            <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Telegram Token
                </Typography>
                
                <Button 
                    variant="contained" 
                    onClick={handleGenerateTelegramToken}
                    disabled={isTelegramTokenLoading}
                    sx={{ mb: 2 }}
                >
                    {isTelegramTokenLoading ? 'Generating...' : 'Generate Telegram Token'}
                </Button>

                {telegramToken && (
                    <Card variant="outlined" sx={{ mt: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Current Token:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    value={telegramToken}
                                    InputProps={{
                                        readOnly: true,
                                        style: { fontFamily: 'monospace', fontSize: '0.875rem' }
                                    }}
                                    size="small"
                                />
                                <IconButton 
                                    onClick={handleCopyToken}
                                    color={copySuccess ? 'success' : 'default'}
                                    title="Copy token"
                                >
                                    <ContentCopy />
                                </IconButton>
                            </Box>
                            
                            {copySuccess && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Token copied to clipboard!
                                </Alert>
                            )}
                            
                            {telegramTokenExpiration && (
                                <Typography variant="body2" color="text.secondary">
                                    Expires: {formatExpirationDate(telegramTokenExpiration)}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                )}
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
                
                <Divider sx={{ my: 3 }} />
                
                {renderTelegramTokenSection()}
            </Paper>
        </Box>
    );
};

export default ProfilePage; 