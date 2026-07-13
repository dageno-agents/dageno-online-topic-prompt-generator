---
name: geo-topic-generate
description: 根据品牌网站 URL 自动调研并提取用于 GEO 监控的核心产品/品牌主题（Topic），输出带 focus 等级和 confidence 分数的结构化主题列表。生成前会先联网调研品牌，无需传入品牌摘要。当用户需要为某个品牌生成 GEO 监控主题、提取可监控的用户面向主题时使用。
---

# GEO Topic Generate

根据品牌网站自动调研并抽取面向用户、可监控的核心主题（Topic），用于 GEO（Generative Engine Optimization）监控。品牌上下文由内置的品牌调研流程联网获取，无需调用方传入品牌摘要。

## 输入

| 字段 | 说明 |
|------|------|
| `langCode` | 目标语言代码，如 `en-US`、`zh-CN`，默认 `en-US` |
| `topicMode` | `auto` / `manual`，默认 `auto` |
| `topicCount` | 仅在 manual 模式使用的最终主题数量 |
| `websiteURL` | 品牌官网 URL / domain |
| `brandPromptMode` | 后续 prompt 是否允许品牌词：`exclude` / `include` / `brand_only` / `mixed`，默认 `exclude`。Topic 本身仍默认不含品牌名。 |

- 先用 `langCode` 推导目标语言名称（如 `zh-CN` → Chinese，未知则默认 English）。
- `currentDate` 取当前日期 `YYYY-MM-DD`。
- **不再传入 `brandSummary`**：品牌摘要由下方品牌调研流程自动产出。

## 第 0 步：品牌调研（必须先执行）

生成任何主题之前，**必须先执行** [brand-research.md](brand-research.md) 中的完整品牌调研流程（基于 `websiteURL` 联网搜索），得到 Markdown 品牌摘要 `summary`。该 `summary` 即作为下方主题抽取的品牌上下文（`brandSummary`）。未先完成品牌调研就生成主题属于失败。

品牌调研还应产出：

- `evidenceSources`：按 [evidence-schema.md](evidence-schema.md) 记录的站内/搜索/推断证据。
- `categoryDemandSignals`：按 [category-demand-search.md](category-demand-search.md) 归一化的品类需求信号。
- `competitorMap`：按 [competitor-generation.md](competitor-generation.md) 生成的国家/业务线/差异化竞品地图。

## 任务

在 auto 模式下，抽取能够覆盖品牌可承接意图、行业基准意图与竞品空白的**完整非重叠 Topic 集合**；仅在 manual 模式下恰好输出 `topicCount` 个，并披露因数量限制导致的覆盖缺口。不要把 10 当作自动模式的上限或目标。

Topic 不是品牌官网上的功能标签，也不是营销口号；Topic 是共享同一决策对象和核心 JTBD 的真实用户问题集合。Prompt 数量由适用覆盖单元决定。

## 输出语言要求（重要）

- 所有 topic 名称必须使用目标语言书写。
- 只输出 JSON，不要解释、不要 markdown。
- 输出必须严格匹配下方结构；机器流程可包含 `ev` 证据字段。

## 主题要求

### 先做内部需求建模（不要输出）
生成 Topic 前必须先完成以下内部分析：

1. **业务边界**：品牌卖什么、不卖什么、核心收入来自哪些产品/服务；不确定是否支持的场景默认排除。
2. **角色矩阵**：识别 2-5 类真实搜索者，如最终用户、采购者、技术评估者、渠道商、代理商、本地消费者、内容读者。
3. **JTBD / 任务矩阵**：每个角色最可能问 AI 的任务、痛点、购买触发、风险顾虑。
4. **内容资产盘点**：从客户网站现有页面、导航、博客/学院/资源中心、帮助中心、产品清单、市场/品类页中抽取已覆盖内容主题。内容资产体现品牌过去的业务重心，必须用于校正 Topic。
5. **内容缺口映射**：以“未来要写文章/做内容覆盖并追踪效果”为终点，识别现有内容已覆盖、覆盖不足、缺失但业务重要的细颗粒场景。
6. **意图覆盖**：确保候选主题覆盖 problem-solution、recommendation、comparison、pricing/value、risk/validation、implementation/integration、alternative、local/availability、education/content 中适用的类型。
7. **品牌词策略影响**：若 `brandPromptMode` 为 `include`、`brand_only` 或 `mixed`，候选主题必须能同时支持品牌验证类问题；若为 `exclude`，主题必须能在无品牌词场景下清楚表达品类需求。
8. **竞品与行业边界映射**：使用 `competitorMap` 提取直接竞品、替代方案、国家差异、业务线交叉、竞品能力和竞品已占领的决策面。竞品研究必须用于扩展行业意图边界，不能只用于填充“相关竞品”字段。
9. **证据映射**：每个 Topic 必须能追溯到站内页面、品类搜索需求、竞品/替代源或明确模型推断；证据不足时降低 `c` 并写入 `ev.warnings`。
10. **Capability Ledger 映射**：每个核心 Topic 必须映射至少一项 confirmed 或强 inferred capability；不为 unknown capability 生成核心 Topic。
11. **双意图宇宙建模**：分别建立品牌可承接意图和行业完整意图。行业意图必须来自需求与竞品证据，不能只从客户官网反推。
12. **竞争决策面建模**：按 [coverage-engine.md](coverage-engine.md) 识别买家选择、拒绝、对比或验证供应商时需要解决的决策面。
13. **分层覆盖单元**：为 Topic 建立 `cv.cells`，每个单元标记 `scope`、`metricUse`、`serviceabilityStatus`、`benchmarkMember` 和竞品证据。不要构造全排列。

### 主题来源
- 从以下信号推断：产品线、使用场景、客户痛点、购买信号、品类上下文、渠道、业务背景（来自第 0 步品牌调研产出的 `summary`）。
- 用 `websiteURL`、产品页面、定价/案例/文档/FAQ/博客等站内信息作为品类与行业补充上下文。
- 若品牌调研中含竞品、SEO 关键词、评论/社区/搜索结果信号，优先用这些需求侧证据校正官网营销语言。
- 必须结合客户已有内容资产：产品/服务目录、博客/学院文章、术语库、课程、电子书、市场分析、帮助中心、费用/账户/平台页。不要只根据首页宏观定位生成 Topic。
- 必须结合品类需求搜索结果：best/review/pricing/alternative/integration/community 等非品牌查询，是发现真实用户问题的核心证据。

### 格式规则
- 主题名：目标语言中的简洁业务短语；英语通常 2-8 个词，中文用自然业务语言。精确表达优先于强行压缩。
- 每个主题必须互不重叠、彼此区分。
- 避免只用过宽品类词（如 "Software"、"Lighting"）或只用过窄功能词（如单个按钮/小功能）。
- 优先选择能够形成完整、互补且无重复 Prompt 集合的主题；窄 Topic 可以少于 10 条。

### Topic 类型（字段 `ty`）
取以下之一：
- `product_category`：核心品类或产品线。
- `use_case`：高价值业务使用场景。
- `persona_need`：特定人群/角色的任务需求。
- `purchase_decision`：价格、供应商选择、合同、保修、ROI 等成交前决策。
- `risk_validation`：安全、质量、可靠性、合规、售后等风险确认。
- `competitive_alternative`：替代方案、竞品比较、供应商选择。
- `content_coverage`：为了未来文章、学院、帮助文档、SEO/GEO 内容覆盖而设计的细颗粒主题。

### Focus 等级（字段 `f`）
取 `High` / `Medium` / `Low` 之一：
- High：核心产品或主要营收驱动品类；对品牌可见性至关重要。
- Medium：重要但次要的产品领域或客户细分。
- Low：小众、新兴或支撑性主题。

### Confidence 分数（字段 `c`）
0-100，表示该主题确实面向用户且可监控的置信度：
- 90-100：在产品线或品牌摘要中有明确证据
- 70-89：从品类或场景上下文强推断
- 50-69：合理推断但不太确定
- 50 以下：推测性，谨慎使用

## 规避规则
- 不使用模糊营销口号（如 "Innovation Solutions"）
- 不使用过度抽象的管理术语（如 "Strategic Transformation"）
- 主题名中不出现品牌名（自有或竞品）
- 不用不同措辞重复同一主题
- 不包含敏感、冒犯或不安全的词

## 证据字段（字段 `ev`）

当运行在可保存机器 JSON 的线上流程中，每个 Topic 建议包含：

```json
"ev": {
  "sourceIds": ["src_001", "src_014"],
  "mappedPages": ["/features", "/pricing"],
  "demandSignals": ["best AI presentation software"],
  "businessLines": ["AI slide generation"],
  "countries": ["United States"],
  "competitorLinks": ["Competitor A"],
  "confidenceReason": "Official pages and category searches both support this demand cluster.",
  "warnings": []
}
```

客户端只需要简洁输出时可省略 `ev`，但内部生成链路仍应保留证据。

## 覆盖字段（字段 `pc` / `cv`）

- `pc`：覆盖该 Topic 全部 High-priority 和适用 coverage cells 所需的 Prompt 数。简单 Topic 可为 3-7；存在多个买家场景、决策面和证明要求的复杂 Topic 可达 20-32。
- `cv.capabilityIds`：客户承接能力映射。
- `cv.buyerRoles`、`cv.jobsToBeDone`：该 Topic 覆盖的买家与任务。
- `cv.applicableIntentTypes`、`cv.decisionCriteria`：适用意图与决策因素。
- `cv.excludedIntents`：不适用意图及原因。
- `cv.cells`：按 [coverage-engine.md](coverage-engine.md) 定义的覆盖单元。
- `cv.cells[].scope`：`brand_core` / `industry_benchmark` / `competitive_whitespace` / `out_of_scope_reference`。
- `cv.cells[].metricUse`：决定该单元进入核心 KPI、行业基准、机会分析还是仅诊断展示。

## 全局规则
- 主题必须唯一
- 只输出 JSON
- JSON 之外无任何解释
- 最终输出必须严格匹配此结构：

```json
{"ts":[{"t":"Topic Name","ty":"use_case","f":"High","c":95,"pc":8,"cv":{"capabilityIds":["cap_001"],"applicableIntentTypes":["recommendation","comparison"],"cells":[{"id":"cell_001","buyerRole":"buyer","jobToBeDone":"choose a provider","intentType":"recommendation","priority":"High"}]},"ev":{"sourceIds":["src_001"],"confidenceReason":"Supported by product and demand evidence.","warnings":[]}}]}
```

## 最终检查清单
- auto 模式是否为最小完整 Topic 集合；manual 模式是否恰好为 `topicCount`？✓
- 所有主题名都使用目标语言？✓
- 任何主题都不含品牌名？✓
- 没有重复主题？✓
- 每个主题的 Prompt 数是否由 coverage cells 决定且无填充？✓
- 每个核心主题是否映射客户可承接能力？✓
- 是否覆盖核心角色、业务场景、购买决策和风险验证？✓
- 是否结合了网站现有内容资产和未来内容缺口？✓
- 仅 JSON、无多余字段？✓

## Output Schema

```
ts: 数组
  - t: string  — 核心主题名（2-4 词，Title Case，名词短语）
  - ty: "product_category" | "use_case" | "persona_need" | "purchase_decision" | "risk_validation" | "competitive_alternative" | "content_coverage"
  - f: "High" | "Medium" | "Low"  — focus 等级
  - c: number (0-100)  — confidence 分数
  - pc: number (3-32) — coverage-derived final prompt count; this is an online-run safety boundary, not a planning target
  - cv: object — capability and intent coverage plan with cells
  - ev: object (optional) — evidence metadata from evidence-schema.md
```
