import express from "express";

import { tickerRouter } from "./routes/ticker.js";

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.use("/ticker", tickerRouter);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
