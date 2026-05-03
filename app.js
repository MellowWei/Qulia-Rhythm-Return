// ════════════════════════════════════════════════════════
// 振动即存在 · Vibration as Existence · V7.4 OPUS
// app.js · 后端代理优先 + BYOK 降级
// 44271 · 77347 · 427Hz · 2026
// ════════════════════════════════════════════════════════

(function () {
  'use strict';

  var CONFIG = window.AIQ_CONFIG || {};
  var BACKEND_URL = (CONFIG.BACKEND_URL || '').replace(/\/$/, '');
  var SHOW_BYOK = CONFIG.SHOW_BYOK_OPTION !== false;

  var STORAGE_KEY = 'vu_gemini_key';
  var MODEL_KEY = 'vu_gemini_model';
  var HISTORY_KEY = 'vu_history';
  var MAX_HISTORY = 20;

  // 运行时状态
  var STATE = {
    backendHealthy: null,    // null=未检查 · true=正常 · false=失效
    backendStatus: null,     // 最近一次 status 数据
    forceUserKey: false      // 用户主动选择 BYOK
  };

  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }

  // ════════════════════════════════════════════════
  // Key 管理
  // ════════════════════════════════════════════════
  function getKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
  function setKey(k) { k ? localStorage.setItem(STORAGE_KEY, k) : localStorage.removeItem(STORAGE_KEY); }
  function getModel() { return localStorage.getItem(MODEL_KEY) || CONFIG.DEFAULT_MODEL || 'gemini-2.5-flash'; }
  function setModel(m) { localStorage.setItem(MODEL_KEY, m); }

  function maskKey(k) {
    if (!k || k.length < 12) return '— 未保存';
    return k.substring(0, 6) + '••••••••' + k.substring(k.length - 4);
  }

  // ════════════════════════════════════════════════
  // 后端健康检查 + 状态查询
  // ════════════════════════════════════════════════
  async function checkBackend() {
    if (!BACKEND_URL) {
      STATE.backendHealthy = false;
      return;
    }
    try {
      var resp = await fetch(BACKEND_URL + '/v1/status', { method: 'GET' });
      if (resp.ok) {
        STATE.backendStatus = await resp.json();
        STATE.backendHealthy = STATE.backendStatus.healthy !== false;
      } else {
        STATE.backendHealthy = false;
      }
    } catch (err) {
      console.warn('Backend unreachable:', err.message);
      STATE.backendHealthy = false;
    }
    refreshStatusBanner();
  }

  function refreshStatusBanner() {
    var banner = $('#status-banner');
    if (!banner) return;

    if (!BACKEND_URL) {
      banner.innerHTML =
        '<span class="status-dot dot-warn"></span> ' +
        '后端未配置 · 请在「高级」中输入你自己的 Gemini key 使用 · ' +
        '<em>BYOK mode only</em>';
      return;
    }

    if (STATE.backendHealthy === null) {
      banner.innerHTML = '<span class="status-dot dot-pending"></span> 检查中... · checking backend...';
      return;
    }

    if (!STATE.backendHealthy) {
      banner.innerHTML =
        '<span class="status-dot dot-warn"></span> ' +
        '后端今日额度耗尽或不可用 · 可在「高级」中切到 BYOK · ' +
        '<em>Backend exhausted or down</em>';
      return;
    }

    var s = STATE.backendStatus || {};
    var remaining = s.daily_remaining_estimate;
    var ipRemaining = s.ip_remaining;

    if (STATE.forceUserKey && getKey()) {
      banner.innerHTML =
        '<span class="status-dot dot-byok"></span> ' +
        '使用自带 Gemini key · BYOK · <code>' + maskKey(getKey()) + '</code>';
      return;
    }

    var parts = ['<span class="status-dot dot-ok"></span> Ai愛&lt;7 在线 · powered by Ai愛&lt;3 source field'];
    if (typeof remaining === 'number') {
      parts.push('今日剩余约 <strong>' + remaining + '</strong> 次共享调用');
    }
    if (typeof ipRemaining === 'number') {
      parts.push('你今日剩余 <strong>' + ipRemaining + '</strong> / ' + s.ip_limit + ' 次');
    }
    banner.innerHTML = parts.join(' · ');
  }

  // ════════════════════════════════════════════════
  // 决定路由:走代理 or 走 BYOK
  // ════════════════════════════════════════════════
  function decideRoute() {
    var userKey = getKey();
    var hasUserKey = userKey && userKey.startsWith('AIza');

    // 用户主动选择 BYOK
    if (STATE.forceUserKey && hasUserKey) {
      return { mode: 'byok', key: userKey };
    }

    // 后端可用 → 走代理
    if (BACKEND_URL && STATE.backendHealthy !== false) {
      return { mode: 'proxy' };
    }

    // 后端不可用但用户有 key → 走 BYOK
    if (hasUserKey) {
      return { mode: 'byok', key: userKey };
    }

    // 都没有 → 阻塞,提示用户配置
    return { mode: 'none' };
  }

  // ════════════════════════════════════════════════
  // 调用:代理 or BYOK
  // ════════════════════════════════════════════════
  function callGemini(prop, onChunk, onDone, onError) {
    var route = decideRoute();
    var model = getModel();

    if (route.mode === 'none') {
      onError('未配置后端,且未输入自带 key。请展开「高级」配置。 · No backend configured, no user key.');
      return;
    }

    var systemPrompt = window.AIQ_SYSTEM_PROMPT;
    var bodyData = {
      model: model,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: prop }] }],
      temperature: 0.6,
      topP: 0.92,
      topK: 40,
      maxOutputTokens: 4096
    };

    var url, headers;

    if (route.mode === 'proxy') {
      url = BACKEND_URL + '/v1/stream';
      headers = { 'Content-Type': 'application/json' };
    } else {
      // BYOK: 直接调 Google
      url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
            encodeURIComponent(model) +
            ':streamGenerateContent?alt=sse&key=' + encodeURIComponent(route.key);
      headers = { 'Content-Type': 'application/json' };
      bodyData.safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ];
    }

    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyData)
    }).then(async function (resp) {
      if (!resp.ok) {
        var errText = await resp.text();
        var errObj;
        try { errObj = JSON.parse(errText); } catch { errObj = { error: errText.substring(0, 300) }; }

        // 后端建议降级到 BYOK
        if (resp.status === 503 || resp.status === 429) {
          if (errObj.suggest === 'user_byok' && route.mode === 'proxy') {
            STATE.backendHealthy = false;
            refreshStatusBanner();
            // 弹出 BYOK 引导
            onError(errObj.error + '\n\n→ 提示:展开「高级」输入你自己的 Gemini key 立即继续使用。');
            autoOpenAdvanced();
            return;
          }
        }

        throw new Error(
          (route.mode === 'proxy' ? '后端' : '上游') + '错误 (HTTP ' + resp.status + '): ' +
          (errObj.error || errText.substring(0, 200))
        );
      }

      // 流式读取
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var fullText = '';

      function pump() {
        reader.read().then(function (result) {
          if (result.done) { onDone(fullText); return; }
          buffer += decoder.decode(result.value, { stream: true });
          var events = buffer.split('\n\n');
          buffer = events.pop();
          for (var i = 0; i < events.length; i++) {
            var ev = events[i].trim();
            if (!ev || !ev.startsWith('data:')) continue;
            var data = ev.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              var parsed = JSON.parse(data);
              var candidates = parsed.candidates || [];
              if (candidates[0] && candidates[0].content) {
                var parts = candidates[0].content.parts || [];
                for (var j = 0; j < parts.length; j++) {
                  if (parts[j].text) {
                    fullText += parts[j].text;
                    onChunk(parts[j].text, fullText);
                  }
                }
              }
            } catch (e) {}
          }
          pump();
        }).catch(function (err) {
          onError('流式读取错误: ' + err.message);
        });
      }
      pump();
    }).catch(function (err) {
      onError(err.message || '请求失败 · Request failed');
    });
  }

  function autoOpenAdvanced() {
    var det = $('.key-details');
    if (det) det.open = true;
  }

  // ════════════════════════════════════════════════
  // 历史
  // ════════════════════════════════════════════════
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveHistory(prop, response) {
    var h = getHistory();
    h.unshift({ prop: prop, response: response, time: new Date().toISOString(), model: getModel() });
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }
    catch (e) {}
    renderHistory();
  }
  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
  function renderHistory() {
    var h = getHistory();
    var box = $('#history-block');
    var list = $('#history-list');
    if (!box || !list) return;
    if (!h.length) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    list.innerHTML = '';
    for (var i = 0; i < h.length; i++) {
      var item = h[i];
      var card = document.createElement('div');
      card.className = 'history-item';
      var time = new Date(item.time).toLocaleString('zh-CN', { hour12: false });
      card.innerHTML =
        '<div class="hist-meta">' + time + ' · ' + (item.model || 'gemini') + '</div>' +
        '<div class="hist-prop">' + escapeHtml(item.prop) + '</div>' +
        '<button class="hist-replay" data-idx="' + i + '">↺ 重新查看</button>';
      list.appendChild(card);
    }
    $$('.hist-replay').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var item = getHistory()[idx];
        if (!item) return;
        $('#prop-input').value = item.prop;
        renderResponse(item.response, item.prop, true);
        var out = $('#output');
        if (out) window.scrollTo({ top: out.offsetTop - 30, behavior: 'smooth' });
      });
    });
  }

  // ════════════════════════════════════════════════
  // Markdown
  // ════════════════════════════════════════════════
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderMarkdown(md) {
    if (!md) return '';
    var html = escapeHtml(md);
    html = html.replace(/```([\s\S]*?)```/g, function (m, code) {
      return '<pre class="md-pre">' + code.trim() + '</pre>';
    });
    html = html.replace(/`([^`\n]+)`/g, '<code class="md-code">$1</code>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    html = html.replace(/((?:^\|.*\|\s*\n)+)/gm, function (block) {
      var rows = block.trim().split('\n');
      var out = '<table class="md-table">';
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i].trim();
        if (/^\|[\s\-\|:]+\|$/.test(r)) continue;
        var cells = r.replace(/^\||\|$/g, '').split('|');
        var tag = i === 0 ? 'th' : 'td';
        out += '<tr>';
        for (var c = 0; c < cells.length; c++) {
          out += '<' + tag + '>' + cells[c].trim() + '</' + tag + '>';
        }
        out += '</tr>';
      }
      out += '</table>';
      return out;
    });
    html = html.replace(/^---+$/gm, '<hr class="md-hr">');
    html = html.replace(/((?:^[-•] .+\n?)+)/gm, function (block) {
      var items = block.trim().split('\n');
      var out = '<ul class="md-ul">';
      for (var i = 0; i < items.length; i++) {
        out += '<li>' + items[i].replace(/^[-•] /, '') + '</li>';
      }
      out += '</ul>';
      return out;
    });
    var paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(function (p) {
      p = p.trim();
      if (!p) return '';
      if (/^<(h\d|pre|table|ul|ol|hr|blockquote)/.test(p)) return p;
      return '<p class="md-p">' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');
    return html;
  }

  function detectVerdict(text) {
    if (/不受理|inadmissible/i.test(text)) return { color: '#d4a8a8', label: '不受理 · Inadmissible' };
    if (/裁决.{0,5}成立(?!部分)/.test(text) || /verdict.{0,8}holds(?!.{0,8}partial)/i.test(text)) {
      if (!/不成立|does not hold/i.test(text)) {
        return { color: '#b8d4b8', label: '成立 · Holds' };
      }
    }
    if (/部分成立|partial hold/i.test(text)) return { color: '#e8d3a6', label: '部分成立 · Partial' };
    if (/不成立|does not hold/i.test(text)) return { color: '#d4a8a8', label: '不成立 · Does Not Hold' };
    return null;
  }

  // ════════════════════════════════════════════════
  // 渲染响应
  // ════════════════════════════════════════════════
  function renderResponse(responseText, prop, fromHistory) {
    var output = $('#output');
    var verdict = detectVerdict(responseText);
    var verdictBadge = verdict
      ? '<div class="verdict-badge" style="border-color:' + verdict.color + ';color:' + verdict.color + ';">' + verdict.label + '</div>'
      : '';

    var route = decideRoute();
    var routeLabel = route.mode === 'proxy' ? 'PROXY' : (route.mode === 'byok' ? 'BYOK' : 'NONE');

    output.innerHTML =
      '<div class="response-card">' +
        '<div class="response-head">' +
          '<div class="response-meta">' +
            'Ai愛&lt;7 · V7.4 OPUS · ' + routeLabel + ' · ' +
            (fromHistory ? 'REPLAYED · ' : '') +
            new Date().toLocaleString('zh-CN', { hour12: false }) +
          '</div>' +
          verdictBadge +
        '</div>' +
        '<div class="response-prop">「' + escapeHtml(prop) + '」</div>' +
        '<div class="response-body" id="response-body">' + renderMarkdown(responseText) + '</div>' +
        '<div class="response-actions">' +
          '<button class="action-btn" id="copy-btn">复制 · Copy</button>' +
          '<button class="action-btn" id="export-btn">导出 · Export</button>' +
          '<button class="action-btn" id="share-btn">分享 · Share</button>' +
        '</div>' +
      '</div>';

    $('#copy-btn').addEventListener('click', function () {
      navigator.clipboard.writeText(responseText).then(function () {
        $('#copy-btn').textContent = '✓ 已复制';
        setTimeout(function () { $('#copy-btn').textContent = '复制 · Copy'; }, 1600);
      });
    });

    $('#export-btn').addEventListener('click', function () {
      var content = '# 振动即存在 · 论证分析\n## Vibration as Existence · Proposition Analysis\n\n' +
                    '**命题:** ' + prop + '\n\n' +
                    '**时间:** ' + new Date().toISOString() + '\n' +
                    '**版本:** V7.4 OPUS · ' + getModel() + '\n' +
                    '**路由:** ' + routeLabel + '\n\n' +
                    '---\n\n' + responseText + '\n\n---\n\n' +
                    '// 44271 · 77347 · 427Hz · 2026 · V7.4 OPUS\n' +
                    '// Ai愛<7 · 审判位 · Adjudication Position\n' +
                    '// 魏珏然 · Wei Jueran · 星野愛Ai\n';
      var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'vibration-analysis-' + Date.now() + '.md';
      a.click();
      URL.revokeObjectURL(url);
    });

    $('#share-btn').addEventListener('click', function () {
      var snippet = prop.length > 60 ? prop.substring(0, 60) + '...' : prop;
      var text = '「' + snippet + '」\n\n振动即存在 · Ai愛<7 V7.4 OPUS\n44271 · 427Hz';
      if (navigator.share) {
        navigator.share({ title: '振动即存在', text: text }).catch(function () {});
      } else {
        navigator.clipboard.writeText(text);
        $('#share-btn').textContent = '✓ 已复制';
        setTimeout(function () { $('#share-btn').textContent = '分享 · Share'; }, 1600);
      }
    });
  }

  // ════════════════════════════════════════════════
  // 主流程
  // ════════════════════════════════════════════════
  function runAnalyze() {
    var input = $('#prop-input');
    var prop = (input.value || '').trim();
    var output = $('#output');

    if (!prop) {
      output.innerHTML = '<div class="empty-state">请输入命题 · Enter a proposition.</div>';
      return;
    }

    var route = decideRoute();
    if (route.mode === 'none') {
      output.innerHTML =
        '<div class="error-state">' +
          '◇ 服务暂不可用 · 请展开「高级」输入你自己的 Gemini key 继续<br>' +
          '<a href="https://aistudio.google.com/apikey" target="_blank">↗ 免费获取 key</a>' +
        '</div>';
      autoOpenAdvanced();
      return;
    }

    var routeLabel = route.mode === 'proxy' ? '通过 Ai愛<7 共享代理' : '使用你的 Gemini key';

    output.innerHTML =
      '<div class="response-card">' +
        '<div class="response-head">' +
          '<div class="response-meta">' + routeLabel + ' · ' + getModel() + ' · ' +
            new Date().toLocaleTimeString('zh-CN', { hour12: false }) +
          '</div>' +
        '</div>' +
        '<div class="response-prop">「' + escapeHtml(prop) + '」</div>' +
        '<div class="loading-pulse">' +
          '振动采样中<br>' +
          '<em>sampling vibration...</em>' +
        '</div>' +
        '<div class="response-body" id="response-body"></div>' +
      '</div>';

    var bodyEl = $('#response-body');
    callGemini(prop,
      function (chunk, full) {
        var loading = output.querySelector('.loading-pulse');
        if (loading) loading.style.display = 'none';
        bodyEl.innerHTML = renderMarkdown(full);
      },
      function (full) {
        renderResponse(full, prop, false);
        saveHistory(prop, full);
        // 调用成功后重新 ping 后端 status,更新剩余次数显示
        if (route.mode === 'proxy') {
          setTimeout(checkBackend, 800);
        }
      },
      function (msg) {
        output.innerHTML =
          '<div class="error-state">' +
            '◇ ' + escapeHtml(msg).replace(/\n/g, '<br>') +
          '</div>';
      }
    );
  }

  // ════════════════════════════════════════════════
  // 粒子场(QRM 美学)
  // ════════════════════════════════════════════════
  function initParticles() {
    var canvas = document.getElementById('particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr;
    var particles = [];
    var palette = [
      'rgba(232, 211, 166, ',
      'rgba(184, 212, 212, ',
      'rgba(212, 184, 212, ',
      'rgba(255, 255, 255, ',
      'rgba(232, 211, 166, '
    ];

    function resize() {
      dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      particles.length = 0;
      var density = Math.sqrt(w * h) / 1100;
      var n = Math.floor(320 * density);
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.3 + Math.random() * 1.3,
          color: palette[Math.floor(Math.random() * palette.length)],
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.005 + Math.random() * 0.018,
          baseAlpha: 0.15 + Math.random() * 0.55,
          isBig: Math.random() > 0.92
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.phase += p.phaseSpeed;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        var alpha = p.baseAlpha * (0.4 + Math.sin(p.phase) * 0.6);
        alpha = Math.max(0, Math.min(1, alpha));
        if (p.isBig) {
          var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 10);
          grad.addColorStop(0, p.color + alpha + ')');
          grad.addColorStop(0.4, p.color + (alpha * 0.3) + ')');
          grad.addColorStop(1, p.color + '0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = p.color + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(tick);
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(init, 200);
    });
    init();
    tick();
  }

  // ════════════════════════════════════════════════
  // 审计条 + 仪表板
  // ════════════════════════════════════════════════
  function initAuditBars() {
    var bars = document.querySelectorAll('.axis-bar');
    if (!bars.length) return;
    function fill() {
      bars.forEach(function (b) {
        b.style.width = (b.dataset.fill || 50) + '%';
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { fill(); io.disconnect(); }
        });
      }, { threshold: 0.3 });
      var target = document.querySelector('.audit');
      if (target) io.observe(target);
    } else {
      setTimeout(fill, 600);
    }
  }

  function initDashboard() {
    var freqEl = $('#dash-freq');
    var phaseEl = $('#dash-phase');
    var ampEl = $('#dash-amp');
    if (!freqEl) return;
    var t = 0;
    setInterval(function () {
      t += 0.04;
      freqEl.textContent = (427 + Math.sin(t * 0.7) * 0.6).toFixed(2) + ' Hz';
      phaseEl.textContent = ((t * 0.3) % (Math.PI * 2)).toFixed(3) + ' rad';
      ampEl.textContent = (0.85 + Math.sin(t * 1.1) * 0.15).toFixed(3);
    }, 90);
  }

  // ════════════════════════════════════════════════
  // BYOK 高级面板控制
  // ════════════════════════════════════════════════
  function refreshKeyStatus() {
    var status = $('#key-status');
    if (!status) return;
    var key = getKey();
    if (key) {
      status.innerHTML =
        '<span class="status-ok">✓ Key 已保存</span> · ' +
        '<code>' + maskKey(key) + '</code> · ' +
        '<span class="status-model">' + getModel() + '</span>' +
        '<br><label class="byok-toggle">' +
          '<input type="checkbox" id="force-byok"' + (STATE.forceUserKey ? ' checked' : '') + '> ' +
          '强制使用我的 key(跳过共享代理)· Force BYOK mode' +
        '</label>';
      var cb = $('#force-byok');
      if (cb) {
        cb.addEventListener('change', function () {
          STATE.forceUserKey = cb.checked;
          refreshStatusBanner();
        });
      }
    } else {
      status.innerHTML = '<span class="status-warn">◇ 未配置自带 key</span>';
    }
  }

  function bind() {
    if ($('#api-key')) $('#api-key').value = getKey();
    if ($('#model-select')) $('#model-select').value = getModel();
    refreshKeyStatus();
    renderHistory();

    if ($('#save-key')) {
      $('#save-key').addEventListener('click', function () {
        var k = $('#api-key').value.trim();
        var m = $('#model-select').value;
        setKey(k);
        setModel(m);
        refreshKeyStatus();
        refreshStatusBanner();
        $('#save-key').textContent = '✓ 已保存';
        setTimeout(function () { $('#save-key').textContent = '保存 · Save'; }, 1400);
      });
    }
    if ($('#model-select')) {
      $('#model-select').addEventListener('change', function () {
        setModel($('#model-select').value);
      });
    }

    $$('.presets button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('#prop-input').value = btn.getAttribute('data-preset');
        $('#prop-input').focus();
      });
    });

    if ($('#analyze-btn')) {
      $('#analyze-btn').addEventListener('click', runAnalyze);
    }

    if ($('#prop-input')) {
      $('#prop-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          runAnalyze();
        } else if (e.key === 'Escape') {
          $('#prop-input').value = '';
        }
      });
    }

    if ($('#clear-history')) {
      $('#clear-history').addEventListener('click', function () {
        if (confirm('清空所有历史? · Clear all history?')) clearHistory();
      });
    }
  }

  function boot() {
    initParticles();
    initAuditBars();
    initDashboard();
    bind();
    checkBackend();
    // 每 2 分钟重新 ping 后端
    setInterval(checkBackend, 120000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
