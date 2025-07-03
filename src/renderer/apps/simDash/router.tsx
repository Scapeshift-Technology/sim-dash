import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MLBSimulationView from '@/simDash/pages/MLBSimulationView/MLBSimulationView';
import MLBComparisonView from '@/simDash/pages/MLBComparisonView/MLBComparisonView';
import MainLayout from '@/MainLayout';
import LeagueSidebar from '@/simDash/components/LeagueSidebar';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import LeaguesHomePage from '@/simDash/pages/LeaguesHomePage';
import LeagueDetailPage from '@/simDash/pages/LeagueDetailPage';

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
      <Route path="/profile" element={<MainLayout Sidebar={LeagueSidebar} children={<ProfilePage />} />} />
      <Route path="/settings" element={<MainLayout Sidebar={LeagueSidebar} children={<SettingsPage />} />} />
      
      {/* League routes */}
      <Route path="/leagues/:leagueName" element={<MainLayout Sidebar={LeagueSidebar} children={<LeagueDetailPage />} />} />
      <Route path="/leagues" element={<MainLayout Sidebar={LeagueSidebar} children={<LeaguesHomePage />} />} />
      
      {/* Default route - redirect to leagues home */}
      <Route path="/" element={<MainLayout Sidebar={LeagueSidebar} children={<LeaguesHomePage />} />} />
      <Route path="*" element={<MainLayout Sidebar={LeagueSidebar} children={<LeaguesHomePage />} />} />
    </Routes>
  )
};

export default SimDashRouter; 