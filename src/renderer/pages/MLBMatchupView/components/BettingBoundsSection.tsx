import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Collapse,
    Divider,
    Button,
    CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { MLBGameContainer, MLBGameSimInputs } from "@/types/simInputs";
import { MarketLinesMLB, MatchupLineups } from '@@/types/mlb';
import { useDispatch, useSelector } from 'react-redux';
import { updateMLBMarketLines, selectGameAutomatedLeans, updateMLBAutomatedLeans } from '@/store/slices/simInputsSlice';
import { AppDispatch, RootState } from '@/store/store';
import { findLeansThunk, selectFindLeansStatus, selectFindLeansError } from '@/store/slices/simulationStatusSlice';
import { selectBettingBoundsValues, selectBettingBoundsErrors, setBettingBounds } from '@/store/slices/bettingBoundsSlice';

interface BettingBoundsSectionProps {
    awayTeamName: string;
    homeTeamName: string;
    gameContainer: MLBGameContainer | undefined;
    matchId: number;
    onUpdateTeamLean: (teamType: 'home' | 'away', leanType: 'offense' | 'defense', value: number) => void;
    onUpdatePlayerLean: (teamType: 'home' | 'away', playerType: 'hitter' | 'pitcher', playerId: number, value: number) => void;
}

const BettingBoundsSection: React.FC<BettingBoundsSectionProps> = ({
    awayTeamName,
    homeTeamName,
    gameContainer,
    matchId,
    onUpdateTeamLean,
    onUpdatePlayerLean
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const automatedLeans = useSelector((state: RootState) => selectGameAutomatedLeans(state, 'MLB', matchId));
    const findLeansStatus = useSelector((state: RootState) => selectFindLeansStatus(state, 'MLB', matchId));
    const findLeansError = useSelector((state: RootState) => selectFindLeansError(state, 'MLB', matchId));
    const bounds = useSelector((state: RootState) => selectBettingBoundsValues(state, 'MLB', matchId)) || {
        awayML: '',
        homeML: '',
        totalLine: '',
        overOdds: '',
        underOdds: ''
    };
    const errors = useSelector((state: RootState) => selectBettingBoundsErrors(state, 'MLB', matchId)) || {
        awayML: null,
        homeML: null,
        totalLine: null,
        overOdds: null,
        underOdds: null
    };
    
    const [isExpanded, setIsExpanded] = useState(true);

    // ---------- Handlers ----------

    const handleBoundsChange = (value: string, field: keyof typeof bounds) => {
        dispatch(setBettingBounds({
            league: 'MLB',
            matchId,
            bettingBounds: {
                values: { ...bounds, [field]: value },
                errors
            }
        }));
    };

    const handleErrorChange = (error: string | null, field: keyof typeof errors) => {
        dispatch(setBettingBounds({
            league: 'MLB',
            matchId,
            bettingBounds: {
                values: bounds,
                errors: { ...errors, [field]: error }
            }
        }));
    };

    const validateAndParseInput = (value: string, fieldName: keyof typeof bounds): number | null => {
        const trimmed = value.trim();
        
        if (!trimmed) {
            handleErrorChange('This field is required', fieldName);
            return null;
        }

        const numericValue = trimmed.startsWith('+') 
            ? parseFloat(trimmed.substring(1))
            : parseFloat(trimmed);

        if (isNaN(numericValue)) {
            handleErrorChange('Invalid number format', fieldName);
            return null;
        } else if (numericValue < 100 && numericValue > -100 && fieldName !== 'totalLine') {
            handleErrorChange('Odds must be between -100 and 100', fieldName);
            return null;
        }

        handleErrorChange(null, fieldName);
        return trimmed.startsWith('+') ? numericValue : parseFloat(trimmed);
    };

    const handleFindLeans = async () => {
        // Reset all errors
        const errorFields = ['awayML', 'homeML', 'totalLine', 'overOdds', 'underOdds'] as const;
        errorFields.forEach(field => handleErrorChange(null, field));

        // Validate all inputs
        const parsedValues = {
            awayML: validateAndParseInput(bounds.awayML, 'awayML'),
            homeML: validateAndParseInput(bounds.homeML, 'homeML'),
            totalLine: validateAndParseInput(bounds.totalLine, 'totalLine'),
            overOdds: validateAndParseInput(bounds.overOdds, 'overOdds'),
            underOdds: validateAndParseInput(bounds.underOdds, 'underOdds')
        };

        // Check if any validation failed
        if (Object.values(parsedValues).some(value => value === null)) {
            return; // Stop if any validation failed
        }

        const marketLines: MarketLinesMLB = {
            awayML: parsedValues.awayML!,
            homeML: parsedValues.homeML!,
            over: {
                line: parsedValues.totalLine!,
                odds: parsedValues.overOdds!
            },
            under: {
                line: parsedValues.totalLine!,
                odds: parsedValues.underOdds!
            }
        };

        dispatch(updateMLBMarketLines({
            league: 'MLB',
            matchId,
            marketLines: marketLines
        }));

        const optimalLeansResult = await dispatch(findLeansThunk({
            league: 'MLB',
            matchId,
            lineups: gameContainer?.currentGame?.lineups as MatchupLineups,
            marketLines: marketLines
        })).unwrap();

        dispatch(updateMLBAutomatedLeans({
            league: 'MLB',
            matchId,
            automatedLeans: optimalLeansResult
        }));
    };

    const handleApplyLeans = () => {
        if (!automatedLeans) return;

        onUpdateTeamLean('away', 'offense', automatedLeans.away.teamHitterLean);
        onUpdateTeamLean('away', 'defense', automatedLeans.away.teamPitcherLean);
        onUpdateTeamLean('home', 'offense', automatedLeans.home.teamHitterLean);
        onUpdateTeamLean('home', 'defense', automatedLeans.home.teamPitcherLean);
    };

    // ---------- Render ----------

    return (
        <Paper 
            sx={{ 
                width: '100%',
                mb: 2,
                p: 2
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Find Leans
                </Typography>
                <IconButton onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            <Collapse in={isExpanded}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Moneyline Section */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary' }}>
                            Moneyline
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                label={`${awayTeamName}`}
                                variant="outlined"
                                size="small"
                                placeholder="e.g. +150"
                                value={bounds.awayML}
                                onChange={(e) => handleBoundsChange(e.target.value, 'awayML')}
                                error={!!errors.awayML}
                                helperText={errors.awayML}
                                sx={{ flex: 1, minWidth: '250px' }}
                            />
                            <TextField
                                label={`${homeTeamName}`}
                                variant="outlined"
                                size="small"
                                placeholder="e.g. -170"
                                value={bounds.homeML}
                                onChange={(e) => handleBoundsChange(e.target.value, 'homeML')}
                                error={!!errors.homeML}
                                helperText={errors.homeML}
                                sx={{ flex: 1, minWidth: '250px' }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Totals Section */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary' }}>
                            Totals
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Total Line"
                                variant="outlined"
                                size="small"
                                placeholder="e.g. 7.5"
                                value={bounds.totalLine}
                                onChange={(e) => handleBoundsChange(e.target.value, 'totalLine')}
                                error={!!errors.totalLine}
                                helperText={errors.totalLine}
                                sx={{ flex: 1 }}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Under Odds"
                                    variant="outlined"
                                    size="small"
                                    placeholder="e.g. -110"
                                    value={bounds.underOdds}
                                    onChange={(e) => handleBoundsChange(e.target.value, 'underOdds')}
                                    error={!!errors.underOdds}
                                    helperText={errors.underOdds}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Over Odds"
                                    variant="outlined"
                                    size="small"
                                    placeholder="e.g. +105"
                                    value={bounds.overOdds}
                                    onChange={(e) => handleBoundsChange(e.target.value, 'overOdds')}
                                    error={!!errors.overOdds}
                                    helperText={errors.overOdds}
                                    sx={{ flex: 1 }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Action Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {findLeansError && (
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                {findLeansError}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                onClick={handleFindLeans}
                                disabled={findLeansStatus === 'loading'}
                                startIcon={findLeansStatus === 'loading' ? <CircularProgress size={20} /> : null}
                            >
                                {findLeansStatus === 'loading' ? 'Finding Optimal Leans...' : 'Find Optimal Leans'}
                            </Button>
                            {automatedLeans && !findLeansError && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handleApplyLeans}
                                >
                                    Apply Leans
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Results Section */}
                    {automatedLeans && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary' }}>
                                Found Leans
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {/* Away Team Leans */}
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        {awayTeamName}
                                    </Typography>
                                    <Box sx={{ pl: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Hitter Lean: {Math.round(automatedLeans.away.teamHitterLean * 100) / 100}%
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Pitcher Lean: {Math.round(automatedLeans.away.teamPitcherLean * 100) / 100}%
                                        </Typography>
                                    </Box>
                                </Box>
                                {/* Home Team Leans */}
                                <Box sx={{ flex: '1 1 300px' }}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        {homeTeamName}
                                    </Typography>
                                    <Box sx={{ pl: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Hitter Lean: {Math.round(automatedLeans.home.teamHitterLean * 100) / 100}%
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Pitcher Lean: {Math.round(automatedLeans.home.teamPitcherLean * 100) / 100}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default BettingBoundsSection; 