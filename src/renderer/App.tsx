import { useReconnection } from './hooks/useReconnection';
import AppRouter from './routes/appRouter';

function App() {
  // ---------- Hooks ----------

  useReconnection();

  // ---------- Content ----------

  return <AppRouter />;
}

export default App; 