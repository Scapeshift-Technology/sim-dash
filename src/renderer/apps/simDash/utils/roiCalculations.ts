// ---------- ROI Demand Price Calculation ----------

/**
 * Calculate the price needed to achieve a specific ROI percentage relative to the pessimistic price.
 * @param fairWinProbability - The fair win probability (0-1)
 * @param marginOfError - The margin of error (0-1)  
 * @param roiDemandDecimal - The desired ROI as a decimal (e.g., 0.02 for 2%)
 * @returns American odds that would provide the desired ROI, or null if impossible
 */
export function calculateROIDemandPrice(fairWinProbability: number, marginOfError: number, roiDemandDecimal: number): number | null {
  // Debug logging (remove later)
  console.log('ROI Calc Debug - INPUT:', { fairWinProbability, marginOfError, roiDemandDecimal });
  
  // For exactly 0% ROI, return the pessimistic odds (same as USA-MOE-PESSIMISTIC column)
  if (Math.abs(roiDemandDecimal) <= 0.0001) { // Handle floating point precision issues
    console.log('ROI Calc - 0% ROI detected');
    
    // Calculate pessimistic probability exactly like varianceProportion in other transformations
    const pessimisticProb = Math.min(Math.max(fairWinProbability - marginOfError, 0), 1);
    
    console.log('ROI Calc - pessimisticProb:', pessimisticProb);
    
    // Handle edge cases to avoid division by zero
    if (pessimisticProb <= 0.0001) {
      console.log('ROI Calc - returning high positive odds for near-zero prob');
      return 9999;
    }
    if (pessimisticProb >= 0.9999) {
      console.log('ROI Calc - returning high negative odds for near-one prob');
      return -9999;
    }
    
    // Use exact same formula as proportionToAmericanOdds used for USA-MOE-PESSIMISTIC
    let result;
    if (pessimisticProb >= 0.5) {
      result = -100 * pessimisticProb / (1 - pessimisticProb);
    } else {
      result = 100 * (1 - pessimisticProb) / pessimisticProb;
    }
    
    console.log('ROI Calc - 0% result:', result);
    return result;
  }
  
  console.log('ROI Calc - Non-zero ROI path');
  
  // Calculate pessimistic probability as baseline (fair probability - margin of error)
  const pessimisticProbability = Math.max(0, Math.min(1, fairWinProbability - marginOfError));
  
  // Handle edge cases for non-zero ROI
  if (pessimisticProbability <= 0 || pessimisticProbability >= 1) {
    console.log('ROI Calc - Edge case: pessimistic prob out of range:', pessimisticProbability);
    return null; // Impossible to calculate meaningful odds for non-zero ROI
  }
  
  // Apply ROI calculation relative to pessimistic probability
  const roiAdjustedProbability = pessimisticProbability / (1 + roiDemandDecimal);
  console.log('ROI Calc - roiAdjustedProbability:', roiAdjustedProbability);
  
  // Ensure the adjusted probability is valid
  if (roiAdjustedProbability <= 0 || roiAdjustedProbability >= 1) {
    console.log('ROI Calc - Adjusted prob out of range:', roiAdjustedProbability);
    return null; // ROI demand is too high/low to be achievable
  }
  
  // Convert to American odds
  let result;
  if (roiAdjustedProbability <= 0.5) {
    // Positive odds
    const odds = (100 * (1 - roiAdjustedProbability)) / roiAdjustedProbability;
    result = Math.min(odds, 10000); // Cap at reasonable maximum
  } else {
    // Negative odds  
    const odds = (-100 * roiAdjustedProbability) / (1 - roiAdjustedProbability);
    result = Math.max(odds, -10000); // Cap at reasonable minimum
  }
  
  console.log('ROI Calc - Non-zero final result:', result);
  return result;
}

/**
 * Formats the ROI demand price for display, handling null values
 * 
 * @param price - The calculated ROI demand price or null
 * @returns Formatted string for display
 */
export function formatROIDemandPrice(price: number | null): string {
  if (price === null) {
    return 'N/A';
  }
  
  if (price >= 0) {
    return `+${price.toFixed(2)}`;
  } else {
    return `${price.toFixed(2)}`;
  }
} 