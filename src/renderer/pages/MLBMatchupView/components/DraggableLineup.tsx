import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    TextField
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TeamLineup, Player, Position, TeamType } from '@/types/mlb';
import { updateTeamLean, updatePlayerLean, selectTeamInputs } from '@/store/slices/simInputsSlice';
import type { LeagueName } from '@@/types/league';
import type { RootState } from '@/store/store';

interface SortablePlayerItemProps {
    player: Player;
    isDraggable?: boolean;
    onPositionChange?: (playerId: number, position: Position) => void;
    lineupPosition?: number;
    onLeanChange?: (playerId: number, value: number) => void;
    leanValue?: number;
}

const SortablePlayerItem: React.FC<SortablePlayerItemProps> = ({ 
    player, 
    isDraggable,
    onPositionChange,
    lineupPosition,
    onLeanChange,
    leanValue = 0
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: player.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDraggable ? 'grab' : 'default',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
    };

    const getLeanColor = (value: number) => {
        if (value > 10 || value < -10) return 'error.main';
        if (value > 0) return 'success.main';
        if (value < 0) return 'error.main';
        return 'text.primary';
    };

    const isLeanValid = (value: number) => value >= -10 && value <= 10;

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            sx={{ py: 0, px: .5 }}
        >
            {lineupPosition && (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: 'text.secondary',
                        mr: 0.5
                    }}
                >
                    {lineupPosition}.
                </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <ListItemText
                    primary={player.name}
                    sx={{ flex: '1 1 auto' }}
                />
                {/* <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                        Pos:
                    </Typography>
                    <PositionSelector
                        value={player.position || ''}
                        onChange={(position) => onPositionChange?.(player.id, position)}
                        disabled={!isDraggable}
                    />
                </Box> */}
                <TextField
                    type="number"
                    size="small"
                    value={leanValue}
                    onChange={(e) => onLeanChange?.(player.id, Number(e.target.value))}
                    error={!isLeanValid(leanValue)}
                    slotProps={{
                      input: {
                        inputProps: { 
                          min: -10, 
                          max: 10,
                          step: .5,
                          style: {
                            padding: '0 4px',
                            textAlign: 'right',
                            MozAppearance: 'textfield'
                          }
                        },
                        endAdornment: <Typography variant="body2" sx={{ ml: 0.0, pr: 0.0 }}>%</Typography>
                      },
                    }}
                    sx={{ 
                        width: '55px',
                        '& .MuiInputBase-root': {
                            height: '28px',
                            padding: '0 4px'
                        },
                        '& .MuiInputLabel-root': {
                            color: getLeanColor(leanValue)
                        },
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: getLeanColor(leanValue)
                            },
                            '&:hover fieldset': {
                                borderColor: getLeanColor(leanValue)
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: getLeanColor(leanValue)
                            }
                        },
                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0
                        }
                    }}
                />
            </Box>
            {isDraggable && (
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        ml: 1,
                        '&:active': { cursor: 'grabbing' }
                    }}
                >
                    <DragIndicatorIcon fontSize="small" color="action" />
                </Box>
            )}
        </ListItem>
    );
};

interface TeamSectionCardProps {
    title: string;
    adjustmentValue: number;
    onAdjustmentChange: (value: number) => void;
    children: React.ReactNode;
}

const TeamSectionCard: React.FC<TeamSectionCardProps> = ({
    title,
    adjustmentValue,
    onAdjustmentChange,
    children
}) => {
    const getAdjustmentColor = (value: number) => {
        if (value > 10 || value < -10) return 'error.main';
        if (value > 0) return 'success.main';
        if (value < 0) return 'error.main';
        return 'text.primary';
    };

    const isAdjustmentValid = (value: number) => value >= -10 && value <= 10;

    const renderAdjustmentInput = (label: string, value: number, onChange: (value: number) => void) => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1, minWidth: '100px' }}>
                {label}:
            </Typography>
            <TextField
                type="number"
                size="small"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                error={!isAdjustmentValid(value)}
                slotProps={{
                  input: {
                    inputProps: { 
                      min: -10, 
                      max: 10,
                      step: .5
                    },
                    endAdornment: <Typography variant="body2" sx={{ ml: 0.5 }}>%</Typography>
                  }
                }}
                sx={{ 
                    flex: 1,
                    '& .MuiInputBase-root': {
                        height: '28px'
                    },
                    '& .MuiInputLabel-root': {
                        color: getAdjustmentColor(value)
                    },
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: getAdjustmentColor(value)
                        },
                        '&:hover fieldset': {
                            borderColor: getAdjustmentColor(value)
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: getAdjustmentColor(value)
                        }
                    }
                }}
            />
        </Box>
    );

    return (
        <Paper 
            elevation={1} 
            sx={{ 
                p: 2,
                backgroundColor: 'background.default'
            }}
        >
            {renderAdjustmentInput(`${title} Adjustment %`, adjustmentValue, onAdjustmentChange)}
            <Divider sx={{ my: 2 }} />
            {children}
        </Paper>
    );
};

interface DraggableLineupProps {
    teamName: string;
    teamData: TeamLineup;
    teamType: TeamType;
    matchId: number;
    league: LeagueName;
    onLineupReorder: (teamType: TeamType, newOrder: Player[]) => void;
    onPositionChange?: (teamType: TeamType, playerId: number, position: Position) => void;
}

const DraggableLineup: React.FC<DraggableLineupProps> = ({
    teamName,
    teamData,
    teamType,
    matchId,
    league,
    onLineupReorder,
    onPositionChange
}) => {
    const dispatch = useDispatch();
    const teamInputs = useSelector((state: RootState) => selectTeamInputs(state, league, matchId))?.[teamType];
    const hitterAdjustment = useSelector((state: RootState) => selectTeamInputs(state, league, matchId))?.[teamType].teamHitterLean || 0;
    const pitcherAdjustment = useSelector((state: RootState) => selectTeamInputs(state, league, matchId))?.[teamType].teamPitcherLean || 0;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ---------- Handlers ----------

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = teamData.lineup.findIndex((player) => player.id === active.id);
            const newIndex = teamData.lineup.findIndex((player) => player.id === over.id);

            const newOrder = arrayMove(teamData.lineup, oldIndex, newIndex);
            onLineupReorder(teamType, newOrder);
        }
    };

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

    const renderPlayerList = (players: Player[], isDraggable: boolean = false, isPitcher: boolean = false) => (
        <List
            dense
            sx={{ pt: 0, pb: 0 }}
        >
            {isDraggable ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={players.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {players.map((player, index) => (
                            <SortablePlayerItem
                                key={player.id}
                                player={player}
                                isDraggable={true}
                                onPositionChange={handlePositionChange}
                                lineupPosition={index + 1}
                                onLeanChange={isPitcher ? handlePitcherLeanChange : handleHitterLeanChange}
                                leanValue={isPitcher ? 
                                    teamInputs?.individualPitcherLeans?.[player.id] || 0 :
                                    teamInputs?.individualHitterLeans?.[player.id] || 0
                                }
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            ) : (
                players.map((player) => (
                    <SortablePlayerItem
                        key={player.id}
                        player={player}
                        isDraggable={false}
                        onLeanChange={isPitcher ? handlePitcherLeanChange : handleHitterLeanChange}
                        leanValue={isPitcher ? 
                            teamInputs?.individualPitcherLeans?.[player.id] || 0 :
                            teamInputs?.individualHitterLeans?.[player.id] || 0
                        }
                    />
                ))
            )}
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
            <Typography variant="h6" gutterBottom>{teamName}</Typography>
            <Divider sx={{ mb: 1 }}/>

            {/* Hitters Section */}
            <TeamSectionCard
                title="Hitter"
                adjustmentValue={hitterAdjustment}
                onAdjustmentChange={handleHitterAdjustmentChange}
            >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Batting Order
                </Typography>
                {renderPlayerList(teamData.lineup, true, false)}
            </TeamSectionCard>

            {/* Pitchers Section */}
            <TeamSectionCard
                title="Pitcher"
                adjustmentValue={pitcherAdjustment}
                onAdjustmentChange={handlePitcherAdjustmentChange}
            >
                {/* Starting Pitcher */}
                <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Starting Pitcher
                    </Typography>
                    {renderPlayerList([teamData.startingPitcher], false, true)}
                </Box>

                {/* Bullpen */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Bullpen
                    </Typography>
                    {renderPlayerList(teamData.bullpen, false, true)}
                </Box>
            </TeamSectionCard>
        </Paper>
    );
};

export default DraggableLineup; 