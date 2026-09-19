import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatLiveStamp, lastSuccessfulFetch, markLiveFetch, readLiveStamp } from "./live-stamp.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe("live fetch stamps", () => {
  it("keeps the latest successful weather or prayer timestamp", () => {
    const storage = memoryStorage();
    markLiveFetch("prayer", 1000, storage);
    markLiveFetch("weather", 4000, storage);
    const stamp = readLiveStamp(storage);
    assert.equal(stamp.prayer, 1000);
    assert.equal(stamp.weather, 4000);
    assert.equal(lastSuccessfulFetch(stamp), 4000);
    assert.equal(formatLiveStamp(4000, "ar", 4000 + 3 * 60000), "قبل 3 د");
    assert.equal(formatLiveStamp(4000, "en", 4000 + 2 * 3600000), "2h ago");
  });
});
