import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Alert, Paper, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// Import the configurable table component and its column definition type
import GenericScheduleTable, { ColumnDefinition } from '@/simDash/components/GenericScheduleTable';

// Import the shared ScheduleItem type
import type { ScheduleItem } from '@/types/sqlite';

// Import Redux action and types
import { openMatchupTab } from '@/simDash/store/slices/tabSlice';
import type { AppDispatch, RootState } from '@/store/store';
import { 
    selectLeagueScheduleData, 
    selectLeagueScheduleDate,
    selectLeagueScheduleStatus,
    selectLeagueScheduleError,
    updateLeagueDate,
    fetchSchedule,
    fetchSimResults,
    selectMatchSimResults,
    selectMatchSimStatus
} from '@/simDash/store/slices/scheduleSlice';
import { selectDatabaseConnectionStatus } from '@/store/slices/authSlice';
import { calculateResultsSummaryDisplayMLB, formatBettingBoundsDisplay, isBettingBoundsComplete } from '@/simDash/utils/oddsUtilsMLB';
import { usePrevious } from '@dnd-kit/utilities';
import { 
    initializeLeague,
    getActiveStatCaptureConfiguration,
    selectActiveConfig,
    selectActiveConfigLoading,
    selectActiveConfigError
} from '@/simDash/store/slices/statCaptureSettingsSlice';
import { LeagueName } from '@@/types/league';
import { getMLBWebSocketManager } from '@/simDash/services/mlbWebSocketManager';
import StatusCell from '@/simDash/components/StatusCell';
import type { SimHistoryEntry } from '@/types/simHistory';

// ---------- Helper functions ----------

function getTodayMatchups(scheduleData: ScheduleItem[], item: ScheduleItem): ScheduleItem[] {
    return scheduleData.filter((match: ScheduleItem) => {
        const team1 = match.Participant1 === item.Participant1;
        const team2 = match.Participant2 === item.Participant2;
        return team1 && team2;
    });
}

// ---------- Types ----------

interface LeagueScheduleViewProps {
    league: string;
}

// --- Wrapper Component for Sim Results Cell ---
interface SimResultsCellProps {
    item: ScheduleItem;
    league: string;
    scheduleData: ScheduleItem[];
}

const SimResultsCell: React.FC<SimResultsCellProps> = React.memo(({ item, league, scheduleData }) => {
    const simResults = useSelector((state: RootState) => 
        selectMatchSimResults(state, league, item.Match)
    );
    const simStatus = useSelector((state: RootState) => 
        selectMatchSimStatus(state, league, item.Match)
    );

    // ---------- Helper function to get display info for any simulation ----------
    const getDisplayInfo = (simEntry: SimHistoryEntry) => {
        // Always start with simulation results as the base based on league
        const simDisplayInfo = (() => {
            switch (league) {
                case 'MLB':
                    return calculateResultsSummaryDisplayMLB(simEntry.simResults, item.Participant1, item.Participant2);
                default:
                    return { topLine: 'Not implemented', bottomLine: '' };
            }
        })();
        
        // Try to enhance with betting bounds from the sim entry's input data (only for MLB)
        if (league === 'MLB') {
            const simBettingBounds = simEntry.inputData?.gameInfo?.bettingBounds;
            
            if (simBettingBounds) {
                const boundsData = {
                    awayML: simBettingBounds.awayML.toString(),
                    homeML: simBettingBounds.homeML.toString(),
                    totalLine: simBettingBounds.over.line.toString(),
                    overOdds: simBettingBounds.over.odds.toString(),
                    underOdds: simBettingBounds.under.odds.toString()
                };
                
                if (isBettingBoundsComplete(boundsData)) {
                    return formatBettingBoundsDisplay(boundsData, item.Participant1, item.Participant2, simEntry.simResults);
                }
            }
        }
        
        // Fall back to simulation results
        return simDisplayInfo;
    };

    if (simStatus === 'loading') {
        return <Typography variant="body2" color="text.secondary">Loading...</Typography>;
    }

    if (!simResults || simResults.length === 0) {
        return <Typography variant="body2" color="text.secondary">No sim data</Typography>;
    }

    // Get the display using the new helper function
    const display = getDisplayInfo(simResults[0]);

    return (
        <Box 
            sx={{ 
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
                p: 1,
                borderRadius: 1
            }}
            onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                try {
                    const todayMatchups = getTodayMatchups(scheduleData, item);
                    const daySequence = todayMatchups.length > 1 ? item.GameNumber : undefined;

                    await window.electronAPI.createSimWindow({ 
                        league,
                        matchupId: item.Match,
                        timestamp: simResults[0].timestamp,
                        awayTeamName: item.Participant1,
                        homeTeamName: item.Participant2,
                        daySequence: daySequence
                    });
                } catch (error) {
                    console.error('Failed to create simulation window:', error);
                }
            }}
        >
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {display.topLine}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {display.bottomLine}
            </Typography>
        </Box>
    );
}, (prevProps, nextProps) => {
    // Custom equality check - only re-render if the specific match data changed
    return (
        prevProps.item.Match === nextProps.item.Match &&
        prevProps.item.Participant1 === nextProps.item.Participant1 &&
        prevProps.item.Participant2 === nextProps.item.Participant2 &&
        prevProps.item.GameNumber === nextProps.item.GameNumber &&
        prevProps.league === nextProps.league
    );
});

// --- Column and Sort Definitions ---

const createSimResultsColumn = (scheduleData: ScheduleItem[], league: string): ColumnDefinition => ({
    key: 'simResults',
    label: 'Sim Results',
    align: 'center',
    render: (item: ScheduleItem) => (
        <SimResultsCell item={item} league={league} scheduleData={scheduleData} />
    )
});

const commonColumns: ColumnDefinition[] = [
    {
        key: 'PostDtmUTC',
        label: 'Date/Time (Local)',
        render: (item: ScheduleItem) => dayjs(item.PostDtmUTC).format('YYYY-MM-DD HH:mm')
    },
    { key: 'Participant1', label: 'Away' },
    { key: 'Participant2', label: 'Home' },
];

const getColumns = (scheduleData: ScheduleItem[], league: string): ColumnDefinition[] => {
    if (league === 'MLB') {
        const gameNumberCol: ColumnDefinition = {
            key: 'GameNumber',
            label: 'Gm#',
            align: 'right',
            render: (item: ScheduleItem) => item.GameNumber ?? 'N/A'
        };
        const seriesGameCol: ColumnDefinition = {
            key: 'SeriesGameNumber', 
            label: 'SerGm#',
            align: 'center',
            render: (item: ScheduleItem) => item.SeriesGameNumber ?? 'N/A'
        };
        const statusCol: ColumnDefinition = {
            key: 'Status',
            label: 'Status',
            align: 'center',
            render: (item: ScheduleItem) => <StatusCell item={item} league={league} />
        };
        return [...commonColumns, gameNumberCol, seriesGameCol, statusCol, createSimResultsColumn(scheduleData, league)];
    }
    return commonColumns;
};

const mlbSortFunction = (a: ScheduleItem, b: ScheduleItem): number => {
    if (a.GameNumber !== undefined && b.GameNumber !== undefined) {
        if (a.GameNumber !== b.GameNumber) {
            return a.GameNumber - b.GameNumber;
        }
    }
    // Fallback to sorting by time if GameNumber is missing or equal
    return dayjs(a.PostDtmUTC).valueOf() - dayjs(b.PostDtmUTC).valueOf();
};

const genericSortFunction = (a: ScheduleItem, b: ScheduleItem): number => {
     return dayjs(a.PostDtmUTC).valueOf() - dayjs(b.PostDtmUTC).valueOf();
};

// --- Component Logic ---

const LeagueScheduleView: React.FC<LeagueScheduleViewProps> = ({ league }) => {
    const dispatch = useDispatch<AppDispatch>();
    const dateString = useSelector((state: RootState) => selectLeagueScheduleDate(state, league));
    const selectedDate = useMemo(() => dayjs(dateString), [dateString]);
    const scheduleData = useSelector((state: RootState) => selectLeagueScheduleData(state, league));
    const leagueScheduleStatus = useSelector((state: RootState) => selectLeagueScheduleStatus(state, league));
    const databaseStatus = useSelector((state: RootState) => selectDatabaseConnectionStatus(state));
    const error = useSelector((state: RootState) => selectLeagueScheduleError(state, league));
    const [currentDate, setCurrentDate] = useState<Dayjs | null>(null);
    const lastWebSocketUpdateDate = useRef<string | null>(null);

    // Add mount/unmount logging for debugging
    useEffect(() => {
        console.log(`[LeagueScheduleView] Component mounted for league: ${league}`);
        return () => {
            console.log(`[LeagueScheduleView] Component unmounting for league: ${league}`);
        };
    }, [league]);


    const activeConfig = useSelector((state: RootState) => selectActiveConfig(state, league));
    const activeConfigLoading = useSelector((state: RootState) => selectActiveConfigLoading(state, league));
    const activeConfigError = useSelector((state: RootState) => selectActiveConfigError(state, league));

    // ---------- UseEffects ----------

    useEffect(() => {
        const dateString = selectedDate.format('YYYY-MM-DD');
        
        console.log(`[LeagueScheduleView] useEffect triggered for ${league}:`, {
            dateString,
            databaseStatus,
            selectedDate: selectedDate?.format('YYYY-MM-DD'),
            leagueScheduleStatus,
            currentDate: currentDate?.format('YYYY-MM-DD')
        });
        
        // Only fetch if we need to and database is connected
        const needsFetch = databaseStatus === 'connected' && 
                          selectedDate && 
                          (leagueScheduleStatus === 'idle' ||
                           leagueScheduleStatus === 'failed' ||
                           !currentDate?.isSame(selectedDate, 'day'));
        
        console.log(`[LeagueScheduleView] needsFetch for ${league}:`, needsFetch);
        
        if (needsFetch) {
            console.log(`[LeagueScheduleView] Dispatching fetchSchedule for ${league} on ${dateString}`);
            dispatch(fetchSchedule({ 
                league, 
                date: dateString
            }));
            setCurrentDate(selectedDate);
            // Reset WebSocket update tracking when fetching new data
            lastWebSocketUpdateDate.current = null;
        }
    }, [dispatch, league, selectedDate, databaseStatus, currentDate, leagueScheduleStatus]);

    const prevStatus = usePrevious(leagueScheduleStatus);
    useEffect(() => {
      if (prevStatus !== 'succeeded' && leagueScheduleStatus === 'succeeded') {
        const promises = scheduleData.map((match: ScheduleItem) => 
          dispatch(fetchSimResults({ league, matchId: match.Match }))
        );
        Promise.all(promises)
          .catch(error => console.error('Error fetching sim results:', error));
      }
    }, [leagueScheduleStatus]);

    // Initialize league and fetch active config if needed
    useEffect(() => {
        dispatch(initializeLeague(league as LeagueName));
        if (!activeConfig && !activeConfigLoading && !activeConfigError && league === 'MLB') {
            dispatch(getActiveStatCaptureConfiguration(league as LeagueName));
        }
    }, [dispatch, league, activeConfig, activeConfigLoading, activeConfigError]);

    // Notify WebSocket manager about schedule updates for open tabs
    // Only trigger on meaningful changes: initial load or date change, not on sim results updates
    useEffect(() => {
        const dateString = selectedDate.format('YYYY-MM-DD');
        
        if (league === 'MLB' && 
            scheduleData.length > 0 && 
            leagueScheduleStatus === 'succeeded' &&
            lastWebSocketUpdateDate.current !== dateString) {
            
            console.log(`[LeagueScheduleView] Calling handleScheduleUpdate for ${league} on ${dateString}`);
            lastWebSocketUpdateDate.current = dateString;
            
            const manager = getMLBWebSocketManager();
            if (manager) {
                manager.handleScheduleUpdate(league, scheduleData).catch(error => {
                    console.error('Failed to handle schedule update:', error);
                });
            }
        }
    }, [league, selectedDate, leagueScheduleStatus]);



    // ---------- Handlers ----------

    const handleDateChange = useCallback((newValue: Dayjs | null) => {
        if (newValue) {
          dispatch(updateLeagueDate({ 
            league, 
            date: newValue.format('YYYY-MM-DD')
          }));
        }
    }, [dispatch, league]);

    // Determine configuration based on league
    const isMLB = league === 'MLB';
    
    // Memoize the sim results column separately to avoid recreating all columns
    const simResultsColumn = useMemo(() => 
        createSimResultsColumn(scheduleData, league), 
        [scheduleData, league]
    );
    
    const columns = useMemo(() => {
        if (league === 'MLB') {
            const gameNumberCol: ColumnDefinition = {
                key: 'GameNumber',
                label: 'Gm#',
                align: 'right',
                render: (item: ScheduleItem) => item.GameNumber ?? 'N/A'
            };
            const seriesGameCol: ColumnDefinition = {
                key: 'SeriesGameNumber', 
                label: 'SerGm#',
                align: 'center',
                render: (item: ScheduleItem) => item.SeriesGameNumber ?? 'N/A'
            };
            const statusCol: ColumnDefinition = {
                key: 'Status',
                label: 'Status',
                align: 'center',
                render: (item: ScheduleItem) => <StatusCell item={item} league={league} />
            };
            return [...commonColumns, gameNumberCol, seriesGameCol, statusCol, simResultsColumn];
        }
        return commonColumns;
    }, [league, simResultsColumn]);
    
    const sortFunction = isMLB ? mlbSortFunction : genericSortFunction;
    const emptyMessage = `No ${league} schedule data available for this date.`;
    const ariaLabel = `${league.toLowerCase()} schedule table`;

    // Updated Row Click Handler
    const handleRowClick = useCallback((item: ScheduleItem) => {
        if (league === 'MLB' && selectedDate) {
            // Find all matchups between these teams today
            const todayMatchups = getTodayMatchups(scheduleData, item);

            dispatch(openMatchupTab({
                matchId: item.Match,
                league: league,
                date: selectedDate.format('YYYY-MM-DD'),
                dateTime: item.PostDtmUTC,
                participant1: item.Participant1,
                participant2: item.Participant2,
                daySequence: todayMatchups.length > 1 ? item.GameNumber : undefined,
            }));
        } else {
            console.log('Row click ignored (not MLB or no date selected)');
        }
    }, [dispatch, league, selectedDate, scheduleData]);

    // ---------- Render Functions ----------

    const renderScheduleTable = () => {
        if (leagueScheduleStatus === 'loading' || databaseStatus === 'attempting') {
            return <CircularProgress />;
        }
        
        if (error) return <Alert severity="error">{error}</Alert>;

        return (
            <GenericScheduleTable
                scheduleData={scheduleData}
                columns={columns}
                sortFunction={sortFunction}
                onRowClick={handleRowClick}
                emptyMessage={emptyMessage}
                ariaLabel={ariaLabel}
            />
        );
    };

    // ---------- Render ----------

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Box sx={{ mb: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                    </LocalizationProvider>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {renderScheduleTable()}
                </Box>
            </Paper>
        </Box>
    );
};

export default LeagueScheduleView; 