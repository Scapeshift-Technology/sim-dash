import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

import { LeagueName } from "@@/types/league";
import { BetType, MainMarketConfig, ValidationConfig } from "@@/types/statCaptureConfig";

import MainMarketsConfiguration from "@/simDash/components/MainMarketsConfiguration";

import { AppDispatch, RootState } from "@/store/store";
import { 
    getLeaguePeriods, 
    selectLeaguePeriods, 
    selectLeaguePeriodsError, 
    selectLeaguePeriodsLoading,
    selectCurrentDraft,
    updateCurrentDraftMainMarkets
} from "@/apps/simDash/store/slices/statCaptureSettingsSlice";

// ---------- Constants ----------

const MLB_BET_TYPES: BetType[] = [
    { value: 'Spread', label: 'Spread' },
    { value: 'Total', label: 'Totals' },
    { value: 'TeamTotal', label: 'Team Totals' }
];

const validateMLBRangeValue = (value: string): string | null => {
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
        return 'Must be divisible by 0.5 (e.g., 6.5, 7.0, 7.5)';
    }
    
    return null;
};

const MLB_VALIDATION_CONFIG: ValidationConfig = {
    increment: 0.5,
    validateValue: validateMLBRangeValue
};

// ---------- Main component ----------

const MainMarketsTab: React.FC<{ leagueName: LeagueName }> = ({ leagueName }) => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- Redux state ----------

    const leaguePeriods = useSelector((state: RootState) => selectLeaguePeriods(state, leagueName));
    const periodsLoading = useSelector((state: RootState) => selectLeaguePeriodsLoading(state, leagueName));
    const periodsError = useSelector((state: RootState) => selectLeaguePeriodsError(state, leagueName));
    const isPeriodsError = periodsError !== null;
    
    const currentDraft = useSelector((state: RootState) => selectCurrentDraft(state, leagueName));
    const mainMarkets = currentDraft?.mainMarkets || [];

    // ---------- Effects ----------

    useEffect(() => {
        if (leaguePeriods.length === 0 && !periodsLoading) {
            dispatch(getLeaguePeriods(leagueName));
        }
    }, [dispatch, leagueName]);

    // ---------- Event handlers ----------

    const handleConfigurationChange = (newConfigurations: MainMarketConfig[]) => {
        dispatch(updateCurrentDraftMainMarkets({ leagueName, mainMarkets: newConfigurations }));
    };

    // ---------- Render ----------

    if (periodsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isPeriodsError) {
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
                        onClick={() => dispatch(getLeaguePeriods(leagueName))}
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
        <MainMarketsConfiguration
            betTypes={MLB_BET_TYPES}
            periods={leaguePeriods}
            validationConfig={MLB_VALIDATION_CONFIG}
            existingConfigurations={mainMarkets}
            onConfigurationChange={handleConfigurationChange}
            leagueName={leagueName}
        />
    );
};

export default MainMarketsTab;