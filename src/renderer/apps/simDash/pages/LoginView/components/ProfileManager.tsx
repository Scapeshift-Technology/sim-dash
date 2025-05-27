import React from 'react';
import {
    Box,
    TextField,
    Typography,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

interface ProfileManagerProps {
    profileNameToSave: string;
    setProfileNameToSave: (name: string) => void;
    selectedProfileName: string | null;
    onSaveProfile: () => void;
    onDeleteProfile: () => void;
    isLoading: boolean;
    statusMessage: string | null;
    error: string | null;
    deleteProfileStatus: string | null;
    deleteProfileError: string | null;
    saveProfileStatus: string | null;
    saveProfileError: string | null;
}

const compactFormStyle = {
    mb: 1,
    height: '30px'
};

const ProfileManager: React.FC<ProfileManagerProps> = ({
    profileNameToSave,
    setProfileNameToSave,
    selectedProfileName,
    onSaveProfile,
    onDeleteProfile,
    isLoading,
    statusMessage,
    error,
    deleteProfileStatus,
    deleteProfileError,
    saveProfileStatus,
    saveProfileError
}) => {
    return (
        <Box sx={{ mt: 4, borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Manage Profile
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <Box sx={{ flexGrow: 1, mt: '-15px' }}>
                    <TextField
                        margin="normal"
                        size="small"
                        fullWidth
                        id="profile-name"
                        label="Save/Update Profile As"
                        value={profileNameToSave}
                        onChange={(e) => setProfileNameToSave(e.target.value)}
                        disabled={isLoading || deleteProfileStatus === 'pending' || saveProfileStatus === 'pending'}
                        variant="outlined"
                        helperText={selectedProfileName ? `Editing '${selectedProfileName}'` : 'Enter a new name'}
                        sx={compactFormStyle}
                    />
                </Box>
                <Box>
                    <IconButton
                        aria-label="save profile"
                        color="primary"
                        onClick={onSaveProfile}
                        disabled={isLoading || !profileNameToSave || deleteProfileStatus === 'pending' || saveProfileStatus === 'pending'}
                    >
                        {saveProfileStatus === 'pending' ? (
                            <CircularProgress size={24} color="primary" />
                        ) : (
                            <SaveIcon />
                        )}
                    </IconButton>
                </Box>
                <Box>
                    <IconButton
                        aria-label="delete profile"
                        color="error"
                        onClick={onDeleteProfile}
                        disabled={isLoading || !selectedProfileName || deleteProfileStatus === 'pending' || saveProfileStatus === 'pending'}
                        sx={{ ml: 1 }}
                    >
                        {deleteProfileStatus === 'pending' ? (
                            <CircularProgress size={24} color="error" />
                        ) : (
                            <DeleteIcon />
                        )}
                    </IconButton>
                </Box>
            </Box>
            {saveProfileStatus === 'success' && (
                <Alert severity="success" sx={{ mt: 3 }}>
                    Profile saved successfully
                </Alert>
            )}
            {saveProfileError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    {saveProfileError}
                </Alert>
            )}
            {deleteProfileStatus === 'success' && !saveProfileStatus && !saveProfileError && (
                <Alert severity="success" sx={{ mt: 3 }}>
                    Profile deleted successfully
                </Alert>
            )}
            {deleteProfileError && !saveProfileStatus && !saveProfileError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    {deleteProfileError}
                </Alert>
            )}
            {statusMessage && !deleteProfileStatus && !deleteProfileError && !saveProfileStatus && !saveProfileError && (
                <Alert severity={error ? "warning" : "success"} sx={{ mt: 3 }}>
                    {statusMessage}
                </Alert>
            )}
            {error && !statusMessage && !deleteProfileStatus && !deleteProfileError && !saveProfileStatus && !saveProfileError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default ProfileManager; 