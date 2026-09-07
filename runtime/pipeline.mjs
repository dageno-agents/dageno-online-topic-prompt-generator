import { VERSION, SCHEMA_VERSION, PRINCIPLES, INTENTS, METRICS, stableId, normalizeText, languageCode, regionCode, termPresent } from "./contract.mjs";
import { businessSchema, competitorSchema, surfaceSchema, unitsSchema, gapSchema, clustersSchema, promptsSchema, reviewSchema } from "./schemas.mjs";
import { validateSchema } from "./validate-schema.mjs";
import { createNetwork, crawlWebsite, searchWeb, parsePage, sourceFromPage, publicUrl } from "./research.mjs";
import { requireReferences, validateBusiness, validateUnits, validateClusters, validatePromptBatch, evidenceAssessment, validateArtifact, panelDiff } from "./qa.mjs";

const chunks = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
const uniqueSources = groups => [...new Map(groups.flat().map(s => [s.id, s])).values()];
const evidencePayload = sources => sources.map(s => ({ id: s.id, type: s.type, url: s.url, publisher: s.publisher, title: s.title, snippet: s.snippet.slice(0, 2200), retrievedAt: s.retrievedAt, excerpted: s.snippet.length > 2200 }));
const rowText = value => String(value ?? "").replace(/\|/g, " / ").replace(/\n/g, " ");

export async function generatePanel(input, deps) {
  const config = {
    startUrl: publicUrl(/^https?:/.test(input.domain) ? input.domain.replace(/^http:/, "https:") : `https://${input.domain}`),
    domain: new URL(publicUrl(/^https?:/.test(input.domain) ? input.domain.replace(/^http:/, "https:") : `https://${input.domain}`)).hostname,
    language: languageCode(input.outputLanguage || input.language || "en-US"), region: regionCode(input.market || "US"),
    brandPromptMode: input.brandPromptMode || (input.includeBrandTerms ? "include" : "exclude"),
    topicMode: input.topicMode === "manual" ? "manual" : "auto", promptMode: input.promptMode === "manual" ? "manual" : "auto"
  };
  if (!["exclude", "include", "mixed", "brand_only"].includes(config.brandPromptMode)) throw new Error("Invalid brand mode");
  for (const [mode, count] of [[config.topicMode, input.topicCount], [config.promptMode, input.promptCount]]) if (mode === "manual" && (!Number.isInteger(count) || count < 1)) throw new Error("Manual counts must be positive integers");
  const startedAt = new Date().toISOString(), stages = [], sources = [], researchLog = [];
  const network = deps.network || createNetwork({ maxRequests: input.researchBudget?.maxRequests || 220 });
  const crawl = deps.crawl || ((domain, options) => crawlWebsite(domain, network, options));
  const search = deps.search || ((queries, options) => searchWeb(queries, network, options));
  const emit = (stage, details = {}) => { stages.push({ stage, at: new Date().toISOString(), ...details }); deps.onProgress?.(stage, details); };
  let modelCalls = 0;
  async function ask(stage, instruction, payload, schema, extraCheck = () => {}, maxTokens = 10000) {
    let failure = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      if (++modelCalls > (input.researchBudget?.maxModelCalls || 100)) throw new Error(`Research model budget exhausted at ${stage}. Not complete; do not replace the monitoring panel.`);
      emit(stage, { attempt });
      deps.signal?.throwIfAborted();
      try {
        const result = await deps.model({ stage, system: PRINCIPLES, instruction: `${instruction}\nOperator explanations and rationales should be plain Chinese; Topic names and Prompt text use ${config.language}.\nPrevious validation error (repair without fabricating facts): ${failure || "none"}`, payload, schema, maxTokens });
        validateSchema(schema, result, stage); extraCheck(result); return result;
      } catch (e) { failure = e.message; if (attempt || deps.signal?.aborted) throw new Error(`${stage} failed after repair: ${failure}`); }
    }
  }
  const appendSources = newSources => { const all = uniqueSources([sources, newSources]); sources.splice(0, sources.length, ...all); };
  const runSearch = async queries => {
    const result = await search(queries, { region: config.region, language: config.language, limit: 18 });
    researchLog.push(...result.log); appendSources(result.signals); return result;
  };
  emit("crawl");
  const crawlResult = await crawl(config.startUrl, { maxPages: Math.max(12, Math.min(Number(input.crawlDepth || 6) * 4, 48)), maxSitemaps: 8 });
  appendSources(crawlResult.sources);
  const initialSearch = await runSearch([{ query: `${config.domain} company products services customers`, purpose: "business identity" }, { query: `${config.domain} reviews alternatives`, purpose: "independent identity" }]);
  if (!sources.some(s => s.type === "owned_page")) throw new Error("未获取到可验证的官网业务正文，已停止生成。请提供可访问的产品页面或网站导出，不能仅凭域名猜测。 ");
  const strategicContext = { businessGoal: input.businessGoal, priorityOffering: input.priorityOffering, idealCustomer: input.idealCustomer, excludedOfferings: input.excludedOfferings, businessContext: input.industry === "Auto detect" ? "" : input.industry };
  const candidates = input.canonicalL3Candidates || [];
  const businessPayload = () => ({ config, strategicContext, canonicalL3Candidates: candidates, taxonomyVersion: input.canonicalTaxonomyVersion || "unresolved", sources: evidencePayload(sources) });
  const businessInstruction = "Infer competing business hypotheses from the supplied fresh evidence. Identify current paying buyer, offer, constraints and economic center. Keep editorial content, roadmap and unsupported capabilities separate. Resolve each MATERIAL business line to a coherent L3 boundary; leave canonicalL3Id empty if no supplied catalog match. Produce diverse category, problem, comparison, price, risk, local market and competitor queries. Do not assume an address or English website proves the largest market. Country suggestions are recommendations with sources, not traffic facts. Use stable English machine keys. Only use URLs already observed in evidence for follow-up. A business hypothesis can be confirmed without a production L3 ID.";
  let business = await ask("business_hypotheses", businessInstruction, businessPayload(), businessSchema, b => validateBusiness(b, sources, candidates));
  emit("category_research");
  let demand = await runSearch(business.researchQueries);
  const firstCategory = business.businessCategory;
  const readPages = [];
  const competitorFailures = [];
  // Read independent pages, not only search snippets, before the second business pass.
  const urls = [...new Set([
    ...business.followupUrls.filter(u => crawlResult.discoveredUrls?.includes(u)),
    ...demand.signals.filter(s => !s.publisher.endsWith(config.domain.replace(/^www\./, ""))).map(s => s.url)
  ])];
  const hosts = new Map();
  for (const url of urls) {
    const host = new URL(url).hostname;
    if ((hosts.get(host) || 0) >= 2 || readPages.length >= 10) continue;
    hosts.set(host, (hosts.get(host) || 0) + 1);
    try {
      const res = deps.readPage ? await deps.readPage(url) : await network.get(url);
      const page = res.usable !== undefined ? res : parsePage(res.text, res.url);
      if (!page.usable) throw new Error("No readable page body");
      const own = new URL(page.url).hostname.replace(/^www\./, "") === config.domain.replace(/^www\./, "");
      const source = await sourceFromPage(page, own ? "owned_page" : "external_page");
      appendSources([source]); readPages.push(page);
    } catch (e) { competitorFailures.push({ url, reason: e.message }); }
  }
  business = await ask("business_disconfirmation", `${businessInstruction}\nIndependently TEST the first hypothesis against later research. Explicitly reject incorrect interpretations; do not preserve the first answer for consistency. If evidence does not resolve the offer or paying buyer, set needs_confirmation.`, { ...businessPayload(), priorHypotheses: business.hypotheses }, businessSchema, b => validateBusiness(b, sources, candidates));
  if (business.status === "needs_confirmation") throw new Error(`业务边界仍不清晰，已停止正式生成：${business.missingContext.join("；") || business.hypotheses.map(h => h.unresolved.join("；")).join("；")}`);
  if (normalizeText(firstCategory) !== normalizeText(business.businessCategory)) {
    const queries = business.researchQueries.filter(q => !researchLog.some(l => l.query === q.query));
    if (queries.length) {
      const revised = await runSearch(queries);
      demand = { ...revised, signals: [...demand.signals, ...revised.signals] };
    }
  }
  if (deps.researchOnly) return {
    schemaVersion: "dageno.business-research.v3", skillVersion: VERSION, domain: config.domain,
    generationStatus: { mode: "research_only", isFallback: false, status: business.status },
    businessResearch: business, evidenceSources: sources,
    crawlReport: { effectivePages: crawlResult.pages.length, attempted: crawlResult.attempted, failures: crawlResult.failures, remainingUrls: crawlResult.remainingUrls, families: crawlResult.families },
    researchTrace: { model: deps.modelId, businessPasses: 2, modelCalls, searchLog: researchLog, stages },
    warning: "仅业务识别验证，未执行 Topic/Prompt 或语义完整性检验。"
  };
  const competitorResult = await ask("competitor_research", "Classify evidenced competitors by business line and same-L3, adjacent, substitute or source-only. Only name an actual provider when the supplied page supports that identification. A comparison article is a source competitor, not the vendors it merely lists. URL must be an observed source URL. Do not invent global lists, traffic, visibility or rankings.", { business, config, sources: evidencePayload(sources) }, competitorSchema, data => {
    for (const c of data.competitors) { requireReferences(c.sourceIds, sources, c.name); if (!sources.some(s => s.url === c.url)) throw new Error(`Unobserved competitor URL: ${c.url}`); if (!business.markets.some(m => m.key === c.marketKey)) throw new Error("Unknown competitor market"); }
  });
  // Provider pages become competitor evidence only after their role is classified.
  for (const c of competitorResult.competitors.filter(c => ["same_l3", "adjacent_l3", "substitute"].includes(c.relation))) {
    for (const source of sources) if (c.sourceIds.includes(source.id) && source.type === "external_page" && new URL(source.url).hostname === new URL(c.url).hostname) source.type = "competitor_page";
  }
  const surfaces = [], surfaceExclusions = [], unresolved = [];
  for (const market of business.markets) {
    const result = await ask("decision_surfaces", "Map material buyer decisions independently from the target brand's strengths. Include product/category choices, jobs, constraints, commercial terms, trust, implementation and post-purchase when relevant. Surfaces are not automatically Topics. No fixed surface count. Avoid a Cartesian product. Explain exclusions and missing evidence. Only this marketKey is allowed.", { market, business, competitors: competitorResult.competitors, intentOntology: INTENTS, config, sources: evidencePayload(sources) }, surfaceSchema, data => {
      for (const s of data.surfaces) { if (s.marketKey !== market.key) throw new Error("Cross-market decision surface"); requireReferences(s.sourceIds, sources, s.key); }
    });
    surfaces.push(...result.surfaces); surfaceExclusions.push(...result.exclusions); unresolved.push(...result.unresolved);
  }
  if (new Set(surfaces.map(s => s.key)).size !== surfaces.length) throw new Error("Decision surface keys are not globally unique");
  let units = [], intentExclusions = [];
  async function enumerate(selectedSurfaces) {
    for (const group of chunks(selectedSurfaces, 3)) {
      let more = true;
      while (more) {
        const result = await ask("intent_enumeration", "Enumerate every applicable concrete intent for these surfaces before Topic clustering. Output up to 24 NEW units per transport batch; set more=true if applicable decisions remain. This is a batch size, not a total limit. Do not repeat keys or paraphrase covered units. Fields decisionObject, buyerContext, job, constraint and keys use stable English semantics independent of output language. Separate brand_core from independent benchmark and whitespace. Use only eligible brand modes. benchmarkMember can be true for generic brand_core as well as benchmark units, but never branded/local-adjacent/diagnostic demand. Do not infer actual query frequency from snippets. Include knowledge demand in content pool. Include locationMode for genuinely local or legal constraints.", { surfaces: group, business, config, intentOntology: INTENTS, competitors: competitorResult.competitors, existingUnits: units, sources: evidencePayload(sources) }, unitsSchema, data => {
          if (data.more && !data.units.length) throw new Error("Pagination made no progress");
          if (data.units.some(u => !group.some(s => s.key === u.surfaceKey))) throw new Error("Unit outside requested surfaces");
          validateUnits([...units, ...data.units], surfaces, business, sources);
          if (data.units.some(u => config.brandPromptMode === "exclude" && u.brandTermType !== "generic" || config.brandPromptMode === "brand_only" && u.brandTermType !== "branded" || config.brandPromptMode === "include" && u.brandTermType === "competitive")) throw new Error("Unit brand mode violates requested mode");
        }, 14000);
        units.push(...result.units); intentExclusions.push(...result.exclusions); more = result.more;
      }
    }
  }
  await enumerate(surfaces);
  emit("independent_gap_review");
  let gapReview = { completed: false, additions: 0, concerns: [] };
  for (let pass = 0; pass < 2; pass++) {
    const gaps = await ask("coverage_challenger", "Act as an independent category researcher, NOT the generator. Audit the current inventory against original evidence and competitor capabilities. Find omitted buying stages, product lines, audiences, failure risks, alternatives and content demand; identify duplicate intent units. Missing units must be material and evidenced, not mechanical permutations. Return empty arrays when no evidenced gaps remain. Do not declare internet-wide completeness. New surfaces need globally unique keys. Duplicates must be truly interchangeable decisions, not merely similar wording.", { business, config, intentOntology: INTENTS, surfaces, units, competitors: competitorResult.competitors, sources: evidencePayload(sources) }, gapSchema, data => {
      for (const surface of data.missingSurfaces) { requireReferences(surface.sourceIds, sources, surface.key); if (surfaces.some(s => s.key === surface.key)) throw new Error("New surface reuses existing key"); }
      for (const d of data.duplicateUnits) if (d.keepKey === d.removeKey || !units.some(u => u.key === d.keepKey) || !units.some(u => u.key === d.removeKey)) throw new Error("Invalid duplicate references");
    });
    gapReview.concerns.push(...gaps.concerns);
    const removal = new Set(gaps.duplicateUnits.map(d => d.removeKey));
    if (gaps.duplicateUnits.some(d => removal.has(d.keepKey))) throw new Error("Duplicate review contains a cyclic merge");
    units = units.filter(u => !removal.has(u.key));
    surfaces.push(...gaps.missingSurfaces);
    validateUnits([...units, ...gaps.missingUnits], surfaces, business, sources);
    units.push(...gaps.missingUnits);
    gapReview.additions += gaps.missingUnits.length + gaps.missingSurfaces.length;
    if (!gaps.missingUnits.length && !gaps.missingSurfaces.length) { gapReview.completed = true; break; }
    if (gaps.missingSurfaces.length) await enumerate(gaps.missingSurfaces);
  }
  if (!gapReview.completed) { gapReview.completed = true; gapReview.concerns.push("独立复核仍发现新增需求，当前为已研究范围的扩展版，需继续调研后再声称范围稳定。"); gapReview.saturated = false; } else gapReview.saturated = true;
  const topics = [];
  for (const market of business.markets) {
    const marketUnits = units.filter(u => u.marketKey === market.key);
    if (!marketUnits.length) continue;
    const result = await ask("topic_clustering", "Cluster ALL supplied intent units into coherent Topics sharing decision object, core job and compatible buyer context. Keep subcategory distinctions when candidate/provider sets or required proof differ. A Topic can span funnel stages. Topic name uses output language. No topic count target. Every supplied unit appears exactly once; no new units and no cross-market Topics. Return concise plain Chinese rationale.", { config, market, units: marketUnits }, clustersSchema, data => validateClusters(data.topics, marketUnits, [market]));
    topics.push(...result.topics);
  }
  validateClusters(topics, units, business.markets);
  const rank = p => ({ High: 0, Medium: 1, Low: 2 }[p] ?? 2);
  const selectedTopics = config.topicMode === "manual" ? [...topics].sort((a, b) => rank(a.priority) - rank(b.priority)).slice(0, input.topicCount) : topics;
  const selectedKeys = new Set();
  for (const topic of selectedTopics) {
    const topicUnits = units.filter(u => topic.unitKeys.includes(u.key)).sort((a, b) => rank(a.priority) - rank(b.priority));
    for (const unit of config.promptMode === "manual" ? topicUnits.slice(0, input.promptCount) : topicUnits) selectedKeys.add(unit.key);
  }
  const selectedUnits = units.filter(u => selectedKeys.has(u.key));
  const prompts = [];
  let semanticReview = { passed: true, checkedUnits: 0, repairedBatches: 0, method: "independent_model_review_plus_deterministic_checks" };
  for (const batch of chunks(selectedUnits, 12)) {
    let repairIssues = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await ask("prompt_generation", "Write exactly one natural standalone question per supplied intent unit. The question must preserve the decision, use-case and constraint, not merely include best/top. Use the requested language and local wording. No target or competitor names in generic units. Do not put country words in ip_only units, but preserve legitimate explicit_local_constraint. contextAnchor is a short exact phrase in the question that disambiguates the category. Do not force identical syntax or length. Do not answer questions. Resolve listed review issues without dropping units.", { config, business: { brandName: business.brandName, aliases: business.aliases }, competitors: competitorResult.competitors.map(c => c.name), units: batch, repairIssues }, promptsSchema, data => validatePromptBatch(data.prompts, batch, config, business, competitorResult.competitors), 10000);
      const review = await ask("semantic_review", "Independently review EVERY supplied question in its original language against its intent unit and business/market evidence. Do not approve because it is fluent. Check wrong-industry meaning, subtle negations, naturalness, scope/brand leakage, language, context, unsupported constraints and compound questions. Similar language is not duplicate unless intent is interchangeable. Compare prior questions for cross-Topic duplicates. checkedUnitKeys must list every unit reviewed. Return issues, not rewritten questions.", { config, business, units: batch, prompts: result.prompts, priorQuestions: prompts.map(p => ({ unitKey: p.unitKey, text: p.text })), sources: evidencePayload(sources.filter(s => batch.some(u => u.sourceIds.includes(s.id)))) }, reviewSchema, data => {
        if (new Set(data.checkedUnitKeys).size !== batch.length || batch.some(u => !data.checkedUnitKeys.includes(u.key))) throw new Error("Semantic review did not cover every unit");
        if (data.issues.some(i => !batch.some(u => u.key === i.unitKey))) throw new Error("Review issue points outside the batch");
      }, 6000);
      if (!review.issues.length) { prompts.push(...result.prompts); semanticReview.checkedUnits += batch.length; break; }
      if (attempt) throw new Error(`语义复核未通过：${review.issues.map(i => `${i.unitKey}: ${i.reason}`).join("；")}`);
      repairIssues = review.issues; semanticReview.repairedBatches++;
    }
  }
  const marketAnchors = new Map();
  for (const market of business.markets) marketAnchors.set(market.key, { assignmentId: await stableId("market", [market.objectType, market.canonicalL3Id || normalizeText(market.name)]), canonicalL3Id: market.canonicalL3Id, canonicalL3Name: market.canonicalL3Id ? market.name : "", proposedL3Name: market.canonicalL3Id ? "" : market.name, taxonomyStatus: market.canonicalL3Id ? "confirmed" : "provisional", objectType: market.objectType, marketRelation: market.relation === "adjacent" ? "adjacent_l3" : "same_l3" });
  for (const unit of units) {
    const market = marketAnchors.get(unit.marketKey);
    unit.intentUnitId = await stableId("intent", [market.assignmentId, ...[unit.decisionObject, unit.buyerContext, unit.job, unit.constraint, unit.subIntent, unit.brandTermType].map(normalizeText)]);
    unit.evidenceAssessment = evidenceAssessment(unit, sources, business);
  }
  const industryEvidenceAdequate = sources.some(s => s.type === "competitor_page") && new Set(sources.filter(s => s.type !== "owned_page").map(s => s.publisher)).size >= 2;
  if (!industryEvidenceAdequate) gapReview.concerns.push("外部行业证据不足：当前清单仍是暂定范围，不能视为完整行业基准。");
  const artifact = {
    schemaVersion: SCHEMA_VERSION, skillVersion: VERSION, domain: config.domain, startedAt, generatedAt: new Date().toISOString(),
    taxonomyVersion: input.canonicalTaxonomyVersion || "unresolved", canonicalCatalog: candidates, monitoringConfig: { ...config, regionMode: input.regionMode || "ip_controlled", model: input.models || "not_selected", generationModel: deps.modelId, generationIsMonitoring: false },
    businessResearch: business, decisionSurfaces: surfaces, intentRegistry: units,
    exclusions: { surfaces: surfaceExclusions, subIntents: intentExclusions },
    deferredUnits: units.filter(u => !selectedKeys.has(u.key)).map(u => ({ intentUnitId: u.intentUnitId, reason: "manual_budget", unitKey: u.key })),
    coverageChallenge: gapReview, semanticReview, entityPilot: { status: "not_run", reason: "生成模型不代表监控平台；尚未执行实体触发抽测，不输出提及概率。" },
    evidenceSources: sources, generatedTopics: [],
    competitorMap: competitorResult.competitors.map(c => ({ name: c.name, domain: new URL(c.url).hostname, url: c.url, marketRelation: c.relation, marketAssignmentId: marketAnchors.get(c.marketKey)?.assignmentId, overlapReason: c.overlap, differentiationAngle: c.differences, evidenceSourceIds: c.sourceIds })),
    researchTrace: { skillVersion: VERSION, modelProvider: "openrouter", model: deps.modelId, brandIntelligenceCompleted: true, businessPasses: 2, universalSearchResults: initialSearch.signals.length, categoryDemandResults: demand.signals.length, competitorResults: competitorResult.competitors.length, modelCalls, stages, searchLog: researchLog, networkRequests: network.trace, warnings: [...unresolved, ...gapReview.concerns, ...competitorResult.gaps] },
    crawlReport: { attempted: crawlResult.attempted, effectivePages: crawlResult.pages.length, searchQuery: researchLog.map(r => r.query).join("\n"), inventoryCount: crawlResult.discoveredUrls?.length || 0, remainingUrls: crawlResult.remainingUrls, remainingSitemaps: crawlResult.remainingSitemaps, families: crawlResult.families, budgetLimited: crawlResult.budgetLimited, failures: [...crawlResult.failures, ...competitorFailures] },
    pages: [...crawlResult.pages, ...readPages].map(p => ({ url: p.url, title: p.title, meta: p.meta, headings: p.headings })),
    externalSignals: initialSearch.signals, categoryDemandSignals: demand.signals
  };
  for (const topic of selectedTopics) {
    const topicUnits = units.filter(u => topic.unitKeys.includes(u.key) && selectedKeys.has(u.key));
    const anchor = marketAnchors.get(topic.marketKey);
    const topicPrompts = [];
    for (const unit of topicUnits) {
      const row = prompts.find(p => p.unitKey === unit.key);
      topicPrompts.push({ p: row.text, l: row.language, pt: unit.brandTermType, it: unit.intent, subIntent: unit.subIntent, subIntentDefinition: unit.subIntentDefinition, intentUnitId: unit.intentUnitId, variantPurpose: "canonical", variantSetId: unit.intentUnitId, expectedEntityType: unit.expectedEntityType, f: row.funnel, journeyStage: unit.journeyStage, kw: row.keywords, pool: unit.pool, scope: unit.scope, benchmarkMember: unit.benchmarkMember, benchmarkStatus: anchor.taxonomyStatus, metricUse: METRICS[unit.scope], serviceabilityStatus: unit.evidenceAssessment.serviceability, contextAnchor: row.contextAnchor, ev: { sourceIds: unit.sourceIds, demandReason: unit.demandReason }, evidenceAssessment: unit.evidenceAssessment });
    }
    artifact.generatedTopics.push({ id: await stableId("topic", [anchor.assignmentId, normalizeText(topic.decisionObject), normalizeText(topic.job)]), topic: topic.name, ty: topic.type, f: topic.priority, pc: topicPrompts.length, rationale: topic.rationale, marketAnchor: anchor, prompts: topicPrompts });
  }
  artifact.versionDiff = panelDiff(artifact, input.previousPanel);
  artifact.coverageReport = [{ denominator: "已调研并经独立复核的意图清单，不代表全部互联网搜索需求", knownUnits: units.length, coveredUnits: prompts.length, deferredUnits: artifact.deferredUnits.length, coverageRate: units.length ? Math.round(prompts.length / units.length * 100) : null, researchSaturated: gapReview.saturated, researchLimited: crawlResult.budgetLimited, industryEvidenceAdequate, unknownDemand: true }];
  artifact.intentCoverageReport = artifact.generatedTopics.map(t => ({ topic: t.topic, coveredIntentUnits: t.prompts.map(p => p.intentUnitId), coveredSubIntents: [...new Set(t.prompts.map(p => p.subIntent))] }));
  artifact.qaReport = validateArtifact(artifact);
  if (!artifact.qaReport.passed) throw new Error(`Final QA failed: ${artifact.qaReport.errors.join("; ")}`);
  artifact.outputCounts = { topics: artifact.generatedTopics.length, prompts: prompts.length };
  artifact.generationStatus = { mode: "evidence_panel_v3", isFallback: false, status: artifact.deferredUnits.length || business.status !== "confirmed" || !gapReview.saturated || !industryEvidenceAdequate ? "provisional" : "completed_within_researched_scope", error: "" };
  artifact.industry = business.industryLabel;
  artifact.topicPlanning = { mode: config.topicMode, selectedTopicCount: artifact.generatedTopics.length, detectedSignals: business.capabilities.map(c => c.offering) };
  artifact.brandIntelligence = {
    brandName: business.brandName, businessCategory: business.businessCategory, industryLabel: business.industryLabel, businessModel: business.businessModel,
    economicCenter: business.economicCenter, primaryDecisionObject: business.markets.map(m => m.name).join(" / "), primaryPayingBuyer: business.payingBuyer, businessLines: business.markets.map(m => m.businessLine),
    coreOfferings: business.capabilities.filter(c => ["confirmed", "inferred"].includes(c.status)).map(c => c.offering), targetUsers: [...new Set(business.capabilities.map(c => c.buyer))], jobsToBeDone: [...new Set(business.capabilities.map(c => c.job))],
    researchDecision: { status: business.status, missingContext: business.missingContext },
    canonicalMarketAssignments: business.markets.map(m => ({ ...marketAnchors.get(m.key), businessLine: m.businessLine, decision: m.canonicalL3Id ? "REUSE_SEMANTIC" : "NEEDS_HUMAN_REVIEW", reason: m.definition })),
    monitoringCountryRecommendations: business.monitoringCountries.map(c => ({ country: c.country, reason: c.reason, promptRegionPolicy: "IP 控制通用市场；本地服务与法规约束单独配置" })), warnings: artifact.researchTrace.warnings
  };
  artifact.content = renderPanel(artifact);
  emit("complete", artifact.outputCounts);
  return artifact;
}

export function renderPanel(a) {
  const report = a.coverageReport[0];
  return `# ${a.businessResearch.brandName} Topic 与 Prompt 方案\n\n目标网站：${a.domain}\n监控国家：${a.monitoringConfig.region}\n输出语言：${a.monitoringConfig.language}\nSkill 版本：${a.skillVersion}\n\n## 业务判断\n\n${a.businessResearch.economicCenter}\n\n主要付费客户：${a.businessResearch.payingBuyer}\n\n## 调研与覆盖范围\n\n读取官网 ${a.crawlReport.effectivePages} 页，执行 ${a.researchTrace.searchLog.length} 条搜索，识别 ${a.competitorMap.length} 个竞品或替代来源。完成两轮业务判断和独立遗漏复核。\n\n已研究 ${report.knownUnits} 个意图，生成 ${report.coveredUnits} 条问题，预算暂缓 ${report.deferredUnits} 个意图。这是已研究清单的覆盖情况，不代表全行业真实搜索量或互联网全部需求。\n\n${a.researchTrace.warnings.map(w => `- ${w}`).join("\n")}\n\n## 监控国家建议\n\n${a.businessResearch.monitoringCountries.map(c => `- ${c.country}：${c.reason}`).join("\n")}\n\n## 竞争情况\n\n${a.competitorMap.map(c => `- ${c.name}：${c.overlapReason}；${c.differentiationAngle}`).join("\n")}\n\n${a.generatedTopics.map((t, i) => `## Topic ${i + 1}: ${t.topic}\n\n设计原因：${t.rationale}\n\n| 序号 | 监控问题 | 主意图 | 细分意图 | 购买阶段 | 用途 | 覆盖范围 |\n|---:|---|---|---|---|---|---|\n${t.prompts.map((p, j) => `| ${j + 1} | ${rowText(p.p)} | ${p.it} | ${p.subIntent} | ${p.f} | ${p.pool} | ${p.scope} |`).join("\n")}`).join("\n\n")}\n\n## 数据口径\n\n核心能力表现和同品类基准分开统计；行业基准包含 benchmarkMember=true 的核心能力问题，不是只统计品牌不会做的问题。措辞变体不得重复计权。生成的问题是研究设计，不是观测到的真实用户查询；尚未执行实体提及抽测，不把模型评分当成概率。\n`;
}
