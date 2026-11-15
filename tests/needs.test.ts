import { test } from "node:test";
import assert from "node:assert/strict";
import { needSchema, needsClarification, positionLabel } from "../lib/needs";
const valid = {
  family: "braking",
  label: "Plaquettes à remplacer",
  quantity: "2",
  axle: "front",
  side: "both",
  notes: "",
};
test("un besoin exige une famille, un libellé propre, une quantité entière et une position explicite", () => {
  assert.equal(needSchema.parse(valid).quantity, 2);
  for (const change of [
    { label: " " },
    { family: "inventee" },
    { quantity: "" },
    { quantity: "1.5" },
    { quantity: "0" },
    { quantity: "-1" },
    { axle: "" },
    { side: "" },
  ])
    assert.equal(needSchema.safeParse({ ...valid, ...change }).success, false);
});
test("un doute de position reste visible sans être résolu automatiquement", () => {
  assert.equal(needsClarification({ ...valid, axle: "unknown" }), true);
  assert.equal(needsClarification(valid), false);
  assert.equal(positionLabel("front", "both"), "Avant · Gauche et droite");
  assert.equal(
    positionLabel("not_applicable", "not_applicable"),
    "Sans essieu · Sans côté",
  );
});
