import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { generatePanel } from "./pipeline.mjs";
import { modelClient } from "./model.mjs";
import { validateArtifact } from "./qa.mjs";
import { csvExport } from "./contract.mjs";

const [command, ...args] = process.argv.slice(2);
const read = async path => JSON.parse((await readFile(path, "utf8")).replace(/^\uFEFF/, ""));
try {
  if (command === "qa") {
    const result = validateArtifact(await read(args[0]));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.passed ? 0 : 1;
  } else if (command === "export") {
    const artifact = await read(args[0]);
    const qa = validateArtifact(artifact);
    if (!qa.passed) throw new Error(qa.errors.join("; "));
    await writeFile(args[1], csvExport(artifact, { pool: args.includes("--content") ? "content_opportunity" : "monitoring_core" }));
    console.log(`Exported ${args[1]}`);
  } else if (command === "generate") {
    const opt = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
    const model = modelClient({ apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL });
    const dir = resolve(opt("out") || "private/panel");
    const input = { domain: opt("domain"), market: opt("market") || "US", outputLanguage: opt("language") || "en-US", brandPromptMode: opt("brand-mode") || "exclude", previousPanel: opt("previous") ? await read(opt("previous")) : undefined };
    const artifact = await generatePanel(input, { model, modelId: process.env.OPENROUTER_MODEL, onProgress: stage => console.error(stage) });
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, "panel.json"), JSON.stringify(artifact, null, 2));
    await writeFile(resolve(dir, "analysis.md"), artifact.content);
    await writeFile(resolve(dir, "import.csv"), csvExport(artifact));
    console.log(JSON.stringify({ directory: dir, ...artifact.outputCounts }));
  } else throw new Error("Usage: node runtime/cli.mjs generate --domain example.com --market US --language en-US --out private/example | qa panel.json | export panel.json import.csv");
} catch (error) { console.error(error.message); process.exitCode = 1; }
