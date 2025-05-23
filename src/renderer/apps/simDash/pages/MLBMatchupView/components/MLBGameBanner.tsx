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

  const gameStatus = liveGameData.gameData.status.abstractGameState;
  if (gameStatus !== "Live" && gameStatus !== "Final") return null;

  const awayTeam = teamNameToAbbreviationMLB(liveGameData.gameData.teams.away.name);
  const homeTeam = teamNameToAbbreviationMLB(liveGameData.gameData.teams.home.name);
  const awayScore = liveGameData.liveData.linescore.teams.away.runs;
  const homeScore = liveGameData.liveData.linescore.teams.home.runs;
  
  // Variables that are conditional on gameStatus === "Live"
  let inningStr: string | undefined;
  let isTopInning: boolean | undefined;
  let currentPitcher: string | undefined;
  let currentBatter: string | undefined;
  let balls: number | undefined;
  let strikes: number | undefined;
  let outs: number | undefined;
  let firstBase: string | undefined;
  let secondBase: string | undefined;
  let thirdBase: string | undefined;

  if (gameStatus === "Live") {
    inningStr = `${liveGameData.liveData.linescore.inningHalf.slice(0, 3).toUpperCase()} ${liveGameData.liveData.linescore.currentInningOrdinal}`;
    isTopInning = inningStr.includes("TOP");
    currentPitcher = liveGameData.liveData.plays.currentPlay.matchup.pitcher.fullName;
    currentBatter = liveGameData.liveData.plays.currentPlay.matchup.batter.fullName;
    balls = liveGameData.liveData.linescore.balls;
    strikes = liveGameData.liveData.linescore.strikes;
    outs = liveGameData.liveData.linescore.outs;
    firstBase = liveGameData.liveData.linescore.offense.first?.fullName;
    secondBase = liveGameData.liveData.linescore.offense.second?.fullName;
    thirdBase = liveGameData.liveData.linescore.offense.third?.fullName;
  }

  // ---------- Render ----------

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
        gridTemplateRows: gameStatus === "Live" ? 'auto auto' : 'auto',
        gridTemplateAreas: gameStatus === "Live" 
          ? `
            "away center home"
            "away-info center-info home-info"
          `
          : `
            "away center home"
          `,
        gap: 2,
        alignItems: gameStatus === "Final" ? 'center' : undefined 
      }}>
        {/* Away Column */}
        <Box sx={{ gridArea: 'away', textAlign: 'right' }}>
          <Typography variant="h6">{awayTeam} {awayScore}</Typography>
        </Box>
        
        {/* Center Column */}
        <Box sx={{ gridArea: 'center', textAlign: 'center' }}>
          <Typography variant="h6">
            {gameStatus === "Live" ? inningStr : "Final"}
          </Typography>
        </Box>

        {/* Home Column */}
        <Box sx={{ gridArea: 'home', textAlign: 'left' }}>
          <Typography variant="h6">{homeTeam} {homeScore}</Typography>
        </Box>

        {/* Conditional rendering for Live game details */}
        {gameStatus === "Live" && (
          <>
            {/* Away Info */}
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

            {/* Center Info */}
            <Box sx={{ gridArea: 'center-info', textAlign: 'center' }}>
              <BasesAndCountDisplay
                balls={balls!} 
                strikes={strikes!}
                outs={outs!}
                firstBase={firstBase} 
                secondBase={secondBase}
                thirdBase={thirdBase}
              />
            </Box>

            {/* Home Info */}
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
          </>
        )}
      </Box>
    </Paper>
  );
};

export default MLBGameBanner;
