import React from "react";
import { 
    Typography, 
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
import { Delete as DeleteIcon } from "@mui/icons-material";

// ---------- Types ----------

export interface ColumnConfig<T> {
    header: string;
    accessor: (item: T) => string | number;
    displayType: 'chip' | 'chip-outlined' | 'text';
    formatter?: (value: string | number) => string;
    width?: number;
}

export interface ConfigurationTableProps<T> {
    configurations: T[];
    columns: ColumnConfig<T>[];
    onRemoveRow: (index: number) => void;
    emptyMessage: string;
    getRowKey: (item: T, index: number) => string;
}

// ---------- Main component ----------

function ConfigurationTable<T>({
    configurations,
    columns,
    onRemoveRow,
    emptyMessage,
    getRowKey
}: ConfigurationTableProps<T>) {

    if (configurations.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                {emptyMessage}
            </Typography>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableCell key={index} width={column.width}>
                                {column.header}
                            </TableCell>
                        ))}
                        <TableCell width={50}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {configurations.map((row, index) => (
                        <TableRow key={getRowKey(row, index)}>
                            {columns.map((column, colIndex) => {
                                const rawValue = column.accessor(row);
                                const displayValue = column.formatter ? column.formatter(rawValue) : rawValue.toString();
                                
                                return (
                                    <TableCell key={colIndex}>
                                        {column.displayType === 'chip' && (
                                            <Chip label={displayValue} size="small" />
                                        )}
                                        {column.displayType === 'chip-outlined' && (
                                            <Chip label={displayValue} variant="outlined" size="small" />
                                        )}
                                        {column.displayType === 'text' && displayValue}
                                    </TableCell>
                                );
                            })}
                            <TableCell>
                                <IconButton 
                                    size="small" 
                                    onClick={() => onRemoveRow(index)}
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
    );
}

export default ConfigurationTable; 