/**
 * Format American odds with consistent 2 decimal places
 * @param odds - The odds value to format
 * @returns Formatted American odds string or "N/A" for invalid values
 */
export function formatAmericanOdds(odds: number): string {
  // Zero is invalid for American odds
  if (odds === 0) {
    return 'N/A';
  }
  
  const formatted = formatDecimal(odds, 2);
  const numericValue = Number(formatted);
  return numericValue >= 0 ? `+${formatted}` : formatted;
}

export function formatDecimal(value: number, places: number = 2): string {
  const factor = Math.pow(10, places);
  return (Math.round(value * factor) / factor).toFixed(places);
}

