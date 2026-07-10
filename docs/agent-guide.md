# Agent Guide

This guide describes the mandatory execution order for an agent or hosted implementation.

## Required Order

1. Normalize the domain.
2. Crawl high-signal owned pages and record attempted/effective URLs.
3. Run universal brand, competitor, review, and buying-context search.
4. Produce 2-4 business hypotheses when the business is ambiguous.
5. Identify the economic center, primary decision object, and paying buyer.
6. Build the Capability Ledger.
7. Run category-demand research from the evidence-backed category.
8. Build a market-aware competitor/source map.
9. Construct the applicable serviceable-intent universe and coverage cells.
10. Generate the smallest complete Topic set.
11. Generate a coverage-driven number of Prompts for each Topic.
12. Run deterministic QA.
13. If QA fails, regenerate once from the QA errors.
14. If the second attempt fails, stop and return the error.
15. Export Markdown, CSV, or JSON only after QA passes.

## Hard Failure Policy

When a model runtime is configured, never replace failed model research or missing Prompt rows with an industry scenario library.

Static fallback is allowed only when no valid model runtime is available. It must be labeled `rules_fallback` and is not client-ready without review.

## Evidence Sufficiency

Mark research as `needs_confirmation` when:

- the top business hypothesis is below 70 confidence
- the top two hypotheses are close
- the paying buyer is unclear
- the priority revenue line cannot be determined
- crawl and external evidence conflict materially

Do not convert low-confidence hypotheses into core Topics.

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
