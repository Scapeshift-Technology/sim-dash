import { FgLeagueData, FgLeagueDataTotals } from "@/types/mlb";

// ---------- Main function for FanGraphs API ----------
/**
 * Finds, using the FanGraphs API, the league-wide totals for the hitting outcomes away/home/combined
 * @returns {FgLeagueData} The league-wide totals
 */
async function getFgLeagueData(): Promise<FgLeagueData> {
  // Make API urls
  const FANGRAPHS_API_BASE_URL = "https://www.fangraphs.com/api/leaders/major-league/data"

  const urlHome = `${FANGRAPHS_API_BASE_URL}?pos=all&stats=bat&lg=all&qual=y&ind=0&season1=2011&season=2025&team=0%2Css&type=0&month=15`;
  const urlAway = `${FANGRAPHS_API_BASE_URL}?pos=all&stats=bat&lg=all&qual=y&ind=0&season1=2011&season=2025&team=0%2Css&type=0&month=16`;
  const urlParkNeutral = `${FANGRAPHS_API_BASE_URL}?pos=all&stats=bat&lg=all&qual=y&ind=0&season1=2011&season=2025&team=0%2Css&type=0&month=0`;

  // Get totals
  const totalsHome = await getAggregateStats(urlHome);
  const totalsAway = await getAggregateStats(urlAway);
  const totalsNeutral = await getAggregateStats(urlParkNeutral);

  return {
    totalsHome, 
    totalsAway, 
    totalsNeutral
  }
}

export { getFgLeagueData };

// ---------- Helper functions ----------

/**
 * Gets the aggregate stats for the hitting outcomes away/home/combined
 * @param {string} url - The url to the FanGraphs API
 * @returns {FgLeagueDataTotals} The aggregate stats
 */
async function getAggregateStats(url: string): Promise<FgLeagueDataTotals> {
  // Hit api
  const response = await fetch(url);
  const responseData = await response.json();
  const data: FgLeagueDataTotals[] = responseData.data;

  // Create object to hold totals
  let totals: FgLeagueDataTotals = {
    AB: 0,
    PA: 0,
    '1B': 0,
    '2B': 0,
    '3B': 0,
    'HR': 0,
    'BB': 0,
    'HBP': 0,
    'SO': 0,
    SH: 0
  };
    
  // Loop through each season's data
  data.forEach((season: FgLeagueDataTotals) => {
    // Add each stat to running totals
    totals.AB += season.AB || 0;
    totals.PA += season.PA || 0;
    totals['1B'] += season['1B'] || 0;
    totals['2B'] += season['2B'] || 0;
    totals['3B'] += season['3B'] || 0;
    totals.HR += season.HR || 0;
    totals.BB += season.BB || 0;
    totals.HBP += season.HBP || 0;
    totals.SO += season.SO || 0;
    totals.SH += season.SH || 0;
  });
    
  return totals;
}
