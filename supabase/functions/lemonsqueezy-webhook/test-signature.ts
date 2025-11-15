/**
 * Test script to verify LemonSqueezy signature validation
 * Run with: deno run --allow-net test-signature.ts
 */

import { verifyLemonSqueezySignature } from "./verifySignature.ts";

async function testSignatureValidation() {
  const testBody = '{"test": "data"}';
  const testSecret = "test-secret-key";

  // Test with valid signature
  console.log("Testing signature validation...");

  // Create a test signature (this would normally come from LemonSqueezy)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(testSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(testBody)
  );
  const validSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  console.log("Test body:", testBody);
  console.log("Test secret:", testSecret);
  console.log("Generated signature:", validSignature);

  // Test valid signature
  const isValid = await verifyLemonSqueezySignature(
    testBody,
    validSignature,
    testSecret
  );
  console.log("Valid signature test:", isValid ? "✅ PASS" : "❌ FAIL");

  // Test invalid signature
  const isInvalid = await verifyLemonSqueezySignature(
    testBody,
    "invalid-signature",
    testSecret
  );
  console.log("Invalid signature test:", !isInvalid ? "✅ PASS" : "❌ FAIL");

  // Test with wrong secret
  const isWrongSecret = await verifyLemonSqueezySignature(
    testBody,
    validSignature,
    "wrong-secret"
  );
  console.log("Wrong secret test:", !isWrongSecret ? "✅ PASS" : "❌ FAIL");
}

testSignatureValidation().catch(console.error);
