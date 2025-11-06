import { readFileSync } from "node:fs";

const DATA_FILE = new URL("../data.json", import.meta.url);

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

  return {
    companies,
    findBySymbol: (symbol) => bySymbol.get(symbol.toUpperCase()),
  };
}
