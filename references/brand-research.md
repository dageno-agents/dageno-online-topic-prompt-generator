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

## STEP 0.6 — 业务模式与经济中心判断（必须执行）

不要只看页面上出现最多的产品名、功能词或导航栏目。很多客户官网规划并不清晰，页面可能同时堆叠多个业务、历史业务、SEO 栏目、产品目录和销售话术。先判断买家真正购买的“决策价值”，并评估“官网表达出来的业务”和“客户可能真正想占领的业务场景”是否一致。

- 单一产品/SKU：用户主要比较规格、价格、适配、评价和售后。
- 软件/平台工作流：用户主要比较工作流效率、集成、权限、部署、成本和替代方案。
- 本地服务：用户主要比较位置、服务项目、价格、预约、评价和可信度。
- 专业服务：用户主要比较方法论、专家资历、案例、行业适配和交付结果。
- 一站式采购/供应链整合：用户购买的是多品类采购简化、供应商整合、质量风险降低、定制能力、交期与总成本控制，而不是单个 SKU。

如果官网表达混乱或证据冲突，必须输出 2-4 个业务假设，而不是强行给一个确定行业：

- `hypothesis`：可能的业务解释。
- `confidence`：High / Medium / Low。
- `evidence`：支持该假设的官网/搜索/需求侧证据。
- `risk`：为什么该假设可能错误或不完整。
- `topicImplication`：如果该假设成立，Topic 应如何规划。

Topic 取舍规则：

- High confidence：可作为核心 Topic 主线。
- Medium confidence：如果商业价值高，可保留 1 个探索型 Topic。
- Low confidence：只放入 warnings、content gaps 或后续需客户确认，不生成核心 Topic。
- 当官网说了很多但核心不清晰时，优先围绕最清楚的 buyer JTBD、购买触发、风险验证和决策标准设计 Topic，而不是照抄页面栏目或产品名。

业务假设之后，必须继续生成 [coverage-engine.md](coverage-engine.md) 定义的三项中间产物：

1. `capabilityLedger`：客户真正能交付什么、卖给谁、解决什么任务、支持什么结果、有哪些边界与证据。
2. `intentCoveragePlan`：哪些角色、JTBD、意图和决策标准适用，哪些不适用以及原因。
3. `researchDecision`：`confirmed` / `provisional` / `needs_confirmation`。

高优先级 Topic 只能映射到 confirmed 或有强证据的 inferred capability。不能因为品类用户经常提问，就为客户并不提供的产品、服务、地区、合规承诺或交付能力生成 Topic/Prompt。

当最高业务假设低于 70 分、前两项假设接近，或付费买家/优先业务线仍不清楚时，`researchDecision.status` 必须为 `needs_confirmation`。此时可以生成暂定方案，但必须显示不确定性和需客户补充的信息，不能伪装成确定结论。

当证据出现以下组合时，应优先考虑“一站式采购 / sourcing / supplier integration”模型：

- broad catalog / multi-category / wholesale / bulk order / procurement / sourcing / one-stop / supplier network
- supplier / manufacturer / factory / factory audit / quality control / sample approval / certification / ISO
- OEM / ODM / private label / custom logo / custom packaging / design support
- MOQ / payment terms / lead time / consolidated shipping / total landed cost
- project opening / renovation / fit-out / OS&E / FF&E / developer / contractor

此类业务的 Topic 不应拆成一堆孤立 SKU，而应围绕采购决策链：

1. 一站式采购与多品类寻源：买家能否用一个供应商完成多品类采购。
2. 核心品类组合包/复购包：只有当品类是信任入口、复购单元或项目包时才单独成 Topic。
3. 项目开业/改造采购清单：买家如何按项目阶段采购、打包、交付。
4. 定制品牌/OEM/设计配套：买家如何做 logo、包装、材质、主题一致性。
5. 供应商质量与工厂验证：样品、认证、质检、产能、售后和真实性。
6. 成本、MOQ、交期与集运：总 landed cost、付款条款、合并出货和交付风险。

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
12. 输出 `businessHypotheses`、`capabilityLedger`、`intentCoveragePlan` 和 `researchDecision`，字段结构遵循 [coverage-engine.md](coverage-engine.md)。

以严格 JSON 对象返回结果。

## 产出供后续使用

后续主题/提示词生成使用本流程产出的 `summary`（Markdown 品牌摘要）作为品牌上下文（即原先的 `brandSummary`）。
