import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { 
    toggleParkEffects, 
    fetchMlbGameParkEffects,
    selectParkEffectsEnabled,
    selectGameParkEffectsStatus,
    selectGameParkEffectsError,
    selectGameLineups,
    selectGameMetadata
} from '@/simDash/store/slices/simInputsSlice';
import { LeagueName } from '@@/types/league';
import { Player, TeamLineup } from '@@/types/mlb';
import EffectsCheckbox from './EffectsCheckbox';

interface ParkEffectsCheckboxProps {
    matchId: number;
    leagueName: LeagueName;
}

const ParkEffectsCheckbox: React.FC<ParkEffectsCheckboxProps> = ({ matchId, leagueName }) => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------

    const enabled = useSelector((state: RootState) => selectParkEffectsEnabled(state, leagueName, matchId));
    const status = useSelector((state: RootState) => selectGameParkEffectsStatus(state, leagueName, matchId));
    const error = useSelector((state: RootState) => selectGameParkEffectsError(state, leagueName, matchId));
    const gameLineups = useSelector((state: RootState) => selectGameLineups(state, leagueName, matchId));
    const gameMetadata = useSelector((state: RootState) => selectGameMetadata(state, leagueName, matchId));

    // ---------- Handlers ----------

    const handleToggle = () => {
        dispatch(toggleParkEffects({ league: leagueName, matchId }));
    };

    const handleRetry = () => {
        if (!gameLineups || !gameMetadata?.venueId) return;

        const getTeamPlayers = (team: TeamLineup | undefined): Player[] => {
            if (!team) return [];
            return [
                ...(team.lineup || []),
                ...(team.bench || []),
                ...(team.bullpen || []),
                team.startingPitcher,
                ...(team.unavailableHitters || []),
                ...(team.unavailablePitchers || [])
            ].filter(Boolean) as Player[];
        };

        const playerList = [
            ...getTeamPlayers(gameLineups.away),
            ...getTeamPlayers(gameLineups.home)
        ];

        dispatch(fetchMlbGameParkEffects({
            matchId,
            venueId: gameMetadata.venueId,
            players: playerList
        }));
    };

    // ---------- Render ----------

    return (
        <EffectsCheckbox
            effectType="Park Effects"
            enabled={enabled}
            status={status}
            error={error}
            onToggle={handleToggle}
            onRetry={handleRetry}
        />
    );
};

export default ParkEffectsCheckbox; 