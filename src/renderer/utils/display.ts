function displayAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString();
}

export { displayAmericanOdds };

