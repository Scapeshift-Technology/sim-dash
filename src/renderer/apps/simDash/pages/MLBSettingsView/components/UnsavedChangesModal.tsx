import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

// ---------- Types ----------

interface UnsavedChangesModalProps {
    open: boolean;
    onClose: () => void;
    onAccept: () => void;
    onDecline: () => void;
}

// ---------- Main component ----------

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    open,
    onClose,
    onAccept,
    onDecline
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    Unsaved Changes
                </Box>
            </DialogTitle>
            
            <DialogContent>
                <Typography variant="body1">
                    You have unsaved changes to the current capture configuration. 
                    If you proceed, these changes will be lost.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Would you like to discard your changes and continue?
                </Typography>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onDecline} variant="outlined">
                    Cancel
                </Button>
                <Button onClick={onAccept} variant="contained" color="warning">
                    Discard Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UnsavedChangesModal; 