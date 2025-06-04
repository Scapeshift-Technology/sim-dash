import { Paper, Box, Typography, TextField, InputAdornment } from '@mui/material';
import { teamNameToAbbreviationMLB } from '@@/services/mlb/utils/teamName';
import BasesAndCountDisplay from './BasesAndCountDisplay';
import Linescore from './Linescore';
import ScoreDisplay from './ScoreDisplay';
import InningDisplay from './InningDisplay';
import PlayerSelector from './PlayerSelector';

import { MlbLiveDataApiResponse } from '@@/types/mlb';
import { MlbLiveDataApiLinescoreInning } from '@@/types/mlb/mlb-api';
import { MatchupLineups, Player } from '@@/types/mlb';

// ---------- Main components ----------

type MLBGameBannerProps = {
  liveGameData: MlbLiveDataApiResponse | undefined;
  lineupData?: MatchupLineups; // Add lineup data for player options
  isEditable?: boolean;
  onGameStateUpdate?: (field: 'awayScore' | 'homeScore' | 'inning' | 'outs' | 'topInning', value: number | boolean) => void;
  onPlayerChange?: (field: 'currentBatter' | 'currentPitcher', playerId: number) => void; // Add player change callback
  onBaseChange?: (base: 'first' | 'second' | 'third', occupied: boolean) => void; // Add base change callback
  onBattersFacedChange?: (battersFaced: number) => void; // Add batters faced change callback
};

const MLBGameBanner = ({ liveGameData, lineupData, isEditable = false, onGameStateUpdate, onPlayerChange, onBaseChange, onBattersFacedChange }: MLBGameBannerProps) => {
  if (!liveGameData) return null;

  const gameStatus = liveGameData.gameData.status.abstractGameState;
  if (gameStatus !== "Live" && gameStatus !== "Final") return null;

  const awayTeam = teamNameToAbbreviationMLB(liveGameData.gameData.teams.away.name);
  const homeTeam = teamNameToAbbreviationMLB(liveGameData.gameData.teams.home.name);
  const awayScore = liveGameData.liveData.linescore.teams.away.runs;
  const homeScore = liveGameData.liveData.linescore.teams.home.runs;
  const awayHits = liveGameData.liveData.linescore.teams.away.hits;
  const homeHits = liveGameData.liveData.linescore.teams.home.hits;
  const awayErrors = liveGameData.liveData.linescore.teams.away.errors;
  const homeErrors = liveGameData.liveData.linescore.teams.home.errors;
  const lineScoreInnings: MlbLiveDataApiLinescoreInning[] = liveGameData.liveData.linescore.innings;
  
  // Variables that are conditional on gameStatus === "Live"
  let inningStr: string | undefined;
  let isTopInning: boolean | undefined;
  let isTopInningAdjusted: boolean | undefined;
  let currentPitcher: string | undefined;
  let currentBatter: string | undefined;
  let currentPitcherId: number | undefined;
  let currentBatterId: number | undefined;
  let battersFaced: number | undefined;
  let onDeck: string | undefined;
  let balls: number | undefined;
  let strikes: number | undefined;
  let outs: number | undefined;
  let firstBase: string | undefined;
  let secondBase: string | undefined;
  let thirdBase: string | undefined;

  if (gameStatus === "Live") {    
    onDeck = liveGameData.liveData.linescore.outs == 3 ? liveGameData.liveData.linescore.defense.onDeck.fullName : liveGameData.liveData.linescore.offense.onDeck.fullName;
    balls = liveGameData.liveData.linescore.balls;
    strikes = liveGameData.liveData.linescore.strikes;
    outs = liveGameData.liveData.linescore.outs;
    firstBase = liveGameData.liveData.linescore.offense.first?.fullName;
    secondBase = liveGameData.liveData.linescore.offense.second?.fullName;
    thirdBase = liveGameData.liveData.linescore.offense.third?.fullName;

    inningStr = liveGameData.gameData.status.detailedState === 'Warmup' ? 'WARMUP' : `${liveGameData.liveData.linescore.inningHalf.slice(0, 3).toUpperCase()} ${liveGameData.liveData.linescore.currentInningOrdinal}`;
    isTopInning = inningStr.includes("TOP");
    isTopInningAdjusted = isTopInning || (!isTopInning && outs === 3);
    currentPitcher = liveGameData.liveData.plays.currentPlay.matchup.pitcher.fullName;
    currentBatter = liveGameData.liveData.plays.currentPlay.matchup.batter.fullName;
    currentPitcherId = liveGameData.liveData.plays.currentPlay.matchup.pitcher.id;
    currentBatterId = liveGameData.liveData.plays.currentPlay.matchup.batter.id;
    
    const pitchingTeam = isTopInningAdjusted ? 'home' : 'away';
    const pitcherStats = liveGameData.liveData.boxscore.teams[pitchingTeam].players[`ID${currentPitcherId}`]?.stats?.pitching;
    battersFaced = pitcherStats?.battersFaced || 0;
  }

  // ---------- Helper functions ----------

  const getAvailableBatters = (teamType: 'home' | 'away'): Player[] => {
    if (!lineupData) return [];
    const team = lineupData[teamType];
    return [...team.lineup];
  };

  const getAvailablePitchers = (teamType: 'home' | 'away'): Player[] => {
    if (!lineupData) return [];
    const team = lineupData[teamType];
    return [team.startingPitcher, ...team.bullpen];
  };

  // ---------- Handlers ----------
  const handleScoreChange = (team: 'awayScore' | 'homeScore', increment: boolean) => {
    if (!onGameStateUpdate) return;
    
    const currentScore = team === 'awayScore' ? awayScore : homeScore;
    const newScore = increment ? currentScore + 1 : Math.max(0, currentScore - 1);
    onGameStateUpdate(team, newScore);
  };

  const handleInningChange = (increment: boolean) => {
    if (!onGameStateUpdate || !liveGameData) return;
    
    const currentInning = liveGameData.liveData.linescore.currentInning;
    const newInning = increment ? currentInning + 1 : Math.max(1, currentInning - 1);
    onGameStateUpdate('inning', newInning);
  };

  const handleOutsChange = (newOuts: number) => {
    if (!onGameStateUpdate) return;
    onGameStateUpdate('outs', newOuts);
  };

  const handleInningHalfToggle = () => {
    if (!onGameStateUpdate) return;
    onGameStateUpdate('topInning', !isTopInning);
  };

  const handlePlayerChange = (field: 'currentBatter' | 'currentPitcher', playerId: number) => {
    if (!onPlayerChange) return;
    onPlayerChange(field, playerId);
  };

  const handleBaseChange = (base: 'first' | 'second' | 'third', occupied: boolean) => {
    if (!onBaseChange) return;
    onBaseChange(base, occupied);
  };

  const handleBattersFacedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onBattersFacedChange) return;
    const value = Math.max(0, parseInt(event.target.value) || 0);
    onBattersFacedChange(value);
  };

  // Component for displaying batters faced
  const BattersFacedDisplay: React.FC<{ 
    battersFaced: number; 
    isEditable: boolean; 
    textAlign?: 'left' | 'right' | 'center' 
  }> = ({ battersFaced, isEditable, textAlign = 'left' }) => {
    if (!isEditable) {
      return (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', textAlign }}>
          BF: {battersFaced}
        </Typography>
      );
    }

    return (
      <TextField
        size="small"
        type="number"
        value={battersFaced}
        onChange={handleBattersFacedChange}
        inputProps={{ min: 0, style: { textAlign: textAlign === 'right' ? 'right' : 'left' } }}
        InputProps={{
          startAdornment: <InputAdornment position="start">BF:</InputAdornment>,
        }}
        sx={{
          width: '80px',
          '& .MuiOutlinedInput-root': {
            height: '24px',
            fontSize: '0.75rem',
          },
          '& .MuiInputAdornment-root': {
            fontSize: '0.75rem',
          },
          '& input': {
            padding: '2px 4px',
          }
        }}
      />
    );
  };

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
          <ScoreDisplay
            teamName={awayTeam}
            score={awayScore}
            isEditable={isEditable}
            textAlign="right"
            justifyContent="flex-end"
            onScoreChange={(increment) => handleScoreChange('awayScore', increment)}
          />
        </Box>
        
        {/* Center Column */}
        <Box sx={{ gridArea: 'center', textAlign: 'center' }}>
          {
          gameStatus === "Live" ? (
            <InningDisplay
              inningStr={inningStr!}
              isEditable={isEditable}
              outs={outs}
              onInningChange={handleInningChange}
              onInningHalfToggle={handleInningHalfToggle}
            />
          ) : (
            <Typography variant="h6">Final</Typography>
          )}
        </Box>

        {/* Home Column */}
        <Box sx={{ gridArea: 'home', textAlign: 'left' }}>
          <ScoreDisplay
            teamName={homeTeam}
            score={homeScore}
            isEditable={isEditable}
            textAlign="left"
            justifyContent="flex-start"
            onScoreChange={(increment) => handleScoreChange('homeScore', increment)}
          />
        </Box>

        {/* Conditional rendering for Live game details */}
        {gameStatus === "Live" && (
          <>
            {/* Away Info */}
            <Box sx={{ 
              gridArea: 'away-info', 
              textAlign: 'right',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}>
              {isTopInningAdjusted ? (
                <PlayerSelector
                  label="AB:"
                  currentPlayer={currentBatter!}
                  currentPlayerId={currentBatterId}
                  availablePlayers={getAvailableBatters('away')}
                  isEditable={isEditable}
                  textAlign="right"
                  onPlayerChange={(playerId) => handlePlayerChange('currentBatter', playerId)}
                />
              ) : (
                <>
                  <PlayerSelector
                    label="P:"
                    currentPlayer={currentPitcher!}
                    currentPlayerId={currentPitcherId}
                    availablePlayers={getAvailablePitchers('away')}
                    isEditable={isEditable}
                    textAlign="right"
                    onPlayerChange={(playerId) => handlePlayerChange('currentPitcher', playerId)}
                  />
                  <BattersFacedDisplay
                    battersFaced={battersFaced || 0}
                    isEditable={isEditable}
                    textAlign="right"
                  />
                </>
              )}
              {isTopInningAdjusted && onDeck && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  On Deck: {onDeck}
                </Typography>
              )}
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
                isEditable={isEditable}
                onOutsChange={handleOutsChange}
                onBaseChange={handleBaseChange}
              />
            </Box>

            {/* Home Info */}
            <Box sx={{ 
              gridArea: 'home-info', 
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}>
              {isTopInningAdjusted ? (
                <>
                  <PlayerSelector
                    label="P:"
                    currentPlayer={currentPitcher!}
                    currentPlayerId={currentPitcherId}
                    availablePlayers={getAvailablePitchers('home')}
                    isEditable={isEditable}
                    textAlign="left"
                    onPlayerChange={(playerId) => handlePlayerChange('currentPitcher', playerId)}
                  />
                  <BattersFacedDisplay
                    battersFaced={battersFaced || 0}
                    isEditable={isEditable}
                    textAlign="left"
                  />
                </>
              ) : (
                <PlayerSelector
                  label="AB:"
                  currentPlayer={currentBatter!}
                  currentPlayerId={currentBatterId}
                  availablePlayers={getAvailableBatters('home')}
                  isEditable={isEditable}
                  textAlign="left"
                  onPlayerChange={(playerId) => handlePlayerChange('currentBatter', playerId)}
                />
              )}
              {!isTopInningAdjusted && onDeck && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  On Deck: {onDeck}
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>
      
      {/* Linescore - only show for real live games with actual data */}
      {lineScoreInnings.length > 0 && (
        <Linescore
          innings={lineScoreInnings}
          awayTeam={awayTeam}
          homeTeam={homeTeam}
          awayScore={awayScore}
          homeScore={homeScore}
          awayHits={awayHits}
          homeHits={homeHits}
          awayErrors={awayErrors}
          homeErrors={homeErrors}
        />
      )}
    </Paper>
  );
};

export default MLBGameBanner;
