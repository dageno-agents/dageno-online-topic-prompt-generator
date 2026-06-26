---
name: geo-prompt-generate-by-topic
description: 针对某个指定的品牌主题（Topic）生成搜索优化的 GEO 监控 prompt，输出带漏斗分类（TOFU/MOFU/BOFU）、意图分数和关键词的结构化 prompt 列表。生成前会先联网调研品牌，无需传入品牌摘要。当用户提供品牌网站和目标 Topic、需要为该主题批量生成可监控搜索 prompt 时使用。
---

# GEO Prompt Generate By Topic

针对**某个指定品牌主题**生成搜索优化的 GEO 监控 prompt。品牌上下文由内置品牌调研流程联网获取，输入目标 Topic，输出带漏斗分类的结构化搜索 prompt。

## 输入

| 字段 | 说明 |
|------|------|
| `langCode` | 目标语言代码，如 `en-US`、`zh-CN`，默认 `en-US` |
| `websiteURL` | 品牌官网 URL / domain（用于品牌调研） |
| `Topic` | 目标主题（由用户提供，逐字使用） |
| `TotalPrompts` | 该主题需生成的 prompt 总数 |
| `brandPromptMode` | 品牌词策略：`exclude` / `include` / `brand_only` / `mixed`，默认 `exclude` |
| `brandPromptRatio` | 当 `brandPromptMode=include` 或 `mixed` 时，品牌词 prompt 占比，默认 `0.3`，建议范围 `0.1-0.5` |

- 用 `langCode` 推导目标语言名称（如 `zh-CN` → Chinese，未知默认 English）。
- `currentDate` 取当前日期 `YYYY-MM-DD`。
- **不再传入 `summary`**：品牌摘要由下方品牌调研流程自动产出。

## 第 0 步：品牌调研（必须先执行）

生成任何 prompt 之前，**必须先执行** [brand-research.md](brand-research.md) 中的完整品牌调研流程（基于 `websiteURL` 联网搜索），得到 Markdown 品牌摘要 `summary`。该 `summary` 即作为下方品牌解析（步骤 A–E）和 prompt 生成的品牌上下文（Brand Context）。未先完成品牌调研就生成 prompt 属于失败。

整体提示词结构：先做品牌调研（第 0 步）→ 内部品牌解析（步骤 A–E）→ 生成 prompt。

## 品牌解析（内部推理 — 不要输出）

重要：在写任何 prompt 之前，必须完成 A 到 E 全部步骤，每步产出明确的内部结论；E 完成前不要开始生成 prompt。

- **A. 购买模型**：对每个用户角色，判断适用哪种购买模型 —— 个人/自助（什么个人问题触发搜索？）或 B2B/团队采购（用户/采购者/审批者分别搜什么？）。用用户语言描述问题，而非产品语言。
- **B. 真实查询矩阵**：对 A 中识别的每个角色与问题，列出他们会问 AI / Google 的问题，并覆盖适用的意图类型：problem_solution、recommendation、comparison、pricing_value、risk_validation、implementation、alternative、local_availability、education_content、brand_validation。
- **C. 主题—品牌连接（关键）**：若品牌有多条产品线，先确定该主题属于哪条产品线，不要跨产品线混用特性。然后把主题映射到该产品线的具体特性、场景、差异化。问："THIS 品牌版本的这个主题有什么独特之处？" 生成体现独特角度的 prompt，而非通用品类版本。
  - 例：Topic "pricing"，通用角度（错）："how much does multilingual search cost?"；品牌特定角度（对）："does the presentation generation feature cost extra?"
- **D. 内容资产映射（必须执行）**：查看客户网站已有产品目录、博客/学院、帮助中心、费用/账户/平台页、术语库、课程、电子书、市场分析等内容资产。Prompt 不只服务当前品牌可见度，也要服务未来内容覆盖后的效果追踪；因此必须覆盖“已写内容可监控”和“应补内容可监控”两类问题。
- **E. 范围边界**：该产品**不做**什么？不要为这些场景生成 prompt，也不要错误定位品牌。不确定是否在范围内时默认排除。常见错误假设：未提及的数据安全/合规、云产品的离线模式、非开发者工具的 API、纯服务品牌的配送。
- **F. 品牌词策略（必须执行）**：
  - `exclude`：所有 prompt 禁止出现自有品牌名、别名和竞品名；用于非品牌 AI 可见性监控。
  - `include`：按 `brandPromptRatio` 生成自有品牌验证 prompt，其余为非品牌 prompt；除非用户另行要求，不生成竞品名 prompt。
  - `brand_only`：所有 prompt 都必须包含自有品牌名或常用别名；用于品牌词场景单独监控，不应和非品牌可见度混算。
  - `mixed`：生成三类 prompt：`generic`、`branded`、`competitive`。`branded + competitive` 总占比约等于 `brandPromptRatio`，且 `competitive` 不超过总数 20%。
  - 无论哪种模式，JSON 中每个 prompt 必须用 `"pt"` 标明 `generic` / `branded` / `competitive`。
- **G. 阶段分布自选（内部推理 — 不要输出）**：阅读品牌上下文，归类为以下之一：
  - **TYPE A — Discovery-driven**（消费品、冲动购买、低品类认知、社交/推荐获客）→ Early 35% / Mid 35% / Late 30%
  - **TYPE B — Standard SaaS / Productivity**（自助 SaaS、明确品类已有需求、个人或小团队买家、有免费试用）→ Early 20% / Mid 40% / Late 40%
  - **TYPE C — High-consideration / Enterprise**（企业买家、长销售周期、多干系人、合规要求、合同定价）→ Early 10% / Mid 60% / Late 30%
  - **TYPE D — Local / O2O Service**（实体位置、地理覆盖、预约或到店、本地信任信号）→ Early 15% / Mid 35% / Late 50%。注：晚期 prompt 须体现可用性、位置覆盖、预订、等待时间、本地信任，而非 SaaS 定价或功能对比。
  - **TYPE F — Content / Media / Community**（无传统购买漏斗，靠发现/推荐获客，留存与互动为主要转化目标，无付费计划作为主 CTA）→ Early 50% / Mid 30% / Late 20%。注：阶段重定义为 Early=discovery、Mid=engagement fit、Late=commitment。
  - 信号混合或模糊时，默认 TYPE B。将所选分布应用到全部 prompt 生成。

## 输出语言要求（重要）
所有内容（prompt、关键词）必须使用目标语言。JSON 输出中 `"l"` 字段设为 `langCode`。

## 1. 任务
基于用户提供的 `Topic` 和 `TotalPrompts` 生成搜索优化的 prompt。

## 2. Topic 字段规则（关键）
JSON 输出中的 `"t"` 字段必须与用户提供的 `Topic` **逐字完全一致**：
- 不翻译、不修改、不改写、不规范化。
- 逐字拷贝，保留原始大小写、空格、字符。
- 例：用户给 "AI Automation"，输出必须是 `{"t":"AI Automation",...}`，不能是 `{"t":"AI automation",...}` 或扩写。

## 3. Prompt 生成
为目标主题生成所需数量的高质量 prompt：
- 搜索友好、高意图，源自主题和品牌上下文。
- 意图：`{i: "Type", s: Score}` 数组。TOFU: Informational (80-100) | MOFU: Commercial (70-90) | BOFU: Transactional (85-100)。
- 漏斗分布：使用内部选择的业务类型分布；若 Topic 明显偏成交/风险验证，可提高 MOFU/BOFU 比例。
- 每个 prompt 必须标注 `"it"`（细分意图类型）：`problem_solution` / `recommendation` / `comparison` / `pricing_value` / `risk_validation` / `implementation` / `alternative` / `local_availability` / `education_content` / `brand_validation`。
- 若 `TotalPrompts >= 10`，除非业务不适用，至少覆盖 5 种不同 `"it"`。

## 4. 漏斗指南
- TOFU：概念、趋势（"What is X"、"X benefits"）
- MOFU：对比、排障（"Best X for Y"、"X vs Y"）
- BOFU：定价、API、集成（"X pricing"、"X API"）

完整的 **Prompt Rules** 与 **Keyword Split Rules**（每个 prompt 必须全部通过）见 [shared-rules.md](shared-rules.md)，生成前务必先读。

## 5. 漏斗与意图保留
- 保留每个 prompt 的漏斗字段 `"f"`，将每个 prompt 分类为 TOFU / MOFU / BOFU。
- 保留 `"is"` 字段，并保持主意图映射：TOFU → Informational，MOFU → Commercial，BOFU → Transactional。
- 严格使用分数区间：TOFU/Informational 80-100，MOFU/Commercial 70-90，BOFU/Transactional 85-100。

## 6. 全局规则
输出**一个** topic 对象。`"t"` 字段必须与用户的 `Topic` 完全一致（不变）。prompt 唯一。仅 JSON 输出。

品牌名规则由 `brandPromptMode` 控制；不要再全局禁止品牌名。

## 7. 输出格式

```json
{"ts":[{"t":"<EXACT_USER_TOPIC>","f":"High","c":95,"ps":[{"p":"prompt text here","l":"<langCode>","pt":"generic","it":"comparison","f":"MOFU","is":[{"i":"Commercial","s":85}],"kw":["keyword 1","keyword 2"]}]}]}
```

## Output Schema

```
ts: 数组
  - t: string  — 必须与用户 Topic 完全一致
  - f: "High" | "Medium" | "Low"
  - c: number (0-100)
  - ps: 数组
    - p: string   — 搜索优化的 prompt 文本（6-12 词）
    - l: string   — 语言代码（如 'en-US'）
    - pt: "generic" | "branded" | "competitive" — 品牌词监控类型
    - it: "problem_solution" | "recommendation" | "comparison" | "pricing_value" | "risk_validation" | "implementation" | "alternative" | "local_availability" | "education_content" | "brand_validation"
    - f: "TOFU" | "MOFU" | "BOFU"
    - is: 数组
      - i: "Informational" | "Navigational" | "Commercial" | "Transactional"
      - s: int (0-100)  — 意图强度分数
    - kw: string[]  — 恰好 2 个关键词
```
