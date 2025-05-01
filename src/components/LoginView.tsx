import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    CircularProgress,
    Alert,
    Grid,
    IconButton,
    Paper,
    FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

import type { AppDispatch, RootState } from '../store/store';
import { loginUser, selectAuthState, clearAuthError } from '../store/slices/authSlice';
import {
    fetchProfiles,
    saveProfile,
    deleteProfile,
    setSelectedProfile,
    selectProfilesState,
    selectProfileByName,
    clearProfileStatus,
    clearProfileError,
    Profile
} from '../store/slices/profilesSlice';

const LoginView: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading: isAuthLoading, error: authError } = useSelector(selectAuthState);
    const {
        profiles,
        selectedProfileName,
        isLoading: isProfilesLoading,
        error: profilesError,
        statusMessage: profilesStatus,
    } = useSelector(selectProfilesState);

    // Local form state
    const [host, setHost] = useState('localhost');
    const [port, setPort] = useState('1433');
    const [database, setDatabase] = useState('');
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [profileNameToSave, setProfileNameToSave] = useState('');

    // Fetch profiles on component mount
    useEffect(() => {
        dispatch(fetchProfiles());
    }, [dispatch]);

    // Effect to populate form when a profile is selected from Redux state
    const selectedProfileData = useSelector(selectProfileByName(selectedProfileName));
    useEffect(() => {
        if (selectedProfileData) {
            setHost(selectedProfileData.host || 'localhost');
            setPort(selectedProfileData.port?.toString() || '1433');
            setDatabase(selectedProfileData.database || '');
            setUser(selectedProfileData.user || '');
            setPassword(selectedProfileData.password || '');
            setProfileNameToSave(selectedProfileData.name || ''); // Pre-fill save name
            dispatch(clearAuthError()); // Clear login error when profile changes
            dispatch(clearProfileError());
            dispatch(clearProfileStatus());
        } else {
            // Reset form for "New Connection"
            setHost('localhost');
            setPort('1433');
            setDatabase('');
            setUser('');
            setPassword('');
            setProfileNameToSave('');
            dispatch(clearAuthError());
            dispatch(clearProfileError());
            dispatch(clearProfileStatus());
        }
    }, [selectedProfileData, dispatch]);

    const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(loginUser({
            host,
            port,
            database,
            user,
            password
        }));
    };

    const handleProfileChange = (event: any) => {
        const name = event.target.value as string;
        dispatch(setSelectedProfile(name || null)); // Dispatch null if "New Connection" is selected
    };

    const handleSaveProfile = () => {
        const nameToSave = profileNameToSave.trim();
        if (!nameToSave) {
            alert('Please enter a name to save the profile.'); // Simple validation
            return;
        }
        if (!host || !port || !database || !user) {
            alert('Host, Port, Database, and User are required to save a profile.');
            return;
        }

        const profileData: Profile = {
            name: nameToSave,
            host,
            port: parseInt(port, 10) || 1433, // Ensure port is number
            database,
            user,
            password
        };
        dispatch(saveProfile(profileData));
    };

    const handleDeleteProfile = () => {
        if (!selectedProfileName) {
            alert('No profile selected to delete.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete profile '${selectedProfileName}'?`)) {
            dispatch(deleteProfile(selectedProfileName));
        }
    };

    // Clear messages after a delay
    useEffect(() => {
        if (profilesStatus) {
            const timer = setTimeout(() => {
                dispatch(clearProfileStatus());
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [profilesStatus, dispatch]);

    useEffect(() => {
        if (authError) {
            const timer = setTimeout(() => {
                dispatch(clearAuthError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [authError, dispatch]);

    useEffect(() => {
        if (profilesError) {
            const timer = setTimeout(() => {
                dispatch(clearProfileError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [profilesError, dispatch]);


    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                p: 3,
            }}
        >
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: '500px' }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    SimDash Login
                </Typography>

                {/* Profile Selection */}
                <FormControl fullWidth margin="normal" disabled={isProfilesLoading || isAuthLoading}>
                    <InputLabel id="profile-select-label">Load Existing Profile</InputLabel>
                    <Select
                        labelId="profile-select-label"
                        id="profile-select"
                        value={selectedProfileName || ''} // Use empty string for "New Connection"
                        label="Load Existing Profile"
                        onChange={handleProfileChange}
                    >
                        <MenuItem value=""><em>-- New Connection --</em></MenuItem>
                        {profiles.map((p: Profile) => (
                            <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>
                        ))}
                    </Select>
                    {isProfilesLoading && <CircularProgress size={20} sx={{ position: 'absolute', right: 40, top: '50%', marginTop: '-10px'}}/>}
                </FormControl>

                {/* Login Form */}
                <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="host"
                        label="Host"
                        name="host"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        disabled={isAuthLoading}
                        variant="outlined"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="port"
                        label="Port"
                        name="port"
                        type="number"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        disabled={isAuthLoading}
                        variant="outlined"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="database"
                        label="Database"
                        name="database"
                        value={database}
                        onChange={(e) => setDatabase(e.target.value)}
                        disabled={isAuthLoading}
                        variant="outlined"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="user"
                        label="User"
                        name="user"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        disabled={isAuthLoading}
                        variant="outlined"
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isAuthLoading}
                        variant="outlined"
                    />

                    {/* Login Button & Progress */}
                    <Box sx={{ mt: 2, position: 'relative' }}>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isAuthLoading || isProfilesLoading}
                            sx={{ py: 1.5 }}
                        >
                            Connect
                        </Button>
                        {isAuthLoading && (
                            <CircularProgress
                                size={24}
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-12px',
                                    marginLeft: '-12px',
                                }}
                            />
                        )}
                    </Box>

                     {/* Login Error Message */}
                    {authError && (
                        <Alert severity="error" sx={{ mt: 2 }}>{authError}</Alert>
                    )}
                </Box>

                 {/* Save/Delete Profile Section */}
                 <Box sx={{ mt: 4, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Manage Profile
                    </Typography>
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs>
                             <TextField
                                margin="dense"
                                fullWidth
                                id="profile-name-save"
                                label="Save/Update Profile As"
                                value={profileNameToSave}
                                onChange={(e) => setProfileNameToSave(e.target.value)}
                                disabled={isAuthLoading || isProfilesLoading}
                                helperText={selectedProfileName ? `Editing '${selectedProfileName}'` : 'Enter a new name'}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item>
                            <IconButton
                                aria-label="save profile"
                                color="primary"
                                onClick={handleSaveProfile}
                                disabled={isAuthLoading || isProfilesLoading || !profileNameToSave}
                            >
                                <SaveIcon />
                            </IconButton>
                        </Grid>
                         <Grid item>
                            <IconButton
                                aria-label="delete profile"
                                color="error"
                                onClick={handleDeleteProfile}
                                disabled={isAuthLoading || isProfilesLoading || !selectedProfileName}
                                sx={{ ml: 1 }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                     {/* Profile Status/Error Messages */}
                    {profilesStatus && (
                         <Alert severity={profilesError ? "warning" : "success"} sx={{ mt: 2 }}>
                            {profilesStatus}
                        </Alert>
                    )}
                    {profilesError && !profilesStatus && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {profilesError}
                        </Alert>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default LoginView; 