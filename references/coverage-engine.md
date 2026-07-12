# Serviceable Intent Coverage Engine

This is the canonical Topic/Prompt planning algorithm.

## First Principle

The generator succeeds only when it produces a complete, non-redundant Topic and Prompt system covering the customer's **serviceable intent universe** and **competitive decision surfaces**.

Every accepted prompt must satisfy four conditions:

1. **Serviceability**: the customer can credibly fulfill the implied need.
2. **Demand plausibility**: a real target buyer is likely to ask the question.
3. **Monitoring value**: the answer is likely to mention products, providers, brands, competitors, or trusted sources; otherwise the prompt must be explicitly classified as a content opportunity.
4. **Marginal coverage**: the prompt covers at least one relevant intent cell not already covered by a stronger prompt.

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

High-priority Topics may map only to `confirmed` or strongly supported `inferred` capabilities. Do not create prompts for `unknown` capabilities.

## 3. Competitive Decision-Surface Map

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

## 4. Applicable Intent Universe

Construct only combinations that are both realistic and serviceable. Candidate dimensions:

- buyer role
- product/service line or decision object
- job-to-be-done
- purchase trigger
- intent type
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
  "decisionCriterion": "carrier coverage",
  "constraint": "multi-region delivery",
  "expectedAnswerType": "provider_comparison",
  "priority": "High"
}
```

## 5. Topic Clustering

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

## 6. Prompt Candidate Generation

Generate more candidates than needed, then select by marginal coverage. A prompt may cover multiple cells only when it remains a natural, single-focus user question.

Score each candidate:

- `sv`: serviceability score, 0-100
- `dp`: demand plausibility score, 0-100
- `mp`: answer mention likelihood, 0-100
- `cg`: coverage-cell IDs

Acceptance thresholds:

- `monitoring_core`: `sv >= 70`, `dp >= 60`, `mp >= 55`
- `content_opportunity`: `sv >= 70`, `dp >= 50`; lower mention likelihood is allowed
- otherwise reject

Do not add fixed quotas of `best`, `top`, pricing, comparison, or alternative prompts. Use those forms only when they cover a distinct buyer decision.

## 7. Two Output Pools

### Monitoring Core

Questions likely to make AI answers name products, providers, brands, competitors, or sources. Typical intents include recommendation, comparison, pricing, risk validation, implementation, alternatives and brand validation.

### Content Opportunity

Real, serviceable questions useful for SEO/GEO content planning but less likely to trigger brand mentions. Informational prompts belong here unless they naturally produce entity recommendations or source citations.

The mix is dynamic:

- decision-led categories usually produce 75-90% monitoring-core prompts
- media, education, community and content-led categories may produce 50-70%
- do not apply one global ratio to every business

## 8. Stopping Condition

Stop adding prompts when all conditions hold:

- every High-priority coverage cell is covered
- every applicable core intent is covered
- every core buyer/JTBD combination has representation
- key price, risk, fit, implementation and alternative criteria are covered when applicable
- remaining candidates add no meaningful new coverage
- remaining candidates are semantic paraphrases or below acceptance thresholds

A narrow Topic may stop at 3-7 prompts. A complex Topic with several evidence-backed buyer contexts and decision surfaces may require 20-32 prompts, or a follow-on scope if it exceeds a single-run safety limit. Never pad to a preset number and never truncate a required surface solely to maintain a familiar count.

## 9. QA Contract

Deterministic QA must verify:

- schema and allowed values
- brand-term policy
- standalone category/context anchor
- exact and semantic duplicates across all Topics
- score thresholds by pool
- valid coverage-cell references
- High-priority cell coverage
- applicable-intent coverage
- decision-surface coverage and explicit handling of uncovered surfaces
- evidence retention

Return `qaReport` and `coverageReport`. If QA fails, repair and rerun or expose the failures; never silently label the result complete.
