import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectUsername, logoutUser, setConnectionStatus } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';

export const useReconnection = () => {
  const dispatch = useDispatch<AppDispatch>();

  // ---------- State ----------

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const username = useSelector(selectUsername);
  const [reconnectAttempted, setReconnectAttempted] = useState(false);

  // ---------- Effects ----------

  useEffect(() => {
    const attemptReconnection = async () => {
      if (isAuthenticated && username && !reconnectAttempted) {
        console.log('🔄 Attempting database reconnection for user:', username);
        setReconnectAttempted(true);
        dispatch(setConnectionStatus('attempting'));

        try {
          // Call the IPC handler we created
          const result = await window.electronAPI.attemptReconnect?.({ username });
          console.log('🔄 Result:', result);
          
          if (result?.success) {
            console.log('✅ Database reconnection successful');
            dispatch(setConnectionStatus('connected'));
          } else {
            console.log('❌ Database reconnection failed');
            dispatch(setConnectionStatus('failed'));
            // Force logout if reconnection fails
            dispatch(logoutUser());
          }
        } catch (error) {
          console.error('💥 Reconnection attempt threw error:', error);
          dispatch(setConnectionStatus('failed'));
          
          // Force logout on any error
          dispatch(logoutUser());
        }
      }
    };

    attemptReconnection();
  }, []);// Only runs when app loads
}; 
