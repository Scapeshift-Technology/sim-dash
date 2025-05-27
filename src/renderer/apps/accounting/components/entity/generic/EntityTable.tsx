import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  Fab,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { EntityTableProps, EntityData, FieldConfig } from './types';

type Order = 'asc' | 'desc';

interface SortConfig {
  field: string;
  order: Order;
}

export const EntityTable = <T extends EntityData>({
  config,
  data,
  loading = false,
  error = null,
  onRefresh,
  onRowClick,
  onSelectionChange,
  actions = [],
}: EntityTableProps<T>) => {
  // ---------- State ----------
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: '', order: 'asc' });
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(config.views.table.pageSize || 25);

  // ---------- Computed Values ----------
  
  // Filter fields that should be shown in table
  const visibleFields = useMemo(() => 
    config.fields.filter(field => field.showInTable !== false),
    [config.fields]
  );

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm && config.views.table.searchable) {
      const searchableFields = visibleFields.filter(field => 
        field.display?.searchable !== false
      );
      
      filtered = data.filter(item =>
        searchableFields.some(field => {
          const value = item[field.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortConfig.field && config.views.table.sortable) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        
        if (aVal === bVal) return 0;
        
        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;
        
        return sortConfig.order === 'desc' ? comparison * -1 : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, visibleFields, config.views.table]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!config.views.table.showPagination) return processedData;
    
    const startIndex = page * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, page, rowsPerPage, config.views.table.showPagination]);

  // ---------- Handlers ----------

  const handleSort = useCallback((field: string) => {
    const fieldConfig = visibleFields.find(f => f.key === field);
    if (!fieldConfig?.display?.sortable) return;

    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, [visibleFields]);

  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelection = checked ? [...paginatedData] : [];
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  }, [paginatedData, onSelectionChange]);

  const handleSelectRow = useCallback((item: T, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedRows, item]
      : selectedRows.filter(row => row[config.primaryKey] !== item[config.primaryKey]);
    
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  }, [selectedRows, config.primaryKey, onSelectionChange]);

  const handleRowClick = useCallback((item: T) => {
    onRowClick?.(item);
  }, [onRowClick]);

  const handleAddClick = useCallback(() => {
    const addAction = actions.find(action => action.type === 'create');
    addAction?.onClick();
  }, [actions]);

  const formatCellValue = useCallback((value: any, field: FieldConfig) => {
    if (value === null || value === undefined) return '-';

    switch (field.display?.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'percentage':
        return `${(Number(value) * 100).toFixed(2)}%`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  }, []);

  const getCellAlignment = useCallback((field: FieldConfig) => {
    if (field.display?.align) return field.display.align;
    if (field.type === 'number' || field.type === 'money') return 'right';
    return 'left';
  }, []);

  // ---------- Render Helpers ----------

  const renderTableToolbar = () => (
    <Toolbar sx={{ px: 2, py: 1 }}>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        {config.pluralDisplayName}
        {config.views.table.allowSelection && selectedRows.length > 0 && (
          <Chip 
            label={`${selectedRows.length} selected`} 
            size="small" 
            sx={{ ml: 2 }} 
          />
        )}
      </Typography>
      
      {config.views.table.searchable && (
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <TextField
            size="small"
            placeholder={`Search ${config.pluralDisplayName.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: searchTerm && (
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon />
                </IconButton>
              ),
            }}
          />
        </Box>
      )}

      {onRefresh && (
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );

  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {config.views.table.allowSelection && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedData.length}
              checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          </TableCell>
        )}
        {visibleFields.map((field) => (
          <TableCell
            key={field.key}
            align={getCellAlignment(field)}
            style={{ width: field.display?.width }}
          >
            {field.display?.sortable ? (
              <TableSortLabel
                active={sortConfig.field === field.key}
                direction={sortConfig.field === field.key ? sortConfig.order : 'asc'}
                onClick={() => handleSort(field.key)}
              >
                {field.label}
              </TableSortLabel>
            ) : (
              field.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const renderTableBody = () => (
    <TableBody>
      {paginatedData.map((item) => {
        const isSelected = selectedRows.some(
          row => row[config.primaryKey] === item[config.primaryKey]
        );

        return (
          <TableRow
            key={item[config.primaryKey]}
            hover
            selected={isSelected}
            onClick={() => handleRowClick(item)}
            sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {config.views.table.allowSelection && (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectRow(item, e.target.checked);
                  }}
                />
              </TableCell>
            )}
            {visibleFields.map((field) => (
              <TableCell
                key={field.key}
                align={getCellAlignment(field)}
              >
                {formatCellValue(item[field.key], field)}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  );

  // ---------- Main Render ----------

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {renderTableToolbar()}
        
        <TableContainer sx={{ flexGrow: 1 }}>
          <Table stickyHeader>
            {renderTableHeader()}
            {loading ? (
              <TableBody>
                <TableRow>
                  <TableCell 
                    colSpan={visibleFields.length + (config.views.table.allowSelection ? 1 : 0)}
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              renderTableBody()
            )}
          </Table>
        </TableContainer>

        {config.views.table.showPagination && (
          <TablePagination
            component="div"
            count={processedData.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </Paper>

      {/* Floating Action Button for Adding New Items */}
      {config.permissions?.canCreate && actions.some(action => action.type === 'create') && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={handleAddClick}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}; 