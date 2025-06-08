import React, { useState, useEffect, useMemo } from "react";
import { 
    Typography, 
    Box, 
    Button, 
    Card, 
    CardContent, 
    Checkbox, 
    FormControlLabel, 
    Alert,
    Collapse,
    Divider
} from "@mui/material";
import { Add as AddIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";

import { PropYNConfig, LeagueYNProps, YNContestantType, YNProp } from '@@/types/statCaptureConfig';

import ConfigurationTable, { ColumnConfig } from './ConfigurationTable';

// ---------- Types ----------

export interface YNPropsConfigurationProps {
    availableProps: LeagueYNProps[];
    existingConfigurations: PropYNConfig[];
    onConfigurationChange: (configurations: PropYNConfig[]) => void;
    leagueName: string;
}

// ---------- Helper functions ----------

const groupPropsByContestantType = (props: LeagueYNProps[]): Record<string, LeagueYNProps[]> => {
    return props.reduce((acc, prop) => {
        if (!acc[prop.ContestantType]) {
            acc[prop.ContestantType] = [];
        }
        acc[prop.ContestantType].push(prop);
        return acc;
    }, {} as Record<string, LeagueYNProps[]>);
};

// ---------- Main component ----------

const YNPropsConfiguration: React.FC<YNPropsConfigurationProps> = ({
    availableProps,
    existingConfigurations,
    onConfigurationChange,
    leagueName
}) => {

    // ---------- State ----------

    const [selectedProps, setSelectedProps] = useState<Set<string>>(new Set());
    const [expandedContestantTypes, setExpandedContestantTypes] = useState<Set<string>>(new Set());

    // ---------- Memoized data ----------

    const groupedProps = useMemo(() => groupPropsByContestantType(availableProps), [availableProps]);
    const contestantTypes = useMemo(() => Object.keys(groupedProps).sort(), [groupedProps]);

    const sortedConfigurations = useMemo(() => {
        return [...existingConfigurations].sort((a, b) => {
            // Sort by contestant type first
            const contestantTypeComparison = a.contestantType.localeCompare(b.contestantType);
            if (contestantTypeComparison !== 0) return contestantTypeComparison;

            // Then sort by prop name
            return a.prop.localeCompare(b.prop);
        });
    }, [existingConfigurations]);

    // ---------- Effects ----------

    useEffect(() => { // Reset form when props change (e.g., switching leagues)
        setSelectedProps(new Set());
        setExpandedContestantTypes(new Set());
    }, [availableProps]);

    // ---------- Helper functions ----------

    const getPropKey = (contestantType: string, prop: string): string => {
        return `${contestantType}::${prop}`;
    };

    const isConfigurationExists = (contestantType: string, prop: string): boolean => {
        return existingConfigurations.some(config => 
            config.contestantType === contestantType && config.prop === prop
        );
    };

    const isFormValid = (): boolean => {
        return selectedProps.size > 0;
    };

    const toggleContestantTypeExpansion = (contestantType: string) => {
        setExpandedContestantTypes(prev => {
            const next = new Set(prev);
            if (next.has(contestantType)) {
                next.delete(contestantType);
            } else {
                next.add(contestantType);
            }
            return next;
        });
    };

    // ---------- Event handlers ----------

    const handlePropToggle = (propKey: string) => {
        setSelectedProps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(propKey)) {
                newSet.delete(propKey);
            } else {
                newSet.add(propKey);
            }
            return newSet;
        });
    };

    const handleAddConfigurations = () => {
        if (!isFormValid()) return;

        const newConfigurations: PropYNConfig[] = [];
        
        selectedProps.forEach(propKey => {
            const [contestantType, prop] = propKey.split('::');
            if (!isConfigurationExists(contestantType, prop)) {
                const newConfig = {
                    contestantType: contestantType as YNContestantType,
                    prop: prop as YNProp
                };
                newConfigurations.push(newConfig);
            }
        });

        const updatedConfigurations = [...existingConfigurations, ...newConfigurations];
        onConfigurationChange(updatedConfigurations);
        
        // Reset form
        setSelectedProps(new Set());
    };

    const handleRemoveRow = (index: number) => {
        const updatedConfigurations = existingConfigurations.filter((_, i) => i !== index);
        onConfigurationChange(updatedConfigurations);
    };

    // ---------- Render ----------

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                {leagueName} Yes/No Props Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select which yes/no proposition bets to save when running {leagueName} simulations
            </Typography>

            {availableProps.length === 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    No yes/no props available for {leagueName}. Props will be loaded from the league data.
                </Alert>
            )}

            {availableProps.length > 0 && (
                <>
                    {/* Configuration Form */}
                    <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Available Props
                            </Typography>
                            
                            {/* Hierarchical structure: Contestant Type > Props */}
                            {contestantTypes.map(contestantType => {
                                const propsForType = groupedProps[contestantType] || [];
                                const isContestantTypeExpanded = expandedContestantTypes.has(contestantType);
                                
                                return (
                                    <Box key={contestantType} sx={{ mb: 2 }}>
                                        {/* Contestant Type Header */}
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                cursor: 'pointer',
                                                py: 1,
                                                '&:hover': { backgroundColor: 'action.hover' },
                                                borderRadius: 1
                                            }}
                                            onClick={() => toggleContestantTypeExpansion(contestantType)}
                                        >
                                            {isContestantTypeExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'medium' }}>
                                                {contestantType}
                                            </Typography>
                                        </Box>

                                        {/* Props */}
                                        <Collapse in={isContestantTypeExpanded}>
                                            <Box sx={{ ml: 3, mt: 1 }}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {propsForType.map(propData => {
                                                        const propKey = getPropKey(contestantType, propData.Prop);
                                                        const isSelected = selectedProps.has(propKey);
                                                        const isAlreadyConfigured = isConfigurationExists(contestantType, propData.Prop);
                                                        
                                                        return (
                                                            <FormControlLabel
                                                                key={propData.Prop}
                                                                control={
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onChange={() => handlePropToggle(propKey)}
                                                                        disabled={isAlreadyConfigured}
                                                                    />
                                                                }
                                                                label={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <span>{propData.Prop}</span>
                                                                    </Box>
                                                                }
                                                                sx={{ 
                                                                    '& .MuiFormControlLabel-label': {
                                                                        fontSize: '0.875rem'
                                                                    },
                                                                    opacity: isAlreadyConfigured ? 0.6 : 1
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        </Collapse>
                                        
                                        {/* Divider between contestant types */}
                                        {contestantTypes.indexOf(contestantType) < contestantTypes.length - 1 && (
                                            <Divider sx={{ mt: 1 }} />
                                        )}
                                    </Box>
                                );
                            })}

                            {/* Add Button */}
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddConfigurations}
                                    disabled={!isFormValid()}
                                >
                                    Add Selected Props
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Results Table */}
                    <ConfigurationTable
                        configurations={sortedConfigurations}
                        columns={[
                            {
                                header: 'Contestant Type',
                                accessor: (row: PropYNConfig) => row.contestantType,
                                displayType: 'chip'
                            },
                            {
                                header: 'Prop',
                                accessor: (row: PropYNConfig) => row.prop,
                                displayType: 'chip-outlined'
                            }
                        ] as ColumnConfig<PropYNConfig>[]}
                        onRemoveRow={handleRemoveRow}
                        emptyMessage="No props configured yet. Select props above to get started."
                        getRowKey={(row: PropYNConfig, index: number) => `${row.contestantType}-${row.prop}-${index}`}
                    />
                </>
            )}
        </Box>
    );
};

export default YNPropsConfiguration; 