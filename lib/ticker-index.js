import { readFileSync } from "node:fs";

const DATA_FILE = new URL("../data.json", import.meta.url);

// Lower rank = better match. Within a rank, results keep the dataset's
// order, which the SEC publishes roughly by company size.
const RANK_EXACT_TICKER = 0;
const RANK_TICKER_PREFIX = 1;
const RANK_NAME_PREFIX = 2;
const RANK_TICKER_CONTAINS = 3;
const RANK_NAME_CONTAINS = 4;

function matchRank(entry, needle) {
  if (entry.symbol === needle) return RANK_EXACT_TICKER;
  if (entry.symbol.startsWith(needle)) return RANK_TICKER_PREFIX;
  if (entry.upperName.startsWith(needle)) return RANK_NAME_PREFIX;
  if (entry.symbol.includes(needle)) return RANK_TICKER_CONTAINS;
  if (entry.upperName.includes(needle)) return RANK_NAME_CONTAINS;
  return -1;
}

// data.json uses the SEC's compact layout: a `fields` header plus one
// array per company. Expand it once at startup instead of per request.
export function loadTickerIndex(file = DATA_FILE) {
  const { fields, data } = JSON.parse(readFileSync(file, "utf8"));
  const companies = data.map((row) =>
    Object.fromEntries(fields.map((field, i) => [field, row[i]]))
  );
  const bySymbol = new Map(
    companies.map((company) => [company.ticker.toUpperCase(), company])
  );
  const searchable = companies.map((company) => ({
    company,
    symbol: company.ticker.toUpperCase(),
    upperName: company.name.toUpperCase(),
  }));

  return {
    companies,
    findBySymbol: (symbol) => bySymbol.get(symbol.toUpperCase()),
    search(query) {
      const needle = query.toUpperCase();
      const buckets = [[], [], [], [], []];
      for (const entry of searchable) {
        const rank = matchRank(entry, needle);
        if (rank !== -1) buckets[rank].push(entry.company);
      }
      return buckets.flat();
    },
  };
}
