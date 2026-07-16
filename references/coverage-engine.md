# Serviceable Intent Coverage Engine

This is the canonical Topic/Prompt planning algorithm.

## First Principle

The generator succeeds only when it produces a complete, non-redundant Topic and Prompt system covering both the customer's **brand-serviceable universe** and the category's **industry demand universe**, with competitive whitespace kept visible and metrics separated by layer.

Every accepted prompt must satisfy four conditions:

1. **Layer eligibility**: the Prompt has the evidence required for its declared coverage layer.
2. **Demand plausibility**: a real target buyer is likely to ask the question.
3. **Monitoring value**: the answer is likely to mention products, providers, brands, competitors, or trusted sources; otherwise the prompt must be explicitly classified as a content opportunity.
4. **Marginal coverage**: the prompt covers at least one relevant intent unit not already covered by a stronger prompt, or is an explicitly justified wording-robustness variant.

Topic and Prompt counts are outputs of coverage. They are not fixed by industry templates, fixed quotas, or default numbers such as 10.

## 1. Evidence Sufficiency Gate

Before final Topic generation, assess:

- owned-page crawl coverage
- clarity of the paid offering
- clarity of the paying buyer
- clarity of supported outcomes and limits
- external category and demand evidence
- conflicts between website language and external evidence

Return `researchDecision.status`:

- `confirmed`: strongest business hypothesis has sufficient evidence.
- `provisional`: a usable direction exists, but some assumptions remain.
- `needs_confirmation`: priority offer, paying buyer, or business boundary cannot be reliably determined.

Use `needs_confirmation` when the strongest hypothesis is below 70 confidence, the top hypotheses are close, or the website mixes incompatible business models. Generate only a clearly labelled provisional draft unless the user supplies strategic context.

## 2. Capability Ledger

Build a ledger before generating Topics:

```json
{
  "id": "cap_001",
  "offering": "specific product, service, workflow, or outcome",
  "buyer": "specific paying buyer or user",
  "jobToBeDone": "job the customer helps complete",
  "supportedOutcome": "evidence-backed result",
  "purchaseTriggers": ["events that begin evaluation"],
  "constraints": ["fit limits, prerequisites, exclusions"],
  "geographies": ["supported markets"],
  "evidenceSourceIds": ["src_001"],
  "confidence": 88,
  "status": "confirmed|inferred|unknown"
}
```

High-priority `brand_core` Topics may map only to `confirmed` or strongly supported `inferred` capabilities. Do not classify prompts for `unknown` capabilities as brand core.

This restriction applies to `brand_core`, not to the whole category benchmark. Category and competitor research may produce non-core cells with weaker target-brand serviceability, provided those cells are explicitly labelled and excluded from the core KPI.

## 3. Category Demand And Competitor Capability Maps

Build two maps independently from the target brand:

1. **Category Demand Map**: recurring buyer roles, jobs, triggers, use cases, comparison criteria, risks, implementation questions, pricing questions, and source/review demand across the whole industry.
2. **Competitor Capability Map**: capabilities, buyer segments, markets, positioning, content assets, citations, and decision surfaces occupied by direct, partial, substitute, marketplace, directory, and source competitors.

Use official competitor pages, credible category comparisons, communities, reviews, citations, Dageno data when available, and search demand. One competitor page is evidence of that competitor's claim, not proof of category-wide demand; require multiple independent signals for High-priority industry cells.

## 4. Coverage Layers

Every cell must have one primary `scope` and `metricUse`:

| Scope | Meaning | Serviceability | Metric use |
| --- | --- | --- | --- |
| `brand_core` | Target brand can credibly serve the intent | confirmed / strong inferred | `core_kpi` |
| `industry_benchmark` | Standard category demand not sufficiently represented in brand evidence | any, clearly labelled | `category_benchmark` |
| `competitive_whitespace` | Competitors visibly occupy an adjacent valuable intent | adjacent or currently unsupported | `opportunity_analysis` |
| `out_of_scope_reference` | Relevant to category understanding but not a sensible current target | unsupported | `diagnostic_only` |

A cell may also set `benchmarkMember=true` when it belongs in the full category denominator. Most `brand_core` cells will be benchmark members; narrow proprietary workflows may not be.

Required reporting:

- **Core visibility**: only `metricUse=core_kpi`.
- **Category benchmark visibility**: all `benchmarkMember=true`, including relevant brand-core cells.
- **Competitive whitespace**: `metricUse=opportunity_analysis`, reported as opportunity size/gap rather than failure.
- **Out-of-scope reference**: shown in the industry map but excluded from performance KPIs.

Never average all four layers into one headline visibility number.

## 5. Competitive Decision-Surface Map

Before building cells, create a map of the commercial questions a buyer must resolve before selecting a provider. A surface is valid only when it has evidence of a supported capability and a plausible buyer decision.

```json
{
  "id": "surface_001",
  "label": "supplier quality and factory verification",
  "decisionObject": "category procurement partner",
  "buyerContext": "project procurement lead",
  "proofNeeded": ["certification", "sample approval", "inspection process"],
  "decisionCriteria": ["quality consistency", "factory credibility"],
  "capabilityIds": ["cap_001"],
  "priority": "High",
  "topicImplication": "own Topic",
  "evidenceSourceIds": ["src_001"]
}
```

This is a schema example, not a vertical template. Typical surface families may include offer/category fit, buyer/project workflow, supplier selection, customisation, quality/compliance proof, price/MOQ/TCO, lead time/logistics, implementation, and risk. Do not form a Cartesian product. Merge only when the decision object, buyer context, proof needed, and expected answer entities are compatible.

## 6. Applicable Intent Universe

Read [intent-ontology.md](intent-ontology.md). Broad `intentType` values are reporting families, not a sufficient enumeration system. Build coverage at `intentType + subIntent + decision object + buyer context` granularity.

Construct only combinations that are realistic and supported by the evidence contract for their layer. Candidate dimensions:

- buyer role
- product/service line or decision object
- job-to-be-done
- purchase trigger
- intent type
- sub-intent
- decision criterion
- constraint
- expected answer entity
- target market

Do not create a full Cartesian product. Remove combinations that are unsupported, unnatural for the category, duplicated, or outside the customer's delivery boundary.

Intent types remain:

- `problem_solution`
- `recommendation`
- `comparison`
- `pricing_value`
- `risk_validation`
- `implementation`
- `alternative`
- `local_availability`
- `education_content`
- `brand_validation`

Record excluded intents and reasons. Completeness means all **applicable** intents are covered, not that every Topic contains every intent.

Represent each applicable unit as a coverage cell:

```json
{
  "id": "cell_001",
  "decisionSurface": "supplier quality and factory verification",
  "buyerRole": "ecommerce operations manager",
  "jobToBeDone": "select a post-purchase tracking platform",
  "intentType": "comparison",
  "subIntent": "criteria_comparison",
  "intentUnitId": "post-purchase-platform-carrier-coverage-comparison",
  "decisionCriterion": "carrier coverage",
  "constraint": "multi-region delivery",
  "expectedAnswerType": "provider_comparison",
  "priority": "High",
  "scope": "brand_core",
  "metricUse": "core_kpi",
  "serviceabilityStatus": "confirmed",
  "benchmarkMember": true,
  "competitorEvidenceIds": []
}
```

## 7. Topic Clustering

A Topic is a coherent cluster of coverage cells that share:

- the same core decision object
- the same primary job-to-be-done
- a compatible buyer and buying context

Do not use page sections, feature names, generic funnel stages, or abstract intent labels as Topics.

Select the complete non-overlapping Topic set that covers all High-priority capabilities, jobs, triggers, risks, decision criteria, and decision surfaces. Compactness is secondary to coverage: do not merge surfaces merely to keep a Topic count low. Medium-confidence hypotheses may contribute one exploratory Topic. Low-confidence hypotheses remain warnings.

Each Topic stores:

- `t`, `ty`, `f`, `c`
- `pc`: recommended final prompt count
- `cv`: capability IDs, buyers, jobs, applicable intents, decision criteria, excluded intents, coverage cells and rationale
- `ev`: supporting evidence

## 8. Prompt Candidate Generation

Generate more candidates than needed, then select by marginal intent-unit coverage. A prompt may cover multiple cells only when it remains a natural, single-focus user question.

Generate one canonical Prompt per intent unit. Add a wording variant only when it tests a materially different common phrasing; keep the same `intentUnitId`, assign a shared `variantSetId`, and set `variantPurpose=wording_robustness`. Repeated execution of an identical Prompt belongs in monitoring configuration, not the Prompt library.

Score each candidate:

- `sv`: serviceability score, 0-100
- `dp`: demand plausibility score, 0-100
- `mp`: answer mention likelihood, 0-100
- `cg`: coverage-cell IDs

Acceptance thresholds:

- `brand_core + monitoring_core`: `sv >= 70`, `dp >= 60`, `mp >= 55`
- `brand_core + content_opportunity`: `sv >= 70`, `dp >= 50`; lower mention likelihood is allowed
- `industry_benchmark + monitoring_core`: `dp >= 60`, `mp >= 55`, at least two category evidence IDs; low `sv` is allowed and must remain visible
- `competitive_whitespace + monitoring_core`: `dp >= 60`, `mp >= 55`, competitor evidence plus a stated adjacency/gap rationale
- `out_of_scope_reference`: evidence required, `metricUse=diagnostic_only`; generate sparingly
- otherwise reject

Do not add fixed quotas of `best`, `top`, pricing, comparison, or alternative prompts. Use those forms only when they cover a distinct buyer decision.

## 9. Two Output Pools

### Monitoring Core

Questions likely to make AI answers name products, providers, brands, competitors, or sources. Typical intents include recommendation, comparison, pricing, risk validation, implementation, alternatives and brand validation.

### Content Opportunity

Real, serviceable questions useful for SEO/GEO content planning but less likely to trigger brand mentions. Informational prompts belong here unless they naturally produce entity recommendations or source citations.

The mix is dynamic:

- decision-led categories usually produce 75-90% monitoring-core prompts
- media, education, community and content-led categories may produce 50-70%
- do not apply one global ratio to every business

## 10. Stopping Condition

Stop adding prompts when all conditions hold:

- every High-priority coverage cell is covered
- all material category-standard decision surfaces are either covered or explicitly assigned to benchmark, whitespace, or out-of-scope
- competitor-occupied high-demand surfaces have an opportunity classification
- every applicable core intent is covered
- every material High-priority sub-intent and intent unit is covered or explicitly excluded with a reason
- every core buyer/JTBD combination has representation
- key price, risk, fit, implementation and alternative criteria are covered when applicable
- remaining candidates add no meaningful new coverage
- remaining candidates are unjustified semantic paraphrases or below acceptance thresholds

A narrow Topic may stop at 3-7 intent units. A complex Topic with several evidence-backed buyer contexts, sub-intents and decision surfaces may require 20-32 or more intent units, delivered in batches if needed. A runtime safety ceiling is a pagination boundary, never an ontology ceiling. Never pad to a preset number and never truncate a required surface solely to maintain a familiar count.

## 11. QA Contract

Deterministic QA must verify:

- schema and allowed values
- brand-term policy
- standalone category/context anchor
- exact and semantic duplicates across all Topics
- score thresholds by pool
- valid coverage-cell references
- High-priority cell coverage
- applicable-intent coverage
- applicable sub-intent and intent-unit coverage, including explicit exclusion reasons
- variant grouping and one-unit reporting weight
- decision-surface coverage and explicit handling of uncovered surfaces
- evidence sufficiency by coverage layer
- metric separation: no blended core/category/whitespace/out-of-scope KPI
- evidence retention

Return `qaReport` and `coverageReport`. If QA fails, repair and rerun or expose the failures; never silently label the result complete.

## 12. Intent Coverage Report And Visibility Denominators

Return an `intentCoverageReport` with:

```json
{
  "ontologyVersion": "2.0",
  "businessArchetypes": ["manufacturing_procurement"],
  "materialIntentUnits": 60,
  "coveredCanonicalUnits": 58,
  "wordingVariants": 9,
  "coverageRate": 96.7,
  "excludedUnits": [{"intentUnitId":"...","reasonCode":"low_demand","reason":"..."}],
  "byScope": {},
  "byTopic": {},
  "byPrimaryIntent": {},
  "bySubIntent": {},
  "byBuyerRole": {},
  "blindSpots": []
}
```

Reporting order:

1. Aggregate repeated model runs for the exact Prompt.
2. Aggregate canonical and wording variants to one `intentUnitId` result.
3. Aggregate intent units to sub-intent and Topic results.
4. Aggregate only compatible `metricUse` groups; never blend core KPI, category benchmark, whitespace opportunity and diagnostic reference.

Coverage rate uses semantic intent units, not raw Prompt rows. Excluded units stay visible with reason codes so a high score cannot be created by silently deleting difficult industry demand.
