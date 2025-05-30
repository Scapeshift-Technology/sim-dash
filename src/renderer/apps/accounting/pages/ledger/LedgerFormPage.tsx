import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Alert } from '@mui/material';
import { AppDispatch } from '@/store/store';
import { selectCurrentParty } from '@/store/slices/authSlice';
import {
  selectLedgerFormLoading,
  selectLedgerFormError,
  addLedgerItem,
  clearFormError,
} from '@/store/slices/ledgerSlice';
import { HierarchicalNavigation, buildLedgerBreadcrumbs } from '@/accounting/components/entity/ledger/components/HierarchicalNavigation';
import { LedgerForm } from '@/accounting/components/entity/ledger/components/LedgerForm';
import { getLedgerTypeConfig } from '@/accounting/components/entity/ledger/config';
import { LedgerType, LedgerSubtype } from '@/accounting/components/entity/ledger/types';
import { validateLedgerParams, generateErrorInfo } from '@/accounting/components/entity/ledger/utils/urlValidation';

export const LedgerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { type, subtype } = useParams<{ type: string; subtype: string }>();

  // ---------- Validation ----------
  
  const { ledgerType, ledgerSubtype } = useMemo(() => {
    return validateLedgerParams(type, subtype, 'LedgerFormPage');
  }, [type, subtype]);

  // ---------- Configuration ----------
  
  const config = useMemo(() => {
    if (!ledgerType || !ledgerSubtype) {
      console.log('[LedgerFormPage] No ledger type/subtype for config lookup:', { ledgerType, ledgerSubtype });
      return null;
    }
    
    const foundConfig = getLedgerTypeConfig(ledgerType, ledgerSubtype);
    console.log('[LedgerFormPage] Configuration lookup result:', { 
      ledgerType, 
      ledgerSubtype, 
      configFound: !!foundConfig,
      config: foundConfig 
    });
    
    return foundConfig;
  }, [ledgerType, ledgerSubtype]);

  // ---------- Selectors ----------
  
  const currentParty = useSelector(selectCurrentParty);
  const formLoading = useSelector(selectLedgerFormLoading);
  const formError = useSelector(selectLedgerFormError);

  // ---------- Computed Values ----------

  const breadcrumbs = useMemo(() => {
    const baseBreadcrumbs = buildLedgerBreadcrumbs(ledgerType, ledgerSubtype, 'list');
    if (config) {
      baseBreadcrumbs.push({
        label: `New ${config.displayName}`,
        path: `/ledgers/${type}/${subtype}/new`,
        current: true,
      });
    }
    return baseBreadcrumbs;
  }, [ledgerType, ledgerSubtype, config, type, subtype]);

  // ---------- Handlers ----------

  const handleSave = useCallback(async (formData: any) => {
    if (!currentParty || !ledgerType || !ledgerSubtype) return;

    try {
      await dispatch(addLedgerItem({
        party: currentParty,
        type: ledgerType,
        subtype: ledgerSubtype,
        data: formData,
      })).unwrap();

      // Navigate back to the list page on success
      navigate(`/ledgers/${type}/${subtype}`);
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Failed to create ledger item:', error);
    }
  }, [dispatch, currentParty, ledgerType, ledgerSubtype, navigate, type, subtype]);

  const handleCancel = useCallback(() => {
    // Clear form error when cancelling
    dispatch(clearFormError());
    navigate(`/ledgers/${type}/${subtype}`);
  }, [dispatch, navigate, type, subtype]);

  // ---------- Effects ----------

  // Clear form error when component unmounts
  React.useEffect(() => {
    return () => {
      dispatch(clearFormError());
    };
  }, [dispatch]);

  // ---------- Render ----------

  if (!ledgerType || !ledgerSubtype || !config) {
    const errorInfo = generateErrorInfo(type, subtype, ledgerType, ledgerSubtype, config);
    console.error('[LedgerFormPage] Rendering error page with details:', errorInfo);
    
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
          Please select a party to create ledgers.
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <HierarchicalNavigation breadcrumbs={breadcrumbs} />
      
      <LedgerForm
        type={ledgerType}
        subtype={ledgerSubtype}
        mode="create"
        loading={formLoading}
        error={formError}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </>
  );
};

export default LedgerFormPage; 