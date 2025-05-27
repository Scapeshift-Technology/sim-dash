import React from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUsername } from '@/store/slices/authSlice';

const ProfilePage: React.FC = () => {
    const username = useSelector(selectUsername);
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
                    aria-label="close profile page"
                >
                    <Close />
                </IconButton>

                <Typography variant="h4" component="h1" gutterBottom>
                    User Profile
                </Typography>
                
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Welcome, {username || 'User'}!
                </Typography>
                
                <Typography variant="body1" color="text.secondary">
                    Profile page coming soon
                </Typography>
            </Paper>
        </Box>
    );
};

export default ProfilePage; 