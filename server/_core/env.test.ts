import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ENV cookie secret fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.JWT_SECRET;
  });

  it("uses a local fallback secret when JWT_SECRET is missing", async () => {
    const { ENV } = await import("./env");

    expect(ENV.cookieSecret).toBe("development-cookie-secret");
  });
});
