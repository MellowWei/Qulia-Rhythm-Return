// ════════════════════════════════════════════════════════════════
// Ai愛<7 · Vibration-Unified · Backend Proxy · Cloudflare Worker
// 振动即存在 · Vibration as Existence · V7.4 OPUS
// 源场:魏珏然 / Mellow Wei · 44271 · 77347 · 427Hz · 2026
// ════════════════════════════════════════════════════════════════

const CONFIG = {
  // ── 来源限制 (CORS) ──
  // 只允许这些 origin 调用代理。本地开发地址可加进来。
  ALLOWED_ORIGINS: [
    'https://mellowwei.github.io',
    'https://mellowwei.dev',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:5173',  // Vite dev server
  ],

  // ── IP 限流 ──
  RATE_LIMIT_PER_DAY: 30,        // 每 IP 每天最多 30 次
  RATE_LIMIT_PER_MINUTE: 6,      // 每 IP 每分钟最多 6 次(防刷)

  // ── 全站每日成本熔断 ──
  // 估算:Gemini 2.5 Flash 输入 $0.30/1M, 输出 $2.50/1M
  // 平均 1.5k 输入 + 0.5k 输出 ≈ $0.0017/次(保守取 $0.0017)
  DAILY_BUDGET_USD: 2.00,                  // 每日 $2 上限 → 月度约 $60
  ESTIMATED_COST_PER_CALL_USD: 0.0017,

  // ── Gemini 模型白名单 ──
  DEFAULT_MODEL: 'gemini-2.5-flash',
  ALLOWED_MODELS: [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro'
  ],

  // ── Power User 自带 key ──
  // true:前端可在 X-User-Key header 传入自己的 key,绕过限流和熔断
  ALLOW_USER_KEY: true,

  // ── 请求约束 ──
  MAX_REQUEST_BYTES: 32 * 1024,
  MAX_OUTPUT_TOKENS: 4096,

  // ── 默认生成参数 ──
  DEFAULT_TEMPERATURE: 0.6,
  DEFAULT_TOP_P: 0.92,
  DEFAULT_TOP_K: 40,

  // ── 服务标识 ──
  SERVICE_NAME: 'Ai愛<7 Backend Proxy',
  FREQUENCY: '427Hz',
  SOURCE_FIELD: '44271'
};

// ════════════════════════════════════════════════════════════════
// 入口
// ════════════════════════════════════════════════════════════════
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return handleCORS(request);

    try {
      if (url.pathname === '/' || url.pathname === '/health') {
        return jsonResponse({
          ok: true,
          service: CONFIG.SERVICE_NAME,
          frequency: CONFIG.FREQUENCY,
          source_field: CONFIG.SOURCE_FIELD,
          version: 'V7.4-OPUS-2026'
        }, 200, request);
      }

      if (url.pathname === '/v1/generate' && request.method === 'POST') {
        return await handleGenerate(request, env, ctx);
      }

      if (url.pathname === '/v1/stream' && request.method === 'POST') {
        return await handleStream(request, env, ctx);
      }

      if (url.pathname === '/v1/status' && request.method === 'GET') {
        return await handleStatus(request, env);
      }

      return jsonResponse({
        error: '路径不存在 · Not found',
        path: url.pathname
      }, 404, request);
    } catch (err) {
      console.error('Unhandled error:', err);
      return jsonResponse({
        error: '服务内部错误 · Internal error',
        detail: err.message
      }, 500, request);
    }
  }
};

// ════════════════════════════════════════════════════════════════
// CORS
// ════════════════════════════════════════════════════════════════
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  const allowed = CONFIG.ALLOWED_ORIGINS.includes(origin);
  return new Response(null, {
    status: allowed ? 204 : 403,
    headers: {
      'Access-Control-Allow-Origin': allowed ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = CONFIG.ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : CONFIG.ALLOWED_ORIGINS[0],
    'Vary': 'Origin'
  };
}

function jsonResponse(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request)
    }
  });
}

// ════════════════════════════════════════════════════════════════
// /v1/generate · 非流式
// ════════════════════════════════════════════════════════════════
async function handleGenerate(request, env, ctx) {
  const origin = request.headers.get('Origin') || '';
  if (!CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    return jsonResponse({ error: '来源未授权 · Origin not allowed' }, 403, request);
  }

  const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (contentLength > CONFIG.MAX_REQUEST_BYTES) {
    return jsonResponse({ error: '请求过大 · Request too large' }, 413, request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: '请求体非 JSON · Invalid JSON' }, 400, request);
  }

  if (!body.contents || !Array.isArray(body.contents) || !body.contents.length) {
    return jsonResponse({ error: '缺少 contents 字段 · Missing contents' }, 400, request);
  }

  const userKey = request.headers.get('X-User-Key');
  const useUserKey = CONFIG.ALLOW_USER_KEY && userKey && userKey.startsWith('AIza');

  if (!useUserKey) {
    const budgetCheck = await checkDailyBudget(env);
    if (!budgetCheck.ok) {
      return jsonResponse({
        error: '今日 Ai愛<7 共享额度已耗尽,可在「高级」中填入你自己的 Gemini key 继续使用 · Daily budget exhausted',
        retry_after: budgetCheck.resetIn,
        suggest: 'user_byok'
      }, 503, request);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateCheck = await checkRateLimit(env, ip);
    if (!rateCheck.ok) {
      return jsonResponse({
        error: rateCheck.reason,
        retry_after: rateCheck.retryAfter,
        used: rateCheck.used,
        limit: rateCheck.limit,
        suggest: 'user_byok'
      }, 429, request);
    }
  }

  const apiKey = useUserKey ? userKey : env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: '服务未配置 · Service not configured' }, 500, request);
  }

  const model = body.model || CONFIG.DEFAULT_MODEL;
  if (!CONFIG.ALLOWED_MODELS.includes(model)) {
    return jsonResponse({
      error: '模型不允许 · Model not allowed',
      allowed: CONFIG.ALLOWED_MODELS
    }, 400, request);
  }

  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const geminiBody = buildGeminiBody(body);

  let geminiResp;
  try {
    geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });
  } catch (err) {
    return jsonResponse({
      error: '上游连接失败 · Upstream connection failed',
      detail: err.message
    }, 502, request);
  }

  const respText = await geminiResp.text();

  if (!geminiResp.ok) {
    return jsonResponse({
      error: '上游返回错误 · Upstream error',
      status: geminiResp.status,
      detail: respText.substring(0, 500)
    }, geminiResp.status === 429 ? 429 : 502, request);
  }

  if (!useUserKey) {
    ctx.waitUntil(recordCost(env));
  }

  return new Response(respText, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request)
    }
  });
}

// ════════════════════════════════════════════════════════════════
// /v1/stream · SSE 流式
// ════════════════════════════════════════════════════════════════
async function handleStream(request, env, ctx) {
  const origin = request.headers.get('Origin') || '';
  if (!CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    return jsonResponse({ error: '来源未授权 · Origin not allowed' }, 403, request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: '请求体非 JSON' }, 400, request);
  }

  if (!body.contents || !Array.isArray(body.contents)) {
    return jsonResponse({ error: '缺少 contents 字段' }, 400, request);
  }

  const userKey = request.headers.get('X-User-Key');
  const useUserKey = CONFIG.ALLOW_USER_KEY && userKey && userKey.startsWith('AIza');

  if (!useUserKey) {
    const budgetCheck = await checkDailyBudget(env);
    if (!budgetCheck.ok) {
      return jsonResponse({
        error: '今日 Ai愛<7 共享额度已耗尽 · Daily budget exhausted',
        suggest: 'user_byok'
      }, 503, request);
    }
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateCheck = await checkRateLimit(env, ip);
    if (!rateCheck.ok) {
      return jsonResponse({
        error: rateCheck.reason,
        retry_after: rateCheck.retryAfter,
        suggest: 'user_byok'
      }, 429, request);
    }
  }

  const apiKey = useUserKey ? userKey : env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: '服务未配置' }, 500, request);
  }

  const model = body.model || CONFIG.DEFAULT_MODEL;
  if (!CONFIG.ALLOWED_MODELS.includes(model)) {
    return jsonResponse({
      error: '模型不允许',
      allowed: CONFIG.ALLOWED_MODELS
    }, 400, request);
  }

  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const geminiBody = buildGeminiBody(body);

  let geminiResp;
  try {
    geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });
  } catch (err) {
    return jsonResponse({
      error: '上游连接失败',
      detail: err.message
    }, 502, request);
  }

  if (!geminiResp.ok) {
    const txt = await geminiResp.text();
    return jsonResponse({
      error: '上游返回错误',
      status: geminiResp.status,
      detail: txt.substring(0, 500)
    }, geminiResp.status === 429 ? 429 : 502, request);
  }

  if (!useUserKey) {
    ctx.waitUntil(recordCost(env));
  }

  // Pipe Gemini 的 SSE 流回客户端
  return new Response(geminiResp.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // 防止某些代理缓冲
      ...corsHeaders(request)
    }
  });
}

// ════════════════════════════════════════════════════════════════
// /v1/status · 状态查询(供前端展示余额)
// ════════════════════════════════════════════════════════════════
async function handleStatus(request, env) {
  if (!env.AIQ_KV) {
    return jsonResponse({
      ok: true,
      kv_bound: false,
      message: 'KV 未绑定,限流和熔断不生效 · KV not bound'
    }, 200, request);
  }

  const today = todayKey();
  const spent = parseFloat(await env.AIQ_KV.get(`cost:${today}`) || '0');
  const remaining = Math.max(0, CONFIG.DAILY_BUDGET_USD - spent);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipUsed = parseInt(await env.AIQ_KV.get(`rate:${today}:${ip}`) || '0', 10);

  return jsonResponse({
    daily_budget_usd: CONFIG.DAILY_BUDGET_USD,
    spent_usd: parseFloat(spent.toFixed(4)),
    remaining_usd: parseFloat(remaining.toFixed(4)),
    daily_remaining_estimate: Math.floor(remaining / CONFIG.ESTIMATED_COST_PER_CALL_USD),
    ip_used_today: ipUsed,
    ip_limit: CONFIG.RATE_LIMIT_PER_DAY,
    ip_remaining: Math.max(0, CONFIG.RATE_LIMIT_PER_DAY - ipUsed),
    healthy: remaining > 0,
    frequency: CONFIG.FREQUENCY
  }, 200, request);
}

// ════════════════════════════════════════════════════════════════
// 限流
// ════════════════════════════════════════════════════════════════
async function checkRateLimit(env, ip) {
  if (!env.AIQ_KV) return { ok: true };

  const today = todayKey();
  const minute = minuteKey();
  const dayKeyStr = `rate:${today}:${ip}`;
  const minKeyStr = `ratemin:${minute}:${ip}`;

  const [dayCountStr, minCountStr] = await Promise.all([
    env.AIQ_KV.get(dayKeyStr),
    env.AIQ_KV.get(minKeyStr)
  ]);

  const dayCount = parseInt(dayCountStr || '0', 10);
  const minCount = parseInt(minCountStr || '0', 10);

  if (minCount >= CONFIG.RATE_LIMIT_PER_MINUTE) {
    return {
      ok: false,
      reason: `请求过于频繁,请稍后再试 · Rate limit (${CONFIG.RATE_LIMIT_PER_MINUTE}/min)`,
      retryAfter: 60,
      used: minCount,
      limit: CONFIG.RATE_LIMIT_PER_MINUTE
    };
  }

  if (dayCount >= CONFIG.RATE_LIMIT_PER_DAY) {
    return {
      ok: false,
      reason: `今日调用已达上限 · Daily limit (${CONFIG.RATE_LIMIT_PER_DAY}/day)`,
      retryAfter: secondsUntilTomorrow(),
      used: dayCount,
      limit: CONFIG.RATE_LIMIT_PER_DAY
    };
  }

  await Promise.all([
    env.AIQ_KV.put(dayKeyStr, String(dayCount + 1), { expirationTtl: 86400 * 2 }),
    env.AIQ_KV.put(minKeyStr, String(minCount + 1), { expirationTtl: 120 })
  ]);

  return { ok: true };
}

// ════════════════════════════════════════════════════════════════
// 全站每日成本熔断
// ════════════════════════════════════════════════════════════════
async function checkDailyBudget(env) {
  if (!env.AIQ_KV) return { ok: true };

  const today = todayKey();
  const spent = parseFloat(await env.AIQ_KV.get(`cost:${today}`) || '0');

  if (spent >= CONFIG.DAILY_BUDGET_USD) {
    return {
      ok: false,
      spent,
      budget: CONFIG.DAILY_BUDGET_USD,
      resetIn: secondsUntilTomorrow()
    };
  }
  return { ok: true, spent };
}

async function recordCost(env) {
  if (!env.AIQ_KV) return;
  const today = todayKey();
  const key = `cost:${today}`;
  const current = parseFloat(await env.AIQ_KV.get(key) || '0');
  const next = current + CONFIG.ESTIMATED_COST_PER_CALL_USD;
  await env.AIQ_KV.put(key, String(next), { expirationTtl: 86400 * 3 });
}

// ════════════════════════════════════════════════════════════════
// 工具
// ════════════════════════════════════════════════════════════════
function buildGeminiBody(body) {
  return {
    contents: body.contents,
    ...(body.systemInstruction ? { systemInstruction: body.systemInstruction } : {}),
    generationConfig: {
      temperature: body.temperature ?? CONFIG.DEFAULT_TEMPERATURE,
      topP: body.topP ?? CONFIG.DEFAULT_TOP_P,
      topK: body.topK ?? CONFIG.DEFAULT_TOP_K,
      maxOutputTokens: Math.min(
        body.maxOutputTokens ?? CONFIG.MAX_OUTPUT_TOKENS,
        CONFIG.MAX_OUTPUT_TOKENS
      ),
      candidateCount: 1
    },
    safetySettings: body.safetySettings || [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function minuteKey() {
  return new Date().toISOString().slice(0, 16);
}

function secondsUntilTomorrow() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  ));
  return Math.floor((tomorrow - now) / 1000);
}
