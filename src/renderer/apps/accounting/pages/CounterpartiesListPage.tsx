import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '@/store/store';
import { selectCurrentParty } from '@/store/slices/authSlice';
import {
  selectCounterparties,
  selectCounterpartiesLoading,
  selectCounterpartiesError,
  fetchCounterparties,
  clearError,
  clearCounterparties,
} from '@/store/slices/counterpartiesSlice';
import { EntityTable } from '../components/entity/generic/EntityTable';
import { EntityAction } from '../components/entity/generic/types';
import { counterpartyConfig } from '../components/entity/counterparty/config';
import { Counterparty } from '@/store/slices/counterpartiesSlice';

export const CounterpartiesListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const previousPartyRef = useRef<string | null>(null);
  
  // Selectors
  const currentParty = useSelector(selectCurrentParty);
  const counterparties = useSelector(selectCounterparties);
  const loading = useSelector(selectCounterpartiesLoading);
  const error = useSelector(selectCounterpartiesError);

  // ---------- Effects ----------

  // Clear counterparties when party changes
  useEffect(() => {
    if (previousPartyRef.current && previousPartyRef.current !== currentParty) {
      dispatch(clearCounterparties());
    }
    previousPartyRef.current = currentParty;
  }, [dispatch, currentParty]);

  // Fetch counterparties when party is available
  useEffect(() => {
    if (currentParty) {
      dispatch(fetchCounterparties(currentParty));
    }
  }, [dispatch, currentParty]);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // ---------- Handlers ----------

  const handleRefresh = useCallback(() => {
    if (currentParty) {
      dispatch(fetchCounterparties(currentParty));
    }
  }, [dispatch, currentParty]);

  const handleRowClick = useCallback((counterparty: Counterparty) => {
    navigate(`/counterparties/${encodeURIComponent(counterparty.Counterparty)}`);
  }, [navigate]);

  const handleAddNew = useCallback(() => {
    navigate('/counterparties/new');
  }, [navigate]);

  // ---------- Actions ----------

  const actions: EntityAction[] = [
    {
      type: 'create',
      label: 'Add Counterparty',
      icon: 'add',
      variant: 'contained',
      color: 'primary',
      onClick: handleAddNew,
    },
  ];

  // ---------- Render ----------

  if (!currentParty) {
    return (
      <div style={{ padding: 24 }}>
        <p>Please select a party to view counterparties.</p>
      </div>
    );
  }

  return (
    <EntityTable<Counterparty>
      config={counterpartyConfig}
      data={counterparties}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      onRowClick={handleRowClick}
      actions={actions}
    />
  );
}; 