# V3 Output Contract

## Source Of Truth
`runtime/contract.mjs`: version, intent registry, scopes, IDs, locale and CSV rules.
`runtime/schemas.mjs`: stage JSON schemas.
`runtime/validators.generated.mjs`: precompiled Ajv validators, usable without runtime eval in Cloudflare.
`runtime/qa.mjs`: deterministic reference, business, intent, cluster and final artifact checks.
`runtime/pipeline.mjs`: ordered research, independent review, transport pagination and delivery.

Model responses do not get passing default scores or fabricated evidence to satisfy schema validation.
Transport size is bounded; business coverage is not capped by transport size.
Topic f means priority; Prompt f means funnel. V3 human-facing UI uses explicit labels.

## Master Artifact
Required fields include:
- schemaVersion, skillVersion, domain, generatedAt, taxonomyVersion;
- monitoringConfig: country, language, region policy, generation model vs monitoring model;
- businessResearch, decisionSurfaces, intentRegistry, exclusions, deferredUnits;
- generatedTopics: id, topic, rationale, type/priority, marketAnchor, prompts;
- evidenceSources, competitorMap, crawlReport, researchTrace;
- coverageChallenge, semanticReview, qaReport, coverageReport;
- entityPilot (not_run by default), versionDiff.

One accepted prompt maps to one canonical intentUnitId, one Topic and one scope.
benchmarkMember is independent of scope. Evidence references must resolve to the actual source registry.
The UI and export consume generatedTopics directly. Markdown is presentation, not a database.

## Dageno Import
Exactly four columns, unchanged:
```csv
topic,prompt,regions,language
```
Use ISO country and BCP-47 language, e.g. US/en-US or TW/zh-TW.
Default import contains independently approved brand_core monitoring_core questions. Use --dataset benchmark, citation or content for separate deliveries. Service and industry benchmark overlap and must not be summed or imported unlabelled into one KPI.
V3.1 requires monitoringPolicyVersion=brand_visibility.v1 and a visibilityAssessment bound to each exact question. Entity role, brandless-answer sufficiency and the content/proof/action plan determine admission, not keyword heuristics.
Master JSON adds visibilityReport (counts and Topics without service monitors) and optimizationBriefs. Content-only and citation rows use content_planning and citation_diagnostic respectively, never core_kpi.
Keep full JSON for IDs, evidence, pool, benchmark and version metadata; the four-column importer cannot transport these fields.
Use an explicitly separate export for content opportunities. Do not combine all layers into one unlabelled KPI.
