import React, { useEffect, useRef, useCallback } from 'react';
import { Drawer, Box, Toolbar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface GenericSidebarProps {
    currentWidth: number;
    onResize: (newWidth: number) => void;
    children: React.ReactNode;
}

const GenericSidebar: React.FC<GenericSidebarProps> = ({ currentWidth, onResize, children }) => {
    // ---------- State ----------

    const sidebarRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

    // ---------- Handlers ----------

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = e.clientX;
        onResize(newWidth);
    }, [onResize]);

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }, [handleMouseMove]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [handleMouseMove, handleMouseUp]);

    const handleSidebarClick = useCallback((e: React.MouseEvent) => {
        // Only navigate if we're currently on profile or settings page
        if (location.pathname === '/profile' || location.pathname === '/settings') {
            navigate('/');
        }
    }, [navigate, location.pathname]);

    // ---------- useEffect ----------

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // ---------- Render content ----------

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: currentWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: currentWidth, boxSizing: 'border-box' },
            }}
            ref={sidebarRef}
        >
            <Toolbar />
            <Box 
                sx={{ overflow: 'auto', flexGrow: 1, position: 'relative' }}
                onClick={handleSidebarClick}
            >
                {children}
            </Box>
            <Box
                onMouseDown={handleMouseDown}
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '10px',
                    height: '100%',
                    cursor: 'col-resize',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    },
                    zIndex: 1200,
                }}
            />
        </Drawer>
    );
};

export default GenericSidebar; 