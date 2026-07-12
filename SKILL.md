---
name: dageno-topic-prompt-generator
description: Generate Dageno-ready GEO Topic clusters and Prompt libraries from any real customer domain using crawl/search evidence, a Capability Ledger, serviceable-intent coverage, two Prompt pools, deterministic QA, optional brand terms, and CSV-ready outputs.
---

# Dageno Online Topic Prompt Generator

This Skill reproduces the Topic/Prompt generation logic used by Dageno's GEO Sales Workbench.

Use it to turn a real customer website into Dageno monitoring assets:

- Topic clusters that reflect the customer's real business scenarios.
- A coverage-driven number of prompts per Topic, grouped by Topic without padding.
- Competitor maps by market, country, business line, and differentiation angle.
- Prompt metadata for Dageno monitoring: brand-term type, intent type, funnel stage, intent score, and keywords.
- Evidence metadata that explains why each Topic, Prompt, and competitor was generated.
- Optional CSV-ready output.

## Non-Negotiable Principle

Never generate from a cached industry template alone.

Every new domain must run a fresh evidence chain:

1. Crawl the website.
2. Search the web for brand/category/competitor context.
3. Use a model to infer the real business from crawl + search evidence.
4. Run category demand search for non-branded user questions, buying criteria, and comparison language.
5. Generate market-aware competitors by country, business line, overlap, and differentiation angle.
6. Build a Capability Ledger and the complete applicable serviceable-intent universe.
7. Cluster coverage cells into the smallest complete set of Topics.
8. Select Prompts by serviceability, real demand, mention/content value and marginal coverage.
9. Attach evidence metadata and run deterministic Prompt/coverage QA before final output.
10. Use static rules only as fallback, and explicitly label fallback output as lower quality.

If crawl/search/model evidence conflicts with a static industry library, trust the evidence.

When a model runtime is configured, failed brand intelligence, missing coverage output, or failed deterministic QA must stop the run after one repair attempt. Never present a cached industry template as successful Skill execution.

## Inputs

Required:

- `domain` or `websiteURL`: customer domain.
- `market`: target region, e.g. `United States / North America`. If Dageno IP controls region, do not put region words inside prompts.
- `outputLanguage`: usually English for Dageno prompts.

Optional:

- `topicMode`: `auto` or `manual`.
- `topicCount`: only used when `topicMode=manual`; valid range 1-10.
- `promptMode`: `auto` or `manual`. Default `auto`. In auto mode, prompt count is decided per Topic based on business-scene completeness, buyer-journey depth, and whether enough distinct high-intent monitoring prompts exist.
- `promptCount`: only used when `promptMode=manual`; final prompt count per Topic, valid range 5-20. Manual mode does not bypass serviceability, demand, coverage, or QA rules.
- `brandPromptMode`: `exclude` / `include` / `mixed` / `brand_only`. Default `exclude`.
- `includeBrandTerms`: legacy boolean. If true and `brandPromptMode` is absent, use `include`.
- `crawlDepth`: default 6-8, valid range 3-12.
- `targetCountries`: optional country list for market-aware competitor generation.
- `businessLines`: optional product/service lines. If absent, infer from crawl and brand intelligence.
- `openrouterApiKey` / `llmModel`: preferred runtime for full quality.

## Runtime Model

Preferred model route:

1. OpenRouter, model `openai/gpt-5.6-sol` or the strongest approved GPT-5.6 model.
2. OpenAI fallback.
3. Anthropic Claude Opus fallback.
4. Rule fallback only when no valid model key is available.

When no model key is available, tell the user clearly that output is rule fallback and may miss business nuance.

## Workflow

### 1. Crawl And Normalize

Crawl common business pages, not only the homepage:

- `/`
- `/features`
- `/products`
- `/product`
- `/solutions`
- `/use-cases`
- `/pricing`
- `/customers`
- `/case-studies`
- `/blog`
- `/docs`
- `/about`
- `/contact`
- `/support`
- `/faq`

For each page, extract:

- URL
- title
- meta description
- headings
- key body text
- product/service names
- pricing/plan signals
- content assets such as blog, docs, academy, FAQ, templates, reports, glossary

If crawl coverage is weak, state it and use search evidence to compensate. Do not invent unsupported capabilities.

Use the portable crawler script when a deterministic local/runtime crawler is needed:

```bash
python3 scripts/crawl_and_clean.py "https://example.com"
```

The script uses only Python standard-library modules. It can call a configured crawl endpoint through `DAGENO_CRAWL_ENDPOINT`, then falls back to direct HTML fetch and cleaning.

### 2. Universal Brand Intelligence

Run model-led brand research before Topic generation. The model must return:

- canonical brand name
- plain-English business category
- short Chinese industry label for UI/reporting
- business model
- confidence score
- core offerings
- target users
- jobs to be done
- decision criteria
- competitors or substitute sources
- differentiators and out-of-scope assumptions
- search queries for further research
- topic seeds
- suggested topic count
- evidence notes
- warnings

The model must not force the domain into SaaS, VPS, web scraping, AI PPT, or any previous category unless evidence proves it.

Before Topic generation, the model must identify the brand's economic center of gravity: what decision value buyers are really purchasing. This may be a product/SKU, workflow, service outcome, risk reduction, supply-chain simplification, project delivery, or replacement of multiple vendors.

Many customer websites are poorly planned, over-broad, under-written, or internally inconsistent. Do not assume the navigation structure equals the real business strategy. Compare:

- crawl evidence from owned pages
- external search evidence
- category demand language
- monetization cues
- buyer roles
- repeated decision criteria
- content assets and content gaps

If the website could plausibly mean several things, create 2-4 business hypotheses with confidence, evidence, risk, and Topic implications. Core Topics should follow the highest-confidence hypothesis. Medium-confidence hypotheses can contribute one exploratory Topic when commercially important. Low-confidence hypotheses should be shown as warnings or content gaps, not converted into core Topics.

For one-stop procurement, sourcing, wholesale, manufacturer, OEM/ODM, private-label, or supplier-integration businesses, the core value is often reducing procurement complexity across multiple categories rather than selling one visible SKU. Use this procurement decision chain when evidence supports it:

- one-stop procurement / multi-category sourcing
- category bundles or replenishment packages
- project opening, renovation, or launch procurement checklists
- custom branding / OEM / design support
- supplier quality and factory verification
- cost, MOQ, lead time, payment terms, and consolidated shipping

Do not hardcode any example company or vertical. Apply this only when crawl/search evidence supports the model.

See `references/online-flow.md` for the exact JSON schema.

### 2.5 Serviceable Intent Coverage

Read `references/coverage-engine.md` before Topic generation.

Build, in order:

1. Evidence sufficiency decision.
2. Capability Ledger: what the customer can credibly deliver, to whom, for which job, under which constraints.
3. Applicable intent universe: only realistic and serviceable buyer-intent combinations.
4. Coverage cells: the auditable units Topics and Prompts must cover.

Every accepted Prompt must pass serviceability, demand plausibility, monitoring/content value, and marginal coverage checks. Topic and Prompt counts are outputs of this process.

### 3. External Search And Category Demand Search

Search for at least these categories:

- Brand identification: `[brand] [domain] what is`
- Competitors and alternatives: `[brand] alternatives competitors`
- Reviews and reputation: `[brand] review reputation`
- Buying decision: `[brand] best pricing comparison`
- Category demand: `best [category] for [persona/use case]`
- Pain/problem: `[pain point] solution`
- Pricing and value: `[category] pricing comparison`
- Review/source demand: `[category] reviews`, `[category] reddit`, `[category] benchmark`
- Integration or implementation: `[category] integration [workflow/tool]`

If brand intelligence suggests better queries, use those. Categorize results as:

- 品牌识别
- 竞品/替代品
- 评测/口碑
- 购买决策
- 行业榜单
- 社区/问答
- 品类需求
- 价格/价值
- 集成/实施

External signals should improve competitor discovery and category context. Do not treat them as final truth unless they match site evidence or credible third-party sources.

See `references/category-demand-search.md` for portable query generation and result normalization.

### 4. Competitor Generation

Read `references/competitor-generation.md` before generating competitors.

Competitor generation is not a single global list. Produce competitors by:

- target country or market
- business line / product line
- customer segment and buyer role
- direct overlap, partial overlap, substitute, marketplace/directory, or source competitor
- core differentiator and comparison angle

Use competitors to inform Topic and Prompt design, but do not put competitor names in `generic` prompts.

### 5. Topic Generation

Read `references/geo-topic-generate.md`, `references/brand-research.md`, `references/content-compress.md`, and `references/evidence-schema.md` when generating Topics.

Topics are not feature labels. A Topic is a coherent user-question cluster sharing the same decision object and core job-to-be-done.

Internally model:

- business boundary: what the brand sells and does not sell
- role matrix: buyers, users, operators, decision makers, local customers, developers, etc.
- JTBD matrix: tasks, pain, purchase trigger, risk concern
- existing content assets
- content gaps
- intent coverage
- brand-term strategy

Topic fields:

- `t`: Topic name
- `ty`: `product_category` / `use_case` / `persona_need` / `purchase_decision` / `risk_validation` / `competitive_alternative` / `content_coverage`
- `f`: `High` / `Medium` / `Low`
- `c`: confidence score 0-100
- `pc`: coverage-derived final prompt count
- `cv`: capability mappings, applicable intents, decision criteria, excluded intents and coverage cells
- `ev`: evidence object. Include sources, confidence reason, mapped pages, demand signals, and competitor links when machine output is requested.

Auto Topic count is the smallest non-overlapping set that covers all High-priority serviceable capabilities, buyer jobs, triggers, decision criteria and risks. Do not choose a count from an industry default. Manual mode may constrain count, but must disclose any uncovered High-priority cells.

### 6. Prompt Generation

Read `references/geo-prompt-generate-by-topic.md`, `references/shared-prompt-rules.md`, and `references/evidence-schema.md`.

Generate prompts per Topic with this metadata. Do not force every Topic to have the same number of prompts in auto mode.

- `p`: prompt text
- `l`: language code
- `pt`: `generic` / `branded` / `competitive`
- `it`: `problem_solution` / `recommendation` / `comparison` / `pricing_value` / `risk_validation` / `implementation` / `alternative` / `local_availability` / `education_content` / `brand_validation`
- `f`: `TOFU` / `MOFU` / `BOFU`
- `is`: intent score object, e.g. `{"i":"Commercial","s":84}`
- `kw`: exactly two keyword phrases
- `pool`: `monitoring_core` / `content_opportunity`
- `sv`: business serviceability score 0-100
- `dp`: demand plausibility score 0-100
- `mp`: answer mention likelihood score 0-100
- `cg`: coverage-cell IDs
- `ev`: prompt evidence and expected answer type

Prompt count rules:

- Auto mode: stop when all High-priority and applicable coverage cells are covered and remaining candidates add no meaningful coverage. A Topic may contain 4-20 prompts.
- Manual mode: treat the requested number as a final cap/target. Do not append a fixed decision-prompt quota.
- Never pad a Topic with weak, repetitive, unsupported or low-demand prompts.

Brand term mode:

- `exclude`: default. No owned brand, alias, or competitor names in prompts or keywords.
- `include`: include generic prompts plus owned-brand validation prompts. Do not include competitor names unless explicitly requested.
- `mixed`: include generic, branded validation, and limited competitive prompts.
- `brand_only`: only for brand reputation/occupancy monitoring.

### 7. Monitoring And Content Pools

Dageno primarily monitors whether AI answers mention brands, competitors, products, vendors, or trusted sources. Content planning also needs real informational demand, so keep the two uses explicit.

Rules:

- `monitoring_core` prompts must have `sv>=70`, `dp>=60`, and `mp>=55`.
- `content_opportunity` prompts must have `sv>=70` and `dp>=50`; lower mention likelihood is allowed.
- Decision-led businesses usually produce 75-90% monitoring-core prompts. Media, education, community, and content-led businesses may produce 50-70%. Do not enforce one ratio across industries.
- Every prompt must stand alone as a no-context monitoring query. Dageno sends each prompt independently, so generic words such as `supplier`, `vendor`, `procurement`, `platform`, `service`, `manufacturer`, `account`, `course`, `demo account`, `cost`, or `pricing` must include the relevant industry/category/use-case anchor inside the prompt itself. For financial/trading/broker domains, each prompt should explicitly include an anchor such as `CFD`, `forex`, `broker`, `trading account`, `trading platform`, `leveraged trading`, a concrete traded asset, or an allowed brand term.
- Information-oriented prompts belong in `content_opportunity` unless they naturally trigger entity or source mentions.
- Best/top/provider/vendor/comparison/review/pricing language is allowed only for distinct uncovered buyer decisions; never add a fixed quota.
- Keep prompts natural. They must sound like real Google/ChatGPT queries, not internal labels.

### 8. Prompt QA

Before final delivery, run the QA checklist in `references/prompt-qa.md` and the coverage rules in `references/coverage-engine.md`. When JSON output is available, use:

```bash
python3 scripts/prompt_qa.py output.json --brand "Brand Name" --mode exclude
```

The QA script is portable and offline. Hosted runtimes must implement the same checks and return `qaReport` plus `coverageReport`; putting QA instructions inside an LLM prompt does not count as executing QA.

### 9. Region Handling

If the user says the Dageno crawler/IP controls region, do not include region words such as `United States`, `US`, `North America`, `Europe`, `Japan`, etc. in prompts.

If region is part of the real local service intent, use location only when the monitoring setup cannot control geography or the user explicitly asks for local prompts.

### 10. Output Format

Default output should be Markdown with grouped Topics:

```markdown
# [Brand] — Topic & Prompt 监控配置

目标站点：
识别行业：
Topic 数量策略：
品牌词策略：
生成模式：

## 品牌调研过程

## Topic 设计原则

## Topic 1: [Topic]

监控目标：

Topic Schema：ty=...；f=...；c=...

| 序号 | 监控 Prompt | 品牌词类型 | 用户意图 | 购买阶段 | 意图强度 | 关键词 |
|---:|---|---|---|---|---|---|
```

For CSV export, use:

```csv
Topic序号,Topic名称,Topic Cluster类型,用户购买路径,Topic优先级,Topic Prompt数,Prompt序号,Prompt,品牌词类型,用途池,用户意图,购买阶段,意图强度,关键词,业务承接分,需求真实性分,品牌提及概率分,监测模型,监测地区
```

See `references/csv-output.md` for exact column rules.

## QA Checks

Before final delivery:

- Did every domain get fresh crawl/search/model research?
- Does the detected business match the real website?
- Does every core Topic map to a confirmed or strongly inferred capability?
- Is Topic count the smallest set that covers all High-priority serviceable intent cells?
- Are Topics free of brand names by default?
- Are prompts grouped by Topic?
- Are monitoring prompts above serviceability, demand and mention thresholds?
- Are informational prompts explicitly separated into the content-opportunity pool?
- Does every prompt remain clear if sent alone with no Topic, brand, or prior chat context?
- Do cross-industry terms like supplier/vendor/procurement/platform/service/manufacturer/cost/pricing include an industry/category anchor?
- Do prompts avoid unsupported features and out-of-scope claims?
- Are brand terms excluded when `brandPromptMode=exclude`?
- Are competitor names excluded from generic prompts?
- Is there country/business-line competitor coverage when markets or product lines are known?
- Does every Topic/Prompt have enough evidence metadata for review?
- Are all High-priority coverage cells covered, with excluded intents explained?
- Did deterministic Prompt QA pass, or are failures clearly listed?
- Is fallback clearly labeled if no model key was used?
