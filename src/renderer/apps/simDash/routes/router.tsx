import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MLBSimulationView from '@/simDash/pages/MLBSimulationView/MLBSimulationView';
import MLBComparisonView from '@/simDash/pages/MLBComparisonView/MLBComparisonView';
import MainLayout from '@/layouts/MainLayout';
import TabViewContainers from '@/simDash/containers/TabViewContainers';
import Sidebar from '@/simDash/components/Sidebar';
import ProfilePage from '@/layouts/pages/ProfilePage';
import SettingsPage from '@/layouts/pages/SettingsPage';

const SimDashRouter: React.FC = () => {

  // ---------- Distinct window types ----------

  const isSimulationWindow = window.location.hash.includes('sim-results');
  const isComparisonWindow = window.location.hash.includes('sim-comparison');

  if (isSimulationWindow) return (
    <Routes>
      <Route path="/sim-results" element={<MLBSimulationView />} />
    </Routes>
  )

  if (isComparisonWindow) return (
    <Routes>
      <Route path="/sim-comparison" element={<MLBComparisonView />} />
    </Routes>
  )

  // ---------- Default window ----------

  return (
    <Routes>
      <Route path="/profile" element={<MainLayout Sidebar={Sidebar} children={<ProfilePage />} />} />
      <Route path="/settings" element={<MainLayout Sidebar={Sidebar} children={<SettingsPage />} />} />
      <Route path="/" element={<MainLayout Sidebar={Sidebar} children={<TabViewContainers />} />} />
      <Route path="*" element={<MainLayout Sidebar={Sidebar} children={<TabViewContainers />} />} />
    </Routes>
  )
};

export default SimDashRouter; 