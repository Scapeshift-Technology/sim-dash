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
import { findOptimalLeans } from '@/pages/MLBMatchupView/functions/optimalLeans';
import { MarketLinesMLB, MatchupLineups } from '@@/types/mlb';
import { useDispatch, useSelector } from 'react-redux';
import { updateMLBMarketLines, updateMLBAutomatedLeans, selectGameAutomatedLeans } from '@/store/slices/simInputsSlice';
import { AppDispatch, RootState } from '@/store/store';

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
    
    // ---------- State ----------
    
    const [isExpanded, setIsExpanded] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [processError, setProcessError] = useState<string>('');

    const [awayMoneyline, setAwayMoneyline] = useState('');
    const [homeMoneyline, setHomeMoneyline] = useState('');
    const [totalLine, setTotalLine] = useState('');
    const [overOdds, setOverOdds] = useState('');
    const [underOdds, setUnderOdds] = useState('');

    const [errors, setErrors] = useState({
        awayMoneyline: '',
        homeMoneyline: '',
        totalLine: '',
        overOdds: '',
        underOdds: ''
    });

    // ---------- Handlers ----------

    const validateAndParseInput = (value: string, fieldName: string): number | null => {
        // Remove any spaces
        const trimmed = value.trim();
        
        if (!trimmed) {
            setErrors(prev => ({ ...prev, [fieldName]: 'This field is required' }));
            return null;
        }

        // Handle american odds format (+150, -110) and regular numbers
        const numericValue = trimmed.startsWith('+') 
            ? parseFloat(trimmed.substring(1))
            : parseFloat(trimmed);

        if (isNaN(numericValue)) {
            setErrors(prev => ({ ...prev, [fieldName]: 'Invalid number format' }));
            return null;
        } else if (numericValue < 100 && numericValue > -100 && fieldName !== 'totalLine') {
            setErrors(prev => ({ ...prev, [fieldName]: 'Odds must be between -100 and 100' }));
            return null;
        }

        // Clear error if validation passes
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
        return trimmed.startsWith('+') ? numericValue : parseFloat(trimmed);
    };

    const handleFindLeans = async () => {
        // Reset all errors
        setErrors({
            awayMoneyline: '',
            homeMoneyline: '',
            totalLine: '',
            overOdds: '',
            underOdds: ''
        });
        setProcessError('');

        // Validate all inputs
        const parsedValues = {
            awayML: validateAndParseInput(awayMoneyline, 'awayMoneyline'),
            homeML: validateAndParseInput(homeMoneyline, 'homeMoneyline'),
            totalLine: validateAndParseInput(totalLine, 'totalLine'),
            overOdds: validateAndParseInput(overOdds, 'overOdds'),
            underOdds: validateAndParseInput(underOdds, 'underOdds')
        };

        // Check if any validation failed
        if (Object.values(parsedValues).some(value => value === null)) {
            return; // Stop if any validation failed
        }

        setIsSearching(true);

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

        try {
            const optimalLeans = await findOptimalLeans(gameContainer?.currentGame?.lineups as MatchupLineups, marketLines);
            dispatch(updateMLBAutomatedLeans({
                league: 'MLB',
                matchId,
                automatedLeans: optimalLeans
            }));
        } catch (error) {
            console.error('Error finding optimal leans:', error);
            setProcessError('Failed to calculate optimal leans. Please try again or check your inputs.');
        } finally {
            setIsSearching(false);
        }
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
                                value={awayMoneyline}
                                onChange={(e) => setAwayMoneyline(e.target.value)}
                                error={!!errors.awayMoneyline}
                                helperText={errors.awayMoneyline}
                                sx={{ flex: 1, minWidth: '250px' }}
                            />
                            <TextField
                                label={`${homeTeamName}`}
                                variant="outlined"
                                size="small"
                                placeholder="e.g. -170"
                                value={homeMoneyline}
                                onChange={(e) => setHomeMoneyline(e.target.value)}
                                error={!!errors.homeMoneyline}
                                helperText={errors.homeMoneyline}
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
                                value={totalLine}
                                onChange={(e) => setTotalLine(e.target.value)}
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
                                    value={underOdds}
                                    onChange={(e) => setUnderOdds(e.target.value)}
                                    error={!!errors.underOdds}
                                    helperText={errors.underOdds}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Over Odds"
                                    variant="outlined"
                                    size="small"
                                    placeholder="e.g. +105"
                                    value={overOdds}
                                    onChange={(e) => setOverOdds(e.target.value)}
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
                        {processError && (
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                {processError}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                onClick={handleFindLeans}
                                disabled={isSearching}
                                startIcon={isSearching ? <CircularProgress size={20} /> : null}
                            >
                                {isSearching ? 'Finding Optimal Leans...' : 'Find Optimal Leans'}
                            </Button>
                            {automatedLeans && !processError && (
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