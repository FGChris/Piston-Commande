import {
  lstat,
  readdir,
  readFile,
  mkdir,
  writeFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";
const args = process.argv.slice(2);
const index = args.indexOf("--vault");
const destination = index >= 0 ? args[index + 1] : null;
const apply = args.includes("--apply");
if (!destination) {
  console.log(
    "Usage : node scripts/obsidian-import.mjs --vault /chemin/du/coffre [--apply]\nSans --apply : contrôle sans écriture. Import uniquement dans DEPANOS, sans remplacer aucun fichier.",
  );
  process.exit(0);
}
const vault = await realpath(destination);
if (!(await lstat(vault)).isDirectory())
  throw new Error("Le coffre doit être un répertoire existant.");
const source = path.resolve("obsidian-kit/DEPANOS");
const plan = [];
async function inspect(dir, relative = "") {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isSymbolicLink())
      throw new Error("Lien symbolique refusé dans le kit.");
    const rel = path.join(relative, item.name);
    if (item.isDirectory()) {
      await inspect(path.join(dir, item.name), rel);
      continue;
    }
    const target = path.join(vault, "DEPANOS", rel);
    const parts = path.relative(vault, target).split(path.sep);
    let probe = vault;
    for (const part of parts) {
      probe = path.join(probe, part);
      try {
        const info = await lstat(probe);
        if (info.isSymbolicLink())
          throw new Error("Lien symbolique refusé dans la destination.");
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
    }
    const bytes = await readFile(path.join(dir, item.name));
    try {
      const existing = await readFile(target);
      if (!existing.equals(bytes))
        throw new Error(
          `Conflit sur DEPANOS/${rel} : aucun remplacement autorisé.`,
        );
      plan.push({ target, bytes, exists: true });
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      plan.push({ target, bytes, exists: false });
    }
  }
}
await inspect(source);
if (apply) {
  for (const item of plan) {
    if (!item.exists) {
      await mkdir(path.dirname(item.target), { recursive: true, mode: 0o700 });
      await writeFile(item.target, item.bytes, { flag: "wx", mode: 0o600 });
    }
  }
}
console.log(
  `${plan.length} notes contrôlées ; ${plan.filter((p) => !p.exists).length} ${apply ? "ajoutées" : "à ajouter"}. Configuration .obsidian et notes existantes préservées.`,
);
