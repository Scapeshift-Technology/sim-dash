import React from 'react';
import { HashRouter } from 'react-router-dom';
import MainRoutes from './MainRoutes';
import SimulationRoutes from './SimulationRoutes';

const AppRouter: React.FC = () => {
  // Check hash for windowId instead of search params
  const isSimulationWindow = window.location.hash.includes('sim-results');

  return (
    <HashRouter>
      {isSimulationWindow ? <SimulationRoutes /> : <MainRoutes />}
    </HashRouter>
  );
};

export default AppRouter; 