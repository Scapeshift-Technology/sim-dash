// ---------- Odds conversion functions ----------

/**
 * Converts a success proportion to breakeven American odds.
 * @param proportion - The proportion of successes.
 * @returns The breakeven American odds.
 */
function proportionToAmericanOdds(proportion: number): number {
  if (proportion >= 0.5) {
    return -100 * proportion / (1 - proportion)
  } else {
    return 100 * (1 - proportion) / proportion
  }
}

/**
 * Converts American odds to a probability.
 * @param americanOdds - The American odds.
 * @returns The probability.
 */
function americanOddsToProbability(americanOdds: number): number {
  if (americanOdds >= 0) {
    return 100 / (americanOdds + 100);
  } else {
    return americanOdds / (americanOdds - 100);
  }
}

/**
 * Converts a success proportion, failure proportion, and push proportion to breakeven American odds.
 * @param successProportion - The proportion of successes.
 * @param failureProportion - The proportion of failures.
 * @param pushProportion - The proportion of pushes.
 * @param pushesFail - Whether pushes fail.
 * @returns The breakeven American odds.
 */
function proportionsToAmericanOddsWithPush(successProportion: number, failureProportion: number, pushProportion: number = 0, pushesFail: boolean = false): number {
  let successNoPushProportion: number;
  if (pushesFail) {
    successNoPushProportion = successProportion / (successProportion + failureProportion);
  } else {
    successNoPushProportion = successProportion / (successProportion + failureProportion + pushProportion);
  }

  const americanOdds = proportionToAmericanOdds(successNoPushProportion);

  return americanOdds;
}

/**
 * Converts a success count, failure count, and push count to breakeven American odds.
 * @param successCounts - The number of successes.
 * @param failureCounts - The number of failures.
 * @param pushCounts - The number of pushes.
 * @param pushesFail - Whether pushes fail.
 * @returns The breakeven American odds.
 */
function countsToAmericanOdds(successCounts: number, failureCounts: number, pushCounts: number = 0, pushesFail: boolean = false): number {
  const successProportion = countsToProbability(successCounts, failureCounts, pushCounts, pushesFail);

  return proportionToAmericanOdds(successProportion);
}

/**
 * Devigs two probabilities.
 * @param probability1 - The first probability.
 * @param probability2 - The second probability.
 * @returns The devigated probability.
 */
function devigProbabilities(probability1: number, probability2: number): number {
  return probability1 / (probability1 + probability2);
}

/**
 * Devigs two American odds.
 * @param odds1 - The first American odds.
 * @param odds2 - The second American odds.
 * @returns The devigated American odds.
 */
function devigAmericanOdds(odds1: number, odds2: number): number {
  const probability1 = americanOddsToProbability(odds1);
  const probability2 = americanOddsToProbability(odds2);

  const deviggedProbability = devigProbabilities(probability1, probability2);

  return proportionToAmericanOdds(deviggedProbability);
}

/**
 * Converts success, failure, and push counts directly to probability.
 * @param successCounts - The number of successes.
 * @param failureCounts - The number of failures.
 * @param pushCounts - The number of pushes.
 * @param pushesFail - Whether pushes fail.
 * @returns The probability of success.
 */
function countsToProbability(successCounts: number, failureCounts: number, pushCounts: number = 0, pushesFail: boolean = false): number {
  if (pushesFail) {
    return successCounts / (successCounts + failureCounts + pushCounts);
  } else {
    return successCounts / (successCounts + failureCounts);
  }
}

function marginOfError(total: number, proportion: number): number {
  // Always assumes 95% confidence level
  const z = 1.96;
  const p = proportion;
  const n = total;

  return z * Math.sqrt((p * (1 - p)) / n);
}

export { 
  proportionToAmericanOdds, 
  proportionsToAmericanOddsWithPush, 
  countsToAmericanOdds, 
  devigAmericanOdds, 
  americanOddsToProbability, 
  countsToProbability,
  marginOfError
};

// ---------- Comparison functions ----------

function calculateUsaDiff(usa1: number, usa2: number): number {
  const isPositive1 = usa1 > 0;
  const isPositive2 = usa2 > 0;

  if (isPositive1 == isPositive2) {
    return usa2 - usa1;
  } else {
    if (isPositive1) {
      return (usa2 + 100) - (usa1 - 100);
    } else {
      return (usa2 - 100) - (usa1 + 100);
    }
  }
}

export {
  calculateUsaDiff
}
