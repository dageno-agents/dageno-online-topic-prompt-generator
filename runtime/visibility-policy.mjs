export const MONITORING_POLICY_VERSION = "brand_visibility.v1";
export const BRAND_ROLES = ["provider_choice", "product_choice", "brand_evaluation"];
export const ENTITY_ROLES = [...BRAND_ROLES, "citation_source", "incidental_example", "none"];
export const CONTENT_ASSETS = ["product_or_service_page", "use_case_page", "comparison_or_alternative_page", "pricing_and_terms", "integration_documentation", "proof_or_case_study", "buyer_guide", "original_research", "earned_third_party_evidence"];
export const POOLS = ["monitoring_core", "citation_monitoring", "content_opportunity"];
export const EXPORT_DATASETS = ["service", "benchmark", "citation", "content"];

export const VISIBILITY_REVIEW_RULES = `The final service-monitoring list measures brand/product competitive exposure, not whether a question is merely on topic.
Apply the brandless-answer sufficiency test to EVERY actual question: could a competent answer fully satisfy the request using principles, steps, specifications or checklists without naming any particular provider, product or brand? If yes, do not admit it to brand visibility monitoring. A chance example or optional footnote does not count.
Assess the ENTITY'S ROLE: provider_choice, product_choice, brand_evaluation, citation_source, incidental_example or none. An authority used as a citation is different from a publisher being recommended as the destination/product itself. A competitor named as an aside is not a recommendation.
Do not approve solely because the question contains best/top/which, mentions an industry, or names an owned brand. A best-practices explanation and a branded troubleshooting question may be satisfied without evaluating the provider.
For monitoring_core, named entities must materially fulfill a real selection, comparison, adoption/switching or brand-validation decision. Explain the buyer decision and why entity names are necessary. This is a semantic design judgment, NOT an observed mention probability or guarantee.
State concrete content assets, proof needed and an actionable optimization task. Never imply unverified capabilities, guaranteed safety, fake reviews or manufactured third-party endorsements. For non-serviceable industry benchmark units, label the brand gap instead of pretending the customer can deliver it.
Use citation_monitoring for authoritative source/domain citations that do not entail brand selection. Keep definitions, generic how-to, formulas, checklists and pure maintenance in content_opportunity when brandless answers suffice.
Keep informational demand in the intent map. Never force an informational question into a commercial paraphrase just to pass this test. A genuinely different, evidenced provider-selection question must have its own intent unit and optional relatedContentUnitKeys link.
Low visibility of the target brand must NEVER fail eligibility. Apply the same test regardless of which competitor wins. Do not use narrow proprietary feature bundles to engineer target-brand wins.
Return one visibilityAssessment for every checked unit, including rejected/content-only questions. pool_mismatch is corrected by routing, not by forcing a different buyer intent into the old question.`;

function hasActionPlan(assessment) {
  const plan = assessment?.optimization;
  return Array.isArray(plan?.assets) && plan.assets.length > 0 && plan.assets.every(a => CONTENT_ASSETS.includes(a))
    && Array.isArray(plan.proofNeeded) && plan.proofNeeded.some(x => typeof x === "string" && x.trim())
    && typeof plan.action === "string" && Boolean(plan.action.trim());
}

export function routeAssessment(assessment) {
  const namesMatter = assessment?.brandlessAnswerSufficient === false
    && BRAND_ROLES.includes(assessment.entityRole)
    && ["brand_or_provider", "product_or_model", "source_or_authority"].includes(assessment.expectedEntityType)
    && Boolean(assessment.buyerDecision?.trim()) && Boolean(assessment.rationale?.trim()) && hasActionPlan(assessment);
  if (namesMatter) return "monitoring_core";
  if (assessment?.entityRole === "citation_source" && assessment.expectedEntityType === "source_or_authority") return "citation_monitoring";
  return "content_opportunity";
}

export function reviewedForVisibility(prompt) {
  const a = prompt?.visibilityAssessment;
  return a?.policyVersion === MONITORING_POLICY_VERSION && a.basis === "semantic_review"
    && a.reviewedPrompt === prompt.p && a.expectedEntityType === prompt.expectedEntityType
    && routeAssessment(a) === "monitoring_core" && prompt.pool === "monitoring_core";
}

export function metricUseFor(scope, pool) {
  if (scope === "out_of_scope_reference") return "diagnostic_only";
  if (pool === "citation_monitoring") return "citation_diagnostic";
  if (pool === "content_opportunity") return "content_planning";
  return { brand_core: "core_kpi", industry_benchmark: "category_benchmark", competitive_whitespace: "opportunity_analysis" }[scope];
}

export function selectPromptRowsForExport(artifact, { dataset, pool } = {}) {
  const selected = dataset || ({ monitoring_core: "service", citation_monitoring: "citation", content_opportunity: "content" }[pool || "monitoring_core"]);
  if (!EXPORT_DATASETS.includes(selected)) throw new Error("Unknown export dataset");
  if (artifact.monitoringPolicyVersion !== MONITORING_POLICY_VERSION) throw new Error("旧记录尚未完成品牌必要性审查，请重新审查后导出监控清单。");
  const rows = (artifact.generatedTopics || []).flatMap(topic => (topic.prompts || []).map(prompt => ({ topic: topic.topic, marketAnchor: topic.marketAnchor, prompt })));
  for (const { prompt: p } of rows) {
    const a = p.visibilityAssessment;
    if (!a || a.policyVersion !== MONITORING_POLICY_VERSION || a.reviewedPrompt !== p.p || a.basis !== "semantic_review" || typeof a.brandlessAnswerSufficient !== "boolean" || !ENTITY_ROLES.includes(a.entityRole) || !a.rationale?.trim() || routeAssessment(a) !== p.pool) throw new Error("部分问题的品牌必要性审查缺失或已过期，请复核后再导出。");
  }
  return rows.filter(({ prompt: p, marketAnchor }) => {
    if (p.scope === "out_of_scope_reference") return false;
    const assessment = p.visibilityAssessment;
    if (selected === "content") return p.pool === "content_opportunity";
    if (selected === "citation") return p.pool === "citation_monitoring";
    if (!reviewedForVisibility(p)) return false;
    if (selected === "benchmark") return p.benchmarkMember === true && p.pt === "generic" && marketAnchor?.marketRelation === "same_l3";
    return p.scope === "brand_core" && ["evidence_supported", "inferred"].includes(p.serviceabilityStatus);
  });
}

export function visibilitySummary(artifact) {
  const rows = artifact.generatedTopics.flatMap(t => t.prompts);
  return {
    policyVersion: MONITORING_POLICY_VERSION,
    defaultExport: "service",
    servicePrompts: selectPromptRowsForExport(artifact, { dataset: "service" }).length,
    benchmarkPrompts: selectPromptRowsForExport(artifact, { dataset: "benchmark" }).length,
    citationPrompts: selectPromptRowsForExport(artifact, { dataset: "citation" }).length,
    contentPrompts: selectPromptRowsForExport(artifact, { dataset: "content" }).length,
    brandVisibilityCandidates: rows.filter(reviewedForVisibility).length,
    topicsWithoutServiceMonitors: artifact.generatedTopics.filter(t => !t.prompts.some(p => reviewedForVisibility(p) && p.scope === "brand_core")).map(t => t.topic),
    note: "服务清单与行业基准分别统计；来源引用不等于品牌推荐。准入基于语义审查，尚不代表实测提及率。"
  };
}
