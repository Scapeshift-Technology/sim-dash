import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Button,
    AppBar,
    Toolbar,
    CssBaseline,
    Menu,
    MenuItem,
} from '@mui/material';
import type { AppDispatch } from '@/store/store';
import { logoutUser, selectUsername } from '@/store/slices/authSlice';
import { setCurrentApp, selectCurrentApp } from '@/store/slices/appSlice';

interface MainLayoutProps {
    children: React.ReactNode;
    Sidebar: React.ComponentType<{
        currentWidth: number;
        onResize: (newWidth: number) => void;
    }> | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, Sidebar }) => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------
    
    const username = useSelector(selectUsername);
    const currentApp = useSelector(selectCurrentApp);
    const [drawerWidth, setDrawerWidth] = useState(240);
    const minDrawerWidth = 150;
    const maxDrawerWidth = 500;
    // --- Menu state ---
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    // ---------- Handlers ----------

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleAppSelect = (app: 'simDash' | 'accounting') => {
        console.log(`Selected app: ${app}`);
        dispatch(setCurrentApp(app));
        handleClose();
    };

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const handleResize = useCallback((newWidth: number) => {
        setDrawerWidth(Math.max(minDrawerWidth, Math.min(newWidth, maxDrawerWidth)));
    }, [minDrawerWidth, maxDrawerWidth]);

    // ---------- Helpers ----------

    const formatAppName = (name: string | null): string => {
        if (!name) return 'SimDash';
        return name === 'simDash' ? 'SimDash' : name.charAt(0).toUpperCase() + name.slice(1);
    };

    // ---------- Render ----------

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <Toolbar>
                    <Typography 
                        variant="h6" 
                        component="div" 
                        onClick={handleClick}
                        sx={{ 
                            flexGrow: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8
                            }
                        }}
                    >
                        {formatAppName(currentApp)}
                    </Typography>
                    <Menu
                        id="app-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        slotProps={{
                            list: {
                                'aria-labelledby': 'app-selector',
                            }
                        }}
                    >
                        <MenuItem onClick={() => handleAppSelect('simDash')}>SimDash</MenuItem>
                        <MenuItem onClick={() => handleAppSelect('accounting')}>Accounting</MenuItem>
                    </Menu>
                    <Typography id="welcome-message" sx={{ mr: 2 }}>Welcome, {username || 'User'}!</Typography>
                    <Button id="logout-button" color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            {Sidebar && <Sidebar currentWidth={drawerWidth} onResize={handleResize} />}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Toolbar />
                {children}
            </Box>
            
            <Box 
                component="footer" 
                sx={{ 
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2, 
                    textAlign: 'center', 
                    borderTop: 1, 
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    height: '64px',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    SimDash Footer
                </Typography>
            </Box>
        </Box>
    );
};

export default MainLayout; 