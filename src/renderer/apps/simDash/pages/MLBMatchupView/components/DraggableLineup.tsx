import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    List,
    Divider
} from '@mui/material';
import type { TeamLineup, Player, Position, TeamType, MlbLiveDataApiResponse } from '@/types/mlb';
import { updateTeamLean, updatePlayerLean, selectTeamInputs } from '@/simDash/store/slices/simInputsSlice';
import type { LeagueName } from '@@/types/league';
import type { RootState } from '@/store/store';
import SortablePlayerItem from './SortablePlayerItem';
import TeamSectionCard from './TeamSectionCard';
import useDragAndDrop from '../hooks/useDragAndDrop';

// ---------- Main component ----------

interface DraggableLineupProps {
    teamName: string;
    teamData: TeamLineup;
    teamType: TeamType;
    matchId: number;
    league: LeagueName;
    liveGameData: MlbLiveDataApiResponse | undefined;
    onLineupReorder: (teamType: TeamType, newLineup: Player[], newBench: Player[] | null) => void;
    onPitcherReorder: (teamType: TeamType, newStartingPitcher: Player | null, newBullpen: Player[], newUnavailablePitchers?: Player[]) => void;
    onPositionChange?: (teamType: TeamType, playerId: number, position: Position) => void;
}

const DraggableLineup: React.FC<DraggableLineupProps> = ({
    teamName,
    teamData,
    teamType,
    matchId,
    league,
    liveGameData,
    onLineupReorder,
    onPitcherReorder,
    onPositionChange
}) => {
    const dispatch = useDispatch();

    // ---------- Selectors ----------

    const teamInputs = useSelector((state: RootState) => selectTeamInputs(state, league, matchId))?.[teamType];
    const hitterAdjustment = useSelector((state: RootState) => selectTeamInputs(state, league, matchId))?.[teamType].teamHitterLean || 0;
    const pitcherAdjustment = useSelector((state: RootState) => selectTeamInputs(state, league, matchId))?.[teamType].teamPitcherLean || 0;

    // ---------- Variables ----------

    const currentPitcherId = liveGameData?.gameData.status.abstractGameState === "Live" ? 
        liveGameData?.liveData.plays.currentPlay.matchup.pitcher.id : undefined;
    const currentBatterId = liveGameData?.gameData.status.abstractGameState === "Live" ? 
        liveGameData?.liveData.plays.currentPlay.matchup.batter.id : undefined;


    // ---------- Hooks ----------

    const { handleDragOver, handleDragEnd, currentOperation, targetSection, createDragId } = useDragAndDrop({
        teamData,
        teamType,
        onLineupReorder,
        onPitcherReorder
    });

    // ---------- Handlers ----------

    const handlePositionChange = (playerId: number, position: Position) => {
        onPositionChange?.(teamType, playerId, position);
    };

    const handleHitterAdjustmentChange = (value: number) => {
        dispatch(updateTeamLean({
            league,
            matchId,
            teamType,
            leanType: 'offense',
            value
        }));
    };

    const handlePitcherAdjustmentChange = (value: number) => {
        dispatch(updateTeamLean({
            league,
            matchId,
            teamType,
            leanType: 'defense',
            value
        }));
    };

    const handleHitterLeanChange = (playerId: number, value: number) => {
        dispatch(updatePlayerLean({
            league,
            matchId,
            teamType,
            playerType: 'hitter',
            playerId,
            value
        }));
    };

    const handlePitcherLeanChange = (playerId: number, value: number) => {
        dispatch(updatePlayerLean({
            league,
            matchId,
            teamType,
            playerType: 'pitcher',
            playerId,
            value
        }));
    };

    // ---------- Render functions ----------

    const getTargetSectionStyle = (sectionName: string) => ({
        border: targetSection === sectionName && currentOperation === 'move' 
            ? '2px dashed #2196f3' 
            : '2px solid transparent',
        backgroundColor: targetSection === sectionName && currentOperation === 'move'
            ? 'rgba(33, 150, 243, 0.1)'
            : 'transparent',
        transition: 'all 0.2s ease-in-out'
    });

    const renderPlayerList = (players: Player[], isDraggable: boolean = false, isPitcher: boolean = false, isStarter: boolean = false, currentPlayerId: number | undefined = undefined) => (
        <List
            dense
            sx={{ pt: 0, pb: 0 }}
        >
            {players.map((player, index) => (
                <SortablePlayerItem
                    key={player.id}
                    player={player}
                    isDraggable={isDraggable}
                    onPositionChange={handlePositionChange}
                    lineupPosition={isStarter && !isPitcher ? index + 1 : undefined}
                    onLeanChange={isPitcher ? handlePitcherLeanChange : handleHitterLeanChange}
                    leanValue={isPitcher ? 
                        teamInputs?.individualPitcherLeans?.[player.id] || 0 :
                        teamInputs?.individualHitterLeans?.[player.id] || 0
                    }
                    dragId={isDraggable ? createDragId(player) : undefined}
                    isCurrentPlayer={currentPlayerId === player.id}
                />
            ))}
        </List>
    );

    return (
        <Paper 
            elevation={3} 
            sx={{ 
                p: 2, 
                height: '100%',
                minWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" gutterBottom>{teamName}</Typography>
            </Box>
            <Divider sx={{ mb: 1 }}/>

            {/* Pitchers Section */}
            <TeamSectionCard
                title="Pitcher"
                adjustmentValue={pitcherAdjustment}
                onAdjustmentChange={handlePitcherAdjustmentChange}
                currentOperation={currentOperation}
                isDraggable={true}
                sortableItems={[createDragId(teamData.startingPitcher), ...teamData.bullpen.map(p => createDragId(p)), ...teamData.unavailablePitchers.map(p => createDragId(p))]}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {/* Starting Pitcher */}
                <Box sx={{...getTargetSectionStyle('starter'), mb: 1}}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Starting Pitcher
                    </Typography>
                    {renderPlayerList([teamData.startingPitcher], true, true, true, currentPitcherId)}
                </Box>

                {/* Bullpen */}
                <Box sx={{...getTargetSectionStyle('bullpen'), mb: 1}}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Bullpen
                    </Typography>
                    {renderPlayerList(teamData.bullpen, true, true, false, currentPitcherId)}
                </Box>

                {/* Unavailable Pitchers */}
                <Box sx={getTargetSectionStyle('unavailablePitchers')}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Unavailable
                    </Typography>
                    {renderPlayerList(teamData.unavailablePitchers, true, true, false, currentPitcherId)}
                </Box>
            </TeamSectionCard>

            {/* Hitters Section */}
            <TeamSectionCard
                title="Hitter"
                adjustmentValue={hitterAdjustment}
                onAdjustmentChange={handleHitterAdjustmentChange}
                currentOperation={currentOperation}
                isDraggable={true}
                sortableItems={[...teamData.lineup.map(p => createDragId(p)), ...teamData.bench.map(p => createDragId(p)), ...teamData.unavailableHitters.map(p => createDragId(p))]}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Batting Order
                    </Typography>
                    {renderPlayerList(teamData.lineup, true, false, true, currentBatterId)}
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Bench
                    </Typography>
                    {renderPlayerList(teamData.bench, true, false, false, currentBatterId)}
                </Box>
            </TeamSectionCard>
        </Paper>
    );
};

export default DraggableLineup; 