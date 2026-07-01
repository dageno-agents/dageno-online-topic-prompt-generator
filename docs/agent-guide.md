# Agent Guide

This guide explains how an agent should execute the Skill.

## Execution Order

1. Normalize the input domain.
2. Crawl the website and record attempted URLs.
3. Search the web for brand/category/competitor/review context.
4. Run model-led brand intelligence.
5. Decide Topic count.
6. Generate Topic JSON.
7. Generate Prompt JSON for each Topic.
8. Expand each Topic with 4-5 decision-stage prompts.
9. Render grouped Markdown.
10. Export CSV when requested.

## Brand Intelligence First

Do not start with a static industry library.

The first model call should identify:

- what the website actually sells
- who buys or uses it
- what jobs-to-be-done matter
- what criteria users compare
- what the brand does not appear to support
- which competitors or substitute sources matter

If this step fails, use rule fallback but label the output.

## Topic Rules

Topics should be demand clusters, not UI labels.

Good:

- `AI Search Visibility Platform Selection`
- `Appointment Booking And Local Barber Availability`
- `Portable Power Station Brand Comparison`

Weak:

- `Features`
- `Solutions`
- `Product Discovery`
- `Workflow Automation`

## Prompt Rules

Prompts should sound like real user queries.

Each prompt must also work as a standalone monitoring query. Dageno sends prompts one by one without the Topic name, prior chat, brand context, or human explanation. If a prompt uses cross-industry words like `supplier`, `vendor`, `procurement`, `platform`, `service`, `manufacturer`, `cost`, or `pricing`, add the industry/category/use-case anchor inside the prompt itself.

Good:

- `Best AI search visibility platforms for SaaS teams`
- `Which barber shops offer same-day beard trim appointments?`
- `Portable power station pricing and warranty comparison`
- `Hotel one-stop procurement cost vs multiple suppliers?`

Weak:

- `What is AI visibility?`
- `This platform feature overview`
- `Product workflow benefits`
- `One-stop procurement cost vs multiple suppliers?`

Pure educational prompts are allowed, but they should not dominate the monitoring set.

## Fallback Rules

Fallback is acceptable only when:

- crawl fails,
- search fails,
- no valid model key is configured,
- or model output cannot be parsed.

Fallback output must include a visible warning.

Do not present fallback as a final, client-ready result without human review.
