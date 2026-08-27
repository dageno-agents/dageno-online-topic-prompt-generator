# Live Online Flow

This file records the live GEO Sales Workbench Topic/Prompt flow.

## API Flow

`POST /api/prompts`

Input body:

```json
{
  "domain": "https://example.com",
  "market": "United States / North America",
  "industry": "Auto detect",
  "businessGoal": "optional strategic goal",
  "priorityOffering": "optional priority offer or revenue line",
  "idealCustomer": "optional paying customer",
  "excludedOfferings": "optional explicit exclusions",
  "outputLanguage": "English",
  "models": "ChatGPT / Perplexity",
  "regionMode": "由 Dageno 地区/IP 设置控制",
  "topicMode": "auto",
  "topicCount": null,
  "promptMode": "auto",
  "promptCount": null,
  "crawlDepth": 6,
  "brandPromptMode": "exclude",
  "includeBrandTerms": false,
  "targetCountries": ["United States"],
  "businessLines": [],
  "canonicalL3Candidates": [],
  "canonicalTaxonomyVersion": "optional current version",
  "openrouterApiKey": "",
  "llmModel": "openai/gpt-5.6-sol"
}
```

`includeBrandTerms` is a legacy boolean. If `brandPromptMode` is absent and `includeBrandTerms=true`, treat it as `brandPromptMode=include`. `promptCount` is a final count only when `promptMode=manual`; in auto mode the coverage engine determines prompt counts per Topic.

Output:

```json
{
  "domain": "example.com",
  "industry": "detected-industry-or-generic",
  "topicPlanning": {
    "mode": "auto",
    "selectedTopicCount": 6,
    "detectedSignals": []
  },
  "crawlReport": {
    "attempted": [],
    "effectivePages": 0,
    "searchQuery": ""
  },
  "generationStatus": {
    "mode": "optimized_skill",
    "isFallback": false,
    "error": ""
  },
  "pages": [],
  "externalSignals": [],
  "categoryDemandSignals": [],
  "competitorMap": [],
  "evidenceSources": [],
  "brandIntelligence": {
    "capabilityLedger": [],
    "canonicalMarketAssignments": [],
    "canonicalResolverMode": "catalog|provisional",
    "intentCoveragePlan": {},
    "researchDecision": {}
  },
  "qaReport": {
    "passed": true,
    "errors": [],
    "warnings": []
  },
  "coverageReport": [],
  "intentCoverageReport": {
    "ontologyVersion": "2.0",
    "materialIntentUnits": 0,
    "coveredCanonicalUnits": 0,
    "wordingVariants": 0,
    "coverageRate": 0,
    "byScope": {},
    "byTopic": {},
    "bySubIntent": {},
    "blindSpots": []
  },
  "outputCounts": {"topics": 6, "prompts": 54},
  "content": "Markdown Topic/Prompt output"
}
```

## Model Configuration

The hosted live flow uses `OPENROUTER_API_KEY` from the server environment and the operator-selected `llmModel`. Validate the selected model with a real minimal request before customer research. Do not expose keys to the client, silently switch models, or route directly to Anthropic/OpenAI endpoints.

## Brand Intelligence JSON

Before Topic generation, call a model with website crawl evidence and external search evidence. Return strict JSON:

```json
{
  "brandName": "canonical brand name",
  "businessCategory": "plain-English category, not a fixed enum",
  "industryLabel": "short Chinese industry label suitable for UI",
  "businessModel": "B2B SaaS / DTC ecommerce / local service / marketplace / media / professional service / game / other",
  "businessArchetypes": ["one or more evidence-backed archetypes from references/intent-ontology.md, assigned per business line"],
  "confidence": 0,
  "coreOfferings": ["specific products/services the site sells or promotes"],
  "targetUsers": ["specific buyers/users"],
  "jobsToBeDone": ["real user jobs and use cases"],
  "decisionCriteria": ["criteria buyers compare before choosing"],
  "targetCountries": ["countries or markets supported or inferred from evidence"],
  "businessLines": ["specific product/service lines"],
  "canonicalMarketAssignments": [
    {
      "assignmentId": "market_001",
      "businessLineId": "line_001",
      "businessLine": "specific product/service line",
      "canonicalL3Id": "existing ID from supplied catalog or empty",
      "canonicalL3Name": "existing Canonical label or empty",
      "proposedL3Name": "provisional market name when unresolved",
      "objectType": "product|software|provider_service|organization_industry",
      "relation": "primary|secondary|adjacent|candidate_needs_review",
      "decision": "REUSE_EXACT|REUSE_SEMANTIC|KEEP_NEW_L3|HIERARCHY_ONLY|DECOMPOSE|REJECT_NOT_MARKET_IDENTITY|REJECT_ATTRIBUTE_OR_USECASE|REJECT_SOURCE_OVERLAP|NEEDS_HUMAN_REVIEW",
      "taxonomyStatus": "confirmed|provisional|needs_human_review",
      "granularityRelation": "EQUIVALENT|BROADER|NARROWER|DISTINCT|COMPOSITE|INVALID",
      "definition": "20-60 word retrieval-oriented market definition",
      "boundaryExclusions": [],
      "comparableSet": [],
      "evidenceSourceIds": [],
      "confidence": 0.0,
      "reviewRequired": true,
      "reason": ""
    }
  ],
  "canonicalTaxonomyVersion": "supplied version or unresolved",
  "canonicalResolverMode": "catalog|provisional",
  "differentiators": ["specific advantages, tradeoffs, or positioning angles supported by evidence"],
  "outOfScope": ["features, markets, claims, or segments not supported by evidence"],
  "competitors": ["competitors, alternatives, substitute providers, platforms, directories, or comparison sources"],
  "searchQueries": ["5-8 search queries that would find more competitors/reviews/category context"],
  "categoryDemandQueries": ["5-12 non-branded category demand queries for best/review/pricing/alternative/integration/community"],
  "capabilityLedger": [],
  "intentCoveragePlan": {},
  "researchDecision": {},
  "topicSeeds": ["4-10 high-value GEO topic clusters based on real buyer questions"],
  "suggestedTopicCount": 3,
  "evidenceSources": [],
  "evidence": ["short evidence notes from crawl/search"],
  "warnings": ["uncertainties or missing evidence"]
}
```

Important model instructions:

- Use only the provided website crawl and search evidence.
- If crawl evidence is weak, use domain name and external search results, but lower confidence.
- Do not force the site into SaaS, VPS, web scraping, AI PPT, or any pre-existing category unless evidence proves it.
- Before choosing topics, identify the brand's economic center of gravity: what buyers are really purchasing. It may be a product/SKU, a workflow, a service outcome, risk reduction, supply-chain simplification, project delivery, or replacement of multiple vendors.
- Many customer websites are poorly planned, over-broad, under-written, or internally inconsistent. Do not assume the navigation structure equals the real business strategy. Compare owned-page crawl evidence, external search evidence, category demand language, monetization cues, buyer roles, and repeated decision criteria.
- If the site could plausibly mean several things, output 2-4 business hypotheses with confidence, evidence, risk, and Topic implications. Core Topics should follow the highest-confidence hypothesis; medium-confidence hypotheses may contribute one exploratory Topic when commercially important; low-confidence hypotheses should remain warnings/content gaps.
- If evidence shows broad catalogs, multi-category products, wholesale, procurement, sourcing, suppliers, manufacturers, OEM/ODM/private label, custom logo or packaging, MOQ, sample approval, factory verification, QC, lead time, payment terms, consolidated shipping, total landed cost, project opening/renovation purchasing, OS&E/FF&E, or China sourcing, treat it as a one-stop procurement / sourcing / supplier-integration model when appropriate.
- For procurement/sourcing businesses, topic seeds should follow the buyer decision chain: one-stop procurement, category bundles or replenishment packages, project/opening checklists, custom branding/OEM, supplier quality/factory verification, and cost/MOQ/lead time/consolidated shipping. Do not fragment the strategy into isolated SKU topics unless a SKU category is a trust entry point, recurring purchase bundle, or project package.
- Topic seeds must reflect real user/business scenarios, not generic product labels.
- Differentiators must be concrete enough to guide competitor and prompt design.
- Build the Capability Ledger and applicable intent universe from `references/coverage-engine.md` before Topic generation.
- Read `references/canonical-l3-market-boundary.md`. Resolve every material business line before category-demand and competitor research. Only IDs present in supplied `canonicalL3Candidates` may be confirmed; otherwise leave the ID empty and require human review.
- Read `references/intent-ontology.md`; enumerate sub-intents and intent units for each business line before clustering Topics. Do not treat broad intent-family presence as complete coverage.
- Build the competitive decision-surface map before Topic planning. `suggestedTopicCount` must equal the complete non-overlapping Topic set needed to cover all material serviceable surfaces; it is not an industry default and must not use 10 as an automatic ceiling.
- For local services, topic seeds should reflect location, booking, price, reviews, service menu, and trust.
- For ecommerce, topic seeds should reflect product selection, comparison, use cases, price, reviews, safety, and alternatives.
- For B2B tools, topic seeds should reflect vendor selection, workflow fit, integrations, pricing, risks, competitors, and implementation.

## Category Demand Search

Run category demand search after initial brand intelligence has identified category, personas, jobs-to-be-done, countries, business lines, and Canonical L3 market assignments.

Use confirmed same-L3 demand for the formal industry benchmark. If the L3 assignment is provisional, keep the benchmark project-local and mark it provisional. Route adjacent-L3 demand to whitespace or out-of-scope.

Use `references/category-demand-search.md` for query families and normalized result schema. The online service may plug in any web search provider; do not assume Codex/browser tools.

Store normalized results in `categoryDemandSignals` and convert useful crawl/search/model observations into `evidenceSources`.

## Competitor Model Prompt

System:

```text
You are executing the Dageno Competitor Generation Skill exactly. Output only strict JSON.
```

User payload:

```text
currentDate: YYYY-MM-DD
websiteURL: [domain]
targetCountries: [countries]
businessLines: [business lines]
brandPromptMode: exclude|include|mixed|brand_only

Brand Intelligence:
[brand intelligence JSON]

Canonical Market Assignments:
[canonicalMarketAssignments]

Category Demand Signals:
[normalized search results]

Evidence Sources:
[evidenceSources]

Return the competitorMap schema from references/competitor-generation.md.
```

Rules:

- Generate competitors by country and business line, not only a global list.
- Include same-L3 direct, adjacent-L3, substitute, marketplace/directory, and source competitors when relevant.
- Explain overlap and differentiation angle for each competitor.
- Do not invent competitors without evidence. Use lower confidence and warnings when evidence is weak.

## Topic Model Prompt

System:

```text
You are executing the GEO Topic Skill exactly. Follow the skill, brand research, and content compression rules. Output only strict JSON.
```

User payload:

```text
currentDate: YYYY-MM-DD
langCode: en-US
topicCountMode: auto|manual
topicCount: [manual count or AUTO]
websiteURL: [domain]
brandPromptMode: exclude|include|mixed|brand_only

The brand research step has been completed from crawling and search evidence. Use this summary as the brandSummary:

[brand research summary]

Category Demand Signals:
[categoryDemandSignals]

Competitor Map:
[competitorMap]

Evidence Sources:
[evidenceSources]

Canonical Market Assignments:
[canonicalMarketAssignments]

Return Topics with `marketAnchor`, `pc`, `cv.businessArchetypes`, `cv.applicableSubIntents`, market-aware `cv.cells`, explicit exclusions, and `ev` using the schema in `references/geo-topic-generate.md`.
```

## Prompt Model Prompt

System:

```text
You are executing the GEO Prompt Skill exactly. Follow every prompt rule and keyword rule. Output only strict JSON.
```

User payload:

```text
currentDate: YYYY-MM-DD
langCode: en-US
websiteURL: [domain]
PromptCountMode: auto|manual
TotalPromptsPerTopic: [manual final count or per-Topic coverage-derived target]
brandPromptMode: exclude|include|mixed|brand_only
brandPromptRatio: 0.3

Brand Context / Summary:
[brand research summary]

Category Demand Signals:
[categoryDemandSignals]

Competitor Map:
[competitorMap]

Evidence Sources:
[evidenceSources]

Topics to generate. Use every topic exactly once and do not add extra topics:
[{"t":"Topic","ty":"use_case","f":"High","c":95,"pc":8,"marketAnchor":{},"cv":{"cells":[]}}]
```

Rules:

- In auto mode, select prompts by marginal coverage and stop when all High-priority cells are covered. In manual mode, use the requested number as the final target without fixed expansions.
- Every Prompt must include `subIntent`, `intentUnitId`, `variantPurpose`, `variantSetId`, and `expectedEntityType` from `references/intent-ontology.md`.
- Generate exactly one canonical Prompt per intent unit. Add at most two wording variants only when justified by real phrasing evidence or retrieval sensitivity. Aggregate variants to one intent unit in reporting.
- If the complete ontology exceeds one response or UI page, paginate Topics/Prompts. Never treat a runtime batch size as an industry coverage ceiling.
- Every prompt must include `pool`, `scope`, `metricUse`, `serviceabilityStatus`, `competitorEvidenceIds`, `sv`, `dp`, `mp`, `cg`, and `ev`.
- Brand-core monitoring requires `sv>=70`, `dp>=60`, `mp>=55`; brand-core content requires `sv>=70`, `dp>=50`.
- Industry-benchmark and competitive-whitespace monitoring require `dp>=60`, `mp>=55`; their content prompts require `dp>=50`. These layers must not be deleted only because current customer serviceability is weak.
- Use separate denominators for `core_kpi` and `category_benchmark`; report `opportunity_analysis` and `diagnostic_only` separately.
- Preserve each Topic and cell market anchor. A formal `industry_benchmark` must use the same confirmed L3; provisional market boundaries must be labelled and excluded from cross-brand/time-series category comparison.
- Monitoring/content mix is dynamic by business model. Do not enforce a universal 80% ratio.
- Best/top/provider/vendor/comparison/review/pricing prompts are generated only for distinct uncovered decisions.
- Every prompt is monitored independently with no prior context. Each prompt must include enough industry, category, or use-case language for the model to know the business context without reading the Topic name or brand summary.
- Every prompt must include a business-context anchor: a concrete industry, product category, service type, user scenario, or allowed brand term. Do not ask vague cross-industry questions such as "raw spread vs standard accounts", "learn technical analysis systematically", or "practice with a demo account" unless the prompt explicitly says the relevant category, e.g. `CFD`, `forex`, `broker`, `trading account`, `trading platform`, `leveraged trading`, or a concrete asset for trading/broker domains.
- Do not output cross-industry ambiguous prompts such as "one-stop procurement cost vs multiple suppliers?" or "supplier with fast delivery?" Rewrite them with the category anchor, e.g. "hotel one-stop procurement cost vs multiple suppliers?".
- Lower-mention informational prompts belong in `content_opportunity`; their quantity follows applicable coverage rather than a fixed cap.
- If `brandPromptMode=exclude`, exclude owned brand, aliases, and competitor names from every prompt and keyword.
- If `brandPromptMode=include`, include owned-brand validation prompts but do not include competitor names unless explicitly requested.
- If `brandPromptMode=mixed`, competitive prompts must map to real competitors from `competitorMap`.

## Prompt QA

After prompt JSON is generated, run deterministic QA before rendering Markdown/CSV:

```bash
python3 scripts/prompt_qa.py output.json --brand "[Brand]" --mode "[brandPromptMode]"
```

Pass aliases and competitors as additional flags when available. Store the report in `qaReport`. If `qaReport.passed=false`, either repair and rerun generation or return the failures visibly.

## Fallback Policy

Hosted production must stop when OpenRouter, Canonical market-boundary review, model generation, or deterministic QA fails after one repair attempt. It must not silently use static industry libraries.

Fallback output must include:

```markdown
## 生成模式提示

当前未完成 optimized_geo_skill 的 LLM 执行，本次使用规则 fallback 生成。原因：...
```

An explicitly requested portable development fallback may emit this warning, but it is not client-ready and must never be enabled automatically in the hosted product.
