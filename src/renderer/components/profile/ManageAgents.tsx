import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import type { AppDispatch } from '@/store/store';
import {
    selectGrantorPermissions,
    selectFetchPermissionsLoading,
    selectFetchPermissionsError,
    selectRemoveUserPermissionLoading,
    selectRemoveUserPermissionError,
    removeUserPermission,
    fetchPermissions,
    clearRemoveUserPermissionError
} from '@/store/slices/authSlice';
import type { GrantorResult } from '@/types/auth';

const ManageAgents: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const grantorPermissions = useSelector(selectGrantorPermissions);
    const fetchPermissionsLoading = useSelector(selectFetchPermissionsLoading);
    const fetchPermissionsError = useSelector(selectFetchPermissionsError);
    const removeUserPermissionLoading = useSelector(selectRemoveUserPermissionLoading);
    const removeUserPermissionError = useSelector(selectRemoveUserPermissionError);

    const handleRemovePermission = async (grantee: string, roleType: string) => {
        const result = await dispatch(removeUserPermission({
            granteeUsername: grantee,
            partyAgentRoleType: roleType
        }));
        
        if (removeUserPermission.fulfilled.match(result)) {
            // Refresh permissions to show updated list
            dispatch(fetchPermissions());
        }
    };

    const handleClearError = () => {
        dispatch(clearRemoveUserPermissionError());
    };

    if (fetchPermissionsLoading) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Manage Existing Agents
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                        Loading permissions...
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Manage Existing Agents
            </Typography>
            
            {fetchPermissionsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load permissions: {fetchPermissionsError}
                </Alert>
            )}
            
            {removeUserPermissionError && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    onClose={handleClearError}
                >
                    {removeUserPermissionError}
                </Alert>
            )}
            
            {grantorPermissions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No agent permissions granted yet.
                </Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Role Type</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {grantorPermissions.map((permission: GrantorResult, index: number) => (
                                <TableRow key={`${permission.Grantee}-${permission.PartyAgentRoleType}-${index}`}>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {permission.Grantee}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={permission.PartyAgentRoleType} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemovePermission(
                                                permission.Grantee, 
                                                permission.PartyAgentRoleType
                                            )}
                                            disabled={removeUserPermissionLoading}
                                            title="Remove permission"
                                        >
                                            {removeUserPermissionLoading ? (
                                                <CircularProgress size={16} />
                                            ) : (
                                                <Delete fontSize="small" />
                                            )}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default ManageAgents; 