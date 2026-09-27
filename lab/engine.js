/* =====================================================================
   engine.js —— LOSS LAB 可复用实验引擎（零依赖 · Canvas 手绘）
   10 种引擎，全部由 course.js 的数据配置驱动：
     curve     参数→曲线（多系列 + 滑块 + 下拉）
     scatter   copula 采样散点（家族切换 + 参数 + τ/λ 读数）
     match     拖拽配对
     build     公式拼装
     predict   预测下注
     hist      PIT 直方图
     aggregate 蒙特卡洛聚合 VaR 对比
     tsSim     时间序列模拟 + 样本 ACF
     compound  频度-强度复合分布蒙特卡洛
     ruin      Cramér-Lundberg 盈余路径与破产概率
   入口：Engine.mount(container, config, ctx)
   ===================================================================== */
(function(){
"use strict";

/* ---------------- 数学基础库 ---------------- */
const M = {
  erf(x){ const s=x<0?-1:1; x=Math.abs(x);
    const t=1/(1+0.3275911*x);
    const y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
    return s*y; },
  normCDF(x){ return 0.5*(1+this.erf(x/Math.SQRT2)); },
  probit(p){ let lo=-8,hi=8; for(let i=0;i<60;i++){const m=(lo+hi)/2; if(this.normCDF(m)<p)lo=m; else hi=m;} return (lo+hi)/2; },
  randn(){ let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); },
  gammaln(z){ // Lanczos g=7（反射公式处理 z<0.5）
    if(z<0.5) return Math.log(Math.PI/Math.sin(Math.PI*z))-this.gammaln(1-z);
    z-=1;
    const C=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,
      12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    let x=C[0]; for(let i=1;i<9;i++) x+=C[i]/(z+i);
    const t=z+7.5;
    return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x); },
  gamma(x,a){ return Math.exp((a-1)*Math.log(x)-x-this.gammaln(a)); }, // scale=1
  betacf(a,b,x){ const MAXIT=200,EPS=3e-12,FPMIN=1e-300;
    let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;
    if(Math.abs(d)<FPMIN)d=FPMIN; d=1/d; let h=d;
    for(let m=1;m<=MAXIT;m++){ const m2=2*m;
      let aa=m*(b-m)*x/((qam+m2)*(a+m2));
      d=1+aa*d; if(Math.abs(d)<FPMIN)d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN)c=FPMIN; d=1/d; h*=d*c;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
      d=1+aa*d; if(Math.abs(d)<FPMIN)d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN)c=FPMIN; d=1/d;
      const del=d*c; h*=del; if(Math.abs(del-1)<EPS)break; }
    return h; },
  betai(a,b,x){ if(x<=0)return 0; if(x>=1)return 1;
    const bt=Math.exp(this.gammaln(a+b)-this.gammaln(a)-this.gammaln(b)+a*Math.log(x)+b*Math.log(1-x));
    return x<(a+1)/(a+b+2) ? bt*this.betacf(a,b,x)/a : 1-bt*this.betacf(b,a,1-x)/b; },
  tCDF(x,nu){ if(x===0)return 0.5;
    const ib=this.betai(nu/2,0.5,nu/(nu+x*x));
    return x>0 ? 1-0.5*ib : 0.5*ib; },
  chi2(nu){ let s=0; for(let i=0;i<nu;i++){ const z=this.randn(); s+=z*z; } return s; },
  poisson(lam){
    if(lam<=0)return 0;
    if(lam>30)return Math.max(0,Math.round(lam+Math.sqrt(lam)*this.randn()));
    const L=Math.exp(-lam); let k=0,p=1;
    do{ k++; p*=Math.random(); }while(p>L);
    return k-1; },
  gammaVar(a){ // 标准 Gamma 随机数（形状 a，尺度 1）Marsaglia-Tsang
    if(a<1){ const u=Math.random(); return this.gammaVar(a+1)*Math.pow(u,1/a); }
    const d=a-1/3, c=1/Math.sqrt(9*d);
    for(;;){ let x=this.randn(), v=1+c*x; if(v<=0)continue; v=v*v*v; const u=Math.random();
      if(u<1-0.0331*x*x*x*x) return d*v;
      if(Math.log(u)<0.5*x*x+d*(1-v+Math.log(v))) return d*v; } }
};

/* ---------------- Copula 函数与采样 ---------------- */
const Cop = {
  C(fam,u,v,p){
    u=Math.min(Math.max(u,1e-9),1-1e-9); v=Math.min(Math.max(v,1e-9),1-1e-9);
    switch(fam){
      case 'clayton':{ const t=p.theta; return Math.pow(Math.pow(u,-t)+Math.pow(v,-t)-1,-1/t); }
      case 'gumbel':{ const t=p.theta; return Math.exp(-Math.pow(Math.pow(-Math.log(u),t)+Math.pow(-Math.log(v),t),1/t)); }
      case 'frank':{ const t=p.theta; if(Math.abs(t)<1e-6)return u*v;
        return -Math.log(1+(Math.exp(-t*u)-1)*(Math.exp(-t*v)-1)/(Math.exp(-t)-1))/t; }
      case 'gaussian':{ const r=Math.min(Math.max(p.rho,-0.999),0.999);
        return bivNorm(M.normCDF? invNorm(u):u, invNorm(v), r); }
      case 't':{ const r=Math.min(Math.max(p.rho,-0.999),0.999);
        return bivT(invNorm(u), invNorm(v), r, p.nu); }
      case 'indep': return u*v;
    }
    return u*v;
  },
  // 条件分布 ∂C/∂u（中心差分），用于通用反演采样
  cond(fam,u,v,p){ const e=1e-5;
    const a=Math.min(u+e,1-1e-7), b=Math.max(u-e,1e-7);
    return (this.C(fam,a,v,p)-this.C(fam,b,v,p))/(a-b);
  },
  sample(fam,p,n){
    if(fam==='gaussian') return this._gauss(p.rho,n);
    if(fam==='t') return this._t(p.rho,p.nu,n);
    if(fam==='indep'){ const o=[]; for(let i=0;i<n;i++)o.push([Math.random(),Math.random()]); return o; }
    // Archimedean：条件分布 + 二分反演
    const o=[];
    for(let i=0;i<n;i++){
      const u1=Math.random(), w=Math.random();
      let lo=1e-6, hi=1-1e-6, u2=(lo+hi)/2;
      for(let k=0;k<40;k++){ u2=(lo+hi)/2; const c=this.cond(fam,u1,u2,p);
        if(c<w) lo=u2; else hi=u2; }
      o.push([u1,u2]);
    }
    return o;
  },
  _gauss(r,n){ const o=[]; const s=Math.sqrt(1-r*r);
    for(let i=0;i<n;i++){ const z1=M.randn(), z2=M.randn(); const y=r*z1+s*z2;
      o.push([M.normCDF(z1),M.normCDF(y)]); } return o; },
  _t(r,nu,n){ const o=[]; const s=Math.sqrt(1-r*r);
    for(let i=0;i<n;i++){ const z1=M.randn(), z2=M.randn(); const y=r*z1+s*z2;
      const g=M.chi2(nu)/nu; const q=Math.sqrt(g);
      o.push([M.tCDF(z1/q,nu),M.tCDF(y/q,nu)]); } return o; },
  // 读数：τ, λL, λU
  stats(fam,p){
    const out={tau:null,lambdaL:0,lambdaU:0};
    switch(fam){
      case 'clayton':{ const t=p.theta; out.tau=t/(t+2); out.lambdaL=Math.pow(2,-1/t); out.lambdaU=0; break; }
      case 'gumbel':{ const t=p.theta; out.tau=1-1/t; out.lambdaL=0; out.lambdaU=2-Math.pow(2,1/t); break; }
      case 'frank':{ const t=p.theta; out.tau=frankTau(t); out.lambdaL=0; out.lambdaU=0; break; }
      case 'gaussian':{ out.tau=2/Math.PI*Math.asin(p.rho); out.lambdaL=0; out.lambdaU=0; break; }
      case 't':{ out.tau=2/Math.PI*Math.asin(p.rho);
        const arg=-Math.sqrt((p.nu+1)*(1-p.rho)/(1+p.rho));
        out.lambdaL=2*M.tCDF(arg,p.nu+1); out.lambdaU=out.lambdaL; break; }
      case 'indep': out.tau=0; break;
    }
    return out;
  }
};
function invNorm(p){ // Acklam 反演
  p=Math.min(Math.max(p,1e-9),1-1e-9);
  const a=[-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00];
  const b=[-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01];
  const c=[-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00];
  const d=[7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,3.754408661907416e+00];
  const pl=0.02425, ph=1-pl; let q,r;
  if(p<pl){ q=Math.sqrt(-2*Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if(p<=ph){ q=p-0.5; r=q*q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
  q=Math.sqrt(-2*Math.log(1-p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}
function bivNorm(x,y,r){ // Drezner 近似二元正态 CDF
  if(r===0) return M.normCDF(x)*M.normCDF(y);
  const r2=r*r; let h=-x,k=-y,hk=h*k;
  // Gauss-Legendre 简化：用级数
  const a=(1-r)*(1+r); const b=Math.sqrt(Math.max(a,0));
  let sum=0; const n=20;
  for(let i=1;i<=n;i++){ const t=Math.cos(Math.PI*(i-0.5)/n);
    const rr=r*Math.sqrt(1-t*t);
    sum += Math.exp((2*rr*hk - (h*h+k*k))/(2*(1-rr*rr)))/(1-rr*rr);
  }
  // 退化到数值：直接用条件积分更稳
  return bivNormInt(x,y,r);
}
function bivNormInt(x,y,r){ // 数值积分 Φ((y-r z)/sqrt(1-r²)) φ(z) dz from -inf..x
  const s=Math.sqrt(1-r*r); const N=120; let lo=-8, hi=x;
  if(hi<lo) return 0;
  const step=(hi-lo)/N; let sum=0;
  for(let i=0;i<N;i++){ const z=lo+(i+0.5)*step;
    const phi=Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
    sum += M.normCDF((y-r*z)/s)*phi*step; }
  return Math.min(Math.max(sum,0),1);
}
function bivT(x,y,r,nu){ // 数值积分二元 t
  const s=Math.sqrt(1-r*r); const N=120; let lo=-8, hi=x; if(hi<lo)return 0;
  const step=(hi-lo)/N; let sum=0;
  const constK=Math.exp(M.gammaln((nu+1)/2)-M.gammaln(nu/2))/Math.sqrt(nu*Math.PI);
  for(let i=0;i<N;i++){ const z=lo+(i+0.5)*step;
    const fz=constK*Math.pow(1+z*z/nu,-(nu+1)/2);
    sum += M.tCDF((y-r*z)/s,nu)*fz*step; }
  return Math.min(Math.max(sum,0),1);
}
function frankTau(t){ if(Math.abs(t)<1e-5)return 0;
  // Debye D1(t)=(1/t)∫_0^t x/(e^x-1) dx，Simpson
  const N=200, h=t/N; let s=0;
  const f=x=> x<1e-6?1:x/(Math.exp(x)-1);
  for(let i=0;i<=N;i++){ const x=i*h; s+=(i===0||i===N?1:(i%2?4:2))*f(x); }
  const D1=s*h/3/t;
  return 1-4/t+4*D1/t;
}

/* ---------------- 曲线函数注册表 ---------------- */
const FNS = {
  jointSlice:x=>(x+4)/20,
  jointSliceY:(x,P)=>(x+4*P.y0)/20,
  marginalX:x=>(x+4)/10,
  claytonDiag:(u,P)=>Math.pow(2*Math.pow(Math.max(u,1e-9),-P.theta)-1,-1/P.theta),
  frechetUpper:u=>u,
  indep:u=>u*u,
  frechetLower:u=>Math.max(2*u-1,0),
  lambdaClayton:(q,P)=>{ const t=P.theta; const C=Math.pow(2*Math.pow(q,-t)-1,-1/t); return C/q; },
  lambdaLClayton:P=>Math.pow(2,-1/P.theta),
  gevPDF:(x,P)=>{ const xi=P.xi;
    if(Math.abs(xi)<1e-3){ return Math.exp(-x-Math.exp(-x)); }
    const t=1+xi*x; if(t<=0)return 0;
    return Math.exp(-Math.pow(t,-1/xi))*Math.pow(t,-1/xi-1); },
  lossDist:(x,P)=>{ const s=P.shape;
    switch(P.which){
      case 'exp': return s*Math.exp(-s*x);
      case 'gamma': return M.gamma(x,s);
      case 'weibull': return s*Math.pow(x,s-1)*Math.exp(-Math.pow(x,s));
      case 'pareto': return s/Math.pow(1+x,s+1);
      case 'lognormal': return 1/(x*s*Math.sqrt(2*Math.PI))*Math.exp(-Math.pow(Math.log(x),2)/(2*s*s));
    } return 0; },
  /* ---- 再保险：强度 X ~ Exp(均值 P.mu) ---- */
  expDens:(x,P)=>Math.exp(-x/P.mu)/P.mu,
  retainXL:(x,P)=>Math.min(x,P.M),
  cedeXL:(x,P)=>Math.max(x-P.M,0),
  payDeduct:(x,P)=>Math.max(x-P.d,0),
  payDeductLimit:(x,P)=>Math.min(Math.max(x-P.d,0),P.L),
  quotaRetain:(x,P)=>(1-P.alpha)*x,
  quotaCede:(x,P)=>P.alpha*x,
  EretainXL:P=>P.mu*(1-Math.exp(-P.M/P.mu)),
  EcedeXL:P=>P.mu*Math.exp(-P.M/P.mu),
  EpayDeduct:P=>P.mu*Math.exp(-P.d/P.mu),
  PcedeXL:P=>Math.exp(-P.M/P.mu),
  meanExcessExp:(M,P)=>P.theta,
  meanExcessPareto:(M,P)=>P.alpha>1?(M+P.theta)/(P.alpha-1):NaN,
  /* ---- 频度分布（连续插值画包络） ---- */
  poissonPMF:(k,P)=> k<0?0:Math.exp(-P.lambda+k*Math.log(Math.max(P.lambda,1e-9))-M.gammaln(k+1)),
  nbPMF:(k,P)=>{ const r=P.r,p=P.p; return k<0?0:Math.exp(M.gammaln(k+r)-M.gammaln(r)-M.gammaln(k+1)+r*Math.log(p)+k*Math.log(1-p)); },
  /* ---- 时间序列理论 ---- */
  acfAR1:(k,P)=>Math.pow(P.phi,k),
  foreAR1:(h,P)=>P.xT*Math.pow(P.phi,h),
  /* ---- 机器学习 ---- */
  ridgeCoef:(l,P)=>P.beta0/(1+l),
  lassoCoef:(l,P)=>Math.sign(P.beta0)*Math.max(Math.abs(P.beta0)-l,0),
  biasSq:c=>2.4/(1+0.85*c)+0.12,
  varCurve:c=>0.10*Math.pow(c,1.7),
  totalErr:c=>2.4/(1+0.85*c)+0.12+0.10*Math.pow(c,1.7),
  /* ---- 破产理论 ---- */
  ruinExp:(u,P)=>Math.exp(-P.R*u),
  /* ---- GLM：方差函数 V(μ) 与连接函数 g(μ)（Ch21/GLM） ---- */
  glmVar:(x,P)=>{ switch(P.which){
    case 'normal': return 1;
    case 'poisson': return x;
    case 'gamma': return x*x/Math.max(P.alpha,0.2);
    case 'nb': return x+x*x/Math.max(P.alpha,0.2);
  } return x; },
  glmLink:(x,P)=>{ const t=Math.min(Math.max(x,1e-4),1-1e-4);
    switch(P.which){
      case 'logit': return Math.log(t/(1-t));
      case 'probit': return M.probit(t);
      case 'log': return Math.log(Math.max(x,1e-4));
      case 'identity': return x;
    } return x; },
  expCDF:(x,P)=>1-Math.exp(-x/P.mu),
  invExpCDF:(P)=>-P.mu*Math.log(1-P.U)
};

/* ---------------- Canvas 工具 ---------------- */
function setupCanvas(cv, cssW, cssH){
  const dpr=window.devicePixelRatio||1;
  cv.width=cssW*dpr; cv.height=cssH*dpr;
  cv.style.width=cssW+'px'; cv.style.height=cssH+'px';
  const ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
  return ctx;
}
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||name; }
function resolveColor(c){ return c.startsWith('var(')?cssVar(c.slice(4,-1))||'#a78bfa':c; }

/* 通用坐标轴折线图 */
function plotLines(cv, series, opt){
  const W=cv.clientWidth||opt.w||560, H=opt.h||255;
  const ctx=setupCanvas(cv,W,H);
  const pad={l:48,r:16,t:16,b:38};
  const xmin=opt.x.min, xmax=opt.x.max;
  // 计算 y 范围
  let ymin=Infinity, ymax=-Infinity;
  const data=series.map(s=>{ const pts=[];
    for(let i=0;i<=opt.N;i++){ const x=xmin+(xmax-xmin)*i/opt.N; let y=s.fn(x);
      if(isFinite(y)){ pts.push([x,y]); if(y<ymin)ymin=y; if(y>ymax)ymax=y; } }
    return {s,pts}; });
  if(!isFinite(ymin)){ymin=0;ymax=1;}
  if(opt.ymin!==undefined)ymin=opt.ymin; if(opt.ymax!==undefined)ymax=opt.ymax;
  const yr=(ymax-ymin)||1; ymin-=yr*0.08; ymax+=yr*0.08;
  const X=x=>pad.l+(x-xmin)/(xmax-xmin)*(W-pad.l-pad.r);
  const Y=y=>H-pad.b-(y-ymin)/(ymax-ymin)*(H-pad.t-pad.b);
  // 网格
  ctx.strokeStyle=cssVar('--cv-grid'); ctx.lineWidth=1; ctx.fillStyle=cssVar('--cv-tick');
  ctx.font='11px JetBrains Mono, monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let i=0;i<=5;i++){ const y=ymin+(ymax-ymin)*i/5; const py=Y(y);
    ctx.beginPath(); ctx.moveTo(pad.l,py); ctx.lineTo(W-pad.r,py); ctx.stroke();
    ctx.fillText(fmt(y),pad.l-6,py); }
  ctx.textAlign='center'; ctx.textBaseline='top';
  for(let i=0;i<=5;i++){ const x=xmin+(xmax-xmin)*i/5; const px=X(x);
    ctx.beginPath(); ctx.moveTo(px,pad.t); ctx.lineTo(px,H-pad.b); ctx.stroke();
    ctx.fillText(fmt(x),px,H-pad.b+6); }
  // 轴标签
  ctx.fillStyle=cssVar('--cv-axis'); ctx.font='12px sans-serif';
  ctx.fillText(opt.x.label||'x', pad.l+(W-pad.l-pad.r)/2, H-16);
  // 折线
  data.forEach(d=>{ ctx.strokeStyle=resolveColor(d.s.color); ctx.lineWidth=d.s.width||2;
    ctx.beginPath(); d.pts.forEach((p,i)=>{ const px=X(p[0]),py=Y(p[1]); i?ctx.lineTo(px,py):ctx.moveTo(px,py); });
    ctx.stroke(); });
  return {X,Y};
}
function fmt(v){ if(Math.abs(v)>=1000)return v.toFixed(0);
  if(Math.abs(v)<0.01&&v!==0)return v.toExponential(1);
  return (Math.round(v*100)/100).toString(); }

/* 散点图（正方形，尺寸受限保证一屏可见） */
function plotScatter(cv, pts, color){
  const W=Math.min(cv.clientWidth||320, 330), H=W; const ctx=setupCanvas(cv,W,H);
  const pad=34; const X=u=>pad+u*(W-2*pad), Y=v=>H-pad-v*(H-2*pad);
  ctx.strokeStyle=cssVar('--cv-grid'); ctx.lineWidth=1;
  ctx.fillStyle=cssVar('--cv-tick'); ctx.font='10px JetBrains Mono,monospace';
  for(let i=0;i<=4;i++){ const g=i/4;
    ctx.beginPath(); ctx.moveTo(X(g),pad); ctx.lineTo(X(g),H-pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad,Y(g)); ctx.lineTo(W-pad,Y(g)); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(g.toFixed(2),X(g),H-pad+5);
    ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(g.toFixed(2),pad-5,Y(g)); }
  // 对角线
  ctx.strokeStyle='rgba(120,150,200,.25)'; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(X(0),Y(0)); ctx.lineTo(X(1),Y(1)); ctx.stroke(); ctx.setLineDash([]);
  // 点
  const col=resolveColor(color);
  ctx.fillStyle=col; ctx.globalAlpha=0.42;
  pts.forEach(p=>{ ctx.beginPath(); ctx.arc(X(p[0]),Y(p[1]),2.4,0,7); ctx.fill(); });
  ctx.globalAlpha=1;
}

/* 直方图（密度） */
function plotHist(cv, values, bins, color){
  const W=cv.clientWidth||520, H=250; const ctx=setupCanvas(cv,W,H);
  const pad={l:44,r:14,t:14,b:34};
  const counts=new Array(bins).fill(0);
  values.forEach(v=>{ let b=Math.floor(v*bins); if(b>=bins)b=bins-1; if(b<0)b=0; counts[b]++; });
  const bw=1/bins; const dens=counts.map(c=>c/values.length/bw);
  const ymax=Math.max(1.4, Math.max(...dens)*1.1);
  const X=x=>pad.l+x*(W-pad.l-pad.r), Y=y=>H-pad.b-y/ymax*(H-pad.t-pad.b);
  ctx.strokeStyle=cssVar('--cv-grid'); ctx.fillStyle=cssVar('--cv-tick'); ctx.font='11px JetBrains Mono,monospace';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let i=0;i<=4;i++){ const y=ymax*i/4; ctx.beginPath(); ctx.moveTo(pad.l,Y(y)); ctx.lineTo(W-pad.r,Y(y)); ctx.stroke();
    ctx.fillText(fmt(y),pad.l-5,Y(y)); }
  const col=resolveColor(color);
  dens.forEach((d,i)=>{ const x0=i/bins; ctx.fillStyle=col; ctx.globalAlpha=.75;
    ctx.fillRect(X(x0)+1,Y(d),X(x0+bw)-X(x0)-2,Y(0)-Y(d)); });
  ctx.globalAlpha=1;
  // 均匀参考线 y=1
  ctx.strokeStyle=cssVar('--cv-ref'); ctx.lineWidth=2; ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(pad.l,Y(1)); ctx.lineTo(W-pad.r,Y(1)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle=cssVar('--cv-ref'); ctx.textAlign='left'; ctx.textBaseline='bottom'; ctx.font='11px sans-serif';
  ctx.fillText('Uniform 密度 = 1', pad.l+6, Y(1)-3);
  ctx.fillStyle=cssVar('--cv-tick'); ctx.textAlign='center'; ctx.textBaseline='top';
  for(let i=0;i<=4;i++){ const g=i/4; ctx.fillText(g.toFixed(2),X(g),H-pad.b+5); }
}

/* 时间序列路径 */
function plotTS(cv, values, color, opt){
  opt=opt||{};
  const W=cv.clientWidth||560, H=opt.h||220; const ctx=setupCanvas(cv,W,H);
  const pad={l:48,r:14,t:14,b:28};
  let ymin=Math.min(...values), ymax=Math.max(...values);
  if(opt.zero){ ymin=Math.min(ymin,0); ymax=Math.max(ymax,0); }
  const yr=(ymax-ymin)||1; ymin-=yr*0.08; ymax+=yr*0.08;
  const n=values.length;
  const X=i=>pad.l+i/(n-1)*(W-pad.l-pad.r), Y=v=>H-pad.b-(v-ymin)/(ymax-ymin)*(H-pad.t-pad.b);
  ctx.strokeStyle=cssVar('--cv-grid'); ctx.fillStyle=cssVar('--cv-tick'); ctx.font='11px JetBrains Mono,monospace';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let i=0;i<=4;i++){ const y=ymin+(ymax-ymin)*i/4, py=Y(y);
    ctx.beginPath(); ctx.moveTo(pad.l,py); ctx.lineTo(W-pad.r,py); ctx.stroke(); ctx.fillText(fmt(y),pad.l-5,py); }
  if(ymin<0&&ymax>0){ ctx.strokeStyle='rgba(252,211,77,.5)'; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(pad.l,Y(0)); ctx.lineTo(W-pad.r,Y(0)); ctx.stroke(); ctx.setLineDash([]); }
  ctx.strokeStyle=resolveColor(color); ctx.lineWidth=1.7; ctx.beginPath();
  values.forEach((v,i)=>{ i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v)); }); ctx.stroke();
  ctx.fillStyle=cssVar('--cv-tick'); ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='11px sans-serif';
  ctx.fillText(opt.xlab||'时间 t', pad.l+(W-pad.l-pad.r)/2, H-15);
}

/* 样本 ACF 柱状图（±1.96/√n 置信带） */
function plotACF(cv, r, n){
  const W=cv.clientWidth||560, H=160; const ctx=setupCanvas(cv,W,H);
  const pad={l:48,r:14,t:12,b:24};
  const L=r.length, band=1.96/Math.sqrt(n);
  const m=Math.max(0.3, Math.max(...r.map(Math.abs))*1.15, band*1.3);
  const X=k=>pad.l+(k+0.5)/(L+1)*(W-pad.l-pad.r), Y=v=>H-pad.b-(v+m)/(2*m)*(H-pad.t-pad.b);
  ctx.strokeStyle=cssVar('--cv-grid'); ctx.lineWidth=1;
  [m,0,-m].forEach(v=>{ ctx.beginPath(); ctx.moveTo(pad.l,Y(v)); ctx.lineTo(W-pad.r,Y(v)); ctx.stroke(); });
  ctx.strokeStyle='rgba(252,211,77,.55)'; ctx.setLineDash([5,4]);
  [band,-band].forEach(v=>{ ctx.beginPath(); ctx.moveTo(pad.l,Y(v)); ctx.lineTo(W-pad.r,Y(v)); ctx.stroke(); });
  ctx.setLineDash([]);
  ctx.fillStyle=cssVar('--cv-ref'); ctx.font='10px JetBrains Mono,monospace'; ctx.textAlign='left'; ctx.textBaseline='bottom';
  ctx.fillText('±1.96/√n', pad.l+4, Y(band)-2);
  const bw=Math.max(2,(W-pad.l-pad.r)/(L+1)*0.5);
  r.forEach((v,k)=>{ ctx.fillStyle=Math.abs(v)>band?'#22d3ee':cssVar('--cv-tick');
    const y0=Y(0), yv=Y(v);
    ctx.fillRect(X(k)-bw/2, Math.min(y0,yv), bw, Math.abs(yv-y0)); });
  ctx.fillStyle=cssVar('--cv-tick'); ctx.font='10px JetBrains Mono,monospace'; ctx.textAlign='center'; ctx.textBaseline='top';
  for(let k=1;k<=L;k+=Math.ceil(L/7))ctx.fillText(k,X(k-1),H-pad.b+4);
  ctx.textAlign='right'; ctx.textBaseline='middle';
  [m,0,-m].forEach(v=>ctx.fillText(fmt(v),pad.l-5,Y(v)));
}

/* 通用直方图（任意值域 + 可选竖线标记） */
function plotHistGen(cv, values, bins, color, opt){
  opt=opt||{};
  const W=cv.clientWidth||560, H=opt.h||250; const ctx=setupCanvas(cv,W,H);
  const pad={l:48,r:14,t:16,b:32};
  const sorted=[...values].sort((a,b)=>a-b);
  const xmax=opt.xmax||sorted[Math.min(sorted.length-1,Math.floor(sorted.length*0.997))]||1;
  const bw=xmax/bins, counts=new Array(bins).fill(0);
  values.forEach(v=>{ if(v>xmax)return; let b=Math.floor(v/bw); if(b>=bins)b=bins-1; if(b<0)b=0; counts[b]++; });
  const dens=counts.map(c=>c/values.length/bw);
  const ymax=(Math.max(...dens)*1.12)||1;
  const X=x=>pad.l+x/xmax*(W-pad.l-pad.r), Y=y=>H-pad.b-y/ymax*(H-pad.t-pad.b);
  ctx.strokeStyle=cssVar('--cv-grid'); ctx.fillStyle=cssVar('--cv-tick'); ctx.font='11px JetBrains Mono,monospace';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let i=0;i<=4;i++){ const y=ymax*i/4; ctx.beginPath(); ctx.moveTo(pad.l,Y(y)); ctx.lineTo(W-pad.r,Y(y)); ctx.stroke(); ctx.fillText(fmt(y),pad.l-5,Y(y)); }
  const col=resolveColor(color);
  dens.forEach((d,i)=>{ ctx.fillStyle=col; ctx.globalAlpha=.75;
    ctx.fillRect(X(i*bw)+1, Y(d), X((i+1)*bw)-X(i*bw)-2, Y(0)-Y(d)); });
  ctx.globalAlpha=1;
  (opt.markers||[]).forEach(mk=>{ if(mk.x>xmax)return;
    ctx.strokeStyle=mk.color||'#f87171'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.beginPath(); ctx.moveTo(X(mk.x),pad.t); ctx.lineTo(X(mk.x),H-pad.b); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=mk.color||'#f87171'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.font='11px sans-serif';
    ctx.fillText(mk.label, Math.min(X(mk.x)+4,W-120), pad.t); });
  ctx.fillStyle=cssVar('--cv-tick'); ctx.textAlign='center'; ctx.textBaseline='top';
  for(let i=0;i<=4;i++){ const x=xmax*i/4; ctx.fillText(fmt(x),X(x),H-pad.b+5); }
}

/* 盈余路径群（破产理论） */
function plotPaths(cv, paths, opt){
  opt=opt||{};
  const W=cv.clientWidth||560, H=opt.h||265; const ctx=setupCanvas(cv,W,H);
  const pad={l:48,r:14,t:14,b:28};
  if(!paths.length)return;
  let ymin=0, ymax=0;
  paths.forEach(p=>p.pts.forEach(v=>{ if(v<ymin)ymin=v; if(v>ymax)ymax=v; }));
  ymax=Math.max(ymax,1)*1.05; const yr=(ymax-ymin)||1; ymin-=yr*0.05;
  const T=paths[0].pts.length-1;
  const X=t=>pad.l+t/T*(W-pad.l-pad.r), Y=v=>H-pad.b-(v-ymin)/(ymax-ymin)*(H-pad.t-pad.b);
  ctx.strokeStyle=cssVar('--cv-grid'); ctx.fillStyle=cssVar('--cv-tick'); ctx.font='11px JetBrains Mono,monospace';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let i=0;i<=4;i++){ const y=ymin+(ymax-ymin)*i/4; ctx.beginPath(); ctx.moveTo(pad.l,Y(y)); ctx.lineTo(W-pad.r,Y(y)); ctx.stroke(); ctx.fillText(fmt(y),pad.l-5,Y(y)); }
  ctx.strokeStyle='#f87171'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(pad.l,Y(0)); ctx.lineTo(W-pad.r,Y(0)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#f87171'; ctx.textAlign='left'; ctx.textBaseline='bottom'; ctx.font='11px sans-serif';
  ctx.fillText('U=0 破产线', pad.l+4, Y(0)-3);
  paths.forEach(p=>{ ctx.strokeStyle=p.ruined?'rgba(248,113,113,.8)':'rgba(125,147,181,.32)'; ctx.lineWidth=p.ruined?1.6:1.1;
    ctx.beginPath(); p.pts.forEach((v,t)=>{ t?ctx.lineTo(X(t),Y(v)):ctx.moveTo(X(t),Y(v)); }); ctx.stroke(); });
  ctx.fillStyle=cssVar('--cv-tick'); ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.fillText('时间 t', pad.l+(W-pad.l-pad.r)/2, H-15);
}

/* =====================================================================
   引擎渲染
   ===================================================================== */
const Engine = {
  mount(container, cfg, ctx){
    container.innerHTML='';
    const type=cfg.type;
    if(type==='curve') return this.curve(container,cfg,ctx);
    if(type==='scatter') return this.scatter(container,cfg,ctx);
    if(type==='match') return this.match(container,cfg,ctx);
    if(type==='build') return this.build(container,cfg,ctx);
    if(type==='predict') return this.predict(container,cfg,ctx);
    if(type==='hist') return this.hist(container,cfg,ctx);
    if(type==='aggregate') return this.aggregate(container,cfg,ctx);
    if(type==='tsSim') return this.tsSim(container,cfg,ctx);
    if(type==='compound') return this.compound(container,cfg,ctx);
    if(type==='ruin') return this.ruin(container,cfg,ctx);
    container.innerHTML='<div class="muted">未知引擎类型：'+type+'</div>';
  },

  /* ---------- curve ---------- */
  curve(el,cfg,ctx){
    const P={}; (cfg.params||[]).forEach(p=>P[p.key]=p.val);
    const wrap=document.createElement('div');
    el.appendChild(wrap);
    const shell=document.createElement('div'); shell.className='canvas-shell';
    const cv=document.createElement('canvas'); shell.appendChild(cv); wrap.appendChild(shell);
    const legend=document.createElement('div'); legend.className='canvas-legend';
    cfg.series.forEach(s=>{ legend.innerHTML+='<span><i style="background:'+resolveColor(s.color)+'"></i>'+s.label+'</span>'; });
    wrap.appendChild(legend);
    const readoutBox=document.createElement('div'); readoutBox.className='row mt'; wrap.appendChild(readoutBox);
    const draw=()=>{ const series=cfg.series.map(s=>({color:s.color,width:s.width,fn:x=>FNS[s.fn](x,P)}));
      plotLines(cv,series,{x:cfg.x,N:240,ymin:cfg.ymin,ymax:cfg.ymax});
      readoutBox.innerHTML='';
      (cfg.readouts||[]).forEach(r=>{ const v=FNS[r.fn](P);
        readoutBox.innerHTML+='<span class="pill" style="color:'+resolveColor(ctx.color)+'">'+r.label+' = <b class="mono">'+fmt(v)+'</b></span>'; });
      if(ctx.onState) ctx.onState(P,{});
    };
    draw();
    this._controls(wrap,cfg,P,draw);
    if(cfg.note) this._note(wrap,cfg.note);
  },

  /* ---------- scatter ---------- */
  scatter(el,cfg,ctx){
    const fams=cfg.families||[cfg.family];
    let fam=fams[0]==='selectable'?cfg.families[0]:cfg.family;
    if(cfg.family==='selectable') fam=cfg.families[0];
    const P={}; (cfg.params||[]).forEach(p=>P[p.key]=p.val);
    const famParams={clayton:['theta'],gumbel:['theta'],frank:['theta'],gaussian:['rho'],t:['rho','nu'],indep:[]};
    const famLabel={clayton:'Clayton（下尾）',gumbel:'Gumbel（上尾）',frank:'Frank（无尾）',gaussian:'Gaussian（λ=0）',t:'t（对称厚尾）',indep:'独立'};
    const wrap=document.createElement('div'); el.appendChild(wrap);
    // 家族切换
    if(cfg.family==='selectable'){
      const fb=document.createElement('div'); fb.className='row'; fb.style.marginBottom='12px';
      fams.forEach(f=>{ const b=document.createElement('button'); b.className='btn'+(f===fam?' primary':'');
        b.style.setProperty('--ch',resolveColor(ctx.color)); b.textContent=famLabel[f]||f;
        b.onclick=()=>{ fam=f; [...fb.children].forEach(c=>c.classList.remove('primary')); b.classList.add('primary'); syncParams(); draw(); };
        fb.appendChild(b); });
      wrap.appendChild(fb);
    }
    const shell=document.createElement('div'); shell.className='canvas-shell'; shell.style.maxWidth='340px';
    const cv=document.createElement('canvas'); shell.appendChild(cv); wrap.appendChild(shell);
    const statBox=document.createElement('div'); statBox.className='row mt'; wrap.appendChild(statBox);
    const ctrlWrap=document.createElement('div'); wrap.appendChild(ctrlWrap);
    function syncParams(){
      ctrlWrap.innerHTML='';
      const active=famParams[fam]||[];
      (cfg.params||[]).forEach(p=>{ if(!active.includes(p.key))return;
        ctrlWrap.appendChild(Engine._slider(p,P,draw)); });
    }
    const draw=()=>{ const pts=Cop.sample(fam,P,cfg.n||500); plotScatter(cv,pts,ctx.color);
      const st=Cop.stats(fam,P); statBox.innerHTML='';
      const show=cfg.readouts||['tau'];
      const map={tau:['Kendall τ',st.tau],lambdaL:['λ_L 下尾',st.lambdaL],lambdaU:['λ_U 上尾',st.lambdaU]};
      show.forEach(k=>{ const m=map[k]; if(!m)return;
        statBox.innerHTML+='<span class="pill" style="color:'+resolveColor(ctx.color)+'">'+m[0]+' = <b class="mono">'+(m[1]==null?'—':fmt(m[1]))+'</b></span>'; });
      if(ctx.onState) ctx.onState(P,Object.assign({family:fam},st));
    };
    if(cfg.family==='selectable') syncParams(); else { (cfg.params||[]).forEach(p=>ctrlWrap.appendChild(this._slider(p,P,draw))); }
    draw();
    if(cfg.note) this._note(wrap,cfg.note);
  },

  /* ---------- hist (PIT) ---------- */
  hist(el,cfg,ctx){
    const P={}; if(cfg.param)P[cfg.param.key]=cfg.param.val;
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const shell=document.createElement('div'); shell.className='canvas-shell';
    const cv=document.createElement('canvas'); shell.appendChild(cv); wrap.appendChild(shell);
    const draw=()=>{ const vals=[]; const lam=P[cfg.param?cfg.param.key:'lam']||1;
      for(let i=0;i<cfg.n;i++){ const x=-Math.log(1-Math.random())/lam;
        const u=1-Math.exp(-lam*x); vals.push(u); }
      plotHist(cv,vals,cfg.bins||20,ctx.color);
      if(ctx.onState) ctx.onState(P,{lam:lam}); };
    draw();
    if(cfg.param) wrap.appendChild(this._slider(cfg.param,P,draw));
    if(cfg.note) this._note(wrap,cfg.note);
  },

  /* ---------- aggregate (Monte Carlo VaR) ---------- */
  aggregate(el,cfg,ctx){
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const shell=document.createElement('div'); shell.className='canvas-shell';
    const cv=document.createElement('canvas'); shell.appendChild(cv); wrap.appendChild(shell);
    const box=document.createElement('div'); box.className='row mt'; wrap.appendChild(box);
    const copMap={indep:{fam:'indep',p:{},lab:'独立',col:cssVar('--cv-tick')},
      gaussian:{fam:'gaussian',p:{rho:0.5},lab:'Gaussian ρ=0.5',col:'#60a5fa'},
      gumbel:{fam:'gumbel',p:{theta:3},lab:'Gumbel θ=3',col:'#f87171'}};
    const ps=[0.9,0.95,0.975,0.99,0.995,0.999];
    const run=()=>{
      box.innerHTML='<span class="muted">蒙特卡洛模拟中（'+cfg.n+' 次）…</span>';
      setTimeout(()=>{
        const curves=[]; const varSummary=[];
        cfg.copulas.forEach(key=>{ const c=copMap[key];
          const pts=Cop.sample(c.fam,c.p,cfg.n);
          const S=pts.map(q=>(-Math.log(1-q[0]))+(-Math.log(1-q[1]))).sort((a,b)=>a-b);
          const qs=ps.map(p=>S[Math.min(S.length-1,Math.floor(p*S.length))]);
          curves.push({color:c.col,lab:c.lab,qs});
          varSummary.push({lab:c.lab,col:c.col,v:qs[4]}); // VaR_0.995
        });
        // 绘图
        const W=cv.clientWidth||560,H=300; const c2=setupCanvas(cv,W,H);
        const pad={l:48,r:16,t:16,b:38};
        let ymax=0; curves.forEach(c=>ymax=Math.max(ymax,...c.qs)); ymax*=1.08;
        const X=i=>pad.l+i/(ps.length-1)*(W-pad.l-pad.r);
        const Y=v=>H-pad.b-v/ymax*(H-pad.t-pad.b);
        c2.strokeStyle=cssVar('--cv-grid'); c2.fillStyle=cssVar('--cv-tick'); c2.font='11px JetBrains Mono,monospace';
        c2.textAlign='right'; c2.textBaseline='middle';
        for(let i=0;i<=4;i++){ const y=ymax*i/4; c2.beginPath(); c2.moveTo(pad.l,Y(y)); c2.lineTo(W-pad.r,Y(y)); c2.stroke(); c2.fillText(fmt(y),pad.l-5,Y(y)); }
        c2.textAlign='center'; c2.textBaseline='top';
        ps.forEach((p,i)=>c2.fillText(p.toString(),X(i),H-pad.b+6));
        curves.forEach(c=>{ c2.strokeStyle=resolveColor(c.color); c2.lineWidth=2.5; c2.beginPath();
          c.qs.forEach((v,i)=>{ i?c2.lineTo(X(i),Y(v)):c2.moveTo(X(i),Y(v)); }); c2.stroke();
          c2.fillStyle=resolveColor(c.color); c.qs.forEach((v,i)=>{ c2.beginPath(); c2.arc(X(i),Y(v),3,0,7); c2.fill(); }); });
        c2.fillStyle=cssVar('--cv-axis'); c2.font='12px sans-serif'; c2.fillText('分位 p →',pad.l+(W-pad.l-pad.r)/2,H-16);
        // 图例 + VaR_0.995
        box.innerHTML='';
        curves.forEach(c=>{ box.innerHTML+='<span class="pill"><i style="width:11px;height:11px;border-radius:3px;background:'+resolveColor(c.color)+';display:inline-block"></i>'+c.lab+'</span>'; });
        box.innerHTML+='<span class="spacer"></span>';
        varSummary.sort((a,b)=>b.v-a.v).forEach(s=>{ box.innerHTML+='<span class="pill" style="color:'+resolveColor(s.col)+'">VaR₀.₉₉₅ '+s.lab.split(' ')[0]+' = <b class="mono">'+fmt(s.v)+'</b></span>'; });
      },30);
    };
    run();
    const rb=document.createElement('button'); rb.className='btn ghost mt'; rb.textContent='🔄 重新模拟'; rb.onclick=run; wrap.appendChild(rb);
    if(cfg.note) this._note(wrap,cfg.note);
  },

  /* ---------- tsSim (时间序列模拟 + 样本 ACF) ---------- */
  tsSim(el,cfg,ctx){
    const P={}; (cfg.params||[]).forEach(p=>P[p.key]=p.val);
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const N=cfg.n||160, BURN=100, LAGS=cfg.lags||14;
    const lab1=document.createElement('div'); lab1.style.cssText='font-size:12px;color:var(--muted2);margin-bottom:4px';
    lab1.textContent='▍模拟序列（n='+N+'）'; wrap.appendChild(lab1);
    const shell1=document.createElement('div'); shell1.className='canvas-shell';
    const cv1=document.createElement('canvas'); shell1.appendChild(cv1); wrap.appendChild(shell1);
    const lab2=document.createElement('div'); lab2.style.cssText='font-size:12px;color:var(--muted2);margin:10px 0 4px';
    lab2.textContent='▍样本自相关 ACF（青色＝超出 95% 置信带）'; wrap.appendChild(lab2);
    const shell2=document.createElement('div'); shell2.className='canvas-shell';
    const cv2=document.createElement('canvas'); shell2.appendChild(cv2); wrap.appendChild(shell2);
    function simulate(){
      const e=[]; for(let i=0;i<N+BURN;i++)e.push(M.randn());
      const x=[];
      if(cfg.model==='rw'){ let s=0; for(let i=0;i<N+BURN;i++){ s+=e[i]; x.push(s); } }
      else if(cfg.model==='ma1'){ for(let i=0;i<N+BURN;i++)x.push(e[i]+P.theta*(i?e[i-1]:0)); }
      else if(cfg.model==='ar2'){ let p1=0,p2=0; for(let i=0;i<N+BURN;i++){ const v=P.phi1*p1+P.phi2*p2+e[i]; x.push(v); p2=p1; p1=v; } }
      else if(cfg.model==='arma11'){ let p=0,ep=0; for(let i=0;i<N+BURN;i++){ p=P.phi*p+e[i]+P.theta*ep; ep=e[i]; x.push(p); } }
      else { let p=0; for(let i=0;i<N+BURN;i++){ p=P.phi*p+e[i]; x.push(p); } } // ar1 默认
      return x.slice(BURN);
    }
    function acf(x){
      const n=x.length, m=x.reduce((a,b)=>a+b,0)/n;
      const c0=x.reduce((a,v)=>a+(v-m)*(v-m),0)||1;
      const r=[];
      for(let k=1;k<=LAGS;k++){ let s=0; for(let i=0;i<n-k;i++)s+=(x[i]-m)*(x[i+k]-m); r.push(s/c0); }
      return r;
    }
    const draw=()=>{ const x=simulate(), r=acf(x);
      plotTS(cv1,x,ctx.color,{zero:true});
      plotACF(cv2,r,N);
      if(ctx.onState)ctx.onState(P,{acf:r}); };
    draw();
    this._controls(wrap,cfg,P,draw);
    if(cfg.note) this._note(wrap,cfg.note);
  },

  /* ---------- compound (频度-强度复合分布 MC) ---------- */
  compound(el,cfg,ctx){
    const P={}; (cfg.params||[]).forEach(p=>P[p.key]=p.val);
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const shell=document.createElement('div'); shell.className='canvas-shell';
    const cv=document.createElement('canvas'); shell.appendChild(cv); wrap.appendChild(shell);
    const box=document.createElement('div'); box.className='row mt'; wrap.appendChild(box);
    const NSIM=cfg.n||2000;
    function sev(){
      if(cfg.sev==='gamma')return P.mean*M.gammaVar(P.alpha)/P.alpha;
      if(cfg.sev==='pareto'){ const u=Math.random(); return P.xm*Math.pow(1-u,-1/P.alpha); }
      return -Math.log(1-Math.random())*P.mean;
    }
    function freq(){
      if(cfg.freq==='nb'){ const g=M.gammaVar(P.r)*(1-P.p)/P.p; return M.poisson(g); }
      return M.poisson(P.lambda);
    }
    const draw=()=>{
      const S=[]; let nSum=0;
      for(let i=0;i<NSIM;i++){ const n=freq(); nSum+=n; let s=0; for(let j=0;j<n;j++)s+=sev(); S.push(s); }
      S.sort((a,b)=>a-b);
      const mean=S.reduce((a,b)=>a+b,0)/NSIM;
      const vaq=S[Math.min(S.length-1,Math.floor(0.995*NSIM))];
      let EX=null;
      if(cfg.sev==='pareto'){ if(P.alpha>1)EX=P.alpha*P.xm/(P.alpha-1); } else EX=P.mean;
      const EN=(cfg.freq==='nb')?P.r*(1-P.p)/P.p:P.lambda;
      const thE=(EX!=null)?EN*EX:null;
      plotHistGen(cv,S,cfg.bins||40,ctx.color,{markers:[{x:mean,label:'E[S]≈'+fmt(mean),color:cssVar('--cv-ref')},{x:vaq,label:'VaR₀.₉₉₅≈'+fmt(vaq),color:'#f87171'}]});
      box.innerHTML='';
      if(thE!=null)box.innerHTML+='<span class="pill" style="color:'+resolveColor(ctx.color)+'">理论 E[S]=E[N]·E[X]=<b class="mono">'+fmt(thE)+'</b></span>';
      box.innerHTML+='<span class="pill">模拟均值 <b class="mono">'+fmt(mean)+'</b></span>';
      box.innerHTML+='<span class="pill" style="color:#f87171">VaR₀.₉₉₅ <b class="mono">'+fmt(vaq)+'</b></span>';
      box.innerHTML+='<span class="pill">平均索赔次数 <b class="mono">'+(nSum/NSIM).toFixed(2)+'</b></span>';
      if(ctx.onState)ctx.onState(P,{mean,vaq,thE,EN}); };
    draw();
    this._controls(wrap,cfg,P,draw);
    if(cfg.note) this._note(wrap,cfg.note);
  },

  /* ---------- ruin (Cramér-Lundberg 盈余路径) ---------- */
  ruin(el,cfg,ctx){
    const P={}; (cfg.params||[]).forEach(p=>P[p.key]=p.val);
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const shell=document.createElement('div'); shell.className='canvas-shell';
    const cv=document.createElement('canvas'); shell.appendChild(cv); wrap.appendChild(shell);
    const box=document.createElement('div'); box.className='row mt'; wrap.appendChild(box);
    const T=cfg.T||25, NPATH=cfg.n||500;
    const draw=()=>{
      const shown=[],ru=[]; let ruined=0;
      for(let i=0;i<NPATH;i++){
        const pts=[P.u]; let u=P.u, hit=false;
        for(let t=1;t<=T;t++){
          const n=M.poisson(P.lambda); let cl=0;
          for(let j=0;j<n;j++)cl+=-Math.log(1-Math.random())*P.mean;
          u=u+P.c-cl; pts.push(u);
          if(u<0)hit=true;
        }
        if(hit){ ruined++; if(ru.length<8)ru.push({pts,ruined:true}); }
        else if(shown.length<22)shown.push({pts,ruined:false});
      }
      plotPaths(cv,shown.concat(ru),{});
      const psi=ruined/NPATH, theta=P.c/(P.lambda*P.mean)-1;
      box.innerHTML='<span class="pill" style="color:#f87171">破产概率 ψ̂(u)=<b class="mono">'+(psi*100).toFixed(1)+'%</b></span>'
        +'<span class="pill">安全附加 θ=<b class="mono">'+(theta*100).toFixed(0)+'%</b></span>'
        +'<span class="pill" style="color:var(--muted2)">红色＝破产路径（'+ru.length+'/'+NPATH+'）</span>';
      if(ctx.onState)ctx.onState(P,{psi,theta}); };
    draw();
    const rb=document.createElement('button'); rb.className='btn ghost mt'; rb.textContent='🔄 重新模拟'; rb.onclick=draw; wrap.appendChild(rb);
    this._controls(wrap,cfg,P,draw);
    if(cfg.note) this._note(wrap,cfg.note);
  },

  /* ---------- match (拖拽配对) ---------- */
  match(el,cfg,ctx){
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const pairs=cfg.pairs; const rights=pairs.map((p,i)=>({txt:p.r,i}));
    // 打乱右侧
    for(let i=rights.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [rights[i],rights[j]]=[rights[j],rights[i]]; }
    const board=document.createElement('div'); board.className='match-board';
    const left=document.createElement('div'); left.className='match-col';
    const right=document.createElement('div'); right.className='match-col';
    left.innerHTML='<div class="col-h">概念</div>'; right.innerHTML='<div class="col-h">拖到左侧对应位置 →</div>';
    let dragTxt=null;
    pairs.forEach((p,i)=>{
      const slot=document.createElement('div'); slot.className='match-slot'; slot.dataset.i=i;
      slot.innerHTML='<span style="color:var(--muted);font-size:13px">'+p.l+'</span><span class="drop-hint" style="margin-left:auto;color:var(--muted2);font-size:12px">放置处</span>';
      slot.ondragover=e=>{e.preventDefault();slot.classList.add('over');};
      slot.ondragleave=()=>slot.classList.remove('over');
      slot.ondrop=e=>{ e.preventDefault(); slot.classList.remove('over');
        if(slot.classList.contains('correct'))return;
        const txt=dragTxt; if(txt==null)return;
        const matched=rights.find(r=>r.txt===txt);
        slot.querySelector('.drop-hint')?.remove();
        const old=slot.querySelector('.match-item'); if(old)old.remove();
        const it=document.createElement('div'); it.className='match-item'; it.style.margin='0'; it.innerHTML=txt;
        slot.appendChild(it); slot.classList.add('filled');
        if(matched.i===i){ slot.classList.add('correct'); slot.classList.remove('wrong'); it.draggable=false; it.style.cursor='default';
          it.remove(); slot.innerHTML='<span style="color:var(--good);font-weight:600">✓ '+txt+'</span>';
          // 移除右侧已用项
          const rc=[...right.querySelectorAll('.match-item')].find(x=>x.dataset.raw===txt); if(rc)rc.remove();
          checkDone();
        } else { slot.classList.add('wrong'); setTimeout(()=>{ slot.classList.remove('wrong'); it.remove();
          slot.innerHTML='<span style="color:var(--muted);font-size:13px">'+p.l+'</span><span class="drop-hint" style="margin-left:auto;color:var(--muted2);font-size:12px">放置处</span>'; },700); }
      };
      left.appendChild(slot);
    });
    rights.forEach(r=>{ const it=document.createElement('div'); it.className='match-item'; it.dataset.raw=r.txt; it.innerHTML=r.txt; it.draggable=true;
      it.ondragstart=()=>{ dragTxt=r.txt; it.classList.add('dragging'); };
      it.ondragend=()=>it.classList.remove('dragging');
      right.appendChild(it); });
    board.appendChild(left); board.appendChild(right); wrap.appendChild(board);
    const msg=document.createElement('div'); msg.className='why hide'; wrap.appendChild(msg);
    function checkDone(){ if(left.querySelectorAll('.correct').length===pairs.length){
      msg.classList.remove('hide'); msg.innerHTML='<b>🎉 全部配对正确！</b> 概念网络已建立。';
      if(window.Game)Game.awardXP(15,'配对通关'); } }
  },

  /* ---------- build (公式拼装) ---------- */
  build(el,cfg,ctx){
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const prompt=document.createElement('div'); prompt.className='muted'; prompt.style.marginBottom='6px'; prompt.innerHTML=cfg.prompt; wrap.appendChild(prompt);
    const hint=document.createElement('div'); hint.style.cssText='font-size:12px;color:var(--muted2);margin-bottom:10px'; hint.innerHTML='💡 拖入按顺序排列 · <b style="color:var(--ch17)">点击已放入的积木可取回重排</b>'; wrap.appendChild(hint);
    const zone=document.createElement('div'); zone.className='build-zone';
    zone.innerHTML='<span class="placeholder" style="color:var(--muted2);font-size:13px">把积木拖到这里，按正确顺序排列…</span>';
    wrap.appendChild(zone);
    const bank=document.createElement('div'); bank.className='token-bank'; wrap.appendChild(bank);
    const placed=[];
    // 打乱 bank
    const items=[...cfg.bank]; for(let i=items.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [items[i],items[j]]=[items[j],items[i]]; }
    let dragTok=null;
    function makeToken(txt,fromZone){ const t=document.createElement('span'); t.className='token'; t.dataset.raw=txt; t.innerHTML=txt; t.draggable=true;
      t.ondragstart=e=>{ dragTok={txt,fromZone}; e.dataTransfer.effectAllowed='move'; };
      return t; }
    items.forEach(txt=>bank.appendChild(makeToken(txt,false)));
    zone.ondragover=e=>{e.preventDefault();zone.classList.add('over');};
    zone.ondragleave=()=>zone.classList.remove('over');
    zone.ondrop=e=>{ e.preventDefault(); zone.classList.remove('over');
      if(!dragTok)return; const {txt,fromZone}=dragTok; dragTok=null;
      zone.querySelector('.placeholder')?.remove();
      if(fromZone)return; // 已在区内（简化：不支持区内重排）
      const src=[...bank.querySelectorAll('.token')].find(x=>x.dataset.raw===txt&&!x.classList.contains('placed'));
      if(src){ src.remove(); }
      const t=makeToken(txt,true); t.classList.add('placed'); t.title='点击取回';
      t.onclick=()=>{ t.remove(); bank.appendChild(makeToken(txt,false)); refreshPlaced();
        if(!zone.querySelector('.token'))zone.innerHTML='<span class="placeholder" style="color:var(--muted2);font-size:13px">把积木拖到这里，按正确顺序排列…</span>'; };
      zone.appendChild(t); refreshPlaced(); };
    function refreshPlaced(){ /* placed 由 DOM 顺序重建 */ placed.length=0;
      zone.querySelectorAll('.token').forEach(t=>placed.push(t.dataset.raw)); }
    const check=document.createElement('button'); check.className='btn primary mt'; check.textContent='✓ 检查答案'; wrap.appendChild(check);
    const msg=document.createElement('div'); msg.className='why hide'; wrap.appendChild(msg);
    check.onclick=()=>{ refreshPlaced();
      const ok=placed.length===cfg.answer.length && placed.every((t,i)=>t===cfg.answer[i]);
      msg.classList.remove('hide');
      if(ok){ msg.style.borderLeftColor='var(--good)'; msg.innerHTML='<b>✅ '+cfg.success+'</b>';
        if(window.Game)Game.awardXP(20,'公式拼装'); check.disabled=true; }
      else { msg.style.borderLeftColor='var(--bad)'; msg.innerHTML='❌ '+cfg.fail; } };
  },

  /* ---------- predict (预测下注) ---------- */
  predict(el,cfg,ctx){
    const wrap=document.createElement('div'); el.appendChild(wrap);
    const sc=document.createElement('div'); sc.className='hook'; sc.style.margin='0 0 14px';
    sc.innerHTML='<span class="ic">🎲</span><span class="txt">'+cfg.scenario+'</span>'; wrap.appendChild(sc);
    const grid=document.createElement('div'); grid.className='bet-grid'; wrap.appendChild(grid);
    const reveal=document.createElement('div'); reveal.className='why hide'; wrap.appendChild(reveal);
    let picked=false;
    cfg.options.forEach((o,i)=>{ const b=document.createElement('div'); b.className='bet-opt';
      b.innerHTML='<span class="big">'+o.icon+'</span>'+o.label+'<span class="mini">'+o.mini+'</span>';
      b.onclick=()=>{ if(picked)return; picked=true;
        grid.querySelectorAll('.bet-opt').forEach(x=>x.classList.remove('picked'));
        b.classList.add('picked');
        setTimeout(()=>{ cfg.options.forEach((oo,j)=>{ const el2=grid.children[j];
          if(oo.correct)el2.classList.add('right'); else if(el2.classList.contains('picked'))el2.classList.add('wrongpick'); });
          reveal.classList.remove('hide');
          if(o.correct){ reveal.style.borderLeftColor='var(--good)'; reveal.innerHTML='<b>🎯 押对了！</b> '+cfg.reveal;
            if(window.Game)Game.awardXP(15,'预测命中'); }
          else { reveal.style.borderLeftColor='var(--bad)'; reveal.innerHTML='<b>差一点。</b> '+cfg.reveal; }
        },350);
      };
      grid.appendChild(b); });
  },

  /* ---------- 公共控件 ---------- */
  _controls(wrap,cfg,P,draw){
    (cfg.params||[]).forEach(p=>{
      if(p.type==='select'){
        const row=document.createElement('div'); row.className='slider-row';
        row.innerHTML='<label>'+p.label+'</label>';
        const sel=document.createElement('select'); sel.className='btn'; sel.style.padding='6px 12px';
        p.options.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; if(o===P[p.key])op.selected=true; sel.appendChild(op); });
        sel.onchange=()=>{ P[p.key]=sel.value; draw(); };
        row.appendChild(sel); wrap.appendChild(row);
      } else {
        wrap.appendChild(this._slider(p,P,draw));
      }
    });
  },
  _slider(p,P,draw){
    const row=document.createElement('div'); row.className='slider-row';
    const lab=document.createElement('label'); lab.textContent=p.label;
    const inp=document.createElement('input'); inp.type='range'; inp.min=p.min; inp.max=p.max; inp.step=p.step; inp.value=P[p.key];
    const ro=document.createElement('span'); ro.className='readout'; ro.textContent=(+P[p.key]).toFixed(2);
    const upd=()=>{ const pct=(inp.value-p.min)/(p.max-p.min)*100; inp.style.setProperty('--fill',pct+'%'); };
    upd();
    inp.oninput=()=>{ P[p.key]=parseFloat(inp.value); ro.textContent=(+inp.value).toFixed(2); upd(); draw(); };
    row.appendChild(lab); row.appendChild(inp); row.appendChild(ro);
    return row;
  },
  _note(wrap,html){ const n=document.createElement('div'); n.className='why'; n.style.marginTop='14px'; n.style.borderLeftColor='var(--gold)';
    n.innerHTML='<b>💡 观察要点</b><br>'+html; wrap.appendChild(n); }
};

window.Engine=Engine; window._Cop=Cop; window._M=M;
})();
