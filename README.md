# Dageno Online Topic Prompt Generator

> Generate Dageno-ready GEO Topic clusters and high-intent monitoring prompts from any real customer domain.

Most prompt generators start from an industry template.

This one starts from evidence.

It crawls the customer website, looks for external search signals, asks a model to identify the real business, then turns that context into Topic clusters and Prompt libraries that can be monitored in Dageno.

The goal is not to create generic SEO questions.

The goal is to create prompts that are likely to make AI systems mention:

- brands
- competitors
- products
- vendors
- trusted sources
- pricing
- risks
- alternatives
- implementation choices

It can also generate a competitor map by country, business line, overlap type, and differentiation angle, then use that map to shape competitive Topics and Prompts.

## Why This Exists

GEO monitoring only works when the prompts reflect how real users ask AI systems for help.

If the prompts are too informational, the answer may never mention a brand.

If the prompts are copied from a static industry template, the system can misread a customer website and generate the wrong Topic set.

This Skill is designed to prevent that failure mode.

It asks a harder question:

**What would a real buyer, user, operator, or local customer ask before choosing a product, service, vendor, or alternative?**

## How It Works

```mermaid
flowchart LR
  A["Customer domain"] --> B["Website crawl"]
  B --> C["Page evidence<br/>titles, headings, copy, products, docs, pricing"]
  A --> D["Web search"]
  D --> E["External signals<br/>competitors, reviews, alternatives, community"]
  C --> F["Model-led brand intelligence"]
  E --> F
  F --> G["Category demand search<br/>best, review, pricing, alternative, integration"]
  G --> H["Competitor map<br/>country + business line + differentiation"]
  H --> I["Topic clusters<br/>business scenarios + buyer intent"]
  I --> J["Prompt library<br/>high-intent monitoring prompts"]
  J --> K["Dageno-ready output<br/>Markdown / CSV + QA"]
```

The pipeline has six gates:

1. **Crawl** the real website.
2. **Search** for category, competitor, review, and buying-decision context.
3. **Infer** the actual business with a model, instead of forcing a fixed industry label.
4. **Find category demand** from non-branded best/review/pricing/alternative/integration/community searches.
5. **Map competitors** by market, country, business line, overlap, and differentiation angle.
6. **Plan Topics** by buyer roles, jobs-to-be-done, content assets, competitors, and decision criteria.
7. **Generate Prompts** that can trigger product/provider/brand mentions in AI answers.
8. **Run QA and export** grouped Topic/Prompt tables for Dageno monitoring.

## What It Produces

### Topic Clusters

Each Topic is a real demand cluster, not a feature label.

Example fields:

| Field | Meaning |
|---|---|
| `t` | Topic name |
| `ty` | Topic Cluster type |
| `f` | Priority: High / Medium / Low |
| `c` | Confidence score |
| `ev` | Optional evidence metadata |

Supported Topic types:

- `product_category`
- `use_case`
- `persona_need`
- `purchase_decision`
- `risk_validation`
- `competitive_alternative`
- `content_coverage`

### Prompt Rows

Each prompt carries monitoring metadata:

| Field | Meaning |
|---|---|
| `p` | Prompt text |
| `pt` | `generic`, `branded`, or `competitive` |
| `it` | Intent type |
| `f` | Funnel stage: TOFU / MOFU / BOFU |
| `is` | Intent score |
| `kw` | Two keyword phrases for search volume aggregation |

The default mode is non-branded:

```text
brandPromptMode = exclude
```

That means prompts should not contain the customer's brand name, aliases, or competitor names unless the user explicitly asks for branded or mixed monitoring.

Supported brand prompt modes:

- `exclude`: generic non-brand monitoring.
- `include`: generic plus owned-brand validation prompts.
- `mixed`: generic, branded, and limited competitive prompts.
- `brand_only`: owned-brand reputation/entity monitoring only.

## Why Prompt Intent Matters

Dageno tracks how AI answers mention and rank brands.

So the prompt set should not be dominated by questions like:

```text
What is X?
How does X work?
History of X
```

Those can be useful for content planning, but often fail to trigger brand mentions.

This Skill prioritizes prompts like:

```text
Best [category] tools for [use case]
Top [service] providers for [buyer type]
Which [product category] is best for [scenario]?
[category] pricing and reviews
[solution type] alternatives for [pain point]
```

Each prompt must be understandable on its own. Dageno monitors prompts independently, without Topic names or prior chat context, so cross-industry terms like `supplier`, `vendor`, `procurement`, `platform`, `service`, `manufacturer`, `cost`, and `pricing` must include the industry/category/use-case anchor inside the prompt itself.

The rule of thumb:

**At least 80% of prompts should be capable of producing a recommendation, comparison, review, pricing, implementation, risk, vendor, or alternative answer.**

## Topic Count Is Not Fixed

Different businesses need different Topic counts.

The system should decide based on business complexity:

| Business type | Typical Topic count |
|---|---:|
| Local service | 4-5 |
| Simple DTC product | 4-6 |
| Multi-product DTC / hardware | 5-7 |
| B2B SaaS / developer tool | 6-8 |
| Enterprise platform / marketplace | 7-10 |

Manual override is allowed, but the default should be system judgment.

## Output Example

```markdown
# Example Brand — Topic & Prompt Monitoring Configuration

Target site: example.com
Detected industry: AI content operations platform
Topic count strategy: system selected 7 Topics
Brand term strategy: exclude

## Topic 1: AI Search Visibility Platform Selection

Monitoring goal:
Monitor whether the brand is naturally recommended in AI search platform selection scenarios.

Topic Schema: ty=product_category; f=High; c=94

| # | Monitoring Prompt | Brand Term Type | User Intent | Funnel | Intent Score | Keywords |
|---:|---|---|---|---|---|---|
| 1 | Best AI search visibility platforms for SaaS teams | generic | recommendation | BOFU | Transactional:92 | AI search platforms / SaaS visibility tools |
```

## CSV Export

The Skill supports spreadsheet-ready output:

```csv
Topic序号,Topic名称,Topic Cluster类型,用户购买路径,Topic优先级,Topic Prompt数,Prompt序号,Prompt,品牌词类型,用户意图,购买阶段,意图强度,关键词,监测模型,监测地区
```

See [CSV Output](references/csv-output.md).

## Repository Structure

```text
dageno-online-topic-prompt-generator/
  SKILL.md
  agents/
    openai.yaml
  scripts/
    crawl_and_clean.py
    prompt_qa.py
  references/
    online-flow.md
    category-demand-search.md
    competitor-generation.md
    evidence-schema.md
    geo-topic-generate.md
    geo-prompt-generate-by-topic.md
    brand-research.md
    content-compress.md
    shared-prompt-rules.md
    prompt-qa.md
    csv-output.md
  docs/
    agent-guide.md
    security.md
```

## For Humans And Agents

If you are reviewing the Skill:

- Start with this README.
- Read [Agent Guide](docs/agent-guide.md) to understand the exact execution sequence.
- Read [Security](docs/security.md) before adding any API runtime, hosted demo, or customer data.

If you are an AI coding agent:

- Load `SKILL.md` first.
- Load `references/online-flow.md` when implementing or debugging the hosted flow.
- Load `references/category-demand-search.md` before external demand research.
- Load `references/competitor-generation.md` before competitor generation.
- Load `references/evidence-schema.md` when machine output needs reviewable evidence.
- Load `references/geo-topic-generate.md` before generating Topics.
- Load `references/geo-prompt-generate-by-topic.md` and `references/shared-prompt-rules.md` before generating Prompts.
- Load `references/prompt-qa.md` before final QA.
- Never rely on static industry templates without fresh domain evidence.

## Open-Core Boundary

Good to keep in this public repository:

- Skill workflow
- Topic and Prompt schemas
- Prompt intent rules
- CSV output contract
- Safety and fallback policy

Keep private:

- API keys
- customer crawl data
- customer Dageno exports
- proprietary scoring weights
- internal model prompts that include private customer examples
- hosted runtime secrets

## License

MIT
