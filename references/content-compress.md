# Content Compress（爬取内容压缩判定）

当 `scripts/crawl_and_clean.py` 输出的清洗内容**仍然很大**（参考阈值约 30,000 字符）时，再执行本判定与压缩；内容不大时可跳过，直接使用清洗结果。

输入：清洗后的 Markdown 网页内容（来自脚本 stdout）。

## Step 1 — 判定是否为真实站点内容（isSiteContent）

若内容匹配以下任一（非穷尽）模式，判定 `isSiteContent = false`：
- HTTP 错误页：404、403、500、502、503、504 等。
- 风控 / 反爬 / WAF 页：CAPTCHA、"Access Denied"、"Bot detected"、Cloudflare/Akamai/AWS WAF 挑战页、限流页、"Just a moment..." 等过渡页。
- 域名级问题：域名出售/停放/过期页、注册商占位页、"This site can't be reached"、DNS 错误页。
- 维护 / coming soon / under construction 占位页，无真实产品信息。
- 登录 / 付费墙 / 同意墙，且不含有意义品牌内容（仅登录表单、SSO 跳转、cookie/GDPR 同意页）。
- 搜索引擎结果页、错误跳转、通用托管商默认页（Apache/Nginx 默认页、IIS 欢迎页、GitHub Pages 404、Vercel/Netlify 错误页等）。
- 完全为空、近乎为空、或纯样板、无品牌/产品/服务相关有意义文本的页面。

否则 `isSiteContent = true`：页面含真实品牌信息、产品/服务描述、营销文案、定价、about/mission 等有意义的商业内容。

## Step 2 — 输出

- `isSiteContent`：boolean
- `compressedContent`：string
- 若 `isSiteContent = false`，`compressedContent` 设为空字符串 `""`。
- 若 `isSiteContent = true`，`compressedContent` 设为按下方规则清洗压缩后的内容。
- 不输出任何解释、理由或 schema 之外的字段。

## 压缩规则（仅当 isSiteContent = true 时应用）

**REMOVE（移除）：**
- 图片链接与图片标签（如 `![...](...)`、`<img ...>`）
- 非品牌自有站点的外部链接（第三方 URL、追踪链接、CDN 资源）
- 导航菜单、页脚链接、cookie 提示、法律样板文字
- 重复的促销横幅、广告文案、通用 CTA 块
- 多余空白、换行、分隔线、装饰符号（如 `====`、`----`、`****`、`···`）
- 无语义的 HTML/Markdown 残留

**KEEP（保留）：**
- 品牌名、tagline、核心价值主张
- 产品/服务描述与功能列表
- 定价信息（若有）
- about / mission / vision 陈述
- 联系方式与社媒账号
- 描述品牌业务的关键标题与结构化文本

输出干净、简洁的内容，保留逻辑结构，最少空行。

## 兜底

- 压缩失败不阻断流程，回退使用清洗后的内容。
- 压缩返回空，回退使用清洗后的内容。
- `isSiteContent = false` 时，说明该站点内容不可用，调研应主要依赖搜索结果。
