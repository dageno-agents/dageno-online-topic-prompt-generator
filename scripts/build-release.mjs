import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { VERSION } from "../runtime/contract.mjs";
const root = new URL("../", import.meta.url);
const files = ["SKILL.md", "package.json", "package-lock.json", "agents/openai.yaml"];
for (const dir of ["runtime", "references", "scripts", "tests"]) for (const name of await readdir(new URL(dir + "/", root))) {
  if (/\.(?:md|mjs|py|json)$/.test(name) && name !== "release.generated.mjs") files.push(`${dir}/${name}`);
}
const hashes = {};
for (const name of files.sort()) hashes[name] = createHash("sha256").update(await readFile(new URL(name, root))).digest("hex");
const manifest = { status: "candidate_pending_live_validation", version: VERSION, digest: createHash("sha256").update(JSON.stringify(hashes)).digest("hex"), files: hashes };
const data = JSON.stringify(manifest, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (await readFile(new URL("release-manifest.json", root), "utf8") !== data) throw new Error("Release manifest does not match current runtime and rules");
} else {
  await writeFile(new URL("release-manifest.json", root), data);
  await writeFile(new URL("runtime/release.generated.mjs", root), `export const RELEASE_DIGEST = ${JSON.stringify(manifest.digest)};\n`);
}
console.log(`V${VERSION} ${manifest.digest}`);
