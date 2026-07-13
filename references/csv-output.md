# CSV Output

CSV export is used for Dageno monitoring setup and spreadsheet review.

## Columns

Use this exact order:

```csv
Topic序号,Topic名称,Topic Cluster类型,用户购买路径,Topic优先级,Topic Prompt数,Prompt序号,Prompt,品牌词类型,用途池,覆盖层,指标用途,承接状态,用户意图,购买阶段,意图强度,关键词,业务承接分,需求真实性分,品牌提及概率分,竞品证据ID,监测模型,监测地区
```

## Field Mapping

- `Topic序号`: 1-based Topic index.
- `Topic名称`: Topic `t`.
- `Topic Cluster类型`: human-readable mapping of Topic `ty`.
- `用户购买路径`: inferred from prompt funnel mix, usually `发现 -> 考虑 -> 评估 -> 决策`.
- `Topic优先级`: Topic `f`, translated if needed: High=高, Medium=中, Low=低.
- `Topic Prompt数`: number of prompts under the Topic.
- `Prompt序号`: 1-based prompt index across the full export or within topic; be consistent.
- `Prompt`: prompt text `p`.
- `品牌词类型`: `generic`=非品牌词, `branded`=品牌词, `competitive`=竞品词.
- `用途池`: `monitoring_core`=可见度监控池, `content_opportunity`=内容机会池.
- `覆盖层`: `scope`，用于区分品牌核心、行业基准、竞品空白和越界参考。
- `指标用途`: `metricUse`，决定是否进入核心 KPI、行业基准、机会分析或仅诊断。
- `承接状态`: `serviceabilityStatus`。
- `用户意图`: prompt `it`.
- `购买阶段`: prompt `f`.
- `意图强度`: first item in prompt `is`, formatted like `Commercial:84`.
- `关键词`: two keywords joined by ` / `.
- `业务承接分`: `sv`.
- `需求真实性分`: `dp`.
- `品牌提及概率分`: `mp`.
- `竞品证据ID`: `competitorEvidenceIds`，使用 ` / ` 连接。
- `监测模型`: e.g. `ChatGPT / Perplexity`.
- `监测地区`: region setup, e.g. `由 Dageno IP 自动控制`.

## CSV Rules

- Include UTF-8 BOM when exporting for Chinese spreadsheet apps.
- Escape quotes by doubling them.
- Wrap cells with commas, quotes, or newlines in double quotes.
- Keep prompts grouped by Topic in row order.
- Do not put API keys, private crawl logs, or full raw model traces into CSV.
