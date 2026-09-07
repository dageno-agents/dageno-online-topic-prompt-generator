---
name: dageno-topic-prompt-generator
description: Research a real domain and its market, then build evidence-backed GEO Topics, deduplicated buyer-intent units and standalone monitoring Prompts. Use for Dageno question libraries, industry intent panels, localized CSV imports and panel updates.
---

# Dageno Topic & Prompt Generator V3

Build a defensible AI-search monitoring panel, not a list of plausible questions.

## First Principle

Research what the brand sells today AND what buyers across the relevant market need.
Enumerate material decisions before clustering Topics or writing questions.
Cover evidenced industry demand even when the target brand is not positioned to win it.
Never claim to have observed all industry queries or discovered all internet demand.

Version: `3.1.0`. Machine schema: `dageno.topic-prompt.v3`. Monitoring policy: `brand_visibility.v1`.

**Final-list gate:** business relevance alone is insufficient. If an answer can fully satisfy the question without specific products/providers/brands, keep it out of the brand-competition list. Read [brand visibility admission](references/brand-visibility-admission.md) for every generation or export task.

## Operating Modes

- **Codex session:** use the selected session model and available crawl/search tools. An OpenRouter key is NOT required just to use this Skill in Codex. Follow the research and QA contracts, retain the structured artifact and run the executable validator.
- **Hosted/CLI:** use `runtime/pipeline.mjs` and an explicitly selected OpenRouter model through `runtime/model.mjs`. Validate a real model request before research. Never switch model/provider silently or fabricate a template result after failure.
- **Review/update:** load the prior panel only for version comparison. Fresh site/market evidence remains required. Do not rewrite historical measurements.

A session model change does not automatically change the production model center.

## Inputs

Required: domain. Confirm or recommend a monitoring country and output language when missing.
Hosted defaults: US and en-US; these are configuration defaults, NOT inferred market facts.

Optional:
- client priority offering, paying buyer, strategic goal and exclusions;
- Canonical catalog candidates and taxonomy version;
- `brandPromptMode`: exclude (default), include, mixed, brand_only;
- `market`: one ISO-3166 country or a recognized country name;
- `outputLanguage`: BCP-47 language tag, including zh-CN and zh-TW;
- `topicMode/promptMode`: auto (default) or manual;
- manual counts: positive integer caps, never padding targets;
- `previousPanel`: same domain, country, language and taxonomy version for comparison;
- `researchBudget`: request/model-call safety budgets; exhaustion must stop or disclose unfinished research, never assert completeness.

Auto mode has no business-level count ceiling. Transport batching is not taxonomy truncation.
Manual budgets expose every deferred known intent unit and the resulting coverage loss.

## Required Workflow

1. **Fresh evidence.** Discover navigation and sitemap branches; sample offering, scenario, commercial, proof, documentation/trust and entity pages. Read body text with structured parsers. Record actual URLs, retrieval times, failures, excerpts and unvisited inventory. A reader proxy is not browser rendering. Do not bypass access restrictions.
2. **Business hypotheses.** Identify current offer, payer, user, purchase job and limits from evidence. Separate roadmap, blog subjects and genuinely sold capabilities. Do not infer core business from a domain, menu or repeated word alone.
3. **Independent market research.** Search category demand, alternatives, comparisons, risks, pricing, implementation, post-purchase and local requirements. Read representative external/provider pages. Search snippets are clues, not verified provider claims or search-volume observations.
4. **Disconfirmation.** Re-evaluate business hypotheses against later evidence. Change the hypothesis when contradicted. Unresolved offer/payer/market means a provisional draft or a clarification, never a confident industry template.
5. **L3 boundary.** Read [Canonical L3](references/canonical-l3-market-boundary.md). Reuse only supplied valid IDs. Without a catalog, use project-local provisional markets. Do not merge adjacent categories into the same benchmark.
6. **Decision surfaces and intent units.** Read [intent ontology](references/intent-ontology.md). Enumerate independently from brand strengths, then challenge for missing product lines, buyer roles, criteria, stages, local constraints and competitor capabilities. No mechanical Cartesian product; no minimum best/top quota.
7. **Independent gap review.** Compare the inventory with original evidence, not just the generator's summary. Add missed material units; document exclusions and remaining uncertainty. A saturated reviewed inventory still does not prove market-wide exhaustiveness.
8. **Topic clustering.** Group units sharing a decision object, job and compatible buyer context. Product/category Topics are valid when buyers compare a distinct candidate set. Topic is not a funnel stage. Preserve every unit exactly once.
9. **Prompt generation.** One canonical, natural standalone question per unit. Keep knowledge questions intact. Where evidence supports a distinct missing provider/product decision, add its own intent unit and relatedContentUnitKeys; do not disguise a changed buying intent as a paraphrase. Carry category context, not proprietary feature bundles or instructions to mention the target brand.
10. **QA and monitoring admission.** Execute schema/reference/mapping/duplicate/brand/locale checks AND independent model review. Every actual question needs a brandless-answer test, entity-role assessment and concrete content/proof/action plan. Route source citations and incidental/knowledge questions out of brand competition. Correct pool mismatches without changing the original meaning. Missing or stale review blocks export. Lexical overlap is a review candidate, not a semantic verdict.
11. **Delivery and versions.** Return structured JSON, human-readable Chinese rationale and import CSV as requested. Separate known covered/deferred units from unknown demand. Record generation model, monitoring configuration, source hashes and version difference.

Detailed research contract: [Research protocol](references/v3-research-protocol.md).
Metrics and uncertainty: [Measurement contract](references/v3-measurement-contract.md).
Schemas and export: [Output contract](references/v3-output-contract.md).
Validation and release: [QA and evaluation](references/v3-validation.md).

## Coverage And Brand Policies

Keep `scope`, `pool` and `benchmarkMember` independent.

| Scope | Meaning | Metric purpose |
| --- | --- | --- |
| brand_core | Current customer capability is evidenced or strongly inferred | Core capability panel |
| industry_benchmark | Material same-market demand independent of the brand | Industry panel |
| competitive_whitespace | A retrieved competitor page supports a relevant gap | Opportunity analysis |
| out_of_scope_reference | Context outside sensible current targeting | Diagnostic only |

The category denominator is ALL eligible `benchmarkMember=true` units, including relevant brand_core units, not just industry_benchmark scope.
Branded, adjacent-market and diagnostic units do not belong in a generic same-market benchmark.

- `monitoring_core`: specific entities materially fulfill a real selection, comparison or brand-evaluation decision, with an actionable content/proof plan.
- `citation_monitoring`: authorities and domains are cited as evidence, not evaluated as the chosen product/provider.
- `content_opportunity`: a complete answer can remain brandless; incidental brand examples do not qualify for competition monitoring.
- Neither pool has a required percentage. Low target-brand visibility is never a reason to remove a question.
- exclude: no owned or competitor terms; include: owned-brand plus generic; mixed: additionally researched competitive; brand_only: owned-brand validation.
- Brand mentions are not keyword substring matches: short names and multilingual aliases require boundary-aware review.
- Unknown capability is not a confirmed absence. Competitor claims are not verified performance.

## Localization

Language, country, IP, product availability and legal jurisdiction are separate controls.
Keep country words out of generic IP-controlled questions. Retain a city or jurisdiction when it materially changes a local-service or regulatory decision.
Never assume IP alone causes a model to behave like a local user.
Compare a stable generic panel separately from localized demand supplements.

## Output Requirements

Human review: business conclusion, evidence gaps, Topic rationale, intent coverage and grouped questions.
Machine master: `runtime/schemas.mjs` plus artifact fields defined in [output contract](references/v3-output-contract.md).
Default Dageno import: exactly `topic,prompt,regions,language`, UTF-8 with BOM, one row per approved brand_core service-monitoring question.
Separately export `benchmark`, `citation` or `content` when requested. Industry benchmark includes qualified core and non-serviceable same-market questions. Preserve the full industry intent map; do not mix these lists into one KPI or imply that service-only performance is industry-wide visibility.
Every reviewed question retains its admission rationale and content assets, proof needed and optimization action. The human report separates the four deliveries and flags Topics with no eligible service monitors.
A four-column CSV cannot preserve evidence, intent IDs or benchmark membership; retain JSON alongside it.

## Quality Claims

Never present an LLM-generated 0-100 score as search volume, user frequency or mention probability.
Use evidence-supported / inferred / not verified labels and retain supporting sources.
The default hosted flow does NOT execute consumer AI-platform monitoring or an entity pilot. Report `entityPilot.status=not_run`.
Optional pilots must count ANY relevant entity, retain raw responses and denominators, and never cherry-pick target-brand-positive questions.

## Executable Tools

Requires Node.js 22+ for the portable runtime; install dependencies with `npm ci` in the Skill directory.

```bash
node runtime/cli.mjs generate --domain example.com --market US --language en-US --out ./private/example
node runtime/cli.mjs qa ./private/example/panel.json
node runtime/cli.mjs export ./private/example/panel.json ./private/example/import.csv
node runtime/cli.mjs export ./private/example/panel.json ./private/example/benchmark.csv --dataset benchmark
npm test
```

Hosted generation requires OPENROUTER_API_KEY and OPENROUTER_MODEL in the server environment.
Never commit keys, customer research artifacts, private articles or proposals.
Tests under `tests/` are evaluation fixtures, never runtime industry seeds.
