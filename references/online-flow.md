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
  "outputLanguage": "English",
  "models": "ChatGPT / Perplexity",
  "regionMode": "由 Dageno 地区/IP 设置控制",
  "topicMode": "auto",
  "topicCount": 7,
  "promptCount": 10,
  "crawlDepth": 6,
  "includeBrandTerms": false,
  "openrouterApiKey": "",
  "llmModel": "anthropic/claude-sonnet-4.6"
}
```

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
anthropic/claude-sonnet-4.6
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
  "competitors": ["competitors, alternatives, substitute providers, platforms, directories, or comparison sources"],
  "searchQueries": ["5-8 search queries that would find more competitors/reviews/category context"],
  "topicSeeds": ["4-10 high-value GEO topic clusters based on real buyer questions"],
  "suggestedTopicCount": 3,
  "evidence": ["short evidence notes from crawl/search"],
  "warnings": ["uncertainties or missing evidence"]
}
```

Important model instructions:

- Use only the provided website crawl and search evidence.
- If crawl evidence is weak, use domain name and external search results, but lower confidence.
- Do not force the site into SaaS, VPS, web scraping, AI PPT, or any pre-existing category unless evidence proves it.
- Topic seeds must reflect real user/business scenarios, not generic product labels.
- For local services, topic seeds should reflect location, booking, price, reviews, service menu, and trust.
- For ecommerce, topic seeds should reflect product selection, comparison, use cases, price, reviews, safety, and alternatives.
- For B2B tools, topic seeds should reflect vendor selection, workflow fit, integrations, pricing, risks, competitors, and implementation.

## Topic Model Prompt

System:

```text
You are executing the GEO Topic Skill exactly. Follow the skill, brand research, and content compression rules. Output only strict JSON.
```

User payload:

```text
currentDate: YYYY-MM-DD
langCode: en-US
topicCount: [count]
websiteURL: [domain]
brandPromptMode: exclude|mixed

The brand research step has been completed from crawling and search evidence. Use this summary as the brandSummary:

[brand research summary]

Return the exact JSON schema required by the Skill.
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
BasePromptsPerTopic: [base count]
DecisionExpansionPromptsPerTopic: 4-5
TotalPromptsPerTopic: [base + expansion]
brandPromptMode: exclude|mixed
brandPromptRatio: 0.3

Brand Context / Summary:
[brand research summary]

Topics to generate. Use every topic exactly once and do not add extra topics:
[{"t":"Topic","ty":"use_case","f":"High","c":95}]
```

Rules:

- Each provided topic must have exactly `TotalPromptsPerTopic` prompts.
- Preserve diversified intent mix for the first `BasePromptsPerTopic` prompts.
- Add 4-5 extra BOFU decision prompts per topic.
- Extra prompts must be high-purchase-intent best/top/provider/vendor/comparison/review/pricing style questions.
- At least 80% of prompts must naturally trigger product/provider/brand recommendations, comparisons, alternatives, reviews, pricing, risk validation, implementation vendor selection, or purchase decisions.
- At most 1 `education_content` prompt per Topic unless category is content-led.
- If `brandPromptMode=exclude`, exclude owned brand, aliases, and competitor names from every prompt and keyword.

## Fallback Policy

Rule fallback may use static industry libraries, but only after crawl/search/model generation fails.

Fallback output must include:

```markdown
## 生成模式提示

当前未完成 optimized_geo_skill 的 LLM 执行，本次使用规则 fallback 生成。原因：...
```

Fallback is not considered final for client-facing work unless manually reviewed.

