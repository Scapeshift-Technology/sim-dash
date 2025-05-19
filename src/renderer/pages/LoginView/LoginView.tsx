import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
} from '@mui/material';
import ProfileManager from './components/ProfileManager';
import LoginForm from './components/LoginForm';
import ProfileSelector from './components/ProfileSelector';
import { useProfiles } from './hooks/useProfiles';
import { useLoginForm } from './hooks/useLoginForm';

const LoginView: React.FC = () => {

    // ---------- Hooks ----------

    const {
        profiles,
        selectedProfileName,
        selectedProfile,
        isLoading: isProfilesLoading,
        error: profilesError,
        statusMessage: profilesStatus,
        deleteProfileStatus,
        deleteProfileError,
        saveProfileStatus,
        saveProfileError,
        handleProfileChange,
        handleSaveProfile,
        handleDeleteProfile,
        handleTestConnection,
    } = useProfiles();

    const {
        formState,
        setHost,
        setPort,
        setDatabase,
        setUser,
        setPassword,
        handleSubmit,
        isLoading: isAuthLoading,
        error: authError,
        populateFromProfile
    } = useLoginForm();

    // ---------- State ----------

    const [profileNameToSave, setProfileNameToSave] = useState('');

    // ---------- Effects ----------

    useEffect(() => { // Effect to populate form when a profile is selected
        populateFromProfile(selectedProfile);
        if (selectedProfile) {
            setProfileNameToSave(selectedProfile.name);
        } else {
            setProfileNameToSave('');
        }
    }, [selectedProfile, populateFromProfile]);

    // ---------- Handlers ----------

    const handleSaveProfileClick = () => {
        handleSaveProfile({
            name: profileNameToSave,
            host: formState.host,
            port: parseInt(formState.port, 10) || 1433,
            database: formState.database,
            user: formState.user,
            password: formState.password
        });
    };

    const handleDeleteProfileClick = () => {
        if (selectedProfileName) {
            handleDeleteProfile(selectedProfileName);
        }
    };

    const handleTestConnectionClick = () => {
        handleTestConnection({
            host: formState.host,
            port: formState.port || '1433',
            database: formState.database,
            user: formState.user,
            password: formState.password
        });
    };

    // ---------- Render ----------

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

                <ProfileSelector
                    profiles={profiles}
                    selectedProfileName={selectedProfileName}
                    onProfileChange={handleProfileChange}
                    isLoading={isAuthLoading || isProfilesLoading}
                />

                <LoginForm
                    host={formState.host}
                    port={formState.port}
                    database={formState.database}
                    user={formState.user}
                    password={formState.password}
                    onHostChange={(e) => setHost(e.target.value)}
                    onPortChange={(e) => setPort(e.target.value)}
                    onDatabaseChange={(e) => setDatabase(e.target.value)}
                    onUserChange={(e) => setUser(e.target.value)}
                    onPasswordChange={(e) => setPassword(e.target.value)}
                    onSubmit={handleSubmit}
                    isLoading={isAuthLoading || isProfilesLoading}
                    error={authError}
                />

                <ProfileManager
                    profileNameToSave={profileNameToSave}
                    setProfileNameToSave={setProfileNameToSave}
                    selectedProfileName={selectedProfileName}
                    onSaveProfile={handleSaveProfileClick}
                    onDeleteProfile={handleDeleteProfileClick}
                    isLoading={isAuthLoading || isProfilesLoading}
                    statusMessage={profilesStatus}
                    error={profilesError}
                    deleteProfileStatus={deleteProfileStatus}
                    deleteProfileError={deleteProfileError}
                    saveProfileStatus={saveProfileStatus}
                    saveProfileError={saveProfileError}
                    onTestConnection={handleTestConnectionClick}
                />
            </Paper>
        </Box>
    );
};

export default LoginView; 