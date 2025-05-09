import React from 'react';
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
import dayjs from 'dayjs';

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

const GenericScheduleTable: React.FC<GenericScheduleTableProps> = ({
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

    // Sort data if a sort function is provided
    const sortedData = sortFunction ? [...scheduleData].sort(sortFunction) : scheduleData;

    // Generate a unique key for the row
    const getRowKey = (item: ScheduleItem, index: number): string => {
        // Attempt to use common unique fields, fallback to index
        return `${item.PostDtmUTC}-${item.Participant1}-${item.Participant2}-${index}`;
    };

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
                    {sortedData.map((item, index) => (
                        <TableRow
                            key={getRowKey(item, index)}
                            hover
                            onClick={() => onRowClick(item)}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                        >
                            {columns.map((col) => (
                                <TableCell key={`${col.key.toString()}-${index}`} component="td" scope="row" align={col.align ?? 'inherit'}>
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
};

export default GenericScheduleTable; 