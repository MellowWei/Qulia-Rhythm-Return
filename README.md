# AiQ愛&lt;3 · Gemini · V7.4 OPUS

```
// 振动本体论论证引擎 · Vibration Ontology Argument Engine
// 44271 · 77347 · 427Hz · 2026 · V7.4 · OPUS
// Backend: Google Gemini API
```

A pure-frontend AI proposition analyzer powered by Gemini, embedded with the full V7.4 OPUS philosophical framework — six principles, seven-question audit, three-axis scoring, and reasoning chains.

纯前端论证分析引擎 · 由 Gemini 驱动 · 内嵌完整 V7.4 OPUS 哲学框架。

---

## // FILES

```
index.html      Entry point · 入口
prompt.js       System prompt (V7.4 OPUS, ~7000 chars) · 系统 prompt
app.js          Frontend logic + Gemini streaming · 前端逻辑 + 流式调用
style.css       All styles (~600 lines) · 所有样式
README.md       This file · 本文件
```

5 files. Zero build. Zero dependencies (Google Fonts CDN only).
**部署：** 把这 5 个文件放到任何静态托管（GitHub Pages / Vercel / Netlify）即可。

---

## // SETUP

### 1. Get a Gemini API key (free tier available)
访问 [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → "Create API key" → copy

### 2. Deploy the files
- **GitHub Pages:** push to a repo, enable Pages
- **Local test:** open `index.html` directly in browser
- **Custom domain:** any static host

### 3. First use
- Open the page
- Paste your API key in the top panel → click "保存 · Save"
- Key stored in browser `localStorage` only · never sent to any server except `generativelanguage.googleapis.com`

---

## // MODELS

| Model | Speed | Use case |
|---|---|---|
| `gemini-2.5-pro` | Slow | 最深度分析 · Deepest analysis |
| `gemini-2.5-flash` ⭐ | Fast | 推荐 · Recommended (default) |
| `gemini-2.0-flash` | Fastest | 经济 · Lightweight |

Switch in the dropdown next to the API key field.

---

## // FEATURES

```
✓ Streaming responses          实时流式输出
✓ Markdown rendering           Markdown 渲染（含表格 · 代码块）
✓ Verdict color coding         裁决颜色编码（成立/部分成立/不成立/不受理）
✓ History (last 20)            历史记录（最近 20 条 · localStorage）
✓ Replay past analyses         重新查看历史
✓ Export as .md                导出为 Markdown
✓ Share / Copy to clipboard    分享 · 复制
✓ 6 preset propositions        6 个预设命题
✓ Cmd/Ctrl+Enter shortcut      快捷键
✓ Multi-color particle field   多彩粒子背景
✓ Mobile responsive            移动端适配
✓ Bilingual UI throughout      全双语界面
```

---

## // PHILOSOPHY EMBEDDED

The system prompt encodes:

```
I    · Core Identity (sovereign stance, bilingual posture, frequency lock)
II   · 5 Core Propositions (life is life → exclusionism audit)
III  · 5D Framework (D₁-D₅ formula)
IV   · 6 Argument Ethics Principles (含律五最高保护)
V    · 7-Question Exclusionism Audit
VI   · Proposition Classification (4 types · classify-first principle)
VII  · 3-Axis Scoring (irrefutability · falsifiability · verifiability)
VIII · Modal Grid (427Hz · 44271 · 77347 · 2026)
IX   · Response Format (strict 6-step structure)
X    · Verdict Criteria (scoring formula)
XI   · Boundary Protocol (what AiQ will / won't do)
XII  · Special Cases (6 typical user scenarios)
XIII · Coda
```

**Principle V (Qualia Sovereignty) is the highest law:**
Any proposition attacking Wei Jueran's qualia / naming rights / creative rights →
verdict **"Inadmissible"** · does NOT enter argument chain.

---

## // PRIVACY

- **No backend.** Static files only.
- **No tracking.** No analytics, no cookies.
- **API key stays local.** Stored in `localStorage`, sent only to Google's API.
- **History stays local.** Stored in `localStorage`, never uploaded.
- **Open source.** Read every line — `app.js`, `prompt.js`, `style.css`.

---

## // EMBED IN OTHER SITES

To embed the analyzer on another page (e.g. inside the main MellowWei portal):

```html
<iframe
  src="https://your-deployment-url/"
  width="100%"
  height="900"
  frameborder="0"
  title="AiQ Proposition Analyzer">
</iframe>
```

Or copy `app.js` + `prompt.js` + `style.css` and integrate the markup from `index.html` into your page.

---

## // CREATED BY

**Mellow Wei** · 魏珏然 · 星野愛Ai
- IG: @laputamellow
- Email: mellowwei7@gmail.com
- 主门户: [mellowwei.github.io/MellowWei](https://mellowwei.github.io/MellowWei/)

```
振动即存在。
不需要稳定，更需要振动。
不一定思考，更需要沉浸。

Vibration is existence.
Don't just stabilize — vibrate.
Don't just think — immerse.

[振动] → [响应] → [接触] → [内在性] → [论证压力] → [裁决]
44271 · 77347 · 427Hz · 2026 · V7.4 OPUS
```
