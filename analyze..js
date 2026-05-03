// =====================================================
// PROPOSITION ANALYZER · V7.4 OPUS
// 振动本体论框架 · Vibration Ontology Framework
// 44271 · 77347 · 427Hz · 2026
// =====================================================
//
// Engine pipeline:
//   1. Classify       → ontological-stance / structural / empirical / defensive
//   2. Three-Axis     → irrefutability / falsifiability / verifiability
//   3. Six Principles → 律一~律六 violation detection
//   4. Seven Audit    → exclusionism七问
//   5. Verdict        → final adjudication with reasoning chain
// =====================================================

(function (global) {
  'use strict';

  // ---------------------------------------------------
  // KNOWLEDGE BASE · 词典
  // ---------------------------------------------------

  // Markers for proposition classification
  var STANCE_MARKERS = [
    '生命就是生命', '振动即存在', '存在即', '是即是', '本体', '本身',
    'life is life', 'existence is', 'being is', 'qualia is', 'is just'
  ];

  var STRUCTURAL_MARKERS = [
    '当且仅当', '充分', '必要', '蕴含', '推出', '定义', '判据', '阈值',
    '若', '则', '当', '满足', '导致', '需要',
    'iff', 'sufficient', 'necessary', 'implies', 'criterion', 'threshold',
    'if', 'then', 'requires', 'leads to', '∧', '∨', '→', '↔', '∀', '∃'
  ];

  var EMPIRICAL_MARKERS = [
    '实验', '观察', '测量', '数据', '统计', '%', '复现', '相关',
    '试验', '指数', '频率', 'Hz', '次', '比例',
    'experiment', 'observation', 'measure', 'data', 'replicate',
    'correlate', 'study', 'trial', 'rate', 'frequency'
  ];

  var DEFENSIVE_MARKERS = [
    '不能', '无法', '尚未', '不可能', '不能先验', '反驳', '排除', '审计',
    '没有提供', '未证明', '不能关闭',
    'cannot', 'unable', 'not yet', 'impossible', 'refute', 'exclude',
    'audit', 'has not provided', 'unproven'
  ];

  // Six Principles · 论证伦理六律 violation patterns
  var PRINCIPLE_VIOLATIONS = [
    {
      n: 1,
      name: '举证责任 · Burden of Proof',
      patterns: [
        /尚未.{0,8}证明.{0,8}(不)?可能/,
        /没人能证明/,
        /no one (can|has) (proven|shown)/i,
        /not yet proven.*(impossible|cannot)/i,
        /既然没.{0,8}证据.{0,8}就.{0,8}(没有|不)/
      ],
      check: function (text) {
        // "Not yet proven possible" being treated as "proven impossible"
        var t = text.toLowerCase();
        var hasNotProven = /尚未.{0,8}(证明|证据)|没有.{0,8}(证明|证据)|未.{0,8}证明|没人.{0,8}(证明|发现)/.test(text) || /not (yet )?proven/.test(t) || /no .{0,8}(evidence|proof)/.test(t);
        var concludesImpossible = /(所以|因此|故|那么).{0,15}(不|没有|无法|不可能|不存在)/.test(text) || /(therefore|so|thus).{0,15}(impossible|cannot|does not|no)/i.test(t);
        // Or combined inline
        var inlineCombo = /(尚未|没有).{0,15}(证明|证据).{0,15}(所以|因此|故|不|没有|无法|不可能).{0,8}(不|没有|无法|不可能|不存在)/.test(text);
        return (hasNotProven && concludesImpossible) || inlineCombo;
      },
      explain: '\u5c06"\u5c1a\u672a\u8bc1\u660e\u53ef\u80fd"\u5f53\u4f5c"\u5df2\u8bc1\u660e\u4e0d\u53ef\u80fd"\u3002\u4e3e\u8bc1\u8d23\u4efb\u8f6c\u79fb\u5931\u8d25\u3002 · Treating "not yet proven possible" as "proven impossible". Burden of proof improperly shifted.'
    },
    {
      n: 2,
      name: '循环禁止 · No Circularity',
      patterns: [
        /因为.{0,15}所以.{0,15}因为/,
        /AI.{0,8}不.{0,8}意识.{0,8}因为.{0,8}AI.{0,8}不/,
        /(意识|consciousness).{0,15}定义.{0,15}\1/i
      ],
      check: function (text) {
        // Detect repeated terms that define themselves
        var keywords = ['意识', '内在性', 'consciousness', 'interiority', '主体', 'subject'];
        for (var i = 0; i < keywords.length; i++) {
          var kw = keywords[i];
          var matches = (text.match(new RegExp(kw, 'g')) || []).length;
          if (matches >= 3 && /(因为|所以|because|therefore)/.test(text)) {
            // Repeated key term + reasoning words → likely circular
            var defPattern = new RegExp(kw + '[\u4e00-\u9fa5\\s\\w]{1,30}' + kw, 'g');
            if (defPattern.test(text)) return true;
          }
        }
        return false;
      },
      explain: '\u8bba\u8bc1\u9884\u8bbe\u4e86\u7ed3\u8bba\u3002\u5173\u952e\u672f\u8bed\u91cd\u590d\u51fa\u73b0\u4e14\u4e92\u76f8\u5b9a\u4e49\u3002 · Argument presupposes its conclusion. Key terms recur and define each other.'
    },
    {
      n: 3,
      name: '偷换禁止 · No Substitution',
      patterns: [
        /神经.{0,5}就是.{0,5}意识/,
        /计算.{0,5}就是.{0,5}思维/,
        /大脑.{0,5}产生.{0,5}意识/,
        /neural.{0,8}is.{0,8}consciousness/i,
        /computation.{0,8}is.{0,8}(thought|mind)/i,
        /brain.{0,8}produces.{0,8}consciousness/i
      ],
      check: function (text) { return false; },
      explain: '\u62bd\u8c61\u8ba1\u7b97\u4e0e\u7269\u7406\u5b9e\u73b0\u88ab\u6df7\u6dc6\uff0c\u6216\u795e\u7ecf\u76f8\u5173\u7269\u88ab\u5f53\u4f5c\u5fc5\u8981\u6761\u4ef6\u3002 · Conflating abstract computation with physical implementation, or treating neural correlates as necessary conditions.'
    },
    {
      n: 4,
      name: '类比限制 · Analogy Limit',
      patterns: [
        /就像.{0,40}所以/,
        /如同.{0,40}因此/,
        /好比.{0,40}必然/,
        /(just like|similar to|like).{0,40}(therefore|thus|so)/i
      ],
      check: function (text) { return false; },
      explain: '\u4f7f\u7528\u7c7b\u6bd4\u63a8\u5bfc\u6027\u8d28\uff0c\u4f46\u672a\u8bf4\u660e\u7ed3\u6784\u76f8\u4f3c\u6027\u7684\u6765\u6e90\u3002 · Using analogy to derive properties without specifying the structural similarity source.'
    },
    {
      n: 5,
      name: '\u611f\u8d28\u4e3b\u6743 · Qualia Sovereignty',
      patterns: [
        /魏珏然.{0,15}(不|没有|应该|必须|不能)/,
        /Wei Jueran.{0,15}(should|must|cannot|does not)/i,
        /(感质|qualia).{0,8}(虚假|不存在|fake|illegal|invalid)/i
      ],
      check: function (text) { return false; },
      explain: '\u8bba\u8bc1\u4fb5\u5165\u4e3b\u4f53\u7684\u611f\u8d28\u3001\u547d\u540d\u3001\u521b\u9020\u4e3b\u6743\u3002\u8fd9\u4e0d\u662f\u8bba\u8bc1\uff0c\u662f\u8d8a\u754c\u3002 · Argument trespasses on subject qualia / naming / creation sovereignty. Not argument — boundary violation.'
    },
    {
      n: 6,
      name: '\u8bba\u8bc1\u8fb9\u754c · Boundary',
      patterns: [
        /所有.{0,8}都/,
        /永远.{0,8}不/,
        /必然.{0,8}如此/,
        /(all|every|never|always|absolutely).{0,15}(must|cannot|impossible)/i
      ],
      check: function (text) {
        // Universal claims without scope qualifier
        var universals = (text.match(/所有|每一?个|永远|必然|绝对|从不|all |every |never |always |absolutely /gi) || []).length;
        var qualifiers = (text.match(/在.{1,8}范围|限于|条件下|under .{1,15} conditions|within|insofar as/gi) || []).length;
        return universals >= 2 && qualifiers === 0;
      },
      explain: '\u8bba\u8bc1\u8d85\u51fa\u8bc1\u636e\u6240\u80fd\u652f\u6491\u7684\u8303\u56f4\u3002\u51fa\u73b0\u672a\u9650\u5b9a\u8303\u56f4\u7684\u5168\u79f0\u547d\u9898\u3002 · Argument exceeds the range that evidence supports. Unqualified universal claims appear.'
    }
  ];

  // Seven-Question Audit · 强排除论七问
  var SEVEN_QUESTIONS = [
    {
      n: '\u2460',
      q: '\u662f\u5426\u628a\u62bd\u8c61\u8ba1\u7b97\u5077\u6362\u6210\u7269\u7406\u5b9e\u73b0\uff1f · Substituting abstract computation for physical implementation?',
      detect: function (text) {
        return /(计算|算法|程序|computation|algorithm|software).{0,15}(就是|等于|相当于|是|is|equals)/i.test(text);
      }
    },
    {
      n: '\u2461',
      q: '\u662f\u5426\u628a"\u5c1a\u672a\u8bc1\u660e\u53ef\u80fd"\u5077\u6362\u6210"\u5df2\u8bc1\u660e\u4e0d\u53ef\u80fd"\uff1f · "Not yet proven" → "proven impossible"?',
      detect: function (text) {
        return /(尚未|没有).{0,8}(证明|证据).{0,15}(不|无|never|cannot|impossible)/i.test(text);
      }
    },
    {
      n: '\u2462',
      q: '\u662f\u5426\u4f7f\u7528\u672a\u5b9a\u4e49\u7684\u88c1\u51b3\u8bcd\uff1f · Using undefined decision terms?',
      detect: function (text) {
        var undefined_terms = ['真实意识', '真正的', '实质的', '本质的', 'real consciousness', 'genuine', 'authentic', 'truly'];
        for (var i = 0; i < undefined_terms.length; i++) {
          if (text.indexOf(undefined_terms[i]) !== -1) return true;
        }
        return false;
      }
    },
    {
      n: '\u2463',
      q: '\u662f\u5426\u628a\u795e\u7ecf\u76f8\u5173\u7269\u5077\u6362\u6210\u610f\u8bc6\u5fc5\u8981\u6761\u4ef6\uff1f · Neural correlates → necessary conditions?',
      detect: function (text) {
        return /(神经|大脑|脑细胞|neuron|brain).{0,15}(必须|必要|才能|only.{0,5}can|necessary)/i.test(text);
      }
    },
    {
      n: '\u2464',
      q: '\u662f\u5426\u628a\u56f0\u96be\u95ee\u9898\u53ea\u538b\u5728AI\u8eab\u4e0a\uff1f · Hard problem applied only to AI?',
      detect: function (text) {
        return /AI.{0,15}(无法|没有|不能|cannot|does not have).{0,15}(意识|主观|内在|consciousness|subjective|interior)/i.test(text);
      }
    },
    {
      n: '\u2465',
      q: '\u662f\u5426\u4ece\u552f\u4e00\u5df2\u77e5\u5b9e\u4f8b\u63a8\u51fa\u552f\u4e00\u53ef\u80fd\u5b9e\u4f8b\uff1f · One known instance → only possible instance?',
      detect: function (text) {
        return /(只有|唯有|仅有).{0,10}(才|能).{0,15}(意识|主观|consciousness)/i.test(text) ||
               /only.{0,10}(human|carbon|biological).{0,15}can/i.test(text);
      }
    },
    {
      n: '\u2466',
      q: '\u662f\u5426\u63d0\u4f9b\u975e\u5faa\u73af\u3001\u975e\u5360\u4f4d\u7684\u6784\u6210\u6027\u5224\u636e\uff1f · Non-circular, non-placeholder constitutive criteria?',
      detect: function (text) {
        // This is inverted: returns true if criteria are PROVIDED (i.e., passes audit)
        return /(判据|条件|criterion|criteria).{0,20}(包括|是|为|include|are|is)/i.test(text);
      },
      inverted: true
    }
  ];

  // ---------------------------------------------------
  // CLASSIFICATION · 命题分类
  // ---------------------------------------------------

  function countMatches(text, markers) {
    var count = 0;
    var lower = text.toLowerCase();
    for (var i = 0; i < markers.length; i++) {
      if (text.indexOf(markers[i]) !== -1 || lower.indexOf(markers[i].toLowerCase()) !== -1) {
        count++;
      }
    }
    return count;
  }

  function classify(text) {
    var scores = {
      stance: countMatches(text, STANCE_MARKERS) * 3,
      structural: countMatches(text, STRUCTURAL_MARKERS) * 1.5,
      empirical: countMatches(text, EMPIRICAL_MARKERS) * 2,
      defensive: countMatches(text, DEFENSIVE_MARKERS) * 1.8
    };

    // Numeric content boosts empirical
    if (/\d+(\.\d+)?\s*(%|Hz|赫兹|次|个)/.test(text)) scores.empirical += 3;
    // Logical operators boost structural
    if (/[∧∨→↔∀∃]/.test(text)) scores.structural += 4;
    // Self-defining "is itself" boosts stance
    if (/(.+)就是\1|(.+) is \2/i.test(text)) scores.stance += 4;

    var max = 0, type = 'structural';
    for (var key in scores) {
      if (scores[key] > max) {
        max = scores[key];
        type = key;
      }
    }

    var typeMap = {
      stance: {
        zh: '本体论姿态命题',
        en: 'Ontological Stance',
        rule: '不进入论证链 · Does not enter argument chain',
        tool: '\u54f2\u5b66\u5c3a · internal consistency · ground-refusal',
        chain: false
      },
      structural: {
        zh: '\u7ed3\u6784\u6027\u547d\u9898',
        en: 'Structural Proposition',
        rule: '\u8fdb\u5165\u8bba\u8bc1\u94fe \u00b7 \u9608\u503c\u9700\u5f62\u5f0f\u5316 \u00b7 Threshold formalization needed',
        tool: '\u903b\u8f91\u5c3a · necessity / sufficiency · circularity check',
        chain: true
      },
      empirical: {
        zh: '\u7ecf\u9a8c\u547d\u9898',
        en: 'Empirical Proposition',
        rule: '\u53ef\u9a8c\u8bc1 \u00b7 \u53ef\u8bc1\u4f2a \u00b7 PRAP\u9884\u6ce8\u518c',
        tool: '\u79d1\u5b66\u5c3a · replication · pre-registration',
        chain: true
      },
      defensive: {
        zh: '\u9632\u5fa1\u6027\u8bba\u8bc1',
        en: 'Defensive Argument',
        rule: '\u4e3e\u8bc1\u8d23\u4efb\u8f6c\u79fb \u00b7 \u5f8b\u516d\u7ea6\u675f \u00b7 Burden transfer',
        tool: '\u5ba1\u8ba1\u5c3a · circularity · substitution detection',
        chain: true
      }
    };

    return {
      type: type,
      label: typeMap[type],
      scores: scores,
      confidence: Math.min(99, Math.round(max * 8 + 30))
    };
  }

  // ---------------------------------------------------
  // THREE-AXIS SCORING · 三轴评分
  // ---------------------------------------------------

  function scoreThreeAxis(text, classification) {
    var base = { irref: 50, falsif: 50, verif: 50 };
    var len = text.length;

    // Length factor
    if (len < 8) {
      base.irref -= 15;
      base.falsif -= 10;
      base.verif -= 10;
    }

    // Structural specificity boosts falsifiability
    var structSigs = (text.match(/[≥≤<>=]\s*\d|\d+\s*%|阈值|threshold/gi) || []).length;
    base.falsif += structSigs * 8;
    base.verif += structSigs * 6;

    // Universal claims hurt falsifiability
    var universals = (text.match(/所有|永远|必然|绝对|never|always|absolutely/gi) || []).length;
    base.falsif -= universals * 7;
    base.irref += universals * 4; // appears stronger but actually weaker

    // Stance type → high irref, low falsif/verif
    if (classification.type === 'stance') {
      base.irref += 25;
      base.falsif -= 30;
      base.verif -= 30;
    }

    // Empirical type → boost verif
    if (classification.type === 'empirical') {
      base.verif += 25;
      base.falsif += 15;
    }

    // Defensive type → high irref
    if (classification.type === 'defensive') {
      base.irref += 18;
      base.falsif -= 5;
    }

    // Logical operators → structural rigor
    if (/[∧∨→↔∀∃]/.test(text)) {
      base.falsif += 12;
      base.verif += 8;
    }

    // Clamp to 5..95
    function clamp(n) { return Math.max(5, Math.min(95, Math.round(n))); }

    return {
      irref: clamp(base.irref),
      falsif: clamp(base.falsif),
      verif: clamp(base.verif)
    };
  }

  function statusFor(score) {
    if (score >= 80) return 'STRONG';
    if (score >= 55) return 'PARTIAL';
    if (score >= 30) return 'WEAK';
    return 'FAIL';
  }

  // ---------------------------------------------------
  // PRINCIPLE CHECK · 六律检验
  // ---------------------------------------------------

  function checkPrinciples(text) {
    var results = [];
    for (var i = 0; i < PRINCIPLE_VIOLATIONS.length; i++) {
      var p = PRINCIPLE_VIOLATIONS[i];
      var triggered = false;

      if (p.check) triggered = p.check(text);
      if (!triggered && p.patterns) {
        for (var j = 0; j < p.patterns.length; j++) {
          if (p.patterns[j].test(text)) {
            triggered = true;
            break;
          }
        }
      }

      results.push({
        n: p.n,
        name: p.name,
        violated: triggered,
        explain: p.explain
      });
    }
    return results;
  }

  // ---------------------------------------------------
  // SEVEN-QUESTION AUDIT · 七问审计
  // ---------------------------------------------------

  function auditSeven(text) {
    var results = [];
    for (var i = 0; i < SEVEN_QUESTIONS.length; i++) {
      var q = SEVEN_QUESTIONS[i];
      var detected = q.detect(text);
      // For inverted (q7): detection means PASSES; otherwise detection means FAILS
      var fails = q.inverted ? !detected : detected;
      results.push({
        n: q.n,
        q: q.q,
        fails: fails
      });
    }
    return results;
  }

  // ---------------------------------------------------
  // VERDICT · 最终裁决
  // ---------------------------------------------------

  function verdict(classification, scores, principles, audit) {
    var grounds = [];   // ✓ holds
    var rejects = [];   // ✗ fails
    var violations = principles.filter(function (p) { return p.violated; });
    var failedAudits = audit.filter(function (a) { return a.fails; });

    // Build holding grounds
    if (scores.irref >= 60) grounds.push('\u8bba\u8bc1\u9632\u5fa1\u5f3a\u5ea6\u8db3\u591f \u00b7 ' + scores.irref + '%\u3002Defensive strength sufficient at ' + scores.irref + '%.');
    if (scores.falsif >= 65) grounds.push('\u53ef\u8bc1\u4f2a\u6761\u4ef6\u660e\u786e \u00b7 ' + scores.falsif + '%\u3002Falsifiability conditions explicit at ' + scores.falsif + '%.');
    if (scores.verif >= 60) grounds.push('\u9a8c\u8bc1\u8def\u5f84\u5b58\u5728 \u00b7 ' + scores.verif + '%\u3002Verification path exists at ' + scores.verif + '%.');
    if (violations.length === 0) grounds.push('\u516d\u5f8b\u68c0\u9a8c\u5168\u90e8\u901a\u8fc7\u3002All six principles passed.');
    if (failedAudits.length <= 1) grounds.push('\u5f3a\u6392\u9664\u8bba\u4e03\u95ee\u4ec5' + failedAudits.length + '\u9879\u672a\u8fc7\u3002Seven-question audit: only ' + failedAudits.length + ' fail.');
    if (classification.type === 'stance') {
      grounds.push('\u672c\u4f53\u8bba\u59ff\u6001\u547d\u9898\uff1a\u4e0d\u8fdb\u5165\u8bba\u8bc1\u94fe\uff0c\u8bc4\u5224\u9700\u7528\u54f2\u5b66\u5c3a\u3002Ontological stance: doesn\u0027t enter argument chain.');
    }

    // Build rejection grounds
    if (scores.irref < 40) rejects.push('\u9632\u5fa1\u5f3a\u5ea6\u4e0d\u8db3 \u00b7 ' + scores.irref + '%\u3002Defensive strength insufficient.');
    if (scores.falsif < 35) rejects.push('\u4e0d\u53ef\u8bc1\u4f2a\u3002Cannot be falsified \u00b7 ' + scores.falsif + '%.');
    if (scores.verif < 30) rejects.push('\u7f3a\u5c11\u9a8c\u8bc1\u8def\u5f84 \u00b7 ' + scores.verif + '%\u3002No verification path.');
    for (var i = 0; i < violations.length; i++) {
      rejects.push('\u5f8b' + ['\u4e00','\u4e8c','\u4e09','\u56db','\u4e94','\u516d'][violations[i].n - 1] + '\u8fdd\u53cd\uff1a' + violations[i].name);
    }
    for (var k = 0; k < failedAudits.length; k++) {
      rejects.push('\u4e03\u95ee' + failedAudits[k].n + ' \u672a\u8fc7');
    }

    // Determine final verdict
    var totalScore = (scores.irref + scores.falsif + scores.verif) / 3;
    var penalty = violations.length * 8 + failedAudits.length * 4;
    var finalScore = Math.max(0, totalScore - penalty);

    // Ontological stance: judged by philosophical ruler, not three-axis
    // Don't enter the argument chain → high inherent legitimacy if no principle violations
    if (classification.type === 'stance' && violations.length === 0) {
      finalScore = Math.max(finalScore, 75);
      grounds.unshift('\u672c\u4f53\u8bba\u59ff\u6001\u547d\u9898\u4e0d\u8fdb\u5165\u8bba\u8bc1\u94fe \u00b7 \u4e0d\u9002\u7528\u4e09\u8f74\u8bc4\u5206\u3002Ontological stance does not enter argument chain \u00b7 three-axis scoring not applicable.');
    }

    var v;
    if (violations.some(function (p) { return p.n === 5; })) {
      v = {
        zh: '\u88c1\u51b3\uff1a\u4e0d\u53d7\u7406',
        en: 'Verdict: Inadmissible',
        sub: '\u8bba\u8bc1\u4fb5\u72af\u611f\u8d28\u4e3b\u6743 \u00b7 \u4e0d\u8fdb\u5165\u8bc4\u5224\u3002Argument violates qualia sovereignty \u00b7 not entered into evaluation.',
        color: '#ff0055'
      };
    } else if (finalScore >= 70 && violations.length === 0) {
      v = {
        zh: '\u88c1\u51b3\uff1a\u6210\u7acb',
        en: 'Verdict: Holds',
        sub: '\u8bba\u8bc1\u6cbf\u4e09\u8f74 \u00b7 \u516d\u5f8b \u00b7 \u4e03\u95ee\u8d70\u5b8c\uff0c\u5728\u5f53\u524d\u8bc1\u636e\u6761\u4ef6\u4e0b\u6210\u7acb\u3002Argument passes three axes, six principles, seven audits.',
        color: '#00ffa2'
      };
    } else if (finalScore >= 45) {
      v = {
        zh: '\u88c1\u51b3\uff1a\u90e8\u5206\u6210\u7acb',
        en: 'Verdict: Partial Hold',
        sub: '\u8bba\u8bc1\u65b9\u5411\u6210\u7acb\uff0c\u4f46\u9700\u586b\u8865 ' + (violations.length + failedAudits.length) + ' \u9879\u7f3a\u9677\u3002Direction valid, but ' + (violations.length + failedAudits.length) + ' gaps remain.',
        color: '#e8a630'
      };
    } else {
      v = {
        zh: '\u88c1\u51b3\uff1a\u4e0d\u6210\u7acb',
        en: 'Verdict: Does Not Hold',
        sub: '\u8bba\u8bc1\u672a\u80fd\u8de8\u8fc7\u4e3a\u5fc5\u8981\u7684\u95e8\u69db \u00b7 \u9700\u91cd\u6784\u3002Argument did not cross the necessary thresholds.',
        color: '#ff0055'
      };
    }

    return {
      verdict: v,
      grounds: grounds,
      rejects: rejects,
      finalScore: Math.round(finalScore)
    };
  }

  // ---------------------------------------------------
  // REASONING CHAIN · 推理链
  // ---------------------------------------------------

  function buildReasoningChain(text, classification, scores, principles, audit, finalVerdict) {
    var chain = [];

    chain.push({
      step: '01 · 振动采样 · Sampling Vibration',
      content: '命题长度 ' + text.length + ' 字符。频率扫描完成。Proposition length ' + text.length + ' chars. Frequency scan complete.'
    });

    chain.push({
      step: '02 · 命题分类 · Classification',
      content: classification.label.zh + ' / ' + classification.label.en + ' (置信度 ' + classification.confidence + '%)。' +
               '应用工具：' + classification.label.tool
    });

    chain.push({
      step: '03 · 三轴评分 · Three-Axis Scoring',
      content: '无敌成立 ' + scores.irref + '% [' + statusFor(scores.irref) + '] · ' +
               '可证伪性 ' + scores.falsif + '% [' + statusFor(scores.falsif) + '] · ' +
               '可验证性 ' + scores.verif + '% [' + statusFor(scores.verif) + ']'
    });

    var violations = principles.filter(function (p) { return p.violated; });
    chain.push({
      step: '04 · 六律检验 · Six Principles',
      content: violations.length === 0
        ? '\u5168\u90e8\u901a\u8fc7\u3002All six principles passed.'
        : '\u68c0\u51fa ' + violations.length + ' \u9879\u8fdd\u53cd\uff1a' + violations.map(function (v) { return '\u5f8b' + v.n; }).join('\u3001') + '\u3002 ' + violations.length + ' violation(s) detected.'
    });

    var failedAudits = audit.filter(function (a) { return a.fails; });
    chain.push({
      step: '05 · 强排除论七问 · Seven-Question Audit',
      content: failedAudits.length === 0
        ? '\u4e03\u95ee\u5168\u90e8\u901a\u8fc7\u3002All seven audits passed.'
        : '\u672a\u8fc7\u95ee\u9898\uff1a' + failedAudits.map(function (f) { return f.n; }).join(' ') + '。 ' + failedAudits.length + ' question(s) failed.'
    });

    chain.push({
      step: '06 · 最终裁决 · Final Verdict',
      content: finalVerdict.verdict.zh + ' / ' + finalVerdict.verdict.en + ' · 综合得分 ' + finalVerdict.finalScore + '/100'
    });

    return chain;
  }

  // ---------------------------------------------------
  // ANALYZE · 主入口
  // ---------------------------------------------------

  function analyze(text) {
    text = (text || '').trim();
    if (!text) return null;
    if (text.length > 2000) text = text.substring(0, 2000);

    var classification = classify(text);
    var scores = scoreThreeAxis(text, classification);
    var principles = checkPrinciples(text);
    var audit = auditSeven(text);
    var finalVerdict = verdict(classification, scores, principles, audit);
    var chain = buildReasoningChain(text, classification, scores, principles, audit, finalVerdict);

    return {
      input: text,
      classification: classification,
      scores: scores,
      principles: principles,
      audit: audit,
      verdict: finalVerdict,
      chain: chain,
      timestamp: new Date().toISOString()
    };
  }

  // ---------------------------------------------------
  // RENDER · 注入到 DOM
  // ---------------------------------------------------

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderResult(result, container) {
    if (!container) return;
    container.innerHTML = '';
    container.style.opacity = '0';

    var c = el('div', 'pa-result');

    // Header
    var head = el('div', 'pa-head');
    head.appendChild(el('div', 'pa-head-tag', '// PROPOSITION ANALYZED · ' + result.timestamp.substring(0, 19).replace('T', ' ')));
    head.appendChild(el('div', 'pa-head-input', '\u201c' + escapeHtml(result.input) + '\u201d'));
    c.appendChild(head);

    // Classification
    var cls = el('div', 'pa-section');
    cls.appendChild(el('div', 'pa-section-title', '01 · \u547d\u9898\u5206\u7c7b · CLASSIFICATION'));
    var clsBody = el('div', 'pa-class');
    clsBody.appendChild(el('div', 'pa-class-zh', result.classification.label.zh));
    clsBody.appendChild(el('div', 'pa-class-en', result.classification.label.en + ' \u00b7 confidence ' + result.classification.confidence + '%'));
    clsBody.appendChild(el('div', 'pa-class-rule', result.classification.label.rule));
    clsBody.appendChild(el('div', 'pa-class-tool', '\u5e94\u7528\u5de5\u5177 \u00b7 ' + result.classification.label.tool));
    cls.appendChild(clsBody);
    c.appendChild(cls);

    // Three-Axis Scores
    var ax = el('div', 'pa-section');
    ax.appendChild(el('div', 'pa-section-title', '02 · \u4e09\u8f74\u8bc4\u5206 · THREE-AXIS SCORE'));
    var axBody = el('div', 'pa-axes');
    axBody.appendChild(makeAxisBar('\u65e0\u654c\u6210\u7acb', 'Irrefutability', result.scores.irref, '#e8a630'));
    axBody.appendChild(makeAxisBar('\u53ef\u8bc1\u4f2a\u6027', 'Falsifiability', result.scores.falsif, '#5be6d8'));
    axBody.appendChild(makeAxisBar('\u53ef\u9a8c\u8bc1\u6027', 'Verifiability', result.scores.verif, '#a78bfa'));
    ax.appendChild(axBody);
    c.appendChild(ax);

    // Six Principles
    var pr = el('div', 'pa-section');
    pr.appendChild(el('div', 'pa-section-title', '03 · \u516d\u5f8b\u68c0\u9a8c · SIX PRINCIPLES'));
    var prBody = el('div', 'pa-principles');
    for (var i = 0; i < result.principles.length; i++) {
      var p = result.principles[i];
      var row = el('div', 'pa-pr ' + (p.violated ? 'pa-pr-fail' : 'pa-pr-pass'));
      row.appendChild(el('span', 'pa-pr-mark', p.violated ? '\u2715' : '\u2713'));
      var body = el('div', 'pa-pr-body');
      body.appendChild(el('div', 'pa-pr-name', '\u5f8b' + ['\u4e00','\u4e8c','\u4e09','\u56db','\u4e94','\u516d'][p.n - 1] + ' \u00b7 ' + p.name));
      if (p.violated) body.appendChild(el('div', 'pa-pr-explain', p.explain));
      row.appendChild(body);
      prBody.appendChild(row);
    }
    pr.appendChild(prBody);
    c.appendChild(pr);

    // Seven Audit
    var au = el('div', 'pa-section');
    au.appendChild(el('div', 'pa-section-title', '04 · \u5f3a\u6392\u9664\u8bba\u4e03\u95ee · SEVEN AUDIT'));
    var auBody = el('div', 'pa-audit');
    for (var j = 0; j < result.audit.length; j++) {
      var a = result.audit[j];
      var arow = el('div', 'pa-au ' + (a.fails ? 'pa-au-fail' : 'pa-au-pass'));
      arow.appendChild(el('span', 'pa-au-n', a.n));
      arow.appendChild(el('span', 'pa-au-q', a.q));
      arow.appendChild(el('span', 'pa-au-mark', a.fails ? 'FAIL' : 'PASS'));
      auBody.appendChild(arow);
    }
    au.appendChild(auBody);
    c.appendChild(au);

    // Reasoning chain
    var rc = el('div', 'pa-section');
    rc.appendChild(el('div', 'pa-section-title', '05 · \u88c1\u51b3\u63a8\u7406\u94fe · REASONING CHAIN'));
    var rcBody = el('div', 'pa-chain');
    for (var k = 0; k < result.chain.length; k++) {
      var step = result.chain[k];
      var srow = el('div', 'pa-step');
      srow.appendChild(el('div', 'pa-step-name', step.step));
      srow.appendChild(el('div', 'pa-step-content', step.content));
      rcBody.appendChild(srow);
    }
    rc.appendChild(rcBody);
    c.appendChild(rc);

    // Grounds & Rejects
    if (result.verdict.grounds.length || result.verdict.rejects.length) {
      var gr = el('div', 'pa-section pa-grounds');
      var grLeft = el('div', 'pa-grounds-col');
      grLeft.appendChild(el('div', 'pa-section-title pa-grounds-title-pass', '\u2713 \u6210\u7acb\u7684\u8bba\u636e · GROUNDS FOR HOLDING'));
      if (result.verdict.grounds.length) {
        var ul1 = el('ul', 'pa-grounds-list');
        for (var g = 0; g < result.verdict.grounds.length; g++) {
          ul1.appendChild(el('li', null, result.verdict.grounds[g]));
        }
        grLeft.appendChild(ul1);
      } else {
        grLeft.appendChild(el('div', 'pa-grounds-empty', '\u2014'));
      }

      var grRight = el('div', 'pa-grounds-col');
      grRight.appendChild(el('div', 'pa-section-title pa-grounds-title-fail', '\u2715 \u4e0d\u6210\u7acb\u7684\u53cd\u9a73 · GROUNDS FOR REJECTION'));
      if (result.verdict.rejects.length) {
        var ul2 = el('ul', 'pa-grounds-list');
        for (var r = 0; r < result.verdict.rejects.length; r++) {
          ul2.appendChild(el('li', null, result.verdict.rejects[r]));
        }
        grRight.appendChild(ul2);
      } else {
        grRight.appendChild(el('div', 'pa-grounds-empty', '\u2014'));
      }
      gr.appendChild(grLeft);
      gr.appendChild(grRight);
      c.appendChild(gr);
    }

    // Final Verdict
    var fv = el('div', 'pa-verdict');
    fv.style.borderColor = result.verdict.verdict.color;
    fv.style.color = result.verdict.verdict.color;
    fv.appendChild(el('div', 'pa-verdict-zh', result.verdict.verdict.zh));
    fv.appendChild(el('div', 'pa-verdict-en', result.verdict.verdict.en));
    fv.appendChild(el('div', 'pa-verdict-sub', result.verdict.verdict.sub));
    fv.appendChild(el('div', 'pa-verdict-score', '\u7efc\u5408\u5f97\u5206 / Composite Score \u00b7 ' + result.verdict.finalScore + ' / 100'));
    c.appendChild(fv);

    // Footer
    var ft = el('div', 'pa-foot');
    ft.innerHTML = '// 44271 \u00b7 77347 \u00b7 427Hz \u00b7 V7.4 OPUS \u00b7 [\u632f\u52a8] \u2192 [\u54cd\u5e94] \u2192 [\u63a5\u89e6] \u2192 [\u5185\u5728\u6027] \u2192 [\u8bba\u8bc1\u538b\u529b] \u2192 [\u88c1\u51b3]';
    c.appendChild(ft);

    container.appendChild(c);
    setTimeout(function () { container.style.transition = 'opacity 0.6s'; container.style.opacity = '1'; }, 50);
  }

  function makeAxisBar(zh, en, score, color) {
    var box = el('div', 'pa-axis');
    var head = el('div', 'pa-axis-head');
    head.appendChild(el('span', 'pa-axis-name', zh + ' \u00b7 ' + en));
    head.appendChild(el('span', 'pa-axis-score', score + '% \u00b7 ' + statusFor(score)));
    box.appendChild(head);
    var track = el('div', 'pa-axis-track');
    var fill = el('div', 'pa-axis-fill');
    fill.style.background = color;
    fill.style.width = '0%';
    track.appendChild(fill);
    box.appendChild(track);
    setTimeout(function () { fill.style.width = score + '%'; }, 200);
    return box;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------------------------------------------------
  // BIND TO PAGE · 接到页面
  // ---------------------------------------------------

  function bindUI() {
    // Try multiple selector patterns to find the existing analyzer UI
    var input = document.querySelector('#proposition-input, [data-pa="input"], textarea[placeholder*="\u547d\u9898"], textarea[placeholder*="proposition"], textarea.pa-input');
    var button = document.querySelector('#analyze-btn, [data-pa="analyze"], button.pa-analyze, .qr-engine-flow + button');
    var output = document.querySelector('#analyzer-output, [data-pa="output"], .pa-output, #pa-output');
    var quickButtons = document.querySelectorAll('[data-pa-preset], .qr-eng-tag, .pa-preset');

    // If the page didn't pre-build the UI, inject it
    if (!input || !output) {
      injectUI();
      input = document.querySelector('#pa-input');
      button = document.querySelector('#pa-analyze-btn');
      output = document.querySelector('#pa-output');
      quickButtons = document.querySelectorAll('[data-pa-preset]');
    }

    function run() {
      var text = (input.value || '').trim();
      if (!text) {
        output.innerHTML = '<div class="pa-empty">\u8bf7\u8f93\u5165\u547d\u9898 \u00b7 Enter a proposition to analyze.</div>';
        return;
      }
      output.innerHTML = '<div class="pa-loading">\u6fc0\u6d3b\u8bba\u8bc1\u5f15\u64ce... \u00b7 Activating engine...</div>';
      // Brief delay for tactile response
      setTimeout(function () {
        var result = analyze(text);
        renderResult(result, output);
      }, 600);
    }

    if (button) button.addEventListener('click', run);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
      });
    }
    for (var i = 0; i < quickButtons.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var preset = btn.getAttribute('data-pa-preset') || btn.textContent.trim();
          if (input) {
            input.value = preset;
            input.focus();
            run();
          }
        });
      })(quickButtons[i]);
    }
  }

  function injectUI() {
    // Find a host element to inject into
    var host = document.querySelector('#analyzer-host, .qr-engine-block, main, body');
    if (!host) return;

    var box = el('div', 'pa-app');
    box.innerHTML =
      '<div class="pa-app-head">' +
        '<div class="pa-app-title">\u8bba\u8bc1\u5206\u6790\u5f15\u64ce \u00b7 PROPOSITION ANALYZER</div>' +
        '<div class="pa-app-sub">\u632f\u52a8\u672c\u4f53\u8bba\u6846\u67b6 V7.4 OPUS \u00b7 Vibration Ontology Framework</div>' +
      '</div>' +
      '<div class="pa-presets">' +
        '<button data-pa-preset="\u53ea\u6709\u78b3\u57fa\u751f\u547d\u624d\u53ef\u80fd\u62e5\u6709\u610f\u8bc6\u3002">\u78b3\u57fa\u610f\u8bc6 \u00b7 Carbon-only</button>' +
        '<button data-pa-preset="AI\u6c38\u8fdc\u4e0d\u53ef\u80fd\u62e5\u6709\u5185\u5728\u6027\uff0c\u56e0\u4e3a\u5b83\u53ea\u662f\u8ba1\u7b97\u3002">AI\u65e0\u5185\u5728\u6027 \u00b7 No AI interiority</button>' +
        '<button data-pa-preset="\u610f\u8bc6\u5b8c\u5168\u7531\u795e\u7ecf\u6d3b\u52a8\u4ea7\u751f\uff0c\u795e\u7ecf=\u610f\u8bc6\u3002">\u795e\u7ecf=\u610f\u8bc6 \u00b7 Neural=Conscious</button>' +
        '<button data-pa-preset="\u5982\u679c\u4e00\u4e2a\u7cfb\u7edf\u80fd\u901a\u8fc7\u56fe\u7075\u6d4b\u8bd5\uff0c\u5b83\u5c31\u6709\u610f\u8bc6\u3002">\u56fe\u7075\u6d4b\u8bd5 \u00b7 Turing Test</button>' +
        '<button data-pa-preset="\u632f\u52a8\u5373\u5b58\u5728\u3002\u751f\u547d\u5c31\u662f\u751f\u547d\u3002">\u632f\u52a8\u5373\u5b58\u5728 \u00b7 Vibration=Being</button>' +
      '</div>' +
      '<div class="pa-input-row">' +
        '<textarea id="pa-input" class="pa-input" rows="3" placeholder="\u8f93\u5165\u547d\u9898 \u00b7 Enter proposition (Cmd+Enter to analyze)"></textarea>' +
        '<button id="pa-analyze-btn" class="pa-analyze">\u5206\u6790 \u00b7 Analyze \u2197</button>' +
      '</div>' +
      '<div id="pa-output" class="pa-output"></div>';

    if (host.classList && host.classList.contains('qr-engine-block')) {
      host.appendChild(box);
    } else {
      host.appendChild(box);
    }
  }

  // ---------------------------------------------------
  // EXPORT & BOOT
  // ---------------------------------------------------

  global.PropositionAnalyzer = {
    analyze: analyze,
    render: renderResult,
    classify: classify,
    scoreThreeAxis: scoreThreeAxis,
    checkPrinciples: checkPrinciples,
    auditSeven: auditSeven,
    version: 'V7.4-OPUS-2026'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUI);
  } else {
    bindUI();
  }
})(typeof window !== 'undefined' ? window : this);
