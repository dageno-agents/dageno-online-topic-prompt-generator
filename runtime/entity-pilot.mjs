import { termPresent } from "./contract.mjs";

export function pilotSample(artifact, count = 3) {
  const groups = artifact.generatedTopics.map(t => t.prompts.filter(p => p.pool === "monitoring_core" && p.scope !== "out_of_scope_reference").sort((a, b) => a.intentUnitId.localeCompare(b.intentUnitId)));
  const selected = [];
  for (let i = 0; selected.length < count && groups.some(g => g[i]); i++) for (const group of groups) {
    if (group[i] && selected.length < count) selected.push(group[i]);
  }
  return selected;
}

export async function runEntityPilot(artifact, { answer, classify, count = 3 }) {
  const records = [];
  for (const prompt of pilotSample(artifact, Math.max(1, Math.min(count, 12)))) {
    // Answer receives the question alone. Brand context belongs only to evaluation.
    const response = await answer(prompt.p);
    if (!response?.text || !response.model || !response.observedAt) throw new Error("Pilot response lacks raw text/model/time");
    const entities = await classify({ question: prompt.p, answer: response.text, expectedEntityType: prompt.expectedEntityType });
    if (!Array.isArray(entities) || entities.some(e => typeof e !== "string" || !termPresent(response.text, e))) throw new Error("Pilot entity extraction is not supported by raw response");
    records.push({ intentUnitId: prompt.intentUnitId, question: prompt.p, ...response, entities: [...new Set(entities)], anyRelevantEntity: entities.length > 0, targetMentioned: termPresent(response.text, artifact.businessResearch.brandName) });
  }
  const numerator = records.filter(r => r.anyRelevantEntity).length;
  return { status: "executed", platformMode: "openrouter_api", regionControl: "not_verified", notConsumerPlatformMonitoring: true, selectionPolicy: "round_robin_topics_stable_id_no_target_outcome_filter", numerator, denominator: records.length, observedEntityRate: records.length ? numerator / records.length : null, calibratedProbability: false, records, note: "Technical API pilot only. Tiny-sample rate is not a calibrated mention probability. Panel inclusion is unchanged regardless of target mentions." };
}
