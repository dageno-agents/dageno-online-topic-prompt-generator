# Evidence Schema

Evidence metadata makes generated assets reviewable. It answers: "Why did the system generate this Topic, Prompt, or competitor?"

Use short evidence objects in machine output. In client-facing Markdown, summarize the same facts in readable prose.

## Evidence Source

```json
{
  "id": "src_001",
  "type": "crawl|search|model_inference|user_input|dageno_data|manual",
  "url": "https://example.com/pricing",
  "title": "Pricing",
  "query": "AI presentation software pricing",
  "country": "United States",
  "businessLine": "AI slide generation",
  "snippet": "Teams can create presentations with AI...",
  "observedAt": "YYYY-MM-DD",
  "strength": "strong|medium|weak"
}
```

## Topic Evidence

```json
{
  "topic": "AI Presentation Software Selection",
  "evidence": {
    "sourceIds": ["src_001", "src_014"],
    "mappedPages": ["/features", "/pricing"],
    "demandSignals": ["best AI presentation software", "AI slide generator pricing"],
    "businessLines": ["AI slide generation"],
    "countries": ["United States"],
    "competitorLinks": ["Beautiful.ai", "Canva", "Tome"],
    "confidenceReason": "Official pages and category searches both show buyer demand for selecting AI presentation tools.",
    "warnings": []
  }
}
```

Topic machine output should also retain `pc` and `cv` from [coverage-engine.md](coverage-engine.md), including capability IDs and coverage cells.

## Prompt Evidence

```json
{
  "prompt": "best AI presentation software for startup pitch decks",
  "evidence": {
    "sourceIds": ["src_014", "src_018"],
    "demandSignals": ["best AI presentation software", "pitch deck generator"],
    "intentJustification": "The query asks for provider selection in a high-intent startup pitch deck scenario.",
    "expectedAnswerType": "recommendation|comparison|pricing|risk_validation|implementation|source_summary",
    "serviceabilityScore": 90,
    "demandPlausibilityScore": 82,
    "mentionLikelihoodScore": 86,
    "pool": "monitoring_core|content_opportunity",
    "coverageCellIds": ["cell_001"],
    "geoMonitoringValue": "high|medium|low",
    "seoKeywordConfidence": "high|medium|low",
    "warnings": []
  }
}
```

## Competitor Evidence

```json
{
  "competitor": "Beautiful.ai",
  "evidence": {
    "sourceIds": ["src_021", "src_022"],
    "countries": ["United States"],
    "businessLines": ["AI slide generation", "team presentation workspace"],
    "overlapType": "direct|partial|substitute|directory|source",
    "overlapReason": "Appears in category comparison results and targets team presentation creation.",
    "differentiationAngle": "Template-led team presentation workflow vs AI-first slide generation.",
    "confidence": 88,
    "warnings": []
  }
}
```

## Rules

- Prefer cited crawl/search evidence over model-only inference.
- Use `model_inference` only when it clearly follows from provided evidence.
- Keep snippets short. Do not store full raw crawl logs in final output.
- If evidence is weak, lower confidence and add a warning.
- Do not fabricate source URLs, search results, customer data, certifications, or country coverage.
- Do not discard `ev`, `cv`, `cg`, or score fields during normalization/rendering; evidence and coverage must survive to API output and QA.
