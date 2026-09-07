# Canonical L3 Market Boundary Contract

Use this contract between brand intelligence and category-demand/competitor research.

## Purpose

Canonical L3 answers: **What stable market does this business line meaningfully compete in?**

It does not replace Topic or Prompt:

- L3 defines the stable market and comparison denominator.
- Topic groups buyer questions sharing one decision object and core job.
- Intent Unit represents one irreducible semantic buyer question.
- Prompt is the natural-language query used for monitoring.

One L3 may contain many Topics. A diversified company may map to several L3s.

## Read-Only Rule

This Skill is not a taxonomy-authoring system.

- When the current Canonical catalog is supplied, the resolver may return `REUSE_EXACT` or `REUSE_SEMANTIC` with an existing stable ID.
- When no catalog match is supplied, return a proposed market boundary with `NEEDS_HUMAN_REVIEW` and an empty `canonicalL3Id`.
- Never invent a production Canonical ID.
- `KEEP_NEW_L3` is a governance-review proposal, not a production assignment.
- Retrieval failure is not proof of a taxonomy gap.

## Assignment Unit

Map each material business line independently:

```json
{
  "assignmentId": "market_001",
  "businessLineId": "line_001",
  "businessLine": "electronic signature workflow",
  "canonicalL3Id": "canonical://g2/e-signature",
  "canonicalL3Name": "E-Signature Software",
  "proposedL3Name": "",
  "objectType": "software",
  "relation": "primary",
  "decision": "REUSE_EXACT",
  "taxonomyStatus": "confirmed",
  "granularityRelation": "EQUIVALENT",
  "definition": "Software used to create, send, sign, track, and manage legally binding electronic signature workflows.",
  "boundaryExclusions": ["contract lifecycle management software", "document generation software"],
  "comparableSet": ["providers buyers directly compare for this market"],
  "evidenceSourceIds": ["src_001", "src_004"],
  "confidence": 0.94,
  "reviewRequired": false,
  "reason": "Official product pages and supplied Canonical candidates support the same market boundary."
}
```

Allowed `relation`: `primary`, `secondary`, `adjacent`, `candidate_needs_review`.

Allowed `taxonomyStatus`:

- `confirmed`: an existing Canonical ID was reused from the supplied catalog.
- `provisional`: a stable boundary is supported, but no production ID was resolved.
- `needs_human_review`: boundary, decomposition, object type, or catalog match is uncertain.

## L3 Admission Tests

A stable L3 market boundary must pass:

1. **Market identity**: recognizable product, software, provider/service, or organization/industry market.
2. **Comparable set**: coherent direct competitor/provider and buyer-selection context.
3. **Direct assignability**: a business line can be directly assigned from evidence.
4. **Stable boundary**: not mainly a feature, use case, audience, geography, channel, material, style, price tier, or temporary trend.
5. **Object-type integrity**: product, software, provider/service, and organization markets remain distinct even when labels share words.

Choose the narrowest valid market identity clearly supported by evidence. Do not use broad fallback categories as production assignments.

## Candidate Decisions

Use one: `REUSE_EXACT`, `REUSE_SEMANTIC`, `KEEP_NEW_L3`, `HIERARCHY_ONLY`, `DECOMPOSE`, `REJECT_NOT_MARKET_IDENTITY`, `REJECT_ATTRIBUTE_OR_USECASE`, `REJECT_SOURCE_OVERLAP`, or `NEEDS_HUMAN_REVIEW`.

Only `REUSE_EXACT` and `REUSE_SEMANTIC` with an ID present in the supplied current catalog may set `taxonomyStatus=confirmed`.

## Composite Market Review

Names containing `&`, `and`, `/`, or `+` trigger review; punctuation is not an automatic failure.

Evaluate provider overlap, buyer/procurement overlap, workflow/use-context overlap, and whether splitting improves market identity rather than creating useless fragmentation.

```json
{
  "conjunctionReview": {
    "providerOverlap": "PASS|FAIL",
    "buyerOverlap": "PASS|FAIL",
    "workflowOverlap": "PASS|FAIL",
    "fragmentationTest": "PASS|FAIL",
    "decision": "KEEP_COMBINED|SIMPLIFY_NAME|DECOMPOSE"
  }
}
```

If independent competitor sets or buying decisions exist, use `DECOMPOSE`.

## Downstream Rules

### Category Demand

- `industry_benchmark` should use demand from the same confirmed L3.
- When L3 is provisional, mark the benchmark provisional; do not use it for cross-brand or historical category comparison.
- Adjacent L3 demand belongs in `competitive_whitespace` or `out_of_scope_reference`.

### Competitors

Classify each competitor/source as `same_l3`, `adjacent_l3`, `substitute`, `source_only`, or `unresolved`. Only `same_l3` belongs in the direct-market comparable set.

### Topics

Every Topic needs a `marketAnchor`:

```json
{
  "assignmentId": "market_001",
  "canonicalL3Id": "canonical://g2/e-signature",
  "canonicalL3Name": "E-Signature Software",
  "proposedL3Name": "",
  "taxonomyStatus": "confirmed",
  "marketRelation": "same_l3",
  "objectType": "software"
}
```

A cross-L3 Topic is allowed only after composite-market review resolves to `KEEP_COMBINED`; otherwise decompose it.

### Coverage Cells And Metrics

Every cell stores its market assignment and relation. Aggregate:

```text
Prompt response → Intent Unit → Topic → Canonical L3 → optional L2/L1 summary
```

Wording variants count once at Intent Unit level. Do not compare or merge provisional L3 metrics across brands or taxonomy versions.

## Governance Metadata

Retain `taxonomyVersion`, `catalogRetrievedAt`, `resolverMode`, review decision, assignment ID, and stable Canonical ID when available.

L1/L2 are organizational context. They must not override the narrowest valid L3 boundary.
