import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePlate,
  normalizeEngineCode,
  identityGaps,
  simulatedProvider,
} from "../lib/vehicle";

test("normalise une plaque et rejette les formats non pris en charge", () => {
  assert.equal(normalizePlate(" ab 123 cd "), "AB-123-CD");
  assert.equal(normalizePlate("demo-001"), "DEMO-001");
  assert.throws(() => normalizePlate("n’importe quoi"));
});
test("compare les segments moteur strictement sans rapprochement partiel", () => {
  assert.equal(
    normalizeEngineCode("DV6TED4_9HZ"),
    normalizeEngineCode("9HZ_DV6TED4"),
  );
  assert.notEqual(
    normalizeEngineCode("9HZ"),
    normalizeEngineCode("DV6TED4_9HZ"),
  );
});
test("la source simulée distingue identité complète, incomplète, doute, panne et absence", async () => {
  const complete = await simulatedProvider.identify("DEMO-001");
  assert.equal(complete.status, "identified");
  assert.deepEqual(identityGaps(complete.identity), []);
  const incomplete = await simulatedProvider.identify("DEMO-002");
  assert.ok(identityGaps(incomplete.identity).includes("Code moteur"));
  assert.equal(incomplete.status, "incomplete");
  assert.equal(
    (await simulatedProvider.identify("DEMO-003")).status,
    "ambiguous",
  );
  assert.equal(
    (await simulatedProvider.identify("DEMO-404")).status,
    "not_found",
  );
  assert.equal(
    (await simulatedProvider.identify("DEMO-503")).status,
    "unavailable",
  );
});
test("une plaque réelle ne reçoit jamais de véhicule inventé", async () => {
  const result = await simulatedProvider.identify("AB-123-CD");
  assert.equal(result.status, "unavailable");
  assert.equal(result.identity, null);
});
