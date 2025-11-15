/**
 * Maps LemonSqueezy variant IDs to their display names
 * Uses environment variables to map variant IDs to tier names
 */
export const VARIANT_MAP: { [key: string]: string } = {
  // Creator Lite tier variant (maps to LITE subscription tier)
  ...(process.env.LEMONSQUEEZY_VARIANT_ID_LITE
    ? { [process.env.LEMONSQUEEZY_VARIANT_ID_LITE]: "Linkedbud Creator Lite" }
    : {}),
  // Creator Pro tier variant (maps to STARTER subscription tier)
  ...(process.env.LEMONSQUEEZY_VARIANT_ID_PRO
    ? { [process.env.LEMONSQUEEZY_VARIANT_ID_PRO]: "Linkedbud Creator Pro" }
    : {}),
  // Growth tier variant (maps to GROWTH subscription tier)
  ...(process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH
    ? { [process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH]: "Linkedbud Growth" }
    : {}),
  // Enterprise tier variant (maps to ENTERPRISE subscription tier)
  ...(process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE
    ? { [process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE]: "Linkedbud Enterprise" }
    : {}),
};

/**
 * Get the display name for a LemonSqueezy variant ID
 * @param variantId - The LemonSqueezy variant ID
 * @returns The display name or "Unknown" if not found
 */
export function getVariantName(variantId: string | null): string {
  if (!variantId) return "Unknown";
  return VARIANT_MAP[variantId] || "Unknown";
}
