import { FgLeagueData, FgLeagueDataTotals } from "@/types/mlb";
import fs from 'fs';
import path from 'path';

// Function to resolve the correct path for data files
function getDataPath(filename: string): string {
  // In development, files are in src/services/mlb/external/fangraphs_saved/
  // In production/compiled, files are in dist/src/services/mlb/external/fangraphs_saved/
  
  const developmentPath = path.join(__dirname, 'fangraphs_saved', filename);
  
  // Check if we're in development mode by looking for the source files
  if (fs.existsSync(developmentPath)) {
    return developmentPath;
  }
  
  // If not in development, assume we're in production with compiled files
  const productionPath = path.join(__dirname, 'fangraphs_saved', filename);
  return productionPath;
}

// ---------- Main function for FanGraphs API ----------
/**
 * Finds, using saved FanGraphs data, the league-wide totals for the hitting outcomes away/home/combined
 * @returns {FgLeagueData} The league-wide totals
 */
async function getFgLeagueData(): Promise<FgLeagueData> {
  // Get totals from saved local files
  const totalsHome = await getAggregateStats('home');
  const totalsAway = await getAggregateStats('away');
  const totalsNeutral = await getAggregateStats('parkNeutral');

  return {
    totalsHome, 
    totalsAway, 
    totalsNeutral
  }
}

export { getFgLeagueData };

// ---------- Helper functions ----------

/**
 * Gets the aggregate stats for the hitting outcomes away/home/combined from saved data
 * @param {string} dataType - The type of data to load ('home', 'away', or 'parkNeutral')
 * @returns {FgLeagueDataTotals} The aggregate stats
 */
async function getAggregateStats(dataType: 'home' | 'away' | 'parkNeutral'): Promise<FgLeagueDataTotals> {
  try {
    // Get the correct file path for the environment
    const filePath = getDataPath(`${dataType}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    const responseData = JSON.parse(fileContent);
    
    // Validate that we have the expected data structure
    if (!responseData.data || !Array.isArray(responseData.data)) {
      throw new Error(`Invalid data structure in ${dataType}.json - missing 'data' array`);
    }
    
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
  } catch (error) {
    console.error(`Error loading ${dataType} data:`, error);
    throw new Error(`Failed to load ${dataType} data from saved file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
