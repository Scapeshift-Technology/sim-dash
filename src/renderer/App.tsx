import React from 'react';
import { useSelector } from 'react-redux';
import LoginView from '@components/LoginView';
import MainLayout from '@components/MainLayout';
import { selectIsAuthenticated } from '@store/slices/authSlice';

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <>
      {isAuthenticated ? <MainLayout /> : <LoginView />}
    </>
  );
}

export default App; 