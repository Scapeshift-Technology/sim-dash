import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SimResultsMLB } from '@/types/bettingResults';
import { teamNameToAbbreviationMLB, transformSidesCountsMLB } from '@/utils/displayMLB';
import SidesTable from '@/components/SidesTable';

const MLBSimulationView: React.FC = () => {
  // ---------- State ----------
  const [simData, setSimData] = useState<SimResultsMLB | null>(null);
  console.log(simData);
  const location = useLocation();
  const windowId = new URLSearchParams(location.search).get('windowId');
  const [awayTeamName, setAwayTeamName] = useState<string | null>(null);
  const [homeTeamName, setHomeTeamName] = useState<string | null>(null);
  const awayTeamAbbreviation = awayTeamName ? teamNameToAbbreviationMLB(awayTeamName) : '';
  const homeTeamAbbreviation = homeTeamName ? teamNameToAbbreviationMLB(homeTeamName) : '';

  // ---------- Effects ----------
  useEffect(() => {
    const fetchSimData = async () => {
      if (!windowId) {
        console.error('No windowId provided');
        return;
      }
      
      try {
        const data = await window.electronAPI.getSimData({ windowId });
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

  // Mock data for SidesTable
  const mockSidesData = transformSidesCountsMLB(simData.sides, awayTeamAbbreviation, homeTeamAbbreviation);

  return (
    <div style={{ padding: '20px' }}>
      <h3>{awayTeamName} @ {homeTeamName}</h3>
      <h2>Full Game Sides Results</h2>
      <SidesTable data={mockSidesData} />
    </div>
  );
};

export default MLBSimulationView;
