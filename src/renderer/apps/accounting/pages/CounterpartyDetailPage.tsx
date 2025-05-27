import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { selectCurrentParty } from '@/store/slices/authSlice';
import {
  selectCounterparties,
  selectCounterpartiesLoading,
  selectCounterpartiesError,
} from '@/store/slices/counterpartiesSlice';
import { EntityDetail } from '../components/entity/generic/EntityDetail';
import { counterpartyConfig } from '../components/entity/counterparty/config';
import { Counterparty } from '@/store/slices/counterpartiesSlice';
import { Alert, Box } from '@mui/material';

export const CounterpartyDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Selectors
  const currentParty = useSelector(selectCurrentParty);
  const counterparties = useSelector(selectCounterparties);
  const loading = useSelector(selectCounterpartiesLoading);
  const error = useSelector(selectCounterpartiesError);

  // ---------- Find the specific counterparty ----------

  const counterparty = useMemo(() => {
    if (!id || !currentParty) {
      return null;
    }
    
    const decodedId = decodeURIComponent(id).trim();
    const trimmedCurrentParty = currentParty.trim();
    
    const foundCounterparty = counterparties.find(cp => {
      const trimmedParty = (cp.Party || '').trim();
      const trimmedCounterparty = (cp.Counterparty || '').trim();
      return trimmedParty === trimmedCurrentParty && trimmedCounterparty === decodedId;
    });
    
    return foundCounterparty;
  }, [id, currentParty, counterparties]);

  // ---------- Handlers ----------

  const handleBack = () => {
    navigate('/counterparties');
  };

  // Note: No edit handler since counterparties cannot be edited

  // ---------- Render ----------

  if (!currentParty) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please select a party to view counterparty details.
        </Alert>
      </Box>
    );
  }

  if (!id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Invalid counterparty ID.
        </Alert>
      </Box>
    );
  }

  // Show loading if we're still fetching data and don't have any counterparties yet
  if (loading && counterparties.length === 0) {
    return (
      <EntityDetail<Counterparty>
        config={counterpartyConfig}
        data={{} as Counterparty}
        loading={true}
        onBack={handleBack}
      />
    );
  }

  // Only show "not found" if we have loaded data but the specific counterparty doesn't exist
  if (!loading && counterparties.length > 0 && !counterparty) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Counterparty "{decodeURIComponent(id)}" not found.
        </Alert>
      </Box>
    );
  }

  // Show loading state if we don't have the counterparty yet (either still loading or not found yet)
  if (!counterparty) {
    return (
      <EntityDetail<Counterparty>
        config={counterpartyConfig}
        data={{} as Counterparty}
        loading={true}
        onBack={handleBack}
      />
    );
  }

  return (
    <EntityDetail<Counterparty>
      config={counterpartyConfig}
      data={counterparty}
      loading={loading}
      error={error}
      onBack={handleBack}
      // Note: No onEdit handler since counterparties cannot be edited
    />
  );
}; 