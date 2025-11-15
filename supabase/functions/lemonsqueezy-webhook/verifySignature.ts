/**
 * Verifies LemonSqueezy webhook signature using HMAC-SHA256
 * @param body - The raw request body as string
 * @param signature - The X-Signature header value
 * @param secret - The webhook secret from LemonSqueezy
 * @returns Promise<boolean> - true if signature is valid
 */
export const verifyLemonSqueezySignature = async (
  body: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  try {
    // Check if signature has a prefix (like "sha256=")
    let cleanSignature = signature;
    if (signature.includes("=")) {
      const parts = signature.split("=");
      if (parts.length === 2) {
        cleanSignature = parts[1];
      }
    }

    // Create HMAC-SHA256 hash using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    );

    const hash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures
    const isValid = hash === cleanSignature;

    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};
