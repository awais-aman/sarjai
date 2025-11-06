import express from "express";

import { createLookupCounter } from "./lib/lookup-counter.js";
import { loadTickerIndex } from "./lib/ticker-index.js";
import { createTickerRouter } from "./routes/ticker.js";

const defaultTickers = loadTickerIndex();

export function createApp({
  tickers = defaultTickers,
  counter = createLookupCounter(),
} = {}) {
  const app = express();

  app.use(express.json());

  app.use("/ticker", createTickerRouter({ tickers, counter }));

  return app;
}
