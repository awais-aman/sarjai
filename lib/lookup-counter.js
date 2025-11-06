export function createLookupCounter() {
  const counts = new Map();

  return {
    record(ticker) {
      counts.set(ticker, (counts.get(ticker) ?? 0) + 1);
    },
    // Most-looked-up first; ties fall back to alphabetical order so the
    // response is stable between calls.
    ranked() {
      return [...counts.entries()].sort(
        ([tickerA, countA], [tickerB, countB]) =>
          countB - countA || tickerA.localeCompare(tickerB)
      );
    },
  };
}
