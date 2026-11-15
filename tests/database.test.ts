import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { randomBytes, createHash } from "node:crypto";
import { database, withSession } from "../lib/db";
import { saveNeed, removeNeed, NeedError } from "../lib/need-store";
import { needSchema } from "../lib/needs";
import { randomUUID } from "node:crypto";
import { recordObservation } from "../lib/vehicles";
import { simulatedProvider } from "../lib/vehicle";
process.loadEnvFile(".env.local");
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

test("PostgreSQL : isolation réelle, authentification et observations", async (t) => {
  const config = JSON.parse(await readFile(".local/accounts.json", "utf8"));
  const sessions: string[] = [];
  try {
    for (const account of config.accounts) {
      const token = hash(randomBytes(32).toString("hex"));
      const result = await database().query(
        "SELECT public.open_session($1,$2,$3) AS ok",
        [account.email, account.password, token],
      );
      assert.equal(result.rows[0].ok, true);
      sessions.push(token);
    }
    const [a, b] = sessions;
    await t.test(
      "le rôle applicatif n’est ni propriétaire ni superutilisateur ni BYPASSRLS",
      async () => {
        const result = await database().query(
          "SELECT current_user,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
        );
        assert.equal(result.rows[0].current_user, "depanos_app");
        assert.equal(result.rows[0].rolsuper, false);
        assert.equal(result.rows[0].rolbypassrls, false);
        const tables = await database().query(
          "SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) AS owner FROM pg_class c WHERE c.oid IN ('public.vehicles'::regclass,'public.observations'::regclass,'public.garages'::regclass)",
        );
        assert.equal(tables.rowCount, 3);
        for (const row of tables.rows) {
          assert.equal(row.relrowsecurity, true);
          assert.equal(row.relforcerowsecurity, true);
          assert.notEqual(row.owner, "depanos_app");
        }
      },
    );
    const result = await simulatedProvider.identify("DEMO-001");
    const idB = await withSession(b, (c) =>
      recordObservation(c, "DEMO-001", result),
    );
    await t.test(
      "écrit dans B puis prouve que A ne lit ni sa fiche ni ses observations",
      async () => {
        await withSession(a, async (c) => {
          assert.equal(
            (await c.query("SELECT * FROM public.vehicles WHERE id=$1", [idB]))
              .rowCount,
            0,
          );
          assert.equal(
            (
              await c.query(
                "SELECT * FROM public.observations WHERE vehicle_id=$1",
                [idB],
              )
            ).rowCount,
            0,
          );
          assert.equal(
            (await c.query("SELECT * FROM public.garages")).rows[0].id,
            config.accounts[0].garageId,
          );
          await c.query("SELECT set_config('app.garage_id',$1,true)", [
            config.accounts[1].garageId,
          ]);
          assert.equal(
            (await c.query("SELECT * FROM public.vehicles WHERE id=$1", [idB]))
              .rowCount,
            0,
          );
        });
      },
    );
    await t.test(
      "la base refuse une insertion usurpant un autre garage",
      async () => {
        await assert.rejects(
          withSession(a, (c) =>
            c.query(
              "INSERT INTO public.vehicles(garage_id,plate,synthetic,latest_status,checked_at) VALUES($1,'DEMO-999',true,'unavailable',now())",
              [config.accounts[1].garageId],
            ),
          ),
          { code: "42501" },
        );
      },
    );
    await t.test(
      "une session absente ne voit aucune donnée métier",
      async () => {
        await withSession("", async (c) => {
          assert.equal(
            (await c.query("SELECT * FROM public.vehicles")).rowCount,
            0,
          );
          assert.equal(
            (await c.query("SELECT * FROM public.garages")).rowCount,
            0,
          );
          assert.equal(
            (await c.query("SELECT * FROM public.observations")).rowCount,
            0,
          );
        });
      },
    );
    await t.test(
      "une clé composée interdit un lien observation-véhicule intergarage",
      async () => {
        await assert.rejects(
          withSession(a, (c) =>
            c.query(
              "INSERT INTO public.observations(vehicle_id,source,result,checked_at) VALUES($1,'test','{}',now())",
              [idB],
            ),
          ),
          { code: "23503" },
        );
      },
    );
    await t.test(
      "une donnée fraîche corrige la mémoire, un champ vide ne l’efface pas",
      async () => {
        await withSession(a, async (c) => {
          const id = await recordObservation(c, "DEMO-002", result);
          const fresh = {
            ...result,
            identity: { ...result.identity!, engine: "CORRECTION_TEST" },
          };
          await recordObservation(c, "DEMO-002", fresh);
          await recordObservation(c, "DEMO-002", {
            ...fresh,
            status: "incomplete",
            identity: { ...fresh.identity, engine: null },
          });
          const saved = await c.query(
            "SELECT last_known,latest_status FROM public.vehicles WHERE id=$1",
            [id],
          );
          assert.equal(saved.rows[0].last_known.engine, "CORRECTION_TEST");
          assert.equal(saved.rows[0].latest_status, "incomplete");
        });
      },
    );
    await t.test(
      "besoins : isolation, preuve d’identité, versions et historique",
      async () => {
        const input = needSchema.parse({
          family: "braking",
          label: "Besoin de test isolation",
          quantity: "2",
          axle: "front",
          side: "both",
          notes: "Fixture explicite",
        });
        const id = randomUUID();
        await withSession(b, (c) => saveNeed(c, idB, id, input, null));
        await withSession(a, async (c) => {
          assert.equal(
            (
              await c.query("SELECT * FROM public.vehicle_needs WHERE id=$1", [
                id,
              ])
            ).rowCount,
            0,
          );
          assert.equal(
            (
              await c.query(
                "SELECT * FROM public.need_events WHERE need_id=$1",
                [id],
              )
            ).rowCount,
            0,
          );
          assert.equal(
            (
              await c.query(
                "UPDATE public.vehicle_needs SET label=$1 WHERE id=$2",
                ["tentative", id],
              )
            ).rowCount,
            0,
          );
        });
        await assert.rejects(
          withSession(a, (c) => removeNeed(c, idB, id, 1)),
          NeedError,
        );
        const incompleteId = await withSession(a, (c) =>
          recordObservation(c, "DEMO-002", { ...result, status: "incomplete" }),
        );
        await assert.rejects(
          withSession(a, (c) =>
            saveNeed(c, incompleteId, randomUUID(), input, null),
          ),
          NeedError,
        );
        const ownVehicle = await withSession(a, (c) =>
          recordObservation(c, "DEMO-001", result),
        );
        const ownId = randomUUID();
        await withSession(a, (c) =>
          saveNeed(c, ownVehicle, ownId, input, null),
        );
        await withSession(a, (c) =>
          saveNeed(c, ownVehicle, ownId, input, null),
        );
        assert.equal(
          (
            await withSession(a, (c) =>
              c.query("SELECT * FROM public.need_events WHERE need_id=$1", [
                ownId,
              ]),
            )
          ).rowCount,
          1,
        );
        const outcomes = await Promise.allSettled([
          withSession(a, (c) =>
            saveNeed(
              c,
              ownVehicle,
              ownId,
              { ...input, label: "Modification A" },
              1,
            ),
          ),
          withSession(a, (c) =>
            saveNeed(
              c,
              ownVehicle,
              ownId,
              { ...input, label: "Modification B" },
              1,
            ),
          ),
        ]);
        assert.equal(
          outcomes.filter((r) => r.status === "fulfilled").length,
          1,
        );
        assert.equal(outcomes.filter((r) => r.status === "rejected").length, 1);
        await withSession(a, (c) => removeNeed(c, ownVehicle, ownId, 2));
        await withSession(a, async (c) => {
          const row = (
            await c.query(
              "SELECT active,version,created_by FROM public.vehicle_needs WHERE id=$1",
              [ownId],
            )
          ).rows[0];
          assert.equal(row.active, false);
          assert.equal(row.version, 3);
          const identity = (
            await c.query("SELECT * FROM public.session_identity()")
          ).rows[0];
          assert.equal(row.created_by, identity.account_id);
          const events = await c.query(
            "SELECT * FROM public.need_events WHERE need_id=$1 ORDER BY id",
            [ownId],
          );
          assert.equal(events.rowCount, 3);
          assert.equal(events.rows[2].after_value.active, false);
        });
        await assert.rejects(
          withSession("", (c) =>
            c.query("SELECT * FROM public.vehicle_needs").then((r) => {
              assert.equal(r.rowCount, 0);
              return saveNeed(c, ownVehicle, randomUUID(), input, null);
            }),
          ),
          NeedError,
        );
        await withSession(a, (c) =>
          c
            .query("SELECT * FROM public.need_events")
            .then((r) =>
              assert.ok(
                r.rows.every(
                  (row) => row.garage_id === config.accounts[0].garageId,
                ),
              ),
            ),
        );
      },
    );
    await t.test(
      "mécanicien et vendeur décrivent les besoins ; garde-fous base et audit",
      async () => {
        const adminConfig = JSON.parse(
          await readFile(".local/postgres.json", "utf8"),
        );
        const admin = new Pool({
          ...adminConfig,
          host: "127.0.0.1",
          database: "depanos",
        });
        const input = needSchema.parse({
          family: "filtration",
          label: "Besoin de test rôles",
          quantity: "1",
          axle: "not_applicable",
          side: "not_applicable",
          notes: "",
        });
        const original = (
          await admin.query(
            "SELECT role FROM private.accounts WHERE email=$1",
            [config.accounts[1].email],
          )
        ).rows[0].role;
        try {
          for (const role of ["mechanic", "seller"]) {
            await admin.query(
              "UPDATE private.accounts SET role=$1 WHERE email=$2",
              [role, config.accounts[1].email],
            );
            const id = randomUUID();
            await withSession(b, async (c) => {
              assert.equal(
                (await c.query("SELECT role FROM public.session_identity()"))
                  .rows[0].role,
                role,
              );
              await saveNeed(c, idB, id, input, null);
              await removeNeed(c, idB, id, 1);
            });
          }
          const tables = await database().query(
            "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid IN ('public.vehicle_needs'::regclass,'public.need_events'::regclass)",
          );
          assert.equal(tables.rowCount, 2);
          assert.ok(
            tables.rows.every(
              (row) => row.relrowsecurity && row.relforcerowsecurity,
            ),
          );
          await assert.rejects(
            withSession(b, (c) =>
              c.query("UPDATE public.need_events SET before_value=NULL"),
            ),
            { code: "42501" },
          );
          await assert.rejects(
            withSession(b, (c) =>
              c.query(
                "UPDATE public.vehicle_needs SET version=999 WHERE vehicle_id=$1",
                [idB],
              ),
            ),
            { code: "42501" },
          );
          const incompleteResult = await simulatedProvider.identify("DEMO-002");
          const incomplete = await withSession(b, (c) =>
            recordObservation(c, "DEMO-002", incompleteResult),
          );
          await assert.rejects(
            withSession(b, (c) =>
              c.query(
                "INSERT INTO public.vehicle_needs(id,vehicle_id,family,label,quantity,axle,side) VALUES($1,$2,'braking','Test',1,'front','left')",
                [randomUUID(), incomplete],
              ),
            ),
            { code: "23514" },
          );
        } finally {
          await admin.query(
            "UPDATE private.accounts SET role=$1 WHERE email=$2",
            [original, config.accounts[1].email],
          );
          await admin.end();
        }
      },
    );
    await t.test("mauvais mot de passe, limitation et révocation", async () => {
      const email = config.accounts[0].email;
      for (let i = 0; i < 5; i++)
        assert.equal(
          (
            await database().query(
              "SELECT public.open_session($1,$2,$3) AS ok",
              [email, "incorrect", hash(randomBytes(32).toString("hex"))],
            )
          ).rows[0].ok,
          false,
        );
      assert.equal(
        (
          await database().query("SELECT public.open_session($1,$2,$3) AS ok", [
            email,
            config.accounts[0].password,
            hash(randomBytes(32).toString("hex")),
          ])
        ).rows[0].ok,
        false,
      );
      // Administrateur uniquement pour rétablir la fixture après le test de limitation.
      const adminConfig = JSON.parse(
        await readFile(".local/postgres.json", "utf8"),
      );
      const admin = new Pool({
        ...adminConfig,
        host: "127.0.0.1",
        database: "depanos",
      });
      try {
        await admin.query("DELETE FROM private.login_limits WHERE key=$1", [
          email,
        ]);
      } finally {
        await admin.end();
      }
      assert.equal(
        (
          await database().query("SELECT public.open_session($1,$2,$3) AS ok", [
            email,
            config.accounts[0].password + "x".repeat(80),
            hash(randomBytes(32).toString("hex")),
          ])
        ).rows[0].ok,
        false,
      );
      await withSession(a, async (c) => {
        await c.query("SELECT public.close_session()");
        assert.equal(
          (await c.query("SELECT * FROM public.session_identity()")).rowCount,
          0,
        );
      });
    });
  } finally {
    for (const session of sessions)
      await withSession(session, (c) =>
        c.query("SELECT public.close_session()"),
      );
    await database().end();
  }
});
