import React, { useEffect } from "react";
import { Alert, Box, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

import { LeagueName } from "@@/types/league";
import { PropYNConfig } from "@@/types/statCaptureConfig";

import YNPropsConfiguration from "@/simDash/components/YNPropsConfiguration";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { 
    selectLeagueYNProps, 
    selectLeagueYNPropsLoading, 
    selectLeagueYNPropsError,
    getLeagueProps,
    updateCurrentDraftYNProps,
    selectCurrentDraft
} from "@/apps/simDash/store/slices/statCaptureSettingsSlice";

// ---------- Main component ----------

const YesNoTab: React.FC<{ leagueName: LeagueName }> = ({ leagueName }) => {

    const dispatch = useDispatch<AppDispatch>();

    // ---------- Redux state ----------

    const leagueYNProps = useSelector((state: RootState) => selectLeagueYNProps(state, leagueName));
    const ynPropsLoading = useSelector((state: RootState) => selectLeagueYNPropsLoading(state, leagueName));
    const ynPropsError = useSelector((state: RootState) => selectLeagueYNPropsError(state, leagueName));
    const isPropsError = ynPropsError !== null;
    
    const currentDraft = useSelector((state: RootState) => selectCurrentDraft(state, leagueName));
    const existingConfigurations = currentDraft?.propsYN || [];

    // ---------- Effects ----------

    useEffect(() => {
        if (leagueYNProps.length === 0 && !ynPropsLoading) {
            dispatch(getLeagueProps({ leagueName, propType: 'YesNo' }));
        }
    }, [dispatch, leagueName, leagueYNProps.length, ynPropsLoading]);

    // ---------- Event handlers ----------

    const handleConfigurationChange = (newConfigurations: PropYNConfig[]) => {
        dispatch(updateCurrentDraftYNProps({ leagueName, ynProps: newConfigurations }));
    };

    // ---------- Render ----------

    if (ynPropsLoading) {
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
                        onClick={() => dispatch(getLeagueProps({ leagueName, propType: 'YesNo' }))}
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
        <YNPropsConfiguration
            availableProps={leagueYNProps}
            existingConfigurations={existingConfigurations}
            onConfigurationChange={handleConfigurationChange}
            leagueName={leagueName}
        />
    );
};

export default YesNoTab;