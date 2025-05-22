import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MLBSimulationView from '@/simDash/pages/MLBSimulationView/MLBSimulationView';
import MainLayout from '@/layouts/MainLayout';
import TabViewContainers from '@/simDash/containers/TabViewContainers';
import Sidebar from '@/simDash/components/Sidebar';

const SimDashRouter: React.FC = () => {
  const isSimulationWindow = window.location.hash.includes('sim-results');

  if (isSimulationWindow) return (
    <Routes>
      <Route path="/sim-results" element={<MLBSimulationView />} />
    </Routes>
  )

  return (
    <Routes>
      <Route path="/*" element={<MainLayout Sidebar={Sidebar} children={<TabViewContainers />} />} />
    </Routes>
  )
};

export default SimDashRouter; 