import test from "node:test";
import assert from "node:assert/strict";
import { runEntityPilot } from "../runtime/entity-pilot.mjs";
import { MONITORING_POLICY_VERSION } from "../runtime/visibility-policy.mjs";
import { visibilityAssessment } from "./fixtures.mjs";

function panel() {
  const p = { p: "Which scheduling software suits a small team?", pool: "monitoring_core", scope: "brand_core", intentUnitId: "unit-1", expectedEntityType: "brand_or_provider" };
  p.visibilityAssessment = { ...visibilityAssessment("unit-1"), reviewedPrompt: p.p, basis: "semantic_review", policyVersion: MONITORING_POLICY_VERSION };
  return { generatedTopics: [{ prompts: [p] }], businessResearch: { brandName: "TargetBrand" } };
}
test("entity pilot counts relevant competitors, not only target wins", async () => {
  const artifact = panel();
  const result = await runEntityPilot(artifact, {
    answer: async question => { assert.equal(question, artifact.generatedTopics[0].prompts[0].p); return { text: "OtherBrand is a scheduling provider.", model: "test/model", observedAt: new Date().toISOString() }; },
    classify: async () => [{ name: "OtherBrand", role: "provider_choice" }]
  });
  assert.equal(result.numerator, 1); assert.equal(result.records[0].targetMentioned, false); assert.equal(result.calibratedProbability, false);
  assert.equal(artifact.generatedTopics[0].prompts.length, 1);
});
test("pilot rejects fabricated entity extraction", async () => {
  await assert.rejects(runEntityPilot(panel(), { answer: async () => ({ text: "No providers named", model: "test/model", observedAt: "now" }), classify: async () => [{ name: "InventedBrand", role: "provider_choice" }] }), /not supported/);
});
for (const role of ["citation_source", "incidental_example"]) test("pilot does not count " + role + " as competitive exposure", async () => {
  const result = await runEntityPilot(panel(), { answer: async () => ({ text: "See OtherBrand for background information.", model: "test/model", observedAt: "now" }), classify: async () => [{ name: "OtherBrand", role }] });
  assert.equal(result.numerator, 0); assert.equal(result.denominator, 1); assert.equal(result.records[0].anyNamedEntity, true);
});
