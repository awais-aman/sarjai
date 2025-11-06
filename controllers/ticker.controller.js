import { readIntParam } from "../lib/query-params.js";

const MAX_QUERY_LENGTH = 50;
const MAX_PAGE_SIZE = 50;
const MAX_OFFSET = 10_000;
const MAX_ACTIVITY_SIZE = 100;

// Listed symbols are short; class shares use '-' in the SEC data
// (BRK-B), while many clients write them with '.' (BRK.B).
const SYMBOL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]{0,9}$/;

export function createTickerController({ tickers, counter }) {
  const getTickerById = (req, res) => {
    const { tickerId } = req.params;

    if (!SYMBOL_PATTERN.test(tickerId)) {
      return res.status(400).json({
        error: "Ticker must be 1-10 letters or digits, optionally with '.' or '-'",
      });
    }

    const company = tickers.findBySymbol(tickerId.replaceAll(".", "-"));

    if (!company) {
      return res
        .status(404)
        .json({ error: "Ticker not found", ticker: tickerId.toUpperCase() });
    }

    const { cik, name, ticker, exchange } = company;
    counter.record(ticker);

    res.status(200).json({ cik, name, ticker, exchange });
  };

  const searchTickers = (req, res) => {
    const { q } = req.query;
    const query = typeof q === "string" ? q.trim() : "";

    if (!query || query.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        error: `q is required and must be 1-${MAX_QUERY_LENGTH} characters`,
      });
    }

    const limit = readIntParam(req.query.limit, {
      name: "limit",
      min: 1,
      max: MAX_PAGE_SIZE,
      fallback: 10,
    });
    const offset = readIntParam(req.query.offset, {
      name: "offset",
      min: 0,
      max: MAX_OFFSET,
      fallback: 0,
    });
    const invalid = limit.error ?? offset.error;
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const matches = tickers.search(query);
    res.status(200).json({
      query,
      total: matches.length,
      limit: limit.value,
      offset: offset.value,
      results: matches.slice(offset.value, offset.value + limit.value),
    });
  };

  const getTickerActivity = (req, res) => {
    const limit = readIntParam(req.query.limit, {
      name: "limit",
      min: 1,
      max: MAX_ACTIVITY_SIZE,
      fallback: 10,
    });
    if (limit.error) {
      return res.status(400).json({ error: limit.error });
    }

    res.status(200).json(
      counter
        .ranked()
        .slice(0, limit.value)
        .map(([ticker, count]) => ({ [ticker]: count }))
    );
  };

  return { getTickerById, getTickerActivity, searchTickers };
}
