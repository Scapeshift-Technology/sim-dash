import React, { useState, useEffect } from "react";
import { 
    Typography, 
    Box, 
    Button, 
    Card, 
    CardContent, 
    Checkbox, 
    FormControlLabel, 
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

import { BetType, Period, ValidationConfig, MainMarketConfig, PeriodTypeCode, MarketType } from '@@/types/statCaptureConfig';

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

const getPeriodLabel = (period: Period): string => {
    if (period.PeriodTypeCode.trim() === 'M' && period.PeriodNumber === 0) {
        return 'Full Game';
    }
    return `${period.PeriodName} ${period.PeriodNumber}`;
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

    // ---------- Effects ----------

    useEffect(() => { // Reset form when props change (e.g., switching leagues)
        setSelectedBetTypes([]);
        setSelectedPeriods([]);
        setMinValue('');
        setMaxValue('');
    }, [betTypes, periods, validationConfig]);

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
        const updatedConfigurations = existingConfigurations.filter((_, i) => i !== index);
        onConfigurationChange(updatedConfigurations);
    };

    // ---------- Helper functions ----------

    const getBetTypeLabel = (value: string) => betTypes.find(bt => bt.value === value)?.label || value;

    function getPeriodId(period: Period): string {
        return `${period.PeriodTypeCode}-${period.PeriodNumber}`;
    }

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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {periods.map(period => (
                            <FormControlLabel
                                key={getPeriodId(period)}
                                control={
                                    <Checkbox
                                        checked={selectedPeriods.includes(getPeriodId(period))}
                                        onChange={() => handlePeriodChange(period)}
                                    />
                                }
                                label={getPeriodLabel(period)}
                            />
                        ))}
                    </Box>

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
            {existingConfigurations.length > 0 && (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Bet Type</TableCell>
                                <TableCell>Period</TableCell>
                                <TableCell>Line</TableCell>
                                <TableCell width={50}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {existingConfigurations.map((row, index) => (
                                <TableRow key={`${row.marketType}-${row.periodTypeCode}-${row.periodNumber}-${row.strike}-${index}`}>
                                    <TableCell>
                                        <Chip label={getBetTypeLabel(row.marketType)} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={getPeriodDisplayLabelFromId(row.periodTypeCode + '-' + row.periodNumber.toString())} variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell>{row.strike}</TableCell>
                                    <TableCell>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleRemoveRow(index)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {existingConfigurations.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                    No configurations added yet. Select bet types, periods, and enter a range to get started.
                </Typography>
            )}
        </Box>
    );
};

export default MainMarketsConfiguration;
