import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  FormControl,
  FormLabel,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { selectCurrentParty } from '@/store/slices/authSlice';
import { 
  selectCounterpartiesByParty, 
  fetchCounterparties 
} from '@/store/slices/counterpartiesSlice';
import { LedgerFormProps, FieldConfig, ValidationRule } from '../types';
import { getLedgerTypeConfig } from '../config';

interface FormErrors {
  [key: string]: string;
}

interface CounterpartyPercentage {
  Counterparty: string;
  Percent_Numerator: number;
  Percent_Denominator: number;
}

export const LedgerForm: React.FC<LedgerFormProps> = ({
  type,
  subtype,
  mode,
  initialData = {},
  loading = false,
  error = null,
  onSave,
  onCancel,
}) => {
  // ---------- Redux ----------
  const dispatch = useDispatch<AppDispatch>();
  const currentParty = useSelector(selectCurrentParty);
  const counterparties = useSelector(selectCounterpartiesByParty(currentParty || ''));
  
  // ---------- Configuration ----------
  const config = getLedgerTypeConfig(type, subtype);
  
  // ---------- State ----------
  const [formData, setFormData] = useState<any>(() => ({
    Ledger: '',
    ...initialData,
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ---------- Effects ----------
  
  // Fetch counterparties when component mounts or party changes
  useEffect(() => {
    if (currentParty) {
      dispatch(fetchCounterparties(currentParty));
    }
  }, [dispatch, currentParty]);

  // ---------- Computed Values ----------
  
  // Counterparty options for dropdown (including SELF)
  const counterpartyOptions = useMemo(() => {
    const options = [
      { value: 'SELF', label: 'SELF' },
      ...counterparties.map(cp => ({ value: cp.Counterparty, label: cp.Counterparty }))
    ];
    return options;
  }, [counterparties]);

  // Get available counterparty options for a specific row (excluding already selected ones)
  const getAvailableCounterpartyOptions = useCallback((currentRowIndex: number, fieldKey: string) => {
    const currentValues = formData[fieldKey] || [];
    const selectedCounterparties = currentValues
      .map((row: any, index: number) => index !== currentRowIndex ? row.Counterparty : null)
      .filter(Boolean);
    
    return counterpartyOptions.filter(option => 
      !selectedCounterparties.includes(option.value)
    );
  }, [formData, counterpartyOptions]);

  // All fields to display (common + additional)
  const allFields = useMemo(() => {
    const baseFields: FieldConfig[] = [
      {
        key: 'Ledger',
        label: 'Ledger Name',
        type: 'string',
        required: true,
        validation: [
          {
            type: 'required',
            message: 'Ledger name is required',
          },
          {
            type: 'maxLength',
            value: 20,
            message: 'Ledger name must be 20 characters or less',
          },
        ],
        editor: {
          type: 'text',
          placeholder: 'Enter ledger name',
        },
      },
    ];
    
    return [...baseFields, ...(config?.additionalFields || [])];
  }, [config]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const hasErrors = Object.keys(errors).some(key => errors[key]);
    const requiredFields = allFields.filter(field => field.required);
    const hasAllRequired = requiredFields.every(field => {
      const value = formData[field.key];
      if (field.type === 'table') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
    
    return !hasErrors && hasAllRequired;
  }, [errors, allFields, formData]);

  // ---------- Validation ----------

  const validateField = useCallback((field: FieldConfig, value: any): string => {
    if (!field.validation) return '';

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (field.type === 'table') {
            if (!Array.isArray(value) || value.length === 0) {
              return rule.message;
            }
          } else if (value === undefined || value === null || value === '') {
            return rule.message;
          }
          break;
        case 'minLength':
          if (typeof value === 'string' && value.length < rule.value) {
            return rule.message;
          }
          break;
        case 'maxLength':
          if (typeof value === 'string' && value.length > rule.value) {
            return rule.message;
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !rule.value.test(value)) {
            return rule.message;
          }
          break;
        case 'custom':
          if (rule.validator && !rule.validator(value)) {
            return rule.message;
          }
          break;
      }
    }

    return '';
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    
    allFields.forEach(field => {
      const error = validateField(field, formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [allFields, formData, validateField]);

  // ---------- Handlers ----------

  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldKey]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }));
    }
  }, [errors]);

  const handleFieldBlur = useCallback((field: FieldConfig) => {
    setTouched(prev => ({
      ...prev,
      [field.key]: true
    }));

    // Validate field on blur
    const error = validateField(field, formData[field.key]);
    setErrors(prev => ({
      ...prev,
      [field.key]: error
    }));
  }, [formData, validateField]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  }, [formData, onSave, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // ---------- Table Editor Handlers ----------

  const handleTableAdd = useCallback((fieldKey: string) => {
    const field = allFields.find(f => f.key === fieldKey);
    if (!field?.editor?.tableConfig) return;
    
    const newRow: any = {};
    field.editor.tableConfig.columns.forEach(col => {
      newRow[col.key] = col.type === 'number' ? 0 : '';
    });
    
    const currentValue = formData[fieldKey] || [];
    handleFieldChange(fieldKey, [...currentValue, newRow]);
  }, [allFields, formData, handleFieldChange]);

  const handleTableRemove = useCallback((fieldKey: string, index: number) => {
    const currentValue = formData[fieldKey] || [];
    const newValue = currentValue.filter((_: any, i: number) => i !== index);
    handleFieldChange(fieldKey, newValue);
  }, [formData, handleFieldChange]);

  const handleTableCellChange = useCallback((fieldKey: string, rowIndex: number, columnKey: string, value: any) => {
    const currentValue = formData[fieldKey] || [];
    const newValue = [...currentValue];
    newValue[rowIndex] = { ...newValue[rowIndex], [columnKey]: value };
    handleFieldChange(fieldKey, newValue);
  }, [formData, handleFieldChange]);

  // ---------- Field Renderers ----------

  const renderTextField = useCallback((field: FieldConfig) => {
    const value = formData[field.key] ?? '';
    const hasError = touched[field.key] && errors[field.key];
    const editor = field.editor || { type: 'text' };

    return (
      <TextField
        fullWidth
        label={field.label}
        value={value}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        onBlur={() => handleFieldBlur(field)}
        error={!!hasError}
        helperText={hasError || ''}
        placeholder={editor.placeholder}
        required={field.required}
        multiline={editor.type === 'text' && (editor as any).multiline}
        rows={editor.type === 'text' ? (editor as any).rows : undefined}
      />
    );
  }, [formData, touched, errors, handleFieldChange, handleFieldBlur]);

  const renderNumberField = useCallback((field: FieldConfig) => {
    const value = formData[field.key] ?? '';
    const hasError = touched[field.key] && errors[field.key];
    const editor = field.editor || { type: 'number' };

    return (
      <TextField
        fullWidth
        type="number"
        label={field.label}
        value={value}
        onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
        onBlur={() => handleFieldBlur(field)}
        error={!!hasError}
        helperText={hasError || ''}
        placeholder={editor.placeholder}
        required={field.required}
        inputProps={{
          min: editor.min,
          max: editor.max,
          step: editor.step,
        }}
      />
    );
  }, [formData, touched, errors, handleFieldChange, handleFieldBlur]);

  const renderTableField = useCallback((field: FieldConfig) => {
    const value = formData[field.key] || [];
    const hasError = touched[field.key] && errors[field.key];
    const tableConfig = field.editor?.tableConfig;
    
    if (!tableConfig) return null;

    const calculatePercentage = (item: CounterpartyPercentage) => {
      return ((item.Percent_Numerator / item.Percent_Denominator) * 100).toFixed(2);
    };

    const totalPercentage = value.reduce((sum: number, item: CounterpartyPercentage) => {
      return sum + (item.Percent_Numerator / item.Percent_Denominator) * 100;
    }, 0);

    return (
      <FormControl fullWidth error={!!hasError}>
        <FormLabel component="legend" sx={{ mb: 2 }}>
          {field.label}
          {field.required && <span style={{ color: 'red' }}> *</span>}
        </FormLabel>
        
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Counterparty Percentages</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`Total: ${totalPercentage.toFixed(2)}%`}
                color={Math.abs(totalPercentage - 100) < 0.01 ? 'success' : 'error'}
                variant="filled"
              />
              {tableConfig.allowAdd && (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleTableAdd(field.key)}
                  variant="outlined"
                >
                  Add Row
                </Button>
              )}
            </Box>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {tableConfig.columns.map((col) => (
                    <TableCell key={col.key}>{col.label}</TableCell>
                  ))}
                  <TableCell>Percentage</TableCell>
                  {tableConfig.allowRemove && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {value.map((row: any, index: number) => (
                  <TableRow key={index}>
                    {tableConfig.columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.type === 'dropdown' ? (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={row[col.key] || ''}
                              onChange={(e) => {
                                handleTableCellChange(field.key, index, col.key, e.target.value);
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select {col.label}</em>
                              </MenuItem>
                              {getAvailableCounterpartyOptions(index, field.key).map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            size="small"
                            fullWidth
                            type={col.type === 'number' ? 'number' : 'text'}
                            value={row[col.key] || ''}
                            onChange={(e) => {
                              const newValue = col.type === 'number' 
                                ? Number(e.target.value) 
                                : e.target.value;
                              handleTableCellChange(field.key, index, col.key, newValue);
                            }}
                            inputProps={col.type === 'number' ? { min: 0 } : {}}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Typography variant="body2">
                        {calculatePercentage(row)}%
                      </Typography>
                    </TableCell>
                    {tableConfig.allowRemove && (
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleTableRemove(field.key, index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {value.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tableConfig.columns.length + (tableConfig.allowRemove ? 2 : 1)} align="center">
                      <Typography color="text.secondary">
                        No counterparty percentages added
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        
        {hasError && <FormHelperText>{hasError}</FormHelperText>}
      </FormControl>
    );
  }, [formData, touched, errors, handleFieldBlur, handleTableAdd, handleTableRemove, handleTableCellChange]);

  const renderField = useCallback((field: FieldConfig) => {
    switch (field.type) {
      case 'string':
        return renderTextField(field);
      case 'number':
      case 'money':
        return renderNumberField(field);
      case 'table':
        return renderTableField(field);
      default:
        return renderTextField(field);
    }
  }, [renderTextField, renderNumberField, renderTableField]);

  // ---------- Main Render ----------

  if (!config) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Configuration not found for {type} {subtype}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {mode === 'create' ? `Add New ${config.displayName}` : `Edit ${config.displayName}`}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {config.description}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {allFields.map((field) => (
              <Grid item xs={12} key={field.key}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
            >
              <CancelIcon sx={{ mr: 1 }} />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isFormValid || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default LedgerForm; 