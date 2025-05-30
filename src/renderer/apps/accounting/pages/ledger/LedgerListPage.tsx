import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Alert } from '@mui/material';
import { AppDispatch, RootState } from '@/store/store';
import { selectCurrentParty } from '@/store/slices/authSlice';
import {
  selectLedgerItems,
  selectLedgerLoading,
  selectLedgerError,
  fetchLedgerItems,
  clearError,
  clearLedgerItems,
  deleteLedgerItem,
} from '@/store/slices/ledgerSlice';
import { HierarchicalNavigation, buildLedgerBreadcrumbs } from '@/accounting/components/entity/ledger/components/HierarchicalNavigation';
import { LedgerTable } from '@/accounting/components/entity/ledger/components/LedgerTable';
import { getLedgerTypeConfig, getLedgerKey } from '@/accounting/components/entity/ledger/config';
import { LedgerType, LedgerSubtype, LedgerItem } from '@/accounting/components/entity/ledger/types';
import { validateLedgerParams, generateErrorInfo } from '@/accounting/components/entity/ledger/utils/urlValidation';

export const LedgerListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { type, subtype } = useParams<{ type: string; subtype: string }>();
  const previousPartyRef = useRef<string | null>(null);

  // ---------- Validation ----------
  
  const { ledgerType, ledgerSubtype } = useMemo(() => {
    return validateLedgerParams(type, subtype, 'LedgerListPage');
  }, [type, subtype]);

  // ---------- Configuration ----------
  
  const config = useMemo(() => {
    if (!ledgerType || !ledgerSubtype) {
      console.log('[LedgerListPage] No ledger type/subtype for config lookup:', { ledgerType, ledgerSubtype });
      return null;
    }
    
    const foundConfig = getLedgerTypeConfig(ledgerType, ledgerSubtype);
    console.log('[LedgerListPage] Configuration lookup result:', { 
      ledgerType, 
      ledgerSubtype, 
      configFound: !!foundConfig,
      config: foundConfig 
    });
    
    return foundConfig;
  }, [ledgerType, ledgerSubtype]);

  // ---------- Selectors ----------
  
  const currentParty = useSelector(selectCurrentParty);
  const items = useSelector((state: RootState) => 
    ledgerType && ledgerSubtype 
      ? selectLedgerItems(state, ledgerType, ledgerSubtype)
      : []
  );
  const loading = useSelector((state: RootState) => 
    ledgerType && ledgerSubtype 
      ? selectLedgerLoading(state, ledgerType, ledgerSubtype)
      : false
  );
  const error = useSelector((state: RootState) => 
    ledgerType && ledgerSubtype 
      ? selectLedgerError(state, ledgerType, ledgerSubtype)
      : null
  );

  // ---------- Effects ----------

  // Clear items when party changes
  useEffect(() => {
    if (previousPartyRef.current && previousPartyRef.current !== currentParty && ledgerType && ledgerSubtype) {
      const key = getLedgerKey(ledgerType, ledgerSubtype);
      dispatch(clearLedgerItems(key));
    }
    previousPartyRef.current = currentParty;
  }, [dispatch, currentParty, ledgerType, ledgerSubtype]);

  // Fetch items when party and type/subtype are available
  useEffect(() => {
    if (currentParty && ledgerType && ledgerSubtype) {
      dispatch(fetchLedgerItems({ 
        party: currentParty, 
        type: ledgerType, 
        subtype: ledgerSubtype 
      }));
    }
  }, [dispatch, currentParty, ledgerType, ledgerSubtype]);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      if (ledgerType && ledgerSubtype) {
        const key = getLedgerKey(ledgerType, ledgerSubtype);
        dispatch(clearError(key));
      }
    };
  }, [dispatch, ledgerType, ledgerSubtype]);

  // ---------- Computed Values ----------

  const breadcrumbs = useMemo(() => {
    return buildLedgerBreadcrumbs(ledgerType, ledgerSubtype, 'list');
  }, [ledgerType, ledgerSubtype]);

  // ---------- Handlers ----------

  const handleRefresh = useCallback(() => {
    if (currentParty && ledgerType && ledgerSubtype) {
      dispatch(fetchLedgerItems({ 
        party: currentParty, 
        type: ledgerType, 
        subtype: ledgerSubtype 
      }));
    }
  }, [dispatch, currentParty, ledgerType, ledgerSubtype]);

  const handleAddNew = useCallback(() => {
    navigate(`/ledgers/${type}/${subtype}/new`);
  }, [navigate, type, subtype]);

  const handleDelete = useCallback((item: LedgerItem) => {
    if (currentParty && ledgerType && ledgerSubtype) {
      dispatch(deleteLedgerItem({ 
        party: currentParty, 
        type: ledgerType, 
        subtype: ledgerSubtype,
        ledgerName: item.Ledger
      }));
    }
  }, [dispatch, currentParty, ledgerType, ledgerSubtype]);

  // Check if current ledger type should allow deletion
  const isDeletable = useCallback(() => {
    // Asset Counterparty ledgers should not be deletable
    return !(ledgerType === 'Asset' && ledgerSubtype === 'Counterparty');
  }, [ledgerType, ledgerSubtype]);

  // ---------- Render ----------

  if (!ledgerType || !ledgerSubtype || !config) {
    const errorInfo = generateErrorInfo(type, subtype, ledgerType, ledgerSubtype, config);
    console.error('[LedgerListPage] Rendering error page with details:', errorInfo);
    
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Invalid ledger type or subtype. Please navigate from the main ledgers page.
          <br />
          <small>
            Debug info - URL: /{type}/{subtype} | 
            Processed: {ledgerType}/{ledgerSubtype} | 
            Config: {config ? 'Found' : 'Not Found'}
          </small>
        </Alert>
      </Container>
    );
  }

  if (!currentParty) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <HierarchicalNavigation breadcrumbs={breadcrumbs} />
        <Alert severity="info" sx={{ mt: 2 }}>
          Please select a party to view ledgers.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HierarchicalNavigation breadcrumbs={breadcrumbs} />
      
      <LedgerTable
        type={ledgerType}
        subtype={ledgerSubtype}
        items={items}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onAddNew={handleAddNew}
        onDelete={isDeletable() ? handleDelete : undefined}
      />
    </Container>
  );
};

export default LedgerListPage; 