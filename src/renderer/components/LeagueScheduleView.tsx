import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// Import the configurable table component and its column definition type
import GenericScheduleTable, { ColumnDefinition } from './GenericScheduleTable';
// MLBScheduleTable is no longer needed
// import MLBScheduleTable from './MLBScheduleTable';

// Import the shared ScheduleItem type
import type { ScheduleItem } from '../preload.d.ts';

interface LeagueScheduleViewProps {
    league: string;
}

// --- Column and Sort Definitions ---

const commonColumns: ColumnDefinition[] = [
    {
        key: 'PostDtmUTC',
        label: 'Date/Time (Local)',
        render: (item) => dayjs(item.PostDtmUTC).format('YYYY-MM-DD HH:mm')
    },
    { key: 'Participant1', label: 'Participant 1' },
    { key: 'Participant2', label: 'Participant 2' },
];

const mlbColumns: ColumnDefinition[] = [
    ...commonColumns,
    {
        key: 'DaySequence',
        label: 'Day Seq.',
        align: 'right',
        render: (item) => item.DaySequence ?? 'N/A'
    },
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
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!selectedDate) return;
            setLoading(true);
            setError(null);
            setScheduleData([]);
            try {
                const dateString = selectedDate.format('YYYY-MM-DD');
                const data: ScheduleItem[] = await window.electronAPI.fetchSchedule({ league, date: dateString });
                setScheduleData(data);
            } catch (err: any) {
                console.error('Error fetching schedule:', err);
                setError(err.message || 'Failed to fetch schedule');
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [league, selectedDate]);

    const handleDateChange = (newValue: Dayjs | null) => {
        setSelectedDate(newValue);
    };

    // Determine configuration based on league
    const isMLB = league === 'MLB';
    const columns = isMLB ? mlbColumns : commonColumns;
    const sortFunction = isMLB ? mlbSortFunction : genericSortFunction;
    const emptyMessage = `No ${league} schedule data available for this date.`;
    const ariaLabel = `${league.toLowerCase()} schedule table`;
    const handleRowClick = (item: ScheduleItem) => {
        console.log(`Clicked ${league} Match:`, item);
        // TODO: Implement navigation or detail view logic here
    };

    const renderScheduleTable = () => {
        if (loading) return <CircularProgress />;
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