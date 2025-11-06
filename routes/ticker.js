import express from "express";

import { getTickerById, getTickerActivity } from "../controllers/ticker.controller.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

router.get("/activity", getTickerActivity);
router.get("/:tickerId", getTickerById);

export { router as tickerRouter };
