import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Button,
    AppBar,
    Toolbar,
    Container
} from '@mui/material';
import type { AppDispatch } from '../store/store';
import { logoutUser, selectUsername } from '../store/slices/authSlice';

const MainLayout: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const username = useSelector(selectUsername);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        SimDash
                    </Typography>
                    <Typography sx={{ mr: 2 }}>Welcome, {username || 'User'}!</Typography>
                    <Button color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                {/* Main application content (sidebar, tabs, etc.) will go here */}
                <Typography variant="h5">Main Application Area</Typography>
                <Typography>League sidebar and content tabs will be added here.</Typography>
            </Container>
            <Box component="footer" sx={{ p: 2, mt: 'auto', backgroundColor: '#f5f5f5' }}>
                <Container maxWidth="sm">
                    <Typography variant="body2" color="text.secondary" align="center">
                        SimDash Footer
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default MainLayout; 