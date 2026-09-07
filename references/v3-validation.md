# V3 Validation And Release

## Two Different Kinds Of Validation
Deterministic: schema, source-ID existence, market/capability reference integrity, Canonical catalog membership, complete unit-to-Topic mapping, brand modes, country/language, duplicate IDs/questions and explicit deferrals.
Semantic: separate model pass reviewing question meaning, industry fit, natural language, subtle negations, compound questions, unsupported constraints and cross-Topic redundancy.
Lexical similarity is a candidate signal only, including Unicode segmentation. It must not silently delete similar questions.

Independent gap review compares the inventory with original sources and the ontology.
This is still a fallible model judgment, not proof of exhaustive or correct industry understanding.

V3.1 also requires an independent per-question brandless-answer test and entity-role assessment bound to the exact text. Source citations and incidental examples are not brand competition. The portable and browser exporters share runtime/visibility-policy.mjs, fail on absent/stale reviews, and default to the serviceable approved list. Test the service/benchmark overlap, citation/content separation, empty-list handling and baseline changes.

## Tests
Run `npm test`.
Synthetic multi-sector fixtures verify pipeline contracts and project isolation. They do NOT establish live business-identification accuracy.
Include malformed model output, nonexistent sources, invented L3, blocked websites, unresolved business, multi-language, manual deferral, one-question businesses, >50 Topics, >100 units and cross-version changes.
Online tests must separately record actual domain, sampled URLs, executed searches, returned model, result and limitations.
Never describe mocked calls as real crawl/search/model validation.

## Release
Public files are allowlisted: Skill, runtime, references, scripts, tests, README, security guide, license and dependency lock.
Do not publish customer exports, reports, private articles, secrets or authorization logs.
Build one manifest with file hashes; verify the same runtime/rules in GitHub, the installed Skill and the workbench bundle.
Cloudflare publication must follow local tests and a preview check. A successful upload is not proof a real domain completes.
