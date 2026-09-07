import { INTENTS, METRICS, normalizeText, termPresent, lexicalSimilarity } from "./contract.mjs";
import { businessSchema, unitSchema, promptsSchema } from "./schemas.mjs";
import { validateSchema } from "./validate-schema.mjs";

export function requireReferences(ids, sources, label) {
  const known = new Set(sources.map(x => x.id));
  if (!ids?.length || ids.some(id => !known.has(id))) throw new Error(`${label}: missing or fabricated source references`);
}

export function evidenceAssessment(unit, sources, business) {
  const refs = sources.filter(s => unit.sourceIds.includes(s.id));
  const external = refs.filter(s => s.type !== "owned_page");
  const publishers = [...new Set(external.map(s => s.publisher))];
  const capabilities = business.capabilities.filter(c => unit.capabilityKeys.includes(c.key));
  return {
    serviceability: capabilities.some(c => c.status === "confirmed") ? "evidence_supported" : capabilities.some(c => c.status === "inferred") ? "inferred" : "not_verified",
    demand: unit.demandEvidence === "observed_question" ? "reported_question_needs_source_review" : publishers.length >= 2 ? "multiple_publisher_signals" : "plausible_inference",
    independentPublishers: publishers,
    sourceIds: refs.map(s => s.id),
    mentionLikelihood: null,
    probabilityCalibrated: false
  };
}

export function validateBusiness(business, sources, candidates = []) {
  const marketKeys = new Set();
  for (const market of business.markets) {
    if (marketKeys.has(market.key)) throw new Error(`Duplicate market key: ${market.key}`);
    marketKeys.add(market.key);
    requireReferences(market.sourceIds, sources, market.key);
    if (market.canonicalL3Id) {
      const candidate = candidates.find(c => (c.id || c.canonicalL3Id) === market.canonicalL3Id);
      if (!candidate || (candidate.objectType && candidate.objectType !== market.objectType)) throw new Error(`${market.key}: Canonical ID/type not present in supplied catalog`);
    }
  }
  const seen = new Set();
  for (const cap of business.capabilities) {
    requireReferences(cap.sourceIds, sources, cap.key);
    if (seen.has(cap.key)) throw new Error(`Duplicate capability key: ${cap.key}`);
    seen.add(cap.key);
    if (!marketKeys.has(cap.marketKey)) throw new Error(`${cap.key}: unknown market`);
    if (cap.status === "confirmed" && !sources.some(s => cap.sourceIds.includes(s.id) && s.type === "owned_page")) throw new Error(`${cap.key}: confirmed capability requires owned-page evidence`);
  }
  for (const country of business.monitoringCountries) requireReferences(country.sourceIds, sources, `country ${country.country}`);
}

export function validateUnits(units, surfaces, business, sources) {
  const errors = [], keys = new Set(), signatures = new Map();
  for (const unit of units) {
    if (keys.has(unit.key)) errors.push(`Duplicate intent key ${unit.key}`);
    keys.add(unit.key);
    const market = business.markets.find(m => m.key === unit.marketKey);
    const surface = surfaces.find(s => s.key === unit.surfaceKey);
    if (!market || !surface || surface.marketKey !== unit.marketKey) errors.push(`${unit.key}: invalid market or decision surface`);
    if (!INTENTS[unit.intent]?.includes(unit.subIntent) && !(unit.subIntent.startsWith("custom_") && unit.subIntentDefinition?.length >= 12)) errors.push(`${unit.key}: sub-intent needs a valid family or an explicit domain-specific definition`);
    try { requireReferences(unit.sourceIds, sources, unit.key); } catch (e) { errors.push(e.message); }
    const caps = unit.capabilityKeys.map(k => business.capabilities.find(c => c.key === k));
    if (caps.some(c => !c)) errors.push(`${unit.key}: unknown capability`);
    if (unit.scope === "brand_core" && !caps.some(c => c && ["confirmed", "inferred"].includes(c.status) && c.marketKey === unit.marketKey)) errors.push(`${unit.key}: core question has no supported current capability in this market`);
    if (unit.scope === "competitive_whitespace" && !sources.some(s => s.type === "competitor_page" && unit.sourceIds.includes(s.id))) errors.push(`${unit.key}: whitespace requires a retrieved competitor page`);
    if (unit.scope === "industry_benchmark" && !sources.some(s => s.type !== "owned_page" && unit.sourceIds.includes(s.id))) errors.push(`${unit.key}: benchmark cannot depend solely on the target website`);
    if (unit.benchmarkMember && (market?.relation === "adjacent" || unit.scope === "out_of_scope_reference" || unit.brandTermType !== "generic")) errors.push(`${unit.key}: adjacent, diagnostic or brand-led unit cannot be a generic category benchmark member`);
    if (unit.expectedEntityType === "method_or_concept" && unit.pool === "monitoring_core") errors.push(`${unit.key}: concept-only demand belongs in the content pool`);
    const signature = [unit.marketKey, unit.decisionObject, unit.buyerContext, unit.job, unit.constraint, unit.subIntent, unit.brandTermType].map(normalizeText).join("|");
    if (signatures.has(signature)) errors.push(`${unit.key}: same semantic unit as ${signatures.get(signature)}`);
    signatures.set(signature, unit.key);
  }
  if (errors.length) throw new Error(errors.join("; "));
}

export function validateClusters(topics, units, markets) {
  const errors = [], assigned = new Set(), topicKeys = new Set();
  for (const topic of topics) {
    if (topicKeys.has(topic.key)) errors.push(`Duplicate Topic key ${topic.key}`);
    topicKeys.add(topic.key);
    if (!markets.some(m => m.key === topic.marketKey)) errors.push(`${topic.key}: unknown market`);
    for (const key of topic.unitKeys) {
      const unit = units.find(u => u.key === key);
      if (!unit || unit.marketKey !== topic.marketKey) errors.push(`${topic.key}: invalid or cross-market unit ${key}`);
      if (assigned.has(key)) errors.push(`Unit ${key} assigned twice`);
      assigned.add(key);
    }
  }
  for (const unit of units) if (!assigned.has(unit.key)) errors.push(`Unit ${unit.key} has no Topic`);
  if (errors.length) throw new Error(errors.join("; "));
}

export function validatePromptBatch(rows, units, config, business, competitors = []) {
  const errors = [], seen = new Set();
  const own = [business.brandName, ...business.aliases, config.domain].filter(Boolean);
  const other = competitors.map(c => c.name);
  for (const row of rows) {
    const unit = units.find(u => u.key === row.unitKey);
    if (!unit) { errors.push(`Unknown prompt unit ${row.unitKey}`); continue; }
    if (seen.has(row.unitKey)) errors.push(`${row.unitKey}: duplicate canonical prompt`);
    seen.add(row.unitKey);
    if (row.language !== config.language) errors.push(`${row.unitKey}: language mismatch`);
    if (!termPresent(row.text, row.contextAnchor)) errors.push(`${row.unitKey}: context anchor must occur in question`);
    const text = [row.text, ...row.keywords].join(" ");
    const ownHit = own.some(t => termPresent(text, t)), otherHit = other.some(t => termPresent(text, t));
    if ((config.brandPromptMode === "exclude" || unit.brandTermType === "generic") && (ownHit || otherHit)) errors.push(`${row.unitKey}: blocked brand term`);
    if (config.brandPromptMode === "include" && otherHit) errors.push(`${row.unitKey}: competitor term not allowed`);
    if (unit.brandTermType === "branded" && !own.some(t => termPresent(row.text, t))) errors.push(`${row.unitKey}: branded prompt needs owned brand in question`);
    if (unit.brandTermType === "competitive" && !other.some(t => termPresent(row.text, t))) errors.push(`${row.unitKey}: competitive prompt needs researched competitor`);
    if (config.brandPromptMode === "brand_only" && unit.brandTermType !== "branded") errors.push(`${row.unitKey}: brand_only forbids other modes`);
  }
  for (const unit of units) if (!seen.has(unit.key)) errors.push(`Missing prompt for ${unit.key}`);
  if (errors.length) throw new Error(errors.join("; "));
}

export function validateArtifact(artifact) {
  const errors = [], warnings = [], units = artifact.intentRegistry || [];
  const check = fn => { try { fn(); } catch (e) { errors.push(e.message); } };
  if (artifact.schemaVersion !== "dageno.topic-prompt.v3") errors.push("Unsupported schema version");
  if (!units.length || !artifact.generatedTopics?.length) errors.push("Empty intent registry or Topics");
  check(() => validateSchema(businessSchema, artifact.businessResearch, "businessResearch"));
  check(() => validateBusiness(artifact.businessResearch, artifact.evidenceSources || [], artifact.canonicalCatalog || []));
  check(() => validateUnits(units, artifact.decisionSurfaces || [], artifact.businessResearch, artifact.evidenceSources || []));
  const rows = artifact.generatedTopics?.flatMap(t => t.prompts) || [];
  const rawRows = rows.map(p => ({ unitKey: units.find(u => u.intentUnitId === p.intentUnitId)?.key || "unknown", text: p.p, language: p.l, funnel: p.f, keywords: p.kw, contextAnchor: p.contextAnchor }));
  check(() => validateSchema(promptsSchema, { prompts: rawRows }, "artifact.prompts"));
  check(() => validatePromptBatch(rawRows, units.filter(u => rawRows.some(r => r.unitKey === u.key)), artifact.monitoringConfig, artifact.businessResearch, artifact.competitorMap || []));
  const ids = new Set(), texts = new Set();
  for (const row of rows) {
    const unit = units.find(u => u.intentUnitId === row.intentUnitId);
    if (!unit || row.scope !== unit.scope || row.pool !== unit.pool) errors.push(`Broken intent mapping: ${row.intentUnitId}`);
    if (unit && (row.pt !== unit.brandTermType || row.benchmarkMember !== unit.benchmarkMember)) errors.push(`Brand/benchmark metadata conflicts with unit: ${row.intentUnitId}`);
    if (row.metricUse !== METRICS[row.scope]) errors.push(`Invalid metric scope: ${row.intentUnitId}`);
    if (ids.has(row.intentUnitId)) errors.push(`Intent unit counted twice: ${row.intentUnitId}`);
    ids.add(row.intentUnitId);
    const text = normalizeText(row.p);
    if (texts.has(text)) errors.push(`Duplicate question: ${row.intentUnitId}`);
    texts.add(text);
    try { requireReferences(row.ev?.sourceIds, artifact.evidenceSources || [], row.intentUnitId); } catch (e) { errors.push(e.message); }
  }
  for (const unit of units) if (!ids.has(unit.intentUnitId) && !artifact.deferredUnits?.some(d => d.intentUnitId === unit.intentUnitId)) errors.push(`Silently lost unit: ${unit.intentUnitId}`);
  for (const topic of artifact.generatedTopics || []) for (const row of topic.prompts) {
    const unit = units.find(u => u.intentUnitId === row.intentUnitId);
    const market = artifact.businessResearch?.markets?.find(m => m.key === unit?.marketKey);
    if (!market || topic.marketAnchor?.objectType !== market.objectType || topic.marketAnchor?.canonicalL3Id !== market.canonicalL3Id) errors.push(`Topic market mismatch: ${topic.topic}`);
  }
  // Lexical similarity only raises review candidates. It never removes a question.
  const duplicateCandidates = [];
  for (let i = 0; i < rows.length; i++) for (let j = 0; j < i; j++) {
    if (lexicalSimilarity(rows[i].p, rows[j].p, artifact.monitoringConfig?.language) >= 0.82) duplicateCandidates.push([rows[i].intentUnitId, rows[j].intentUnitId]);
  }
  if (duplicateCandidates.length) warnings.push(`${duplicateCandidates.length} lexically similar pairs retained for semantic review, not automatically deduplicated`);
  if (!artifact.semanticReview?.passed || artifact.semanticReview.checkedUnits !== rows.length) errors.push("Independent semantic review is not complete");
  if (!artifact.coverageChallenge?.completed) errors.push("Independent gap review is not complete");
  if (artifact.businessResearch?.status !== "confirmed") warnings.push("Business interpretation is provisional");
  if (!artifact.evidenceSources?.some(s => s.type === "competitor_page")) warnings.push("No competitor page was retrieved");
  return { passed: errors.length === 0, errors, warnings, duplicateCandidates, summary: { topics: artifact.generatedTopics?.length || 0, prompts: rows.length, monitoringCore: rows.filter(r => r.pool === "monitoring_core").length, contentOpportunity: rows.filter(r => r.pool === "content_opportunity").length } };
}

export function panelDiff(current, previous) {
  if (!previous) return { status: "first_version", retained: [], wordingChanged: [], added: current.intentRegistry.map(u => u.intentUnitId), removed: [], comparability: "new_baseline" };
  if (previous.domain !== current.domain || previous.monitoringConfig?.language !== current.monitoringConfig.language || previous.monitoringConfig?.region !== current.monitoringConfig.region || previous.taxonomyVersion !== current.taxonomyVersion) return { status: "incompatible_previous_panel", comparability: "new_baseline_required" };
  const old = new Map(previous.generatedTopics?.flatMap(t => t.prompts.map(p => [p.intentUnitId, p.p])) || []);
  const now = new Map(current.generatedTopics.flatMap(t => t.prompts.map(p => [p.intentUnitId, p.p])));
  const retained = [], wordingChanged = [], added = [];
  for (const [id, text] of now) { if (!old.has(id)) added.push(id); else if (old.get(id) === text) retained.push(id); else wordingChanged.push(id); }
  return { status: "review_before_replacing_panel", retained, wordingChanged, added, removed: [...old.keys()].filter(id => !now.has(id)), comparability: added.length || wordingChanged.length || old.size !== now.size ? "report_common_panel_separately" : "same_panel" };
}
