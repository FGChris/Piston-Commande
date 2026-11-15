import { mkdir, writeFile, readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
const file =
  process.env.SUPPLIER_KEY_FILE || path.resolve(".local/keys/suppliers.key");
await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
try {
  await writeFile(file, randomBytes(32), { flag: "wx", mode: 0o600 });
  console.log(
    "Clé locale créée hors base et hors Git. Sauvegarde sécurisée à prévoir avant usage réel.",
  );
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  if ((await readFile(file)).length !== 32)
    throw new Error("Clé existante invalide ; aucune modification effectuée.");
  console.log("Clé existante conservée.");
}
