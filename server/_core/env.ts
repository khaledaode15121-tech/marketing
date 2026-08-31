const fallbackCookieSecret = "development-cookie-secret";

import "dotenv/config";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET?.trim() || process.env.COOKIE_SECRET?.trim() || fallbackCookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "mysql://root:@localhost:3306/abu_ali_telecom",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioWhatsAppFrom: process.env.TWILIO_WHATSAPP_FROM ?? "",
  twilioWhatsAppContentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID ?? "",
};
