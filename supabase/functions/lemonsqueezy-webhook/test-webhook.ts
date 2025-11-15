// Test script for LemonSqueezy webhook
// This can be used to test the webhook locally

const testEvent = {
  data: {
    id: "test-subscription-123",
    type: "subscriptions",
    attributes: {
      status: "active",
      renews_at: "2024-01-15T00:00:00.000Z",
      checkout_data: {
        custom: {
          user_id: "test-user-123",
        },
      },
    },
    relationships: {
      customer: {
        data: {
          id: "test-customer-123",
        },
      },
      variant: {
        data: {
          id: "test-variant-123",
        },
      },
    },
  },
  meta: {
    event_name: "subscription_created",
  },
};

// Test signature generation
async function testSignature() {
  const body = JSON.stringify(testEvent);
  const secret = "test-secret";

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  console.log("Test signature:", signatureHex);
  console.log("Test body:", body);
}

testSignature();
