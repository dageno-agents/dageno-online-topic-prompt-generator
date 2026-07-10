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
  "topicCount": 7,
  "promptMode": "auto",
  "promptCount": 10,
  "crawlDepth": 6,
  "brandPromptMode": "exclude",
  "includeBrandTerms": false,
  "targetCountries": ["United States"],
  "businessLines": [],
  "openrouterApiKey": "",
  "llmModel": "anthropic/claude-opus-4.8"
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
    "intentCoveragePlan": {},
    "researchDecision": {}
  },
  "qaReport": {
    "passed": true,
    "errors": [],
    "warnings": []
  },
  "coverageReport": [],
  "outputCounts": {"topics": 6, "prompts": 54},
  "content": "Markdown Topic/Prompt output"
}
```

## Model Configuration

The live flow checks keys in this order:

1. `openrouterApiKey` from request body or `OPENROUTER_API_KEY` environment variable.
2. `anthropicApiKey` / `llmApiKey` from request body or `ANTHROPIC_API_KEY`.
3. `openaiApiKey` from request body or `OPENAI_API_KEY`.

Preferred model:

```text
anthropic/claude-opus-4.8
```

## Brand Intelligence JSON

Before Topic generation, call a model with website crawl evidence and external search evidence. Return strict JSON:

```json
{
  "brandName": "canonical brand name",
  "businessCategory": "plain-English category, not a fixed enum",
  "industryLabel": "short Chinese industry label suitable for UI",
  "businessModel": "B2B SaaS / DTC ecommerce / local service / marketplace / media / professional service / game / other",
  "confidence": 0,
  "coreOfferings": ["specific products/services the site sells or promotes"],
  "targetUsers": ["specific buyers/users"],
  "jobsToBeDone": ["real user jobs and use cases"],
  "decisionCriteria": ["criteria buyers compare before choosing"],
  "targetCountries": ["countries or markets supported or inferred from evidence"],
  "businessLines": ["specific product/service lines"],
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
- `suggestedTopicCount` must equal the smallest complete, non-overlapping Topic set; it is not an industry default.
- For local services, topic seeds should reflect location, booking, price, reviews, service menu, and trust.
- For ecommerce, topic seeds should reflect product selection, comparison, use cases, price, reviews, safety, and alternatives.
- For B2B tools, topic seeds should reflect vendor selection, workflow fit, integrations, pricing, risks, competitors, and implementation.

## Category Demand Search

Run category demand search after initial brand intelligence has identified category, personas, jobs-to-be-done, countries, and business lines.

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

Category Demand Signals:
[normalized search results]

Evidence Sources:
[evidenceSources]

Return the competitorMap schema from references/competitor-generation.md.
```

Rules:

- Generate competitors by country and business line, not only a global list.
- Include direct, partial, substitute, marketplace/directory, and source competitors when relevant.
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

Return Topics with `pc`, `cv.cells`, and `ev` using the schema in `references/geo-topic-generate.md`.
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
[{"t":"Topic","ty":"use_case","f":"High","c":95,"pc":8,"cv":{"cells":[]}}]
```

Rules:

- In auto mode, select prompts by marginal coverage and stop when all High-priority cells are covered. In manual mode, use the requested number as the final target without fixed expansions.
- Every prompt must include `pool`, `sv`, `dp`, `mp`, `cg`, and `ev`.
- `monitoring_core` requires `sv>=70`, `dp>=60`, `mp>=55`; `content_opportunity` requires `sv>=70`, `dp>=50`.
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

Rule fallback may use static industry libraries, but only after crawl/search/model generation fails.

Fallback output must include:

```markdown
## 生成模式提示

当前未完成 optimized_geo_skill 的 LLM 执行，本次使用规则 fallback 生成。原因：...
```

Fallback is not considered final for client-facing work unless manually reviewed.
