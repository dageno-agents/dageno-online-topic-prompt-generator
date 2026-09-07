# Brand Visibility Admission

## Goal
Generate questions that reflect real buyer decisions in the client's market AND can support evidence-led GEO work. A question's relevance to the business is necessary but not sufficient for the final brand-monitoring list.

Maintain the full researched intent map. The final service list is a reviewed subset, not a claim that excluded informational demand does not exist.

## The Brandless-Answer Test
Ask: **Could a competent answer fully satisfy this question without evaluating or naming any particular product, provider or brand?**

- If yes, it is usually content planning, not brand competition monitoring.
- A possible brand example, optional citation, or the word best/top is not enough.
- A named source supporting an explanation is not the same as a provider being recommended.
- A publisher, university, community or research service can itself be the buyer's selected destination. Judge the entity's role, not a rigid industry or entity-type rule.
- Branded troubleshooting does not become competitive brand evaluation merely because the question contains the brand name. Reputation/accuracy questions remain an opt-in, separately interpreted brand panel.

This is a semantic design test, not a lexical classifier or a calibrated probability. Do not guarantee that every model answer will contain names or citations.

## Three Purposes, Four Deliveries

| Delivery | Admission | Interpretation |
| --- | --- | --- |
| Service optimization, default CSV | brand_core + approved brand-dependent decision + concrete asset/proof/action plan | Questions the client can credibly compete for now |
| Industry competition benchmark | approved generic brand-dependent decision + benchmarkMember + same-market boundary | Includes relevant brand-core AND non-serviceable industry decisions |
| Citation observation | source/authority is the evidence being requested, not the chosen provider | Source/domain citation, not brand recommendation |
| Content topics | A good answer can remain brandless, or names are incidental | Education, methodology, checklists, operations and supporting assets |

Service and benchmark lists overlap; do not add their counts or import both unlabelled into one KPI denominator.
The four-column importer does not carry pool, scope, policy version or intent ID. Retain the master JSON and separate projects/tags where the monitoring system supports them.
Provisional L3 benchmarks stay project-local; this policy does not override Canonical governance.

## From Knowledge To A Genuine Buyer Decision

Do not rewrite every knowledge query with “best tools for ...”. Instead:

1. Keep the original informational unit and its question.
2. Research whether there is a distinct provider/product decision behind the scenario.
3. If such demand is plausible and evidenced, create a NEW intent unit and new canonical question; link the supporting knowledge unit through relatedContentUnitKeys.
4. Reuse an existing equivalent decision unit rather than manufacturing another question.
5. If no real buying decision exists, retain only the content unit. Never pad the monitoring list.

Examples are illustrations, not industry seeds or verified customer capabilities:

| Knowledge / weak brand-monitoring question | Separate buyer decision, only when evidence supports it |
| --- | --- |
| How can I reduce support response time? | Which customer support systems unify multiple channels and automate assignment? |
| How is battery runtime calculated? | Which custom battery-pack manufacturers offer engineering support for low-power devices? |
| How should a sleeping bag be washed? | Which camping sleeping bags are easy to clean and maintain? |
| What makes an electronic signature legally valid? | Which electronic-signature tools provide verifiable audit trails for business contracts? |

The right column changes the decision being measured. It must not inherit the old unit ID as a mere wording variant. Requirements in that column need market evidence and, for the service list, client capability evidence.

## Review Fields
Every generated question receives an independent visibilityAssessment:

- brandlessAnswerSufficient: whether a complete answer can avoid specific entities;
- entityRole: provider_choice / product_choice / brand_evaluation / citation_source / incidental_example / none;
- expectedEntityType and buyerDecision;
- rationale: why names are necessary, or why the question belongs elsewhere;
- optimization.assets: relevant page/content types;
- optimization.proofNeeded: concrete proof to collect or expose;
- optimization.action: a specific feasible task, not “improve GEO”;
- policyVersion, basis=semantic_review, reviewedPrompt: bind review to the exact question.

Useful assets include product/service pages, scenario pages, comparisons, pricing/terms, integration docs, case evidence, buyer guides, original research and genuine third-party coverage. Select by the decision, not a fixed quota. No fabricated reviews, unsupported compliance claims or guaranteed visibility.

If a real entity-dependent question lacks an action plan, repair the plan or report the gap. Do not misclassify it as knowledge to make QA pass.
If a knowledge question was incorrectly tagged for monitoring, route it to content without changing its meaning. pool_mismatch alone is not a reason to force a commercial rewrite.

## Metrics And Validation
- Apply eligibility independently of target-brand performance. Low target visibility never disqualifies a real competitive question.
- An optional pilot records named-entity roles. Citation-only or incidental mentions do not count as provider/product selection; retain them separately.
- API pilots are not equivalent to consumer ChatGPT/Gemini/AI Overview. Preserve model, locale, time, raw answer and sample denominator.
- Default generation does not perform a pilot; leave measured likelihood unknown.
- Missing or stale reviews block export. An empty eligible service list produces a warning, not a padded or empty “success” CSV.
- Changing admission policy, wording, pool or membership changes the measurement population. Freeze a new baseline or report the common panel; do not call a smaller denominator a GEO visibility improvement.

Executable rules: runtime/visibility-policy.mjs. Independent judgment: semantic_review in runtime/pipeline.mjs. Portable QA enforces the same policy for Codex and hosted artifacts.
