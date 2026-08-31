import type { User } from "../../drizzle/schema";

export type LocalAuthInput = {
  email: string;
  name?: string;
  phone?: string;
  address?: string;
};

export function normalizeLocalAuthInput(input: LocalAuthInput) {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  const address = input.address?.trim();

  if (!email) {
    throw new Error("البريد الإلكتروني مطلوب");
  }

  return {
    email,
    name: name || email.split("@")[0] || "مستخدم",
    phone,
    address,
  };
}

export function resolveLocalLoginProfile(
  input: LocalAuthInput,
  existingUser: boolean,
  storedUser?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null
) {
  const normalized = normalizeLocalAuthInput(input);
  const openId = `local:${normalized.email}`;

  if (existingUser) {
    const storedName = storedUser?.name?.trim();
    const storedEmail = storedUser?.email?.trim().toLowerCase();
    const storedPhone = storedUser?.phone?.trim();
    const storedAddress = storedUser?.address?.trim();

    if (storedEmail && storedEmail !== normalized.email) {
      throw new Error("البريد الإلكتروني غير مطابق للحساب المسجل");
    }

    if (input.name?.trim() && storedName && storedName.toLowerCase() !== normalized.name.toLowerCase()) {
      throw new Error("اسم المستخدم غير مطابق للحساب المسجل");
    }

    const resolvedName = storedName || normalized.name;

    if (input.phone?.trim() && storedPhone && input.phone.trim() !== storedPhone) {
      throw new Error("رقم الهاتف غير مطابق للحساب المسجل");
    }

    if (input.address?.trim() && storedAddress && input.address.trim() !== storedAddress) {
      throw new Error("العنوان غير مطابق للحساب المسجل");
    }

    return {
      ...normalized,
      name: resolvedName,
      openId,
      requiresExtraInfo: false,
      shouldUpdateOpenId: true,
      isExistingUser: true,
    };
  }

  if (!normalized.name) {
    throw new Error("الاسم مطلوب للحساب الجديد");
  }

  if (!normalized.phone) {
    throw new Error("رقم الهاتف مطلوب للحساب الجديد");
  }

  if (!normalized.address) {
    throw new Error("السكن مطلوب للحساب الجديد");
  }

  return {
    ...normalized,
    openId,
    requiresExtraInfo: true,
    shouldUpdateOpenId: false,
    isExistingUser: false,
  };
}

export function validateLocalAuthProfile(
  input: LocalAuthInput,
  existingUser: boolean
) {
  return resolveLocalLoginProfile(input, existingUser);
}

export function buildLocalAuthenticatedUser(openId: string, name?: string): User {
  const email = openId.startsWith("local:") ? openId.slice("local:".length) : openId;
  const displayName = name?.trim() || email.split("@")[0] || "مستخدم";
  const now = new Date();

  return {
    id: -1,
    openId,
    name: displayName,
    email,
    phone: null,
    address: null,
    loginMethod: "email",
    token: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  } as User;
}
