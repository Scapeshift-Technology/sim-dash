import React, { useEffect } from "react";
import { Alert, Box, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

import { LeagueName } from "@@/types/league";
import { PropOUConfig, ValidationConfig } from "@@/types/statCaptureConfig";

import OUPropsConfiguration from "@/simDash/components/OUPropsConfiguration";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { 
    selectLeagueOUProps, 
    selectLeagueOUPropsLoading, 
    selectLeagueOUPropsError,
    getLeagueProps,
    updateCurrentDraftOUProps,
    selectCurrentDraft
} from "@/apps/simDash/store/slices/statCaptureSettingsSlice";

// ---------- Constants ----------

const validateMLBOUPropsValue = (value: string): string | null => {
    // Check if it's a valid number
    const num = parseFloat(value);
    if (isNaN(num)) {
        return 'Must be a valid number';
    }
    
    // Check if it's positive
    if (num < 0) {
        return 'Must be greater than or equal to 0';
    }
    
    // Check if it's divisible by 0.5
    if ((num * 2) % 1 !== 0) {
        return 'Must be divisible by 0.5 (e.g., 2.5, 3.0, 3.5)';
    }
    
    return null;
};

const MLB_OU_PROPS_VALIDATION_CONFIG: ValidationConfig = {
    increment: 0.5,
    validateValue: validateMLBOUPropsValue
};

// ---------- Main component ----------

const OUPropsTab: React.FC<{ leagueName: LeagueName }> = ({ leagueName }) => {

    const dispatch = useDispatch<AppDispatch>();

    // ---------- Redux state ----------

    const leagueOUProps = useSelector((state: RootState) => selectLeagueOUProps(state, leagueName));
    const ouPropsLoading = useSelector((state: RootState) => selectLeagueOUPropsLoading(state, leagueName));
    const ouPropsError = useSelector((state: RootState) => selectLeagueOUPropsError(state, leagueName));
    const isPropsError = ouPropsError !== null;
    
    const currentDraft = useSelector((state: RootState) => selectCurrentDraft(state, leagueName));
    const existingConfigurations = currentDraft?.propsOU || [];

    // ---------- Effects ----------

    useEffect(() => {
        if (leagueOUProps.length === 0 && !ouPropsLoading) {
            dispatch(getLeagueProps({ leagueName, propType: 'OvrUnd' }));
        }
    }, [dispatch, leagueName, leagueOUProps.length, ouPropsLoading]);

    // ---------- Event handlers ----------

    const handleConfigurationChange = (newConfigurations: PropOUConfig[]) => {
        dispatch(updateCurrentDraftOUProps({ leagueName, ouProps: newConfigurations }));
    };

    // ---------- Render ----------

    if (ouPropsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isPropsError) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 200, justifyContent: 'center' }}>
                <Alert 
                    severity="error"
                    sx={{ transform: 'scale(1.1)' }}
                >
                    Error loading data. Please try again.
                </Alert>
                <Tooltip title="Try again">
                    <IconButton 
                        color="primary" 
                        onClick={() => dispatch(getLeagueProps({ leagueName, propType: 'OvrUnd' }))}
                        sx={{ 
                            border: '2px solid',
                            borderColor: 'primary.main',
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            }
                        }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    return (
        <OUPropsConfiguration
            availableProps={leagueOUProps}
            existingConfigurations={existingConfigurations}
            onConfigurationChange={handleConfigurationChange}
            leagueName={leagueName}
            validationConfig={MLB_OU_PROPS_VALIDATION_CONFIG}
        />
    );
};

export default OUPropsTab;