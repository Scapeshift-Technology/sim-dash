import { LeagueName } from "./league";

// ---------- Config types ----------

export interface MainMarketConfig {
    marketType: string;
    periodTypeCode: string;
    periodNumber: number;
    strike: string;
}

export interface PropOUConfig {
    prop: string;
    contestantType: string;
    strike: number;
}

export interface PropYNConfig {
    name: string;
    contestantType: string;
}

export interface SavedConfiguration extends LeagueSavedConfiguration {
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
    PeriodName: string;
    PeriodNumber: number;
    PeriodTypeCode: string;
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

