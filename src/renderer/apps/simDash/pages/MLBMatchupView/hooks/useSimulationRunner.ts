import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchSimResults } from '@/simDash/store/slices/scheduleSlice';
import type { MLBGameContainer, MLBGameInputs2 } from '@/types/simInputs';
import type { SimResultsMLB } from '@/types/bettingResults';
import type { MLBGameSimInputData, SimHistoryEntry } from '@/types/simHistory';
import { runSimulation, runSeriesSimulation } from '../functions/simulation';
import { AppDispatch } from '@/store/store';
import { transformMLBGameInputs2ToDB } from '@/simDash/utils/transformers';

interface UseSimulationRunnerReturn {
    isSimulating: boolean;
    simError: string | null;
    runSingleGame: (options?: { numGames?: number }) => Promise<void>;
    runSeries: (options?: { numGames?: number }) => Promise<void>;
}

export function useSimulationRunner(
    matchId: number,
    league: string,
    simInputs: MLBGameContainer | undefined
): UseSimulationRunnerReturn {

    // ---------- State ----------

    const dispatch = useDispatch<AppDispatch>();
    const [isSimulating, setIsSimulating] = useState(false);
    const [simError, setSimError] = useState<string | null>(null);

    // ---------- Functions ----------

    const saveAndUpdateHistory = async (simResults: SimResultsMLB, inputData: MLBGameInputs2) => {
        // Transform data to specific DB types
        const dbInputData: MLBGameSimInputData = transformMLBGameInputs2ToDB(inputData);
        const timestamp = new Date().toISOString();

        const simHistoryEntry: SimHistoryEntry = {
            matchId,
            timestamp,
            simResults,
            inputData: dbInputData
        };

        try {
            const saveSuccess = await window.electronAPI.saveSimHistory(simHistoryEntry);
            if (!saveSuccess) {
                throw new Error('Unknown error');
            }
            dispatch(fetchSimResults({ league, matchId }));
        } catch (error) {
            throw new Error(`Error while saving simulation results`);
        }
    };

    const runSingleGame = async ({ numGames = 50000 } = {}) => {
        if (!simInputs) {
            setSimError('No simulation inputs available');
            return;
        }

        try {
            setIsSimulating(true);
            setSimError(null);

            const simResults = await runSimulation(simInputs.currentGame as MLBGameInputs2, numGames);
            await saveAndUpdateHistory(simResults, simInputs.currentGame as MLBGameInputs2);
        } catch (error) {
            setSimError(error instanceof Error ? error.message : 'An unexpected error occurred');
            console.error('Simulation error:', error);
        } finally {
            setIsSimulating(false);
        }
    };

    const runSeries = async ({ numGames = 50000 } = {}) => {
        if (!simInputs?.seriesGames) {
            setSimError('No series games data available');
            return;
        }

        try {
            setIsSimulating(true);
            setSimError(null);
            
            const simResults = await runSeriesSimulation(simInputs.seriesGames, numGames);
            await saveAndUpdateHistory(simResults, simInputs.currentGame as MLBGameInputs2);
        } catch (error) {
            setSimError(error instanceof Error ? error.message : 'An unexpected error occurred');
            console.error('Series simulation error:', error);
        } finally {
            setIsSimulating(false);
        }
    };

    return {
        isSimulating,
        simError,
        runSingleGame,
        runSeries
    };
} 