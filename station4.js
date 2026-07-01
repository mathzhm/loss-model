/* ============================================================
 * station4.js — 站4「Copula 家族图鉴」交互逻辑
 * 依赖 copula-core.js (window.CopulaCore)
 * 含：家族名片 + 散点三层联动 + 3关闯关 + 错题本/SM-2 + AI学伴双路径
 * 受众：大三精算学生；案例全部精算业务化
 * ============================================================ */
const CC = window.CopulaCore;
const C = CC.Copulas;

/* ---------- 家族数据（精算业务化讲解，按课件三分类） ---------- */
const FAMILIES = {
  independent: {
    cat:'基础', tailName:'无尾', tailCls:'none',
    ctx:'两块业务互不相干', ctxColor:'#95a5a6',
    params:null, def:{},
    intuition:'<b>独立 copula</b>：散点均匀铺满整个 [0,1]²，没有任何"角落抱团"。两块业务的索赔完全各过各的——这是你做"独立假设"定价时隐含的依赖结构，也是巨灾联动的<b>反面教材</b>。',
    mech:'参数：无。τ=0，λ_L=λ_U=0。它是一切 copula 的基准参照——当你说"假设两区索赔独立"，用的就是它。<br><b>业务警示</b>：真实巨灾下，独立假设会让你严重低估联合大额索赔。',
    math:'$$C_\\perp(u,v)=uv,\\quad \\tau=0,\\ \\lambda_L=\\lambda_U=0$$',
    rcode:'library(copula)\ncop <- indepCopula(dim = 2)\nU   <- rCopula(2000, cop)\nplot(U)'
  },
  gaussian: {
    cat:'隐式·椭圆', tailName:'无尾', tailCls:'none',
    ctx:'常态相关·但低估巨灾年联合损失（定价陷阱）', ctxColor:'#7f8c8d',
    params:[{key:'rho',label:'相关系数 ρ',min:-0.9,max:0.9,step:0.05,def:0.5}],
    def:{rho:0.5},
    intuition:'<b>Gaussian copula</b>：椭圆形点云，正相关时沿对角线拉长。但请看角落——即使 ρ 很大，<b>左下/右上都不会"抱团"</b>。这是它最危险的特点：<b>看着相关，极端时却各自逃命</b>。',
    mech:'参数 ρ→整体相关。但 <b>|ρ|<1 时 λ_L=λ_U=0</b>：极端共同发生的概率趋近于 0。<br><b>业务警示</b>：信用风险建模历史上常用 Gaussian copula，2008 年它因<b>低估联合违约</b>而声名狼藉——这正是它"无尾"的代价。',
    math:'$$C^{Gauss}_\\rho(u,v)=\\Phi_\\rho(\\Phi^{-1}u,\\Phi^{-1}v)$$$$\\tau=\\tfrac{2}{\\pi}\\arcsin\\rho,\\quad \\lambda_L=\\lambda_U=0\\ (|\\rho|<1)$$',
    rcode:'library(copula)\ncop <- normalCopula(param = 0.5, dim = 2)\nU   <- rCopula(2000, cop)\ntau(cop)        # Kendall τ\nlambda(cop)     # 上下尾依赖(=0)'
  },
  t: {
    cat:'隐式·椭圆', tailName:'对称双尾', tailCls:'both',
    ctx:'对称厚尾·多险种在极端年同时恶化', ctxColor:'#8e44ad',
    params:[
      {key:'rho',label:'相关系数 ρ',min:-0.9,max:0.9,step:0.05,def:0.5},
      {key:'nu',label:'自由度 ν（越小尾越厚）',min:2,max:30,step:1,def:4}
    ],
    def:{rho:0.5,nu:4},
    intuition:'<b>t-copula</b>：像 Gaussian，但<b>左下和右上同时抱团</b>。ν 越小，两个角落越密——极端事件（无论同涨同跌）的联合发生概率越高。这是<b>对称的厚尾</b>。',
    mech:'参数 ρ→相关，ν→尾部厚度。<b>ν↓ ⇒ λ_L=λ_U↑</b>（对称）。ν→∞ 时退化为 Gaussian。<br><b>业务场景</b>：车险+健康险在极端年份<b>同时</b>恶化；多个再保合约在大事件下同时触发。t-copula 能更合理地为这种"双尾联动"定价、估 VaR/ES。',
    math:'$$C^{t}_{\\rho,\\nu}(u,v)=t_{\\rho,\\nu}(t_\\nu^{-1}u,t_\\nu^{-1}v)$$$$\\lambda_L=\\lambda_U=2\\,t_{\\nu+1}\\!\\Big(\\!-\\sqrt{\\tfrac{(\\nu+1)(1-\\rho)}{1+\\rho}}\\Big)$$',
    rcode:'library(copula)\ncop <- tCopula(param = 0.5, dim = 2, df = 4)\nU   <- rCopula(2000, cop)\nlambda(cop)     # 上下尾对称 > 0'
  },
  clayton: {
    cat:'显式·Archimedean', tailName:'下尾', tailCls:'lower',
    ctx:'衰退期多个债务人同时违约（信用险下尾）', ctxColor:'#2980b9',
    params:[{key:'theta',label:'参数 θ',min:0.2,max:8,step:0.1,def:2}],
    def:{theta:2},
    intuition:'<b>Clayton copula</b>：点子在<b>左下角 (0,0) 抱成一团</b>，越往左下越"粘"。含义：当 X 很小，Y 也极可能很小——<b>共同的坏结果联动很强</b>。',
    mech:'参数 θ 通过 <b>τ=θ/(θ+2)</b> 决定整体一致性，通过 <b>λ_L=2^(−1/θ)</b> 决定下尾粘性。θ↑ ⇒ 下尾依赖↑。而 <b>λ_U=0</b>：Clayton 只管"共同变坏"，不管"共同变好"。<br><b>业务场景</b>：信用险中<b>经济衰退期多个债务人同时违约</b>；供应链同时中断。',
    math:'$$C^{Clayton}_\\theta(u,v)=(u^{-\\theta}+v^{-\\theta}-1)^{-1/\\theta}$$$$\\tau=\\tfrac{\\theta}{\\theta+2},\\ \\lambda_L=2^{-1/\\theta},\\ \\lambda_U=0$$',
    rcode:'library(copula)\ncop <- claytonCopula(param = 2)\nU   <- rCopula(2000, cop)\nlambda(cop)     # 仅下尾 λ_L > 0'
  },
  gumbel: {
    cat:'显式·Archimedean', tailName:'上尾', tailCls:'upper',
    ctx:'巨灾致多张保单同时大额索赔（巨灾再保上尾）', ctxColor:'#e74c3c',
    params:[{key:'theta',label:'参数 θ（≥1）',min:1,max:8,step:0.1,def:2}],
    def:{theta:2},
    intuition:'<b>Gumbel copula</b>：点子在<b>右上角 (1,1) 抱成一团</b>，越往右上越"粘"。含义：当 X 很大，Y 也极可能很大——<b>共同的极端大值联动很强</b>。这正是你做巨灾再保时最关心的尾巴。',
    mech:'参数 θ 通过 <b>τ=1−1/θ</b> 决定一致性，通过 <b>λ_U=2−2^(1/θ)</b> 决定上尾粘性。θ↑ ⇒ 上尾依赖↑。而 <b>λ_L=0</b>：Gumbel 只管"共同变大"。<br><b>业务场景</b>：飓风/地震使<b>多张保单同时产生大额赔付</b>；巨灾再保定价、尾部聚合损失。',
    math:'$$C^{Gumbel}_\\theta(u,v)=\\exp\\{-[(-\\ln u)^\\theta+(-\\ln v)^\\theta]^{1/\\theta}\\}$$$$\\tau=1-\\tfrac1\\theta,\\ \\lambda_U=2-2^{1/\\theta},\\ \\lambda_L=0$$',
    rcode:'library(copula)\ncop <- gumbelCopula(param = 2)\nU   <- rCopula(2000, cop)\nlambda(cop)     # 仅上尾 λ_U > 0'
  },
  frank: {
    cat:'显式·Archimedean', tailName:'无尾', tailCls:'none',
    ctx:'温和相关·两端不粘（如年龄×慢病发生率）', ctxColor:'#95a5a6',
    params:[{key:'theta',label:'参数 θ（可正可负）',min:-15,max:15,step:0.5,def:5}],
    def:{theta:5},
    intuition:'<b>Frank copula</b>：整体相关明显（θ>0 正、θ<0 负），但<b>两端角落都不抱团</b>——对称、无尾部依赖。中段相关强，尾部却"松手"。',
    mech:'参数 θ：θ>0 正相关、θ<0 负相关、θ→0 独立。<b>λ_L=λ_U=0</b>。它能建模<b>正/负相关</b>但不刻画极端联动。<br><b>业务场景</b>：温和相关、且不需要尾部联动的风险因子，例如投保人<b>年龄</b>与某<b>慢性病发生率</b>的温和关联。',
    math:'$$C^{Frank}_\\theta(u,v)=-\\tfrac1\\theta\\ln\\!\\Big(1+\\tfrac{(e^{-\\theta u}-1)(e^{-\\theta v}-1)}{e^{-\\theta}-1}\\Big)$$$$\\lambda_L=\\lambda_U=0$$',
    rcode:'library(copula)\ncop <- frankCopula(param = 5)\nU   <- rCopula(2000, cop)\nlambda(cop)     # 两端均为 0'
  }
};
const ORDER = ['independent','gaussian','t','clayton','gumbel','frank'];
const CAT_ORDER = ['基础','隐式·椭圆','显式·Archimedean'];

/* ---------- 状态 ---------- */
let state = { fam:'gaussian', params:{}, m:2000, data:[], lastKpi:null };
let level = 1, unlocked = {1:true,2:false,3:false};

/* ============================================================
 *  题库（每关 3 题，按知识点 KP 组织）
 *  每题: {q, opts, correct, kp, mech, okMsg, sim?(仅第3关后果动画)}
 * ============================================================ */
// optFam：每个选项对应的 copula 族 id（用于答题↔可视化联动；null 表示无对应族，如"独立假设"用 independent）
const QUIZ = {
  1: [ // 第1关 · 认尾巴（识别尾部归属）
    { q:'下面哪一族<b>只有下尾依赖</b>（左下角抱团、右上不抱团）？',
      opts:['Gumbel','Clayton','t-Copula'], optFam:['gumbel','clayton','t'],
      correct:'Clayton', kp:'KP-17-4-2',
      mech:'Clayton 仅下尾 λ_L=2^(−1/θ)>0、λ_U=0；Gumbel 反之只有上尾；t 是对称双尾。',
      okMsg:'认对了！Clayton 的"左下抱团"对应信用险里的同时违约。' },
    { q:'巨灾再保最关心"同时发生大额索赔"。下面哪一族<b>只有上尾依赖</b>（右上角抱团）？',
      opts:['Clayton','Frank','Gumbel'], optFam:['clayton','frank','gumbel'],
      correct:'Gumbel', kp:'KP-17-4-2',
      mech:'Gumbel 仅上尾 λ_U=2−2^(1/θ)>0、λ_L=0；Clayton 只有下尾；Frank 两端都不抱团。',
      okMsg:'正解！右上抱团 = 上尾 = Gumbel，巨灾联动定价的首选。' },
    { q:'哪一族即使相关系数 ρ 很大，<b>两个角落仍都不抱团</b>（λ_L=λ_U=0）？',
      opts:['Gaussian','Clayton','Gumbel'], optFam:['gaussian','clayton','gumbel'],
      correct:'Gaussian', kp:'KP-17-4-1',
      mech:'Gaussian 在 |ρ|<1 时 λ_L=λ_U=0——看着相关，极端时各自逃命，这正是它低估巨灾的根源。',
      okMsg:'对！Gaussian"无尾"，是 2008 年信用模型栽跟头的关键。' }
  ],
  2: [ // 第2关 · 配业务（场景→copula）
    { q:'信用险组合，担心<b>经济衰退期多个债务人同时违约</b>（共同坏结果强联动，好结果不联动）。最该用？',
      opts:['Gumbel（上尾）','Clayton（下尾）','Gaussian（无尾）'], optFam:['gumbel','clayton','gaussian'],
      correct:'Clayton（下尾）', kp:'KP-17-4-3',
      mech:'同时违约=共同走向坏结果=下尾抱团→Clayton。Gumbel 是上尾，Gaussian 无尾会低估联合违约。',
      okMsg:'正解！下尾联动 → Clayton，信用风险建模的经典选择。' },
    { q:'地震巨灾使<b>多张财产保单同时产生大额赔付</b>（只在极端大值处一起爆发）。最该用？',
      opts:['Clayton（下尾）','Gumbel（上尾）','Frank（无尾）'], optFam:['clayton','gumbel','frank'],
      correct:'Gumbel（上尾）', kp:'KP-17-4-5',
      mech:'同时大额索赔=共同极端大值=上尾抱团→Gumbel。Clayton 管的是下尾，Frank 无尾。',
      okMsg:'对！上尾联动 → Gumbel，巨灾再保定价的标配。' },
    { q:'车险与健康险在<b>极端年份同时恶化、平静年份也可能同时变好</b>（双向极端都联动）。最该用？',
      opts:['Gaussian（无尾）','Clayton（仅下尾）','t（对称双尾）'], optFam:['gaussian','clayton','t'],
      correct:'t（对称双尾）', kp:'KP-17-4-4',
      mech:'双向极端都联动=对称厚尾→t-copula（λ_L=λ_U>0）。ν 越小尾越厚。Gaussian 无尾、Clayton 只管下尾。',
      okMsg:'正解！双尾联动 → t-copula，多险种极端年同向波动的合理刻画。' }
  ],
  3: [ // 第3关 · 做决策（含后果动画 sim:true 触发准备金击穿/覆盖）
    { q:'你管 A、B 两区<b>房屋财产险</b>：平时相关低，但<b>巨灾年两区同时爆发大额索赔</b>。为计提准备金选哪个 copula？',
      opts:['Gaussian（无尾，简单）','独立假设（最省事）','Gumbel / t（强上尾）'], optFam:['gaussian','independent','gumbel'],
      correct:'Gumbel / t（强上尾）', kp:'KP-17-4-5',
      mech:'巨灾"同时大额索赔"=上尾联动。Gaussian/独立都低估尾部 → 准备金不足、被击穿。', okMsg:'', sim:true },
    { q:'若你坚持用<b>独立假设</b>为上面这个强上尾巨灾组合计提准备金，最可能的后果是？',
      opts:['准备金恰好充足','系统性低估联合损失、准备金被击穿','高估损失、占用过多资本'], optFam:['independent','independent','t'],
      correct:'系统性低估联合损失、准备金被击穿', kp:'KP-17-4-1',
      mech:'独立假设令 λ=0，抹掉了尾部联动 → 低估巨灾年联合损失 → 准备金不足。', okMsg:'判断准确——这正是开场飓风故事的悲剧根源。', sim:true },
    { q:'同样的两区组合，若改用 <b>t-copula 且把自由度 ν 调小</b>，对尾部风险刻画的影响是？',
      opts:['尾部更厚、更保守，准备金更充足','尾部更薄、更激进','与 Gaussian 完全等价'], optFam:['t','gaussian','gaussian'],
      correct:'尾部更厚、更保守，准备金更充足', kp:'KP-17-4-4',
      mech:'t-copula ν↓ ⇒ λ_L=λ_U↑（尾更厚），对极端联动更敏感 → 计提更保守。ν→∞ 才退化为 Gaussian。', okMsg:'对！ν 小=尾厚=保守，稳健定价的关键旋钮。', sim:true }
  ]
};
// 每关进度：已答对的题号集合
let quizProgress = {1:new Set(),2:new Set(),3:new Set()};
let curQ = {1:0,2:0,3:0}; // 各关当前题目索引
const PASS_NEED = 2; // 每关至少答对几题才解锁下一关

/* ============================================================
 *  渲染：家族名片
 * ============================================================ */
/* 家族选择器：细长下拉菜单（按分类分组），右侧显示当前族尾部徽章 */
function renderCards(){
  const box = document.getElementById('cards');
  let opts = '';
  CAT_ORDER.forEach(cat=>{
    opts += `<optgroup label="${cat}">`;
    ORDER.filter(id=>FAMILIES[id].cat===cat).forEach(id=>{
      const f=FAMILIES[id];
      opts += `<option value="${id}"${state.fam===id?' selected':''}>${C[id].label}（${f.tailName}）</option>`;
    });
    opts += `</optgroup>`;
  });
  box.innerHTML = `<div class="fam-picker">
      <select id="famSelect" onchange="selectFam(this.value)">${opts}</select>
      <span class="fam-badge" id="famBadge"></span>
    </div>`;
  syncFamSelector(state.fam);
}
/* 同步下拉菜单与尾部徽章到指定族 */
function syncFamSelector(id){
  const sel=document.getElementById('famSelect'); if(sel&&sel.value!==id) sel.value=id;
  const badge=document.getElementById('famBadge');
  if(badge){ const f=FAMILIES[id];
    badge.className='fam-badge ct ct-'+f.tailCls; badge.textContent=f.tailName; }
}

function selectFam(id){
  state.fam = id;
  state.params = Object.assign({}, FAMILIES[id].def);
  syncFamSelector(id); renderCtrls(); resample();
  // 第1关：认尾巴打卡（存储失败不得影响选族）
  try{ if(level===1) markTailSeen(id); }catch(e){console.warn('markTailSeen',e);}
}

/* ---------- 渲染：参数控件 ---------- */
function renderCtrls(){
  const box = document.getElementById('ctrls');
  const f = FAMILIES[state.fam];
  if(!f.params){ box.innerHTML = '<div class="valdisp">独立 copula 无参数。</div>'; return; }
  box.innerHTML = f.params.map(p=>`
    <div class="ctrl">
      <label>${p.label}：<span id="disp_${p.key}">${state.params[p.key]}</span></label>
      <input type="range" id="sl_${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${state.params[p.key]}"
        oninput="onParam('${p.key}',this.value)">
    </div>`).join('');
}
function onParam(key,val){
  state.params[key] = parseFloat(val);
  document.getElementById('disp_'+key).textContent = val;
  resample();
}

/* ============================================================
 *  采样 + 三层联动渲染
 * ============================================================ */
function resample(){
  const f = FAMILIES[state.fam];
  state.data = C[state.fam].sample(state.m, state.params);
  const kpi = C[state.fam].kpi(state.params);
  state.lastKpi = kpi;
  drawScatter(state.data, f, kpi);
  try{ drawDensity(state.data, f, kpi); }catch(e){console.warn('drawDensity',e);}
  updateStats(kpi);
  updateContext(f);
  updateExplain(f, kpi);
}

/* ============================================================
 *  尾部密度剖面图 —— 直观体现"重尾 vs 轻尾"
 *  横轴：对角投影 s=(U+V)/2 ∈[0,1]（s≈0 左下角、s≈1 右上角）
 *  纵轴：密度。叠加"独立基准"虚线作对照——
 *    · 重尾族(λ>0)：曲线在对应角落(s→0 或 s→1)明显高于基准 = 概率质量堆在尾部
 *    · 轻尾族：曲线在中段隆起、两端迅速衰减、贴近甚至低于基准
 * ============================================================ */
let _indepDiagCache=null;
function indepDiagBaseline(bins){
  // 独立 copula 对角密度的稳定基准：用一次大样本估计并缓存
  if(_indepDiagCache && _indepDiagCache.bins===bins) return _indepDiagCache.y;
  const big = C.independent.sample(8000);
  const d = CC.diagonalDensity(big, bins);
  _indepDiagCache = {bins, y:d.y};
  return d.y;
}
function drawDensity(data, f, kpi){
  const cv=document.getElementById('density'); if(!cv) return;
  const ctx=cv.getContext('2d');
  const W=cv.width, H=cv.height, padL=40, padR=14, padT=16, padB=30;
  ctx.clearRect(0,0,W,H);
  const bins=36;
  const dens = CC.diagonalDensity(data, bins);
  const base = indepDiagBaseline(bins);
  const ymax = Math.max(2.2, Math.max(...dens.y, ...base)*1.08);
  const px = s => padL + s*(W-padL-padR);
  const py = y => (H-padB) - (y/ymax)*(H-padT-padB);

  // 背景：左下角=下尾区、右上角=上尾区 轻微底色
  ctx.fillStyle=hexA(CC.COLORS.lower,0.06); ctx.fillRect(px(0),padT,px(0.18)-px(0),H-padT-padB);
  ctx.fillStyle=hexA(CC.COLORS.upper,0.06); ctx.fillRect(px(0.82),padT,px(1)-px(0.82),H-padT-padB);
  // 网格 + 轴
  ctx.strokeStyle='#ecf0f1';ctx.lineWidth=1;
  for(let g=0;g<=5;g++){const x=g/5;ctx.beginPath();ctx.moveTo(px(x),padT);ctx.lineTo(px(x),H-padB);ctx.stroke();}
  ctx.strokeStyle='#2c3e50';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(padL,padT);ctx.lineTo(padL,H-padB);ctx.lineTo(W-padR,H-padB);ctx.stroke();

  // 独立基准（灰虚线）
  ctx.strokeStyle='#b2bec3';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);
  ctx.beginPath();base.forEach((y,i)=>{const x=(i+0.5)/bins;i?ctx.lineTo(px(x),py(y)):ctx.moveTo(px(x),py(y));});ctx.stroke();
  ctx.setLineDash([]);

  // 当前族密度（填充 + 描边，按尾部语义着色）
  const col=CC.tailColor(f.tailCls);
  ctx.beginPath();
  dens.y.forEach((y,i)=>{const x=(i+0.5)/bins;i?ctx.lineTo(px(x),py(y)):ctx.moveTo(px(x),py(y));});
  ctx.lineTo(px((bins-0.5)/bins),H-padB);ctx.lineTo(px(0.5/bins),H-padB);ctx.closePath();
  ctx.fillStyle=hexA(col,0.20);ctx.fill();
  ctx.beginPath();
  dens.y.forEach((y,i)=>{const x=(i+0.5)/bins;i?ctx.lineTo(px(x),py(y)):ctx.moveTo(px(x),py(y));});
  ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.stroke();

  // 尾部超出基准的部分高亮（重尾的"证据"）
  function tailMass(lo,hi){ // 该族在[lo,hi]段相对基准多出的质量(>0 表示更重尾)
    let s=0,n=0; dens.y.forEach((y,i)=>{const x=(i+0.5)/bins; if(x>=lo&&x<=hi){s+=(y-base[i]);n++;}}); return n?s/n:0;
  }
  const lowExtra=tailMass(0,0.18), upExtra=tailMass(0.82,1);

  // 文案标注（同时满足"密度高出基准"与"理论 λ>0"才标，避免无尾族被采样噪声误标）
  ctx.font='bold 11px sans-serif';
  ctx.fillStyle=CC.COLORS.lower;ctx.textAlign='center';
  ctx.fillText((lowExtra>0.15&&kpi.lambdaL>0.01)?'下尾偏重 ▲':'',px(0.10),padT+12);
  ctx.fillStyle=CC.COLORS.upper;
  ctx.fillText((upExtra>0.15&&kpi.lambdaU>0.01)?'上尾偏重 ▲':'',px(0.90),padT+12);
  ctx.textAlign='left';
  // 轴标签
  ctx.fillStyle='#7f8c8d';ctx.font='10px sans-serif';
  ctx.fillText('密度', 6, padT+8);
  ctx.textAlign='center';
  ctx.fillText('← 下尾(0,0)', px(0.12), H-10);
  ctx.fillText('s=(U+V)/2', px(0.5), H-10);
  ctx.fillText('上尾(1,1) →', px(0.88), H-10);
  ctx.textAlign='right';ctx.fillStyle='#b2bec3';ctx.font='9px sans-serif';
  ctx.fillText('⌁ 灰虚线=独立基准', W-padR, padT+8);
  ctx.textAlign='left';

  // 一句话判读（结合 λ）
  const verdict=document.getElementById('densVerdict');
  if(verdict){
    let msg='';
    if(kpi.lambdaL>0.01&&kpi.lambdaU>0.01) msg=`<b>对称厚尾</b>：两端都高出独立基准，λ_L=λ_U≈${kpi.lambdaL.toFixed(2)} —— 极端同向波动都联动。`;
    else if(kpi.lambdaU>0.01) msg=`<b>上尾偏重</b>：右端(s→1)显著高出基准，λ_U≈${kpi.lambdaU.toFixed(2)} —— "同时大值"联动强。`;
    else if(kpi.lambdaL>0.01) msg=`<b>下尾偏重</b>：左端(s→0)显著高出基准，λ_L≈${kpi.lambdaL.toFixed(2)} —— "同时小值"联动强。`;
    else msg=`<b>轻尾/无尾</b>：曲线在中段隆起、两端贴近基准并快速衰减，λ_L=λ_U=0 —— 极端处不联动。`;
    verdict.innerHTML='📈 '+msg;
  }
}

function drawScatter(data, f, kpi){
  const cv = document.getElementById('scatter');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, pad = 36;
  ctx.clearRect(0,0,W,H);
  const px = u => pad + u*(W-2*pad);
  const py = v => H-pad - v*(H-2*pad);

  // 尾部高亮底色（机制可视化）
  const cz = 0.18; // 角落区域大小
  if(kpi.lambdaL>0.001){
    ctx.fillStyle = hexA(CC.COLORS.lower, 0.12+0.5*kpi.lambdaL);
    ctx.fillRect(px(0),py(cz),(px(cz)-px(0)),(py(0)-py(cz)));
  }
  if(kpi.lambdaU>0.001){
    ctx.fillStyle = hexA(CC.COLORS.upper, 0.12+0.5*kpi.lambdaU);
    ctx.fillRect(px(1-cz),py(1),(px(1)-px(1-cz)),(py(1-cz)-py(1)));
  }
  // 网格 + 0.05/0.95 分位虚线
  ctx.strokeStyle='#ecf0f1'; ctx.lineWidth=1;
  for(let g=0;g<=10;g++){ const t=g/10;
    ctx.beginPath();ctx.moveTo(px(t),py(0));ctx.lineTo(px(t),py(1));ctx.stroke();
    ctx.beginPath();ctx.moveTo(px(0),py(t));ctx.lineTo(px(1),py(t));ctx.stroke();
  }
  ctx.strokeStyle='#bdc3c7'; ctx.setLineDash([4,4]);
  [0.05,0.95].forEach(q=>{
    ctx.beginPath();ctx.moveTo(px(q),py(0));ctx.lineTo(px(q),py(1));ctx.stroke();
    ctx.beginPath();ctx.moveTo(px(0),py(q));ctx.lineTo(px(1),py(q));ctx.stroke();
  });
  ctx.setLineDash([]);
  // 散点
  const col = CC.tailColor(f.tailCls);
  ctx.fillStyle = hexA(col, 0.55);
  data.forEach(([u,v])=>{ ctx.beginPath();ctx.arc(px(u),py(v),1.6,0,2*Math.PI);ctx.fill(); });
  // 轴
  ctx.strokeStyle='#2c3e50';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(px(0),py(0));ctx.lineTo(px(1),py(0));ctx.lineTo(px(1),py(1));
  ctx.moveTo(px(0),py(0));ctx.lineTo(px(0),py(1));ctx.stroke();
  ctx.fillStyle='#7f8c8d';ctx.font='12px sans-serif';
  ctx.fillText('U = F_X(X)', W-92, H-12);
  ctx.save();ctx.translate(12,46);ctx.rotate(-Math.PI/2);ctx.fillText('V = F_Y(Y)',0,0);ctx.restore();
  // 角落注记
  if(kpi.lambdaL>0.001){ctx.fillStyle=CC.COLORS.lower;ctx.font='bold 11px sans-serif';ctx.fillText('↙ 下尾抱团',px(0.02),py(cz)+14);}
  if(kpi.lambdaU>0.001){ctx.fillStyle=CC.COLORS.upper;ctx.font='bold 11px sans-serif';ctx.fillText('上尾抱团 ↗',px(1-cz)+2,py(1)+14);}
}
function hexA(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${Math.min(a,0.85)})`;}

function updateStats(kpi){
  flashSet('vTau','sbTau',kpi.tau.toFixed(3));
  flashSet('vL','sbL',kpi.lambdaL.toFixed(3));
  flashSet('vU','sbU',kpi.lambdaU.toFixed(3));
}
function flashSet(valId,boxId,txt){
  const v=document.getElementById(valId),b=document.getElementById(boxId);
  if(v.textContent!==txt){v.textContent=txt;b.classList.add('flash');setTimeout(()=>b.classList.remove('flash'),350);}
}
function updateContext(f){
  const tag=document.getElementById('ctxTag');
  tag.textContent='业务现象：'+f.ctx;
  tag.style.background=f.ctxColor;
}
function updateExplain(f,kpi){
  document.getElementById('explain').innerHTML = f.intuition;
  document.getElementById('mechBody').innerHTML = f.mech;
  document.getElementById('mathBody').innerHTML = f.math;
  document.getElementById('rcode').textContent = f.rcode;
  if(window.MathJax&&MathJax.typesetPromise) MathJax.typesetPromise([document.getElementById('mathBody')]);
}

/* ---------- 掌握度环 ---------- */
function drawRing(pct){
  const cv=document.getElementById('ring'),ctx=cv.getContext('2d');
  ctx.clearRect(0,0,54,54);
  ctx.beginPath();ctx.arc(27,27,22,0,2*Math.PI);ctx.strokeStyle='#ecf0f1';ctx.lineWidth=6;ctx.stroke();
  ctx.beginPath();ctx.arc(27,27,22,-Math.PI/2,-Math.PI/2+2*Math.PI*pct/100);
  ctx.strokeStyle=pct>=80?'#27ae60':'#3498db';ctx.lineWidth=6;ctx.stroke();
  ctx.fillStyle='#2c3e50';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(pct+'%',27,32);
  ctx.textAlign='left';
}

function resetDefault(){ state.params=Object.assign({},FAMILIES[state.fam].def); state.m=2000;
  document.getElementById('mSlider').value=2000; document.getElementById('mVal').textContent=2000;
  renderCtrls(); resample(); flashCanvas(); pulseBtn('btnReset'); toast('↩️ 已恢复默认参数'); }

function resampleBtn(){
  resample(); flashCanvas(); pulseBtn('btnResample');
  toast('🔄 已重新抽样 '+state.m+' 个点');
}

/* ---- 按钮视觉反馈：散点闪一下 + 按钮按压 + 醒目提示 ---- */
function flashCanvas(){
  const cv=document.getElementById('scatter'); if(!cv) return;
  cv.style.transition='none'; cv.style.boxShadow='0 0 0 4px #3498db';
  cv.style.opacity='0.4';
  requestAnimationFrame(()=>{ cv.style.transition='opacity .45s, box-shadow .55s';
    cv.style.opacity='1'; cv.style.boxShadow='0 0 0 0 rgba(52,152,219,0)'; });
}
function pulseBtn(id){
  const b=document.getElementById(id); if(!b) return;
  b.style.transition='none'; b.style.transform='scale(0.93)';
  requestAnimationFrame(()=>{ b.style.transition='transform .18s'; b.style.transform='scale(1)'; });
}
let _toastTimer=null;
function toast(msg){
  let t=document.getElementById('_toast');
  if(!t){ t=document.createElement('div'); t.id='_toast';
    t.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%) translateY(-12px);'+
      'background:#27ae60;color:#fff;padding:12px 26px;border-radius:26px;font-size:1.02em;font-weight:600;'+
      'box-shadow:0 6px 22px rgba(0,0,0,.3);z-index:9999;opacity:0;transition:opacity .25s, transform .25s;pointer-events:none';
    document.body.appendChild(t); }
  t.textContent=msg; t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)';
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(-12px)'; },1600);
}

window.addEventListener('DOMContentLoaded',()=>{
  // 每一步独立 try/catch：任何非核心步骤出错都不得阻断"选族/模拟/恢复默认"主链。
  try{ document.getElementById('mSlider').addEventListener('input',e=>{
    state.m=parseInt(e.target.value);document.getElementById('mVal').textContent=state.m;resample();}); }catch(e){console.warn('mSlider bind',e);}
  try{ renderCards(); }catch(e){console.warn('renderCards',e);}
  try{ selectFam('gaussian'); }catch(e){console.warn('selectFam',e);}
  try{ renderTask(); }catch(e){console.warn('renderTask',e);}
  try{ refreshNotebookCounts(); }catch(e){console.warn('refreshNotebookCounts',e);}
  try{ updateMasteryRing(); }catch(e){console.warn('updateMasteryRing',e);}
});

/* ============================================================
 *  错题本 + SM-2 记忆曲线 (localStorage)
 * ============================================================ */
const LS_MISTAKES='ch17_s4_mistakes', LS_MASTERY='ch17_s4_mastery';
// 故障安全：本地文件(file://)双击打开时浏览器可能禁用 localStorage，
// 此时降级为内存存储，绝不让存储异常中断主功能（选族/模拟/恢复默认）。
let _memStore={};
let _lsOK=(function(){try{const t='__t';localStorage.setItem(t,'1');localStorage.removeItem(t);return true;}catch(e){return false;}})();
function loadJSON(k,d){
  try{ const raw=_lsOK?localStorage.getItem(k):_memStore[k]; return raw?JSON.parse(raw):d; }
  catch(e){ return d; }
}
function saveJSON(k,v){
  try{ const s=JSON.stringify(v); if(_lsOK) localStorage.setItem(k,s); else _memStore[k]=s; }
  catch(e){ try{_memStore[k]=JSON.stringify(v);}catch(_){} }
}

// 知识点掌握度 {KP: {att, correct}}
function bumpMastery(kp,ok){
  const m=loadJSON(LS_MASTERY,{});
  if(!m[kp])m[kp]={att:0,correct:0};
  m[kp].att++; if(ok)m[kp].correct++;
  saveJSON(LS_MASTERY,m);
  reportKP(kp,ok); // 上报老师端(聚合)
  updateMasteryRing();
}
function updateMasteryRing(){
  const m=loadJSON(LS_MASTERY,{});
  const kps=Object.keys(m); if(!kps.length){drawRing(0);return;}
  let s=0;kps.forEach(k=>s+=m[k].correct/Math.max(m[k].att,1));
  drawRing(Math.round(100*s/kps.length));
}

// SM-2
function sm2Update(item,q){ // q: 0-5
  let {n,EF,I}=item.sm2;
  if(q<3){n=0;I=1;}
  else{ n++; I=(n===1)?1:(n===2)?6:Math.round(I*EF);
    EF=Math.max(1.3,EF+0.1-(5-q)*(0.08+(5-q)*0.02)); }
  item.sm2={n,EF,I,due:Date.now()+I*864e5};
  return item;
}
function addMistake(q){
  const list=loadJSON(LS_MISTAKES,[]);
  // 同KP已存在则更新，否则新增
  let it=list.find(x=>x.kp===q.kp);
  if(!it){it={id:Date.now()+'_'+q.kp,kp:q.kp,station:4,question:q.question,
    myAnswer:q.myAnswer,correct:q.correct,mechanism:q.mechanism,ts:Date.now(),
    sm2:{n:0,EF:2.5,I:0,due:Date.now()}}; list.push(it);}
  else{it.myAnswer=q.myAnswer;it.ts=Date.now();it.sm2.due=Date.now();it.sm2.n=0;it.sm2.I=1;}
  saveJSON(LS_MISTAKES,list); refreshNotebookCounts();
}
function refreshNotebookCounts(){
  const list=loadJSON(LS_MISTAKES,[]);
  document.getElementById('nbCount').textContent=list.length;
  const due=list.filter(x=>x.sm2.due<=Date.now()).length;
  document.getElementById('dueCount').textContent=due;
}
function openNotebook(){
  const list=loadJSON(LS_MISTAKES,[]);
  if(!list.length){alert('错题本是空的——目前没有栽过跟头，继续保持！');return;}
  let s='📒 我的错题本（同一知识点只记一条）\n\n';
  list.forEach((x,i)=>{
    const dueIn=Math.ceil((x.sm2.due-Date.now())/864e5);
    s+=`${i+1}. [${x.kp}] ${x.question}\n   你的答案：${x.myAnswer} ✗ → 正确：${x.correct}\n   机制：${x.mechanism}\n   下次复习：${dueIn<=0?'今天':dueIn+'天后'}\n\n`;
  });
  alert(s);
}
function startReview(){
  const list=loadJSON(LS_MISTAKES,[]);
  const due=list.filter(x=>x.sm2.due<=Date.now());
  if(!due.length){alert('🎉 今天没有待复习的错题，记忆都还新鲜！');return;}
  // 推变体（参数随机化）：这里以情境匹配题变体演示
  const it=due[0];
  reviewVariant(it);
}
function reviewVariant(it){
  // 生成同KP变体（参数随机化模板）
  const variant=genVariant(it.kp);
  const ans=prompt('🔁 复习变体（同知识点，换了问法/参数）：\n\n'+variant.q+'\n\n输入你的答案（'+variant.opts.join(' / ')+'）：');
  if(ans===null)return;
  const ok=ans.trim()===variant.correct;
  const item=loadJSON(LS_MISTAKES,[]).map(x=>x.id===it.id?sm2Update(x,ok?5:2):x);
  saveJSON(LS_MISTAKES,item); bumpMastery(it.kp,ok); refreshNotebookCounts();
  alert(ok?'✅ 答对了！这道题的下次复习被推后了（记忆曲线生效）。':'✗ 再想想：'+variant.hint+'\n明天会再考你这个知识点的变体。');
}
// 变体生成模板（离线·参数随机化）
function genVariant(kp){
  if(kp==='KP-17-4-3'){ // Clayton↔下尾↔同时违约
    const scn=['经济衰退期多个债务人同时违约','供应链多家供应商同时中断','熊市中多个资产一起跌到谷底'];
    const s=scn[Math.floor(Math.random()*scn.length)];
    return {q:`「${s}」——这种"共同变坏"的强下尾联动，最该用哪个 copula？`,
      opts:['Clayton','Gumbel','Gaussian'],correct:'Clayton',
      hint:'下尾抱团 → Clayton（λ_L=2^(−1/θ)>0, λ_U=0）'};
  }
  if(kp==='KP-17-4-5'){ // Gumbel θ→λ_U
    const tg=[0.4,0.5,0.6][Math.floor(Math.random()*3)];
    return {q:`巨灾再保需要强上尾。要让 Gumbel 的 λ_U≈${tg}，θ 大约要调到多少？（提示 λ_U=2−2^(1/θ)）`,
      opts:['约1.5','约3','约6'],correct: tg<0.45?'约3':(tg<0.55?'约3':'约6'),
      hint:'λ_U=2−2^(1/θ)，θ 越大上尾越强'};
  }
  return {q:'（该知识点变体待补充）',opts:['继续'],correct:'继续',hint:''};
}

/* ============================================================
 *  3 关任务
 * ============================================================ */
let tailSeen={}; // 第1关：看过哪些族的尾巴
function markTailSeen(id){ tailSeen[id]=true;
  if(Object.keys(tailSeen).length>=4 && !unlocked[2]){ // 看过≥4族解锁第2关
    unlockLevel(2,'👀 你已经认全了主要家族的尾巴！第 2 关「配业务」已解锁。');
  }
}
function unlockLevel(lv,msg){ unlocked[lv]=true;
  const tab=document.querySelector(`.level-tab[data-lv="${lv}"]`);
  tab.classList.remove('locked'); const lk=tab.querySelector('.lock'); if(lk)lk.remove();
  showCombo(msg);
}
function gotoLevel(lv){ if(!unlocked[lv]){showCombo('🔒 先完成上一关才能解锁哦');return;}
  level=lv; document.querySelectorAll('.level-tab').forEach(t=>t.classList.toggle('active',+t.dataset.lv===lv));
  renderTask();
}
let combo=0;
function showCombo(t){const c=document.getElementById('combo');if(!c)return;c.textContent=t;setTimeout(()=>{if(c.textContent===t)c.textContent='';},4000);}

/* ---------- 渲染当前关的当前题（就地换题，无需滚动） ---------- */
const LV_META = {
  1:{icon:'🎯',name:'认尾巴',hint:'看散点角落抱团在哪，判断尾部归属。'},
  2:{icon:'🧩',name:'配业务',hint:'把精算场景匹配到正确的 copula。'},
  3:{icon:'💼',name:'做决策',hint:'为巨灾联动组合选 copula 定价，看后果动画。'}
};
function renderTask(){
  const area=document.getElementById('taskArea');
  const bank=QUIZ[level], idx=curQ[level], q=bank[idx];
  const meta=LV_META[level];
  const done=quizProgress[level].size, total=bank.length;
  // 题目导航点
  const dots=bank.map((_,i)=>{
    const cls = quizProgress[level].has(i)?'qdot done':(i===idx?'qdot cur':'qdot');
    return `<span class="${cls}" onclick="jumpQ(${i})">${i+1}</span>`;
  }).join('');
  const scenario = q.scenario? `<p class="scn">${q.scenario}</p>`:'';
  let html = `
    <div class="task-head">
      <div class="th-title">${meta.icon} 第 ${level} 关 · ${meta.name}
        <span class="th-prog">答对 ${done}/${total}（≥${PASS_NEED} 解锁下一关）</span></div>
      <div class="qdots">${dots}</div>
    </div>
    <div class="th-hint">${meta.hint}</div>
    <div class="qbody">
      ${scenario}
      <p class="qstem"><b>第 ${idx+1} 题：</b>${q.q}</p>
      ${optBtns(idx)}
    </div>`;
  if(level===3) html += `<canvas id="sim" width="640" height="200"></canvas>
      <div class="verdict" id="verdict"></div>`;
  html += `<div class="feedback" id="fb${level}"></div>
    <div class="classbar" id="cb${level}"></div>
    <div class="qnav">
      <button class="btn qprev" onclick="prevQ()">◀ 上一题</button>
      <button class="btn primary qnext" onclick="nextQ()">下一题 ▶</button>
    </div>`;
  area.innerHTML = html;
  if(level===3) setTimeout(initSim,40);
  if(window.MathJax&&MathJax.typesetPromise) MathJax.typesetPromise([area]);
}
function jumpQ(i){ curQ[level]=i; renderTask(); }
function nextQ(){ const n=QUIZ[level].length; curQ[level]=(curQ[level]+1)%n; renderTask(); }
function prevQ(){ const n=QUIZ[level].length; curQ[level]=(curQ[level]-1+n)%n; renderTask(); }

/* 选项按钮：用注册表承载当前题元数据（避免内联字符串转义问题） */
let _qReg={};
function optBtns(qIdx){
  const q=QUIZ[level][qIdx];
  const qid='q'+level+'_'+qIdx;
  _qReg[qid]={lv:level,idx:qIdx,opts:q.opts,optFam:q.optFam||[],correct:q.correct,kp:q.kp,mech:q.mech,okMsg:q.okMsg,sim:q.sim};
  const answered = quizProgress[level].has(qIdx);
  return `<div class="qopts" data-qid="${qid}">`+q.opts.map((o,i)=>
    `<button class="qopt" data-qid="${qid}" data-opt="${i}"${answered?' disabled':''}>${o}</button>`).join('')+`</div>`;
}
/* 找到本题正确选项对应的族 id */
function correctFamOf(reg){
  const ci=reg.opts.indexOf(reg.correct);
  return (reg.optFam&&reg.optFam[ci])||null;
}
// 事件委托：捕获所有 .qopt 点击
document.addEventListener('click',function(e){
  const b=e.target.closest('.qopt'); if(!b||!b.dataset.qid)return;
  const reg=_qReg[b.dataset.qid]; if(!reg)return;
  const chosen=reg.opts[+b.dataset.opt];
  answer(b,chosen,reg);
});
function answer(btn,chosen,reg){
  const ok = chosen===reg.correct;
  const chosenIdx = +btn.dataset.opt;
  const chosenFam = reg.optFam&&reg.optFam[chosenIdx];
  const correctFam = correctFamOf(reg);
  // 视觉：禁用本题所有选项，标红/标绿
  btn.parentNode.querySelectorAll('.qopt').forEach(b=>{b.disabled=true;
    if(reg.opts[+b.dataset.opt]===reg.correct) b.classList.add('correct');});
  if(!ok) btn.classList.add('wrong');

  // === 答题↔可视化联动 ===
  // 答对：切到正确族让学生"眼见为实"验证。
  // 答错：先切到学生选错的族（让他看错在哪），稍后再切到正确族对比。
  let linkNote='';
  if(ok){
    if(correctFam){ linkToFamily(correctFam); linkNote=`👉 下方散点/密度已切到 <b>${C[correctFam].label}</b>，对照验证你的判断。`; }
  } else {
    if(chosenFam && chosenFam!==correctFam){
      linkToFamily(chosenFam);
      linkNote=`👉 下方先显示你选的 <b>${C[chosenFam].label}</b>（${tailPhrase(chosenFam)}）——看它的尾巴长错了地方；`;
      if(correctFam){
        linkNote+=`3 秒后会自动切到正确的 <b>${C[correctFam].label}</b> 让你对比。`;
        setTimeout(()=>{ if(_qReg && document.getElementById('fb'+reg.lv)){ linkToFamily(correctFam);
          const fb=document.getElementById('fb'+reg.lv);
          if(fb&&fb.classList.contains('no')) fb.innerHTML += `<br>✅ 已切到正确的 <b>${C[correctFam].label}</b>（${tailPhrase(correctFam)}）——对比一下两者的尾巴差异。`; }
        },3000);
      }
    } else if(correctFam){ linkToFamily(correctFam); }
  }

  // 反馈
  const fb = document.getElementById('fb'+reg.lv);
  if(fb){ fb.className='feedback show '+(ok?'ok':'no');
    fb.innerHTML = (ok ? ('✅ '+(reg.okMsg||'答对了！')) : ('✗ '+reg.mech+'<br><span style="color:#999">已记入错题本，记忆曲线会择时再考你这个知识点的变体。</span>'))
      + (linkNote?('<br>'+linkNote):''); }
  // 社会性对照
  showClassStat(reg.kp, ok);
  // 记录
  bumpMastery(reg.kp,ok);
  if(!ok) addMistake({kp:reg.kp,question:QUIZ[reg.lv][reg.idx].q,
    myAnswer:chosen,correct:reg.correct,mechanism:reg.mech});
  // 进度 + 连击
  if(ok){ quizProgress[reg.lv].add(reg.idx); combo++;
    showCombo('🔥 连击 ×'+combo+(combo>=2?'！手感不错':'')); }
  else combo=0;
  // 第3关后果动画
  if(reg.sim) runSimVerdict(ok);
  // 解锁判定：本关答对达标 → 解锁下一关，并弹确认框自动进下一关
  const passed = quizProgress[reg.lv].size>=PASS_NEED;
  if(passed && ok){
    if(reg.lv===1 && !unlocked[2]){ unlockLevel(2,'✅ 第1关达标！'); promptNextLevel(1,2,'配业务'); }
    else if(reg.lv===2 && !unlocked[3]){ unlockLevel(3,'✅ 第2关达标！'); promptNextLevel(2,3,'做决策'); }
    else if(reg.lv===3){ celebrateFinish(); }
  }
  // 更新顶部进度数字 + 题目导航点
  updateTaskHead();
}

/* 切换可视化到指定族（不污染闯关进度的 markTailSeen） */
function linkToFamily(id){
  if(!id||!FAMILIES[id]) return;
  state.fam=id; state.params=Object.assign({},FAMILIES[id].def);
  syncFamSelector(id);     // 同步下拉菜单选中态
  renderCtrls(); resample();
}
/* 一句话描述某族的尾部 */
function tailPhrase(id){
  const f=FAMILIES[id]; if(!f) return '';
  return {upper:'上尾抱团',lower:'下尾抱团',both:'对称双尾',none:'无尾/不抱团'}[f.tailCls]||f.tailName;
}

/* 通关确认弹框 → 自动进下一关 */
function promptNextLevel(from,to,toName){
  setTimeout(()=>{
    const go = confirm(`🎉 恭喜！你已通关第 ${from} 关（答对 ${PASS_NEED} 题达标）。\n\n第 ${to} 关「${toName}」已解锁，是否现在进入？`);
    if(go) gotoLevel(to);
    else showCombo(`第 ${to} 关已解锁，准备好了点上面的关卡卡片即可进入。`);
  }, 650); // 略等，让答对的视觉反馈/动画先呈现
}
function celebrateFinish(){
  setTimeout(()=>{
    alert('🏆 全部三关通关！\n\n你已经能：认出每族的尾巴、把业务场景配到正确 copula、并为巨灾联动组合做稳健的准备金决策。\n\n可继续在上方切换家族、调参数，或打开"错题本/今日待复习"巩固。');
  }, 700);
}
function updateTaskHead(){
  const bank=QUIZ[level], done=quizProgress[level].size, total=bank.length;
  const prog=document.querySelector('.th-prog'); if(prog) prog.textContent=`答对 ${done}/${total}（≥${PASS_NEED} 解锁下一关）`;
  document.querySelectorAll('.qdot').forEach((el,i)=>{
    el.classList.toggle('done',quizProgress[level].has(i));
    el.classList.toggle('cur',i===curQ[level]&&!quizProgress[level].has(i));
  });
}

/* 匿名全班正确率对照（复用 §9.4 老师端聚合；无后端时用本地模拟基线）*/
function showClassStat(kp,ok){
  const bar=document.getElementById('cb'+level); if(!bar)return;
  // 真实部署：fetch('/api/kp-stat?kp='+kp) 取聚合正确率
  const baseRate={'KP-17-4-1':0.55,'KP-17-4-2':0.62,'KP-17-4-3':0.58,'KP-17-4-4':0.51,'KP-17-4-5':0.49}[kp]||0.6;
  const better=Math.round((ok? (1-baseRate) : baseRate*0.5)*100);
  bar.innerHTML=`📊 本题全班正确率约 <b>${Math.round(baseRate*100)}%</b>${ok?`，你超过了约 <b>${Math.max(better, 50+combo*3)}%</b> 的同学 👏`:'，这题不少同学也栽过，别灰心。'}`;
}

/* 第3关后果动画：S=X+Y 尾部损失 vs 准备金 */
let simReq=null;
function initSim(){ const cv=document.getElementById('sim'); if(cv) drawSim(0,'idle'); }
function runSimVerdict(correct){
  const v=document.getElementById('verdict');
  let t=0; const tot=60;
  (function anim(){ t++; drawSim(t/tot, correct?'pass':'fail');
    if(t<tot) requestAnimationFrame(anim);
    else{ v.className='verdict show '+(correct?'pass':'fail');
      v.innerHTML = correct
        ? '✅ 过关！你选了强上尾 copula，准备金<b>覆盖住了</b>巨灾年的联合大额索赔。定价稳健。'
        : '💥 准备金被击穿！无尾/独立假设<b>系统性低估</b>了巨灾年的联合损失——这正是开场故事里的悲剧。回到上面换强上尾的 copula 再试。';
    }
  })();
}
function drawSim(prog,mode){
  const cv=document.getElementById('sim'); if(!cv)return; const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,pad=34; ctx.clearRect(0,0,W,H);
  // 坐标
  ctx.strokeStyle='#2c3e50';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(pad,H-pad);ctx.lineTo(W-pad,H-pad);ctx.moveTo(pad,pad);ctx.lineTo(pad,H-pad);ctx.stroke();
  ctx.fillStyle='#7f8c8d';ctx.font='11px sans-serif';
  ctx.fillText('聚合损失 S = X + Y',W-150,H-12); ctx.save();ctx.translate(12,H/2+40);ctx.rotate(-Math.PI/2);ctx.fillText('概率密度',0,0);ctx.restore();
  // 准备金线
  const capX = pad+(W-2*pad)*0.62;
  ctx.strokeStyle='#27ae60';ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(capX,pad);ctx.lineTo(capX,H-pad);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#27ae60';ctx.fillText('准备金',capX-18,pad+12);
  // 损失分布：mode=pass 厚尾被覆盖；fail 厚尾超出
  const thick = mode==='fail'?0.30:(mode==='pass'?0.30:0.12);
  ctx.beginPath();
  for(let i=0;i<=200;i++){ const x=i/200; const px=pad+(W-2*pad)*x;
    // 混合：主体正态 + 上尾厚
    const main=Math.exp(-Math.pow((x-0.32)/0.12,2));
    const tail=thick*Math.exp(-Math.pow((x-0.82)/0.10,2));
    const y=(main+tail)*prog;
    const py=(H-pad)-y*(H-2*pad)*0.85;
    if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.lineTo(W-pad,H-pad);ctx.lineTo(pad,H-pad);ctx.closePath();
  ctx.fillStyle = mode==='fail'?'rgba(231,76,60,.25)':'rgba(52,152,219,.22)';
  ctx.fill();
  ctx.strokeStyle = mode==='fail'?'#e74c3c':'#3498db';ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<=200;i++){ const x=i/200; const px=pad+(W-2*pad)*x;
    const main=Math.exp(-Math.pow((x-0.32)/0.12,2));
    const tail=thick*Math.exp(-Math.pow((x-0.82)/0.10,2));
    const y=(main+tail)*prog; const py=(H-pad)-y*(H-2*pad)*0.85;
    if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.stroke();
  // 击穿区域标注
  if(mode==='fail'&&prog>0.9){ ctx.fillStyle='#c0392b';ctx.font='bold 12px sans-serif';
    ctx.fillText('⚠ 尾部损失超出准备金',capX+8,pad+40); }
  if(mode==='pass'&&prog>0.9){ ctx.fillStyle='#1e8449';ctx.font='bold 12px sans-serif';
    ctx.fillText('✓ 尾部已被覆盖',pad+10,pad+40); }
}

/* ============================================================
 *  AI 学伴（双路径：离线知识点匹配 / 学生配 API）
 * ============================================================ */
let aiMode='offline'; // offline | api
const LS_APIKEY='ch17_s4_apikey';
function toggleMode(){
  if(aiMode==='offline'){
    const k=prompt('切换到「AI 讲解」需要你自己的 API Key。\n（仅存在你的浏览器本地，绝不上传任何服务器）\n\n粘贴 API Key：', localStorage.getItem(LS_APIKEY)||'');
    if(k){localStorage.setItem(LS_APIKEY,k);aiMode='api';document.getElementById('modeLink').textContent='AI 讲解（已配置）';}
  }else{ aiMode='offline'; document.getElementById('modeLink').textContent='离线知识点'; }
}
function pushMsg(role,html){const b=document.getElementById('cbody');
  const d=document.createElement('div');d.className='msg '+(role==='u'?'u':'a');d.innerHTML=html;b.appendChild(d);b.scrollTop=b.scrollHeight;}
function askNash(){
  const inp=document.getElementById('cInput');const q=inp.value.trim();if(!q)return;
  pushMsg('u',q); inp.value='';
  if(aiMode==='api'){ pushMsg('a','<i>（已配置 API：真实部署会把当前页状态 + 问题发给大模型生成讲解。本地演示回落到离线知识库。）</i>'); }
  pushMsg('a', offlineAnswer(q));
}
// 离线知识点答疑（基于本站已配备内容做意图匹配）
function offlineAnswer(q){
  const t=q.toLowerCase(); const f=FAMILIES[state.fam];
  const cur=`你现在看的是 <b>${C[state.fam].label}</b>`+(state.params.theta?`、θ=${state.params.theta}`:'')+(state.params.rho!=null?`、ρ=${state.params.rho}`:'')+(state.params.nu?`、ν=${state.params.nu}`:'')+`，λ_L=${state.lastKpi.lambdaL.toFixed(2)}、λ_U=${state.lastKpi.lambdaU.toFixed(2)}。`;
  if(/gumbel|上尾/.test(t)) return cur+'<br>Gumbel <b>只有上尾</b>：λ_U=2−2^(1/θ)>0，λ_L=0。直觉上它的点子在右上角抱团，对应"巨灾年多张保单<b>同时大额索赔</b>"。';
  if(/clayton|下尾|违约/.test(t)) return cur+'<br>Clayton <b>只有下尾</b>：λ_L=2^(−1/θ)>0，λ_U=0。左下角抱团，对应"衰退期多债务人<b>同时违约</b>"。';
  if(/gaussian|高斯|无尾|低估/.test(t)) return cur+'<br>Gaussian 即使 ρ 很大也 <b>λ_L=λ_U=0</b>，极端时不联动——这就是它"低估巨灾联合损失"的根源。';
  if(/τ|tau|kendall|关系/.test(t)) return cur+'<br>τ↔参数：Clayton τ=θ/(θ+2)、Gumbel τ=1−1/θ、Gaussian τ=(2/π)arcsin ρ。调参数时上方 τ 会实时变。';
  if(/λ|尾部|tail/.test(t)) return cur+'<br>λ_L/λ_U 是"极端共同发生"的强度（0~1）。看散点哪个角落抱团，对应哪个 λ>0。';
  if(/选|该用|场景|哪个/.test(t)) return '按业务尾巴选：同时<b>大额索赔/上涨</b>→Gumbel；同时<b>违约/下跌</b>→Clayton；<b>双尾</b>极端→t；只要温和相关无极端→Gaussian/Frank。'+ '<br>'+cur;
  return cur+'<br>试着问我："为什么 Gumbel 只有上尾？""θ 和 τ 啥关系？""这个巨灾场景该选谁？" 我会结合你当前的参数回答。';
}

/* 上报老师端聚合（仅 {kp,result}，无身份/题目）*/
function reportKP(kp,ok){
  // 真实部署： fetch('/api/kp-stat',{method:'POST',body:JSON.stringify({kp,result:ok?'correct':'wrong'})})
  // 本地演示：仅 console，保证不外泄任何明细
  // console.log('[聚合上报]',{kp,result:ok?'correct':'wrong'});
}
