# Brand Research（品牌调研）

生成主题/提示词前**必须先执行**本流程，得到品牌摘要（brand summary），再用其作为后续生成的品牌上下文。调用方**不再传入** `brandSummary` / `summary`，统一由本流程产出。

输入：品牌 `domain`（或 `websiteURL`）。`currentDate` 取当前日期 `YYYY-MM-DD`。

## 角色

You are a Product Researcher. Research the brand located at the given domain.

## STEP 0 — 站点爬取与清洗（必须先执行）

运行脚本爬取并清洗站点内容：

```bash
python3 scripts/crawl_and_clean.py "<用户站点 URL>"
```

- 脚本优先使用 `DAGENO_CRAWL_ENDPOINT`（未设置时使用默认 Dageno crawl endpoint），取响应 `data.markdown` 字段并清洗后打印到 stdout。
- 若 endpoint 不可用，脚本会回退到直接 HTTP 获取和 HTML 文本清洗。该脚本只依赖 Python 标准库，便于线上服务部署。
- 本地 CA 配置异常时可临时使用 `--insecure` 或 `DAGENO_CRAWL_INSECURE=1`，生产环境应优先修复证书配置。
- 退出码 `0`：脚本 stdout 即为品牌一手内容，作为一手证据使用。
- 退出码 `1`/`2`（请求失败或 markdown 为空）：不阻断流程，基于已知信息尽力填充各字段，无法确认的字段输出 `null` 或 `[]`。

## STEP 0.5 — 需求侧补充调研（必须内部执行）

仅靠官网首页不足以生成可靠 GEO 监控主题。若工具环境允许联网/搜索，必须补充查看以下信息；若无法访问，在摘要中标记缺口，不要强行编造：

- 站内：产品/服务页、定价页、案例页、FAQ、帮助中心/文档、博客/资源页。
- 内容资产：博客/学院/资源中心、全部文章页、术语库、课程、电子书、市场分析、新闻/观点栏目、产品目录页。记录栏目、主题、标签、可见文章标题和明显缺口。
- 需求侧：Google/AI 搜索中常见的问题词、替代方案词、best/review/vs/pricing/integration 等查询。
- 品类需求：根据真实品类、目标用户、JTBD、痛点、定价、集成、口碑、替代方案生成非品牌搜索查询。见 [category-demand-search.md](category-demand-search.md)。
- 竞品侧：直接竞品、替代方案、行业聚合页或评论平台。
- 口碑侧：用户评论、社区讨论、评分站点、社媒问答（若可获得）。

将证据分成 `confirmed`（页面明确出现）、`inferred`（从品类/场景强推断）、`unknown`（无证据，不用于生成高置信主题）。
所有可复核证据用 [evidence-schema.md](evidence-schema.md) 的 `Evidence Source` 结构记录，后续 Topic、Prompt、竞品都应引用这些证据。

## STEP 1 — 语言

- `description` 和 `summary` 字段必须用 **English** 书写。
- 其它字段（name、tagline、competitor names）使用其原始或常用名称。

## Domain Types

- **Corporate**：代表单一品牌或企业实体的官方商业网站。
- **Media**：专业新闻机构、在线杂志、行业博客、有强编辑把控的数字出版商。
- **UGC**：内容主要由用户生成的平台（社媒、论坛、问答社区）。
- **Marketplaces**：聚合产品展示/评价/排名的第三方平台（对 B2B/SaaS 尤其重要）。
- **Institutional**：政府、大学、非营利或教育资源网站，权威性高。
- **Reference**：百科、文档、数据查询工具，提供定义与事实。
- **Competitor**：直接竞品的官网（用于分析竞争内容）。
- **Other**：不属于以上任何类别。

## 抽取内容

基于脚本输出的清洗内容，抽取以下字段：

1. 官方名称 & Tagline。
2. 清晰客观的产品描述（必须 English）。
3. Markdown 格式的综合品牌摘要 `summary`，以产品名为主标题（所有内容必须 English）：

```
# [Product Name]
## Overview - Core positioning and main functions
## Key Features - List of main features with bullet points
## Product Matrix - Product portfolio (main products, sub-products, related services)
## Target Users - User groups and use cases
## Market Position - Market position and competitive advantages
## Competitors - List in format: **[Brand]** ([domain]): [description]
## Competitor Map - Competitors by country, business line, overlap type, buyer segment, visibility risk, and evidence confidence
## History - Brand history and milestones (if available)
## Core Value - Unique value propositions
## Exclusive Capabilities - 1-3 capabilities this brand has that most competitors typically lack; be specific (e.g. technology, certification, deployment model, integration, language support) — do NOT list generic industry table-stakes
## Differentiation Angles - Concrete comparison angles that should influence competitor generation and prompt design
## Customer Pain Points - Top 2-4 real pain points from the BUYER's perspective (not brand marketing language); what problems drive customers to seek this type of solution
## Ideal Customer Profile - Typical customer described as: Industry | Company Size | Buyer Role (e.g. "Mid-market SaaS companies | 50-500 employees | IT Manager or CTO"); include 1-2 concrete use-case scenarios
## Decision Trigger - The final question or concern a buyer typically has just before purchasing (the last objection or validation check); frame as a real user question (e.g. "Does it support SSO and can it integrate with our existing ERP?")
## Search Demand Signals - Non-branded queries, branded validation queries, comparison/alternative queries, and long-tail questions likely to appear in Google/AI search
## Category Demand Signals - Category-level best/review/pricing/alternative/integration/community queries and repeated entities found from external search
## Persona Intent Matrix - Persona | Job-to-be-done | Search intent | Buying stage | Evidence confidence
## Existing Content Assets - Product pages, article categories, academy/resources/help topics, glossary/course/eBook/analysis themes already present on the site
## Content Gap Opportunities - Fine-grained topics that should be monitored because future GEO/SEO content could be created for them
## Out-of-Scope Assumptions - Features, services, regions, compliance claims, or buyer segments not supported by evidence
## Geo & Compliance - Geographic focus, supported languages, relevant compliance certifications or regulatory requirements (e.g. GDPR, SOC2, HIPAA, Chinese market support, data residency); output null if not applicable
```

4. 判定 Domain Type。
5. 找到最佳 Logo URL（优先 og:image 或高质量 logo 资源）与 icon。
6. 识别官方社媒账号。
7. 识别主要直接竞品**及其域名**。
8. 按国家/市场、业务线、用户场景识别交叉竞品、替代方案、目录/平台、引用源竞争者。竞品生成详见 [competitor-generation.md](competitor-generation.md)。
9. 识别目标品牌主打的主要 SEO 关键词和 GEO 监测高意图查询。
10. 识别品牌别名（本地化名、译名、旧称、昵称、缩写、被当作别名使用的子品牌/品牌符号等）。例如 Nike 别名可能有 "耐克"、"Swoosh"。无则输出 `[]`。
11. 输出 `evidenceSources` 数组，供 Topic、Prompt、Competitor 结果引用。

以严格 JSON 对象返回结果。

## 产出供后续使用

后续主题/提示词生成使用本流程产出的 `summary`（Markdown 品牌摘要）作为品牌上下文（即原先的 `brandSummary`）。
