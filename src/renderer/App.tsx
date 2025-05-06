import React from 'react';
import { useSelector } from 'react-redux';
import LoginView from '@/pages/LoginView';
import MainLayout from '@/layouts/MainLayout';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <>
      {isAuthenticated ? <MainLayout /> : <LoginView />}
    </>
  );
}

export default App; 