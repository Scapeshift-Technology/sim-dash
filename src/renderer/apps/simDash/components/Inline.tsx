import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Box,
  IconButton
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import ExportButton from './ExportButton';
import CopyTableButton from './CopyTableButton';

export type SupportedTypes = 'string' | 'number' | 'boolean' | 'date' | 'time' | 'datetime';
export type StyleType = 'cell' | 'text';

export interface DisplayRule {
  condition: (row: Record<string, any>) => boolean;
  style: React.CSSProperties;
  type: StyleType;
}

export interface ColumnConfig {
  name: string;
  type: SupportedTypes;
  label: string;
  mobile?: boolean;
  width?: number; // Fixed column width in pixels
  frozen?: boolean; // Whether this column should be frozen/sticky
  display?: {
    rules: DisplayRule[];
  };
}

interface InlineProps {
  data: Record<string, any>[];
  columns: ColumnConfig[];
  onRowClick?: (row: Record<string, any>) => void;
}

// Helper function to calculate frozen column positions
const calculateFrozenPositions = (columns: ColumnConfig[]): Record<string, number> => {
  const positions: Record<string, number> = {};
  let left = 0;
  
  for (const col of columns) {
    if (col.frozen) {
      positions[col.name] = left;
      left += col.width || 120; // Default width of 120px if not specified
    } else {
      break; // Stop when we hit a non-frozen column
    }
  }
  
  return positions;
};

const Inline: React.FC<InlineProps> = ({ data, columns, onRowClick }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  // Calculate frozen column positions
  const frozenPositions = React.useMemo(() => calculateFrozenPositions(columns), [columns]);

  const tableColumns = React.useMemo(
    () =>
      columns.map((col) => ({
        id: col.name,
        accessorKey: col.name,
        header: col.label,
        size: col.width || (col.frozen ? 120 : undefined), // Set width for frozen columns or use default
        cell: (info: any) => {
          const value = info.getValue();
          if (value === null || value === undefined) return '';

          const cellContent = (() => {
            switch (col.type) {
              case 'date':
                return new Date(value).toLocaleDateString();
              case 'time':
                return new Date(value).toLocaleTimeString();
              case 'datetime':
                return new Date(value).toLocaleString();
              case 'boolean':
                return info.getValue() ? 'Yes' : 'No';
              default:
                return String(value);
            }
          })();

          // Apply conditional styling if display rules exist
          if (col.display?.rules) {
            const cellStyles = col.display.rules
              .filter(rule => rule.condition(info.row.original) && rule.type === 'cell')
              .reduce((styles, rule) => ({ ...styles, ...rule.style }), {});

            const textStyles = col.display.rules
              .filter(rule => rule.condition(info.row.original) && rule.type === 'text')
              .reduce((styles, rule) => ({ ...styles, ...rule.style }), {});

            const hasStyles = Object.keys(cellStyles).length > 0 || Object.keys(textStyles).length > 0;

            if (hasStyles) {
              return (
                <Box sx={cellStyles}>
                  <Box sx={textStyles}>
                    {cellContent}
                  </Box>
                </Box>
              );
            }
          }

          return cellContent;
        },
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
    },
    enableMultiSort: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: .5 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {table.getFlatHeaders().map((header, index) => {
                  const columnConfig = columns.find(col => col.name === header.id);
                  const isFrozen = columnConfig?.frozen;
                  const frozenLeft = isFrozen ? frozenPositions[header.id] : undefined;
                  
                  return (
                    <TableCell
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      sx={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        direction: 'rtl',
                        textAlign: 'left',
                        borderRight: index < table.getFlatHeaders().length - 1 ? 1 : 0,
                        borderColor: 'divider',
                        width: columnConfig?.width || (isFrozen ? 120 : 'auto'),
                        minWidth: columnConfig?.width || (isFrozen ? 120 : 'auto'),
                        maxWidth: columnConfig?.width || (isFrozen ? 120 : 'auto'),
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        ...(isFrozen && {
                          position: 'sticky',
                          left: frozenLeft,
                          backgroundColor: 'background.paper',
                          zIndex: 1,
                          borderRight: '2px solid',
                          borderRightColor: 'divider',
                        }),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() && (
                          <IconButton size="small">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUpward fontSize="small" />
                            ) : (
                              <ArrowDownward fontSize="small" />
                            )}
                          </IconButton>
                        )}
                        {header.column.getIsSorted() && (
                          <Box component="span" sx={{ ml: 0.5 }}>
                            {sorting.findIndex(
                              (sort) => sort.id === header.column.id
                            ) + 1}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const columnConfig = columns.find(col => col.name === cell.column.id);
                    const isFrozen = columnConfig?.frozen;
                    const frozenLeft = isFrozen ? frozenPositions[cell.column.id] : undefined;
                    
                    return (
                      <TableCell 
                        key={cell.id}
                        sx={{
                          borderRight: index < row.getVisibleCells().length - 1 ? 1 : 0,
                          borderColor: 'divider',
                          width: columnConfig?.width || (isFrozen ? 120 : 'auto'),
                          minWidth: columnConfig?.width || (isFrozen ? 120 : 'auto'),
                          maxWidth: columnConfig?.width || (isFrozen ? 120 : 'auto'),
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          ...(isFrozen && {
                            position: 'sticky',
                            left: frozenLeft,
                            backgroundColor: 'background.paper',
                            zIndex: 1,
                            borderRight: '2px solid',
                            borderRightColor: 'divider',
                          }),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        mt: 1,
        mb: 2,
        gap: 1
      }}>
        <CopyTableButton data={data} columns={columns} />
        <ExportButton data={data} columns={columns} />
      </Box>
    </Box>
  );
};

export default Inline; 