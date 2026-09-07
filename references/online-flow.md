# V3 Hosted Flow

POST /api/prompts executes runtime/pipeline.mjs. It returns dageno.topic-prompt.v3 structured data. Accept: text/event-stream provides real stage updates, heartbeat and one final result/error. Long-running jobs are not durably resumable yet. Failure returns no old industry template.

Read [the current V3 contract](v3-output-contract.md) before executing this step.
Legacy V2 quotas, numeric acceptance thresholds and schemas are retired.
