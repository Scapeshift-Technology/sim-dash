export interface MarketLine {
    line: number;
    odds: number;
}

export interface MarketLines {
    awayML: number;
    homeML: number;
    totalOver: MarketLine;
    totalUnder: MarketLine;
}

export interface MarketLineErrors {
    awayML?: string;
    homeML?: string;
    totalOver?: string;
    totalUnder?: string;
}
