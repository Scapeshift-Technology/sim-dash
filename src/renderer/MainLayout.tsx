import React, { useState, useCallback } from 'react';
import {
    Box,
    CssBaseline,
    Toolbar,
} from '@mui/material';
import NavBar from './components/NavBar';

interface MainLayoutProps {
    children: React.ReactNode;
    Sidebar: React.ComponentType<{
        currentWidth: number;
        onResize: (newWidth: number) => void;
    }> | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, Sidebar }) => {
    // ---------- State ----------
    
    const [drawerWidth, setDrawerWidth] = useState(240);
    const minDrawerWidth = 150;
    const maxDrawerWidth = 500;

    // ---------- Handlers ----------

    const handleResize = useCallback((newWidth: number) => {
        setDrawerWidth(Math.max(minDrawerWidth, Math.min(newWidth, maxDrawerWidth)));
    }, [minDrawerWidth, maxDrawerWidth]);

    // ---------- Render ----------

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            
            {/* Navigation Bar */}
            <NavBar />
            
            {/* Sidebar */}
            {Sidebar && <Sidebar currentWidth={drawerWidth} onResize={handleResize} />}
            
            {/* Main Content */}
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
        </Box>
    );
};

export default MainLayout; 