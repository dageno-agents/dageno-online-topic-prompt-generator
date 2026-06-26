# Security

This repository must not contain secrets.

## Do Not Commit

- OpenRouter API keys
- OpenAI API keys
- Anthropic API keys
- Dageno API keys
- customer crawl exports
- customer Dageno exports
- private proposal documents
- `.env` files
- local filesystem paths
- logs that include authorization headers

## Runtime Configuration

If this Skill is used in a hosted app, configure keys through environment variables:

```text
OPENROUTER_API_KEY
OPENROUTER_MODEL
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
OPENAI_API_KEY
OPENAI_MODEL
```

Do not hardcode keys in source files, examples, docs, screenshots, or test fixtures.

## Customer Data

The public Skill describes the workflow and schemas only.

Customer-specific data should stay in a private workspace:

- crawled pages
- Dageno API responses
- Topic visibility exports
- citation exports
- competitor lists from paid tools
- proposal drafts

## Before Publishing

Run a secret scan:

```bash
rg -n "sk-|Bearer|x-api-key|apiKey|OPENROUTER|OPENAI|ANTHROPIC|DAGENO|local-home-path|loopback-host"
```

Environment variable names are allowed in docs. Real token values are not.
