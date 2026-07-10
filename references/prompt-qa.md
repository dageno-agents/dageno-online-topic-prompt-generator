# Prompt QA

Run deterministic QA after prompt generation. Model-based QA may be added in hosted runtimes, but deterministic checks should always run first.

## Required Checks

- Valid JSON when machine output is requested.
- Every Topic has prompts grouped under it.
- Every prompt is unique across all Topics.
- Every prompt has `p`, `pt`, `it`, `f`, `is`, and exactly two `kw` values.
- Every prompt has `pool`, `sv`, `dp`, `mp`, `cg`, and evidence metadata.
- `pt` is one of `generic`, `branded`, `competitive`.
- `it` and funnel values are valid.
- `generic` prompts and keywords exclude owned brand aliases and competitor names.
- `branded` prompts include an owned brand or alias.
- `competitive` prompts appear only when `brandPromptMode=mixed`.
- Prompt text is self-contained and avoids ambiguous references such as `this`, `it`, `the tool`, `the platform`, or `this industry`.
- Prompt text includes a business-context anchor that makes the industry, product category, service type, or usage scenario clear without reading the Topic name.
- Exact and semantic duplicates are rejected across all Topics, not only inside one Topic.
- `monitoring_core` meets `sv>=70`, `dp>=60`, `mp>=55`; `content_opportunity` meets `sv>=70`, `dp>=50`.
- Every `cg` value exists in the Topic's `cv.cells`.
- Every High-priority coverage cell is covered.
- Cross-industry terms such as `vendor`, `supplier`, `platform`, `software`, `service`, `agency`, `manufacturer`, `account`, `course`, `demo account`, `cost`, and `pricing` have a category/use-case anchor.
- Every applicable High-priority intent is covered; excluded intents have explicit reasons.
- Informational Prompt volume follows the business model and coverage plan, and is separated into `content_opportunity` when mention likelihood is low.

## Portable Script

Use:

```bash
python3 scripts/prompt_qa.py output.json --brand "Brand Name" --mode exclude
```

Optional flags:

```bash
--alias "Brand Alias" --competitor "Competitor A" --competitor "Competitor B"
```

For regulated, technical, or easily ambiguous categories, pass expected context anchors so QA fails prompts that only work when the reader sees the Topic name:

```bash
python3 scripts/prompt_qa.py output.json --brand "Vantage Markets" --mode mixed \
  --context-term CFD --context-term forex --context-term broker \
  --context-term "trading account" --context-term "trading platform" \
  --context-term "leveraged trading"
```

The script prints a JSON report with `passed`, `errors`, `warnings`, and summary counts.
