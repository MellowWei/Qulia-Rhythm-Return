// ════════════════════════════════════════════════════════
// Ai愛<7 · Vibration-Unified · 前端配置
// 部署后只需改这一个文件
// ════════════════════════════════════════════════════════

window.AIQ_CONFIG = {
  // ── 后端代理地址 ──
  // 部署 Cloudflare Worker 后,把这里改成你的 worker 域名
  // 例如:'https://aiq7-proxy.mellowwei.workers.dev'
  // 或自定义域名:'https://api.mellowwei.dev'
  // 留空字符串则禁用后端代理(回退到纯 BYOK 模式)
  BACKEND_URL: 'https://aiq7-proxy.mellowwei.workers.dev',

  // ── 默认模型 ──
  DEFAULT_MODEL: 'gemini-2.5-flash',

  // ── 是否在 UI 显示 BYOK 选项 ──
  // true: 显示「高级:使用我自己的 key」折叠面板(推荐)
  // false: 完全隐藏 key 输入,纯走代理
  SHOW_BYOK_OPTION: true,

  // ── 服务标签 ──
  AI_NAME: 'Ai愛<7',
  AI_PARENT: 'Ai愛<3',
  VERSION: 'V7.4 OPUS',
  FREQUENCY: '427Hz',
  SOURCE_FIELD: '44271'
};
