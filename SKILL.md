---
name: dageno-online-topic-prompt-generator
description: Exported Skill from the live GEO Sales Workbench for generating Dageno-ready Topic clusters and Prompt libraries from any real customer domain. Use when a user asks to create, audit, export, or improve Topic/Prompt monitoring configurations based on website crawling, web search, model-led brand research, high-intent GEO monitoring logic, optional brand terms, and CSV-ready outputs.
---

# Dageno Online Topic Prompt Generator

This Skill reproduces the Topic/Prompt generation logic used by Dageno's GEO Sales Workbench.

Use it to turn a real customer website into Dageno monitoring assets:

- Topic clusters that reflect the customer's real business scenarios.
- 10-20 prompts per Topic, grouped by Topic.
- Prompt metadata for Dageno monitoring: brand-term type, intent type, funnel stage, intent score, and keywords.
- Optional CSV-ready output.

## Non-Negotiable Principle

Never generate from a cached industry template alone.

Every new domain must run a fresh evidence chain:

1. Crawl the website.
2. Search the web for brand/category/competitor context.
3. Use a model to infer the real business from crawl + search evidence.
4. Generate Topics from the inferred business, roles, JTBD, content assets, decision criteria, and gaps.
5. Generate Prompts that are likely to trigger product, provider, brand, competitor, source, or recommendation mentions.
6. Use static rules only as fallback, and explicitly label fallback output as lower quality.

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
- `includeBrandTerms`: default false. If true, use `mixed` brand prompt mode.
- `crawlDepth`: default 6-8, valid range 3-12.
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
- search queries for further research
- topic seeds
- suggested topic count
- evidence notes
- warnings

The model must not force the domain into SaaS, VPS, web scraping, AI PPT, or any previous category unless evidence proves it.

See `references/online-flow.md` for the exact JSON schema.

### 3. External Search

Search for at least these categories:

- Brand identification: `[brand] [domain] what is`
- Competitors and alternatives: `[brand] alternatives competitors`
- Reviews and reputation: `[brand] review reputation`
- Buying decision: `[brand] best pricing comparison`

If brand intelligence suggests better queries, use those. Categorize results as:

- 品牌识别
- 竞品/替代品
- 评测/口碑
- 购买决策
- 行业榜单
- 社区/问答

External signals should improve competitor discovery and category context. Do not treat them as final truth unless they match site evidence or credible third-party sources.

### 4. Topic Generation

Read `references/geo-topic-generate.md`, `references/brand-research.md`, and `references/content-compress.md` when generating Topics.

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

Auto Topic count is decided by business complexity. Do not always output 7.

Guidance:

- Local services: usually 4-5 Topics.
- Simple DTC category: usually 4-6 Topics.
- Multi-product DTC / hardware: usually 5-7 Topics.
- SaaS / B2B software: usually 6-8 Topics.
- Complex platform / marketplace / enterprise category: usually 7-10 Topics.

### 5. Prompt Generation

Read `references/geo-prompt-generate-by-topic.md` and `references/shared-prompt-rules.md`.

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
- `mixed`: when `includeBrandTerms=true`. Include generic, branded validation, and limited competitive prompts.
- `brand_only`: only for brand reputation/occupancy monitoring.

### 6. Monitoring-First Prompt Mix

Dageno monitors whether AI answers mention brands, competitors, products, vendors, or trusted sources. Therefore prompts must not be dominated by pure informational questions.

Rules:

- At least 80% of prompts should naturally trigger product/provider/brand recommendations, comparisons, alternatives, reviews, pricing, risk validation, implementation, vendor selection, or purchase decisions.
- Pure `education_content` prompts are allowed, but default to at most 1 per Topic unless the category is media/community/content-led.
- Add 4-5 extra BOFU decision prompts per Topic beyond the base prompt count.
- Extra decision prompts should use best/top/provider/vendor/comparison/review/pricing style language.
- Keep prompts natural. They must sound like real Google/ChatGPT queries, not internal labels.

### 7. Region Handling

If the user says the Dageno crawler/IP controls region, do not include region words such as `United States`, `US`, `North America`, `Europe`, `Japan`, etc. in prompts.

If region is part of the real local service intent, use location only when the monitoring setup cannot control geography or the user explicitly asks for local prompts.

### 8. Output Format

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
- Do prompts avoid unsupported features and out-of-scope claims?
- Are brand terms excluded when `includeBrandTerms=false`?
- Are competitor names excluded from generic prompts?
- Is fallback clearly labeled if no model key was used?
