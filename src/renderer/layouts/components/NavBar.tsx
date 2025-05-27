import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Menu,
    MenuItem,
    IconButton,
    Box,
    Button,
} from '@mui/material';
import { AccountCircle, ArrowDropDown } from '@mui/icons-material';
import type { AppDispatch } from '@/store/store';
import { selectUsername, selectCurrentParty } from '@/store/slices/authSlice';
import { setCurrentApp, selectCurrentApp } from '@/store/slices/appSlice';
import UserProfileMenu from './UserProfileMenu';

const NavBar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    
    // ---------- State ----------
    const username = useSelector(selectUsername);
    const currentApp = useSelector(selectCurrentApp);
    const currentParty = useSelector(selectCurrentParty);
    
    // App selector menu state
    const [appMenuAnchorEl, setAppMenuAnchorEl] = useState<null | HTMLElement>(null);
    const appMenuOpen = Boolean(appMenuAnchorEl);
    
    // User profile menu state
    const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
    const profileMenuOpen = Boolean(profileMenuAnchorEl);

    // ---------- Handlers ----------
    
    const handleAppMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAppMenuAnchorEl(event.currentTarget);
    };

    const handleAppMenuClose = () => {
        setAppMenuAnchorEl(null);
    };

    const handleAppSelect = (app: 'simDash' | 'accounting') => {
        console.log(`Selected app: ${app}`);
        dispatch(setCurrentApp(app));
        handleAppMenuClose();
    };

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setProfileMenuAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileMenuAnchorEl(null);
    };

    // ---------- Helpers ----------

    const formatAppName = (name: string | null): string => {
        if (!name) return '[AppName]';
        if (name === 'simDash') return 'SimDash';
        if (name === 'accounting') return 'AccountingDash';
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // ---------- Render ----------

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1
            }}
        >
            <Toolbar>
                {/* App Selector */}
                <Button
                    onClick={handleAppMenuClick}
                    endIcon={<ArrowDropDown />}
                    sx={{ 
                        justifyContent: 'flex-start',
                        color: 'inherit',
                        textTransform: 'none',
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        padding: '6px 8px',
                        minHeight: '40px',
                        width: 'auto',
                        minWidth: 'auto',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                        '& .MuiButton-endIcon': {
                            marginLeft: '4px',
                            marginRight: 0,
                        }
                    }}
                    aria-label="Select application"
                    aria-haspopup="true"
                    aria-expanded={appMenuOpen}
                >
                    {formatAppName(currentApp)}
                </Button>
                
                {/* Spacer to push user profile to the right */}
                <Box sx={{ flexGrow: 1 }} />

                {/* App Selector Menu */}
                <Menu
                    id="app-menu"
                    anchorEl={appMenuAnchorEl}
                    open={appMenuOpen}
                    onClose={handleAppMenuClose}
                    slotProps={{
                        list: {
                            'aria-labelledby': 'app-selector',
                        }
                    }}
                >
                    <MenuItem onClick={() => handleAppSelect('simDash')}>SimDash</MenuItem>
                    <MenuItem onClick={() => handleAppSelect('accounting')}>AccountingDash</MenuItem>
                </Menu>

                {/* User Profile Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                    <Box sx={{ mr: 1, textAlign: 'right' }}>
                        <Typography sx={{ lineHeight: 1.2 }}>
                            {username || 'User'}
                        </Typography>
                        {currentParty && (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    lineHeight: 1,
                                    display: 'block'
                                }}
                            >
                                Acting as: {currentParty}
                            </Typography>
                        )}
                    </Box>
                    <IconButton
                        id="user-profile-button"
                        size="large"
                        aria-label="account of current user"
                        aria-controls="user-profile-menu"
                        aria-haspopup="true"
                        onClick={handleProfileMenuClick}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                </Box>

                {/* User Profile Menu */}
                <UserProfileMenu 
                    anchorEl={profileMenuAnchorEl}
                    open={profileMenuOpen}
                    onClose={handleProfileMenuClose}
                />
            </Toolbar>
        </AppBar>
    );
};

export default NavBar; 