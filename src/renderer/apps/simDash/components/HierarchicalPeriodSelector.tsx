import React, { useState } from "react";
import { 
    Typography, 
    Box, 
    Button, 
    Checkbox, 
    FormControlLabel, 
    Collapse,
    Divider
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";

import { Period } from '@@/types/statCaptureConfig';

// ---------- Types ----------

export interface HierarchyConfig {
    superPeriodTypeField: keyof Period;
    superPeriodNumberField: keyof Period;
    getSuperPeriodTypeLabel: (value: any) => string;
    getSuperPeriodNumberLabel: (superPeriodType: any, superPeriodNumber: any) => string;
}

export interface HierarchicalPeriodSelectorProps {
    periods: Period[];
    selectedPeriods: string[];
    onPeriodChange: (period: Period) => void;
    getPeriodId: (period: Period) => string;
    getPeriodLabel: (period: Period) => string;
    hierarchyConfig: HierarchyConfig;
}

// ---------- Main component ----------

const HierarchicalPeriodSelector: React.FC<HierarchicalPeriodSelectorProps> = ({
    periods,
    selectedPeriods,
    onPeriodChange,
    getPeriodId,
    getPeriodLabel,
    hierarchyConfig
}) => {

    // ---------- State ----------

    const [expandedSuperPeriods, setExpandedSuperPeriods] = useState<Set<string>>(new Set());
    const [expandedSuperPeriodNumbers, setExpandedSuperPeriodNumbers] = useState<Set<string>>(new Set());
    const [showMoreSections, setShowMoreSections] = useState<Set<string>>(new Set());

    // ---------- Helper functions ----------

    const groupPeriodsByHierarchy = () => {
        const grouped: { [superPeriodType: string]: { [superPeriodNumber: string]: Period[] } } = {};
        
        periods.forEach(period => {
            const superPeriodType = String(period[hierarchyConfig.superPeriodTypeField]);
            const superPeriodNumber = String(period[hierarchyConfig.superPeriodNumberField]);
            
            if (!grouped[superPeriodType]) {
                grouped[superPeriodType] = {};
            }
            if (!grouped[superPeriodType][superPeriodNumber]) {
                grouped[superPeriodType][superPeriodNumber] = [];
            }
            grouped[superPeriodType][superPeriodNumber].push(period);
        });
        
        return grouped;
    };

    const toggleSuperPeriodExpansion = (superPeriodType: string) => {
        setExpandedSuperPeriods(prev => {
            const next = new Set(prev);
            if (next.has(superPeriodType)) {
                next.delete(superPeriodType);
            } else {
                next.add(superPeriodType);
            }
            return next;
        });
    };

    const toggleSuperPeriodNumberExpansion = (key: string) => {
        setExpandedSuperPeriodNumbers(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleShowMore = (sectionKey: string) => {
        setShowMoreSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionKey)) {
                next.delete(sectionKey);
            } else {
                next.add(sectionKey);
            }
            return next;
        });
    };

    // ---------- Render functions ----------

    const renderPeriodsWithShowMore = (periodsInGroup: Period[], sectionKey: string) => {
        const showingMore = showMoreSections.has(sectionKey);
        const displayedPeriods = showingMore ? periodsInGroup : periodsInGroup.slice(0, 5);
        const hasMoreItems = periodsInGroup.length > 5;
        
        return (
            <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {displayedPeriods.map(period => (
                        <FormControlLabel
                            key={getPeriodId(period)}
                            control={
                                <Checkbox
                                    checked={selectedPeriods.includes(getPeriodId(period))}
                                    onChange={() => onPeriodChange(period)}
                                />
                            }
                            label={getPeriodLabel(period)}
                        />
                    ))}
                </Box>
                {hasMoreItems && (
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => toggleShowMore(sectionKey)}
                        sx={{ mt: 1, textTransform: 'none' }}
                    >
                        {showingMore ? `Show less` : `Show ${periodsInGroup.length - 5} more`}
                    </Button>
                )}
            </>
        );
    };

    const renderSuperPeriodNumbersWithShowMore = (superPeriodNumbers: { [superPeriodNumber: string]: Period[] }, superPeriodType: string) => {
        const entries = Object.entries(superPeriodNumbers);
        const sectionKey = `superPeriodNumbers-${superPeriodType}`;
        const showingMore = showMoreSections.has(sectionKey);
        const displayedEntries = showingMore ? entries : entries.slice(0, 5);
        const hasMoreItems = entries.length > 5;
        
        return (
            <>
                {displayedEntries.map(([superPeriodNumber, periodsInGroup]) => {
                    const groupKey = `${superPeriodType}-${superPeriodNumber}`;
                    const isGroupExpanded = expandedSuperPeriodNumbers.has(groupKey);
                    const periodsSectionKey = `periods-${groupKey}`;
                    
                    return (
                        <Box key={superPeriodNumber} sx={{ mb: 1 }}>
                            {/* SuperPeriodNumber Header */}
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    cursor: 'pointer',
                                    py: 0.5,
                                    '&:hover': { backgroundColor: 'action.hover' },
                                    borderRadius: 1
                                }}
                                onClick={() => toggleSuperPeriodNumberExpansion(groupKey)}
                            >
                                {isGroupExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                                    {hierarchyConfig.getSuperPeriodNumberLabel(superPeriodType, superPeriodNumber)}
                                </Typography>
                            </Box>

                            {/* Individual Periods */}
                            <Collapse in={isGroupExpanded}>
                                <Box sx={{ ml: 3, mt: 1 }}>
                                    {renderPeriodsWithShowMore(periodsInGroup, periodsSectionKey)}
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
                {hasMoreItems && (
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => toggleShowMore(sectionKey)}
                        sx={{ mt: 1, textTransform: 'none' }}
                    >
                        {showingMore ? `Show less` : `Show ${entries.length - 5} more`}
                    </Button>
                )}
            </>
        );
    };

    // ---------- Render ----------

    return (
        <Box sx={{ mb: 3 }}>
            {Object.entries(groupPeriodsByHierarchy()).map(([superPeriodType, superPeriodNumbers]) => {
                const isExpanded = expandedSuperPeriods.has(superPeriodType);
                const superPeriodNumberKeys = Object.keys(superPeriodNumbers);
                const hasSingleSuperPeriodNumber = superPeriodNumberKeys.length === 1;
                
                return (
                    <Box key={superPeriodType} sx={{ mb: 2 }}>
                        {/* SuperPeriodType Header */}
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                py: 1,
                                '&:hover': { backgroundColor: 'action.hover' },
                                borderRadius: 1
                            }}
                            onClick={() => toggleSuperPeriodExpansion(superPeriodType)}
                        >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'medium' }}>
                                {hierarchyConfig.getSuperPeriodTypeLabel(superPeriodType)}
                            </Typography>
                        </Box>

                        {/* SuperPeriodNumber Groups */}
                        <Collapse in={isExpanded}>
                            <Box sx={{ ml: 3, mt: 1 }}>
                                {Object.entries(superPeriodNumbers).map(([superPeriodNumber, periodsInGroup]) => {
                                    const groupKey = `${superPeriodType}-${superPeriodNumber}`;
                                    const periodsSectionKey = `periods-${groupKey}`;
                                    
                                    // If this SuperPeriodType has only one SuperPeriodNumber, skip the grouping
                                    if (hasSingleSuperPeriodNumber) {
                                        return (
                                            <Box key={superPeriodNumber}>
                                                {renderPeriodsWithShowMore(periodsInGroup, periodsSectionKey)}
                                            </Box>
                                        );
                                    }
                                    
                                    // Multiple SuperPeriodNumbers - show grouping but handle show more at this level
                                    return null; // This will be handled by renderSuperPeriodNumbersWithShowMore
                                })}
                                
                                {/* Handle multiple SuperPeriodNumbers with show more */}
                                {!hasSingleSuperPeriodNumber && renderSuperPeriodNumbersWithShowMore(superPeriodNumbers, superPeriodType)}
                            </Box>
                        </Collapse>
                        
                        {/* Divider between SuperPeriodTypes */}
                        {Object.keys(groupPeriodsByHierarchy()).indexOf(superPeriodType) < Object.keys(groupPeriodsByHierarchy()).length - 1 && (
                            <Divider sx={{ mt: 1 }} />
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

export default HierarchicalPeriodSelector; 