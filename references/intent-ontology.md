# Intent Ontology And Enumeration Rules

Use this reference after business research and before coverage-cell construction. It adds an operator-friendly intent layer without replacing evidence-led Topic planning.

## 1. Why Two Intent Levels Exist

`it` is the stable reporting family. `subIntent` is the concrete question the user is trying to resolve.

Example:

```json
{
  "it": "comparison",
  "subIntent": "vs_named",
  "intentUnitId": "battery-cell-format-comparison"
}
```

Do not use a broad family such as `risk_validation` as proof that reviews, compliance, reliability and quality verification are all covered. They are separate sub-intents.

## 2. Business Archetypes

Classify each business line, not the whole company, into one or more evidence-backed archetypes:

- `consumer_goods`
- `consumer_app`
- `local_service`
- `b2b_saas`
- `api_infrastructure`
- `manufacturing_procurement`
- `professional_service`
- `education_program`
- `regulated_finance`
- `healthcare_wellness`
- `marketplace_platform`
- `media_community`
- `hybrid`

Archetypes select candidate intent modules; they do not determine Topics or force every listed intent. A hybrid brand can use different archetypes for different business lines.

Never reduce all non-SaaS businesses to `consumer_goods`. Buyer, user and payer may also differ in manufacturing, education, healthcare, finance, marketplaces and professional services.

## 3. Canonical Sub-Intent Registry

Use the following IDs. Add a new domain-specific sub-intent only when it represents a materially different decision, expected answer set or proof requirement.

| `it` | Allowed `subIntent` examples |
| --- | --- |
| `problem_solution` | `problem_diagnosis`, `achieve_outcome`, `replace_manual_process`, `trigger_response` |
| `recommendation` | `best_overall`, `scenario_fit`, `budget_selection`, `premium_selection`, `provider_shortlist`, `audience_fit` |
| `comparison` | `comparison_within`, `vs_named`, `concept_comparison`, `criteria_comparison`, `bundle_or_route_comparison` |
| `pricing_value` | `price`, `fee_structure`, `total_cost`, `hidden_fees`, `free_trial`, `billing_model`, `credit_usage_limits`, `quote_request`, `roi_value`, `contract_warranty`, `moq_payment_terms` |
| `risk_validation` | `reviews_reputation`, `worth_it`, `pros_cons`, `pre_purchase_check`, `requirement_fit`, `personal_suitability`, `compliance_audit`, `data_security`, `privacy_data_handling`, `commercial_usage_rights`, `output_quality`, `reliability_support`, `quality_verification`, `supply_delivery_risk` |
| `implementation` | `how_it_works`, `how_to_achieve`, `onboarding_install`, `integration_sso`, `api_sdk`, `migration_switching`, `permissions_multi_account`, `export_workflow`, `operations_maintenance` |
| `alternative` | `category_alternative`, `competitor_alternative`, `substitute_method`, `switch_provider` |
| `local_availability` | `local_provider`, `where_to_buy`, `inventory_availability`, `delivery_coverage`, `appointment_wait_time` |
| `education_content` | `definition`, `types`, `benefits`, `principles_trends`, `checklist_framework`, `source_research` |
| `brand_validation` | `brand_fit`, `brand_capability`, `brand_pricing`, `brand_reputation`, `brand_trust`, `brand_alternative` |

Three comparison forms must remain distinct:

- `comparison_within`: choose among several candidate providers, products or routes.
- `vs_named`: directly compare named brands, models, specifications or ingredients. Brand names follow `brandPromptMode`; non-brand specifications can remain generic.
- `concept_comparison`: compare two types or approaches before a shortlist exists.

## 4. Archetype Modules

Use these as recall prompts during enumeration, not mandatory quotas.

- Consumer goods: scenario fit, budget/premium choice, where to buy, stock, reviews, worth it, personal suitability, specifications, total cost, warranty.
- Consumer app: task fit, ease of use, device access, free tier, subscription or credits, usage limits, output/export quality, privacy, commercial rights and alternatives.
- Local service: local provider, service fit, availability, appointment/wait time, reviews, credentials, quote, travel/service area, aftercare.
- B2B SaaS: replace manual process, team fit, compliance, data security, integrations/SSO, API, migration, permissions, trial, billing model, reliability/support.
- API/infrastructure: capability limits, performance/reliability, developer integration, SDK, usage pricing, security/compliance, scale, migration and managed support.
- Manufacturing/procurement: supplier shortlist, specification fit, OEM/customisation, sample approval, certification/audit, quality consistency, MOQ/payment, lead time, landed cost, logistics and supply risk.
- Professional service: problem diagnosis, provider fit, methodology, credentials, scope, quote, timeline, deliverables, confidentiality, proof/results.
- Education program: learner fit, outcomes, curriculum, admissions, mode/location, faculty credibility, tuition/total cost, support, recognition and progression.
- Regulated finance: eligibility, product/route comparison, fees, suitability, risk, regulation, custody/security, execution/reliability, support and jurisdiction.
- Healthcare/wellness: suitability, evidence, safety/contraindications, provider credentials, expected outcomes, cost/coverage, access and follow-up.
- Marketplace/platform: supply breadth, quality control, transaction model, matching/discovery, fees, trust/safety, fulfilment, dispute/support and alternatives.
- Media/community: discovery, audience fit, authority, source quality, coverage breadth, freshness, participation and subscription/value.

## 5. Enumeration Procedure

For every decision surface:

1. Identify the decision object, buyer/user/payer roles, trigger, job, criteria, constraints, proof required and expected answer entities.
2. Select applicable archetype modules.
3. Enumerate applicable `it + subIntent` pairs independently for `brand_core`, `industry_benchmark` and `competitive_whitespace`.
4. Search category and competitor evidence for missing sub-intents. Do not let the target website define the whole industry universe.
5. Record every excluded material sub-intent with `not_applicable`, `insufficient_evidence`, `unsupported_by_brand`, or `low_demand` and a reason.
6. Cluster cells into Topics only after enumeration. Topic count is a result, not an input.

Completeness is reached when all material intent units are covered or explicitly excluded. It is not reached merely because every broad `it` appears once.

## 6. Intent Units, Variants And Sampling

An `intentUnitId` represents one semantic buyer question. A wording variant does not create a new unit.

- `canonical`: the strongest natural wording for an intent unit.
- `wording_robustness`: a materially different natural phrasing used to test query sensitivity.
- `model_repeat`: do not add another library row. Repeat the exact canonical prompt in the monitoring scheduler.

Use `variantSetId` to group canonical and wording variants. Usually create one canonical prompt. Add 1-2 wording variants only when evidence shows multiple common phrasings or wording could change retrieval. Never require 3-5 variants mechanically.

Visibility reporting must weight one intent unit once. If several wording variants are monitored, aggregate them to the intent unit before Topic/category reporting. Do not let paraphrases inflate the denominator or apparent coverage.

## 7. Monitoring Versus Content Value

Set `expectedEntityType` to one of:

- `brand_or_provider`
- `product_or_model`
- `source_or_authority`
- `method_or_concept`

Recommendation, comparison, price, review, supplier, alternative and fit questions usually belong in `monitoring_core` when they can naturally name entities. Pure definitions or generic how-to questions usually belong in `content_opportunity`, unless the expected answer naturally cites products, providers or trusted sources.

Do not delete informational industry demand. Keep it in the appropriate pool and metric layer so the panel shows both AI visibility and content opportunity without blending them.
