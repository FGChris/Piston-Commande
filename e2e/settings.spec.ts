import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { randomUUID, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
test("réglages privés : accès masqués, mot de passe, rôles et pages légales", async ({
  page,
}, info) => {
  const admin = new Pool({
    ...JSON.parse(await readFile(".local/postgres.json", "utf8")),
    host: "127.0.0.1",
    database: "depanos",
  });
  const tenant = randomUUID(),
    account = randomUUID(),
    email = `e2e-${account}@test.invalid`,
    password = randomBytes(24).toString("base64url");
  const secret = "Secret-Synthetique-E2E",
    username = "Identifiant-Synthetique-E2E";
  try {
    await admin.query(
      "INSERT INTO public.garages(id,name,synthetic) VALUES($1,'Atelier sécurité test',true)",
      [tenant],
    );
    await admin.query(
      "INSERT INTO private.accounts(id,garage_id,email,display_name,password_hash,role) VALUES($1,$2,$3,'Test sécurité',extensions.crypt($4,extensions.gen_salt('bf',12)),'boss')",
      [account, tenant, email, password],
    );
    await page.goto("/reglages");
    await expect(page).toHaveURL(/connexion/);
    for (const route of [
      "mentions",
      "confidentialite",
      "cookies",
      "utilisation",
    ]) {
      await page.goto(`/legal/${route}`);
      await expect(
        page.getByText("Brouillon — informations à compléter en V2."),
      ).toBeVisible();
    }
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Ouvrir mon atelier" }).click();
    await page
      .getByRole("link", { name: "Réglages", exact: true })
      .last()
      .click();
    const card = page
      .locator("section.settings-card")
      .filter({
        has: page.getByRole("heading", { name: "DASIR", exact: true }),
      });
    await card
      .getByLabel("Adresse du portail HTTPS")
      .fill("https://example.com/portail");
    await card.getByLabel("Identifiant du compte").fill(username);
    await card.getByLabel("Mot de passe ou clé d’accès").fill(secret);
    await card.getByLabel("Je suis autorisé").check();
    await card.getByRole("button", { name: "Enregistrer les accès" }).click();
    await expect(card.getByRole("status")).toContainText(
      "Accès chiffré enregistré",
    );
    await expect(card.getByLabel("Identifiant du compte")).toHaveValue("");
    await expect(card.getByLabel("Mot de passe ou clé d’accès")).toHaveValue(
      "",
    );
    await page.reload();
    await expect(card.getByText("Accès enregistré · Non testé")).toBeVisible();
    expect(await page.content()).not.toContain(secret);
    expect(await page.content()).not.toContain(username);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/reglages-${info.project.name}.png`,
      fullPage: true,
    });
    await admin.query(
      "UPDATE private.accounts SET role='mechanic' WHERE id=$1",
      [account],
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "DASIR", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Sécurité de mon compte" }),
    ).toBeVisible();
    await admin.query("UPDATE private.accounts SET role='boss' WHERE id=$1", [
      account,
    ]);
    await page.reload();
    await card.getByLabel("Je confirme le retrait").check();
    await card.getByRole("button", { name: "Supprimer les accès" }).click();
    await expect(card.getByText("Aucun accès enregistré")).toBeVisible();
    const next = randomBytes(24).toString("base64url");
    await page.getByLabel("Mot de passe actuel").fill(password);
    await page.getByLabel("Nouveau mot de passe", { exact: true }).fill(next);
    await page.getByLabel("Confirmer le nouveau mot de passe").fill(next);
    await page
      .getByRole("button", { name: "Changer mon mot de passe" })
      .click();
    await expect(page).toHaveURL(/connexion/);
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(next);
    await page.getByRole("button", { name: "Ouvrir mon atelier" }).click();
    await expect(
      page.getByRole("heading", { name: /Prêt pour le prochain véhicule/ }),
    ).toBeVisible();
  } finally {
    // Disposable garage only, no pre-existing user data.
    await admin.query("DELETE FROM public.settings_events WHERE garage_id=$1", [
      tenant,
    ]);
    await admin.query("DELETE FROM private.sessions WHERE account_id=$1", [
      account,
    ]);
    const remaining = (
      await admin.query(
        "SELECT 1 FROM public.supplier_credentials WHERE garage_id=$1",
        [tenant],
      )
    ).rowCount;
    if (!remaining) {
      await admin.query("DELETE FROM private.accounts WHERE id=$1", [account]);
      await admin.query("DELETE FROM public.garages WHERE id=$1", [tenant]);
    }
    await admin.query(
      "DELETE FROM private.login_limits WHERE key=$1 OR key=$2",
      [email, `password:${account}`],
    );
    await admin.end();
  }
});
