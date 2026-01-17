export const b64ToBytes = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export const bytesToUtf8 = (arr) => new TextDecoder().decode(arr);

export async function importAesKeyRaw(base64Key) {
  const raw = b64ToBytes(base64Key);
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
}

// decrypt ciphertext (base64) which must be ct||tag combined (as produced by encrypt-secret.js)
export async function decryptAesGcm(base64CtWithTag, base64Iv, base64Key) {
  const key = await importAesKeyRaw(base64Key);
  const ct = b64ToBytes(base64CtWithTag);
  const iv = b64ToBytes(base64Iv);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return bytesToUtf8(new Uint8Array(plain));
}

// HMAC SHA-256 producing base64
export async function importHmacKeyRaw(base64Key) {
  const raw = b64ToBytes(base64Key);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function hmacBase64ForString(str, base64Key) {
  const key = await importHmacKeyRaw(base64Key);
  const data = new TextEncoder().encode(str);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
