import React, { useState, useEffect, useMemo } from "react";
import { 
    Typography, 
    Box, 
    Button, 
    Card, 
    CardContent, 
    Checkbox, 
    FormControlLabel, 
    TextField,
    Alert,
    Collapse,
    Divider
} from "@mui/material";
import { Add as AddIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";

import { LeagueOUProps, PropOUConfig, ValidationConfig } from '@@/types/statCaptureConfig';

import ConfigurationTable, { ColumnConfig } from './ConfigurationTable';

// ---------- Types ----------

export interface OUPropsConfigurationProps {
    availableProps: LeagueOUProps[];
    existingConfigurations: PropOUConfig[];
    onConfigurationChange: (configurations: PropOUConfig[]) => void;
    leagueName: string;
    validationConfig: ValidationConfig;
}

// ---------- Helper functions ----------

const groupPropsByContestantType = (props: LeagueOUProps[]): Record<string, LeagueOUProps[]> => {
    return props.reduce((acc, prop) => {
        if (!acc[prop.ContestantType]) {
            acc[prop.ContestantType] = [];
        }
        acc[prop.ContestantType].push(prop);
        return acc;
    }, {} as Record<string, LeagueOUProps[]>);
};

const generateLines = (min: number, max: number, increment: number): number[] => {
    const lines: number[] = [];
    for (let i = min; i <= max; i += increment) {
        lines.push(Math.round(i / increment) * increment);
    }
    return lines;
};

// ---------- Main component ----------

const OUPropsConfiguration: React.FC<OUPropsConfigurationProps> = ({
    availableProps,
    existingConfigurations,
    onConfigurationChange,
    leagueName,
    validationConfig
}) => {

    // ---------- State ----------

    const [selectedProps, setSelectedProps] = useState<Set<string>>(new Set());
    const [expandedContestantTypes, setExpandedContestantTypes] = useState<Set<string>>(new Set());
    const [minValue, setMinValue] = useState<string>('');
    const [maxValue, setMaxValue] = useState<string>('');

    // ---------- Memoized data ----------

    const groupedProps = useMemo(() => groupPropsByContestantType(availableProps), [availableProps]);
    const contestantTypes = useMemo(() => Object.keys(groupedProps).sort(), [groupedProps]);

    const sortedConfigurations = useMemo(() => {
        return [...existingConfigurations].sort((a, b) => {
            // Sort by contestant type first
            const contestantTypeComparison = a.contestantType.localeCompare(b.contestantType);
            if (contestantTypeComparison !== 0) return contestantTypeComparison;

            // Then sort by prop name
            const propComparison = a.prop.localeCompare(b.prop);
            if (propComparison !== 0) return propComparison;

            // Finally sort by strike value
            return a.strike - b.strike;
        });
    }, [existingConfigurations]);

    // ---------- Effects ----------

    useEffect(() => { // Reset form when props change (e.g., switching leagues)
        setSelectedProps(new Set());
        setExpandedContestantTypes(new Set());
        setMinValue('');
        setMaxValue('');
    }, [availableProps]);

    // ---------- Helper functions ----------

    const getPropKey = (contestantType: string, prop: string): string => {
        return `${contestantType}::${prop}`;
    };

    const isConfigurationExists = (contestantType: string, prop: string, strike: number): boolean => {
        return existingConfigurations.some(config => 
            config.contestantType === contestantType && config.prop === prop && config.strike === strike
        );
    };

    const isValidValue = (value: string): boolean => {
        return validationConfig.validateValue(value) === null;
    };

    const isFormValid = (): boolean => {
        if (selectedProps.size === 0) return false;
        if (!isValidValue(minValue) || !isValidValue(maxValue)) return false;
        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);
        return max >= min;
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

        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);
        const generatedLines = generateLines(min, max, validationConfig.increment);

        const newConfigurations: PropOUConfig[] = [];
        
        selectedProps.forEach(propKey => {
            const [contestantType, prop] = propKey.split('::');
            generatedLines.forEach(strike => {
                if (!isConfigurationExists(contestantType, prop, strike)) {
                    newConfigurations.push({
                        contestantType,
                        prop,
                        strike
                    });
                }
            });
        });

        const updatedConfigurations = [...existingConfigurations, ...newConfigurations];
        onConfigurationChange(updatedConfigurations);
        
        // Reset form
        setSelectedProps(new Set());
        setMinValue('');
        setMaxValue('');
    };

    const handleRemoveRow = (index: number) => {
        const updatedConfigurations = existingConfigurations.filter((_, i) => i !== index);
        onConfigurationChange(updatedConfigurations);
    };

    const getValidationHelperText = (field: 'min' | 'max', value: string): string => {
        if (value === '') return '';
        
        const validationError = validationConfig.validateValue(value);
        if (validationError) return validationError;
        
        if (field === 'max' && minValue !== '' && parseFloat(value) < parseFloat(minValue)) {
            return 'Must be ≥ min value';
        }
        
        return '';
    };

    // ---------- Render ----------

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                {leagueName} Over/Under Props Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select which over/under prop bets to save and specify the strike value range when running {leagueName} simulations
            </Typography>

            {availableProps.length === 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    No over/under props available for {leagueName}. Props will be loaded from the league data.
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
                                                        
                                                        return (
                                                            <FormControlLabel
                                                                key={propData.Prop}
                                                                control={
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onChange={() => handlePropToggle(propKey)}
                                                                    />
                                                                }
                                                                label={propData.Prop}
                                                                sx={{ 
                                                                    '& .MuiFormControlLabel-label': {
                                                                        fontSize: '0.875rem'
                                                                    }
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

                            {/* Range Inputs */}
                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                                Strike Value Range
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <TextField
                                        label="Min Value"
                                        value={minValue}
                                        onChange={(e) => setMinValue(e.target.value)}
                                        type="number"
                                        slotProps={{
                                            htmlInput: {
                                                step: validationConfig.increment
                                            }
                                        }}
                                        error={minValue !== '' && !isValidValue(minValue)}
                                        sx={{ width: 120 }}
                                    />
                                    <Box sx={{ height: 40, mt: 0.5, width: 120 }}>
                                        <Typography 
                                            variant="caption" 
                                            color={minValue !== '' && !isValidValue(minValue) ? 'error' : 'transparent'}
                                            sx={{ 
                                                fontSize: '0.75rem', 
                                                lineHeight: 1.2,
                                                display: 'block',
                                                wordWrap: 'break-word',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {getValidationHelperText('min', minValue) || '\u00A0'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ 
                                    mt: '16px',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}>
                                    <Typography variant="body2">–</Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <TextField
                                        label="Max Value"
                                        value={maxValue}
                                        onChange={(e) => setMaxValue(e.target.value)}
                                        type="number"
                                        slotProps={{
                                            htmlInput: {
                                                step: validationConfig.increment
                                            }
                                        }}
                                        error={maxValue !== '' && (!isValidValue(maxValue) || (minValue !== '' && parseFloat(maxValue) < parseFloat(minValue)))}
                                        sx={{ width: 120 }}
                                    />
                                    <Box sx={{ height: 40, mt: 0.5, width: 120 }}>
                                        <Typography 
                                            variant="caption" 
                                            color={maxValue !== '' && (!isValidValue(maxValue) || (minValue !== '' && parseFloat(maxValue) < parseFloat(minValue))) ? 'error' : 'transparent'}
                                            sx={{ 
                                                fontSize: '0.75rem', 
                                                lineHeight: 1.2,
                                                display: 'block',
                                                wordWrap: 'break-word',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {getValidationHelperText('max', maxValue) || '\u00A0'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 1 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={handleAddConfigurations}
                                        disabled={!isFormValid()}
                                    >
                                        Add Selected Props & Strikes
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Results Table */}
                    <ConfigurationTable
                        configurations={sortedConfigurations}
                        columns={[
                            {
                                header: 'Contestant Type',
                                accessor: (row: PropOUConfig) => row.contestantType,
                                displayType: 'chip'
                            },
                            {
                                header: 'Prop',
                                accessor: (row: PropOUConfig) => row.prop,
                                displayType: 'chip-outlined'
                            },
                            {
                                header: 'Strike',
                                accessor: (row: PropOUConfig) => row.strike,
                                displayType: 'text'
                            }
                        ] as ColumnConfig<PropOUConfig>[]}
                        onRemoveRow={handleRemoveRow}
                        emptyMessage="No props configured yet. Select props and enter a strike value range to get started."
                        getRowKey={(row: PropOUConfig, index: number) => `${row.contestantType}-${row.prop}-${row.strike}-${index}`}
                    />
                </>
            )}
        </Box>
    );
};

export default OUPropsConfiguration; 