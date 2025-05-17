import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Alert, Paper, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// Import the configurable table component and its column definition type
import GenericScheduleTable, { ColumnDefinition } from '@/components/GenericScheduleTable';

// Import the shared ScheduleItem type
import type { ScheduleItem } from '@/types/sqlite';

// Import Redux action and types
import { openMatchupTab } from '@/store/slices/tabSlice';
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
} from '@/store/slices/scheduleSlice';
import { calculateResultsSummaryDisplayMLB } from '@/utils/oddsUtilsMLB';

interface LeagueScheduleViewProps {
    league: string;
}

// --- Column and Sort Definitions ---

const createSimResultsColumn = (league: string): ColumnDefinition => ({
    key: 'simResults',
    label: 'Sim Results',
    align: 'center',
    render: (item: ScheduleItem) => {
        const simResults = useSelector((state: RootState) => 
            selectMatchSimResults(state, league, item.Match)
        );
        const simStatus = useSelector((state: RootState) => 
            selectMatchSimStatus(state, league, item.Match)
        );

        if (simStatus === 'loading') {
            return <Typography variant="body2" color="text.secondary">Loading...</Typography>;
        }

        if (!simResults || simResults.length === 0) {
            return <Typography variant="body2" color="text.secondary">No sim data</Typography>;
        }

        // Get the appropriate display function based on league
        let display;
        switch (league) {
            case 'MLB':
                display = calculateResultsSummaryDisplayMLB(
                    simResults[0].simResults,
                    item.Participant1,
                    item.Participant2
                );
                break;
            // Add other leagues here as they are implemented
            default:
                return <Typography variant="body2" color="text.secondary">Not implemented</Typography>;
        }

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
                        await window.electronAPI.createSimWindow({ 
                            league,
                            matchupId: item.Match,
                            timestamp: simResults[0].timestamp,
                            awayTeamName: item.Participant1,
                            homeTeamName: item.Participant2
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
    }
});

const commonColumns: ColumnDefinition[] = [
    {
        key: 'PostDtmUTC',
        label: 'Date/Time (Local)',
        render: (item) => dayjs(item.PostDtmUTC).format('YYYY-MM-DD HH:mm')
    },
    { key: 'Participant1', label: 'Away' },
    { key: 'Participant2', label: 'Home' },
];

const mlbColumns: ColumnDefinition[] = [
    ...commonColumns,
    {
        key: 'DaySequence',
        label: 'Day Seq.',
        align: 'right',
        render: (item) => item.DaySequence ?? 'N/A'
    },
    createSimResultsColumn('MLB')
];

const mlbSortFunction = (a: ScheduleItem, b: ScheduleItem): number => {
    if (a.DaySequence !== undefined && b.DaySequence !== undefined) {
        if (a.DaySequence !== b.DaySequence) {
            return a.DaySequence - b.DaySequence;
        }
    }
    // Fallback to sorting by time if DaySequence is missing or equal
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
    const error = useSelector((state: RootState) => selectLeagueScheduleError(state, league));
    const [currentDate, setCurrentDate] = useState<Dayjs | null>(null);

    // ---------- UseEffects ----------

    useEffect(() => {
        if (selectedDate && currentDate !== selectedDate) {
            console.log('LeagueScheduleView: Fetching schedule data');
            dispatch(fetchSchedule({ 
                league, 
                date: selectedDate.format('YYYY-MM-DD')
            }));
            setCurrentDate(selectedDate);
        }
    }, [dispatch, league, selectedDate]);

    useEffect(() => {
      if (leagueScheduleStatus === 'succeeded') {
        console.log('LeagueScheduleView: Schedule data fetched successfully');
        for (const match of scheduleData) {
          dispatch(fetchSimResults({ league, matchId: match.Match }));
        }
      }
    }, [leagueScheduleStatus]);

    // ---------- Handlers ----------

    const handleDateChange = (newValue: Dayjs | null) => {
        if (newValue) {
          console.log('handleDateChange', newValue.format('YYYY-MM-DD'));
          dispatch(updateLeagueDate({ 
            league, 
            date: newValue.format('YYYY-MM-DD')
          }));
        }
    };

    // Determine configuration based on league
    const isMLB = league === 'MLB';
    const columns = isMLB ? [...mlbColumns] : [...commonColumns];
    const sortFunction = isMLB ? mlbSortFunction : genericSortFunction;
    const emptyMessage = `No ${league} schedule data available for this date.`;
    const ariaLabel = `${league.toLowerCase()} schedule table`;

    // Updated Row Click Handler
    const handleRowClick = (item: ScheduleItem) => {
        if (league === 'MLB' && selectedDate) {
            // Find all matchups between these teams today
            const todayMatchups = scheduleData.filter(match => {
                const team1 = match.Participant1 === item.Participant1;
                const team2 = match.Participant2 === item.Participant2;
                return team1 && team2;
            });

            dispatch(openMatchupTab({
                matchId: item.Match,
                league: league,
                date: selectedDate.format('YYYY-MM-DD'),
                participant1: item.Participant1,
                participant2: item.Participant2,
                daySequence: todayMatchups.length > 1 ? item.DaySequence : undefined,
            }));
        } else {
            console.log('Row click ignored (not MLB or no date selected)');
        }
    };

    // ---------- Render Functions ----------

    const renderScheduleTable = () => {
        if (leagueScheduleStatus === 'loading') return <CircularProgress />;
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