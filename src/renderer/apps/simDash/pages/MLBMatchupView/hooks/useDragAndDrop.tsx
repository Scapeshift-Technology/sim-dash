import { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { TeamLineup, Player, TeamType } from '@/types/mlb';
import { useState } from 'react';

// ---------- Types ----------

type PlayerListType = 'lineup' | 'bench' | 'starter' | 'bullpen' | 'unavailablePitchers' | 'unavailableHitters';
type OperationType = 'swap' | 'move' | 'reorder' | null;
type TargetSection = PlayerListType | null;

interface UseDragAndDropParams {
    teamData: TeamLineup;
    teamType: TeamType;
    onLineupReorder: (teamType: TeamType, newLineup: Player[], newBench: Player[] | null) => void;
    onPitcherReorder: (teamType: TeamType, newStartingPitcher: Player | null, newBullpen: Player[], newUnavailablePitchers?: Player[]) => void;
}

// ---------- Main hook ----------

const useDragAndDrop = ({
    teamData,
    teamType,
    onLineupReorder,
    onPitcherReorder
}: UseDragAndDropParams) => {
    const [currentOperation, setCurrentOperation] = useState<OperationType>(null);
    const [targetSection, setTargetSection] = useState<TargetSection>(null);

    const getPlayerListType = (playerId: number): PlayerListType => {
        if (teamData.lineup.some(player => player.id === playerId)) {
            return 'lineup';
        }
        if (teamData.bench.some(player => player.id === playerId)) {
            return 'bench';
        }
        if (teamData.unavailableHitters.some(player => player.id === playerId)) {
            return 'unavailableHitters';
        }
        if (teamData.startingPitcher.id === playerId) {
            return 'starter';
        }
        if (teamData.bullpen.some(player => player.id === playerId)) {
            return 'bullpen';
        }
        if (teamData.unavailablePitchers.some(player => player.id === playerId)) {
            return 'unavailablePitchers';
        }
        throw new Error(`Player ${playerId} not found in any list`);
    };

    const getOperationType = (sourceList: PlayerListType, targetList: PlayerListType): OperationType => {        
        // Swap operations
        if ((sourceList === targetList) ||
            (sourceList === 'starter' && targetList === 'bullpen') || 
            (sourceList === 'bullpen' && targetList === 'starter') ||
            (sourceList === 'lineup' && targetList === 'bench') ||
            (sourceList === 'bench' && targetList === 'lineup') ||
            (sourceList === 'unavailablePitchers' && targetList === 'starter') ||
            (sourceList === 'starter' && targetList === 'unavailablePitchers')
        ) { return 'swap' }
        
        return 'move';
    };

    const handleReorder = (
        listType: PlayerListType,
        oldIndex: number,
        newIndex: number
    ) => {
        switch (listType) {
            case 'lineup': {
                const newOrder = arrayMove(teamData.lineup, oldIndex, newIndex);
                onLineupReorder(teamType, newOrder, null);
                break;
            }
        }
    };

    const handleSwap = (
        sourceList: PlayerListType,
        targetList: PlayerListType,
        sourceIndex: number,
        targetIndex: number
    ) => {
        const getPlayer = (list: PlayerListType, index: number): Player => {
            switch (list) {
                case 'lineup':
                    return teamData.lineup[index];
                case 'bench':
                    return teamData.bench[index];
                case 'unavailableHitters':
                    return teamData.unavailableHitters[index];
                case 'starter':
                    return teamData.startingPitcher;
                case 'bullpen':
                    return teamData.bullpen[index];
                case 'unavailablePitchers':
                    return teamData.unavailablePitchers[index];
                default:
                    throw new Error(`Invalid list type: ${list}`);
            }
        };

        const sourcePlayer = getPlayer(sourceList, sourceIndex);
        const targetPlayer = getPlayer(targetList, targetIndex);

        if ((sourceList === 'lineup' && targetList === 'bench') || (sourceList === 'bench' && targetList === 'lineup')) {
            const newLineup = [...teamData.lineup];
            const newBench = [...teamData.bench];

            if (sourceList === 'lineup') {
                newLineup[sourceIndex] = targetPlayer;
                newBench[targetIndex] = sourcePlayer;
            } else {
                newLineup[targetIndex] = sourcePlayer;
                newBench[sourceIndex] = targetPlayer;
            }
            
            onLineupReorder(teamType, newLineup, newBench);
        } else if ((sourceList === 'starter' && targetList === 'bullpen') || (sourceList === 'bullpen' && targetList === 'starter')) {
            const newBullpen = [...teamData.bullpen];
            let newStartingPitcher: Player | null = null;
            
            if (sourceList === 'starter') {
                newBullpen[targetIndex] = {
                    ...sourcePlayer,
                    position: 'RP'
                };
                newStartingPitcher = {
                    ...targetPlayer,
                    position: 'SP'
                };
            } else {
                newBullpen[sourceIndex] = {
                    ...targetPlayer,
                    position: 'RP'
                };
                newStartingPitcher = {
                    ...sourcePlayer,
                    position: 'SP'
                };
            }

            onPitcherReorder(teamType, newStartingPitcher, newBullpen);
        } else if (sourceList === 'unavailablePitchers' && (targetList === 'bullpen' || targetList === 'starter')) {
            const newUnavailablePitchers = teamData.unavailablePitchers.filter(p => p.id !== sourcePlayer.id);
            const newBullpen = [...teamData.bullpen];
            let newStartingPitcher: Player | null = null;
            
            if (targetList === 'bullpen') {
                const newReliever = { ...sourcePlayer, position: 'RP' }
                newBullpen.push(newReliever);
            } else if (targetList === 'starter') {
                newStartingPitcher = { ...sourcePlayer, position: 'SP' };
                newUnavailablePitchers.push(teamData.startingPitcher);
            }

            onPitcherReorder(teamType, newStartingPitcher, newBullpen, newUnavailablePitchers);
        } else if ((sourceList === 'bullpen' || sourceList === 'starter') && targetList === 'unavailablePitchers') {
            const newBullpen = [...teamData.bullpen];
            let newStartingPitcher: Player | null = null;
            let newUnavailablePitchers = [...teamData.unavailablePitchers];
            
            if (sourceList === 'bullpen') {
                newBullpen.splice(sourceIndex, 1);
                newUnavailablePitchers.push(sourcePlayer);
            } else if (sourceList === 'starter') {
                // When starter goes unavailable, swap with target if dropping on existing player
                if (targetIndex < teamData.unavailablePitchers.length) {
                    newStartingPitcher = { ...targetPlayer, position: 'SP' };
                    newUnavailablePitchers[targetIndex] = { ...sourcePlayer, position: 'RP' };
                } else {
                    // If dropping at end, promote first bullpen pitcher or set to null
                    newStartingPitcher = newBullpen.length > 0 ? { ...newBullpen[0], position: 'SP' } : null;
                    if (newBullpen.length > 0) {
                        newBullpen.splice(0, 1);
                    }
                    newUnavailablePitchers.push({ ...sourcePlayer, position: 'RP' });
                }
            }

            onPitcherReorder(teamType, newStartingPitcher, newBullpen, newUnavailablePitchers);
        }
    };

    // ---------- Main handler ----------

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || !active) {
            setCurrentOperation(null);
            setTargetSection(null);
            return;
        }

        const sourceListType = getPlayerListType(active.id as number);
        const targetListType = getPlayerListType(over.id as number);
        const operationType = getOperationType(sourceListType, targetListType);
        
        setCurrentOperation(operationType);
        setTargetSection(targetListType);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            setCurrentOperation(null);
            setTargetSection(null);
            return;
        }

        const sourceListType = getPlayerListType(active.id as number);
        const targetListType = getPlayerListType(over.id as number);
        const operationType = getOperationType(sourceListType, targetListType);
        
        const getIndex = (id: number, listType: PlayerListType): number => {
            switch (listType) {
                case 'lineup':
                    return teamData.lineup.findIndex(p => p.id === id);
                case 'bench':
                    return teamData.bench.findIndex(p => p.id === id);
                case 'unavailableHitters':
                    return teamData.unavailableHitters.findIndex(p => p.id === id);
                case 'bullpen':
                    return teamData.bullpen.findIndex(p => p.id === id);
                case 'starter':
                    return 0;
                case 'unavailablePitchers':
                    return teamData.unavailablePitchers.findIndex(p => p.id === id);
                default:
                    return -1;
            }
        };

        const sourceIndex = getIndex(active.id as number, sourceListType);
        const targetIndex = getIndex(over.id as number, targetListType);

        if (sourceListType === targetListType) {
            handleReorder(sourceListType, sourceIndex, targetIndex);
        } else {
            handleSwap(sourceListType, targetListType, sourceIndex, targetIndex);
        }
        
        // Reset operation after handling
        setCurrentOperation(null);
        setTargetSection(null);
    };

    return {
        handleDragOver,
        handleDragEnd,
        getPlayerListType,
        currentOperation,
        targetSection
    };
};

// ---------- Exports ----------
export default useDragAndDrop;

