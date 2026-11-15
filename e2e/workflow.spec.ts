import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { createHash } from "node:crypto";
process.loadEnvFile(".env.local");
async function login(page: Page, index = 0) {
  const { accounts } = JSON.parse(
    await readFile(".local/accounts.json", "utf8"),
  );
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(accounts[index].email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(accounts[index].password);
  await page.getByRole("button", { name: "Ouvrir mon atelier" }).click();
  await expect(
    page.getByRole("heading", { name: /Prêt pour le prochain véhicule/ }),
  ).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test("connexion, identification et revérification sur ordinateur et mobile", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page).toHaveURL(/connexion/);
  await noOverflow(page);
  await page.screenshot({
    path: `test-results/connexion-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await login(page);
  await noOverflow(page);
  expect(
    (await page
      .getByLabel("Immatriculation ou identifiant de test")
      .boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  expect(
    (await page
      .getByRole("button", { name: "Identifier le véhicule" })
      .boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: `test-results/atelier-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "depanos_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page
    .getByLabel("Immatriculation ou identifiant de test")
    .fill("DEMO-001");
  await page.getByRole("button", { name: "Identifier le véhicule" }).click();
  await expect(
    page.getByRole("heading", { name: "Identité de test complète" }),
  ).toBeVisible();
  await expect(
    page.getByText("TEST0000000000001", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Décrire les besoins" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: `test-results/fiche-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const previous = await page
    .locator(".history time")
    .first()
    .getAttribute("datetime");
  await page.getByRole("link", { name: "Revérifier la fiche" }).click();
  await expect(page.locator(".history time").first()).not.toHaveAttribute(
    "datetime",
    previous!,
  );
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/connexion/);
  await page.goto("/");
  await expect(page).toHaveURL(/connexion/);
});
test("données manquantes, doute, panne, absence et plaque réelle restent distincts", async ({
  page,
}) => {
  await login(page);
  for (const [plate, message] of [
    ["DEMO-002", "Le code moteur manque. La sélection de pièces est bloquée."],
    [
      "DEMO-003",
      "Plusieurs variantes de test sont possibles. Une vérification humaine est nécessaire.",
    ],
    [
      "DEMO-503",
      "Panne simulée du portail. Réessayez pour contrôler cet état.",
    ],
    [
      "DEMO-404",
      "Aucune fiche dans ce jeu de test. Cela ne signifie pas que le véhicule réel est absent des catalogues.",
    ],
    [
      "AB-123-CD",
      "Aucun portail réel n’est connecté. Cette plaque ne peut pas être identifiée ici.",
    ],
  ]) {
    await page.goto("/");
    await page.getByLabel("Immatriculation ou identifiant de test").fill(plate);
    await page.getByRole("button", { name: "Identifier le véhicule" }).click();
    await expect(
      page.getByRole("status").getByText(message, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Besoins en pièces/ }),
    ).toBeDisabled();
    await noOverflow(page);
  }
  await page.goto("/");
  await page
    .getByLabel("Immatriculation ou identifiant de test")
    .fill("invalide");
  await page.getByRole("button", { name: "Identifier le véhicule" }).click();
  await expect(page.locator("#plate-error")).toContainText(
    "Saisissez une plaque",
  );
});
test("une URL de véhicule d’un autre garage ne révèle rien", async ({
  page,
  browser,
}) => {
  await login(page, 1);
  await page
    .getByLabel("Immatriculation ou identifiant de test")
    .fill("DEMO-001");
  await page.getByRole("button", { name: "Identifier le véhicule" }).click();
  await expect(
    page.getByRole("heading", { name: "DEMO-001", exact: true }),
  ).toBeVisible();
  const url = page.url();
  const other = await browser.newContext();
  const outsider = await other.newPage();
  await login(outsider, 0);
  await outsider.goto(url);
  await expect(
    outsider.getByRole("heading", { name: "Fiche inaccessible" }),
  ).toBeVisible();
  await expect(
    outsider.getByText("TEST0000000000001", { exact: true }),
  ).toHaveCount(0);
  await other.close();
});
test("cookie falsifié et session expirée sont refusés", async ({ page }) => {
  await page.context().addCookies([
    {
      name: "depanos_session",
      value: "a".repeat(64),
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto("/");
  await expect(page).toHaveURL(/connexion/);
  await login(page);
  const token = (await page.context().cookies()).find(
    (c) => c.name === "depanos_session",
  )!.value;
  const config = JSON.parse(await readFile(".local/postgres.json", "utf8"));
  const pool = new Pool({ ...config, host: "127.0.0.1", database: "depanos" });
  try {
    await pool.query(
      "UPDATE private.sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",
      [createHash("sha256").update(token).digest("hex")],
    );
  } finally {
    await pool.end();
  }
  await page.goto("/");
  await expect(page).toHaveURL(/connexion/);
});

test("tour du véhicule : ajout, position incertaine, modification, persistance et retrait", async ({
  page,
}, testInfo) => {
  await login(page);
  await page
    .getByLabel("Immatriculation ou identifiant de test")
    .fill("DEMO-001");
  await page.getByRole("button", { name: "Identifier le véhicule" }).click();
  await page.getByRole("link", { name: "Décrire les besoins" }).click();
  const form = page.getByRole("form", { name: "Ajouter un besoin" });
  const label = `Plaquettes test ${testInfo.project.name} ${Date.now()}`;
  await form.getByLabel("Famille de pièces").selectOption("braking");
  await form.getByLabel("Pièce ou besoin").fill(label);
  await form.getByLabel("Quantité", { exact: true }).fill("2");
  await form.getByLabel("Essieu", { exact: true }).selectOption("front");
  await form.getByLabel("Côté", { exact: true }).selectOption("unknown");
  await form
    .getByLabel("Observations")
    .fill("Observation synthétique de contrôle.");
  expect(
    (await form.getByLabel("Pièce ou besoin").boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  expect(
    (await form
      .getByRole("button", { name: "Ajouter ce besoin" })
      .boundingBox())!.height,
  ).toBeGreaterThanOrEqual(44);
  await form.getByRole("button", { name: "Ajouter ce besoin" }).click();
  const row = page.getByRole("article", { name: label, exact: true });
  await expect(
    row.getByText("Position à préciser avant toute sélection"),
  ).toBeVisible();
  await expect(row.getByText("Qté 2", { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.reload();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Modifier", exact: true }).click();
  const edit = row.getByRole("form", { name: "Modifier le besoin" });
  await edit.getByLabel("Côté", { exact: true }).selectOption("left");
  await edit.getByLabel("Quantité", { exact: true }).fill("4");
  await edit
    .getByRole("button", { name: "Enregistrer les modifications" })
    .click();
  await expect(row.getByText("Avant · Gauche", { exact: true })).toBeVisible();
  await expect(row.getByText("Qté 4", { exact: true })).toBeVisible();
  await expect(
    row.getByText("Position à préciser avant toute sélection"),
  ).toHaveCount(0);
  await page.screenshot({
    path: `test-results/besoins-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await noOverflow(page);
  await row.getByRole("button", { name: "Retirer", exact: true }).click();
  await row.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Retirer", exact: true }).click();
  await row.getByRole("button", { name: "Confirmer le retrait" }).click();
  await expect(row).toHaveCount(0);
  await page.reload();
  await expect(row).toHaveCount(0);
});
