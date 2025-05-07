import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MLBSimulationView from '@/pages/MLBSimulationView';

const SimulationRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/sim-results" element={<MLBSimulationView />} />
    </Routes>
  );
};

export default SimulationRoutes; 