import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { EntityDetailProps, EntityData, FieldConfig } from './types';

export const EntityDetail = <T extends EntityData>({
  config,
  data,
  loading = false,
  error = null,
  onEdit,
  onBack,
  actions = [],
}: EntityDetailProps<T>) => {
  // ---------- Computed Values ----------
  
  // Filter fields that should be shown in detail view
  const detailFields = useMemo(() => 
    config.fields.filter(field => field.showInDetail !== false),
    [config.fields]
  );

  // Get the display title for this entity
  const entityTitle = useMemo(() => {
    // Try to find a good title field (name, title, description, etc.)
    const titleField = detailFields.find(field => 
      ['name', 'title', 'description', 'label'].includes(field.key.toLowerCase())
    );
    
    if (titleField && data[titleField.key]) {
      return data[titleField.key];
    }
    
    // Fallback to primary key value
    return data[config.primaryKey] || 'Untitled';
  }, [detailFields, data, config.primaryKey]);

  // ---------- Handlers ----------

  const handleEdit = useCallback(() => {
    onEdit?.(data);
  }, [onEdit, data]);

  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  // ---------- Formatters ----------

  const formatFieldValue = useCallback((value: any, field: FieldConfig) => {
    if (value === null || value === undefined) return '-';

    switch (field.display?.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'percentage':
        return `${(Number(value) * 100).toFixed(2)}%`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        return String(value);
    }
  }, []);

  // ---------- Render Helpers ----------

  const renderField = useCallback((field: FieldConfig) => {
    const value = data[field.key];
    
    return (
      <Grid item xs={12} md={config.views.detail.layout === 'two-column' ? 6 : 12} key={field.key}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {field.label}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formatFieldValue(value, field)}
          </Typography>
        </Box>
      </Grid>
    );
  }, [data, config.views.detail.layout, formatFieldValue]);

  const renderFieldSection = useCallback(() => {
    if (config.views.detail.layout === 'two-column') {
      return (
        <Grid container spacing={3}>
          {detailFields.map(renderField)}
        </Grid>
      );
    }

    return (
      <Box>
        {detailFields.map((field, index) => (
          <Box key={field.key}>
            {index > 0 && <Divider sx={{ my: 2 }} />}
            {renderField(field)}
          </Box>
        ))}
      </Box>
    );
  }, [config.views.detail.layout, detailFields, renderField]);

  // ---------- Main Render ----------

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handleBack();
          }}
        >
          {config.pluralDisplayName}
        </Link>
        <Typography color="text.primary">
          {entityTitle}
        </Typography>
      </Breadcrumbs>

      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {entityTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {config.displayName}
              </Typography>
            </Box>
            
            {/* Status or additional header info can go here */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Example status chip - can be customized per entity */}
              <Chip 
                label="Active" 
                color="success" 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Details
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {renderFieldSection()}
      </Paper>

      {/* Related Data Section */}
      {config.views.detail.showRelatedData && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Related Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body2" color="text.secondary">
            Related data would be displayed here...
          </Typography>
        </Paper>
      )}

      {/* Floating Edit Button */}
      {config.views.detail.showEditButton && onEdit && config.permissions?.canUpdate && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={handleEdit}
        >
          <EditIcon />
        </Fab>
      )}
    </Box>
  );
}; 