import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectUsername } from '../../store/slices/authSlice';

const DashboardPage: React.FC = () => {
  const username = useAppSelector(selectUsername);

  return (
    <div>
      <h1>Hello {username}</h1>
    </div>
  );
};

export default DashboardPage; 