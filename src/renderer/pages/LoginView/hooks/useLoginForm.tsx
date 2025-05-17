import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { loginUser, selectAuthState } from '@/store/slices/authSlice';
import { resetProfileOperationStates } from '@/store/slices/profilesSlice';
import type { Profile } from '@/types/profiles';
import { useStatusMessages } from './useStatusMessages';

interface LoginFormState {
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
}

interface UseLoginFormReturn {
    // Form state
    formState: LoginFormState;
    setHost: (value: string) => void;
    setPort: (value: string) => void;
    setDatabase: (value: string) => void;
    setUser: (value: string) => void;
    setPassword: (value: string) => void;
    
    // Form actions
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    resetForm: () => void;
    populateFromProfile: (profile: Profile | null) => void;
    
    // Auth state
    isLoading: boolean;
    error: string | null;
}

const DEFAULT_FORM_STATE: LoginFormState = {
    host: 'localhost',
    port: '1433',
    database: '',
    user: '',
    password: ''
};

export function useLoginForm(): UseLoginFormReturn {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector(selectAuthState);
    const { error, setError, clearError } = useStatusMessages({ errorDuration: 5000 });

    // Form state
    const [formState, setFormState] = useState<LoginFormState>(DEFAULT_FORM_STATE);

    const updateFormAndResetStates = useCallback((updater: (prev: LoginFormState) => LoginFormState) => {
        setFormState(updater);
        dispatch(resetProfileOperationStates());
    }, [dispatch]);

    const setHost = (value: string) => updateFormAndResetStates(prev => ({ ...prev, host: value }));
    const setPort = (value: string) => updateFormAndResetStates(prev => ({ ...prev, port: value }));
    const setDatabase = (value: string) => updateFormAndResetStates(prev => ({ ...prev, database: value }));
    const setUser = (value: string) => updateFormAndResetStates(prev => ({ ...prev, user: value }));
    const setPassword = (value: string) => updateFormAndResetStates(prev => ({ ...prev, password: value }));

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        clearError();
        dispatch(loginUser({
            host: formState.host,
            port: formState.port,
            database: formState.database,
            user: formState.user,
            password: formState.password
        }))
        .unwrap()
        .catch((err) => {
            setError(err.message || 'Login failed');
        });
    };

    const resetForm = useCallback(() => {
        setFormState(DEFAULT_FORM_STATE);
        clearError();
    }, [clearError]);

    const populateFromProfile = useCallback((profile: Profile | null) => {
        if (profile) {
            setFormState({
                host: profile.host || DEFAULT_FORM_STATE.host,
                port: (profile.port || DEFAULT_FORM_STATE.port).toString(),
                database: profile.database || DEFAULT_FORM_STATE.database,
                user: profile.user || DEFAULT_FORM_STATE.user,
                password: profile.password || DEFAULT_FORM_STATE.password
            });
        } else {
            resetForm();
        }
    }, [resetForm]);

    return {
        formState,
        setHost,
        setPort,
        setDatabase,
        setUser,
        setPassword,
        handleSubmit,
        resetForm,
        populateFromProfile,
        isLoading,
        error
    };
}
