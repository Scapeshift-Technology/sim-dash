import { useEffect, useState } from 'react';
import { useDispatch, useStore, useSelector } from 'react-redux';
import AppRouter from './router';
import { selectIsAuthenticated, selectUsername, logoutUser, setConnectionStatus } from '@/store/slices/authSlice';
import { createMLBWebSocketManager } from './apps/simDash/services/mlbWebSocketManager';
import type { AppDispatch, RootState } from '@/store/store';

function App() {
  // ---------- Hooks ----------
  
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();

  // Reconnection logic (moved from useReconnection hook)
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const username = useSelector(selectUsername);
  const [reconnectAttempted, setReconnectAttempted] = useState(false);

  useEffect(() => {
    const attemptReconnection = async () => {
      if (isAuthenticated && username && !reconnectAttempted) {
        console.log('🔄 Attempting database reconnection for user:', username);
        setReconnectAttempted(true);
        dispatch(setConnectionStatus('attempting'));

        try {
          const result = await window.electronAPI.attemptReconnect?.({ username });
          console.log('🔄 Result:', result);
          
          if (result?.success) {
            console.log('✅ Database reconnection successful');
            dispatch(setConnectionStatus('connected'));
          } else {
            console.log('❌ Database reconnection failed');
            dispatch(setConnectionStatus('failed'));
            dispatch(logoutUser());
          }
        } catch (error) {
          console.error('💥 Reconnection attempt threw error:', error);
          dispatch(setConnectionStatus('failed'));
          dispatch(logoutUser());
        }
      }
    };

    attemptReconnection();
  }, []); // Only runs when app loads

  // Initialize WebSocket manager at app level
  useEffect(() => {
    const manager = createMLBWebSocketManager(dispatch, store);
    
    // Cleanup on unmount (though this rarely happens in practice)
    return () => {
      manager.destroy();
    };
  }, [dispatch, store]);

  // ---------- Content ----------

  return <AppRouter />;
}

export default App; 