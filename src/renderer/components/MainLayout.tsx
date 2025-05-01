import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Button,
    AppBar,
    Toolbar,
    Container,
    CssBaseline
} from '@mui/material';
import type { AppDispatch } from '../store/store';
import { logoutUser, selectUsername } from '../store/slices/authSlice';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const MainLayout: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const username = useSelector(selectUsername);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        SimDash
                    </Typography>
                    <Typography id="welcome-message" sx={{ mr: 2 }}>Welcome, {username || 'User'}!</Typography>
                    <Button id="logout-button" color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Sidebar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Toolbar />
                <Container sx={{ flexGrow: 1 }}>
                    <Typography variant="h5">Main Application Area</Typography>
                    <Typography>League sidebar added. Content tabs will be added here.</Typography>
                </Container>
                <Box component="footer" sx={{ p: 2, mt: 'auto', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        SimDash Footer
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout; 