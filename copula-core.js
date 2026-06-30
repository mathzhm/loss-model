/* ============================================================
 * copula-core.js — Ch17 损失模型教学 · Copula 核心数学库
 * 站4「Copula 家族图鉴」及后续站共用
 * 含：6 族 copula 采样(U,V) + τ / λ_L / λ_U 计算 + 配色语义
 * 公式来源：Ch17 课件全文（已核对）
 * 纯前端、无依赖。
 * ============================================================ */
(function (global) {
  'use strict';

  // ---------- 基础数学工具 ----------
  // 标准正态 CDF (Abramowitz & Stegun 7.1.26 近似)
  function normCdf(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989422804014327 * Math.exp(-x * x / 2);
    let p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 +
            t * (-1.821255978 + t * 1.330274429))));
    return x >= 0 ? 1 - p : p;
  }
  // 标准正态 逆CDF (Beasley-Springer-Moro)
  function normInv(p) {
    if (p <= 0) return -8; if (p >= 1) return 8;
    const a = [-39.6968302866538, 220.946098424521, -275.928510446969,
               138.357751867269, -30.6647980661472, 2.50662827745924];
    const b = [-54.4760987982241, 161.585836858041, -155.698979859887,
               66.8013118877197, -13.2806815528857];
    const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184,
               -2.54973253934373, 4.37466414146497, 2.93816398269878];
    const d = [0.00778469570904146, 0.32246712907004, 2.445134137143,
               3.75440866190742];
    const pl = 0.02425, ph = 1 - pl; let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    if (p <= ph) { q = p - 0.5; r = q*q;
      return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
             (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  // 学生t CDF (数值积分, 适中精度)
  function tCdf(x, nu) {
    // 用不完全 beta 关系: P(T<=x) ; 这里用数值积分密度
    const steps = 400, lo = -12, hi = x > 12 ? 12 : x;
    if (x <= -12) return 0; if (x >= 12) return 1;
    const c = gammaLn((nu + 1) / 2) - gammaLn(nu / 2) - 0.5 * Math.log(nu * Math.PI);
    const dens = t => Math.exp(c - ((nu + 1) / 2) * Math.log(1 + t * t / nu));
    let s = 0, h = (hi - lo) / steps;
    for (let i = 0; i <= steps; i++) {
      const t = lo + i * h;
      const w = (i === 0 || i === steps) ? 1 : (i % 2 ? 4 : 2);
      s += w * dens(t);
    }
    return s * h / 3;
  }
  function gammaLn(x) {
    const g = [76.18009172947146, -86.50532032941677, 24.01409824083091,
               -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let xx = x, y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp); let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) { y++; ser += g[j] / y; }
    return -tmp + Math.log(2.5066282746310005 * ser / xx);
  }
  // 标准正态随机数 (Box-Muller)
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  // 卡方(nu) 随机数 = sum of nu 个 N(0,1)^2 (nu 为正整数近似)
  function randChi2(nu) {
    let s = 0; const k = Math.round(nu);
    for (let i = 0; i < k; i++) { const z = randn(); s += z * z; }
    return s;
  }

  // ---------- Debye 函数 D1(θ)  用于 Frank 的 τ ----------
  function debye1(theta) {
    if (Math.abs(theta) < 1e-6) return 1;
    const n = 200, h = theta / n; let s = 0;
    for (let i = 0; i <= n; i++) {
      const t = (i === 0 ? 1e-9 : i * h);
      const f = t / (Math.exp(t) - 1);
      const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
      s += w * f;
    }
    s = s * h / 3;
    return s / theta;
  }

  // ============================================================
  // 各 copula 族：采样 sample(n, params) -> [[u,v],...]
  //               kpi(params) -> {tau, lambdaL, lambdaU}
  // ============================================================
  const Copulas = {
    independent: {
      id: 'independent', label: '独立', tail: 'none',
      sample(n) { const a = []; for (let i = 0; i < n; i++) a.push([Math.random(), Math.random()]); return a; },
      kpi() { return { tau: 0, lambdaL: 0, lambdaU: 0 }; }
    },
    gaussian: {
      id: 'gaussian', label: 'Gaussian', tail: 'none',
      sample(n, p) {
        const rho = p.rho, a = [];
        for (let i = 0; i < n; i++) {
          const z1 = randn(), z2 = randn();
          const x = z1, y = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
          a.push([normCdf(x), normCdf(y)]);
        }
        return a;
      },
      kpi(p) {
        const rho = p.rho;
        return { tau: 2 / Math.PI * Math.asin(rho), lambdaL: 0, lambdaU: 0 };
      }
    },
    t: {
      id: 't', label: 't', tail: 'both',
      sample(n, p) {
        const rho = p.rho, nu = p.nu, a = [];
        for (let i = 0; i < n; i++) {
          const z1 = randn(), z2 = randn();
          const g1 = z1, g2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
          const w = Math.sqrt(nu / randChi2(nu));
          const x = g1 * w, y = g2 * w;
          a.push([tCdf(x, nu), tCdf(y, nu)]);
        }
        return a;
      },
      kpi(p) {
        const rho = p.rho, nu = p.nu;
        const arg = -Math.sqrt((nu + 1) * (1 - rho) / (1 + rho));
        const lam = 2 * tCdf(arg, nu + 1);
        return { tau: 2 / Math.PI * Math.asin(rho), lambdaL: lam, lambdaU: lam };
      }
    },
    clayton: {
      id: 'clayton', label: 'Clayton', tail: 'lower',
      // 条件抽样法: U~Unif; V 由条件分布
      sample(n, p) {
        const th = p.theta, a = [];
        for (let i = 0; i < n; i++) {
          const u = Math.random(), w = Math.random();
          // V = (u^{-θ}(w^{-θ/(1+θ)} - 1) + 1)^{-1/θ}
          const v = Math.pow(Math.pow(u, -th) * (Math.pow(w, -th / (1 + th)) - 1) + 1, -1 / th);
          a.push([u, Math.min(Math.max(v, 1e-6), 1 - 1e-6)]);
        }
        return a;
      },
      kpi(p) {
        const th = p.theta;
        return { tau: th / (th + 2), lambdaL: Math.pow(2, -1 / th), lambdaU: 0 };
      }
    },
    gumbel: {
      id: 'gumbel', label: 'Gumbel', tail: 'upper',
      // Marshall-Olkin (稳定分布) 抽样
      sample(n, p) {
        const th = p.theta, a = [];
        const alpha = 1 / th;
        for (let i = 0; i < n; i++) {
          // 正稳定分布 S(alpha) 抽样 (Chambers-Mallows-Stuck)
          const U = (Math.random() - 0.5) * Math.PI;
          const W = -Math.log(Math.random());
          const S = Math.sin(alpha * (U + Math.PI / 2)) / Math.pow(Math.cos(U), 1 / alpha) *
                    Math.pow(Math.cos(U - alpha * (U + Math.PI / 2)) / W, (1 - alpha) / alpha);
          const e1 = -Math.log(Math.random()), e2 = -Math.log(Math.random());
          const u = Math.exp(-Math.pow(e1 / S, alpha));
          const v = Math.exp(-Math.pow(e2 / S, alpha));
          a.push([Math.min(Math.max(u, 1e-6), 1 - 1e-6), Math.min(Math.max(v, 1e-6), 1 - 1e-6)]);
        }
        return a;
      },
      kpi(p) {
        const th = p.theta;
        return { tau: 1 - 1 / th, lambdaL: 0, lambdaU: 2 - Math.pow(2, 1 / th) };
      }
    },
    frank: {
      id: 'frank', label: 'Frank', tail: 'none',
      sample(n, p) {
        const th = p.theta, a = [];
        for (let i = 0; i < n; i++) {
          const u = Math.random(), w = Math.random();
          // 条件抽样
          let v;
          if (Math.abs(th) < 1e-6) { v = w; }
          else {
            const e = Math.exp(-th);
            v = -1 / th * Math.log(1 + (w * (1 - e)) /
                (w * (Math.exp(-th * u) - 1) - Math.exp(-th * u)));
          }
          a.push([u, Math.min(Math.max(v, 1e-6), 1 - 1e-6)]);
        }
        return a;
      },
      kpi(p) {
        const th = p.theta;
        const tau = 1 - 4 / th * (1 - debye1(th));
        return { tau: tau, lambdaL: 0, lambdaU: 0 };
      }
    }
  };

  // ---------- 配色语义 (§2.4) ----------
  const COLORS = {
    upper: '#e74c3c',   // 暖红 = 上尾依赖
    lower: '#2980b9',   // 冷蓝 = 下尾依赖
    none:  '#95a5a6',   // 灰   = 无尾/独立
    accent: '#3498db',
    primary: '#2c3e50'
  };
  function tailColor(tail) {
    if (tail === 'upper') return COLORS.upper;
    if (tail === 'lower') return COLORS.lower;
    if (tail === 'both')  return '#8e44ad'; // 紫 = 双尾
    return COLORS.none;
  }

  // ============================================================
  // 对角密度剖面 diagonalDensity(data, bins)
  //   把 (U,V) 投影到主对角线坐标 s=(u+v)/2 ∈[0,1]，统计其密度。
  //   - 尾部抱团(λ_L/λ_U>0) ⇒ s≈0 或 s≈1 处密度被显著抬高 = "重尾"
  //   - 独立/无尾 ⇒ s 在中段(0.5附近)隆起、两端快速衰减 = "轻尾"
  //   返回 {x:[...], y:[...]}，y 已归一化为密度(积分≈1)。
  // ============================================================
  function diagonalDensity(data, bins) {
    bins = bins || 40;
    const cnt = new Array(bins).fill(0);
    const n = data.length;
    for (let i = 0; i < n; i++) {
      const s = (data[i][0] + data[i][1]) / 2;       // 主对角投影
      let b = Math.floor(s * bins);
      if (b < 0) b = 0; if (b >= bins) b = bins - 1;
      cnt[b]++;
    }
    const w = 1 / bins;                               // 每个 bin 宽度
    const x = [], y = [];
    for (let b = 0; b < bins; b++) {
      x.push((b + 0.5) * w);
      y.push(cnt[b] / (n * w));                        // 密度 = 频率 / (n·Δ)
    }
    return { x, y };
  }

  // 反对角密度剖面 antiDiagonalDensity(data, bins)
  //   投影到反对角 d=(u-v+1)/2 ∈[0,1]，用于观察"负相关/反向抱团"(可选)。
  function antiDiagonalDensity(data, bins) {
    bins = bins || 40;
    const cnt = new Array(bins).fill(0);
    const n = data.length;
    for (let i = 0; i < n; i++) {
      const dd = (data[i][0] - data[i][1] + 1) / 2;
      let b = Math.floor(dd * bins);
      if (b < 0) b = 0; if (b >= bins) b = bins - 1;
      cnt[b]++;
    }
    const w = 1 / bins, x = [], y = [];
    for (let b = 0; b < bins; b++) { x.push((b + 0.5) * w); y.push(cnt[b] / (n * w)); }
    return { x, y };
  }

  global.CopulaCore = { Copulas, COLORS, tailColor, normCdf, normInv, tCdf,
                        diagonalDensity, antiDiagonalDensity };
})(typeof window !== 'undefined' ? window : this);
