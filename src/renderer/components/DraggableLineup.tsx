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
import type { TeamLineup, Player } from '@/types/mlb';

interface SortablePlayerItemProps {
    player: Player;
    isDraggable?: boolean;
}

const SortablePlayerItem: React.FC<SortablePlayerItemProps> = ({ player, isDraggable }) => {
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
            sx={{ py: 0 }}
        >
            {isDraggable && (
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        mr: 1,
                        '&:active': { cursor: 'grabbing' }
                    }}
                >
                    <DragIndicatorIcon fontSize="small" color="action" />
                </Box>
            )}
            <ListItemText
                primary={`${player.name} | Pos: ${player.position ?? 'N/A'}`}
            />
        </ListItem>
    );
};

interface DraggableLineupProps {
    teamName: string;
    teamData: TeamLineup;
    team: 'home' | 'away';
    onLineupReorder: (team: 'home' | 'away', newOrder: Player[]) => void;
}

const DraggableLineup: React.FC<DraggableLineupProps> = ({
    teamName,
    teamData,
    team,
    onLineupReorder
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
                        {players.map((player) => (
                            <SortablePlayerItem
                                key={player.id}
                                player={player}
                                isDraggable={true}
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

            {renderPlayerList([teamData.startingPitcher], 'Starting Pitcher')}
            {renderPlayerList(teamData.lineup, 'Batting Order', true)}
            {renderPlayerList(teamData.bullpen, 'Bullpen')}
        </Paper>
    );
};

export default DraggableLineup; 