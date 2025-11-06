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

  it("returns only the top entries up to limit", async () => {
    const app = createApp();
    for (const symbol of ["MSFT", "MSFT", "AAPL", "NVDA", "NVDA", "NVDA"]) {
      await request(app).get(`/ticker/${symbol}`).expect(200);
    }
    const res = await request(app)
      .get("/ticker/activity")
      .query({ limit: 2 })
      .expect(200);
    assert.deepEqual(res.body, [{ NVDA: 3 }, { MSFT: 2 }]);
  });

  it("rejects an out-of-range limit", async () => {
    const res = await request(createApp())
      .get("/ticker/activity")
      .query({ limit: 101 })
      .expect(400);
    assert.match(res.body.error, /limit must be between 1 and 100/);
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

describe("GET /ticker/search", () => {
  it("returns ranked matches with paging metadata", async () => {
    const res = await request(createApp())
      .get("/ticker/search")
      .query({ q: "nvda" })
      .expect(200);
    assert.equal(res.body.query, "nvda");
    assert.equal(res.body.limit, 10);
    assert.equal(res.body.offset, 0);
    assert.ok(res.body.total >= 1);
    assert.equal(res.body.results[0].ticker, "NVDA");
  });

  it("matches partial company names case-insensitively", async () => {
    const res = await request(createApp())
      .get("/ticker/search")
      .query({ q: "berkshire hath" })
      .expect(200);
    const found = res.body.results.map((c) => c.ticker);
    assert.ok(found.includes("BRK-B"));
  });

  it("pages through results with limit and offset", async () => {
    const app = createApp();
    const all = await request(app)
      .get("/ticker/search")
      .query({ q: "bank", limit: 50 })
      .expect(200);
    const page = await request(app)
      .get("/ticker/search")
      .query({ q: "bank", limit: 5, offset: 5 })
      .expect(200);
    assert.equal(page.body.total, all.body.total);
    assert.deepEqual(page.body.results, all.body.results.slice(5, 10));
  });

  it("returns an empty page past the end", async () => {
    const res = await request(createApp())
      .get("/ticker/search")
      .query({ q: "nvidia", offset: 500 })
      .expect(200);
    assert.deepEqual(res.body.results, []);
  });

  const badQueries = [
    [{}, /q is required/],
    [{ q: "   " }, /q is required/],
    [{ q: "x".repeat(51) }, /q is required/],
    [{ q: "a", limit: "0" }, /limit must be between 1 and 50/],
    [{ q: "a", limit: "51" }, /limit must be between 1 and 50/],
    [{ q: "a", limit: "ten" }, /limit must be a whole number/],
    [{ q: "a", offset: "-1" }, /offset must be a whole number/],
  ];
  for (const [query, message] of badQueries) {
    it(`rejects ${JSON.stringify(query)} with 400`, async () => {
      const res = await request(createApp())
        .get("/ticker/search")
        .query(query)
        .expect(400);
      assert.match(res.body.error, message);
    });
  }

  it("rejects a repeated q parameter", async () => {
    await request(createApp()).get("/ticker/search?q=a&q=b").expect(400);
  });
});
