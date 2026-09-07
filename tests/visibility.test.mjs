import test from "node:test";
import assert from "node:assert/strict";
import { routeAssessment, selectPromptRowsForExport, reviewedForVisibility } from "../runtime/visibility-policy.mjs";
import { validateVisibilityAssessment, validateArtifact, panelDiff } from "../runtime/qa.mjs";
import { fixture, visibilityAssessment, mixedPanel } from "./fixtures.mjs";
import { generatePanel } from "../runtime/pipeline.mjs";
import { csvExport } from "../runtime/contract.mjs";

for (const [question, entityRole, sufficient, expectedEntityType, expected] of [
  ["如何计算电池续航？", "none", true, "method_or_concept", "content_opportunity"],
  ["Best practices for reducing support response time?", "incidental_example", true, "brand_or_provider", "content_opportunity"],
  ["Li-ion vs LiFePO4: how do the chemistries differ?", "none", true, "method_or_concept", "content_opportunity"],
  ["哪些客服系统支持多渠道统一接待？", "provider_choice", false, "brand_or_provider", "monitoring_core"],
  ["Which camping chairs are suitable for frequent car camping?", "product_choice", false, "product_or_model", "monitoring_core"],
  ["哪些研究报告比较了客服响应速度？", "citation_source", true, "source_or_authority", "citation_monitoring"],
  ["Which business news publications should I subscribe to?", "provider_choice", false, "source_or_authority", "monitoring_core"],
  ["How do I reset my NamedApp password?", "brand_evaluation", true, "brand_or_provider", "content_opportunity"]
]) test(`labelled policy fixture: ${question}`, () => {
  // These are expert-labelled role fixtures, not a live semantic accuracy test.
  assert.equal(routeAssessment({ ...visibilityAssessment("u"), entityRole, brandlessAnswerSufficient: sufficient, expectedEntityType }), expected);
});


test("route knowledge and citations without rewriting the original intent or shrinking the industry map", async () => {
  const { artifact: a, calls, questions } = await mixedPanel();
  assert.equal(a.intentRegistry.length, 4); assert.equal(a.outputCounts.prompts, 4);
  assert.equal(a.visibilityReport.servicePrompts, 1); assert.equal(a.visibilityReport.benchmarkPrompts, 2);
  assert.equal(a.visibilityReport.citationPrompts, 1); assert.equal(a.visibilityReport.contentPrompts, 1);
  assert.equal(calls.filter(s => s === "prompt_generation").length, 1);
  assert.equal(a.generatedTopics[0].prompts[0].p, questions[0]);
  assert.equal(a.generatedTopics[0].prompts[0].metricUse, "content_planning");
  assert.equal(a.generatedTopics[0].prompts[2].metricUse, "citation_diagnostic");
  assert.equal(a.optimizationBriefs[0].briefs[1].relatedContentUnitKeys[0], "unit-0");
  assert.equal(validateArtifact(a).passed, true);
});
test("default CSV is serviceable brand competition; benchmark retains the unsupported industry decision", async () => {
  const { artifact: a, questions } = await mixedPanel();
  const csv = csvExport(a);
  assert.ok(csv.includes(questions[1])); assert.ok(!csv.includes(questions[0])); assert.ok(!csv.includes(questions[2])); assert.ok(!csv.includes(questions[3]));
  const benchmark = csvExport(a, { dataset: "benchmark" });
  assert.ok(benchmark.includes(questions[1])); assert.ok(benchmark.includes(questions[3]));
  assert.ok(csvExport(a, { dataset: "citation" }).includes(questions[2]));
  assert.ok(csvExport(a, { dataset: "content" }).includes(questions[0]));
});
test("stale questions, missing reviews and empty service exports cannot silently pass", async () => {
  const { artifact: a } = await mixedPanel();
  const old = structuredClone(a); delete old.monitoringPolicyVersion;
  assert.throws(() => csvExport(old), /旧记录/);
  const changed = structuredClone(a); changed.generatedTopics[0].prompts[1].p += " changed";
  assert.throws(() => csvExport(changed), /过期/); assert.equal(reviewedForVisibility(changed.generatedTopics[0].prompts[1]), false);
  const noService = structuredClone(a); noService.generatedTopics[0].prompts = noService.generatedTopics[0].prompts.filter(p => p.pool !== "monitoring_core");
  assert.throws(() => csvExport(noService), /没有通过/);
});
test("a necessary-entity decision without an optimization plan must be repaired, not relabelled as knowledge", () => {
  const assessment = visibilityAssessment("u"); assessment.optimization.assets = [];
  assert.throws(() => validateVisibilityAssessment(assessment), /asset\/proof\/action/);
});
test("changing admission policy requires a new baseline and never implies a visibility improvement", async () => {
  const { artifact: a } = await mixedPanel();
  const previous = structuredClone(a); delete previous.monitoringPolicyVersion;
  assert.equal(panelDiff(a, previous).comparability, "new_baseline_required");
  const changed = structuredClone(a); changed.generatedTopics[0].prompts[0].pool = "monitoring_core";
  assert.equal(panelDiff(changed, a).comparability, "report_common_panel_separately");
  assert.equal(panelDiff(changed, a).metricMembershipChanged.length, 1);
});
