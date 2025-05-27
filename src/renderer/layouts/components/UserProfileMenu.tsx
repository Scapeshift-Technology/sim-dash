import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    MenuItem,
    Avatar,
    Divider,
    ListItemIcon,
    Box,
    Typography,
} from '@mui/material';
import { Settings, Logout, Person } from '@mui/icons-material';
import type { AppDispatch } from '@/store/store';
import { logoutUser, selectUsername } from '@/store/slices/authSlice';

interface UserProfileMenuProps {
    anchorEl: null | HTMLElement;
    open: boolean;
    onClose: () => void;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ anchorEl, open, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const username = useSelector(selectUsername);
    const displayName: string = username ?? 'User';

    // ---------- Event handlers ----------
    
    const handleLogout = () => {
        dispatch(logoutUser());
        onClose();
    };

    const handleNavClick = (route: string) => {
        onClose();
        navigate(route);
    };

    const handleProfileClick = () => {
        handleNavClick('/profile');
    };

    // ---------- Render ----------
    
    return (
        <Menu
            anchorEl={anchorEl}
            id="user-profile-menu"
            open={open}
            onClose={onClose}
            onClick={onClose}
            slotProps={{
                paper: {
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            {/* User Info Section */}
            <MenuItem onClick={handleProfileClick}>
                <Avatar>
                    <Person />
                </Avatar>
                <Box>
                    <Typography>{displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        View Profile
                    </Typography>
                </Box>
            </MenuItem>
            
            <Divider />
            
            {/* Settings */}
            <MenuItem onClick={() => handleNavClick('/settings')}>
                <ListItemIcon>
                    <Settings fontSize="small" />
                </ListItemIcon>
                Settings
            </MenuItem>
            
            {/* Logout */}
            <MenuItem id="logout-menu-item" onClick={handleLogout}>
                <ListItemIcon>
                    <Logout fontSize="small" />
                </ListItemIcon>
                Logout
            </MenuItem>
        </Menu>
    );
};

export default UserProfileMenu; 