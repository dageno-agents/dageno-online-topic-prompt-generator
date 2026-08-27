# Agent Guide

This guide describes the mandatory execution order for an agent or hosted implementation.

## Required Order

1. Normalize the domain.
2. Crawl high-signal owned pages and record attempted/effective URLs.
3. Run universal brand, competitor, review, and buying-context search.
4. Produce 2-4 business hypotheses when the business is ambiguous.
5. Identify the economic center, primary decision object, and paying buyer.
6. Build the Capability Ledger.
7. Resolve every material business line to a confirmed or provisional Canonical L3 market boundary.
8. Run category-demand research from that market boundary.
9. Build a market-aware competitor/source map with same-L3, adjacent-L3, substitute and source-only relations.
10. Construct the applicable serviceable-intent universe and market-aware coverage cells.
11. Generate the smallest complete Topic set; every Topic carries a market anchor.
12. Generate a coverage-driven number of Prompts for each Topic.
13. Run deterministic QA, including market-boundary checks.
14. If QA fails, regenerate once from the QA errors.
15. If the second attempt fails, stop and return the error.
16. Export Markdown, CSV, or JSON only after QA passes.

## Hard Failure Policy

When a model runtime is configured, never replace failed model research or missing Prompt rows with an industry scenario library.

Hosted production execution must stop when OpenRouter is missing, the selected model is unavailable, or the required model stages fail after one repair attempt. It must never silently return an industry template as successful Skill output.

A portable offline implementation may expose an explicitly requested `rules_fallback` mode for development only. It must be visibly labeled, excluded from client-ready output, and never enabled automatically by a hosted product.

## Evidence Sufficiency

Mark research as `needs_confirmation` when:

- the top business hypothesis is below 70 confidence
- the top two hypotheses are close
- the paying buyer is unclear
- the priority revenue line cannot be determined
- crawl and external evidence conflict materially

Do not convert low-confidence hypotheses into core Topics.

## Canonical L3 Boundary

Read `references/canonical-l3-market-boundary.md` after business-line identification. The Skill consumes Canonical taxonomy in read-only mode:

- reuse only IDs supplied by the current catalog,
- leave IDs empty for provisional or review-required candidates,
- keep product, software, provider/service and organization markets separate,
- use same-L3 demand for formal industry benchmarks,
- route adjacent markets to whitespace or out-of-scope,
- decompose composite Topics unless the provider, buyer, workflow and fragmentation tests support one coherent market.

## Search And Competitor Rules

Do not stop at brand-name searches. Run category-demand and disconfirmation searches using real category, persona, pain, pricing, review, alternative, integration, and community language.

Competitor research must produce a map rather than a flat global list. Include countries, business lines, buyer segments, overlap type, differentiation angle, and evidence confidence. Read `references/category-demand-search.md`, `references/competitor-generation.md`, and `references/evidence-schema.md`.

## Topic Rules

Good Topics share one decision object and JTBD:

- `AI Citation & Source Intelligence`
- `Cloud Scraping Browser & Browser Automation`
- `Supplier Quality & Factory Verification`
- `Appointment, Price & Local Availability`

Weak Topics are generic labels:

- `Features`
- `Solutions`
- `Product Discovery`
- `Workflow Automation`

Every core Topic must map to at least one confirmed or strongly inferred capability.

## Prompt Rules

Every Prompt must:

- make sense without seeing the Topic title
- describe a concrete category, service, workflow, buyer, or scenario
- be serviceable by the customer
- add a distinct coverage cell
- use realistic natural language
- respect brand-term mode
- include evidence and exactly two keyword phrases

Dageno sends each Prompt independently, without its Topic title or previous chat context. Cross-industry nouns such as `supplier`, `vendor`, `platform`, `service`, `manufacturer`, `cost`, and `pricing` therefore require an explicit category or scenario anchor inside the Prompt itself.

Good: `Hotel one-stop procurement cost vs multiple suppliers?`

Weak: `One-stop procurement cost vs multiple suppliers?`

Do not append fixed quotas of `best`, `top`, comparison, or informational prompts. Add them only when they represent uncovered buyer decisions.

## Two Pools

Use `monitoring_core` when the question is likely to make an AI answer name a product, provider, brand, competitor, or source.

Use `content_opportunity` for serviceable educational demand with lower brand-mention probability.

The pool ratio depends on the business model. Do not enforce one percentage across every industry.

## QA Gate

Before delivery, verify:

- dynamic Prompt count is satisfied for every Topic
- every High-priority coverage cell is covered
- every declared applicable intent is represented
- there are no cross-Topic semantic duplicates
- generic Prompts contain no owned or competitor brand names
- Prompt wording contains a standalone business anchor
- coverage IDs and evidence metadata are present
- monitoring-core score thresholds are satisfied

Read [Prompt QA](../references/prompt-qa.md) and run `scripts/prompt_qa.py` for portable validation.
