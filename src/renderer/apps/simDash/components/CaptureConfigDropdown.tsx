import { MenuItem } from "@mui/material";
import { Select } from "@mui/material";
import { InputLabel } from "@mui/material";
import { FormControl } from "@mui/material";
import { Box, IconButton, Tooltip } from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import {
    selectActiveConfig,
    selectLeagueStatCaptureConfigurations,
    selectLeagueStatCaptureConfigurationsLoading
} from "@/apps/simDash/store/slices/statCaptureSettingsSlice";

import { LeagueName } from "@@/types/league";

import { setActiveStatCaptureConfiguration, getActiveStatCaptureConfiguration } from "@/apps/simDash/store/slices/statCaptureSettingsSlice";
import { openSettingsTab } from "@/apps/simDash/store/slices/tabSlice";

// ---------- Main component ----------

interface CaptureConfigDropdownProps {
    leagueName: LeagueName;
}

const CaptureConfigDropdown = ({ leagueName }: CaptureConfigDropdownProps) => {

    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------

    const activeConfig = useSelector((state: RootState) => selectActiveConfig(state, leagueName));
    const leagueConfigurations = useSelector((state: RootState) => selectLeagueStatCaptureConfigurations(state, leagueName));
    const leagueConfigurationsLoading = useSelector((state: RootState) => selectLeagueStatCaptureConfigurationsLoading(state, leagueName));

    // ---------- Event handlers ----------

    const handleActiveConfigChange = async (configName: string) => {
        if (!configName) return;
        
        try {
            await dispatch(setActiveStatCaptureConfiguration({ 
                configName, 
                leagueName: leagueName 
            })).unwrap();

            await dispatch(getActiveStatCaptureConfiguration(leagueName));
        } catch (error) {
            console.error('Error setting active config:', error);
        }
    };

    const handleSettingsClick = () => {
        dispatch(openSettingsTab({
            league: leagueName
        }));
    };

    // ---------- Render ----------

    return (
        <>
            {/* Configuration Selector */}
            <Box sx={{ position: 'relative' }}>
                <FormControl size="small" fullWidth>
                    <InputLabel>Capture Configuration</InputLabel>
                    <Select
                        value={activeConfig?.name || ''}
                        label="Capture Configuration"
                        disabled={leagueConfigurationsLoading}
                        onChange={(e) => handleActiveConfigChange(e.target.value)}
                        sx={{ fontSize: '0.875rem', pr: 5 }}
                    >
                        {leagueConfigurations.map((config) => (
                            <MenuItem key={config.name} value={config.name}>
                                {config.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Tooltip title="Capture Configuration Settings">
                    <IconButton
                        size="small"
                        onClick={handleSettingsClick}
                        sx={{
                            position: 'absolute',
                            right: 32,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 1,
                            p: 0.5
                        }}
                    >
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </>
    );
};

export default CaptureConfigDropdown;
