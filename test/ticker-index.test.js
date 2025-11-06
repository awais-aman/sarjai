import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";

import { loadTickerIndex } from "../lib/ticker-index.js";

describe("loadTickerIndex", () => {
  const tickers = loadTickerIndex();

  it("expands every SEC row into a named record", () => {
    assert.ok(tickers.companies.length > 10_000);
    assert.deepEqual(tickers.findBySymbol("BRK-B"), {
      cik: 1067983,
      name: "BERKSHIRE HATHAWAY INC",
      ticker: "BRK-B",
      exchange: "NYSE",
    });
  });

  it("looks symbols up case-insensitively", () => {
    assert.equal(tickers.findBySymbol("nvda").ticker, "NVDA");
    assert.equal(tickers.findBySymbol("NOPE-X"), undefined);
  });

  it("finds data.json without depending on the working directory", () => {
    const original = process.cwd();
    process.chdir(tmpdir());
    try {
      assert.equal(loadTickerIndex().findBySymbol("MSFT").cik, 789019);
    } finally {
      process.chdir(original);
    }
  });

  describe("search", () => {
    it("ranks an exact ticker, then ticker prefixes, then name prefixes", () => {
      const results = tickers.search("meta");
      assert.equal(results[0].ticker, "META");
      const firstNamePrefix = results.findIndex(
        (c) => !c.ticker.startsWith("META")
      );
      assert.ok(firstNamePrefix > 0);
      assert.ok(results[firstNamePrefix].name.toUpperCase().startsWith("META"));
    });

    it("finds companies by part of their name", () => {
      const tickersFound = tickers.search("hathaway").map((c) => c.ticker);
      assert.ok(tickersFound.includes("BRK-A"));
      assert.ok(tickersFound.includes("BRK-B"));
    });

    it("returns nothing when no ticker or name matches", () => {
      assert.deepEqual(tickers.search("QQQQQQQQ"), []);
    });
  });
});
