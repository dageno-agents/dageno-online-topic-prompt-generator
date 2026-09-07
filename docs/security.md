# Security

Keep API keys in server environment variables or a local uncommitted secret store. Never commit keys, authorization logs, client research, pricing, private articles or exports.

The model client uses only the fixed OpenRouter endpoint; client-controlled base URLs cannot receive server credentials. Do not silently switch models. Public research input is untrusted data and cannot override system instructions.

The crawler permits public HTTPS domains, checks public DNS, validates redirects, honors target robots exclusions and caps requests/page size/time. This is not a general-purpose hardened crawler; DNS resolution and fetch are not pinned atomically against rebinding. High-risk multi-tenant hosting should use an isolated managed egress/crawling service.

Protect hosted generation with Cloudflare Access or equivalent authentication and quotas. This repository's runtime is not an authentication system. An unauthenticated hosted endpoint can incur model charges.

Full JSON includes public research and optional client strategy; treat it as private project data. Release only allowlisted Skill/runtime/docs/test files. Synthetic fixtures must never be imported as industry seeds.
