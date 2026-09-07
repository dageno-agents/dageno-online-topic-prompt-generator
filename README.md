# Dageno Topic & Prompt Generator

[简体中文](README.zh-CN.md) · [Dageno](https://dageno.ai/) · [Skill](SKILL.md)

**Turn a real website into an evidence-backed AI-search monitoring panel.**

V3 candidate: deterministic checks pass; complete live-model regression is still pending. Do not treat this as a verified production accuracy release.

## V3.1: Relevance Is Not Monitoring Eligibility

A question may be on topic without needing any product or brand in its answer. The admission review asks whether a good answer can fully satisfy the request without specific providers/products. Incidental examples, optional citations and best/top wording do not qualify by themselves.

The default CSV contains serviceable, entity-dependent buyer decisions with a concrete content/proof/action plan. Separate exports preserve the wider industry benchmark, citation observation and informational content. Informational questions stay in the map; a genuinely different buying question gets a new intent unit, not a disguised paraphrase.

Target-brand performance never determines eligibility. Changing the panel or admission policy requires a new baseline, not a claim of visibility growth. [Admission contract](references/brand-visibility-admission.md)

This project researches what a business actually sells, what buyers in its market need, and where competitors answer those needs. It then organizes distinct decisions into Topics and writes standalone questions for monitoring.

## Why This Is Different

A dashboard can be precise about the wrong question set. Measuring only a brand's strongest use cases makes visibility look better; indiscriminately adding unrelated categories makes it look worse.

V3 separates **brand capabilities, same-market demand, competitive gaps and out-of-scope context**. It does not claim that generated questions are real query logs or a census of all searches.

## The Workflow

```text
Website + fresh external research
  -> business hypotheses
  -> market/competitor evidence and disconfirmation
  -> Canonical L3 market boundaries
  -> decision surfaces and concrete intent units
  -> independent missing-intent review
  -> Topic clustering
  -> natural questions
  -> deterministic + semantic QA
  -> JSON evidence panel + Dageno import CSV
```

**An intent unit is one meaning, not one phrasing.** “Which platform fits a small team?” and its paraphrase should not count as two independent demand units. Price, security, migration and suitability remain distinct when they change the decision.

## What You Receive

| Deliverable | Purpose |
| --- | --- |
| Business interpretation | Current offer, payer, job, limits and uncertainty |
| Market/competitor map | Same-market providers, adjacent offers, substitutes and sources |
| Topic and intent inventory | Coverage-derived grouping, with exclusions and deferred units |
| Prompt library | One standalone question per distinct intent unit |
| Evidence trail | Retrieved pages, searches, source IDs, dates and content hashes |
| QA and version difference | Broken mappings, semantic issues, additions and wording changes |
| Import CSV | Exactly `topic,prompt,regions,language` |
| Full JSON | Evidence, stable IDs, benchmark membership and configuration |

Counts are derived from evidence. There is no fixed 7-Topic or 10-Prompt template. Transport batches can continue beyond 50 Topics or 100 Prompts. A budget limit is disclosed; it is not called “complete coverage.”

## Quick Start In Codex

```bash
git clone https://github.com/dageno-agents/dageno-online-topic-prompt-generator.git
cd dageno-online-topic-prompt-generator
npm ci
mkdir -p ~/.codex/skills/dageno-topic-prompt-generator
cp -R SKILL.md agents references runtime scripts tests package.json package-lock.json node_modules ~/.codex/skills/dageno-topic-prompt-generator/
```

Ask:

> Research example.com as a new business. Build a non-branded US/en-US monitoring panel from real site and market evidence. Include industry demand beyond the brand's strengths. Give me a Chinese design summary, full JSON and the four-column Dageno CSV.

Codex can use the current session model and available research tools. Using the Skill in Codex does **not** require a second OpenRouter key.

## Hosted Or CLI Execution

Node.js 22+ is required. Configure `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` securely in the environment; never commit them.

```bash
node runtime/cli.mjs generate --domain example.com --market US --language en-US --out private/example
node runtime/cli.mjs qa private/example/panel.json
node runtime/cli.mjs export private/example/panel.json private/example/import.csv
npm test
npm run verify:release
```

The hosted workflow uses an operator-selected OpenRouter model. It does not silently switch providers after a failure. Changing the model in a Codex conversation does not automatically change the hosted model.

## Monitoring Integrity

- The default CSV is the qualified brand-core service list. Independently export industry benchmark, citation observation and content lists; they have different denominators.
- Same-market benchmarks include eligible brand-core questions too; they are not just questions the brand cannot answer.
- Brand names are excluded by default. Owned-brand validation and competitor comparisons are opt-in modes.
- Language, monitoring IP and genuinely local/legal constraints are separate.
- No invented Canonical IDs. Without the catalog, the market is provisional and project-local.
- Model judgments are labelled as judgments, not measured demand or mention probabilities.
- Known-inventory coverage is not a claim to cover every internet query.
- Default generation does not run actual consumer AI-platform monitoring.

## Validation And Limits

Tests cover orchestration, project isolation, reference integrity, multilingual handling, scope budgets and failure cases. Mocked multi-sector fixtures are **not live accuracy benchmarks**.

Semantic and business judgments remain fallible. Weak websites, inaccessible pages, ambiguous offers, sparse demand evidence and evolving markets can require human review. A deployment upload is not evidence of end-to-end success.

The current request-based runtime does not provide durable background-job resumption. Keep generated JSON alongside CSV: four import columns cannot carry evidence or historical intent IDs.

## Project Map

- [Operating Skill](SKILL.md)
- [Research protocol](references/v3-research-protocol.md)
- [Intent ontology](references/intent-ontology.md)
- [Canonical L3](references/canonical-l3-market-boundary.md)
- [Measurement boundaries](references/v3-measurement-contract.md)
- [Output contract](references/v3-output-contract.md)
- [Validation](references/v3-validation.md)
- [Security](docs/security.md)

MIT. Public releases exclude customer research, proposals, private articles and secrets.
