import React, { useState, useEffect, useMemo } from "react";
import { 
    Typography, 
    Box, 
    Button, 
    Card, 
    CardContent, 
    Checkbox, 
    FormControlLabel, 
    TextField
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

import { getPeriodLabel } from "@@/services/statCaptureConfig/utils";

import { BetType, Period, ValidationConfig, MainMarketConfig, PeriodTypeCode, MarketType } from '@@/types/statCaptureConfig';

import HierarchicalPeriodSelector, { HierarchyConfig } from './HierarchicalPeriodSelector';
import ConfigurationTable, { ColumnConfig } from './ConfigurationTable';

// ---------- Types ----------

export interface MainMarketsConfigurationProps {
    betTypes: BetType[];
    periods: Period[];
    validationConfig: ValidationConfig;
    existingConfigurations: MainMarketConfig[];
    onConfigurationChange: (configurations: MainMarketConfig[]) => void;
    leagueName: string;
}

// ---------- Helper functions ----------

const generateLines = (min: number, max: number, increment: number): number[] => {
    const lines: number[] = [];
    for (let i = min; i <= max; i += increment) {
        lines.push(Math.round(i / increment) * increment); // Round to avoid floating point issues
    }
    return lines;
};

function getPeriodId(period: Period): string {
    return `${period.PeriodTypeCode}-${period.PeriodNumber}`;
}

// ---------- Main component ----------

const MainMarketsConfiguration: React.FC<MainMarketsConfigurationProps> = ({
    betTypes,
    periods,
    validationConfig,
    existingConfigurations,
    onConfigurationChange,
    leagueName
}) => {

    // ---------- State ----------

    const [selectedBetTypes, setSelectedBetTypes] = useState<string[]>([]);
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
    const [minValue, setMinValue] = useState<string>('');
    const [maxValue, setMaxValue] = useState<string>('');

    // ---------- Sorted configurations ----------

    const sortedConfigurations = useMemo(() => {
        return [...existingConfigurations].sort((a, b) => {
            // Sort by market type
            const marketTypeComparison = a.marketType.localeCompare(b.marketType);
            if (marketTypeComparison !== 0) return marketTypeComparison;

            // Then sort by period type code - 'M' first, then alphabetically
            if (a.periodTypeCode === 'M' && b.periodTypeCode !== 'M') return -1;
            if (a.periodTypeCode !== 'M' && b.periodTypeCode === 'M') return 1;
            const periodTypeComparison = a.periodTypeCode.localeCompare(b.periodTypeCode);
            if (periodTypeComparison !== 0) return periodTypeComparison;

            // Then sort by period number
            const periodNumberComparison = a.periodNumber - b.periodNumber;
            if (periodNumberComparison !== 0) return periodNumberComparison;

            // Finally sort by line/strike
            const strikeA = parseFloat(a.strike);
            const strikeB = parseFloat(b.strike);
            return strikeA - strikeB;
        });
    }, [existingConfigurations]);

    // ---------- Effects ----------

    useEffect(() => { // Reset form when props change (e.g., switching leagues)
        setSelectedBetTypes([]);
        setSelectedPeriods([]);
        setMinValue('');
        setMaxValue('');
    }, [betTypes, periods, validationConfig]);

    // ---------- Hierarchy Configuration ----------

    const hierarchyConfig: HierarchyConfig = {
        superPeriodTypeField: 'SuperPeriodType',
        superPeriodNumberField: 'SuperPeriodNumber', 
        getSuperPeriodTypeLabel: (value: string) => value,
        getSuperPeriodNumberLabel: (superPeriodType: string, superPeriodNumber: string) => `${superPeriodType} ${superPeriodNumber}`
    };

    // ---------- Validation functions ----------

    const isValidValue = (value: string): boolean => {
        return validationConfig.validateValue(value) === null;
    };

    const isFormValid = (): boolean => {
        if (selectedBetTypes.length === 0 || selectedPeriods.length === 0) return false;
        if (!isValidValue(minValue) || !isValidValue(maxValue)) return false;
        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);
        return max >= min;
    };

    // ---------- Event handlers ----------

    const handleBetTypeChange = (betType: string) => {
        setSelectedBetTypes(prev =>
            prev.includes(betType)
                ? prev.filter(bt => bt !== betType)
                : [...prev, betType]
        );
    };

    const handlePeriodChange = (period: Period) => {
        const periodId = getPeriodId(period);
        setSelectedPeriods(prev =>
            prev.includes(periodId)
                ? prev.filter(p => p !== periodId)
                : [...prev, periodId]
        );
    };

    const handleAddConfiguration = () => {
        if (!isFormValid()) return;

        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);
        const generatedLines = generateLines(min, max, validationConfig.increment);

        // Create table rows for each combination of betType x period x line
        const newRows: MainMarketConfig[] = [];
        selectedBetTypes.forEach(betType => {
            selectedPeriods.forEach(periodId => {
                const [periodTypeCode, periodNumber] = periodId.split('-');
                generatedLines.forEach(line => {
                    newRows.push({
                        marketType: betType as MarketType,
                        periodTypeCode: periodTypeCode as PeriodTypeCode,
                        periodNumber: parseInt(periodNumber),
                        strike: line.toString()
                    });
                });
            });
        });

        const updatedConfigurations = [...existingConfigurations, ...newRows];
        onConfigurationChange(updatedConfigurations);
        
        // Reset form
        setSelectedBetTypes([]);
        setSelectedPeriods([]);
        setMinValue('');
        setMaxValue('');
    };

    const handleRemoveRow = (index: number) => {
        const configToRemove = sortedConfigurations[index];
        const originalIndex = existingConfigurations.findIndex(config => 
            config.marketType === configToRemove.marketType &&
            config.periodTypeCode === configToRemove.periodTypeCode &&
            config.periodNumber === configToRemove.periodNumber &&
            config.strike === configToRemove.strike
        );
        
        if (originalIndex !== -1) {
            const updatedConfigurations = existingConfigurations.filter((_, i) => i !== originalIndex);
            onConfigurationChange(updatedConfigurations);
        }
    };

    // ---------- Helper functions ----------

    const getBetTypeLabel = (value: string) => betTypes.find(bt => bt.value === value)?.label || value;

    const getPeriodDisplayLabelFromId = (periodId: string): string => {
        const [typeCode, numberStr] = periodId.split('-');
        const periodNumber = parseInt(numberStr);
        
        if (typeCode === 'M' && periodNumber === 0) {
            return 'Full Game';
        }
        
        const period = periods.find(p => p.PeriodTypeCode === typeCode && p.PeriodNumber === periodNumber);
        return period ? getPeriodLabel(period) : periodId;
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
                {leagueName} Main Markets Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure which main betting markets to save when running {leagueName} simulations
            </Typography>

            {/* Configuration Form */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    {/* Bet Types */}
                    <Typography variant="subtitle1" gutterBottom>
                        Bet Types
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {betTypes.map(type => (
                            <FormControlLabel
                                key={type.value}
                                control={
                                    <Checkbox
                                        checked={selectedBetTypes.includes(type.value)}
                                        onChange={() => handleBetTypeChange(type.value)}
                                    />
                                }
                                label={type.label}
                            />
                        ))}
                    </Box>

                    {/* Periods */}
                    <Typography variant="subtitle1" gutterBottom>
                        Periods
                    </Typography>
                    <HierarchicalPeriodSelector
                        periods={periods}
                        selectedPeriods={selectedPeriods}
                        onPeriodChange={handlePeriodChange}
                        getPeriodId={getPeriodId}
                        getPeriodLabel={getPeriodLabel}
                        hierarchyConfig={hierarchyConfig}
                    />

                    {/* Range Inputs */}
                    <Typography variant="subtitle1" gutterBottom>
                        Line Range
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
                            <Box sx={{ height: 20, mt: 0.5 }}>
                                <Typography 
                                    variant="caption" 
                                    color={minValue !== '' && !isValidValue(minValue) ? 'error' : 'transparent'}
                                    sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
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
                            <Box sx={{ height: 20, mt: 0.5 }}>
                                <Typography 
                                    variant="caption" 
                                    color={maxValue !== '' && (!isValidValue(maxValue) || (minValue !== '' && parseFloat(maxValue) < parseFloat(minValue))) ? 'error' : 'transparent'}
                                    sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                                >
                                    {getValidationHelperText('max', maxValue) || '\u00A0'}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddConfiguration}
                                disabled={!isFormValid()}
                            >
                                Add
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
                        header: 'Bet Type',
                        accessor: (row: MainMarketConfig) => row.marketType,
                        displayType: 'chip',
                        formatter: (value: string | number) => getBetTypeLabel(value.toString())
                    },
                    {
                        header: 'Period',
                        accessor: (row: MainMarketConfig) => `${row.periodTypeCode}-${row.periodNumber}`,
                        displayType: 'chip-outlined',
                        formatter: (value: string | number) => getPeriodDisplayLabelFromId(value.toString())
                    },
                    {
                        header: 'Line',
                        accessor: (row: MainMarketConfig) => row.strike,
                        displayType: 'text'
                    }
                ] as ColumnConfig<MainMarketConfig>[]}
                onRemoveRow={handleRemoveRow}
                emptyMessage="No configurations added yet. Select bet types, periods, and enter a range to get started."
                getRowKey={(row: MainMarketConfig, index: number) => `${row.marketType}-${row.periodTypeCode}-${row.periodNumber}-${row.strike}-${index}`}
            />
        </Box>
    );
};

export default MainMarketsConfiguration;
