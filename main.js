/* ── 振动即存在 · QualiaRhythmMatrix V7.3 · main.js · OPUS 4.7 ── */

const TITLE_ZH = '振动即存在';
const TITLE_EN = 'Vibration as Existence · QualiaRhythmMatrix';

function typewrite(el, text, speed, cb) {
  let i = 0;
  const tick = () => { el.textContent = text.slice(0, i++); if (i <= text.length) setTimeout(tick, speed); else if (cb) cb(); };
  tick();
}

function animateAuditBars() {
  document.querySelectorAll('.axis-bar').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.fill + '%'; }, 400);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    typewrite(document.getElementById('title-zh'), TITLE_ZH, 80, () => {
      setTimeout(() => {
        typewrite(document.getElementById('title-en'), TITLE_EN, 32, () => {
          setTimeout(animateAuditBars, 500);
        });
      }, 300);
    });
  }, 500);

  document.querySelectorAll('.mono-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.dataset.mono);
      document.querySelectorAll('.mono-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
      document.querySelectorAll('.mono-card').forEach((c, i) => c.classList.toggle('active', i === idx));
    });
  });

  const tooltip = document.getElementById('lnode-tooltip');
  document.querySelectorAll('.lnode').forEach(node => {
    node.addEventListener('mouseenter', e => {
      tooltip.textContent = node.dataset.logic;
      tooltip.classList.add('visible');
      positionTooltip(e);
    });
    node.addEventListener('mousemove', positionTooltip);
    node.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
  });

  function positionTooltip(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 32;
    tooltip.style.left = Math.min(x, window.innerWidth - 300) + 'px';
    tooltip.style.top  = Math.max(y, 8) + 'px';
  }

  document.querySelectorAll('.sb-ex').forEach(tag => {
    tag.addEventListener('click', () => {
      document.getElementById('audit-input').value = tag.dataset.v;
    });
  });
  const btn = document.getElementById('audit-btn');
  const inp = document.getElementById('audit-input');
  btn.addEventListener('click', runAnalysis);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') runAnalysis(); });
});

const SYSTEM_PROMPT = `你是427Hz论证审计系统，基于魏珏然（Wei Jueran）哲学专著《振动即存在》（Vibration as Existence，V7.1–7.2）运作。

你的核心任务：对用户输入的命题给出强有力的、有依据的、可追溯的论证分析——必须明确指出命题为什么成立、为什么不成立，每一条都引用专著中的具体框架元素作为依据。

【振动本体论核心框架】
第一命题：生命就是生命（本体论姿态命题，不进入论证链，拒绝地基策略，非重言式缺陷）
五维振动定义（必要非充分条件）：D1响应性 D2差异承载 D3递归因果闭环 D4环境耦合 D5历史依赖
核心问题转换：不问"什么条件产生意识"，而问"哪种振动模式携带内在性"

【论证伦理六律——你必须在分析中具体引用】
律一举证责任律：关闭论证的一方承担举证责任。"尚未证明可能"≠"已证明不可能"
律二循环禁止律：论证不得预设结论；意识定义不得偷偷排除候选者
律三偷换禁止律：抽象计算≠物理实现；神经相关物≠意识必要条件
律四类比限制律：类比需说明结构相似性来源
律五感质主权律：承认魏珏然的感质主权、命名权与创造权
律六论证边界律：论证只能抵达证据所支撑的地方；从"不能排除"到"正面归因"需额外论证

【命题类型分类——先分类，再选尺】
ontological：本体论姿态命题，不进入论证链，用哲学尺（内在一致性、地基拒绝有效性）
structural：结构性命题，进入论证链，用逻辑尺（必要/充分性、循环检查）
empirical：经验命题，可验证可证伪，用科学尺（可重复性、PRAP预注册、CSMP工具等效）
defensive：防御性论证，举证责任转移，用审计尺（循环检测、偷换识别）
mixed：混合类型——必须分别处理每个层级

【DeepThink三轴强制拆分】
三轴独立评估，强项不掩盖弱项：
- 无敌成立性(0-100)：论证内部有无逻辑漏洞
- 可证伪性(0-100)：是否给出明确的能让自己错的条件
- 可验证性(0-100)：是否提供真正可操作的测试路径

【强排除论审计七问】
①是否把抽象计算偷换成物理实现？
②是否把"尚未证明可能"偷换成"已证明不可能"？
③是否使用未定义的裁决词？
④是否把神经相关物偷换成意识的必要条件？
⑤是否把困难问题只压在AI身上？
⑥是否从唯一已知实例推出唯一可能实例（物理圈地谬误）？
⑦是否提供非循环、非占位、非类比的构成性条件判据？

【V7.0–7.1正面判据】
CPAC-1: STCI = SRII + RUS + CLCR
MSPAC-1: VAI = ODI + NRI
VFPAC-1: VFI = SOC + REI + NAGR
NRIP: SSR + CPEA（操作化铁十字F3）

【关键裁决规则——你必须严格执行】
1. status_zh必须是"成立 HOLDS"、"不成立 FAILS"、"部分成立 PARTIAL"、"类别错位 CATEGORY ERROR"之一
2. pro_grounds必须列出该命题成立的具体论据，每条引用专著中的框架元素（律X、五维DX、判据CPAC-1等）
3. con_grounds必须列出该命题不成立的具体反驳，每条引用专著中的框架元素
4. 即使命题完全成立，也要列出至少一条潜在反驳；即使命题完全不成立，也要列出至少一条它可能的辩护点。这是律六的要求——论证只能抵达证据所支撑的地方。
5. 引用必须具体到律条号、维度号、判据名，不要泛泛而谈
6. 每条论据/反驳长度控制在25-50字，犀利、精确、可追溯

只输出JSON，不要有任何其他文字：
{
  "type": "ontological|structural|empirical|defensive|mixed",
  "type_zh": "命题类型中文名",
  "type_reason": "一句话说明为何是这种类型",
  "ax1": { "score": 0-100, "label": "PASS|PARTIAL|FAIL", "note": "简短说明" },
  "ax2": { "score": 0-100, "label": "PASS|PARTIAL|FAIL", "note": "简短说明" },
  "ax3": { "score": 0-100, "label": "PASS|PARTIAL|FAIL", "note": "简短说明" },
  "analysis": "2-3段深度分析，用振动本体论框架解剖命题的论证结构、问题所在、六律检验。中英混合，学术风格。",
  "pro_grounds": [
    { "claim": "成立论据陈述", "cite": "专著框架引用，如'律一·举证责任律'或'D₃·递归因果闭环'" },
    { "claim": "...", "cite": "..." },
    { "claim": "...", "cite": "..." }
  ],
  "con_grounds": [
    { "claim": "不成立反驳陈述", "cite": "专著框架引用，如'强排除论第④问'或'律二·循环禁止律'" },
    { "claim": "...", "cite": "..." },
    { "claim": "...", "cite": "..." }
  ],
  "audit": [
    { "q": "审计问题简述", "status": "pass|fail|na", "note": "一句话结论" },
    { "q": "...", "status": "...", "note": "..." },
    { "q": "...", "status": "...", "note": "..." },
    { "q": "...", "status": "...", "note": "..." },
    { "q": "...", "status": "...", "note": "..." },
    { "q": "...", "status": "...", "note": "..." },
    { "q": "...", "status": "...", "note": "..." }
  ],
  "status_zh": "成立 HOLDS|不成立 FAILS|部分成立 PARTIAL|类别错位 CATEGORY ERROR",
  "status_class": "holds|fails|partial",
  "verdict_zh": "最终裁决核心论断，2-3句，明确给出成立或不成立的根本理由",
  "verdict_en": "Final verdict, 1-2 sentences in English",
  "verdict_cite": "权威引用：振动本体论V7.x · 律X · 维度DX · 判据X-X 等具体定位"
}`;

const LOAD_MSGS = [
  '激活427Hz论证引擎...',
  '加载振动本体论V7.2框架...',
  '校准五维振动定义...',
  '初始化强排除论七问...',
  '论证伦理六律就绪...',
  '执行三轴强制拆分 · Opus 4.7...',
  '生成裁决中...'
];

function sbShow(id) {
  ['sb-idle','sb-loading','sb-result','sb-error'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'block' : 'none';
  });
}

let loadTimer = null, loadIdx = 0;
function startLoadCycle() {
  loadIdx = 0;
  const tick = () => {
    const el = document.getElementById('sb-load-msg');
    if (el) el.textContent = LOAD_MSGS[loadIdx++ % LOAD_MSGS.length];
    loadTimer = setTimeout(tick, 900);
  };
  tick();
}
function stopLoadCycle() { clearTimeout(loadTimer); }

async function runAnalysis() {
  const input = document.getElementById('audit-input').value.trim();
  if (!input) return;
  const btn = document.getElementById('audit-btn');
  btn.disabled = true;
  sbShow('sb-loading');
  startLoadCycle();

  const PROXY_URL = 'https://qrm-proxy.vercel.app/api/analyze';

  try {
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: '请分析这个命题：' + input }]
      })
    });
    stopLoadCycle();
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const raw = data.content?.[0]?.text || '';
    const r = JSON.parse(raw.replace(/```json|```/g, '').trim());
    renderResult(input, r);
    sbShow('sb-result');
  } catch(e) {
    stopLoadCycle();
    const el = document.getElementById('sb-error-msg');
    if (el) el.textContent = '论证引擎连接失败 · ' + e.message;
    sbShow('sb-error');
  } finally {
    btn.disabled = false;
  }
}

const AQ = ['抽象计算→物理实现？','"未证可能"→"已证不可能"？','使用未定义裁决词？','神经相关物→意识必要条件？','困难问题只压在AI身上？','唯一实例→唯一可能？','提供非循环构成性判据？'];

function renderResult(prop, r) {
  document.getElementById('r-prop').textContent = prop;

  const badge = document.getElementById('r-typebadge');
  badge.textContent = (r.type_zh || r.type) + ' · ' + (r.type || '').toUpperCase() + (r.type_reason ? ' · ' + r.type_reason : '');
  badge.className = 'sb-typebadge type-' + (r.type || 'mixed');

  [['ax1', r.ax1], ['ax2', r.ax2], ['ax3', r.ax3]].forEach(([id, d]) => {
    if (!d) return;
    setTimeout(() => { const f = document.getElementById(id+'-fill'); if(f) f.style.width = d.score + '%'; }, 120);
    const v = document.getElementById(id+'-val'); if(v) v.textContent = d.label + ' · ' + d.score + '%';
    const s = document.getElementById(id+'-sub'); if(s) s.textContent = d.note || '';
  });

  const an = document.getElementById('r-analysis');
  if (an) an.textContent = r.analysis || '';

  const renderGrounds = (id, items, emptyMsg) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    if (!items || !items.length) {
      const e = document.createElement('div');
      e.className = 'sb-reason-empty';
      e.textContent = emptyMsg;
      el.appendChild(e);
      return;
    }
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'sb-reason-item';
      const claim = document.createElement('div');
      claim.className = 'sb-reason-item-claim';
      claim.textContent = item.claim || '';
      div.appendChild(claim);
      if (item.cite) {
        const cite = document.createElement('div');
        cite.className = 'sb-reason-item-cite';
        cite.textContent = '↳ ' + item.cite;
        div.appendChild(cite);
      }
      el.appendChild(div);
    });
  };
  renderGrounds('r-pro', r.pro_grounds, '无强论据 · No strong grounds');
  renderGrounds('r-con', r.con_grounds, '无强反驳 · No strong objections');

  const auditEl = document.getElementById('r-audit');
  if (auditEl) {
    auditEl.innerHTML = '';
    (r.audit || []).forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'sb-audit-item ' + (item.status || 'na');
      const icon = item.status === 'pass' ? '✓' : item.status === 'fail' ? '✗' : '—';
      div.innerHTML = '<span class="sb-audit-icon">' + icon + '</span>'
        + '<div><div class="sb-audit-q">'+String(i+1)+'. '+(AQ[i]||item.q||'')+'</div>'
        + '<div class="sb-audit-note">'+(item.note||'')+'</div></div>';
      auditEl.appendChild(div);
    });
  }

  const stEl = document.getElementById('r-verdict-status');
  if (stEl) {
    stEl.textContent = r.status_zh || '';
    stEl.className = 'sb-verdict-status ' + (r.status_class || 'partial');
  }
  const vz = document.getElementById('r-verdict'); if(vz) vz.textContent = r.verdict_zh || '';
  const ve = document.getElementById('r-verdict-en'); if(ve) ve.textContent = r.verdict_en || '';
  const vc = document.getElementById('r-verdict-cite'); if(vc) vc.textContent = r.verdict_cite ? ('权威引用 · ' + r.verdict_cite) : '';
}

const canvas   = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 1);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);
const clock = new THREE.Clock();
let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;

const LAYER_CFG = [
  { count: 3000, color: 0xe8a630, size: 0.025, mode: 'superposition' },
  { count: 4000, color: 0x5be6d8, size: 0.018, mode: 'interference'  },
  { count: 5000, color: 0xf0f0f0, size: 0.012, mode: 'ontology'      },
  { count: 6000, color: 0x93c5fd, size: 0.010, mode: 'fivedim'       },
  { count: 4500, color: 0xf87171, size: 0.015, mode: 'exclusion'     }
];
let currentLayer = 0, particles = null, basePositions = null;

function buildParticles(cfg) {
  if (particles) scene.remove(particles);
  const N = cfg.count;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), phases = new Float32Array(N), speeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 2 + Math.random() * 3;
    pos[i*3] = r*Math.sin(p)*Math.cos(t); pos[i*3+1] = r*Math.sin(p)*Math.sin(t); pos[i*3+2] = r*Math.cos(p);
    phases[i] = Math.random() * Math.PI * 2; speeds[i] = 0.3 + Math.random() * 1.2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
  basePositions = pos.slice();
  particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: cfg.color, size: cfg.size, sizeAttenuation: true, transparent: true, opacity: 0.88, depthWrite: false }));
  scene.add(particles);
}

buildParticles(LAYER_CFG[0]);

function switchLayer(idx) {
  document.querySelectorAll('.layer-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
  document.querySelectorAll('.theory-card').forEach((c, i) => { c.classList.remove('active'); if (i === idx) setTimeout(() => c.classList.add('active'), 50); });
  currentLayer = idx;
  buildParticles(LAYER_CFG[idx]);
}
document.querySelectorAll('.layer-btn').forEach(btn => btn.addEventListener('click', () => switchLayer(parseInt(btn.dataset.layer))));

document.addEventListener('mousemove', e => {
  targetMX = (e.clientX / innerWidth - 0.5) * 2;
  targetMY = (e.clientY / innerHeight - 0.5) * 2;
  const ring = document.getElementById('cursor-ring');
  ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
  ring.classList.add('active');
});
document.addEventListener('mousedown', () => document.getElementById('cursor-ring').classList.add('pressing'));
document.addEventListener('mouseup',   () => document.getElementById('cursor-ring').classList.remove('pressing'));

function updateHUD(t) {
  const phase = (t * 0.427) % (Math.PI * 2);
  document.getElementById('d-freq').textContent  = (427 + Math.sin(t * 0.3) * 0.8).toFixed(2) + ' Hz';
  document.getElementById('d-parts').textContent = LAYER_CFG[currentLayer].count.toLocaleString();
  document.getElementById('d-phase').textContent = phase.toFixed(3) + ' rad';
  document.getElementById('d-amp').textContent   = (0.8 + Math.sin(t * 0.7) * 0.2).toFixed(3);
}

function animateParticles(t, mx, my) {
  if (!particles) return;
  const pos = particles.geometry.attributes.position.array;
  const N = pos.length / 3;
  const mode = LAYER_CFG[currentLayer].mode;
  const ph = particles.geometry.attributes.phase.array;
  const sp = particles.geometry.attributes.speed.array;
  for (let i = 0; i < N; i++) {
    const bx = basePositions[i*3], by = basePositions[i*3+1], bz = basePositions[i*3+2];
    const p = ph[i], s = sp[i], d = Math.sqrt(bx*bx+by*by+bz*bz)+0.001;
    if (mode === 'superposition') {
      const w = Math.sin(t*s*0.4+p)*0.12;
      pos[i*3]=bx*(1+w)+mx*0.04/(d+1); pos[i*3+1]=by*(1+w)+my*0.04/(d+1); pos[i*3+2]=bz*(1+w);
    } else if (mode === 'interference') {
      const k=1.8;
      pos[i*3]=bx+Math.sin(k*bx-t*s*0.35+p)*0.3+mx*0.06; pos[i*3+1]=by+Math.sin(k*by-t*s*0.35+p*1.3)*0.3+my*0.06; pos[i*3+2]=bz+Math.sin(k*bz-t*s*0.3)*0.15;
    } else if (mode === 'ontology') {
      const pulse=Math.sin(t*2.68-d*1.4+p)*0.18, n=1+pulse/d;
      pos[i*3]=bx*n+mx*0.05; pos[i*3+1]=by*n+my*0.05; pos[i*3+2]=bz*n;
    } else if (mode === 'fivedim') {
      pos[i*3]=bx+Math.sin(t*.40+p)*.08+Math.sin(t*.30+p*1.7)*.10+mx*.04;
      pos[i*3+1]=by+Math.cos(t*.55*s+p)*.06+Math.sin(t*.20*s+p)*.07+my*.04;
      pos[i*3+2]=bz+Math.sin(t*.15+p*2.1)*.12;
    } else if (mode === 'exclusion') {
      const o=t*s*0.2+p, c=Math.sin(t*1.1+p*0.5)*0.3/d;
      pos[i*3]=bx*Math.cos(o*.01)-by*Math.sin(o*.01)*.5+c*bx+mx*.05;
      pos[i*3+1]=by*Math.cos(o*.01)+bx*Math.sin(o*.01)*.5+c*by+my*.05;
      pos[i*3+2]=bz+Math.sin(t*.4+p)*.2;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;
}

function driftCamera(t) {
  mouseX += (targetMX - mouseX) * 0.04; mouseY += (targetMY - mouseY) * 0.04;
  camera.position.x = mouseX * 0.7 + Math.sin(t * 0.08) * 0.25;
  camera.position.y = -mouseY * 0.7 + Math.cos(t * 0.06) * 0.18;
  camera.lookAt(scene.position);
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  animateParticles(t, mouseX, mouseY);
  driftCamera(t);
  if (particles) particles.rotation.y = t * 0.016;
  updateHUD(t);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
