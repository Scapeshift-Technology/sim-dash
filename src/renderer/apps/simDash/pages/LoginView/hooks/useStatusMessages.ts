import { useState, useEffect, useCallback } from 'react';

interface UseStatusMessagesProps {
    initialStatus?: string | null;
    initialError?: string | null;
    statusDuration?: number;
    errorDuration?: number;
}

interface UseStatusMessagesReturn {
    status: string | null;
    error: string | null;
    setStatus: (message: string | null) => void;
    setError: (message: string | null) => void;
    clearStatus: () => void;
    clearError: () => void;
    clearAll: () => void;
}

export function useStatusMessages({
    initialStatus = null,
    initialError = null,
    statusDuration = 3000,
    errorDuration = 5000
}: UseStatusMessagesProps = {}): UseStatusMessagesReturn {
    const [status, setStatusState] = useState<string | null>(initialStatus);
    const [error, setErrorState] = useState<string | null>(initialError);

    // Clear status after duration
    useEffect(() => {
        if (status && statusDuration > 0) {
            const timer = setTimeout(() => {
                setStatusState(null);
            }, statusDuration);
            return () => clearTimeout(timer);
        }
    }, [status, statusDuration]);

    // Clear error after duration
    useEffect(() => {
        if (error && errorDuration > 0) {
            const timer = setTimeout(() => {
                setErrorState(null);
            }, errorDuration);
            return () => clearTimeout(timer);
        }
    }, [error, errorDuration]);

    const setStatus = useCallback((message: string | null) => {
        setStatusState(message);
    }, []);

    const setError = useCallback((message: string | null) => {
        setErrorState(message);
    }, []);

    const clearStatus = useCallback(() => {
        setStatusState(null);
    }, []);

    const clearError = useCallback(() => {
        setErrorState(null);
    }, []);

    const clearAll = useCallback(() => {
        setStatusState(null);
        setErrorState(null);
    }, []);

    return {
        status,
        error,
        setStatus,
        setError,
        clearStatus,
        clearError,
        clearAll
    };
}
