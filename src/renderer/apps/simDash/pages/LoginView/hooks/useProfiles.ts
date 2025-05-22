import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import {
    fetchProfiles,
    saveProfile,
    deleteProfile,
    setSelectedProfile,
    selectProfilesState,
    selectProfileByName,
    testConnection
} from '@/simDash/store/slices/profilesSlice';
import type { Profile } from '@/types/profiles';
import { SelectChangeEvent } from '@mui/material';
import { useStatusMessages } from './useStatusMessages';
import { LoginConfig } from '@@/types/sqlite';

export interface UseProfilesReturn {
    // Profile data
    profiles: Profile[];
    selectedProfileName: string | null;
    selectedProfile: Profile | null;
    isLoading: boolean;
    error: string | null;
    statusMessage: string | null;
    deleteProfileStatus: string | null;
    deleteProfileError: string | null;
    saveProfileStatus: string | null;
    saveProfileError: string | null;

    // Profile actions
    handleProfileChange: (event: SelectChangeEvent<string>) => void;
    handleSaveProfile: (profileData: Profile) => void;
    handleDeleteProfile: (profileName: string) => void;
    handleTestConnection: (config: LoginConfig) => void;
}

export function useProfiles(): UseProfilesReturn {
    const dispatch = useDispatch<AppDispatch>();
    const {
        profiles,
        selectedProfileName,
        isLoading,
        deleteProfileStatus,
        deleteProfileError,
        saveProfileStatus,
        saveProfileError,
    } = useSelector(selectProfilesState);
    const selectedProfile = useSelector(selectProfileByName(selectedProfileName));

    const {
        status: statusMessage,
        error,
        setStatus,
        setError,
        clearAll: clearMessages
    } = useStatusMessages();

    // Fetch profiles on mount
    useEffect(() => {
        dispatch(fetchProfiles());
    }, [dispatch]);

    const handleProfileChange = (event: SelectChangeEvent<string>) => {
        const name = event.target.value;
        dispatch(setSelectedProfile(name || null));
        clearMessages();
    };

    const handleSaveProfile = (profileData: Profile) => {
        if (!profileData.name.trim()) {
            setError('Please enter a name to save the profile.');
            return;
        }
        if (!profileData.host || !profileData.port || !profileData.database || !profileData.user) {
            setError('Host, Port, Database, and User are required to save a profile.');
            return;
        }

        dispatch(saveProfile(profileData))
            .unwrap()
            .then(() => {
                setStatus('Profile saved successfully');
                dispatch(fetchProfiles());
            })
            .catch((err) => {
                setError(err.message || 'Failed to save profile');
            });
    };

    const handleDeleteProfile = (profileName: string) => {
        if (!profileName) {
            setError('No profile selected to delete.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete profile '${profileName}'?`)) {
            dispatch(deleteProfile(profileName))
                .unwrap()
                .then(() => {
                    setStatus('Profile deleted successfully');
                    dispatch(fetchProfiles());
                    dispatch(setSelectedProfile(null));
                })
                .catch((err) => {
                    setError(err.message || 'Failed to delete profile');
                });
        }
    };

    const handleTestConnection = (config: LoginConfig) => {
        if (!config.host || !config.port || !config.database || !config.user) {
            setError('Host, Port, Database, and User are required to test connection.');
            return;
        }

        dispatch(testConnection(config))
            .unwrap()
            .then((success) => {
                if (success) {
                    setStatus('Connection test successful!');
                } else {
                    setError('Connection test failed.');
                }
            })
            .catch((err) => {
                setError('Error occured while testing connection');
            });
    };

    return {
        profiles,
        selectedProfileName,
        selectedProfile,
        isLoading,
        error,
        statusMessage,
        deleteProfileStatus,
        deleteProfileError,
        saveProfileStatus,
        saveProfileError,
        handleProfileChange,
        handleSaveProfile,
        handleDeleteProfile,
        handleTestConnection
    };
}
