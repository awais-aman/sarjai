import express from "express";

import { createTickerController } from "../controllers/ticker.controller.js";

export function createTickerRouter(deps) {
  const { getTickerById, getTickerActivity } = createTickerController(deps);
  const router = express.Router();

  router.get("/activity", getTickerActivity);
  router.get("/:tickerId", getTickerById);

  return router;
}
