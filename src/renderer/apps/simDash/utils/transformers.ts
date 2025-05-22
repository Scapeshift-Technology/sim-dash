import { MatchupLineups, Player, TeamLineup, LineupsSource } from '@/types/mlb';
import { MLBGameSimInputData, ReducedMatchupLineups, ReducedPlayer, ReducedTeamLineup, SimMetadataMLB } from '@/types/simHistory';
import { MLBGameInputs2, MLBGameSimInputs } from '@/types/simInputs';

// ---------- Matchup Lineups ----------\

function transformMLBGameInputs2ToDB(gameInputs: MLBGameInputs2): MLBGameSimInputData {
    const simInputs: MLBGameSimInputs = gameInputs.simInputs;
    const lineups: ReducedMatchupLineups = transformMatchupLineupsToReduced(gameInputs.lineups);
    const gameInfo: SimMetadataMLB = {
        ...gameInputs.gameInfo,
        lineupsSource: gameInputs.gameInfo.lineupsSource as LineupsSource,
    }

    return {
        simInputs,
        lineups,
        gameInfo
    }
}

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


