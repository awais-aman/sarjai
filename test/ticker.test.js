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

  it("accepts '.' as the share-class separator", async () => {
    const res = await request(createApp()).get("/ticker/brk.b").expect(200);
    assert.equal(res.body.ticker, "BRK-B");
  });

  it("responds 404 with a JSON body for an unknown ticker", async () => {
    const res = await request(createApp())
      .get("/ticker/zzzzzz")
      .expect("Content-Type", /json/)
      .expect(404);
    assert.deepEqual(res.body, { error: "Ticker not found", ticker: "ZZZZZZ" });
  });

  for (const bad of ["ABCDEFGHIJK", "MS$FT", "-MSFT", "%20MSFT"]) {
    it(`responds 400 for the malformed symbol ${JSON.stringify(bad)}`, async () => {
      const res = await request(createApp())
        .get(`/ticker/${bad}`)
        .expect("Content-Type", /json/)
        .expect(400);
      assert.match(res.body.error, /Ticker must be/);
    });
  }
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

describe("error responses", () => {
  it("answers unknown routes with JSON instead of an HTML page", async () => {
    const res = await request(createApp())
      .get("/tickers/MSFT")
      .expect("Content-Type", /json/)
      .expect(404);
    assert.deepEqual(res.body, { error: "No route for GET /tickers/MSFT" });
  });

  it("turns a malformed percent-escape into a 400 without a stack trace", async () => {
    const res = await request(createApp())
      .get("/ticker/%E0%A4%A")
      .expect("Content-Type", /json/)
      .expect(400);
    assert.deepEqual(res.body, { error: "Bad request" });
  });

  it("hides internal failures behind a generic 500", async (t) => {
    t.mock.method(console, "error", () => {});
    const tickers = {
      findBySymbol() {
        throw new Error("index exploded");
      },
    };
    const res = await request(createApp({ tickers }))
      .get("/ticker/MSFT")
      .expect(500);
    assert.deepEqual(res.body, { error: "Internal server error" });
  });
});
