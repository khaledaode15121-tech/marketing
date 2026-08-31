import { ENV } from "./_core/env";

type RentalNotificationEvent =
  "requested" | "approved" | "unavailable" | "returned";

type RentalNotificationInput = {
  phone?: string | null;
  event: RentalNotificationEvent;
  productName?: string | null;
  productImage?: string | null;
  rentalDate: string;
  rentalPrice?: string | number | null;
  payments?: string | number | null;
  remaining?: string | number | null;
};

const eventLabels: Record<RentalNotificationEvent, string> = {
  requested: "قيد المعالجة",
  approved: "تم الحجز",
  unavailable: "غير ممكن للإيجار",
  returned: "تم إرجاع المنتج",
};

function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/[^0-9+]/g, "");
  const normalized = digits.startsWith("+") ? digits : `+${digits}`;
  return `whatsapp:${normalized}`;
}

function formatSyp(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? Math.round(amount).toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 0,
      })
    : "0";
}

function buildBody(input: RentalNotificationInput) {
  const product = input.productName || "المنتج";
  return [
    "متجر أبو علي للاتصالات",
    `تحديث طلب الإيجار: ${eventLabels[input.event]}`,
    `المنتج: ${product}`,
    `تاريخ الإيجار: ${input.rentalDate}`,
    `قيمة الإيجار: ${formatSyp(input.rentalPrice)} ل.س`,
    `الدفعات: ${formatSyp(input.payments)} ل.س`,
    `الباقي: ${formatSyp(input.remaining)} ل.س`,
    "شكرًا لاختياركم متجر أبو علي للاتصالات.",
  ].join("\n");
}

export async function sendRentalWhatsAppNotification(
  input: RentalNotificationInput
) {
  const {
    twilioAccountSid,
    twilioAuthToken,
    twilioWhatsAppFrom,
    twilioWhatsAppContentSid,
  } = ENV;
  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppFrom) {
    console.warn("[Twilio] WhatsApp is not configured; notification skipped");
    return { skipped: true as const, reason: "missing_configuration" };
  }
  if (!input.phone) {
    console.warn("[Twilio] Customer has no phone number; notification skipped");
    return { skipped: true as const, reason: "missing_customer_phone" };
  }

  const body = new URLSearchParams();
  body.set(
    "From",
    twilioWhatsAppFrom.startsWith("whatsapp:")
      ? twilioWhatsAppFrom
      : `whatsapp:${twilioWhatsAppFrom}`
  );
  body.set("To", normalizeWhatsAppPhone(input.phone));
  if (twilioWhatsAppContentSid) {
    body.set("ContentSid", twilioWhatsAppContentSid);
    body.set(
      "ContentVariables",
      JSON.stringify({
        "1": eventLabels[input.event],
        "2": input.productName || "المنتج",
        "3": input.rentalDate,
        "4": String(input.rentalPrice || 0),
        "5": String(input.payments || 0),
        "6": String(input.remaining || 0),
        "7": input.productImage || "",
      })
    );
  } else {
    body.set("Body", buildBody(input));
    if (input.productImage) body.set("MediaUrl", input.productImage);
  }

  const credentials = Buffer.from(
    `${twilioAccountSid}:${twilioAuthToken}`
  ).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Twilio WhatsApp request failed (${response.status}): ${responseText.slice(0, 400)}`
    );
  }
  const result = JSON.parse(responseText) as { sid?: string; status?: string };
  return { skipped: false as const, sid: result.sid, status: result.status };
}
