import { useEffect, useState } from 'react';
import { MlbGameApiResponse } from '@@/types/mlb';
import { Paper, Box, Typography } from '@mui/material';
import { teamNameToAbbreviationMLB } from '@@/services/mlb/utils/teamName';
import BasesAndCountDisplay from './BasesAndCountDisplay';

// ---------- Main components ----------

type MLBGameBannerProps = {
  mlbGameId: number | undefined;
};

const MLBGameBanner = ({ mlbGameId }: MLBGameBannerProps) => {

  // ---------- State ----------

  const [gameData, setGameData] = useState<MlbGameApiResponse | null>(null);

  // ---------- useEffect ----------

  useEffect(() => {
    if (!mlbGameId) return;

    // Connect to WebSocket
    console.log('Connecting to WebSocket for game:', mlbGameId);
    window.electronAPI.connectToWebSocketMLB({ gameId: mlbGameId });

    // Set up update listener
    const cleanup = window.electronAPI.onMLBGameUpdate((gameData: any) => {
      console.log('Received game update:', gameData);
      setGameData(gameData.data);
    });

    // Cleanup function
    return () => {
      console.log('Disconnecting from WebSocket');
      cleanup(); // Remove the update listener
      window.electronAPI.disconnectFromWebSocketMLB({ gameId: mlbGameId });
    };
  }, [mlbGameId]);

  // ---------- Render ----------
  if (!mlbGameId || !gameData) return null;

  const awayTeam = teamNameToAbbreviationMLB(gameData.gameData.teams.away.name);
  const homeTeam = teamNameToAbbreviationMLB(gameData.gameData.teams.home.name);
  const awayScore = gameData.liveData.linescore.teams.away.runs;
  const homeScore = gameData.liveData.linescore.teams.home.runs;
  const inningStr = `${gameData.liveData.linescore.inningHalf.slice(0, 3).toUpperCase()} ${gameData.liveData.linescore.currentInningOrdinal}`;
  
  const isTopInning = inningStr.includes("TOP");
  const currentPitcher = gameData.liveData.plays.currentPlay.matchup.pitcher.fullName;
  const currentBatter = gameData.liveData.plays.currentPlay.matchup.batter.fullName;

  const balls = gameData.liveData.linescore.balls;
  const strikes = gameData.liveData.linescore.strikes;
  const outs = gameData.liveData.linescore.outs;
  const firstBase = gameData.liveData.linescore.offense.first?.fullName;
  const secondBase = gameData.liveData.linescore.offense.second?.fullName;
  const thirdBase = gameData.liveData.linescore.offense.third?.fullName;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 3,
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'auto auto',
        gridTemplateAreas: `
          "away center home"
          "away-info center-info home-info"
        `,
        gap: 2
      }}>
        {/* Away Column */}
        <Box sx={{ gridArea: 'away', textAlign: 'right' }}>
          <Typography variant="h6">{awayTeam} {awayScore}</Typography>
        </Box>
        <Box sx={{ gridArea: 'away-info', textAlign: 'right' }}>
          <Typography>
            {isTopInning ? `AB: ${currentBatter}` : `P: ${currentPitcher}`}
          </Typography>
        </Box>

        {/* Center Column */}
        <Box sx={{ gridArea: 'center', textAlign: 'center' }}>
          <Typography variant="h6">{inningStr}</Typography>
        </Box>
        <Box sx={{ gridArea: 'center-info', textAlign: 'center' }}>
          <BasesAndCountDisplay
            balls={balls}
            strikes={strikes}
            outs={outs}
            firstBase={firstBase}
            secondBase={secondBase}
            thirdBase={thirdBase}
          />
        </Box>

        {/* Home Column */}
        <Box sx={{ gridArea: 'home', textAlign: 'left' }}>
          <Typography variant="h6">{homeTeam} {homeScore}</Typography>
        </Box>
        <Box sx={{ gridArea: 'home-info', textAlign: 'left' }}>
          <Typography>
            {isTopInning ? `P: ${currentPitcher}` : `AB: ${currentBatter}`}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MLBGameBanner;
