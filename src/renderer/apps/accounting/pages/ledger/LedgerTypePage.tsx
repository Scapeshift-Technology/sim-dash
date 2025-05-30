import React, { useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Grid, Container, Alert } from '@mui/material';
import { AppDispatch, RootState } from '@/store/store';
import { selectCurrentParty } from '@/store/slices/authSlice';
import { selectLedgerItemCount, fetchLedgerItems } from '@/store/slices/ledgerSlice';
import { HierarchicalNavigation, buildLedgerBreadcrumbs } from '@/accounting/components/entity/ledger/components/HierarchicalNavigation';
import { LedgerSubtypeCard } from '@/accounting/components/entity/ledger/components/LedgerSubtypeCard';
import { getImplementedSubtypes, getLedgerTypeConfig } from '@/accounting/components/entity/ledger/config';
import { LedgerType, LedgerSubtype, LedgerTypeConfig } from '@/accounting/components/entity/ledger/types';
import { validateLedgerType } from '@/accounting/components/entity/ledger/utils/urlValidation';

// Helper component that uses hooks properly for each subtype card
const LedgerSubtypeCardWrapper: React.FC<{
  type: LedgerType;
  subtype: LedgerSubtype;
  config: LedgerTypeConfig;
  currentParty: string | null;
  onSubtypeClick: (type: LedgerType, subtype: LedgerSubtype) => void;
}> = ({ type, subtype, config, currentParty, onSubtypeClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get the count for this specific subtype
  const itemCount = useSelector((state: RootState) => 
    currentParty ? selectLedgerItemCount(state, type, subtype) : 0
  );

  // Fetch items for this subtype if we have a current party but no items loaded
  useEffect(() => {
    if (currentParty && itemCount === 0) {
      dispatch(fetchLedgerItems({ 
        party: currentParty, 
        type, 
        subtype 
      }));
    }
  }, [dispatch, currentParty, type, subtype, itemCount]);

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <LedgerSubtypeCard
        type={type}
        subtype={subtype}
        config={config}
        itemCount={itemCount}
        onSubtypeClick={onSubtypeClick}
      />
    </Grid>
  );
};

export const LedgerTypePage: React.FC = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();

  // ---------- Selectors ----------
  
  const currentParty = useSelector(selectCurrentParty);

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
          <LedgerSubtypeCardWrapper
            key={subtype}
            type={ledgerType}
            subtype={subtype}
            config={config}
            currentParty={currentParty}
            onSubtypeClick={handleSubtypeClick}
          />
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