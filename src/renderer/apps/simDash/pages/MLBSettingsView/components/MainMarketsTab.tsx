import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { LeagueName } from "@@/types/league";
import { BetType, MainMarketConfig, ValidationConfig } from "@@/types/statCaptureConfig";

import MainMarketsConfiguration from "@/simDash/components/MainMarketsConfiguration";

import { AppDispatch, RootState } from "@/store/store";
import { 
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

    const currentDraft = useSelector((state: RootState) => selectCurrentDraft(state, leagueName));
    const mainMarkets = currentDraft?.mainMarkets || [];

    // ---------- Event handlers ----------

    const handleConfigurationChange = (newConfigurations: MainMarketConfig[]) => {
        dispatch(updateCurrentDraftMainMarkets({ leagueName, mainMarkets: newConfigurations }));
    };

    // ---------- Render ----------

    return (
        <MainMarketsConfiguration
            betTypes={MLB_BET_TYPES}
            validationConfig={MLB_VALIDATION_CONFIG}
            existingConfigurations={mainMarkets}
            onConfigurationChange={handleConfigurationChange}
            leagueName={leagueName}
        />
    );
};

export default MainMarketsTab;