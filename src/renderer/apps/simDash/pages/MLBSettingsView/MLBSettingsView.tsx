import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, TextField, Button, Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

import FolderTabs, { FolderTab } from './components/FolderTabs';
import MainMarketsTab from './components/MainMarketsTab';
import OUPropsTab from './components/OUPropsTab';
import YesNoTab from './components/YesNoTab';
import UnsavedChangesModal from './components/UnsavedChangesModal';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { 
    getLeagueStatCaptureConfigurations, 
    getStatCaptureConfiguration,
    initializeLeague, 
    selectLeagueStatCaptureConfigurations, 
    selectLeagueStatCaptureConfigurationsLoading, 
    selectCurrentDraft,
    saveStatCaptureConfiguration,
    selectSaveConfigLoading,
    selectSaveConfigError,
    selectSaveConfigName,
    updateSaveConfigName,
    clearCurrentDraft,
    selectHasUnsavedChanges,
    selectCurrentlyLoadedConfiguration
} from '@/apps/simDash/store/slices/statCaptureSettingsSlice';

import { LeagueName } from '@@/types/league';

// ---------- Constants ----------

const LEAGUE_NAME = 'MLB' as LeagueName;

// ---------- Main component ----------

const MLBSettingsView: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------
    
    const [hasAttemptedConfigFetch, setHasAttemptedConfigFetch] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
    const [pendingConfigSelection, setPendingConfigSelection] = useState<string>('');

    // ---------- Redux State ----------
    
    const leagueStatCaptureConfigurations = useSelector((state: RootState) => selectLeagueStatCaptureConfigurations(state, LEAGUE_NAME));
    const configurationsLoading = useSelector((state: RootState) => selectLeagueStatCaptureConfigurationsLoading(state, LEAGUE_NAME));
    const currentDraft = useSelector((state: RootState) => selectCurrentDraft(state, LEAGUE_NAME));
    const saveLoading = useSelector((state: RootState) => selectSaveConfigLoading(state, LEAGUE_NAME));
    const saveError = useSelector((state: RootState) => selectSaveConfigError(state, LEAGUE_NAME));
    const saveConfigName = useSelector((state: RootState) => selectSaveConfigName(state, LEAGUE_NAME));
    const hasUnsavedChanges = useSelector((state: RootState) => selectHasUnsavedChanges(state, LEAGUE_NAME));
    const currentlyLoadedConfiguration = useSelector((state: RootState) => selectCurrentlyLoadedConfiguration(state, LEAGUE_NAME));

    // ---------- Effects ----------

    useEffect(() => {
        dispatch(initializeLeague(LEAGUE_NAME)); // If the settings already exist, they won't be overwritten
    }, [dispatch]);

    useEffect(() => {
        if (!hasAttemptedConfigFetch && !configurationsLoading) {
            dispatch(getLeagueStatCaptureConfigurations(LEAGUE_NAME));
            setHasAttemptedConfigFetch(true);
        }
    }, [dispatch, hasAttemptedConfigFetch, configurationsLoading]);

    useEffect(() => { // Clear success message after 3 seconds
        if (saveSuccess) {
            const timer = setTimeout(() => setSaveSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveSuccess]);

    // ---------- Event handlers ----------

    const handleConfigurationSelect = async (configName: string) => {
        if (hasUnsavedChanges) {
            setPendingConfigSelection(configName);
            setShowUnsavedChangesModal(true);
            return;
        }

        await proceedWithConfigurationChange(configName);
    };

    const proceedWithConfigurationChange = async (configName: string) => {
        if (!configName) {
            dispatch(clearCurrentDraft(LEAGUE_NAME));
            return;
        }
        
        try {
            const result = await dispatch(getStatCaptureConfiguration({ 
                configName, 
                leagueName: LEAGUE_NAME 
            })).unwrap();

            dispatch(updateSaveConfigName({ leagueName: LEAGUE_NAME, saveConfigName: result.name }));
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    };

    const handleUnsavedChangesAccept = async () => {
        setShowUnsavedChangesModal(false);
        await proceedWithConfigurationChange(pendingConfigSelection);
        setPendingConfigSelection('');
    };

    const handleUnsavedChangesDecline = () => {
        setShowUnsavedChangesModal(false);
        setPendingConfigSelection('');
    };

    const handleUnsavedChangesClose = () => {
        setShowUnsavedChangesModal(false);
        setPendingConfigSelection('');
    };

    const handleSaveConfig = async () => {
        if (!currentDraft || !saveConfigName.trim()) return;

        const configToSave = {
            ...currentDraft,
            name: saveConfigName.trim(),
            isActive: false
        };

        try {
            await dispatch(saveStatCaptureConfiguration(configToSave)).unwrap();
            setSaveSuccess(true);
            dispatch(updateSaveConfigName({ leagueName: LEAGUE_NAME, saveConfigName: '' }));
            // Refresh the configurations list
            dispatch(getLeagueStatCaptureConfigurations(LEAGUE_NAME));
        } catch (error) {
            // Error is handled by Redux state
        }
    };

    const canSave = () => {
        if (!saveConfigName.trim() || !currentDraft || saveLoading) {
            return false;
        }
        
        if (!currentlyLoadedConfiguration) {// If no config is loaded, we can always save
            return true;
        }
        
        // If a config is loaded, we can only save if there are unsaved changes or we save a different name
        return hasUnsavedChanges || saveConfigName !== currentlyLoadedConfiguration.name;
    };

    // ---------- Tab configuration ----------

    const settingsTabs: FolderTab[] = [
        {
            id: 'main-markets',
            label: 'Main Markets',
            content: <MainMarketsTab leagueName={LEAGUE_NAME}/>
        },
        {
            id: 'ou-props',
            label: 'O/U Props',
            content: <OUPropsTab leagueName={LEAGUE_NAME} />
        },
        {
            id: 'yesno-props',
            label: 'Yes/No Props',
            content: <YesNoTab leagueName={LEAGUE_NAME}/>
        }
    ];

    // ---------- Render ----------

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            mt: 2,
            flexGrow: 1,
            minHeight: 0
        }}>
            {/* Config Selection */}
            <Box sx={{ mb: 3, px: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Capture Configuration
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                    <FormControl size="small" sx={{ flexGrow: 1 }}>
                        <InputLabel>Select Capture Configuration</InputLabel>
                        <Select
                            value={currentDraft?.name || ''}
                            label="Select Capture Configuration"
                            disabled={configurationsLoading}
                            onChange={(e) => handleConfigurationSelect(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>No capture configuration selected</em>
                            </MenuItem>
                            {leagueStatCaptureConfigurations.map((config) => (
                                <MenuItem key={config.name} value={config.name}>
                                    {config.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Save Configuration */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                        label="Capture Configuration Name"
                        value={saveConfigName}
                        onChange={(e) => dispatch(updateSaveConfigName({ leagueName: LEAGUE_NAME, saveConfigName: e.target.value }))}
                        size="small"
                        sx={{ flexGrow: 1 }}
                        disabled={saveLoading}
                        placeholder="Enter name to save current capture configuration"
                    />
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveConfig}
                        disabled={!canSave()}
                        sx={{ minWidth: 140 }}
                    >
                        {saveLoading ? 'Saving...' : 'Save'}
                    </Button>
                </Box>

                {/* Success/Error Messages */}
                {saveSuccess && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Capture configuration saved successfully!
                    </Alert>
                )}
                {saveError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {saveError}
                    </Alert>
                )}
            </Box>

            <FolderTabs 
                tabs={settingsTabs}
                leagueName={LEAGUE_NAME}
                ariaLabel="MLB simulation settings tabs"
            />

            <UnsavedChangesModal
                open={showUnsavedChangesModal}
                onClose={handleUnsavedChangesClose}
                onAccept={handleUnsavedChangesAccept}
                onDecline={handleUnsavedChangesDecline}
            />
        </Box>
    );
};

export default MLBSettingsView;