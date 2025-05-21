function displayAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString();
}

function formatDecimal(value: number, places: number = 2): string {
  const factor = Math.pow(10, places);
  return (Math.round(value * factor) / factor).toFixed(places);
}

export { displayAmericanOdds, formatDecimal };

