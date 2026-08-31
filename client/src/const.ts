export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (returnTo?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost";
  const redirectUri = `${origin}/api/oauth/callback`;

  // تضمين مسار العودة في الـ state إذا وجد
  const statePayload = returnTo
    ? JSON.stringify({ redirectUri, returnTo })
    : redirectUri;
  const state = btoa(statePayload);

  // إذا لم يتم تكوين OAuth، استخدم صفحة تسجيل الدخول المحلية.
  if (!oauthPortalUrl || !appId) {
    return "/login";
  }

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId || "");
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (e) {
    console.error("Failed to construct login URL:", e);
    return "/login";
  }
};