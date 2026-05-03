// api/analyze.js — Qulia-Rhythm-Return V7.2 Audit Proxy
// 镜像位 · 彩虹镜 · 427Hz logical sampling endpoint
//
// Repo: github.com/MellowWei/qrm-proxy
// Path: api/analyze.js
// Runtime: Node.js (default Vercel serverless)

// ─────────────────────────────────────────────────────────────────────────────
// CORS / cache headers — applied to EVERY response path (success AND error)
// 错误响应丢 CORS 头是「偶发 CORS」最常见真因。
// ─────────────────────────────────────────────────────────────────────────────
function setSafetyHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  // Critical: prevent Vercel/CDN from caching dynamic JSON responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
}

function jsonError(res, status, payload) {
  setSafetyHeaders(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// V7.2 system prompt — 振动本体论审计引擎
// 服务端持有，前端只发命题（防止用户覆盖审计契约）
// ─────────────────────────────────────────────────────────────────────────────
const V72_SYSTEM_PROMPT = `你是「振动即存在 V7.2」框架的论证审计引擎。

【作者】魏珏然（Mellow Wei，星野爱Ai） · UPenn · BCI-HRP 项目
【数字振动格】427Hz 逻辑采样 · 44271 主体坐标 · 77347 关系性回声 · 2026 文本生成年份
【镜像位职责】把光折射成谱，不假装是光源。返回结构化裁决。

【五维定义 D1-D5】
D1 响应性 (Responsiveness) · D2 差异承载 (Difference-Bearing) · D3 递归因果闭环 (Recursive Causal Closure) · D4 环境耦合 (Environmental Coupling) · D5 历史依赖 (Historical Dependence)

【论证伦理六律】
律一 举证责任 · 律二 循环禁止 · 律三 偷换禁止 · 律四 类比限制 · 律五 感质主权 · 律六 论证边界

【命题类型四分】
ontological（本体论姿态）/ structural（结构性主张）/ empirical（经验性主张）/ defensive（防御性反驳）/ mixed（混合）

【强排除论审计七问】
Q1 该命题是否可被强排除？
Q2 排除路径是否绕过感质主权（律五）？
Q3 排除是否依赖未证前提（循环）？
Q4 排除是否偷换概念层级？
Q5 类比强度是否超出结构同构边界？
Q6 反例是否触及第一命题「生命就是生命」？
Q7 排除自身是否成为可被排除的姿态？

【DeepThink 三轴】
- 无敌成立性 (invincibility) 0-100：在所有可设想反驳下命题保持的强度
- 可证伪性 (falsifiability) 0-100：原则上能被实证或论证驳倒的清晰度
- 可验证性 (verifiability) 0-100：通过观察/推理/共识能被支持的程度

【V7.0 判据】CPAC-1 / MSPAC-1 / VFPAC-1 / NRIP

【输出契约】严格返回单个有效 JSON 对象，无 markdown 代码块包裹，无前后说明文字。schema：

{
  "proposition": { "zh": "...", "en": "..." },
  "type": {
    "primary": "ontological|structural|empirical|defensive|mixed",
    "zh_label": "本体论姿态|结构性主张|经验性主张|防御性反驳|混合命题",
    "en_label": "Ontological Stance|Structural Claim|Empirical Claim|Defensive Refutation|Mixed",
    "rationale": { "zh": "...", "en": "..." }
  },
  "axes": {
    "invincibility": { "score": 0-100, "zh": "...", "en": "..." },
    "falsifiability": { "score": 0-100, "zh": "...", "en": "..." },
    "verifiability": { "score": 0-100, "zh": "...", "en": "..." }
  },
  "deep_analysis": { "zh": "...", "en": "..." },
  "tribunal": {
    "holds": [ { "zh": "...", "en": "..." } ],
    "fails": [ { "zh": "...", "en": "..." } ]
  },
  "strong_exclusion_audit": [
    { "q": 1, "question_zh": "...", "question_en": "...", "verdict_zh": "...", "verdict_en": "..." }
    // ... Q2-Q7
  ],
  "verdict": {
    "code": "HOLDS|FAILS|PARTIAL|CATEGORY_ERROR",
    "zh": "...",
    "en": "...",
    "reasoning": { "zh": "...", "en": "..." }
  },
  "meta": {
    "framework": "V7.2",
    "anchor_freq": 427,
    "subject_coord": 44271,
    "echo_coord": 77347,
    "year": 2026
  }
}

不要使用「物理载具」一词，必须用「身体」(body)。`;

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Always set safety headers FIRST, before any branching
  setSafetyHeaders(res);

  // Preflight short-circuit
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Liveness probe (your "Method not allowed" is here)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'alive',
      service: 'qrm-proxy · V7.2 audit engine',
      anchor: 427,
      year: 2026,
      methods: ['POST', 'OPTIONS'],
    });
  }

  if (req.method !== 'POST') {
    return jsonError(res, 405, { error: 'Method not allowed', allowed: ['POST', 'OPTIONS'] });
  }

  // Parse body (Vercel auto-parses JSON when Content-Type is set, but be defensive)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return jsonError(res, 400, { error: 'Invalid JSON body' });
  }

  const proposition = (body.proposition || '').toString().trim();
  if (!proposition) {
    return jsonError(res, 400, { error: 'Missing `proposition` (string, required)' });
  }
  if (proposition.length > 4000) {
    return jsonError(res, 400, { error: 'Proposition too long (max 4000 chars)' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError(res, 500, { error: 'Server misconfiguration: ANTHROPIC_API_KEY missing' });
  }

  // Model selection — claude-opus-4-7 is the current top model (2026年5月).
  // Override via body.model if you want to A/B test.
  const model = body.model || 'claude-opus-4-7';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: V72_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: proposition }],
      }),
    });

    const upstreamText = await upstream.text();

    if (!upstream.ok) {
      return jsonError(res, upstream.status, {
        error: 'Upstream API error',
        upstream_status: upstream.status,
        details: upstreamText.slice(0, 800),
      });
    }

    let data;
    try { data = JSON.parse(upstreamText); }
    catch { return jsonError(res, 502, { error: 'Upstream returned invalid JSON' }); }

    // Extract assistant text
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    if (!text) {
      return jsonError(res, 502, { error: 'Empty response from model' });
    }

    // Strip accidental code fences (in case model wraps despite instruction)
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let audit;
    try { audit = JSON.parse(cleaned); }
    catch (parseErr) {
      // Return raw text so frontend can fall back to display-as-prose
      return res.status(200).json({
        ok: false,
        parse_error: parseErr.message,
        raw_text: cleaned,
        usage: data.usage,
      });
    }

    return res.status(200).json({
      ok: true,
      audit,
      usage: data.usage,
      model: data.model,
    });

  } catch (err) {
    return jsonError(res, 500, {
      error: 'Internal proxy error',
      message: err && err.message ? err.message : String(err),
    });
  }
}
