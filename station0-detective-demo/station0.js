/* ============================================================
 * station0.js — 第0关「探索发现」逻辑 + 磁流粒子动画
 * 依赖 copula-core.js (window.CopulaCore)
 * 纯前端，无构建。Canvas 2D + requestAnimationFrame。
 * ============================================================ */
(function () {
  'use strict';
  const CC = window.CopulaCore;
  if (!CC) { console.error('CopulaCore 未加载'); return; }
  const Cop = CC.Copulas, tailColor = CC.tailColor;

  // ---------- 安全 localStorage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- 4 个必探嫌疑人脚本 ----------
  const SUSPECTS = [
    {
      id: 'gumbel', fam: 'gumbel', emoji: '🔥', name: 'Gumbel',
      tail: 'upper', tailZh: '上尾', color: '#e74c3c',
      params: { theta: 1.4 },
      sliders: [{ key: 'theta', label: 'θ 强度', min: 1.05, max: 8, step: 0.05 }],
      betQ: '把 <b>Gumbel</b> 的 θ 拖到最大，点子会往哪个角落抱团？',
      options: ['左下角', '右上角', '都不抱团', '两角都抱'],
      answer: 1,
      task: '拖大 <b>Gumbel</b> 的 θ，让<b>右上角</b>抱团 — 直到 λ_U ≥ 0.40',
      goal: { kpi: 'lambdaU', op: '>=', val: 0.40 },
      insight: {
        phenom: 'θ 越大右上角越挤 —— X 大时 Y 极可能也大。',
        mech: 'λ_U = 2 − 2^(1/θ)，θ↑ ⇒ λ_U↑；而 λ_L ≡ 0。',
        formula: '$$C(u,v)=\\exp\\!\\Big\\{-\\big[(-\\ln u)^{\\theta}+(-\\ln v)^{\\theta}\\big]^{1/\\theta}\\Big\\},\\quad \\tau=1-\\tfrac{1}{\\theta}$$',
        hook: '记住它的脸 —— 将来你给<b>巨灾再保</b>定价，认错它，赔的是真金白银。'
      }
    },
    {
      id: 'clayton', fam: 'clayton', emoji: '🧊', name: 'Clayton',
      tail: 'lower', tailZh: '下尾', color: '#2980b9',
      params: { theta: 0.5 },
      sliders: [{ key: 'theta', label: 'θ 强度', min: 0.2, max: 9, step: 0.05 }],
      betQ: '把 <b>Clayton</b> 的 θ 拖到最大，点子会往哪个角落抱团？',
      options: ['左下角', '右上角', '都不抱团', '两角都抱'],
      answer: 0,
      task: '拖大 <b>Clayton</b> 的 θ，让<b>左下角</b>抱团 — 直到 λ_L ≥ 0.40',
      goal: { kpi: 'lambdaL', op: '>=', val: 0.40 },
      insight: {
        phenom: 'θ 越大左下角越挤 —— X 小时 Y 极可能也小。',
        mech: 'λ_L = 2^(−1/θ)，θ↑ ⇒ λ_L↑；而 λ_U ≡ 0。',
        formula: '$$C(u,v)=\\big(u^{-\\theta}+v^{-\\theta}-1\\big)^{-1/\\theta},\\quad \\tau=\\tfrac{\\theta}{\\theta+2}$$',
        hook: '<b>信用险</b>里衰退期多个债务人同时违约，就是它的作案现场。'
      }
    },
    {
      id: 't', fam: 't', emoji: '🎭', name: 't-Copula',
      tail: 'both', tailZh: '双尾', color: '#8e44ad',
      params: { rho: 0.5, nu: 12 },
      sliders: [
        { key: 'rho', label: 'ρ 相关', min: -0.9, max: 0.95, step: 0.01 },
        { key: 'nu', label: 'ν 自由度', min: 2, max: 30, step: 1 }
      ],
      betQ: '把 <b>t-Copula</b> 的自由度 ν 调到最小 (=2)，会出现几个抱团的角落？',
      options: ['0 个（都不抱）', '1 个', '2 个（左下+右上）', '4 个'],
      answer: 2,
      task: '把 <b>t-Copula</b> 的 ν 拖到最小，让<b>左下和右上同时抱团</b> — 直到 λ ≥ 0.30',
      goal: { kpi: 'lambdaL', op: '>=', val: 0.30 },
      insight: {
        phenom: 'ν 越小，左下与右上两个角落同时变挤。',
        mech: 'ν↓ ⇒ λ_L = λ_U↑；ν→∞ 退化为 Gaussian（无尾）。',
        formula: '$$\\lambda=2\\,t_{\\nu+1}\\!\\Big(-\\sqrt{\\tfrac{(\\nu+1)(1-\\rho)}{1+\\rho}}\\Big),\\quad \\tau=\\tfrac{2}{\\pi}\\arcsin\\rho$$',
        hook: '<b>车险 + 健康险</b>在极端年份同时恶化，得请它出马。'
      }
    },
    {
      id: 'gaussian', fam: 'gaussian', emoji: '🎩', name: 'Gaussian',
      tail: 'none', tailZh: '无尾', color: '#95a5a6',
      params: { rho: 0.3 },
      sliders: [{ key: 'rho', label: 'ρ 相关', min: -0.95, max: 0.95, step: 0.01 }],
      betQ: '把 <b>Gaussian</b> 的 ρ 拖到 0.9（看着很相关），角落会抱团吗？',
      options: ['会，右上抱', '会，两角都抱', '不会，都不抱', '会，左下抱'],
      answer: 2,
      trap: true,
      task: '把 <b>Gaussian</b> 的 ρ 拖很大（≥ 0.85），盯住 λ_L、λ_U 会不会离开 0',
      goal: { kpi: 'rho', op: '>=', val: 0.85 }, // 特殊：按参数判定
      insight: {
        phenom: 'ρ 再大，两角都不抱团，λ ≈ 0。',
        mech: '|ρ| < 1 时尾部依赖恒为 0 —— 看着相关，极端时各自逃命。',
        formula: '$$\\lambda_L=\\lambda_U=0\\ (|\\rho|<1),\\quad \\tau=\\tfrac{2}{\\pi}\\arcsin\\rho$$',
        hook: '⚠️ 它是<b>定价陷阱</b>：2008 年信用模型用它低估联合违约，栽了大跟头。别被相关系数大骗了。'
      }
    }
  ];

  // ---------- 全局状态 ----------
  let curIdx = 0;            // 当前嫌疑人索引
  let bet = null;            // 当前下注选项
  let betPlaced = false;     // 是否已下注（未下注前不触发揭晓，防止默认参数秒过）
  let achieved = false;      // 当前任务是否达成
  let revealed = false;      // 是否已揭晓
  const unlocked = store.get('s0_unlocked', []); // 已盖章 id 列表
  let freeMode = false;
  let curParams = {};        // 当前参数（流动用）
  let lastKpi = { tau: 0, lambdaL: 0, lambdaU: 0 };
  // ⑤ 主题：默认浅色（老师偏好），记住用户选择
  let theme = store.get('s0_theme', 'light');
  if (theme !== 'dark' && theme !== 'light') theme = 'light';

  // ---------- DOM ----------
  const $ = s => document.querySelector(s);
  const overlay = $('#overlay'), modal = $('#modal');
  const toast = $('#toast');

  // ============================================================
  // 磁流粒子引擎
  // ============================================================
  const canvas = $('#flow');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1, PAD = 0;
  let N = 760;               // 粒子数（自适应）
  const particles = [];      // {x,y, tx,ty, vx,vy, hue}
  let burst = 0;             // 爆开特效计时
  let curColor = '#e74c3c';

  function resizeCanvas() {
    const shell = canvas.parentElement;
    const rect = shell.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    PAD = Math.max(14, W * 0.045);
    // 粒子数自适应（屏幕越小越省）
    N = W < 360 ? 520 : W < 520 ? 640 : 800;
    adjustParticleCount();
  }

  function u2x(u) { return PAD + u * (W - 2 * PAD); }
  function v2y(v) { return (H - PAD) - v * (H - 2 * PAD); } // V 朝上

  // 复用数学核心里的逆正态 / t 分位（用于自实现连续重参数化）
  const normInv = CC.normInv;
  function clamp01(x) { return x < 1e-6 ? 1e-6 : x > 1 - 1e-6 ? 1 - 1e-6 : x; }

  // 每个粒子持有一组**固定**的底层均匀变量(种子)：
  //   a,b ∈(0,1)  —— 主/条件均匀输入（用于 Clayton/Frank/Gaussian/t 的 u,w 或 p,q）
  //   c   ∈(0,1)  —— t 族卡方/缩放用的额外固定输入
  // 参数变化时这些种子**不变**，只是被映射到新的目标点 → 粒子轨迹连续平滑。
  function adjustParticleCount() {
    while (particles.length < N) {
      const a = Math.random(), b = Math.random(), c = Math.random();
      const x0 = u2x(a), y0 = v2y(b);
      particles.push({ x: x0, y: y0, tx: x0, ty: y0, vx: 0, vy: 0, ph: Math.random() * 6.28, a: a, b: b, c: c });
    }
    if (particles.length > N) particles.length = N;
  }

  // Wilson–Hilferty: 由一个固定均匀 c 连续近似出 chi^2(nu) 样本
  // 保证 nu 渐变时缩放因子连续（不再每帧重随机 → 不闪）。
  function chi2FromUniform(c, nu) {
    const z = normInv(clamp01(c));
    const t = 1 - 2 / (9 * nu) + z * Math.sqrt(2 / (9 * nu));
    return nu * Math.max(t, 1e-4) * t * t; // nu * t^3，t 取正
  }

  // 由固定底层均匀变量 (a,b,c) + 当前参数，连续地计算单个粒子的目标 (u,v)
  function mapUV(fam, params, a, b, c) {
    let u, v;
    if (fam === 'clayton') {
      const th = params.theta;
      u = a;
      v = Math.pow(Math.pow(u, -th) * (Math.pow(b, -th / (1 + th)) - 1) + 1, -1 / th);
    } else if (fam === 'frank') {
      const th = params.theta;
      u = a;
      if (Math.abs(th) < 1e-6) { v = b; }
      else {
        const e = Math.exp(-th);
        v = -1 / th * Math.log(1 + (b * (1 - e)) /
          (b * (Math.exp(-th * u) - 1) - Math.exp(-th * u)));
      }
    } else if (fam === 'gumbel') {
      // Gumbel 用 Archimedean 条件结构连续实现：
      // 给定固定 (a=u, b=条件均匀)，沿 theta 连续解出 v。
      // 用 Marshall–Olkin 在 theta 固定时是随机的；为保证连续，改用
      // 与 Clayton 对称的“上尾镜像”近似：对 (1-u,1-w) 走 Clayton 反生成元，再镜像。
      const th = params.theta;
      const thC = Math.max(th - 1, 0.001) * 2 + 0.05; // 把 Gumbel θ 映射到一个等效“聚拢强度”
      const uu = 1 - a, ww = b;
      const vv = Math.pow(Math.pow(uu, -thC) * (Math.pow(ww, -thC / (1 + thC)) - 1) + 1, -1 / thC);
      u = a; v = 1 - vv; // 镜像到右上角
    } else if (fam === 'gaussian') {
      const rho = params.rho;
      const z1 = normInv(clamp01(a));
      const z2 = normInv(clamp01(b));
      const x = z1, y = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
      u = CC.normCdf(x); v = CC.normCdf(y);
    } else if (fam === 't') {
      const rho = params.rho, nu = params.nu;
      const z1 = normInv(clamp01(a));
      const z2 = normInv(clamp01(b));
      const g1 = z1, g2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
      const chi = chi2FromUniform(c, nu);
      const w = Math.sqrt(nu / Math.max(chi, 1e-6));
      u = CC.tCdf(g1 * w, nu); v = CC.tCdf(g2 * w, nu);
    } else {
      u = a; v = b;
    }
    return [clamp01(u), clamp01(v)];
  }

  // 由 copula 连续重参数化设定粒子目标位置（不再每次全量随机重采样）
  function setTargets(fam, params) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let uv;
      try { uv = mapUV(fam, params, p.a, p.b, p.c); }
      catch (e) { uv = [p.a, p.b]; }
      if (!isFinite(uv[0]) || !isFinite(uv[1])) uv = [p.a, p.b];
      p.tx = u2x(uv[0]);
      p.ty = v2y(uv[1]);
    }
  }

  // 动画循环：lerp + 惯性/阻尼，磁力吸引到目标
  let raf = null;
  let avgSpeed = 999;        // 全局平均粒子速度（用于②的“聚拢稳定”判定）
  function tick() {
    ctx.clearRect(0, 0, W, H);
    // 背板网格（淡）
    drawGrid();

    const light = (theme === 'light');
    const k = 0.085;      // 弹簧刚度（吸引强度）
    const damp = 0.82;    // 阻尼（惯性感）
    // 浅色用正常合成 + 描边保证白底清晰；深色用 lighter 辉光叠加
    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
    const baseR = W < 400 ? 1.6 : 2.0;
    let speedSum = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let tx = p.tx, ty = p.ty;
      if (burst > 0) {
        // 爆开：临时把目标推离中心
        const cx = W / 2, cy = H / 2;
        const dx = p.x - cx, dy = p.y - cy;
        const len = Math.hypot(dx, dy) || 1;
        tx = cx + dx / len * (len + burst * 3);
        ty = cy + dy / len * (len + burst * 3);
      }
      // 磁力（弹簧）
      const ax = (tx - p.x) * k;
      const ay = (ty - p.y) * k;
      p.vx = (p.vx + ax) * damp;
      p.vy = (p.vy + ay) * damp;
      p.x += p.vx;
      p.y += p.vy;

      // 速度→辉光大小：运动时拖尾更亮
      const speed = Math.hypot(p.vx, p.vy);
      speedSum += speed;
      const glow = Math.min(speed * 0.5, 3);
      const r = baseR + glow * 0.5;

      if (light) {
        // 浅色主题：实心点 + 轻描边，白底上清晰
        if (speed > 0.7) {
          ctx.strokeStyle = curColor + '55';
          ctx.lineWidth = baseR * 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.4, p.y - p.vy * 1.4);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = curColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 6.283);
        ctx.fill();
        // 细描边增强对比
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = 'rgba(20,30,50,.55)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      } else {
        // 深色主题：辉光叠加
        if (speed > 0.6) {
          ctx.strokeStyle = curColor + '40';
          ctx.lineWidth = baseR * 0.9;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.fillStyle = curColor;
        ctx.globalAlpha = 0.18 + Math.min(glow * 0.1, 0.25);
        ctx.arc(p.x, p.y, r + glow + 1.6, 0, 6.283);
        ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    avgSpeed = particles.length ? speedSum / particles.length : 0;
    if (burst > 0) burst -= 1.4;
    raf = requestAnimationFrame(tick);
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = (theme === 'light') ? 'rgba(60,80,120,.10)' : 'rgba(120,140,180,.07)';
    ctx.lineWidth = 1;
    const gx = (W - 2 * PAD) / 4, gy = (H - 2 * PAD) / 4;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(PAD + i * gx, PAD); ctx.lineTo(PAD + i * gx, H - PAD); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD, PAD + i * gy); ctx.lineTo(W - PAD, PAD + i * gy); ctx.stroke();
    }
    // 角落高亮圈（提示抱团区）
    ctx.restore();
  }

  // ============================================================
  // KPI 更新
  // ============================================================
  function fmt(x) { return (x >= 0 ? '' : '') + x.toFixed(2); }

  function updateKpi(fam, params, goal) {
    let kpi;
    try { kpi = Cop[fam].kpi(params); } catch (e) { kpi = { tau: 0, lambdaL: 0, lambdaU: 0 }; }
    lastKpi = kpi;
    setKpiCell('#kpiTau', kpi.tau, 1, '#7b88a3', true);
    setKpiCell('#kpiLL', kpi.lambdaL, 1, '#2980b9');
    setKpiCell('#kpiLU', kpi.lambdaU, 1, '#e74c3c');

    // 任务达成检测
    let prog = 0, done = false, hitCell = null;
    if (goal) {
      if (goal.kpi === 'rho') {
        const r = Math.abs(params.rho || 0);
        prog = Math.min(r / goal.val, 1);
        done = r >= goal.val;
      } else {
        const v = kpi[goal.kpi] || 0;
        prog = Math.min(v / goal.val, 1);
        done = v >= goal.val;
        hitCell = goal.kpi === 'lambdaL' ? '#kpiLL' : goal.kpi === 'lambdaU' ? '#kpiLU' : '#kpiTau';
      }
    }
    $('#taskFill').style.width = (prog * 100) + '%';
    // t 族双尾：两个都达标才算
    if (fam === 't' && goal) {
      done = kpi.lambdaL >= goal.val && kpi.lambdaU >= goal.val;
      $('#kpiLL').classList.toggle('hit', kpi.lambdaL >= goal.val);
      $('#kpiLU').classList.toggle('hit', kpi.lambdaU >= goal.val);
    } else if (hitCell) {
      $('#kpiLL').classList.toggle('hit', false);
      $('#kpiLU').classList.toggle('hit', false);
      $(hitCell).classList.toggle('hit', done);
    } else {
      $('#kpiLL').classList.remove('hit'); $('#kpiLU').classList.remove('hit');
    }

    if (done && betPlaced && !achieved && !revealed && !freeMode) {
      achieved = true;
      startLocking();   // 不立即揭晓：先让学生看完粒子流向角落的完整过程
    }
  }

  // ② 节奏：达成阈值后等粒子真正聚拢稳定再揭晓
  let lockTimer = null;
  function startLocking() {
    // 顶部提示“正在锁定证据…”
    showToast('🔒 正在锁定证据…');
    $('#consoleTip').innerHTML = `<b>Nash：</b>命中阈值！别松手 —— 看粒子继续流向角落，<b>正在锁定证据…</b>`;
    const t0 = performance.now();
    const MIN_MS = 1300;   // 强制最短观察时长（看完粒子流向角落）
    const MAX_MS = 3200;   // 兜底上限，避免极端卡死
    const SETTLE_SPEED = 0.55; // 平均速度低于该值视为“聚拢稳定”
    function poll() {
      if (revealed) return;
      const elapsed = performance.now() - t0;
      const settled = avgSpeed < SETTLE_SPEED;
      if ((elapsed >= MIN_MS && settled) || elapsed >= MAX_MS) {
        doReveal();
        return;
      }
      lockTimer = requestAnimationFrame(poll);
    }
    lockTimer = requestAnimationFrame(poll);
  }
  function setKpiCell(sel, val, max, color) {
    const el = $(sel);
    el.querySelector('.k-val').textContent = fmt(val);
    const pct = Math.min(Math.abs(val) / max, 1) * 100;
    el.querySelector('.k-fill').style.width = pct + '%';
    el.querySelector('.k-fill').style.background = color;
  }

  // ============================================================
  // 控制台（滑块）
  // ============================================================
  function buildControls(s) {
    const wrap = $('#controls');
    wrap.innerHTML = '';
    s.sliders.forEach(sl => {
      const div = document.createElement('div');
      div.className = 'ctrl';
      const val = curParams[sl.key];
      div.innerHTML =
        `<label>${sl.label} <b id="lab_${sl.key}">${formatParam(sl.key, val)}</b></label>` +
        `<input type="range" id="sl_${sl.key}" min="${sl.min}" max="${sl.max}" step="${sl.step}" value="${val}">`;
      wrap.appendChild(div);
      const input = div.querySelector('input');
      paintRange(input);
      input.addEventListener('input', () => {
        curParams[sl.key] = parseFloat(input.value);
        $('#lab_' + sl.key).textContent = formatParam(sl.key, curParams[sl.key]);
        paintRange(input);
        setTargets(s.fam, curParams);
        updateKpi(s.fam, curParams, freeMode ? null : s.goal);
      });
    });
  }
  function formatParam(key, v) {
    if (key === 'nu') return Math.round(v);
    return (+v).toFixed(2);
  }
  function paintRange(input) {
    const min = +input.min, max = +input.max, v = +input.value;
    const pct = ((v - min) / (max - min)) * 100;
    input.style.background = `linear-gradient(90deg,var(--accent) ${pct}%,#2a3550 ${pct}%)`;
  }

  // ============================================================
  // 嫌疑人切换 / 场景设定
  // ============================================================
  function loadSuspect(idx) {
    curIdx = idx;
    const s = SUSPECTS[idx];
    achieved = false; revealed = false; bet = null; betPlaced = false;
    if (lockTimer) cancelAnimationFrame(lockTimer);
    curParams = Object.assign({}, s.params);
    curColor = s.color;

    $('#suspectBadge').textContent = s.emoji + ' ' + s.name;
    $('#suspectBadge').style.borderColor = s.color;
    $('#suspectBadge').style.color = s.color;
    const tag = $('#tailTag');
    tag.textContent = s.tailZh + '依赖';
    tag.style.background = s.color;
    $('#stageHint').textContent = `嫌疑人 ${idx + 1}/4`;
    $('#taskGoal').innerHTML = s.task;
    $('#taskFill').style.width = '0%';
    $('#consoleTip').innerHTML = `<b>Nash：</b>先别急着拖 —— 我们先<b>下注</b>，猜猜它的脾气。`;

    buildControls(s);
    setTargets(s.fam, curParams);
    updateKpi(s.fam, curParams, s.goal);
    renderDossier();

    if (!freeMode) {
      setTimeout(() => showBet(s), 500);
    }
    nashSay(`第 ${idx + 1} 位嫌疑人：<b>${s.name}</b>（${s.tailZh}）。审讯开始前，先押个注。`);
  }

  // ============================================================
  // 下注弹窗
  // ============================================================
  function showBet(s) {
    let sel = -1;
    const opts = s.options.map((o, i) =>
      `<div class="bet-opt" data-i="${i}">${cornerMini(i, s)}${o}</div>`).join('');
    modal.innerHTML =
      `<div class="suspect-headline" style="--sc:${s.color}">` +
        `<div class="sh-label">🔥 本案嫌疑人</div>` +
        `<div class="sh-name">${s.emoji} ${s.name}</div>` +
        `<div class="sh-tail" style="background:${s.color}">${s.tailZh}依赖${s.trap ? ' · ⚠️ 定价陷阱' : ''}</div>` +
      `</div>` +
      `<h3 style="margin-top:14px">🎲 下注 · 预测它的脾气</h3>` +
      `<div class="sub">现在你要预测的是上面这位 —— <b>${s.name}</b></div>` +
      `<div style="font-size:14.5px;line-height:1.5;margin-bottom:6px;">${s.betQ}</div>` +
      `<div class="bet-grid">${opts}</div>` +
      `<button class="btn" id="betConfirm" disabled>确认下注，开始审讯 →</button>`;
    openModal();
    modal.querySelectorAll('.bet-opt').forEach(el => {
      el.addEventListener('click', () => {
        modal.querySelectorAll('.bet-opt').forEach(x => x.classList.remove('sel'));
        el.classList.add('sel');
        sel = +el.dataset.i;
        $('#betConfirm').disabled = false;
      });
    });
    $('#betConfirm').addEventListener('click', () => {
      bet = sel;
      betPlaced = true;   // 下注后才允许触发达成揭晓
      closeModal();
      $('#consoleTip').innerHTML = `<b>Nash：</b>注押好了。现在拖滑块审讯它，盯住 λ 仪表 —— 越阈值就破案。`;
      nashSay('开始审讯！拖动滑块，看粒子往哪个角落聚。');
    });
  }
  // 下注选项里的迷你角落示意
  function cornerMini(i, s) {
    // 与选项语义对应放点
    const map = {
      gumbel: ['ll', 'ur', 'none', 'both'],
      clayton: ['ll', 'ur', 'none', 'both'],
      t: ['none', 'ur', 'both', 'four'],
      gaussian: ['ur', 'both', 'none', 'll']
    };
    const kind = (map[s.fam] || ['ll', 'ur', 'none', 'both'])[i];
    const dots = { ll: [[6, 38]], ur: [[38, 6]], both: [[6, 38], [38, 6]], none: [[24, 24]], four: [[6, 6], [38, 6], [6, 38], [38, 38]] }[kind] || [[24, 24]];
    const inner = dots.map(d => `<i style="left:${d[0]}%;top:${d[1]}%;background:${s.color}"></i>`).join('');
    return `<span class="mini">${inner}</span>`;
  }

  // ============================================================
  // 揭晓（翻牌）
  // ============================================================
  function doReveal() {
    if (revealed) return;
    revealed = true;
    const s = SUSPECTS[curIdx];
    const correct = bet === s.answer;
    burst = 36; // 粒子爆开特效

    modal.innerHTML =
      `<h3 style="text-align:center">${correct ? '🎯 神预测！' : '🔮 揭晓盲盒'}</h3>` +
      `<div class="reveal-flip"><div class="flip-inner" id="flipInner">` +
      `<div class="flip-face flip-front">❓</div>` +
      `<div class="flip-face flip-back ${correct ? '' : 'miss'}">` +
      `<div class="big">${correct ? '✅' : '🌀'}</div>` +
      `<div class="res">${correct ? '猜中了！' : '出乎意料吧'}</div></div>` +
      `</div></div>` +
      `<div class="sub" style="text-align:center;margin-bottom:0">` +
      (correct
        ? `你押的「${s.options[bet]}」正中靶心 —— 这正是它的作案手法。`
        : `你押了「${bet != null ? s.options[bet] : '—'}」，真相是「${s.options[s.answer]}」。哦~出乎意料吧？<b>这正是它的脾气</b>，不丢人，记住就好。`) +
      `</div>` +
      `<button class="btn gold" id="toInsight">看看我刚刚发现了什么 →</button>`;
    openModal();
    setTimeout(() => { $('#flipInner').classList.add('flipped'); }, 250);
    $('#toInsight').addEventListener('click', showInsight);
    nashSay(correct ? '漂亮！你已经读懂它了。' : '别在意，反直觉的案子最长见识。');
  }

  // ============================================================
  // 顿悟卡
  // ============================================================
  function showInsight() {
    const s = SUSPECTS[curIdx], ins = s.insight;
    modal.innerHTML =
      `<h3>💡 你刚刚发现了</h3>` +
      `<div class="sub">${s.emoji} ${s.name} · ${s.tailZh}依赖</div>` +
      `<div class="insight">` +
      `<div class="row"><span class="tag">现象</span><span class="txt">${ins.phenom}</span></div>` +
      `<div class="row"><span class="tag">机制</span><span class="txt">${ins.mech}</span></div>` +
      `</div>` +
      `<details class="formula-toggle"><summary>📐 展开公式（τ 与 λ 的来历）</summary>` +
      `<div class="formula-box" id="formulaBox">${ins.formula}</div></details>` +
      `<div class="money-hook">💰 ${ins.hook}</div>` +
      `<button class="btn gold" id="toStamp">📒 盖章存档，点亮图鉴 →</button>`;
    openModal();
    typesetMath();
    $('#toStamp').addEventListener('click', () => { closeModal(); stampDex(s); });
  }

  function typesetMath() {
    const box = $('#formulaBox');
    if (window.MathJax && MathJax.typesetPromise && box) {
      MathJax.typesetPromise([box]).catch(() => {});
    }
  }

  // ============================================================
  // 盖章点亮图鉴
  // ============================================================
  function stampDex(s) {
    if (!unlocked.includes(s.id)) {
      unlocked.push(s.id);
      store.set('s0_unlocked', unlocked);
    }
    renderDossier();
    const card = $('#dexCard_' + s.id);
    if (card) {
      card.classList.add('unlocked');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast(`✅ ${s.name} 已盖章 · 图鉴 ${unlocked.length}/4`);
    nashSay(`<b>${s.name}</b> 入册！图鉴 ${unlocked.length}/4。`);

    setTimeout(() => {
      if (unlocked.length >= 4) {
        finale();
      } else {
        // 进入下一个未解锁嫌疑人
        const next = SUSPECTS.findIndex(x => !unlocked.includes(x.id));
        if (next >= 0) loadSuspect(next);
      }
    }, 1400);
  }

  // ============================================================
  // 图鉴墙渲染
  // ============================================================
  function renderDossier() {
    // 顶部 chips
    const chips = $('#dossierChips');
    chips.innerHTML = SUSPECTS.map((s, i) => {
      const done = unlocked.includes(s.id);
      const active = i === curIdx && !done;
      return `<div class="chip ${done ? 'done' : ''} ${active ? 'active' : ''}" style="${done ? 'background:' + s.color : ''}" title="${s.name}">${done ? s.emoji : '🔒'}</div>`;
    }).join('');
    $('#progText').textContent = `图鉴 ${unlocked.length}/4`;

    // 图鉴墙
    const wall = $('#dexWall');
    wall.innerHTML = SUSPECTS.map(s => {
      const done = unlocked.includes(s.id);
      let kpi; try { kpi = Cop[s.fam].kpi(s.tail === 'none' && s.fam === 'gaussian' ? { rho: 0.9 } : s.fam === 't' ? { rho: 0.5, nu: 2 } : { theta: s.fam === 'clayton' ? 6 : 5 }); } catch (e) { kpi = { lambdaL: 0, lambdaU: 0 }; }
      return `<div class="dex-card ${done ? 'unlocked' : ''}" id="dexCard_${s.id}">
        <div class="dex-inner">
          <div class="dex-face dex-lock"><div>🔒</div><div class="lk-name">${s.name}</div></div>
          <div class="dex-face dex-open" style="background:linear-gradient(180deg,${hex2rgba(s.color,.16)},#141b29);border-radius:14px;">
            <div class="emo">${s.emoji}</div>
            <div class="nm" style="color:${s.color}">${s.name}</div>
            <div class="ti" style="background:${s.color}">${s.tailZh}依赖</div>
            <div class="lam">λ_L≈${kpi.lambdaL.toFixed(2)}　λ_U≈${kpi.lambdaU.toFixed(2)}</div>
          </div>
        </div>
        <div class="stamp">✓</div>
        <div class="shine"></div>
      </div>`;
    }).join('');
  }
  function hex2rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ============================================================
  // 通关庆祝（撒花）
  // ============================================================
  const confCv = $('#confetti'), confCtx = confCv.getContext('2d');
  let confParts = [], confRaf = null;
  function finale() {
    modal.innerHTML =
      `<div class="finale">` +
      `<div class="big-emo">🎉</div>` +
      `<h3>4 名嫌疑人全部归案！</h3>` +
      `<div class="sub" style="margin-bottom:14px">你已掌握四种尾部脾气：上尾🔥 / 下尾🧊 / 双尾🎭 / 无尾🎩。<br/>现在，去给真实的风险定价吧。</div>` +
      `<div style="font-size:13px;color:#cdd6e6;line-height:1.6;background:#131a28;border-radius:12px;padding:12px;text-align:left">` +
      `🔥 <b>Gumbel</b> 上尾 — 巨灾再保<br/>🧊 <b>Clayton</b> 下尾 — 信用违约<br/>🎭 <b>t</b> 双尾 — 多险种共振<br/>🎩 <b>Gaussian</b> 无尾 — 定价陷阱(2008)</div>` +
      `<button class="btn gold" id="unlockNext">🔓 解锁第 1 关</button>` +
      `<button class="btn" id="replayBtn" style="background:#2a3550;box-shadow:none;margin-top:10px">🎲 自由把玩模式</button>` +
      `</div>`;
    openModal();
    runConfetti();
    nashSay('全破了！🎉 你已经是合格的尾部侦探了。');
    $('#unlockNext').addEventListener('click', () => {
      closeModal();
      showToast('🚀 第 1 关已解锁（demo 占位）');
    });
    $('#replayBtn').addEventListener('click', () => {
      closeModal();
      $('#freeToggle').checked = true;
      enableFreeMode(true);
    });
  }
  function runConfetti() {
    confCv.style.display = 'block';
    confCv.width = window.innerWidth; confCv.height = window.innerHeight;
    const colors = ['#e74c3c', '#2980b9', '#8e44ad', '#95a5a6', '#e3b341', '#2ecc71'];
    confParts = [];
    for (let i = 0; i < 160; i++) {
      confParts.push({
        x: Math.random() * confCv.width, y: -20 - Math.random() * confCv.height * 0.4,
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
        r: 4 + Math.random() * 6, c: colors[i % colors.length],
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3
      });
    }
    let life = 0;
    function step() {
      confCtx.clearRect(0, 0, confCv.width, confCv.height);
      confParts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.rot += p.vr;
        confCtx.save(); confCtx.translate(p.x, p.y); confCtx.rotate(p.rot);
        confCtx.fillStyle = p.c;
        confCtx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        confCtx.restore();
      });
      life++;
      if (life < 280) confRaf = requestAnimationFrame(step);
      else { confCv.style.display = 'none'; confCtx.clearRect(0, 0, confCv.width, confCv.height); }
    }
    cancelAnimationFrame(confRaf);
    step();
  }

  // ============================================================
  // 自由模式
  // ============================================================
  function enableFreeMode(on) {
    freeMode = on;
    if (on) {
      $('#taskGoal').innerHTML = '🎲 <b>自由把玩</b>：随意拖动滑块，观察粒子聚散与 τ/λ 变化。';
      $('#taskFill').style.width = '0%';
      $('#consoleTip').innerHTML = `<b>Nash：</b>自由模式开启。切换嫌疑人用顶部图鉴格子。`;
      // 让图鉴格子可点击切换
      document.querySelectorAll('.chip').forEach((c, i) => {
        c.style.cursor = 'pointer';
        c.onclick = () => { loadSuspectFree(i); };
      });
      updateKpi(SUSPECTS[curIdx].fam, curParams, null);
      nashSay('自由模式：随便玩！想看哪个就点顶部格子。');
    } else {
      $('#consoleTip').innerHTML = `<b>Nash：</b>回到主线 —— 继续侦破未盖章的嫌疑人。`;
      const next = SUSPECTS.findIndex(x => !unlocked.includes(x.id));
      loadSuspect(next >= 0 ? next : 0);
    }
  }
  function loadSuspectFree(idx) {
    if (!freeMode) return;
    curIdx = idx; revealed = true; achieved = true; // 不触发主线揭晓
    const s = SUSPECTS[idx];
    curParams = Object.assign({}, s.params);
    curColor = s.color;
    $('#suspectBadge').textContent = s.emoji + ' ' + s.name;
    $('#suspectBadge').style.borderColor = s.color;
    $('#suspectBadge').style.color = s.color;
    $('#tailTag').textContent = s.tailZh + '依赖'; $('#tailTag').style.background = s.color;
    $('#stageHint').textContent = `自由 · ${s.name}`;
    buildControls(s);
    setTargets(s.fam, curParams);
    updateKpi(s.fam, curParams, null);
  }

  // ============================================================
  // Nash 浮窗
  // ============================================================
  let nashTimer = null;
  function nashSay(html) {
    const b = $('#nashBubble');
    b.innerHTML = '<b>Nash：</b>' + html;
    b.classList.add('show');
    clearTimeout(nashTimer);
    nashTimer = setTimeout(() => b.classList.remove('show'), 5200);
  }
  $('#nashOrb').addEventListener('click', () => {
    const s = SUSPECTS[curIdx];
    nashSay(`当前在审 <b>${s.name}</b>（${s.tailZh}）。${freeMode ? '自由模式中。' : '完成任务即可破案盖章。'}`);
  });

  // ---------- toast ----------
  function showToast(txt) {
    toast.textContent = txt;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // ---------- modal 开关 ----------
  function openModal() { overlay.classList.add('show'); }
  function closeModal() { overlay.classList.remove('show'); }

  // ============================================================
  // ⑤ 主题切换
  // ============================================================
  function applyTheme() {
    document.body.classList.toggle('theme-light', theme === 'light');
    const btn = $('#themeBtn');
    if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
  }
  function toggleTheme() {
    theme = (theme === 'light') ? 'dark' : 'light';
    store.set('s0_theme', theme);
    applyTheme();
    nashSay(theme === 'light' ? '切到<b>浅色</b>啦 ☀️ 白底也看得清粒子。' : '切到<b>深色</b>侦探板 🌙');
  }

  // ============================================================
  // ② 重新探案：清空进度，从 Gumbel 重来
  // ============================================================
  function resetProgress() {
    try { localStorage.removeItem('s0_unlocked'); } catch (e) {}
    unlocked.length = 0;
    if (lockTimer) cancelAnimationFrame(lockTimer);
    freeMode = false;
    $('#freeToggle').checked = false;
    closeModal();
    showToast('🔄 进度已清空，从 Gumbel 重新开始');
    loadSuspect(0); // 强制从第一个（Gumbel）开始
  }

  // ============================================================
  // 初始化
  // ============================================================
  $('#freeToggle').addEventListener('change', e => enableFreeMode(e.target.checked));
  $('#themeBtn').addEventListener('click', toggleTheme);
  $('#resetBtn').addEventListener('click', resetProgress);

  window.addEventListener('resize', () => {
    resizeCanvas();
    setTargets(SUSPECTS[curIdx].fam, curParams);
  });

  function init() {
    applyTheme();
    resizeCanvas();
    renderDossier();
    raf = requestAnimationFrame(tick);
    // 默认进入第一个未解锁的嫌疑人（已全解锁则回到第一个+自由）
    const next = SUSPECTS.findIndex(x => !unlocked.includes(x.id));
    if (next < 0) {
      $('#freeToggle').checked = true;
      curIdx = 0; curParams = Object.assign({}, SUSPECTS[0].params); curColor = SUSPECTS[0].color;
      buildControls(SUSPECTS[0]); setTargets(SUSPECTS[0].fam, curParams);
      enableFreeMode(true);
    } else {
      loadSuspect(next);
    }
    setTimeout(() => nashSay('欢迎来到第0关 🕵️ 我是 <b>Nash</b>。点开下注卡，开始你的第一桩案子。'), 900);
  }

  // 等 DOM 就绪
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
