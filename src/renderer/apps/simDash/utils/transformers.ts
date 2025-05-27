import { MatchupLineups, Player, TeamLineup, LineupsSource, MlbLiveDataApiResponse } from '@/types/mlb';
import { MLBGameSimInputData, ReducedGameStateMLB, ReducedMatchupLineups, ReducedPlayer, ReducedTeamLineup, SimMetadataMLB } from '@/types/simHistory';
import { MLBGameInputs2, MLBGameSimInputs } from '@/types/simInputs';
import { createReducedGameStateFromLiveData } from '@/mlb/utils/gameState';

// ---------- Main function ----------

function transformMLBGameInputs2ToDB(gameInputs: MLBGameInputs2, liveGameData?: MlbLiveDataApiResponse): MLBGameSimInputData {
    const simInputs: MLBGameSimInputs = gameInputs.simInputs;
    const lineups: ReducedMatchupLineups = transformMatchupLineupsToReduced(gameInputs.lineups);
    let gameState: ReducedGameStateMLB | undefined;
    if (liveGameData) {
        gameState = createReducedGameStateFromLiveData(lineups, liveGameData);
    }

    // const gameState: ReducedGameStateMLB = transformGameStateToReduced(gameInputs.liveGameData);
    const gameInfo: SimMetadataMLB = {
        ...gameInputs.gameInfo,
        lineupsSource: gameInputs.gameInfo.lineupsSource as LineupsSource,
        gameState
    }

    return {
        simInputs,
        lineups,
        gameInfo
    }
}

// ---------- Game State ----------





// ---------- Matchup Lineups ----------

function transformMatchupLineupsToReduced(matchupLineups: MatchupLineups): ReducedMatchupLineups {
    return {
        home: transformTeamLineupToReduced(matchupLineups.home),
        away: transformTeamLineupToReduced(matchupLineups.away)
    }
}

function transformTeamLineupToReduced(teamLineup: TeamLineup): ReducedTeamLineup {
    return {
        lineup: transformPlayerArrayToReduced(teamLineup.lineup),
        startingPitcher: transformPlayerToReduced(teamLineup.startingPitcher),
        bullpen: transformPlayerArrayToReduced(teamLineup.bullpen),
        bench: transformPlayerArrayToReduced(teamLineup.bench)
    }
}

function transformPlayerArrayToReduced(players: Player[]): ReducedPlayer[] {
    return players.map(player => transformPlayerToReduced(player));
}

function transformPlayerToReduced(player: Player): ReducedPlayer {
    return {
        id: player.id,
        name: player.name || ''
    }
}

export { transformMLBGameInputs2ToDB };


