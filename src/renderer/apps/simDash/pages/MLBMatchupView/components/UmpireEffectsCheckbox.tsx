import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { 
    toggleUmpireEffects, 
    fetchMlbGameUmpireEffects,
    selectUmpireEffectsEnabled,
    selectGameUmpireEffectsStatus,
    selectGameUmpireEffectsError,
    selectGameMetadata
} from '@/simDash/store/slices/simInputsSlice';
import { LeagueName } from '@@/types/league';
import EffectsCheckbox from './EffectsCheckbox';

interface UmpireEffectsCheckboxProps {
    matchId: number;
    leagueName: LeagueName;
}

const UmpireEffectsCheckbox: React.FC<UmpireEffectsCheckboxProps> = ({ matchId, leagueName }) => {
    const dispatch = useDispatch<AppDispatch>();

    // ---------- State ----------

    const enabled = useSelector((state: RootState) => selectUmpireEffectsEnabled(state, leagueName, matchId));
    const status = useSelector((state: RootState) => selectGameUmpireEffectsStatus(state, leagueName, matchId));
    const error = useSelector((state: RootState) => selectGameUmpireEffectsError(state, leagueName, matchId));
    const gameMetadata = useSelector((state: RootState) => selectGameMetadata(state, leagueName, matchId));

    // ---------- Handlers ----------

    const handleToggle = () => {
        dispatch(toggleUmpireEffects({ league: leagueName, matchId }));
    };

    const handleRetry = () => {
        const hpUmp = gameMetadata?.officials?.find(ump => ump.officialType === 'Home Plate');
        if (!hpUmp?.official?.id) return;

        dispatch(fetchMlbGameUmpireEffects({
            matchId,
            umpireId: hpUmp.official.id
        }));
    };

    // ---------- Render ----------

    return (
        <EffectsCheckbox
            effectType="Umpire Effects"
            enabled={enabled}
            status={status}
            error={error}
            onToggle={handleToggle}
            onRetry={handleRetry}
        />
    );
};

export default UmpireEffectsCheckbox; 