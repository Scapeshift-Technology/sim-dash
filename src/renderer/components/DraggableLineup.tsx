import React from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    Divider
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
import type { TeamLineup, Player, Position } from '@/types/mlb';
import PositionSelector from './lineup/PositionSelector';

interface SortablePlayerItemProps {
    player: Player;
    isDraggable?: boolean;
    onPositionChange?: (playerId: number, position: Position) => void;
    lineupPosition?: number;
}

const SortablePlayerItem: React.FC<SortablePlayerItemProps> = ({ 
    player, 
    isDraggable,
    onPositionChange,
    lineupPosition
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

interface DraggableLineupProps {
    teamName: string;
    teamData: TeamLineup;
    team: 'home' | 'away';
    onLineupReorder: (team: 'home' | 'away', newOrder: Player[]) => void;
    onPositionChange?: (team: 'home' | 'away', playerId: number, position: Position) => void;
}

const DraggableLineup: React.FC<DraggableLineupProps> = ({
    teamName,
    teamData,
    team,
    onLineupReorder,
    onPositionChange
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = teamData.lineup.findIndex((player) => player.id === active.id);
            const newIndex = teamData.lineup.findIndex((player) => player.id === over.id);

            const newOrder = arrayMove(teamData.lineup, oldIndex, newIndex);
            onLineupReorder(team, newOrder);
        }
    };

    const handlePositionChange = (playerId: number, position: Position) => {
        onPositionChange?.(team, playerId, position);
    };

    const renderPlayerList = (players: Player[], subheader: string, isDraggable: boolean = false) => (
        <List
            dense
            subheader={
                <ListSubheader sx={{ lineHeight: '30px', pb: 0 }}>
                    {subheader}
                </ListSubheader>
            }
            sx={{ pt: 0 }}
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
                    />
                ))
            )}
        </List>
    );

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>{teamName}</Typography>
            <Divider sx={{ mb: 1 }}/>

            {renderPlayerList(teamData.lineup, 'Batting Order', true)}
            {renderPlayerList([teamData.startingPitcher], 'Starting Pitcher')}
            {renderPlayerList(teamData.bullpen, 'Bullpen')}

        </Paper>
    );
};

export default DraggableLineup; 