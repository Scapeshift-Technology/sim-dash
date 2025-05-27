import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '@/store/store';
import { selectCurrentParty } from '@/store/slices/authSlice';
import {
  selectCounterpartiesFormLoading,
  selectCounterpartiesFormError,
  addCounterparty,
  fetchCounterparties,
  clearFormError,
} from '@/store/slices/counterpartiesSlice';
import { EntityForm } from '../components/entity/generic/EntityForm';
import { counterpartyConfig } from '../components/entity/counterparty/config';
import { Counterparty } from '@/store/slices/counterpartiesSlice';

export const CounterpartyFormPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Selectors
  const currentParty = useSelector(selectCurrentParty);
  const formLoading = useSelector(selectCounterpartiesFormLoading);
  const formError = useSelector(selectCounterpartiesFormError);

  // ---------- Effects ----------

  // Clear form errors when component mounts
  useEffect(() => {
    dispatch(clearFormError());
  }, [dispatch]);

  // Clear form errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearFormError());
    };
  }, [dispatch]);

  // ---------- Handlers ----------

  const handleSave = useCallback(async (formData: Counterparty) => {
    if (!currentParty) {
      console.error('No current party selected');
      return;
    }

    try {
      // Add the new counterparty
      await dispatch(addCounterparty({
        party: currentParty,
        counterparty: formData.Counterparty,
        creditLimit: formData.CreditLimit || 0,
      })).unwrap();

      // Refresh the counterparties list
      await dispatch(fetchCounterparties(currentParty));

      // Navigate back to the list
      navigate('/counterparties');
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Failed to add counterparty:', error);
    }
  }, [dispatch, currentParty, navigate]);

  const handleCancel = useCallback(() => {
    dispatch(clearFormError());
    navigate('/counterparties');
  }, [dispatch, navigate]);

  // ---------- Render ----------

  if (!currentParty) {
    return (
      <div style={{ padding: 24 }}>
        <p>Please select a party to add counterparties.</p>
      </div>
    );
  }

  // Prepare initial data with current party
  const initialData: Partial<Counterparty> = {
    Party: currentParty,
    CreditLimit: 0,
  };

  return (
    <EntityForm<Counterparty>
      config={counterpartyConfig}
      initialData={initialData}
      loading={formLoading}
      error={formError}
      onSave={handleSave}
      onCancel={handleCancel}
      mode="create"
    />
  );
}; 