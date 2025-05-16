import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { TeamLineup, Player, TeamType } from '@/types/mlb';

// ---------- Types ----------

type PlayerListType = 'lineup' | 'bench' | 'starter' | 'bullpen';

interface UseDragAndDropParams {
    teamData: TeamLineup;
    teamType: TeamType;
    onLineupReorder: (teamType: TeamType, newLineup: Player[], newBench: Player[] | null) => void;
    onPitcherReorder: (teamType: TeamType, newStartingPitcher: Player | null, newBullpen: Player[]) => void;
}

// ---------- Main hook ----------

const useDragAndDrop = ({
    teamData,
    teamType,
    onLineupReorder,
    onPitcherReorder
}: UseDragAndDropParams) => {
    const getPlayerListType = (playerId: number): PlayerListType => {
        if (teamData.lineup.some(player => player.id === playerId)) {
            return 'lineup';
        }
        if (teamData.bench.some(player => player.id === playerId)) {
            return 'bench';
        }
        if (teamData.startingPitcher.id === playerId) {
            return 'starter';
        }
        if (teamData.bullpen.some(player => player.id === playerId)) {
            return 'bullpen';
        }
        throw new Error(`Player ${playerId} not found in any list`);
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
                case 'starter':
                    return teamData.startingPitcher;
                case 'bullpen':
                    return teamData.bullpen[index];
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
        }
    };

    // ---------- Main handler ----------

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }

        const sourceListType = getPlayerListType(active.id as number);
        const targetListType = getPlayerListType(over.id as number);

        const getIndex = (id: number, listType: PlayerListType): number => {
            switch (listType) {
                case 'lineup':
                    return teamData.lineup.findIndex(p => p.id === id);
                case 'bench':
                    return teamData.bench.findIndex(p => p.id === id);
                case 'bullpen':
                    return teamData.bullpen.findIndex(p => p.id === id);
                case 'starter':
                    return 0;
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
    };

    return {
        handleDragEnd,
        getPlayerListType
    };
};

// ---------- Exports ----------
export default useDragAndDrop;

