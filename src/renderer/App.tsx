import { useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useReconnection } from './hooks/useReconnection';
import AppRouter from './routes/appRouter';
import { createMLBWebSocketManager } from './apps/simDash/services/mlbWebSocketManager';
import type { AppDispatch, RootState } from '@/store/store';

function App() {
  // ---------- Hooks ----------
  
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();

  useReconnection();

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