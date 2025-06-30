import React, { useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography
} from '@mui/material';

// Assuming ScheduleItem might be moved later
import type { ScheduleItem } from '@/types/sqlite';

// Define the structure for a column definition
export interface ColumnDefinition {
    key: keyof ScheduleItem | string; // Allow specific keys or custom string keys
    label: string;
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    render?: (item: ScheduleItem) => React.ReactNode; // Custom render function
    sortable?: boolean; // Placeholder for future sorting implementation if needed
}

interface GenericScheduleTableProps {
    scheduleData: ScheduleItem[];
    columns: ColumnDefinition[];
    onRowClick?: (item: ScheduleItem) => void;
    sortFunction?: (a: ScheduleItem, b: ScheduleItem) => number;
    emptyMessage?: string;
    ariaLabel?: string;
}

const GenericScheduleTable: React.FC<GenericScheduleTableProps> = React.memo(({
    scheduleData,
    columns,
    onRowClick = (item) => { console.log('Clicked Row:', item); }, // Default click handler
    sortFunction,
    emptyMessage = "No schedule data available.",
    ariaLabel = "schedule table"
}) => {

    if (!scheduleData || scheduleData.length === 0) {
        return <Typography>{emptyMessage}</Typography>;
    }

    // Sort data if a sort function is provided - memoize this operation
    const sortedData = useMemo(() => {
        return sortFunction ? [...scheduleData].sort(sortFunction) : scheduleData;
    }, [scheduleData, sortFunction]);

    // Generate a unique key for the row - memoize this function
    const getRowKey = useMemo(() => {
        return (item: ScheduleItem): string => {
            // Use Match ID if available, otherwise fallback to composite key
            return item.Match ? `match-${item.Match}` : `${item.PostDtmUTC}-${item.Participant1}-${item.Participant2}`;
        };
    }, []);

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label={ariaLabel}>
                <TableHead>
                    <TableRow>
                        {columns.map((col) => (
                            <TableCell key={col.key.toString()} align={col.align ?? 'inherit'}>
                                {col.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedData.map((item) => (
                        <TableRow
                            key={getRowKey(item)}
                            hover
                            onClick={() => onRowClick(item)}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                        >
                            {columns.map((col) => (
                                <TableCell key={`${col.key.toString()}-${item.Match}`} component="td" scope="row" align={col.align ?? 'inherit'}>
                                    {col.render
                                        ? col.render(item) // Use custom render function if provided
                                        : item[col.key as keyof ScheduleItem] !== undefined // Access data using key
                                            ? String(item[col.key as keyof ScheduleItem]) // Convert to string for display
                                            : 'N/A' // Fallback for undefined direct keys
                                    }
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
});

GenericScheduleTable.displayName = 'GenericScheduleTable';

export default GenericScheduleTable; 