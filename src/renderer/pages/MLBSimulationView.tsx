import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SimResultsMLB } from '@/types/bettingResults';

const MLBSimulationView: React.FC = () => {
    // ---------- State ----------
  const [simData, setSimData] = useState<SimResultsMLB | null>(null);
  const [awayTeamName, setAwayTeamName] = useState<string | null>(null);
  const [homeTeamName, setHomeTeamName] = useState<string | null>(null);
  const location = useLocation();
  const windowId = new URLSearchParams(location.search).get('windowId');

  // ---------- Effects ----------
  useEffect(() => {
    const fetchSimData = async () => {
      console.log('Location:', location);
      console.log('Window ID:', windowId);

      if (!windowId) {
        console.error('No windowId provided');
        return;
      }
      
      try {
        const data = await window.electronAPI.getSimData({ windowId });
        console.log('Fetched sim data:', data);
        setSimData(data.simData);
        setAwayTeamName(data.awayTeamName);
        setHomeTeamName(data.homeTeamName);
      } catch (error) {
        console.error('Error fetching sim data:', error);
      }
    };

    fetchSimData();
  }, [windowId, location]);

  if (!simData) {
    return <div>No simulation data provided</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3>{awayTeamName} vs {homeTeamName}</h3>
    </div>
  );
};

export default MLBSimulationView;
