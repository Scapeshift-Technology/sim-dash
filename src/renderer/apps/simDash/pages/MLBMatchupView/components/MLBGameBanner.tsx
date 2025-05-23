import { Paper, Box, Typography } from '@mui/material';
import { teamNameToAbbreviationMLB } from '@@/services/mlb/utils/teamName';
import BasesAndCountDisplay from './BasesAndCountDisplay';
import { MlbLiveDataApiResponse } from '@@/types/mlb';

// ---------- Main components ----------

type MLBGameBannerProps = {
  liveGameData: MlbLiveDataApiResponse | undefined;
};

const MLBGameBanner = ({ liveGameData }: MLBGameBannerProps) => {

  // ---------- Render ----------
  if (!liveGameData) return null;

  const awayTeam = teamNameToAbbreviationMLB(liveGameData.gameData.teams.away.name);
  const homeTeam = teamNameToAbbreviationMLB(liveGameData.gameData.teams.home.name);
  const awayScore = liveGameData.liveData.linescore.teams.away.runs;
  const homeScore = liveGameData.liveData.linescore.teams.home.runs;
  const inningStr = `${liveGameData.liveData.linescore.inningHalf.slice(0, 3).toUpperCase()} ${liveGameData.liveData.linescore.currentInningOrdinal}`;
  
  const isTopInning = inningStr.includes("TOP");
  const currentPitcher = liveGameData.liveData.plays.currentPlay.matchup.pitcher.fullName;
  const currentBatter = liveGameData.liveData.plays.currentPlay.matchup.batter.fullName;

  const balls = liveGameData.liveData.linescore.balls;
  const strikes = liveGameData.liveData.linescore.strikes;
  const outs = liveGameData.liveData.linescore.outs;
  const firstBase = liveGameData.liveData.linescore.offense.first?.fullName;
  const secondBase = liveGameData.liveData.linescore.offense.second?.fullName;
  const thirdBase = liveGameData.liveData.linescore.offense.third?.fullName;

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
        <Box sx={{ 
          gridArea: 'away-info', 
          textAlign: 'right',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
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
        <Box sx={{ 
          gridArea: 'home-info', 
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Typography>
            {isTopInning ? `P: ${currentPitcher}` : `AB: ${currentBatter}`}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MLBGameBanner;
