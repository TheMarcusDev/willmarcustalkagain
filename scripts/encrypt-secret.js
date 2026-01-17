import * as crypto from "crypto";

const text = process.argv.slice(2).join(" ");
if (!text) {
  console.error('Usage: node encrypt-secret.js "Some secret text"');
  process.exit(1);
}
const keyB64 = process.env.ENCRYPTION_KEY_BASE64;
if (!keyB64) {
  console.error("Set ENCRYPTION_KEY_BASE64 env var (base64 32 bytes)");
  process.exit(1);
}
const key = Buffer.from(keyB64, "base64");
const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const ct = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();
// concat ct + tag so browser can use WebCrypto decrypt directly
const ctCombined = Buffer.concat([ct, tag]);
console.log(
  JSON.stringify(
    {
      ct: ctCombined.toString("base64"),
      iv: iv.toString("base64"),
    },
    null,
    2
  )
);
