import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SimResultsMLB } from '@/types/bettingResults';

const MLBSimulationView: React.FC = () => {
  const [simData, setSimData] = useState<SimResultsMLB | null>(null);
  const location = useLocation();
  
  // Get windowId from the location search params
  const windowId = new URLSearchParams(location.search).get('windowId');

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
        setSimData(data);
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
    <div>
      Home ML Success Count: {simData.sides.home.fullGame.ML.success}
    </div>
  );
};

export default MLBSimulationView;
