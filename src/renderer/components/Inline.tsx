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
  IconButton,
  Divider,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import ExportButton from './ExportButton';

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
  display?: {
    rules: DisplayRule[];
  };
}

interface InlineProps {
  data: Record<string, any>[];
  columns: ColumnConfig[];
  onRowClick?: (row: Record<string, any>) => void;
}

const Inline: React.FC<InlineProps> = ({ data, columns, onRowClick }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const tableColumns = React.useMemo(
    () =>
      columns.map((col) => ({
        id: col.name,
        accessorKey: col.name,
        header: col.label,
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
                {table.getFlatHeaders().map((header, index) => (
                  <React.Fragment key={header.id}>
                    <TableCell
                      onClick={header.column.getToggleSortingHandler()}
                      sx={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        borderRight: index < table.getFlatHeaders().length - 1 ? 1 : 0,
                        borderColor: 'divider',
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
                  </React.Fragment>
                ))}
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
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell 
                      key={cell.id}
                      sx={{
                        borderRight: index < row.getVisibleCells().length - 1 ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
        mb: 2
      }}>
        <ExportButton data={data} columns={columns} />
      </Box>
    </Box>
  );
};

export default Inline; 