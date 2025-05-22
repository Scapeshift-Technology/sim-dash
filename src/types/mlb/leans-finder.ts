// ----- MLB Leans Finder Types -----
// -- Market lines types --

export interface MarketLineDifferenceMLB {
  mlAway: {
    simValue: number;
    upperBound: number;
    lowerBound: number;
  };
  total: {
    simValue: number;
    upperBound: number;
    lowerBound: number;
  };
};
  
interface TotalLinesMLB {
  line: number;
  odds: number;
};

export interface MarketLinesMLB {
  awayML: number;
  homeML: number;
  over: TotalLinesMLB;
  under: TotalLinesMLB;
};

// -- Leans types --

export interface IndividualTeamLeansMLB {
  hitter: number;
  pitcher: number;
};

interface AllTeamLeansMLB {
  away: IndividualTeamLeansMLB;
  home: IndividualTeamLeansMLB;
};

export interface OptimalLeansMLB {
  teams: AllTeamLeansMLB;
};

