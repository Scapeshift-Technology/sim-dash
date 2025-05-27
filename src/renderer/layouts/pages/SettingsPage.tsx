import React from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();

    const handleClose = () => {
        navigate('/');
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
                    aria-label="close settings page"
                >
                    <Close />
                </IconButton>

                <Typography variant="h4" component="h1" gutterBottom>
                    Settings
                </Typography>
                
                <Typography variant="body1" color="text.secondary">
                    Settings page coming soon
                </Typography>
            </Paper>
        </Box>
    );
};

export default SettingsPage; 