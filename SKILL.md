---
name: dageno-online-topic-prompt-generator
description: Exported Skill from the live GEO Sales Workbench for generating Dageno-ready Topic clusters and Prompt libraries from any real customer domain. Use when a user asks to create, audit, export, or improve Topic/Prompt monitoring configurations based on website crawling, web search, model-led brand research, high-intent GEO monitoring logic, optional brand terms, and CSV-ready outputs.
---

# Dageno Online Topic Prompt Generator

This Skill reproduces the Topic/Prompt generation logic used by Dageno's GEO Sales Workbench.

Use it to turn a real customer website into Dageno monitoring assets:

- Topic clusters that reflect the customer's real business scenarios.
- 10-20 prompts per Topic, grouped by Topic.
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
6. Generate Topics from the inferred business, roles, JTBD, content assets, decision criteria, competitors, and gaps.
7. Generate Prompts that are likely to trigger product, provider, brand, competitor, source, or recommendation mentions.
8. Attach evidence metadata and run Prompt QA before final output.
9. Use static rules only as fallback, and explicitly label fallback output as lower quality.

If crawl/search/model evidence conflicts with a static industry library, trust the evidence.

## Inputs

Required:

- `domain` or `websiteURL`: customer domain.
- `market`: target region, e.g. `United States / North America`. If Dageno IP controls region, do not put region words inside prompts.
- `outputLanguage`: usually English for Dageno prompts.

Optional:

- `topicMode`: `auto` or `manual`.
- `topicCount`: only used when `topicMode=manual`; valid range 1-10.
- `promptCount`: base prompt count per Topic, valid range 5-20. The live flow expands this with 4-5 extra decision prompts per Topic.
- `brandPromptMode`: `exclude` / `include` / `mixed` / `brand_only`. Default `exclude`.
- `includeBrandTerms`: legacy boolean. If true and `brandPromptMode` is absent, use `include`.
- `crawlDepth`: default 6-8, valid range 3-12.
- `targetCountries`: optional country list for market-aware competitor generation.
- `businessLines`: optional product/service lines. If absent, infer from crawl and brand intelligence.
- `openrouterApiKey` / `llmModel`: preferred runtime for full quality.

## Runtime Model

Preferred model route:

1. OpenRouter, model `anthropic/claude-sonnet-4.6` or the strongest available Claude Sonnet model.
2. Anthropic Claude Sonnet fallback.
3. OpenAI fallback.
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

See `references/online-flow.md` for the exact JSON schema.

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

Topics are not feature labels. A Topic is a real user-question cluster that can hold 10-20 prompts.

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
- `ev`: evidence object. Include sources, confidence reason, mapped pages, demand signals, and competitor links when machine output is requested.

Auto Topic count is decided by business complexity. Do not always output 7.

Guidance:

- Local services: usually 4-5 Topics.
- Simple DTC category: usually 4-6 Topics.
- Multi-product DTC / hardware: usually 5-7 Topics.
- SaaS / B2B software: usually 6-8 Topics.
- Complex platform / marketplace / enterprise category: usually 7-10 Topics.

### 6. Prompt Generation

Read `references/geo-prompt-generate-by-topic.md`, `references/shared-prompt-rules.md`, and `references/evidence-schema.md`.

Generate prompts per Topic with this metadata:

- `p`: prompt text
- `l`: language code
- `pt`: `generic` / `branded` / `competitive`
- `it`: `problem_solution` / `recommendation` / `comparison` / `pricing_value` / `risk_validation` / `implementation` / `alternative` / `local_availability` / `education_content` / `brand_validation`
- `f`: `TOFU` / `MOFU` / `BOFU`
- `is`: intent score object, e.g. `{"i":"Commercial","s":84}`
- `kw`: exactly two keyword phrases

Brand term mode:

- `exclude`: default. No owned brand, alias, or competitor names in prompts or keywords.
- `include`: include generic prompts plus owned-brand validation prompts. Do not include competitor names unless explicitly requested.
- `mixed`: include generic, branded validation, and limited competitive prompts.
- `brand_only`: only for brand reputation/occupancy monitoring.

### 7. Monitoring-First Prompt Mix

Dageno monitors whether AI answers mention brands, competitors, products, vendors, or trusted sources. Therefore prompts must not be dominated by pure informational questions.

Rules:

- At least 80% of prompts should naturally trigger product/provider/brand recommendations, comparisons, alternatives, reviews, pricing, risk validation, implementation, vendor selection, or purchase decisions.
- Every prompt must stand alone as a no-context monitoring query. Dageno sends each prompt independently, so generic words such as `supplier`, `vendor`, `procurement`, `platform`, `service`, `manufacturer`, `cost`, or `pricing` must include the relevant industry/category/use-case anchor inside the prompt itself.
- Pure `education_content` prompts are allowed, but default to at most 1 per Topic unless the category is media/community/content-led.
- Add 4-5 extra BOFU decision prompts per Topic beyond the base prompt count.
- Extra decision prompts should use best/top/provider/vendor/comparison/review/pricing style language.
- Keep prompts natural. They must sound like real Google/ChatGPT queries, not internal labels.

### 8. Prompt QA

Before final delivery, run the QA checklist in `references/prompt-qa.md`. When JSON output is available, use:

```bash
python3 scripts/prompt_qa.py output.json --brand "Brand Name" --mode exclude
```

The QA script is portable and offline. It catches common structural, brand-term, duplicate, standalone-context, and intent-mix failures. Model-based QA can be added in hosted runtimes, but must not replace deterministic checks.

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
Topic序号,Topic名称,Topic Cluster类型,用户购买路径,Topic优先级,Topic Prompt数,Prompt序号,Prompt,品牌词类型,用户意图,购买阶段,意图强度,关键词,监测模型,监测地区
```

See `references/csv-output.md` for exact column rules.

## QA Checks

Before final delivery:

- Did every domain get fresh crawl/search/model research?
- Does the detected business match the real website?
- Is Topic count based on business complexity, not a fixed number?
- Are Topics free of brand names by default?
- Are prompts grouped by Topic?
- Are prompts mostly high-intent and monitoring-useful?
- Does every prompt remain clear if sent alone with no Topic, brand, or prior chat context?
- Do cross-industry terms like supplier/vendor/procurement/platform/service/manufacturer/cost/pricing include an industry/category anchor?
- Do prompts avoid unsupported features and out-of-scope claims?
- Are brand terms excluded when `brandPromptMode=exclude`?
- Are competitor names excluded from generic prompts?
- Is there country/business-line competitor coverage when markets or product lines are known?
- Does every Topic/Prompt have enough evidence metadata for review?
- Did deterministic Prompt QA pass, or are failures clearly listed?
- Is fallback clearly labeled if no model key was used?
