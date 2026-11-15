import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFile,
  mkdtemp,
  mkdir,
  writeFile,
  readFile as read,
  rm,
} from "node:fs/promises";
import { Pool } from "pg";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { database, withSession } from "../lib/db";
import { seal, encryptionKey, unseal } from "../lib/secrets";
import { execFileSync } from "node:child_process";
process.loadEnvFile(".env.local");
test("coffre : données chiffrées, rôles, isolation, journal sans secret et changement de mot de passe", async () => {
  const admin = new Pool({
    ...JSON.parse(await readFile(".local/postgres.json", "utf8")),
    host: "127.0.0.1",
    database: "depanos",
  });
  const tenant = randomUUID(),
    other = randomUUID(),
    account = randomUUID(),
    email = `fixture-${account}@test.invalid`,
    password = randomBytes(24).toString("base64url");
  const hash = () => createHash("sha256").update(randomBytes(32)).digest("hex");
  const a = hash(),
    b = hash(),
    last = hash();
  try {
    await admin.query(
      "INSERT INTO public.garages(id,name,synthetic) VALUES($1,$3,true),($2,$3,true)",
      [tenant, other, "Fixture coffre"],
    );
    await admin.query(
      "INSERT INTO private.accounts(id,garage_id,email,display_name,password_hash,role) VALUES($1,$2,$3,'Fixture',extensions.crypt($4,extensions.gen_salt('bf',12)),'boss')",
      [account, tenant, email, password],
    );
    for (const token of [a, b])
      assert.equal(
        (
          await database().query("SELECT public.open_session($1,$2,$3) AS ok", [
            email,
            password,
            token,
          ])
        ).rows[0].ok,
        true,
      );
    const secret = "fixture-secret-uniquement";
    const key = await encryptionKey();
    const encrypted = seal(secret, `${tenant}:dasir`, key);
    await withSession(a, (c) =>
      c.query(
        "INSERT INTO public.supplier_credentials(provider,sealed_value) VALUES('dasir',$1)",
        [encrypted],
      ),
    );
    await withSession(a, async (c) => {
      const row = (await c.query("SELECT * FROM public.supplier_credentials"))
        .rows[0];
      assert.equal(unseal(row.sealed_value, `${tenant}:dasir`, key), secret);
      const events = await c.query("SELECT * FROM public.settings_events");
      assert.equal(events.rowCount, 1);
      assert.ok(!JSON.stringify(events.rows).includes(secret));
      assert.ok(!JSON.stringify(events.rows).includes(encrypted));
    });
    await assert.rejects(
      withSession(a, (c) =>
        c.query(
          "INSERT INTO public.supplier_credentials(garage_id,provider,sealed_value) VALUES($1,'pavi',$2)",
          [other, encrypted],
        ),
      ),
      { code: "42501" },
    );
    for (const role of ["mechanic", "seller"]) {
      await admin.query("UPDATE private.accounts SET role=$1 WHERE id=$2", [
        role,
        account,
      ]);
      await withSession(a, async (c) => {
        assert.equal(
          (await c.query("SELECT * FROM public.supplier_credentials")).rowCount,
          0,
        );
        assert.equal(
          (await c.query("SELECT * FROM public.settings_events")).rowCount,
          0,
        );
        assert.equal(
          (await c.query("DELETE FROM public.supplier_credentials")).rowCount,
          0,
        );
      });
      await assert.rejects(
        withSession(a, (c) =>
          c.query(
            "INSERT INTO public.supplier_credentials(provider,sealed_value) VALUES('pavi',$1)",
            [encrypted],
          ),
        ),
        { code: "42501" },
      );
    }
    await admin.query(
      "UPDATE private.accounts SET role='boss',garage_id=$1 WHERE id=$2",
      [other, account],
    );
    await withSession(a, async (c) =>
      assert.equal(
        (await c.query("SELECT * FROM public.supplier_credentials")).rowCount,
        0,
      ),
    );
    await admin.query("UPDATE private.accounts SET garage_id=$1 WHERE id=$2", [
      tenant,
      account,
    ]);
    await withSession("", async (c) =>
      assert.equal(
        (await c.query("SELECT * FROM public.supplier_credentials")).rowCount,
        0,
      ),
    );
    const next = randomBytes(24).toString("base64url");
    assert.equal(
      (
        await withSession(a, (c) =>
          c.query("SELECT public.change_password($1,$2) AS ok", [
            "wrong",
            next,
          ]),
        )
      ).rows[0].ok,
      false,
    );
    assert.equal(
      (
        await withSession(a, (c) =>
          c.query("SELECT public.change_password($1,$2) AS ok", [
            password,
            next,
          ]),
        )
      ).rows[0].ok,
      true,
    );
    for (const token of [a, b])
      await withSession(token, async (c) =>
        assert.equal(
          (await c.query("SELECT * FROM public.session_identity()")).rowCount,
          0,
        ),
      );
    assert.equal(
      (
        await database().query("SELECT public.open_session($1,$2,$3) AS ok", [
          email,
          password,
          hash(),
        ])
      ).rows[0].ok,
      false,
    );
    assert.equal(
      (
        await database().query("SELECT public.open_session($1,$2,$3) AS ok", [
          email,
          next,
          last,
        ])
      ).rows[0].ok,
      true,
    );
  } finally {
    await withSession(last, (c) =>
      c.query("DELETE FROM public.supplier_credentials WHERE garage_id=$1", [
        tenant,
      ]),
    );
    await admin.query("DELETE FROM public.settings_events WHERE garage_id=$1", [
      tenant,
    ]);
    await admin.query("DELETE FROM private.sessions WHERE account_id=$1", [
      account,
    ]);
    await admin.query("DELETE FROM private.accounts WHERE id=$1", [account]);
    await admin.query(
      "DELETE FROM private.login_limits WHERE key=$1 OR key=$2",
      [email, `password:${account}`],
    );
    await admin.query("DELETE FROM public.garages WHERE id IN ($1,$2)", [
      tenant,
      other,
    ]);
    await admin.end();
    await database().end();
  }
});
test("import Obsidian : simulation, répétabilité et préservation des fichiers existants", async () => {
  const dir = await mkdtemp("/tmp/depanos-obsidian-test-");
  try {
    await mkdir(`${dir}/.obsidian`);
    await writeFile(`${dir}/.obsidian/app.json`, '{"user":true}');
    await writeFile(`${dir}/Ma-note.md`, "À préserver");
    execFileSync(process.execPath, [
      "scripts/obsidian-import.mjs",
      "--vault",
      dir,
    ]);
    await assert.rejects(read(`${dir}/DEPANOS/00-Accueil/Accueil.md`), {
      code: "ENOENT",
    });
    for (let i = 0; i < 2; i++)
      execFileSync(process.execPath, [
        "scripts/obsidian-import.mjs",
        "--vault",
        dir,
        "--apply",
      ]);
    assert.equal(await read(`${dir}/Ma-note.md`, "utf8"), "À préserver");
    assert.equal(
      await read(`${dir}/.obsidian/app.json`, "utf8"),
      '{"user":true}',
    );
    await writeFile(`${dir}/DEPANOS/00-Accueil/Accueil.md`, "Ma modification");
    assert.throws(() =>
      execFileSync(
        process.execPath,
        ["scripts/obsidian-import.mjs", "--vault", dir, "--apply"],
        { stdio: "pipe" },
      ),
    );
    assert.equal(
      await read(`${dir}/DEPANOS/00-Accueil/Accueil.md`, "utf8"),
      "Ma modification",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
