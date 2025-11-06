import express from "express";

import { createTickerController } from "../controllers/ticker.controller.js";

export function createTickerRouter(deps) {
  const { getTickerById, getTickerActivity, searchTickers } =
    createTickerController(deps);
  const router = express.Router();

  router.get("/search", searchTickers);
  router.get("/activity", getTickerActivity);
  router.get("/:tickerId", getTickerById);

  return router;
}
