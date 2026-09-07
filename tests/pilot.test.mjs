import test from "node:test";
import assert from "node:assert/strict";
import { runEntityPilot } from "../runtime/entity-pilot.mjs";
test("entity pilot counts relevant competitors, not only target wins", async () => {
  const p = { p: "Which scheduling software suits a small team?", pool: "monitoring_core", scope: "brand_core", intentUnitId: "unit-1", expectedEntityType: "brand_or_provider" };
  const artifact = { generatedTopics: [{ prompts: [p] }], businessResearch: { brandName: "TargetBrand" } };
  const result = await runEntityPilot(artifact, { answer: async question => { assert.equal(question, p.p); return { text: "OtherBrand is a scheduling provider.", model: "test/model", observedAt: new Date().toISOString() }; }, classify: async () => ["OtherBrand"] });
  assert.equal(result.numerator, 1); assert.equal(result.records[0].targetMentioned, false); assert.equal(result.calibratedProbability, false);
  assert.equal(artifact.generatedTopics[0].prompts.length, 1);
});
test("pilot rejects fabricated entity extraction", async () => {
  const artifact = { generatedTopics: [{ prompts: [{ p: "Which provider?", pool: "monitoring_core", scope: "brand_core", intentUnitId: "unit-1" }] }], businessResearch: { brandName: "TargetBrand" } };
  await assert.rejects(runEntityPilot(artifact, { answer: async () => ({ text: "No providers named", model: "test/model", observedAt: "now" }), classify: async () => ["InventedBrand"] }), /not supported/);
});
