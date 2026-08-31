import { describe, expect, it } from "vitest";
import { validateLocalAuthProfile } from "./_core/localAuth";

describe("validateLocalAuthProfile", () => {
  it("accepts existing users with only name and email", () => {
    const result = validateLocalAuthProfile(
      { email: "user@example.com", name: "Ahmed" },
      true
    );

    expect(result.requiresExtraInfo).toBe(false);
    expect(result.email).toBe("user@example.com");
    expect(result.name).toBe("Ahmed");
  });

  it("requires phone and address for new users", () => {
    expect(() =>
      validateLocalAuthProfile(
        { email: "new@example.com", name: "Nora" },
        false
      )
    ).toThrow("رقم الهاتف مطلوب للحساب الجديد");
  });
});
