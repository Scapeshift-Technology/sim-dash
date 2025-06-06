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
  Fab,
  TextField,
  Box,
  Typography,
  IconButton,
  Toolbar,
  Tooltip,
  CircularProgress,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { LedgerTableProps, LedgerItem } from '../types';
import { getLedgerTypeConfig } from '../config';

type Order = 'asc' | 'desc';

interface SortConfig {
  field: string;
  order: Order;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  type,
  subtype,
  items,
  loading = false,
  error = null,
  onRefresh,
  onRowClick,
  onAddNew,
  onDelete,
}) => {
  // ---------- State ----------
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: '', order: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedItem, setSelectedItem] = useState<LedgerItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ---------- Configuration ----------
  const config = getLedgerTypeConfig(type, subtype);
  
  // ---------- Computed Values ----------
  
  // Get all columns to display (base + additional fields)
  const displayColumns = useMemo(() => {
    const baseColumns = [
      { key: 'Ledger', label: 'Ledger Name', sortable: true, searchable: true },
    ];
    
    if (config) {
      const additionalColumns = config.database.fetchColumns.select
        .filter(col => col !== 'Ledger' && col !== 'Party')
        .map(col => ({
          key: col,
          label: col.replace(/([A-Z])/g, ' $1').trim(),
          sortable: true,
          searchable: true,
        }));
      
      return [...baseColumns, ...additionalColumns];
    }
    
    return baseColumns;
  }, [config]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      const searchableColumns = displayColumns.filter(col => col.searchable);
      
      filtered = items.filter(item =>
        searchableColumns.some(col => {
          const value = item[col.key as keyof LedgerItem];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortConfig.field) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.field as keyof LedgerItem];
        const bVal = b[sortConfig.field as keyof LedgerItem];
        
        if (aVal === bVal) return 0;
        
        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;
        
        return sortConfig.order === 'desc' ? comparison * -1 : comparison;
      });
    }

    return filtered;
  }, [items, searchTerm, sortConfig, displayColumns]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, page, rowsPerPage]);

  // ---------- Handlers ----------

  const handleSort = useCallback((field: string) => {
    const column = displayColumns.find(col => col.key === field);
    if (!column?.sortable) return;

    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, [displayColumns]);

  const handleRowClick = useCallback((item: LedgerItem) => {
    // Removed automatic row click navigation
  }, []);

  const handleDelete = useCallback((item: LedgerItem) => {
    setSelectedItem(item);
    setConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (selectedItem && onDelete) {
      onDelete(selectedItem);
    }
    setSelectedItem(null);
    setConfirmDelete(false);
  }, [selectedItem, onDelete]);

  const formatCellValue = useCallback((value: any, columnKey: string) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Add any specific formatting logic here based on column type
    return String(value);
  }, []);

  // ---------- Render Helpers ----------

  const renderTableToolbar = () => (
    <Toolbar sx={{ pl: 2, pr: 1 }}>
      <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
        {config?.pluralDisplayName || 'Ledgers'}
        {` (${processedData.length})`}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            ),
          }}
          sx={{ width: 250 }}
        />
        
        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Toolbar>
  );

  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {displayColumns.map((column) => (
          <TableCell key={column.key}>
            {column.sortable ? (
              <TableSortLabel
                active={sortConfig.field === column.key}
                direction={sortConfig.field === column.key ? sortConfig.order : 'asc'}
                onClick={() => handleSort(column.key)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
        {onDelete && (
          <TableCell>
            Actions
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );

  const renderTableBody = () => (
    <TableBody>
      {paginatedData.map((item) => (
        <TableRow key={item.Ledger}>
          {displayColumns.map((column) => (
            <TableCell key={column.key}>
              {formatCellValue(item[column.key as keyof LedgerItem], column.key)}
            </TableCell>
          ))}
          {onDelete && (
            <TableCell>
              <Tooltip title="Delete">
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </TableCell>
          )}
        </TableRow>
      ))}
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
                    colSpan={displayColumns.length + (onDelete ? 1 : 0)}
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

        {processedData.length > rowsPerPage && (
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
      {onAddNew && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={onAddNew}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Confirmation Dialog for Deleting */}
      <Dialog
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setSelectedItem(null);
        }}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the ledger "{selectedItem?.Ledger}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setConfirmDelete(false);
              setSelectedItem(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LedgerTable; 