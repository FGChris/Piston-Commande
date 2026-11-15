import { test } from "node:test";
import assert from "node:assert/strict";
import { seal, unseal } from "../lib/secrets";
import { randomBytes } from "node:crypto";
test("le coffre chiffre et authentifie la valeur et son garage/fournisseur", () => {
  const key = randomBytes(32);
  const value = "secret-de-test-uniquement";
  const encrypted = seal(value, "garage-a:dasir", key);
  assert.ok(!encrypted.includes(value));
  assert.equal(unseal(encrypted, "garage-a:dasir", key), value);
  assert.throws(() => unseal(encrypted, "garage-b:dasir", key));
  assert.throws(() => unseal(encrypted, "garage-a:pavi", key));
  assert.throws(() => unseal(encrypted, "garage-a:dasir", randomBytes(32)));
  const parts = encrypted.split(".");
  parts[2] = Buffer.alloc(16).toString("base64url");
  assert.throws(() => unseal(parts.join("."), "garage-a:dasir", key));
});
