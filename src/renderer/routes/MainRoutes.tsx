import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import LoginView from '@/pages/LoginView';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

const MainRoutes: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <Routes>
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
};

export default MainRoutes; 