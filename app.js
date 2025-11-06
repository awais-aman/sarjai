import express from "express";
import helmet from "helmet";

import { createLookupCounter } from "./lib/lookup-counter.js";
import { loadTickerIndex } from "./lib/ticker-index.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { createTickerRouter } from "./routes/ticker.js";

const defaultTickers = loadTickerIndex();

export function createApp({
  tickers = defaultTickers,
  counter = createLookupCounter(),
} = {}) {
  const app = express();

  app.use(helmet());

  app.use("/ticker", createTickerRouter({ tickers, counter }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
