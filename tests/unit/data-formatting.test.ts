import { formatAmericanOdds, formatDecimal } from '../../src/renderer/apps/simDash/utils/display';
import { formatROIDemandPrice } from '../../src/renderer/apps/simDash/utils/roiCalculations';

describe('Data Formatting Functions', () => {
  describe('formatAmericanOdds', () => {
    test('should format positive odds with + sign', () => {
      expect(formatAmericanOdds(150)).toBe('+150.00');
      expect(formatAmericanOdds(100)).toBe('+100.00');
      expect(formatAmericanOdds(999)).toBe('+999.00');
    });

    test('should format negative odds without changing sign', () => {
      expect(formatAmericanOdds(-150)).toBe('-150.00');
      expect(formatAmericanOdds(-100)).toBe('-100.00');
      expect(formatAmericanOdds(-999)).toBe('-999.00');
    });

    test('should handle zero odds', () => {
      expect(formatAmericanOdds(0)).toBe('N/A');
    });

    test('should handle decimal odds with proper formatting', () => {
      expect(formatAmericanOdds(150.5)).toBe('+150.50');
      expect(formatAmericanOdds(-200.3)).toBe('-200.30');
    });

    test('should handle very large numbers', () => {
      expect(formatAmericanOdds(999999)).toBe('+999999.00');
      expect(formatAmericanOdds(-999999)).toBe('-999999.00');
    });

    test('should handle edge cases', () => {
      expect(formatAmericanOdds(0.1)).toBe('+0.10');
      expect(formatAmericanOdds(-0.1)).toBe('-0.10');
    });

    // NEW TESTS FOR SHORTENED OPTION
    describe('shortened option', () => {
      test('should shorten values in [100, 200) range with proper 2-digit padding', () => {
        expect(formatAmericanOdds(105, { shortened: true })).toBe('+05');
        expect(formatAmericanOdds(-105, { shortened: true })).toBe('-05');
        expect(formatAmericanOdds(150, { shortened: true })).toBe('+50');
        expect(formatAmericanOdds(-150, { shortened: true })).toBe('-50');
        expect(formatAmericanOdds(199, { shortened: true })).toBe('+99');
        expect(formatAmericanOdds(-199, { shortened: true })).toBe('-99');
      });

      test('should not shorten values >= 200', () => {
        expect(formatAmericanOdds(200, { shortened: true })).toBe('+200');
        expect(formatAmericanOdds(-200, { shortened: true })).toBe('-200');
        expect(formatAmericanOdds(250, { shortened: true })).toBe('+250');
        expect(formatAmericanOdds(-250, { shortened: true })).toBe('-250');
      });

      test('should handle exactly 100/-100 as EV when shortened', () => {
        expect(formatAmericanOdds(100, { shortened: true })).toBe('EV');
        expect(formatAmericanOdds(-100, { shortened: true })).toBe('EV');
      });

      test('should handle invalid American odds values as N/A when shortened', () => {
        // Zero is always invalid
        expect(formatAmericanOdds(0, { shortened: true })).toBe('N/A');
        
        // Any absolute value < 100 is invalid in American odds
        expect(formatAmericanOdds(99, { shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(-99, { shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(50, { shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(-50, { shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(1, { shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(-1, { shortened: true })).toBe('N/A');
      });
    });

    // NEW TESTS FOR SIGN NEUTRAL OPTION
    describe('signNeutral option', () => {
      test('should display absolute values without signs', () => {
        expect(formatAmericanOdds(150, { signNeutral: true })).toBe('150.00');
        expect(formatAmericanOdds(-150, { signNeutral: true })).toBe('150.00');
        expect(formatAmericanOdds(250, { signNeutral: true })).toBe('250.00');
        expect(formatAmericanOdds(-250, { signNeutral: true })).toBe('250.00');
      });

      test('should handle exactly 100/-100 normally when signNeutral (but not shortened)', () => {
        expect(formatAmericanOdds(100, { signNeutral: true })).toBe('100.00');
        expect(formatAmericanOdds(-100, { signNeutral: true })).toBe('100.00');
      });

      test('should still handle zero as N/A when signNeutral', () => {
        expect(formatAmericanOdds(0, { signNeutral: true })).toBe('N/A');
      });
      
      test('should handle invalid American odds values when signNeutral + shortened', () => {
        // Zero is always invalid
        expect(formatAmericanOdds(0, { signNeutral: true, shortened: true })).toBe('N/A');
        
        // Any absolute value < 100 is invalid when shortened
        expect(formatAmericanOdds(99, { signNeutral: true, shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(-99, { signNeutral: true, shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(50, { signNeutral: true, shortened: true })).toBe('N/A');
        expect(formatAmericanOdds(-50, { signNeutral: true, shortened: true })).toBe('N/A');
      });
    });

    // NEW TESTS FOR COMBINED OPTIONS
    describe('shortened + signNeutral options (for fair values in parentheses)', () => {
      test('should shorten and remove signs for values in [100, 200) range', () => {
        expect(formatAmericanOdds(105, { shortened: true, signNeutral: true })).toBe('05');
        expect(formatAmericanOdds(-105, { shortened: true, signNeutral: true })).toBe('05');
        expect(formatAmericanOdds(150, { shortened: true, signNeutral: true })).toBe('50');
        expect(formatAmericanOdds(-150, { shortened: true, signNeutral: true })).toBe('50');
        expect(formatAmericanOdds(199, { shortened: true, signNeutral: true })).toBe('99');
        expect(formatAmericanOdds(-199, { shortened: true, signNeutral: true })).toBe('99');
      });

      test('should remove signs but not shorten for values >= 200', () => {
        expect(formatAmericanOdds(200, { shortened: true, signNeutral: true })).toBe('200');
        expect(formatAmericanOdds(-200, { shortened: true, signNeutral: true })).toBe('200');
        expect(formatAmericanOdds(250, { shortened: true, signNeutral: true })).toBe('250');
        expect(formatAmericanOdds(-250, { shortened: true, signNeutral: true })).toBe('250');
      });

      test('should handle exactly 100/-100 as EV when both shortened and signNeutral', () => {
        expect(formatAmericanOdds(100, { shortened: true, signNeutral: true })).toBe('EV');
        expect(formatAmericanOdds(-100, { shortened: true, signNeutral: true })).toBe('EV');
      });
    });

    // NEW TESTS FOR DECIMAL PLACES OPTION
    describe('decimalPlaces option', () => {
      test('should respect custom decimal places for non-shortened formatting', () => {
        expect(formatAmericanOdds(150.5678, { decimalPlaces: 0 })).toBe('+151');
        expect(formatAmericanOdds(150.5678, { decimalPlaces: 1 })).toBe('+150.6');
        expect(formatAmericanOdds(150.5678, { decimalPlaces: 3 })).toBe('+150.568');
        expect(formatAmericanOdds(-150.5678, { decimalPlaces: 0 })).toBe('-151');
        expect(formatAmericanOdds(-150.5678, { decimalPlaces: 1 })).toBe('-150.6');
      });

      test('should default to 2 decimal places for non-shortened formatting', () => {
        expect(formatAmericanOdds(150.5678)).toBe('+150.57');
        expect(formatAmericanOdds(-150.5678)).toBe('-150.57');
      });

      test('should ignore decimalPlaces option when shortened is true', () => {
        expect(formatAmericanOdds(150.5678, { shortened: true, decimalPlaces: 3 })).toBe('+51');
        expect(formatAmericanOdds(-150.5678, { shortened: true, decimalPlaces: 3 })).toBe('-51');
      });
    });

    // NEW TESTS FOR SIMULATION SUMMARY USAGE PATTERNS
    describe('simulation summary usage patterns', () => {
      test('should format betting bounds with shortened option', () => {
        // Pattern used in formatBettingBoundsDisplay
        expect(formatAmericanOdds(145, { shortened: true })).toBe('+45');
        expect(formatAmericanOdds(-165, { shortened: true })).toBe('-65');
        expect(formatAmericanOdds(250, { shortened: true })).toBe('+250');
        expect(formatAmericanOdds(-250, { shortened: true })).toBe('-250');
      });

      test('should format fair moneyline values with shortened + signNeutral', () => {
        // Pattern used for fair values in parentheses on sides line
        expect(formatAmericanOdds(145, { shortened: true, signNeutral: true })).toBe('45');
        expect(formatAmericanOdds(-165, { shortened: true, signNeutral: true })).toBe('65');
        expect(formatAmericanOdds(250, { shortened: true, signNeutral: true })).toBe('250');
        expect(formatAmericanOdds(-250, { shortened: true, signNeutral: true })).toBe('250');
        
        // Invalid values should return N/A even with signNeutral
        expect(formatAmericanOdds(99, { shortened: true, signNeutral: true })).toBe('N/A');
        expect(formatAmericanOdds(-50, { shortened: true, signNeutral: true })).toBe('N/A');
      });

      test('should format fair totals values with shortened but NOT signNeutral', () => {
        // Pattern used for fair values in parentheses on totals line
        expect(formatAmericanOdds(145, { shortened: true })).toBe('+45');
        expect(formatAmericanOdds(-165, { shortened: true })).toBe('-65');
        expect(formatAmericanOdds(-104, { shortened: true })).toBe('-04');
        expect(formatAmericanOdds(104, { shortened: true })).toBe('+04');
      });
    });
  });

  describe('formatDecimal', () => {
    test('should format decimals to 2 places by default', () => {
      expect(formatDecimal(0.1234)).toBe('0.12');
      expect(formatDecimal(1.5678)).toBe('1.57');
      expect(formatDecimal(100.999)).toBe('101.00');
    });

    test('should handle custom decimal places', () => {
      expect(formatDecimal(0.1234, 0)).toBe('0');
      expect(formatDecimal(0.1234, 1)).toBe('0.1');
      expect(formatDecimal(0.1234, 3)).toBe('0.123');
      expect(formatDecimal(0.1234, 4)).toBe('0.1234');
    });

    test('should round correctly', () => {
      expect(formatDecimal(0.125, 2)).toBe('0.13');  // Rounds up
      expect(formatDecimal(0.124, 2)).toBe('0.12');  // Rounds down
      expect(formatDecimal(0.126, 2)).toBe('0.13');  // Rounds up
    });

    test('should handle whole numbers', () => {
      expect(formatDecimal(1)).toBe('1.00');
      expect(formatDecimal(100)).toBe('100.00');
      expect(formatDecimal(0)).toBe('0.00');
    });

    test('should handle negative numbers', () => {
      expect(formatDecimal(-0.1234)).toBe('-0.12');
      expect(formatDecimal(-1.5678)).toBe('-1.57');
    });

    test('should handle very small numbers', () => {
      expect(formatDecimal(0.0001)).toBe('0.00');
      expect(formatDecimal(0.001)).toBe('0.00');
      expect(formatDecimal(0.009)).toBe('0.01');
    });

    test('should handle very large numbers', () => {
      expect(formatDecimal(999999.999)).toBe('1000000.00');
      expect(formatDecimal(123456.789)).toBe('123456.79');
    });

    test('should handle edge cases', () => {
      expect(formatDecimal(NaN)).toBe('NaN');
      expect(formatDecimal(Infinity)).toBe('Infinity');
      expect(formatDecimal(-Infinity)).toBe('-Infinity');
    });
  });

  describe('formatROIDemandPrice', () => {
    test('should format positive demand price correctly', () => {
      const result = formatROIDemandPrice(145.2);
      expect(result).toBe('+145.20');
    });

    test('should format negative demand price correctly', () => {
      const result = formatROIDemandPrice(-165.8);
      expect(result).toBe('-165.80');
    });

    test('should handle null demand price', () => {
      const result = formatROIDemandPrice(null);
      expect(result).toBe('N/A');
    });

    test('should handle zero demand price', () => {
      const result = formatROIDemandPrice(0);
      expect(result).toBe('+0.00');
    });

    test('should round decimal values', () => {
      expect(formatROIDemandPrice(150.4)).toBe('+150.40');
      expect(formatROIDemandPrice(150.6)).toBe('+150.60');
      expect(formatROIDemandPrice(-200.3)).toBe('-200.30');
      expect(formatROIDemandPrice(-200.7)).toBe('-200.70');
    });
  });

  describe('Percentage Formatting Pattern', () => {
    // Test the common pattern used across all table components
    test('should convert decimal to percentage string correctly', () => {
      // Common pattern: `${formatDecimal(100 * row.coverPercent)}%`
      const coverPercent = 0.6543;
      const result = `${formatDecimal(100 * coverPercent)}%`;
      expect(result).toBe('65.43%');
    });

    test('should handle various percentage ranges', () => {
      expect(`${formatDecimal(100 * 0.0000)}%`).toBe('0.00%');
      expect(`${formatDecimal(100 * 0.1234)}%`).toBe('12.34%');
      expect(`${formatDecimal(100 * 0.5000)}%`).toBe('50.00%');
      expect(`${formatDecimal(100 * 0.9999)}%`).toBe('99.99%');
      expect(`${formatDecimal(100 * 1.0000)}%`).toBe('100.00%');
    });

    test('should handle negative percentages (comparison tables)', () => {
      expect(`${formatDecimal(100 * -0.0234)}%`).toBe('-2.34%');
      expect(`${formatDecimal(100 * -0.1000)}%`).toBe('-10.00%');
    });
  });

  describe('American Odds Formatting Pattern', () => {
    // Test the common pattern used in tables: formatAmericanOdds(Number(formatDecimal(value)))
    test('should handle the compound formatting pattern', () => {
      const usaFair = 150.5234;
      const result = formatAmericanOdds(Number(formatDecimal(usaFair)));
      expect(result).toBe('+150.52');
    });

    test('should handle negative odds in compound pattern', () => {
      const usaFair = -200.7891;
      const result = formatAmericanOdds(Number(formatDecimal(usaFair)));
      expect(result).toBe('-200.79');
    });

    test('should handle edge cases in compound pattern', () => {
      expect(formatAmericanOdds(Number(formatDecimal(0)))).toBe('N/A');
      expect(formatAmericanOdds(Number(formatDecimal(-0.01)))).toBe('-0.01');
      expect(formatAmericanOdds(Number(formatDecimal(0.01)))).toBe('+0.01');
    });
  });
}); 