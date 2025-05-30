import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Grid, Container, Alert } from '@mui/material';
import { HierarchicalNavigation, buildLedgerBreadcrumbs } from '@/accounting/components/entity/ledger/components/HierarchicalNavigation';
import { LedgerSubtypeCard } from '@/accounting/components/entity/ledger/components/LedgerSubtypeCard';
import { getImplementedSubtypes, getLedgerTypeConfig } from '@/accounting/components/entity/ledger/config';
import { LedgerType, LedgerSubtype } from '@/accounting/components/entity/ledger/types';
import { validateLedgerType } from '@/accounting/components/entity/ledger/utils/urlValidation';

export const LedgerTypePage: React.FC = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();

  // ---------- Validation ----------
  
  const ledgerType = useMemo(() => {
    return validateLedgerType(type, 'LedgerTypePage');
  }, [type]);

  // ---------- Data ----------

  const implementedSubtypes = useMemo(() => {
    if (!ledgerType) return [];
    return getImplementedSubtypes(ledgerType);
  }, [ledgerType]);

  const subtypeConfigs = useMemo(() => {
    return implementedSubtypes.map(subtype => ({
      subtype,
      config: getLedgerTypeConfig(ledgerType!, subtype)!,
    }));
  }, [ledgerType, implementedSubtypes]);

  const breadcrumbs = useMemo(() => {
    return buildLedgerBreadcrumbs(ledgerType, null, 'type');
  }, [ledgerType]);

  // ---------- Handlers ----------

  const handleSubtypeClick = useCallback((type: LedgerType, subtype: LedgerSubtype) => {
    navigate(`/ledgers/${type.toLowerCase()}/${subtype.toLowerCase()}`);
  }, [navigate]);

  // ---------- Render ----------

  if (!ledgerType) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Invalid ledger type. Please select Asset or Equity from the main ledgers page.
        </Alert>
      </Container>
    );
  }

  if (implementedSubtypes.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <HierarchicalNavigation breadcrumbs={breadcrumbs} />
        
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            {ledgerType} Ledgers Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {ledgerType} ledger types are not yet implemented. Check back later for updates.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HierarchicalNavigation breadcrumbs={breadcrumbs} />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {ledgerType} Ledgers
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Choose a {ledgerType.toLowerCase()} ledger type to manage
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {subtypeConfigs.map(({ subtype, config }) => (
          <Grid item xs={12} sm={6} md={4} key={subtype}>
            <LedgerSubtypeCard
              type={ledgerType}
              subtype={subtype}
              config={config}
              itemCount={0} // TODO: Get actual count from Redux state
              onSubtypeClick={handleSubtypeClick}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          {ledgerType} Ledger Types
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {ledgerType === 'Asset' 
            ? 'Asset ledgers help you track and manage valuable resources, accounts, and holdings.'
            : 'Equity ledgers manage ownership structures, partnerships, and shared investments.'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a specific ledger type above to view, create, and manage your {ledgerType.toLowerCase()} ledgers.
        </Typography>
      </Box>
    </Container>
  );
};

export default LedgerTypePage; 