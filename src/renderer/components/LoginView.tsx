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
    Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { Theme } from '@mui/material/styles';

import type { AppDispatch, RootState } from '@/store/store';
import { loginUser, selectAuthState, clearAuthError } from '@/store/slices/authSlice';
import {
    fetchProfiles,
    saveProfile,
    deleteProfile,
    setSelectedProfile,
    selectProfilesState,
    selectProfileByName,
    clearProfileStatus,
    clearProfileError
} from '@/store/slices/profilesSlice';
import { Profile } from '@/types/profiles';

const compactFormStyle = {
    mb: 1,
    height: '30px'
};

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

    // ---------- Render functions ----------

    function renderTextField(
        label: string, 
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
        value: string, 
        disabled: boolean,
        options?: {
            helperText?: string;
            required?: boolean;
            type?: string;
        }
    ) {
      return (
        <TextField
          margin="normal"
          size="small"
          required={options?.required ?? true}
          fullWidth
          id={label.toLowerCase().replace(/\s+/g, '-')}
          label={label}
          name={label.toLowerCase()}
          value={value}
          onChange={onChange}
          disabled={disabled}
          variant="outlined"
          type={options?.type}
          helperText={options?.helperText}
          sx={compactFormStyle}
        />
      )
    }

    // ---------- Render content ----------

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
                <Typography id="login-view-title" variant="h4" component="h1" gutterBottom align="center">
                    SimDash Login
                </Typography>

                {/* Profile Selection */}
                <FormControl 
                    fullWidth 
                    margin="normal" 
                    size="small"
                    disabled={isProfilesLoading || isAuthLoading}
                    sx={compactFormStyle}
                >
                    <InputLabel id="profile-select-label">Load Existing Profile</InputLabel>
                    <Select
                        labelId="profile-select-label"
                        id="profile-select"
                        value={selectedProfileName || ''}
                        label="Load Existing Profile"
                        onChange={handleProfileChange}
                        size="small"
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
                    {renderTextField('Host', (e) => setHost(e.target.value), host, isAuthLoading)}
                    {renderTextField('Port', (e) => setPort(e.target.value), port, isAuthLoading, { type: 'number' })}
                    {renderTextField('Database', (e) => setDatabase(e.target.value), database, isAuthLoading)}
                    {renderTextField('User', (e) => setUser(e.target.value), user, isAuthLoading)}
                    {renderTextField('Password', (e) => setPassword(e.target.value), password, isAuthLoading, { type: 'password', required: false })}

                    {/* Login Button & Progress */}
                    <Box sx={{ mt: 2, position: 'relative' }}>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            id="login-button"
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
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                        <Box sx={{ flexGrow: 1, mt: '-15px' }}>
                            {renderTextField(
                                'Save/Update Profile As',
                                (e) => setProfileNameToSave(e.target.value),
                                profileNameToSave,
                                isAuthLoading || isProfilesLoading,
                                {
                                    helperText: selectedProfileName ? `Editing '${selectedProfileName}'` : 'Enter a new name',
                                    required: false
                                }
                            )}
                        </Box>
                        <Box>
                            <IconButton
                                aria-label="save profile"
                                color="primary"
                                onClick={handleSaveProfile}
                                disabled={isAuthLoading || isProfilesLoading || !profileNameToSave}
                            >
                                <SaveIcon />
                            </IconButton>
                        </Box>
                        <Box>
                            <IconButton
                                aria-label="delete profile"
                                color="error"
                                onClick={handleDeleteProfile}
                                disabled={isAuthLoading || isProfilesLoading || !selectedProfileName}
                                sx={{ ml: 1 }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Box>
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