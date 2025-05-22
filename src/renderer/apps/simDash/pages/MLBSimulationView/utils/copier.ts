import { ReducedMatchupLineups, SimMetadataMLB } from '@@/types/simHistory';
import { 
    OutcomeCounts,
    SidesData,
    TotalsData,
    SeriesData,
    PropsData,
    FirstInningPropsData,
} from '@/types/bettingResults';
import { convertTableToTSV } from '@/simDash/utils/copyUtils';
import { formatFirstInningData, firstInningColumns } from '@/simDash/components/FirstInningTable';
import { formatSidesData, sidesColumns } from '@/simDash/components/SidesTable';
import { formatTotalsData, totalsColumns } from '@/simDash/components/TotalsTable';
import { formatSeriesData, seriesColumns } from '@/simDash/components/SeriesTable';
import { convertLineupsToTSV } from '@/simDash/utils/copyUtils';
import { MarketLinesMLB } from '@@/types/mlb';
import { displayAmericanOdds } from '@/simDash/utils/display';
import { MLBGameSimInputs, MLBGameSimInputsTeam } from '@@/types/simInputs';

// ---------- Main function ----------

const copyAllResults = (
    sidesData: SidesData[],
    totalsData: TotalsData[],
    propsData: PropsData,
    seriesData: SeriesData[],
    simInputs: MLBGameSimInputs | null,
    lineups: ReducedMatchupLineups | null,
    gameInfo: SimMetadataMLB | null,
    awayTeamName: string | null,
    homeTeamName: string | null
): string => {
    if (!sidesData || !totalsData || !propsData || !lineups || !gameInfo || !awayTeamName || !homeTeamName) return '';

    // Get left column content
    const leftSections: string[] = [];
    
    // 1. Lineups
    const lineupsTSV = convertLineupsToTSV(lineups, gameInfo, awayTeamName, homeTeamName);
    leftSections.push(lineupsTSV);

    // 2. Betting bounds
    if (gameInfo.bettingBounds) {
        const boundsTSV = copyBettingBounds(gameInfo.bettingBounds as MarketLinesMLB);
        leftSections.push('', boundsTSV);
    }

    // 3. Leans
    const leansTSV = copyLeans(simInputs);
    leftSections.push('', leansTSV);
    
    // 4. First inning props
    const firstInningData = formatFirstInningData(propsData.firstInning);
    const firstInningTSV = convertTableToTSV(firstInningData, firstInningColumns);
    leftSections.push('', firstInningTSV);
    
    // 5. Series (if exists)
    if (seriesData.length > 0) {
        const seriesTSV = copySeries(seriesData);
        leftSections.push('', seriesTSV);
    }

    // Find the maximum number of columns in left section
    const leftLines = leftSections.join('\n').split('\n');
    const maxLeftColumns = Math.max(...leftLines.map(line => 
        line.split('\t').length
    ));
    
    // Get right column (Totals)
    const totalsTSV = copyTotals(totalsData);
    const rightLines = totalsTSV.split('\n');

    // Combine with proper alignment
    const result: string[] = [];
    const maxLines = Math.max(leftLines.length, rightLines.length);
    
    for (let i = 0; i < maxLines; i++) {
        const leftContent = leftLines[i] || '';
        const rightContent = rightLines[i] || '';
        
        const leftParts = leftContent.split('\t');
        const padding = '\t'.repeat(maxLeftColumns - leftParts.length + 2); // +2 for blank column and one more
        
        result.push(`${leftContent}${padding}${rightContent}`);
    }

    return result.join('\n');
};

export { copyAllResults };

// ---------- Helper functions ----------
// ----- Copy functions -----

const copyBettingBounds = (bettingBounds: MarketLinesMLB): string => {
    const { awayML, homeML, over, under } = bettingBounds;
    const rows: string[] = [
        `ML\t${displayAmericanOdds(awayML)}\t${displayAmericanOdds(homeML)}`,
        `Tot=${over.line}\tu${displayAmericanOdds(under.odds)}\to${displayAmericanOdds(over.odds)}`
    ];
    return rows.join('\n');
};

const copyLeans = (simInputs: MLBGameSimInputs | null): string => {
    const { away, home } = simInputs || {};

    const rows: string[] = [
        `Team Hitting Leans:\t${(away as MLBGameSimInputsTeam).teamHitterLean}\t${(home as MLBGameSimInputsTeam).teamHitterLean}`,
        `Team Pitching Leans:\t${(away as MLBGameSimInputsTeam).teamPitcherLean}\t${(home as MLBGameSimInputsTeam).teamPitcherLean}`
    ]

    return rows.join('\n');
}

const copyFirstInningProps = (playerProps: FirstInningPropsData[]): string => {
    const formatted = formatFirstInningData(playerProps);
    return convertTableToTSV(formatted, firstInningColumns);
};

const copyTotals = (totalsData: TotalsData[]): string => {
    const formatted = formatTotalsData(totalsData);
    return convertTableToTSV(formatted, totalsColumns);
};

const copySeries = (seriesData: SeriesData[]): string => {
    const formatted = formatSeriesData(seriesData);
    return convertTableToTSV(formatted, seriesColumns);
};


