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

// ---------- Helper functions ----------

const transformPlayerForRole = (player: Player, newRole: 'SP' | 'RP'): Player => {
    if (!player.alternateRoleStats || player.position === newRole) {
      return { ...player, position: newRole };
    }
    
    const currentStats = player.stats;
    const newRoleStats = player.alternateRoleStats[newRole];
    const { [newRole]: removedRole, ...remainingAlternateStats } = player.alternateRoleStats;
    
    return {
      ...player,
      position: newRole,
      stats: newRoleStats || currentStats,
      alternateRoleStats: {
        ...remainingAlternateStats,
        ...(currentStats && player.position && { [player.position]: currentStats })
      }
    };
};

// ---------- Main hook ----------

const useDragAndDrop = ({
    teamData,
    teamType,
    onLineupReorder,
    onPitcherReorder
}: UseDragAndDropParams) => {
    const [currentOperation, setCurrentOperation] = useState<OperationType>(null);
    const [targetSection, setTargetSection] = useState<TargetSection>(null);

    // Helper function to create compound drag identifier
    const createDragId = (player: Player): string => {
        return `${player.id}-${player.position}`;
    };

    const getPlayerListType = (dragId: string): PlayerListType => {
        const [playerIdStr, position] = dragId.split('-');
        const playerId = parseInt(playerIdStr);
        
        // For pitchers (SP/RP), check pitcher lists first
        if (position === 'SP' || position === 'RP') {
            if (teamData.startingPitcher.id === playerId) {
                return 'starter';
            }
            if (teamData.bullpen.some(player => player.id === playerId)) {
                return 'bullpen';
            }
            if (teamData.unavailablePitchers.some(player => player.id === playerId)) {
                return 'unavailablePitchers';
            }
        }
        
        // For hitters, check hitter lists
        if (teamData.lineup.some(player => player.id === playerId)) {
            return 'lineup';
        }
        if (teamData.bench.some(player => player.id === playerId)) {
            return 'bench';
        }
        if (teamData.unavailableHitters.some(player => player.id === playerId)) {
            return 'unavailableHitters';
        }
        
        throw new Error(`Player ${playerId} with position ${position} not found in any list`);
    };

    const getOperationType = (sourceList: PlayerListType, targetList: PlayerListType): OperationType => {        
        // Swap operations
        if (
            (sourceList === 'starter' && targetList === 'bullpen') || 
            (sourceList === 'bullpen' && targetList === 'starter') ||
            (sourceList === 'starter' && targetList === 'unavailablePitchers') ||
            (sourceList === 'unavailablePitchers' && targetList === 'starter') ||

            (sourceList === 'lineup' && targetList === 'bench') ||
            (sourceList === 'bench' && targetList === 'lineup') ||
            (sourceList === 'lineup' && targetList === 'unavailableHitters') ||
            (sourceList === 'unavailableHitters' && targetList === 'lineup')
        ) { return 'swap' }

        if (sourceList === targetList) {
            return 'reorder';
        }
        
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
                newBullpen[targetIndex] = transformPlayerForRole(sourcePlayer, 'RP');
                newStartingPitcher = transformPlayerForRole(targetPlayer, 'SP');
            } else {
                newBullpen[sourceIndex] = transformPlayerForRole(targetPlayer, 'RP');
                newStartingPitcher = transformPlayerForRole(sourcePlayer, 'SP');
            }

            onPitcherReorder(teamType, newStartingPitcher, newBullpen);
        } else if (sourceList === 'unavailablePitchers' && (targetList === 'bullpen' || targetList === 'starter')) {
            const newUnavailablePitchers = teamData.unavailablePitchers.filter(p => p.id !== sourcePlayer.id);
            const newBullpen = [...teamData.bullpen];
            let newStartingPitcher: Player | null = null;
            
            if (targetList === 'bullpen') {
                const newReliever = transformPlayerForRole(sourcePlayer, 'RP');
                newBullpen.push(newReliever);
            } else if (targetList === 'starter') {
                newStartingPitcher = transformPlayerForRole(sourcePlayer, 'SP');
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
                    newStartingPitcher = transformPlayerForRole(targetPlayer, 'SP');
                    newUnavailablePitchers[targetIndex] = transformPlayerForRole(sourcePlayer, 'RP');
                } else {
                    // If dropping at end, promote first bullpen pitcher or set to null
                    newStartingPitcher = newBullpen.length > 0 ? transformPlayerForRole(newBullpen[0], 'SP') : null;
                    if (newBullpen.length > 0) {
                        newBullpen.splice(0, 1);
                    }
                    newUnavailablePitchers.push(transformPlayerForRole(sourcePlayer, 'RP'));
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

        const sourceListType = getPlayerListType(active.id as string);
        const targetListType = getPlayerListType(over.id as string);
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

        const sourceListType = getPlayerListType(active.id as string);
        const targetListType = getPlayerListType(over.id as string);
        const operationType = getOperationType(sourceListType, targetListType);
        
        const getIndex = (dragId: string, listType: PlayerListType): number => {
            const playerId = parseInt(dragId.split('-')[0]);
            switch (listType) {
                case 'lineup':
                    return teamData.lineup.findIndex(p => p.id === playerId);
                case 'bench':
                    return teamData.bench.findIndex(p => p.id === playerId);
                case 'unavailableHitters':
                    return teamData.unavailableHitters.findIndex(p => p.id === playerId);
                case 'bullpen':
                    return teamData.bullpen.findIndex(p => p.id === playerId);
                case 'starter':
                    return 0;
                case 'unavailablePitchers':
                    return teamData.unavailablePitchers.findIndex(p => p.id === playerId);
                default:
                    return -1;
            }
        };

        const sourceIndex = getIndex(active.id as string, sourceListType);
        const targetIndex = getIndex(over.id as string, targetListType);

        if (operationType === 'swap' || operationType === 'move') {
            handleSwap(sourceListType, targetListType, sourceIndex, targetIndex);
        } else {
            handleReorder(sourceListType, sourceIndex, targetIndex);
        }
        
        // Reset operation after handling
        setCurrentOperation(null);
        setTargetSection(null);
    };

    return {
        handleDragOver,
        handleDragEnd,
        getPlayerListType,
        createDragId,
        currentOperation,
        targetSection
    };
};

// ---------- Exports ----------
export default useDragAndDrop;

