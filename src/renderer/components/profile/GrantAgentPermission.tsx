import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import type { AppDispatch } from '@/store/store';
import {
    selectRoleTypes,
    selectRoleTypesLoading,
    selectRoleTypesError,
    selectAddUserPermissionLoading,
    selectAddUserPermissionError,
    fetchRoleTypes,
    addUserPermission,
    fetchPermissions,
    clearAddUserPermissionError
} from '@/store/slices/authSlice';

const GrantAgentPermission: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const roleTypes = useSelector(selectRoleTypes);
    const roleTypesLoading = useSelector(selectRoleTypesLoading);
    const roleTypesError = useSelector(selectRoleTypesError);
    const addUserPermissionLoading = useSelector(selectAddUserPermissionLoading);
    const addUserPermissionError = useSelector(selectAddUserPermissionError);
    
    const [granteeUsername, setGranteeUsername] = useState('');
    const [selectedRoleType, setSelectedRoleType] = useState('');

    useEffect(() => {
        // Fetch role types when component mounts
        if (roleTypes.length === 0 && !roleTypesLoading) {
            dispatch(fetchRoleTypes());
        }
    }, [dispatch, roleTypes.length, roleTypesLoading]);

    const handleGrantPermission = async () => {
        if (granteeUsername.trim() && selectedRoleType) {
            const result = await dispatch(addUserPermission({
                granteeUsername: granteeUsername.trim(),
                partyAgentRoleType: selectedRoleType
            }));
            
            if (addUserPermission.fulfilled.match(result)) {
                // Clear form on success
                setGranteeUsername('');
                setSelectedRoleType('');
                // Refresh permissions to show updated list
                dispatch(fetchPermissions());
            }
        }
    };

    const handleClearError = () => {
        dispatch(clearAddUserPermissionError());
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Grant Agent Permission
            </Typography>
            
            {roleTypesError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load role types: {roleTypesError}
                </Alert>
            )}
            
            {addUserPermissionError && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    onClose={handleClearError}
                >
                    {addUserPermissionError}
                </Alert>
            )}
            
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 2
            }}>
                <TextField
                    label="Username"
                    value={granteeUsername}
                    onChange={(e) => setGranteeUsername(e.target.value)}
                    placeholder="Enter username"
                    size="small"
                    sx={{ flex: 1 }}
                />
                
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="role-type-select-label">Role Type</InputLabel>
                    <Select
                        labelId="role-type-select-label"
                        value={selectedRoleType}
                        label="Role Type"
                        onChange={(e) => setSelectedRoleType(e.target.value)}
                        disabled={roleTypesLoading}
                    >
                        {roleTypes.map((roleType) => (
                            <MenuItem key={roleType} value={roleType}>
                                {roleType}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                <Button
                    variant="contained"
                    onClick={handleGrantPermission}
                    disabled={
                        !granteeUsername.trim() || 
                        !selectedRoleType || 
                        addUserPermissionLoading ||
                        roleTypesLoading
                    }
                    sx={{ minWidth: 120 }}
                >
                    {addUserPermissionLoading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        'Grant'
                    )}
                </Button>
            </Box>
            
            {roleTypesLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                        Loading role types...
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default GrantAgentPermission; 