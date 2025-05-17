import React from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent
} from '@mui/material';
import { Profile } from '@/types/profiles';

interface ProfileSelectorProps {
    profiles: Profile[];
    selectedProfileName: string | null;
    onProfileChange: (event: SelectChangeEvent<string>) => void;
    isLoading: boolean;
}

const compactFormStyle = {
    mb: 1,
    height: '30px'
};

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
    profiles,
    selectedProfileName,
    onProfileChange,
    isLoading
}) => {
    return (
        <FormControl 
            fullWidth 
            margin="normal" 
            size="small"
            disabled={isLoading}
            sx={compactFormStyle}
        >
            <InputLabel id="profile-select-label">Load Existing Profile</InputLabel>
            <Select
                labelId="profile-select-label"
                id="profile-select"
                value={selectedProfileName || ''}
                label="Load Existing Profile"
                onChange={onProfileChange}
                size="small"
            >
                <MenuItem value=""><em>-- New Connection --</em></MenuItem>
                {profiles.map((p: Profile) => (
                    <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ProfileSelector; 