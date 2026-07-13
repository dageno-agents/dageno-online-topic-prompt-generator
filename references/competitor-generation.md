# Competitor Generation

Competitor generation creates an evidence-backed map of who the brand competes with in AI search answers.

Do not output only a single global competitor list. Real competitors vary by country, business line, buyer segment, and differentiation angle.

## Inputs

Use brand intelligence, crawl evidence, category demand search, and optional user inputs:

```json
{
  "brandName": "Brand",
  "domain": "example.com",
  "businessCategory": "AI presentation software",
  "targetCountries": ["United States", "Japan"],
  "businessLines": ["AI slide generation", "team presentation workspace"],
  "targetUsers": ["startup founders", "marketing teams"],
  "jobsToBeDone": ["create pitch decks", "turn docs into slides"],
  "decisionCriteria": ["price", "template quality", "PowerPoint export"],
  "differentiators": ["one-click deck generation from text"],
  "outOfScope": ["offline desktop editing"]
}
```

If target countries are not supplied, infer likely markets from site language, pricing currency, shipping/service areas, case studies, office/contact pages, hreflang, and search signals. Mark inferred countries with lower confidence.

## Competitor Types

Classify every competitor:

- `direct`: same category, same primary job-to-be-done, similar buyer.
- `partial`: overlaps one product line or use case, but not the whole business.
- `substitute`: different category, solves the same user problem.
- `enterprise_or_upmarket`: same job, different buyer scale or buying motion.
- `local_or_country_specific`: important in one country/market.
- `marketplace_or_directory`: not a vendor, but influences AI/source answers.
- `source_competitor`: review sites, media, communities, or reference pages that compete for citation and narrative control.

## Search Strategy

For each country and business line, search:

- `[brand] alternatives [country]`
- `[brand] competitors`
- `best [category] for [persona/use case]`
- `[category] [country]`
- `[business line] software/tool/service comparison`
- `[category] reviews`
- `[category] pricing comparison`
- `[substitute category] alternatives`
- `[category] reddit` or local community equivalents

For multilingual markets, use the local language when possible. Keep the language and country in each evidence source.

## Differentiation Analysis

Before ranking competitors, identify the target brand's core differentiators:

- product line coverage
- deployment model
- pricing and packaging
- buyer segment
- workflow/integration fit
- geographic availability
- content/source authority
- compliance/security claims
- service model or support
- technical depth or ease of use

Then compare competitors against those differentiators. A market leader is not always the best comparator if the target brand is earlier-stage, cheaper, local, vertical-specific, or focused on one workflow.

## Output Schema

```json
{
  "competitorMap": [
    {
      "name": "Competitor",
      "domain": "competitor.com",
      "countries": ["United States"],
      "businessLines": ["AI slide generation"],
      "competitorType": "direct",
      "overlapScore": 86,
      "visibilityRisk": "high|medium|low",
      "buyerSegment": "startup founders and marketing teams",
      "overlapReason": "Targets the same AI presentation creation workflow.",
      "differentiationAngle": "More template-led and design-system-driven than the target brand.",
      "promptAngles": [
        "best AI presentation software for startup pitch decks",
        "AI presentation tools with PowerPoint export"
      ],
      "evidence": {
        "sourceIds": ["src_021"],
        "confidence": 86,
        "warnings": []
      }
    }
  ]
}
```

## Use In Topic And Prompt Design

Competitors should influence:

- `competitive_alternative` Topics.
- BOFU comparison, alternative, review, and pricing prompts.
- Differentiation prompts that test whether AI answers recognize the target brand's real edge.
- Country-specific monitoring when markets differ.

Rules:

- In `brandPromptMode=exclude`, do not include competitor names in `generic` prompts.
- In `brandPromptMode=include`, do not include competitor names unless the user explicitly requests it.
- In `brandPromptMode=mixed`, limit `competitive` prompts to comparison or alternative scenarios and keep them realistic.
- Do not invent competitor names. If evidence is weak, classify as `source_competitor` or add a warning.

## Competitor Intent Mining

Competitor research must do more than populate a related-brand column. For each credible competitor, extract:

- capabilities and product lines the target brand does not clearly support
- buyer roles and industries addressed
- high-intent use cases and purchasing triggers
- comparison criteria, risks, implementation requirements, pricing models, and proof assets
- recurring categories in cited pages, reviews, communities, and AI answers
- regions, languages, integrations, or delivery models that expand the category boundary

Aggregate these into industry decision surfaces. A competitor-only claim becomes `competitive_whitespace` when it has demand and adjacency evidence. It becomes `out_of_scope_reference` when the target brand has no credible route to serve it. Multiple competitors plus independent demand evidence may establish an `industry_benchmark` surface.

Do not promote every competitor feature into a Topic. Require buyer demand, category relevance, and a materially distinct answer set.
