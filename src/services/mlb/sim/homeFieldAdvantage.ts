import { getFgLeagueData } from "../external/fanGraphs"
import { FgLeagueDataTotals, Percentages } from "@/types/mlb";

// Cache for multipliers
let cachedMultipliers: { homeMultipliers: Percentages; awayMultipliers: Percentages } | null = null;

// ---------- Home field advantage main functions ----------
/**
 * Initialize the home field multipliers. Must be called once before using getHomeFieldMultipliersSync
 */
async function initializeHomeFieldMultipliers() {
  if (cachedMultipliers) return; // Already initialized

  const { totalsHome, totalsAway, totalsNeutral } = await getFgLeagueData()

  // Make totals into percentages
  const percentagesHome = calculatePercentages(totalsHome)
  const percentagesAway = calculatePercentages(totalsAway)
  const percentagesNeutral = calculatePercentages(totalsNeutral)

  // Find multipliers for home and away
  const homeMultipliers = calculateMultipliers(percentagesNeutral, percentagesHome)
  const awayMultipliers = calculateMultipliers(percentagesNeutral, percentagesAway)

  // Cache the results
  cachedMultipliers = {
    homeMultipliers,
    awayMultipliers
  };
}

/**
 * Get the cached home field multipliers synchronously. initializeHomeFieldMultipliers must be called first.
 */
function getHomeFieldMultipliers() {
  if (!cachedMultipliers) {
    throw new Error('Home field multipliers not initialized. Call initializeHomeFieldMultipliers first.');
  }
  return cachedMultipliers;
}

export { getHomeFieldMultipliers, initializeHomeFieldMultipliers };

// ---------- Helper functions ----------

/**
 * Calculates percentages from raw stats for batters
 * 
 * @param {Object} stats - Object containing raw batting statistics
 * @returns {Object} - Object with calculated and normalized percentages
 */
function calculatePercentages(stats: FgLeagueDataTotals): Percentages {
  // Map the required statistics
  const PA = stats.PA;
  const SH = stats.SH;
  const K = stats.SO || 0;
  const BB = stats.BB;
  const HBP = stats.HBP;
  const singles = stats['1B'];
  const doubles = stats['2B'];
  const triples = stats['3B'];
  const HR = stats.HR;
  const AB = stats.AB;
  const H = stats.H || (singles + doubles + triples + HR); // Use H if available, otherwise calculate

  // Calculate used plate appearances
  const usedPA = PA - SH;

  // Check for division by zero
  if (usedPA === 0) {
    throw new Error("Used plate appearances cannot be zero");
  }

  // Calculate raw percentages
  const rawPercentages: Percentages = {
    adj_perc_K: K / usedPA,
    adj_perc_BB: (BB + HBP) / usedPA,
    adj_perc_1B: singles / usedPA,
    adj_perc_2B: doubles / usedPA,
    adj_perc_3B: triples / usedPA,
    adj_perc_HR: HR / usedPA,
    adj_perc_OUT: (AB - H - K) / usedPA
  };
  
  // Use the normalizePercentages helper function
  const normalizedPercentages = normalizePercentages(rawPercentages);
  
  // Verify normalization
  const values = Object.values(normalizedPercentages) as number[];
  const finalSum = values.reduce((sum, val) => sum + val, 0);
  if (finalSum > 1.000001 || finalSum < 0.999999) {
    throw new Error("Percentage sums after normalization not within bounds");
  }
  
  return normalizedPercentages;
}

/**
 * Helper to normalize a set of percentages so they sum to 1
 * 
 * @param {Object} percentages - Object containing percentage values
 * @returns {Object} - Object with normalized percentage values
 */
function normalizePercentages(percentages: Percentages): Percentages {
  const values = Object.values(percentages) as number[];
  const sum = values.reduce((acc, val) => acc + val, 0);
  const normalized: Percentages = {};

  for (const key in percentages) {
    normalized[key] = percentages[key] / sum;
  }

  return normalized;
}

/**
 * Calculates multipliers needed to convert from one set of percentages to another
 * 
 * @param {Object} basePercentages - Base percentages object (source)
 * @param {Object} targetPercentages - Target percentages object (destination)
 * @returns {Object} - Object with multipliers for each percentage type
 */
function calculateMultipliers(basePercentages: Percentages, targetPercentages: Percentages): Percentages {
  // Create result object to store multipliers
  const multipliers: Percentages = {};
  
  // Calculate multiplier for each percentage type
  for (const key in basePercentages) {
    if (basePercentages.hasOwnProperty(key) && targetPercentages.hasOwnProperty(key)) {
      // Avoid division by zero
      if (basePercentages[key] === 0) {
        // Handle the case where base percentage is zero
        // Could set to 1.0 (no change) or some default value
        multipliers[key] = 1.0;
      } else {
        // Calculate multiplier as target/base
        multipliers[key] = targetPercentages[key] / basePercentages[key];
      }
    }
  }
  
  return multipliers;
}
  
    