import { afterEach, describe, expect, it, vi } from "vitest";
import { getLoginUrl } from "../client/src/const";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getLoginUrl", () => {
  it("falls back to the local login page when OAuth config is missing", () => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", "");
    vi.stubEnv("VITE_APP_ID", "");

    expect(getLoginUrl()).toBe("/login");
  });
});
