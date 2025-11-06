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

  const getTickerActivity = (req, res) => {
    res
      .status(200)
      .json(counter.ranked().map(([ticker, count]) => ({ [ticker]: count })));
  };

  return { getTickerById, getTickerActivity };
}
