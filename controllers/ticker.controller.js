import { loadTickerIndex } from "../lib/ticker-index.js";

const tickers = loadTickerIndex();
const companyMap = {};

export const getTickerById = (req, res) => {
  const { tickerId } = req.params;
  const company = tickers.findBySymbol(tickerId);

  if (!company) {
    return res.status(404).send("Ticker not found");
  }

  const { cik, name, ticker, exchange } = company;
  companyMap[tickerId] = (companyMap[tickerId] || 0) + 1;

  res.status(200).json({ cik, name, ticker, exchange });
};

export const getTickerActivity = (req, res) => {
  const sortedCompanyMap = Object.keys(companyMap).sort(
    (a, b) => companyMap[b] - companyMap[a]
  );

  res
    .status(200)
    .send(sortedCompanyMap.map((key) => ({ [key]: companyMap[key] })));
};
