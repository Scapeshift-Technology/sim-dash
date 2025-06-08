import { LeagueName } from "./league";

// ---------- Config types ----------

export type MarketType = 'Spread' | 'Total' | 'TeamTotal';
export type PeriodTypeCode = 'M' | 'H' | 'I';
export type PeriodKey = `${PeriodTypeCode}${number}` | 'fullGame' | 'firstFive';

export interface MainMarketConfig {
    marketType: MarketType;
    periodTypeCode: PeriodTypeCode;
    periodNumber: number;
    strike: string;
}

export interface PropOUConfig {
    prop: string;
    contestantType: string;
    strike: number;
}

export interface PropYNConfig {
    prop: 'FirstToScore' | 'LastToScore';
    contestantType: 'TeamLeague';
}

export interface SavedConfiguration extends LeagueSavedConfiguration {
    isActive: boolean;
    mainMarkets: MainMarketConfig[];
    propsOU: PropOUConfig[];
    propsYN: PropYNConfig[];
};

export interface LeagueSavedConfiguration {
    league: LeagueName;
    name: string;
}

// ---------- State types ----------

export interface BetType {
    value: string;
    label: string;
}

export interface Period {
    SuperPeriodType: string;
    SuperPeriodNumber: number;
    PeriodName: string;
    PeriodNumber: number;
    PeriodTypeCode: string;
}

// ---------- Tree Period Types ----------

export interface TreePeriodNode {
    // Database fields from recursive CTE
    Sport: string;
    League: string;
    SuperPeriodType: string;
    SuperPeriodNumber: number;
    SubPeriodType: string;
    SubPeriodNumber: number;
    
    // Parent relationship fields from recursive CTE
    Sport_Parent?: string;
    League_Parent?: string;
    SuperPeriodType_Parent?: string;
    SuperPeriodNumber_Parent?: number;
    SubPeriodType_Parent?: string;
    SubPeriodNumber_Parent?: number;
    
    // Hierarchy information from recursive CTE
    HierarchyLevel: number;
    
    // Database fields from LeaguePeriodShortcode join
    PeriodTypeCode?: string; // May be null for some nodes
    PeriodNumber?: number;   // May be null for some nodes
    
    // Computed fields
    TreeType: 'Branch' | 'Node';
    DisplayName: string;
    NodeKey: string; // Unique identifier for the node
    
    // Tree state (simplified since we have full tree)
    isExpanded?: boolean;
    children?: TreePeriodNode[];
}

export interface TreeExpansionState {
    [nodeKey: string]: boolean;
}

// Root tree query parameters
export interface TreeRootParams {
    league: string;
}

export interface ValidationConfig {
    increment: number; // For input step attribute
    validateValue: (value: string) => string | null; // Returns error message or null if valid
}

export interface ConfigurationRow {
    id: string;
    betType: string;
    period: string;
    line: number;
}

export interface LeagueOUProps {
    ContestantType: string;
    Prop: string;
}

export type YNProp = 'FirstToScore' | 'LastToScore';
export type YNContestantType = 'TeamLeague';

export interface LeagueYNProps {
    Prop: 'FirstToScore' | 'LastToScore';
    ContestantType: 'TeamLeague';
}

