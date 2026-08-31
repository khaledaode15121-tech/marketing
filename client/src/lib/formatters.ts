export const SITE_CURRENCY = "ل.س";
export const SITE_CURRENCY_NAME = "الليرة السورية";

/** Format all monetary values as whole Syrian-lira amounts without grouping separators. */
export function formatSyp(value: unknown): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0";
  return Math.round(amount).toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 0,
  });
}

export function formatSypWithCurrency(value: unknown): string {
  return `${formatSyp(value)} ${SITE_CURRENCY}`;
}

export function getProductImages(product: {
  image?: string | null;
  images?: string[] | string | null;
}): string[] {
  let images: unknown = product.images;
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = (product.images as string)
        .split(",")
        .map((image: string) => image.trim());
    }
  }
  if (Array.isArray(images)) {
    const validImages = images.filter(
      (image): image is string => typeof image === "string" && image.length > 0
    );
    if (validImages.length > 0) return validImages;
  }
  return product.image ? [product.image] : [];
}
