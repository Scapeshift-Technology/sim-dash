import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Container } from '@mui/material';
import { HierarchicalNavigation, buildLedgerBreadcrumbs } from '@/accounting/components/entity/ledger/components/HierarchicalNavigation';
import { LedgerTypeCard } from '@/accounting/components/entity/ledger/components/LedgerTypeCard';
import { getAssetSubtypes, getEquitySubtypes } from '@/accounting/components/entity/ledger/config';
import { LedgerType } from '@/accounting/components/entity/ledger/types';

export const LedgerMainPage: React.FC = () => {
  const navigate = useNavigate();

  // ---------- Handlers ----------

  const handleTypeClick = useCallback((type: LedgerType) => {
    navigate(`/ledgers/${type.toLowerCase()}`);
  }, [navigate]);

  // ---------- Data ----------

  const assetSubtypes = getAssetSubtypes();
  const equitySubtypes = getEquitySubtypes();

  const breadcrumbs = buildLedgerBreadcrumbs(null, null, 'main');

  // ---------- Render ----------

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HierarchicalNavigation breadcrumbs={breadcrumbs} />
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <LedgerTypeCard
            type="Asset"
            subtypes={assetSubtypes}
            onTypeClick={handleTypeClick}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LedgerTypeCard
            type="Equity"
            subtypes={equitySubtypes}
            onTypeClick={handleTypeClick}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          About Ledgers
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Ledgers help you organize and track different types of financial accounts and agreements. 
          Asset ledgers track valuable resources like bankrolls and trading accounts, while equity 
          ledgers manage ownership structures and partnerships.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a ledger type above to get started, or contact support if you need help setting up your ledgers.
        </Typography>
      </Box>
    </Container>
  );
};

export default LedgerMainPage; 