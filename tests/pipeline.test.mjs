import test from "node:test";
import assert from "node:assert/strict";
import { generatePanel } from "../runtime/pipeline.mjs";
import { stableId, termPresent, lexicalSimilarity, csvExport, languageCode } from "../runtime/contract.mjs";
import { validateArtifact, panelDiff } from "../runtime/qa.mjs";
import { parsePage, sitemapLocations, privateAddress, publicUrl } from "../runtime/research.mjs";

import { fixture } from "./fixtures.mjs";

for (const category of ["parcel tracking software", "custom battery packs", "barber services", "university language courses", "AI circuit design", "camping furniture", "electronic signatures", "executive coaching", "training datasets", "video editing"]) {
  test(`pipeline contract and isolation: ${category} (mocked model, not a live accuracy test)`, async () => {
    const f = fixture(category);
    const a = await generatePanel({ domain: "client.example", market: "US" }, f.deps);
    assert.equal(a.outputCounts.prompts, 4); assert.equal(a.qaReport.passed, true);
    assert.equal(f.calls.filter(s => s.startsWith("business_")).length, 2);
    assert.ok(a.generatedTopics.every(t => t.prompts.every(p => p.p.includes(category))));
    assert.ok(a.generatedTopics[0].prompts.every(p => p.evidenceAssessment.mentionLikelihood === null));
  });
}
test("a narrow domain may need only one Topic and one Prompt", async () => {
  const a = await generatePanel({ domain: "client.example", market: "US" }, fixture("narrow service", 1).deps);
  assert.deepEqual(a.outputCounts, { topics: 1, prompts: 1 });
});
test("pagination covers more than 100 units without truncation", async () => {
  const a = await generatePanel({ domain: "client.example", market: "US", researchBudget: { maxModelCalls: 150 } }, fixture("test category", 105).deps);
  assert.equal(a.outputCounts.prompts, 105); assert.equal(a.deferredUnits.length, 0);
});
test("more than 50 Topics are not an ontology ceiling", async () => {
  const a = await generatePanel({ domain: "client.example", market: "US", researchBudget: { maxModelCalls: 200 } }, fixture("test category", 51, 51).deps);
  assert.equal(a.outputCounts.topics, 51);
});
test("manual caps disclose every deferred unit", async () => {
  const a = await generatePanel({ domain: "client.example", market: "US", promptMode: "manual", promptCount: 1 }, fixture().deps);
  assert.equal(a.outputCounts.prompts, 1); assert.equal(a.deferredUnits.length, 3);
  assert.equal(a.coverageReport[0].coverageRate, 25);
});
test("fabricated sources and Canonical IDs stop generation", async () => {
  const f = fixture(); f.business.markets[0].canonicalL3Id = "invented";
  await assert.rejects(generatePanel({ domain: "client.example" }, f.deps), /Canonical/);
  const other = fixture(); other.business.capabilities[0].sourceIds = ["invented"];
  await assert.rejects(generatePanel({ domain: "client.example" }, other.deps), /fabricated/);
});
test("empty crawl and unresolved business fail closed", async () => {
  const f = fixture(); f.deps.crawl = async () => ({ sources: [], pages: [] });
  await assert.rejects(generatePanel({ domain: "client.example" }, f.deps), /官网/);
  const g = fixture(); g.business.status = "needs_confirmation";
  await assert.rejects(generatePanel({ domain: "client.example" }, g.deps), /业务边界/);
});
test("semantic reviewer catches wrong industry even when schema is valid", async () => {
  const f = fixture(); f.deps.model = async args => args.stage === "semantic_review" ? { issues: args.payload.units.map(u => ({ unitKey: u.key, kind: "wrong_business", reason: "wrong industry", duplicateOf: "" })), checkedUnitKeys: args.payload.units.map(u => u.key) } : f.model(args);
  await assert.rejects(generatePanel({ domain: "client.example" }, f.deps), /语义复核/);
});
test("locale and lossless four-column CSV", async () => {
  const a = await generatePanel({ domain: "client.example", market: "TW", outputLanguage: "繁體中文" }, fixture("電子簽署軟體", 4, 1, "zh-TW").deps);
  const csv = csvExport(a); assert.ok(csv.startsWith("\uFEFFtopic,prompt,regions,language\r\n"));
  assert.ok(csv.includes('"TW","zh-TW"')); assert.equal(languageCode("Traditional Chinese"), "zh-TW");
});
test("stable intent IDs and version differences", async () => {
  const a = await generatePanel({ domain: "client.example" }, fixture().deps);
  const b = await generatePanel({ domain: "client.example", previousPanel: a }, fixture().deps);
  assert.equal(b.versionDiff.comparability, "same_panel");
  const c = structuredClone(b); c.generatedTopics[0].prompts[0].p += " changed";
  assert.equal(panelDiff(c, a).wordingChanged.length, 1);
  assert.equal(await stableId("test", "a"), await stableId("test", "a"));
});
test("missing semantic review or lost units cannot pass final QA", async () => {
  const a = await generatePanel({ domain: "client.example" }, fixture().deps);
  a.generatedTopics[0].prompts.pop(); a.semanticReview.passed = false;
  assert.equal(validateArtifact(a).passed, false);
});
test("Unicode lexical candidates are not semantic deletion", () => {
  assert.ok(lexicalSimilarity("哪些電子簽署工具支援合約簽署", "哪些電子簽署工具支援合約匯出", "zh-TW") > 0);
  assert.equal(termPresent("conditions and online services", "On"), false);
  assert.equal(termPresent("Compare On shoes", "On"), true);
});
test("portable final QA enforces brand and language policy, not just ID mappings", async () => {
  const a = await generatePanel({ domain: "client.example" }, fixture().deps);
  a.generatedTopics[0].prompts[0].p += " Client Example";
  a.generatedTopics[0].prompts[1].l = "zh-CN";
  const qa = validateArtifact(a);
  assert.equal(qa.passed, false); assert.ok(qa.errors.some(e => e.includes("blocked brand"))); assert.ok(qa.errors.some(e => e.includes("language mismatch")));
});
test("HTML/XML parsers and network boundary", () => {
  const page = parsePage('<html><title>Example</title><meta content="description" name="description"><nav>VPS cache</nav><main><h1>Real business</h1><p>Business evidence goes here with product details.</p></main></html>', "https://client.example/");
  assert.equal(page.meta, "description"); assert.ok(!page.text.includes("VPS cache"));
  assert.deepEqual(sitemapLocations('<sitemapindex><sitemap><loc>https://client.example/child.xml</loc></sitemap></sitemapindex>').sitemaps, ["https://client.example/child.xml"]);
  for (const url of ["http://example.com", "https://127.0.0.1", "https://user:pass@example.com", "https://foo.local", "https://[::1]"]) assert.throws(() => publicUrl(url));
  assert.ok(privateAddress("169.254.169.254")); assert.ok(privateAddress("10.0.0.1")); assert.equal(privateAddress("8.8.8.8"), false);
});
