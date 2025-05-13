import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { selectTeamInputs } from '@/store/slices/simInputsSlice';
import { LeagueName } from '@@/types/league';

const isLeanValid = (value: number) => value >= -10 && value <= 10;

interface UseLeanValidationProps {
    league: LeagueName;
    matchId: number;
}

interface UseLeanValidationReturn {
    hasInvalidLeans: boolean;
    invalidLeansCount: number;
    showInvalidLeansSnackbar: boolean;
    setShowInvalidLeansSnackbar: (show: boolean) => void;
}

export const useLeanValidation = ({ league, matchId }: UseLeanValidationProps): UseLeanValidationReturn => {
    const [showInvalidLeansSnackbar, setShowInvalidLeansSnackbar] = useState(false);
    const teamInputs = useSelector((state: RootState) => selectTeamInputs(state, league, matchId));

    const hasInvalidLeans = () => {
        if (!teamInputs) return false;

        // Check team-wide leans
        if (!isLeanValid(teamInputs.home.teamHitterLean) || 
            !isLeanValid(teamInputs.home.teamPitcherLean) ||
            !isLeanValid(teamInputs.away.teamHitterLean) || 
            !isLeanValid(teamInputs.away.teamPitcherLean)) {
            return true;
        }

        // Check individual leans
        const hasInvalidHitterLeans = (team: 'home' | 'away') => {
            return Object.values(teamInputs[team].individualHitterLeans).some(lean => !isLeanValid(lean));
        };
        const hasInvalidPitcherLeans = (team: 'home' | 'away') => {
            return Object.values(teamInputs[team].individualPitcherLeans).some(lean => !isLeanValid(lean));
        };

        return hasInvalidHitterLeans('home') || 
               hasInvalidHitterLeans('away') || 
               hasInvalidPitcherLeans('home') || 
               hasInvalidPitcherLeans('away');
    };

    const getInvalidLeansCount = () => {
        if (!teamInputs) return 0;
        let count = 0;

        // Count team-wide leans
        if (!isLeanValid(teamInputs.home.teamHitterLean)) count++;
        if (!isLeanValid(teamInputs.home.teamPitcherLean)) count++;
        if (!isLeanValid(teamInputs.away.teamHitterLean)) count++;
        if (!isLeanValid(teamInputs.away.teamPitcherLean)) count++;

        // Count individual hitter leans
        Object.values(teamInputs.home.individualHitterLeans).forEach(lean => {
            if (!isLeanValid(lean)) count++;
        });
        Object.values(teamInputs.away.individualHitterLeans).forEach(lean => {
            if (!isLeanValid(lean)) count++;
        });

        // Count individual pitcher leans
        Object.values(teamInputs.home.individualPitcherLeans).forEach(lean => {
            if (!isLeanValid(lean)) count++;
        });
        Object.values(teamInputs.away.individualPitcherLeans).forEach(lean => {
            if (!isLeanValid(lean)) count++;
        });

        return count;
    };

    // Show snackbar when leans become invalid
    useEffect(() => {
        if (hasInvalidLeans()) {
            setShowInvalidLeansSnackbar(true);
        }
    }, [teamInputs]);

    return {
        hasInvalidLeans: hasInvalidLeans(),
        invalidLeansCount: getInvalidLeansCount(),
        showInvalidLeansSnackbar,
        setShowInvalidLeansSnackbar
    };
};
