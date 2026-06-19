// src/utils/encryption.util.ts
import crypto from "crypto";

// Algorithme sécurisé : AES-256 en mode GCM
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.warn("SECURITY: ENCRYPTION_KEY manquante ou trop courte. Le chiffrement sera désactivé.");
}

const keyObject = ENCRYPTION_KEY
  ? crypto.createSecretKey(Buffer.from(ENCRYPTION_KEY))
  : null;

export const encrypt = (text: string): string => {
  if (!keyObject) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyObject, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (hash: string): string => {
  if (!keyObject) return hash;
  const [ivHex, authTagHex, encryptedText] = hash.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, keyObject, iv);

  // ✅ Cast simple pour authTag
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
