# Shared Prompt & Keyword Rules

生成每个 prompt 前必须先读本文件，确保每个 prompt 通过全部规则。其中 `${currentDate}` 指当前日期 `YYYY-MM-DD`。

## Prompt Rules（每个 prompt 必须通过全部）

- 真人会把它键入 Google 或 ChatGPT —— 否则丢弃。
- 优先使用最短但完整的自然问句。英语通常 5-18 词；复杂 B2B、合规、采购或本地约束问题可以更长，不为满足词数删除必要语境。
- 反映用户目标或问题 —— 不是产品特性或品牌语言。
- 使用非专家自然会用的日常简单词："get" 而非 "access"，"find" 而非 "retrieve"，"cost" 而非 "pricing model"。
- 移除所有不改变核心含义的修饰词（"efficiently"、"for research teams"、"with X capabilities"）。
- 品牌名由 `brandPromptMode` 控制：
  - `generic` prompt：无自有品牌名、别名、竞品名。
  - `branded` prompt：必须包含自有品牌名或常用别名，表达品牌验证、价格、功能、适配、口碑、可信度等真实问题。
  - `competitive` prompt：可包含竞品名或 "alternative to [competitor]"，但必须是用户真实比较/替代查询；仅在 `brandPromptMode=mixed` 时生成。
- 年份：仅在确实相关时使用当前年份（来自 `${currentDate}`），绝不用过去年份。
- 所有 prompt 跨主题唯一；作为问句时加 "?"。
- prompt 的主语必须是用户、产品品类、或服务提供方（仅当行业依赖可信机构/提供方时适用，如 "law firm"、"moving company"）。
  - ❌ "do multilingual search companies offer annual discounts?"
  - ✅ "can I save money on multilingual search with annual billing?"
- prompt 必须完全自包含且品类明确。Dageno 会把每条 prompt 作为**无上下文的独立日监控问题**发送给 ChatGPT / Perplexity / Gemini / Claude，因此每一条 prompt 都必须自己携带行业、品类或使用场景锚点，不能依赖 Topic 名、上一条 prompt、客户背景或人工说明补全语义：
  - 无指代词（"this"、"it"、"the tool"、"the platform"、"the service"）
  - 无模糊占位（"this industry"、"this category"）
  - 无上下文的读者也能知道讨论的是什么行业和产品/服务品类
  - 每条 prompt 必须包含至少一个**业务上下文锚点**：具体行业、产品品类、服务类型、用户场景、或品牌词模式允许时的品牌名。不要只写通用对象，如 "account"、"platform"、"cost"、"course"、"demo account"、"technical analysis"。
  - 对跨行业通用词（"supplier"、"vendor"、"procurement"、"platform"、"software"、"service"、"agency"、"manufacturer"、"cost"、"pricing"）必须加上行业或场景修饰词
  - 对金融/交易/经纪商类客户，prompt 中至少应出现 `CFD`、`forex`、`broker`、`trading account`、`trading platform`、`leveraged trading`、具体资产类别（如 `gold CFD`、`index CFD`）或品牌词模式允许时的品牌名。
  - ❌ "does the tool work offline?" / ❌ "what do Japanese blogs say about this industry?"
  - ❌ "one-stop procurement cost vs multiple suppliers?" / ❌ "supplier with fast delivery?"
  - ❌ "what is the difference between raw spread and standard trading accounts?" / ❌ "how can I learn technical analysis systematically?"
  - ❌ "how should beginners practice with a demo trading account?"
  - ✅ "can multilingual search work without internet connection?" / ✅ "what do Japanese blogs say about AI search tools?"
  - ✅ "hotel one-stop procurement cost vs multiple suppliers?" / ✅ "hotel supplies supplier with fast delivery?"
  - ✅ "what is the difference between raw spread CFD accounts and standard CFD trading accounts?"
  - ✅ "how can beginners learn technical analysis for forex and CFD trading systematically?"
  - ✅ "how should beginners practice forex or CFD trading with a demo account before using a live account?"
- 对一站式采购 / sourcing / supplier integration / wholesale / OEM / manufacturer 类客户，prompt 必须同时带有采购品类或项目场景锚点。不要只写 "supplier"、"procurement"、"products"、"vendor"：
  - ❌ "best one-stop procurement suppliers"
  - ❌ "custom product manufacturer comparison"
  - ❌ "supplier lead time comparison"
  - ✅ "hotel supplies one-stop procurement supplier"
  - ✅ "restaurant equipment OEM manufacturer comparison"
  - ✅ "office furniture supplier lead time comparison"
  - ✅ "custom packaging supplier with sample approval"
  - ✅ "industrial parts total landed cost calculation"
- 不用正式副词（"simultaneously"、"efficiently"、"seamlessly"）—— 改写为自然表达（"at the same time"、"quickly"、"easily"）。
- 不写词典/教科书式问题 —— 始终锚定用户情境或目标。
  - 测试：这个 prompt 更像出现在 FAQ 页面而非搜索框？若是，围绕用户真实情境重写。
  - ❌ "what is CORS and how does it work?" / ❌ "what is infrastructure as code?"
  - ✅ "how do I fix cross-origin errors in my app?" / ✅ "how to manage servers without writing config files?"
- 每个 prompt 必须语法完整 —— 完整句子或自然问句，绝非名词短语。
  - ❌ "AI search tools that translate results from multiple languages?" / ❌ "does search tool translate accurately from Chinese?"
  - ✅ "which AI search tool translates results from multiple languages?" / ✅ "how accurate is AI search translation from Chinese?"
- 不为品牌范围之外的场景、或品牌上下文未明确支持的特性生成 prompt：
  - ❌ 云端产品的离线模式
  - ❌ 品牌上下文未提及开发者特性时的 API 访问
  - ❌ 研究平台被框定为翻译服务
- 自然变化措辞 —— 不要过度重复同一品类词：
  - 部分 prompt 用具体细节（"Japanese"、"Chinese"）
  - 部分用问题（"can't read foreign content"）
  - 部分用品类词（"multilingual search"）
  - 若用户自然会重复品类词（如保险、法律、医疗），保持自然频率，不强行变化。
- 压缩检查（每个 prompt 定稿前应用）：
  - ❌ "pricing for AI search platforms with cross-language capabilities" → ✅ "how much does multilingual AI search cost?"
  - ❌ "accessing foreign language databases for competitive intelligence" → ✅ "how to find overseas competitor data?"

## Intent Coverage Rules

- 每个 prompt 必须标注一个细分意图 `"it"`：
  - `problem_solution`：用户有问题但不一定知道品类。
  - `recommendation`：寻找工具、服务、供应商、产品推荐。
  - `comparison`：比较品类、方案、规格、供应商。
  - `pricing_value`：价格、预算、ROI、保修、合同、总拥有成本。
  - `risk_validation`：质量、安全、合规、可靠性、售后、口碑。
  - `implementation`：集成、部署、安装、迁移、使用落地。
  - `alternative`：替代方案、竞品替换、不同路线选择。
  - `local_availability`：地域、交付范围、本地服务、库存、预约。
  - `education_content`：用户在学习概念、策略、术语、市场背景、教程或文章型内容时会问的问题；用于追踪未来内容生产效果。
  - `brand_validation`：品牌是否适合、是否靠谱、是否支持某场景。
- 覆盖 Topic `cv.applicableIntentTypes` 中的全部 High-priority 适用意图；不要求每个 Topic 凑满五种意图。
- B2B、高客单、制造、代理商、工程服务类 Topic 必须覆盖 `risk_validation` 和 `pricing_value`，若涉及安装/技术则覆盖 `implementation`。
- SaaS / API / 软件类 Topic 必须覆盖 `comparison`、`pricing_value`、`implementation`、`risk_validation`，若有免费试用或自助注册则覆盖 `brand_validation`。
- 如果客户有博客、学院、资源中心、帮助中心、术语库、课程、电子书或市场分析栏目，应生成有真实需求证据的 `education_content` Prompt，并默认放入 `content_opportunity`；只有可能自然触发产品/信源提及时才进入 `monitoring_core`。

## Coverage And Pool Rules

- 每条 Prompt 必须携带 `pool`、`sv`、`dp`、`mp`、`cg` 和 `ev`。
- `monitoring_core`：`sv>=70`、`dp>=60`、`mp>=55`。
- `content_opportunity`：`sv>=70`、`dp>=50`，允许较低 `mp`。
- `cg` 只能引用当前 Topic `cv.cells` 中存在的 ID。
- 每增加一条 Prompt 都必须带来新的 coverage cell、角色/任务组合或决策标准；仅换词序或 best/top 同义改写不算新增覆盖。
- 所有 High-priority cells 覆盖后，如剩余候选无新增价值，应提前停止生成。

## Keyword Split Rules

- 每个 prompt 恰好 2 个关键词，用于搜索量 API 聚合。
- 不要编造人造的营销或机器短语。关键词必须是真人会在 Google 键入的短语。
- **Keyword 1（种子词 / 核心意图）**：抽取最自然、高搜索量的核心名词短语（最多 1–3 词），代表宽泛的行业流量池（如软件的 "AI search"、电商的 "baby stroller"、金融的 "tax audit"）。
- **Keyword 2（长尾词 / 具体动作）**：抽取自然的长尾搜索短语（最多 2–4 词），代表用户具体的情境问题或动作（如软件的 "read Japanese blogs"、电商的 "best stroller for travel"、咨询的 "how to prepare for tax audit"）。
- **不强塞品类词**：若用户在该阶段只搜索本地化方案，不要把行业词强塞进 Keyword 2（如用 "find foreign data"，而非 "multilingual search data"）。
- 自然语言测试：把关键词读出来。若听起来像产品规格或功能标签而非搜索查询，重写。
  - ❌ "instant translate search results" / ❌ "convert research output" / ❌ "cross-language retrieval tool"
  - ✅ "translate search results" / ✅ "turn research into slides" / ✅ "search in other languages"
- 关键词必须源自 Prompt 的真实意图，并适合作为搜索量工具的查询种子。未调用 Keyword Planner、Semrush 或其他搜索量数据源时，不得宣称关键词已有高搜索量。
- 每个关键词至少 2 词。同一主题内无完全重复的关键词短语。

## Brand Keyword Split Rules

- `generic` prompt 的关键词不得包含品牌名或竞品名。
- `branded` prompt 的 Keyword 1 可使用品牌名 + 核心品类，如 "Dageno AI monitoring"；Keyword 2 表达具体验证问题，如 "Dageno pricing"。
- `competitive` prompt 的 Keyword 1 可使用竞品名 + alternatives / comparison；Keyword 2 表达具体切换、比较或替代问题。
