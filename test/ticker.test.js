import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createApp } from "../app.js";

describe("GET /ticker/:tickerId", () => {
  it("returns the company for a known ticker", async () => {
    const res = await request(createApp()).get("/ticker/MSFT").expect(200);
    assert.deepEqual(res.body, {
      cik: 789019,
      name: "MICROSOFT CORP",
      ticker: "MSFT",
      exchange: "Nasdaq",
    });
  });

  it("matches tickers regardless of case", async () => {
    const res = await request(createApp()).get("/ticker/aapl").expect(200);
    assert.equal(res.body.ticker, "AAPL");
  });

  it("responds 404 for an unknown ticker", async () => {
    await request(createApp()).get("/ticker/ZZZZZZ").expect(404);
  });
});

describe("GET /ticker/activity", () => {
  it("starts empty", async () => {
    const res = await request(createApp()).get("/ticker/activity").expect(200);
    assert.deepEqual(res.body, []);
  });

  it("counts different spellings of a ticker as one symbol", async () => {
    const app = createApp();
    await request(app).get("/ticker/MSFT").expect(200);
    await request(app).get("/ticker/msft").expect(200);
    await request(app).get("/ticker/Msft").expect(200);
    await request(app).get("/ticker/AAPL").expect(200);

    const res = await request(app).get("/ticker/activity").expect(200);
    assert.deepEqual(res.body, [{ MSFT: 3 }, { AAPL: 1 }]);
  });

  it("does not count failed lookups", async () => {
    const app = createApp();
    await request(app).get("/ticker/ZZZZZZ").expect(404);
    const res = await request(app).get("/ticker/activity").expect(200);
    assert.deepEqual(res.body, []);
  });
});
