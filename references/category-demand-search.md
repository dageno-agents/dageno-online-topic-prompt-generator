# Category Demand Search

Category demand search finds how users ask about the product category, not only how the brand describes itself.

Use it after initial brand intelligence identifies a likely category, target users, jobs-to-be-done, business lines, and markets.

## Portable Inputs

```json
{
  "brandName": "Brand",
  "domain": "example.com",
  "businessCategory": "AI presentation software",
  "targetCountries": ["United States", "Japan"],
  "businessLines": ["AI slide generation", "team presentation workspace"],
  "targetUsers": ["startup founders", "marketing teams"],
  "jobsToBeDone": ["turn notes into slides", "create pitch decks quickly"],
  "decisionCriteria": ["price", "template quality", "PowerPoint export", "team collaboration"],
  "regionMode": "dageno_ip_controlled|query_localized|unknown"
}
```

This reference is tool-agnostic. A hosted runtime may use SerpAPI, Bing Web Search, Google Custom Search, Brave Search, Tavily, Exa, internal search, or Dageno search services. Store the provider in `provider`.

## Query Families

Generate queries from real category, persona, JTBD, pain, decision criteria, business line, and country signals.

Use these families:

- Category selection: `best [category] for [persona/use case]`
- Provider/vendor selection: `top [category/provider type] for [buyer role]`
- Problem-solution: `[pain point] solution`, `how to [job-to-be-done]`
- Pricing/value: `[category] pricing`, `[category] cost`, `[category] ROI`
- Reviews/proof: `[category] reviews`, `[category] case studies`, `[category] benchmark`
- Alternatives: `[category] alternatives`, `[incumbent/substitute] alternatives`
- Comparison: `[option A] vs [option B] for [use case]`
- Implementation: `[category] integration [workflow/tool]`, `[category] implementation`
- Community/source: `[category] reddit`, `[category] forum`, `[category] expert review`
- Local/country when relevant: `[category] [country]`, `best [category] in [country]`

If Dageno IP controls region, do not add country terms to prompts by default. Country terms can still be used for competitor discovery and market mapping.

## Result Normalization

For every search result, normalize:

```json
{
  "query": "best AI presentation software for startups",
  "provider": "serpapi",
  "country": "United States",
  "language": "en",
  "title": "Best AI presentation tools",
  "url": "https://example-review-site.com/best-ai-presentation-tools",
  "domain": "example-review-site.com",
  "snippet": "Comparison of AI slide generators...",
  "rank": 3,
  "resultType": "review|comparison|vendor|marketplace|community|official|article|unknown",
  "mentionedBrands": ["Brand A", "Brand B"],
  "demandSignal": "category_selection|pricing_value|review_reputation|alternative|implementation|community",
  "evidenceStrength": "strong|medium|weak"
}
```

## Use In Generation

Category demand search should influence:

- `topicSeeds`: demand clusters that appear repeatedly across query families.
- `competitors`: brands, substitutes, directories, marketplaces, and review sources that appear for the same user need.
- `promptLanguage`: wording real users use in queries.
- `contentGaps`: high-intent demand with weak owned-site coverage.
- `evidence`: query/result pairs that justify Topics, Prompts, and competitors.

Do not treat a single search result as final truth. Prefer repeated evidence across official pages, review pages, comparison pages, community discussions, and category searches.

