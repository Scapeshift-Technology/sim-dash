import { displayAmericanOdds, formatDecimal } from '../../src/renderer/apps/simDash/utils/display';
import { formatROIDemandPrice } from '../../src/renderer/apps/simDash/utils/roiCalculations';

describe('Data Formatting Functions', () => {
  describe('displayAmericanOdds', () => {
    test('should format positive odds with + sign', () => {
      expect(displayAmericanOdds(150)).toBe('+150');
      expect(displayAmericanOdds(100)).toBe('+100');
      expect(displayAmericanOdds(999)).toBe('+999');
    });

    test('should format negative odds without changing sign', () => {
      expect(displayAmericanOdds(-150)).toBe('-150');
      expect(displayAmericanOdds(-100)).toBe('-100');
      expect(displayAmericanOdds(-999)).toBe('-999');
    });

    test('should handle zero odds', () => {
      expect(displayAmericanOdds(0)).toBe('0');
    });

    test('should handle decimal odds by converting to string', () => {
      expect(displayAmericanOdds(150.5)).toBe('+150.5');
      expect(displayAmericanOdds(-200.3)).toBe('-200.3');
    });

    test('should handle very large numbers', () => {
      expect(displayAmericanOdds(999999)).toBe('+999999');
      expect(displayAmericanOdds(-999999)).toBe('-999999');
    });

    test('should handle edge cases', () => {
      expect(displayAmericanOdds(0.1)).toBe('+0.1');
      expect(displayAmericanOdds(-0.1)).toBe('-0.1');
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
    // Test the common pattern used in tables: displayAmericanOdds(Number(formatDecimal(value)))
    test('should handle the compound formatting pattern', () => {
      const usaFair = 150.5234;
      const result = displayAmericanOdds(Number(formatDecimal(usaFair)));
      expect(result).toBe('+150.52');
    });

    test('should handle negative odds in compound pattern', () => {
      const usaFair = -200.7891;
      const result = displayAmericanOdds(Number(formatDecimal(usaFair)));
      expect(result).toBe('-200.79');
    });

    test('should handle edge cases in compound pattern', () => {
      expect(displayAmericanOdds(Number(formatDecimal(0)))).toBe('0');
      expect(displayAmericanOdds(Number(formatDecimal(-0.01)))).toBe('-0.01');
      expect(displayAmericanOdds(Number(formatDecimal(0.01)))).toBe('+0.01');
    });
  });
}); 