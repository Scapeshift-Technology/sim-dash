import React from 'react';
import { HashRouter } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import SimDashRouter from '@/simDash/router';
import LoginView from '@/simDash/pages/LoginView/LoginView';
import AccountingRouter from '@/accounting/router';
import { selectCurrentApp } from '@/store/slices/appSlice';

const AppContent: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentApp = useSelector(selectCurrentApp);
  const isSimulationWindow = window.location.hash.includes('sim-results');
  const isComparisonWindow = window.location.hash.includes('sim-comparison');

  // Distinct window types
  if (isSimulationWindow) return <SimDashRouter />;
  if (isComparisonWindow) return <SimDashRouter />;

  // Default window
  if (!isAuthenticated) return <LoginView />;

  // Apps
  if (currentApp === 'simDash') return <SimDashRouter />;
  if (currentApp === 'accounting') return <AccountingRouter />;
}

const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default AppRouter; 