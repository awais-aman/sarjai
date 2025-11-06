import express from "express";

import { tickerRouter } from "./routes/ticker.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/ticker", tickerRouter);

  return app;
}
