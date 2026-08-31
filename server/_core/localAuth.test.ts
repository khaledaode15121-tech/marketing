import { describe, expect, it } from "vitest";
import { buildLocalAuthenticatedUser, resolveLocalLoginProfile } from "./localAuth";

describe("buildLocalAuthenticatedUser", () => {
  it("creates a usable authenticated user from a local session", () => {
    const user = buildLocalAuthenticatedUser("local:ahmed@example.com", "أحمد");

    expect(user.openId).toBe("local:ahmed@example.com");
    expect(user.email).toBe("ahmed@example.com");
    expect(user.name).toBe("أحمد");
    expect(user.loginMethod).toBe("email");
    expect(user.role).toBe("user");
  });
});

describe("resolveLocalLoginProfile", () => {
  it("marks existing users for openId update and new users for full profile requirements", () => {
    const existing = resolveLocalLoginProfile(
      { email: "ahmed@example.com", name: "أحمد" },
      true,
      { email: "ahmed@example.com", name: "أحمد" }
    );
    const fresh = resolveLocalLoginProfile(
      { email: "new@example.com", name: "سارة", phone: "0500000000", address: "الرياض" },
      false
    );

    expect(existing.requiresExtraInfo).toBe(false);
    expect(existing.openId).toBe("local:ahmed@example.com");
    expect(fresh.requiresExtraInfo).toBe(true);
  });

  it("rejects login when the existing user name, email, phone or address does not match the stored account", () => {
    expect(() =>
      resolveLocalLoginProfile(
        { email: "ahmed@example.com", name: "أحمد" },
        true,
        { email: "other@example.com", name: "أحمد" }
      )
    ).toThrow("البريد الإلكتروني غير مطابق للحساب المسجل");

    expect(() =>
      resolveLocalLoginProfile(
        { email: "ahmed@example.com", name: "سالم" },
        true,
        { email: "ahmed@example.com", name: "أحمد" }
      )
    ).toThrow("اسم المستخدم غير مطابق للحساب المسجل");

    expect(() =>
      resolveLocalLoginProfile(
        { email: "ahmed@example.com", name: "أحمد", phone: "0500000001" },
        true,
        { email: "ahmed@example.com", name: "أحمد", phone: "0500000000" }
      )
    ).toThrow("رقم الهاتف غير مطابق للحساب المسجل");

    expect(() =>
      resolveLocalLoginProfile(
        { email: "ahmed@example.com", name: "أحمد", address: "الرياض" },
        true,
        { email: "ahmed@example.com", name: "أحمد", address: "جدة" }
      )
    ).toThrow("العنوان غير مطابق للحساب المسجل");
  });
});
