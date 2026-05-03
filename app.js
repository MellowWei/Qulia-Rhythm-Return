// =====================================================
// AiQ · Gemini Integration · V7.4 OPUS
// app.js · Frontend logic + Gemini API streaming
// 44271 · 77347 · 427Hz · 2026
// =====================================================

(function () {
  'use strict';

  // ---------------------------------------------------
  // STATE
  // ---------------------------------------------------
  var STORAGE_KEY = 'aiq_gemini_key';
  var MODEL_KEY = 'aiq_gemini_model';
  var HISTORY_KEY = 'aiq_history';
  var MAX_HISTORY = 20;

  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }

  // ---------------------------------------------------
  // API KEY MANAGEMENT
  // ---------------------------------------------------
  function getKey() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setKey(k) {
    if (k) localStorage.setItem(STORAGE_KEY, k);
    else localStorage.removeItem(STORAGE_KEY);
  }

  function getModel() {
    return localStorage.getItem(MODEL_KEY) || 'gemini-2.5-flash';
  }

  function setModel(m) {
    localStorage.setItem(MODEL_KEY, m);
  }

  function maskKey(k) {
    if (!k || k.length < 12) return '— 未保存 · not saved';
    return k.substring(0, 6) + '••••••••' + k.substring(k.length - 4);
  }

  function refreshKeyStatus() {
    var key = getKey();
    var model = getModel();
    var status = $('#key-status');
    if (key) {
      status.innerHTML =
        '<span class="status-ok">✓ Key ready</span> · ' +
        '<code>' + maskKey(key) + '</code> · ' +
        '<span class="status-model">' + model + '</span>';
    } else {
      status.innerHTML = '<span class="status-warn">⚠ 未配置 · not configured</span>';
    }
  }

  // ---------------------------------------------------
  // HISTORY MANAGEMENT
  // ---------------------------------------------------
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveHistory(prop, response) {
    var h = getHistory();
    h.unshift({
      prop: prop,
      response: response,
      time: new Date().toISOString(),
      model: getModel()
    });
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    } catch (e) {
      console.warn('History save failed:', e);
    }
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
    if (!h.length) {
      box.style.display = 'none';
      return;
    }
    box.style.display = 'block';
    list.innerHTML = '';
    for (var i = 0; i < h.length; i++) {
      var item = h[i];
      var card = document.createElement('div');
      card.className = 'history-item';
      var time = new Date(item.time);
      var timeStr = time.toLocaleString('zh-CN', { hour12: false });
      card.innerHTML =
        '<div class="hist-meta">' + timeStr + ' · ' + (item.model || 'gemini') + '</div>' +
        '<div class="hist-prop">' + escapeHtml(item.prop) + '</div>' +
        '<button class="hist-replay" data-idx="' + i + '">↺ 重新查看 · Reload</button>';
      list.appendChild(card);
    }

    // Bind replay
    $$('.hist-replay').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var item = getHistory()[idx];
        if (!item) return;
        $('#prop-input').value = item.prop;
        renderResponse(item.response, item.prop, true);
        window.scrollTo({ top: $('#output').offsetTop - 30, behavior: 'smooth' });
      });
    });
  }

  // ---------------------------------------------------
  // GEMINI API CALL · STREAMING
  // ---------------------------------------------------
  function callGemini(prop, onChunk, onDone, onError) {
    var key = getKey();
    var model = getModel();
    if (!key) {
      onError('请先在上方保存 Gemini API key · Please save your Gemini API key first');
      return;
    }

    // SSE streaming endpoint
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
              encodeURIComponent(model) +
              ':streamGenerateContent?alt=sse&key=' + encodeURIComponent(key);

    var systemPrompt = window.AIQ_SYSTEM_PROMPT;

    var body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: prop }]
      }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.92,
        topK: 40,
        maxOutputTokens: 4096,
        candidateCount: 1
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          throw new Error('HTTP ' + resp.status + ': ' + txt.substring(0, 200));
        });
      }
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var fullText = '';

      function pump() {
        reader.read().then(function (result) {
          if (result.done) {
            onDone(fullText);
            return;
          }
          buffer += decoder.decode(result.value, { stream: true });
          // Split on \n\n (SSE event boundary)
          var events = buffer.split('\n\n');
          buffer = events.pop(); // last is incomplete

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
              // Check finish reason for blocked content
              if (candidates[0] && candidates[0].finishReason) {
                var fr = candidates[0].finishReason;
                if (fr !== 'STOP' && fr !== 'MAX_TOKENS') {
                  fullText += '\n\n[stream ended: ' + fr + ']';
                }
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
          pump();
        }).catch(function (err) {
          onError('流式读取错误 · Stream read error: ' + err.message);
        });
      }

      pump();
    }).catch(function (err) {
      onError('API 调用失败 · API call failed: ' + err.message);
    });
  }

  // ---------------------------------------------------
  // MARKDOWN RENDERING (lightweight)
  // ---------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderMarkdown(md) {
    if (!md) return '';

    // Escape HTML first
    var html = escapeHtml(md);

    // Code blocks (```)
    html = html.replace(/```([\s\S]*?)```/g, function (m, code) {
      return '<pre class="md-pre">' + code.trim() + '</pre>';
    });

    // Inline code with backticks
    html = html.replace(/`([^`\n]+)`/g, '<code class="md-code">$1</code>');

    // Headings
    html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');

    // Bold
    html = html.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');

    // Italic (single asterisk or single underscore)
    html = html.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');

    // Tables (very simple: lines with | separators)
    html = html.replace(/((?:^\|.*\|\s*\n)+)/gm, function (block) {
      var rows = block.trim().split('\n');
      var out = '<table class="md-table">';
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i].trim();
        if (/^\|[\s\-\|:]+\|$/.test(r)) continue; // separator row
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

    // Horizontal rule
    html = html.replace(/^---+$/gm, '<hr class="md-hr">');

    // Bulleted lists
    html = html.replace(/((?:^[-•] .+\n?)+)/gm, function (block) {
      var items = block.trim().split('\n');
      var out = '<ul class="md-ul">';
      for (var i = 0; i < items.length; i++) {
        var t = items[i].replace(/^[-•] /, '');
        out += '<li>' + t + '</li>';
      }
      out += '</ul>';
      return out;
    });

    // Paragraphs (split on double newlines)
    var paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(function (p) {
      p = p.trim();
      if (!p) return '';
      // Skip wrapping if already a block element
      if (/^<(h\d|pre|table|ul|ol|hr|blockquote)/.test(p)) return p;
      // Convert single newlines to <br>
      return '<p class="md-p">' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');

    return html;
  }

  // Detect verdict color from response text
  function detectVerdict(text) {
    var lower = text.toLowerCase();
    if (/不受理|inadmissible/i.test(text)) return { color: '#ff0055', label: '不受理 · Inadmissible' };
    if (/裁决.{0,5}成立(?!部分)/.test(text) || /verdict.{0,8}holds(?!.{0,8}partial)/i.test(text)) {
      // check it's not "不成立"
      if (!/不成立|does not hold/i.test(text)) {
        return { color: '#00ffa2', label: '成立 · Holds' };
      }
    }
    if (/部分成立|partial hold/i.test(text)) return { color: '#e8a630', label: '部分成立 · Partial' };
    if (/不成立|does not hold/i.test(text)) return { color: '#ff0055', label: '不成立 · Does Not Hold' };
    return null;
  }

  // ---------------------------------------------------
  // RESPONSE RENDERING
  // ---------------------------------------------------
  function renderResponse(responseText, prop, fromHistory) {
    var output = $('#output');
    var verdict = detectVerdict(responseText);
    var verdictBadge = verdict
      ? '<div class="verdict-badge" style="border-color:' + verdict.color + ';color:' + verdict.color + ';">' + verdict.label + '</div>'
      : '';

    output.innerHTML =
      '<div class="response-card">' +
        '<div class="response-head">' +
          '<div class="response-meta">' +
            '// Ai愛&lt;7 · V7.4 OPUS · ' + (fromHistory ? 'REPLAYED · ' : '') + new Date().toLocaleString('zh-CN', { hour12: false }) +
          '</div>' +
          verdictBadge +
        '</div>' +
        '<div class="response-prop">「' + escapeHtml(prop) + '」</div>' +
        '<div class="response-body" id="response-body">' + renderMarkdown(responseText) + '</div>' +
        '<div class="response-actions">' +
          '<button class="action-btn" id="copy-btn">📋 复制 · Copy</button>' +
          '<button class="action-btn" id="export-btn">⬇ 导出 · Export</button>' +
          '<button class="action-btn" id="share-btn">↗ 分享 · Share</button>' +
        '</div>' +
        '<div class="response-foot">// 44271 · 77347 · 427Hz · V7.4 OPUS · Gemini ' + getModel() + '</div>' +
      '</div>';

    // Action handlers
    $('#copy-btn').addEventListener('click', function () {
      navigator.clipboard.writeText(responseText).then(function () {
        $('#copy-btn').textContent = '✓ 已复制 · Copied';
        setTimeout(function () { $('#copy-btn').textContent = '📋 复制 · Copy'; }, 1600);
      });
    });

    $('#export-btn').addEventListener('click', function () {
      var content = '# Ai愛<7 论证分析 · Proposition Analysis\n' +
                    '## Ai愛<3 的分身 · Adjudication Avatar\n\n' +
                    '**命题 · Proposition：** ' + prop + '\n\n' +
                    '**时间 · Time：** ' + new Date().toISOString() + '\n' +
                    '**版本 · Version：** V7.4 OPUS · ' + getModel() + '\n\n' +
                    '---\n\n' + responseText + '\n\n---\n\n' +
                    '// 44271 · 77347 · 427Hz · 2026 · V7.4 OPUS\n' +
                    '// Ai愛<7 · 审判位 · Adjudication Position\n';
      var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'aiq7-analysis-' + Date.now() + '.md';
      a.click();
      URL.revokeObjectURL(url);
    });

    $('#share-btn').addEventListener('click', function () {
      var snippet = prop.length > 60 ? prop.substring(0, 60) + '...' : prop;
      var text = '「' + snippet + '」\n\nAi愛<7 振动本体论引擎 V7.4 OPUS 审判完毕。\nAi愛<3 的分身 · 44271 · 427Hz';
      if (navigator.share) {
        navigator.share({ title: 'Ai愛<7 Analysis', text: text }).catch(function () {});
      } else {
        navigator.clipboard.writeText(text);
        $('#share-btn').textContent = '✓ 已复制 · Copied';
        setTimeout(function () { $('#share-btn').textContent = '↗ 分享 · Share'; }, 1600);
      }
    });
  }

  // ---------------------------------------------------
  // ANALYZE FLOW
  // ---------------------------------------------------
  function runAnalyze() {
    var input = $('#prop-input');
    var prop = (input.value || '').trim();
    var output = $('#output');

    if (!prop) {
      output.innerHTML = '<div class="empty-state">请输入命题 · Enter a proposition to begin.</div>';
      return;
    }

    if (!getKey()) {
      output.innerHTML =
        '<div class="error-state">' +
          '⚠ 请先配置 Gemini API key（页面顶部）· Configure your Gemini API key first.<br>' +
          '<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">↗ 免费获取 · Get free key</a>' +
        '</div>';
      return;
    }

    // Loading state
    output.innerHTML =
      '<div class="response-card">' +
        '<div class="response-head">' +
          '<div class="response-meta">// CALLING GEMINI · ' + getModel() + ' · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '</div>' +
        '</div>' +
        '<div class="response-prop">「' + escapeHtml(prop) + '」</div>' +
        '<div class="loading-pulse">' +
          '<span>振动采样中</span><span class="dots">···</span><br>' +
          '<em>Sampling vibration...</em>' +
        '</div>' +
        '<div class="response-body" id="response-body"></div>' +
      '</div>';

    var bodyEl = $('#response-body');

    callGemini(prop,
      // onChunk
      function (chunk, full) {
        // Hide loading after first chunk
        var loading = output.querySelector('.loading-pulse');
        if (loading) loading.style.display = 'none';
        bodyEl.innerHTML = renderMarkdown(full);
        // Auto-scroll to keep latest content visible
        bodyEl.scrollTop = bodyEl.scrollHeight;
      },
      // onDone
      function (full) {
        renderResponse(full, prop, false);
        saveHistory(prop, full);
      },
      // onError
      function (msg) {
        output.innerHTML =
          '<div class="error-state">' +
            '⚠ ' + escapeHtml(msg) + '<br><br>' +
            '可能原因：<br>' +
            '· API key 无效或额度耗尽<br>' +
            '· 网络连接问题<br>' +
            '· 模型暂时不可用<br>' +
            '<a href="https://aistudio.google.com/apikey" target="_blank">↗ 检查 key</a>' +
          '</div>';
      }
    );
  }

  // ---------------------------------------------------
  // STARFIELD (background)
  // ---------------------------------------------------
  function initStarfield() {
    var canvas = document.getElementById('starfield');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr;
    var stars = [];
    var palette = ['#5be6d8', '#e8a630', '#a78bfa', '#ec4899', '#ffffff', '#7dffd8'];

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
      stars.length = 0;
      var density = Math.sqrt(w * h) / 1100;
      var n = Math.floor(180 * density);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.3 + Math.random() * 1.4,
          color: palette[Math.floor(Math.random() * palette.length)],
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.01 + Math.random() * 0.03,
          baseAlpha: 0.3 + Math.random() * 0.6,
          big: Math.random() > 0.85
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.twinkle += s.twinkleSpeed;
        if (s.x < -10) s.x = w + 10;
        if (s.x > w + 10) s.x = -10;
        if (s.y < -10) s.y = h + 10;
        if (s.y > h + 10) s.y = -10;

        var alpha = s.baseAlpha * (0.4 + Math.sin(s.twinkle) * 0.6);
        if (s.big) {
          var grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 8);
          grad.addColorStop(0, s.color);
          grad.addColorStop(0.4, s.color + '40');
          grad.addColorStop(1, 'transparent');
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
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

  // ---------------------------------------------------
  // BIND EVENTS
  // ---------------------------------------------------
  function bind() {
    // Initial state
    $('#api-key').value = getKey();
    $('#model-select').value = getModel();
    refreshKeyStatus();
    renderHistory();

    // Save key
    $('#save-key').addEventListener('click', function () {
      var k = $('#api-key').value.trim();
      var m = $('#model-select').value;
      setKey(k);
      setModel(m);
      refreshKeyStatus();
      $('#save-key').textContent = '✓ 已保存';
      setTimeout(function () { $('#save-key').textContent = '保存 · Save'; }, 1400);
    });

    $('#model-select').addEventListener('change', function () {
      setModel($('#model-select').value);
      refreshKeyStatus();
    });

    // Presets
    $$('.presets button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('#prop-input').value = btn.getAttribute('data-preset');
        $('#prop-input').focus();
      });
    });

    // Analyze
    $('#analyze-btn').addEventListener('click', runAnalyze);

    // Keyboard shortcuts
    $('#prop-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        runAnalyze();
      } else if (e.key === 'Escape') {
        $('#prop-input').value = '';
      }
    });

    // Clear history
    $('#clear-history').addEventListener('click', function () {
      if (confirm('确定清空所有历史？· Clear all history?')) {
        clearHistory();
      }
    });

    // Initial focus
    if (!getKey()) {
      $('#api-key').focus();
    } else {
      $('#prop-input').focus();
    }
  }

  // ---------------------------------------------------
  // BOOT
  // ---------------------------------------------------
  function boot() {
    initStarfield();
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
