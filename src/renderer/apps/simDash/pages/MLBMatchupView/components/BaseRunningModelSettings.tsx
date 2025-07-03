import React from 'react';
import { MenuItem, Select, InputLabel, FormControl, Box, SelectChangeEvent } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { BaseRunningModel } from "@@/types/mlb/mlb-sim";
import { LeagueName } from "@@/types/league";
import { updateBaseRunningModel, selectBaseRunningModel } from "@/apps/simDash/store/slices/simInputsSlice";

interface BaseRunningModelSettingsProps {
    leagueName: LeagueName;
    matchId: number;
}

const BaseRunningModelSettings = ({
    leagueName,
    matchId
}: BaseRunningModelSettingsProps) => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State & Variables ----------

    const currentModel = useSelector((state: RootState) => selectBaseRunningModel(state, leagueName, matchId));
    
    const baseRunningModels: { value: BaseRunningModel; label: string; description: string }[] = [
        {
            value: 'ind_stolen_bases',
            label: 'Individual Stolen Bases',
            description: 'Player-specific baserunning'
        },
        {
            value: 'avg_stolen_bases',
            label: 'League Average Stolen Bases',
            description: 'Baserunning model with league average stolen base rates'
        },
        // {
        //     value: 'state_transitions',
        //     label: 'State Transitions',
        //     description: 'Original approach with stolen bases baked into baserunning transitions'
        // }
    ];

    // ---------- Handlers ----------

    const handleModelChange = (model: BaseRunningModel) => {
        dispatch(updateBaseRunningModel({ 
            league: leagueName, 
            matchId, 
            baseRunningModel: model 
        }));
    };

    // ---------- Render ----------

    return (
        <Box sx={{ position: 'relative' }}>
            <FormControl size="small" fullWidth>
                <InputLabel>Base Running Model</InputLabel>
                <Select
                    value={currentModel}
                    label="Base Running Model"
                    onChange={(e: SelectChangeEvent<BaseRunningModel>) => handleModelChange(e.target.value as BaseRunningModel)}
                    sx={{ fontSize: '0.875rem' }}
                    renderValue={(value: BaseRunningModel) => {
                        const selectedModel = baseRunningModels.find(model => model.value === value);
                        return selectedModel?.label || value;
                    }}
                >
                    {baseRunningModels.map((model) => (
                        <MenuItem 
                            key={model.value} 
                            value={model.value}
                        >
                            <Box>
                                <Box sx={{ fontWeight: 500 }}>
                                    {model.label}
                                </Box>
                                <Box sx={{ 
                                    fontSize: '0.75rem', 
                                    color: 'text.secondary',
                                    mt: 0.25 
                                }}>
                                    {model.description}
                                </Box>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default BaseRunningModelSettings; 