/**
 * Format American odds with comprehensive options
 * @param odds - The odds value to format
 * @param options - Formatting options
 * @returns Formatted American odds string or "N/A" for invalid values
 */
export function formatAmericanOdds(odds: number, options: {
  shortened?: boolean;
  signNeutral?: boolean;
  decimalPlaces?: number;
} = {}): string {
  const { shortened = false, signNeutral = false, decimalPlaces = shortened ? 0 : 2 } = options;
  
  // Zero is always invalid for American odds
  if (odds === 0) {
    return 'N/A';
  }
  
  // For shortened formatting, work with rounded integers
  if (shortened) {
    // Validate proper American odds for shortened formatting
    if (Math.abs(odds) < 100) {
      return 'N/A';
    }
    const num = Math.round(odds);
    
    // Handle exactly 100 case for shortened formatting only
    if (Math.abs(num) === 100) {
      return 'EV';
    }
    
    // Handle shortening for values between [100, 200)
    if (Math.abs(num) >= 100 && Math.abs(num) < 200) {
      const lastTwoDigits = Math.abs(num) % 100;
      const formattedDigits = lastTwoDigits.toString().padStart(2, '0');
      
      if (signNeutral) {
        return formattedDigits;
      } else {
        const sign = num >= 0 ? '+' : '-';
        return `${sign}${formattedDigits}`;
      }
    }
    
    // Handle sign-neutral formatting (absolute value)
    if (signNeutral) {
      return Math.abs(num).toString();
    }
    
    // Standard formatting with appropriate sign
    if (num >= 0) {
      return `+${num}`;
    } else {
      return `${num}`;
    }
  } else {
    // For non-shortened formatting, use decimal places (backward compatibility)
    const formatted = formatDecimal(Math.abs(odds), decimalPlaces);
    
    if (signNeutral) {
      return formatted;
    } else {
      return odds >= 0 ? `+${formatted}` : `-${formatted}`;
    }
  }
}

/**
 * Format decimal with specified number of places
 * @param value - The numeric value to format
 * @param places - Number of decimal places (default: 2)
 * @returns Formatted decimal string
 */
export function formatDecimal(value: number, places: number = 2): string {
  const factor = Math.pow(10, places);
  return (Math.round(value * factor) / factor).toFixed(places);
}

