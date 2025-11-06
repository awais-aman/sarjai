export function createTickerController({ tickers, counter }) {
  const getTickerById = (req, res) => {
    const company = tickers.findBySymbol(req.params.tickerId);

    if (!company) {
      return res.status(404).send("Ticker not found");
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
