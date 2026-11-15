import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
export function seal(value: string, context: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context));
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    body.toString("base64url"),
  ].join(".");
}
export function unseal(value: string, context: string, key: Buffer) {
  const [version, iv, tag, body, ...extra] = value.split(".");
  if (version !== "v1" || extra.length || !iv || !tag || !body)
    throw new Error("Format du coffre invalide");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64url"),
  );
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(body, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
export async function encryptionKey() {
  const file =
    process.env.SUPPLIER_KEY_FILE || path.resolve(".local/keys/suppliers.key");
  const key = await readFile(/* turbopackIgnore: true */ file);
  if (key.length !== 32) throw new Error("Clé du coffre invalide");
  return key;
}
