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
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { EntityFormProps, EntityData, FieldConfig, ValidationRule } from './types';

interface FormErrors {
  [key: string]: string;
}

export const EntityForm = <T extends EntityData>({
  config,
  initialData = {},
  loading = false,
  error = null,
  onSave,
  onCancel,
  mode,
}: EntityFormProps<T>) => {
  // ---------- State ----------
  const [formData, setFormData] = useState<Partial<T>>(() => ({
    ...initialData,
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ---------- Computed Values ----------
  
  // Filter fields that should be shown in form
  const formFields = useMemo(() => 
    config.fields.filter(field => field.showInForm !== false),
    [config.fields]
  );

  // Group fields by sections if configured
  const fieldSections = useMemo(() => {
    if (config.views.form.sections?.length) {
      return config.views.form.sections.map(section => ({
        ...section,
        fields: section.fields.map(fieldKey => 
          formFields.find(field => field.key === fieldKey)
        ).filter(Boolean) as FieldConfig[]
      }));
    }
    
    // Default: all fields in one section
    return [{
      title: mode === 'create' ? `New ${config.displayName}` : `Edit ${config.displayName}`,
      fields: formFields,
      defaultExpanded: true
    }];
  }, [config.views.form.sections, formFields, config.displayName, mode]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const hasErrors = Object.keys(errors).some(key => errors[key]);
    const requiredFields = formFields.filter(field => field.required);
    const hasAllRequired = requiredFields.every(field => {
      const value = formData[field.key];
      return value !== undefined && value !== null && value !== '';
    });
    
    return !hasErrors && hasAllRequired;
  }, [errors, formFields, formData]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    return Object.keys(formData).some(key => {
      return formData[key] !== initialData[key];
    });
  }, [formData, initialData]);

  // ---------- Validation ----------

  const validateField = useCallback((field: FieldConfig, value: any): string => {
    if (!field.validation) return '';

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
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
    
    formFields.forEach(field => {
      const error = validateField(field, formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formFields, formData, validateField]);

  // ---------- Handlers ----------

  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    setFormData(prev => ({
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
      onSave(formData as T);
    }
  }, [formData, onSave, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // ---------- Field Renderers ----------

  const renderField = useCallback((field: FieldConfig) => {
    const value = formData[field.key] ?? '';
    const hasError = touched[field.key] && errors[field.key];
    const editor = field.editor || { type: 'text' };

    const commonProps = {
      fullWidth: true,
      error: !!hasError,
      helperText: hasError || field.editor?.placeholder,
      disabled: loading,
      onBlur: () => handleFieldBlur(field),
    };

    switch (editor.type) {
      case 'text':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            multiline={editor.multiline}
            rows={editor.rows}
            placeholder={editor.placeholder}
            required={field.required}
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
            inputProps={{
              min: editor.min,
              max: editor.max,
              step: editor.step,
            }}
            required={field.required}
          />
        );

      case 'money':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{
              min: 0,
              step: 0.01,
            }}
            required={field.required}
          />
        );

      case 'dropdown':
        return (
          <FormControl {...commonProps}>
            <FormLabel>{field.label}</FormLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select {field.label}</em>
              </MenuItem>
              {editor.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText error>{hasError}</FormHelperText>}
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            InputLabelProps={{ shrink: true }}
            required={field.required}
          />
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                disabled={loading}
              />
            }
            label={field.label}
          />
        );

      default:
        return (
          <TextField
            {...commonProps}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            required={field.required}
          />
        );
    }
  }, [formData, touched, errors, loading, handleFieldChange, handleFieldBlur]);

  const renderSection = useCallback((section: any, index: number) => {
    if (section.collapsible) {
      return (
        <Accordion key={section.title} defaultExpanded={section.defaultExpanded}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{section.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {section.fields.map((field: FieldConfig) => (
                <Grid item xs={12} md={config.views.form.layout === 'two-column' ? 6 : 12} key={field.key}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      );
    }

    return (
      <Box key={section.title}>
        {index > 0 && <Divider sx={{ my: 3 }} />}
        <Typography variant="h6" gutterBottom>
          {section.title}
        </Typography>
        <Grid container spacing={3}>
          {section.fields.map((field: FieldConfig) => (
            <Grid item xs={12} md={config.views.form.layout === 'two-column' ? 6 : 12} key={field.key}>
              {renderField(field)}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }, [config.views.form.layout, renderField]);

  // ---------- Effects ----------

  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData]);

  // ---------- Main Render ----------

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          {config.pluralDisplayName}
        </Link>
        <Typography color="text.primary">
          {mode === 'create' ? 'New' : 'Edit'}
        </Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {fieldSections.map((section, index) => renderSection(section, index))}

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {config.views.form.showCancelButton !== false && (
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            )}
            
            {config.views.form.showSaveButton !== false && (
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !isFormValid || (mode === 'edit' && !hasChanges)}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
}; 