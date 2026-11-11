import { describe, it, expect } from "vitest";

describe("System Configuration & Health", () => {
  it("should have correct default constants", async () => {
    const { CELEBRITY_FOLLOWER_THRESHOLD } = await import("../src/config/constants.js");
    expect(CELEBRITY_FOLLOWER_THRESHOLD).toBeDefined();
    expect(typeof CELEBRITY_FOLLOWER_THRESHOLD).toBe("number");
    expect(CELEBRITY_FOLLOWER_THRESHOLD).toBeGreaterThan(0);
  });

  it("should register prometheus metrics correctly", async () => {
    const { metricsRegistry, httpRequestCounter, httpRequestDuration } = await import(
      "../src/config/metrics.js"
    );
    expect(metricsRegistry).toBeDefined();
    expect(httpRequestCounter).toBeDefined();
    expect(httpRequestDuration).toBeDefined();

    const metricsStr = await metricsRegistry.metrics();
    expect(metricsStr).toContain("twitter_");
  });
});
