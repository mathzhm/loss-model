# LOSS LAB 知识点创作规范（v2）

给并行创作子会话用。目标：为 Ch13/14/18/19/20/21 生成知识点（KP）数据片段，风格与 Ch17 样板一致。

## 0. 工作流程

1. 读本文档（全部）。
2. 读你负责章节的源材料（`C:\Users\THINKPAD\cola\outputs\损失模型_txt\` 下对应 txt）。源材料是内容权威——公式、术语、例题以它为准。
3. 读 `course.js` 中 Ch17 的 2-3 个 KP 作为样板（如 `archimedean`、`tail-dep`）。
4. 按下方 schema 创作 KP，写入片段文件 `C:\Users\THINKPAD\cola\outputs\损失模型互动学习舱\_kps_ch<NN>.js`。
5. 写一个自检页 `_fragtest_ch<NN>.html`（模板见 §8），用无头 Chrome 跑一遍，确保零失败。
6. 回报：片段路径、KP 数、题目总数、自检结果。

**禁止**：修改 course.js / engine.js / style.css / learn.html。只能新建 `_kps_ch*.js` 和 `_fragtest_ch*.html`。

## 1. 片段文件格式

```js
/* Ch<NN> 知识点片段 —— 由 worker 生成，待合并 */
window.KPS_CH<NN> = [
  { ...KP1... },
  { ...KP2... },
];
```
- 文件只含这一个赋值语句。
- 必须是合法 JS（会直接拼接进 course.js）。字符串内不要出现未转义的英文双引号——用「」或全角引号。

## 2. KP 对象 schema

```js
{
  id:"kebab-case-id",        // 章内唯一
  name:"中文名（可含英文术语）",
  icon:"📐",                  // 单个 emoji
  minutes:7,                  // 5–15 的整数
  hook:"情境钩子。具体保险/精算场景，<b>加粗点睛句</b>，1-2 句。",
  intuition:"直觉讲解，2-4 句。术语首次出现写「中文（English）」。可含 <b>。",
  chain:{
    param:{val:"你拖的参数", sub:"参数含义"},      // ≤20字 / ≤16字
    math:{val:"受影响的公式或量", sub:"怎么变"},
    real:{val:"现实保险含义", sub:"一句话"}
  },
  engine:{ ...见 §3... },
  drawers:{
    mechanism:"⚙️ 机制：为什么会这样，2-3 句，可含 <b>。",
    math:"∑ 严格公式。支持 HTML：<sub> <sup> <br>。例：E[S]=E[N]·E[X]<br>Var(S)=E[N]Var(X)+Var(N)E[X]²",
    code:"⌨️ R 代码（纯文本，自动转义，勿含 HTML）"
  },
  quiz:[ {q:"题干", opts:["A","B","C","D"], ans:2, why:"解析，1-2 句"}, ... ],  // 3-5 题
  match:{pairs:[{l:"概念", r:"定义"}, ...]}   // 可选；4-6 对
}
```

要点：
- `chain` 三层＝①参数层（实验台上能拖的旋钮）→②数学量（旋钮改变的公式/数值）→③现实现象（ actuarial 意义）。静态引擎（match/build/predict）的 chain 写核心概念即可。
- `quiz` 的 `ans` 是 **0 基下标**。正确答案位置要分散，不要全是 1。每题必须有 `why`。
- 每个 KP **必须有 engine**（交互优先：curve/scatter/tsSim/compound/ruin/hist > build/predict/match）。
- `minutes` 总和每章控制在 40-70 分钟。

## 3. 十种引擎配置

### curve — 参数→曲线（最常用）
```js
engine:{type:"curve", title:"标题：动词开头，说明拖什么看什么",
  x:{min:0,max:10,label:"x"}, y:{label:"密度"},
  ymin:0,                        // 可选；省略=自动
  series:[
    {label:"图例文字", color:"var(--ch13)", fn:"expDens", width:3},
    {label:"第二条", color:"#7d93b5", fn:"retainXL"}
  ],
  params:[
    {key:"M", label:"自留额 M", min:0.5, max:8, step:0.1, val:2},          // 滑块
    {key:"which", label:"分布族", type:"select", options:["exp","gamma"], val:"exp"}  // 下拉
  ],
  readouts:[{label:"E[自留]", fn:"EretainXL"}],   // 可选；fn 签名 (P)=>数值
  live:(P)=>({param:"M="+P.M.toFixed(1)+"|自留额", math:"E[min(X,M)]="+..., real:"..."}),  // 有滑块时必填
  note:"一句引导观察的话。"}
```
- `series[].fn` 只能取自 §4 函数表，签名 `(x,P)=>y`。
- 滑块参数在 P 里是数值；select 参数是字符串。

### scatter — copula 散点
```js
engine:{type:"scatter", family:"clayton",          // 或 "selectable"
  families:["clayton","gumbel","frank"],            // selectable 时必填
  params:[{key:"theta", label:"θ", min:0.2, max:8, step:0.1, val:2}],
  n:500, readouts:["tau","lambdaL","lambdaU"],
  live:(P,st)=>({...}),   // st={family,tau,lambdaL,lambdaU}
  note:"..."}
```
家族与参数：clayton/gumbel/frank→theta；gaussian→rho；t→rho,nu；indep→无。仅 copula 主题章节使用。

### tsSim — 时间序列模拟 + 样本 ACF（Ch13/14 主力）
```js
engine:{type:"tsSim", title:"AR(1)：拖动 φ 看序列与 ACF",
  model:"ar1",        // ar1 | ma1 | ar2 | arma11 | rw
  params:[{key:"phi", label:"自回归系数 φ", min:-0.95, max:0.95, step:0.05, val:0.7}],
  n:160, lags:14,
  live:(P,st)=>({...}),   // st={acf:[lag1..lag14 的样本值]}
  note:"..."}
```
模型→参数：ar1→phi；ma1→theta；ar2→phi1,phi2；arma11→phi,theta；rw→无参数（params 省略）。
上图=模拟路径，下图=样本 ACF 柱状图（青色＝超出 ±1.96/√n 置信带）。

### compound — 频度-强度复合分布 MC（Ch19/20 主力）
```js
engine:{type:"compound", title:"复合 Poisson：拖动 λ 看聚合赔款",
  freq:"poisson",     // poisson | nb
  sev:"exp",          // exp | gamma | pareto
  params:[
    {key:"lambda", label:"索赔次数 λ", min:1, max:10, step:1, val:4},
    {key:"mean", label:"平均索赔额 E[X]", min:1, max:5, step:0.5, val:2}
  ],
  n:2000, bins:40,
  live:(P,st)=>({...}),   // st={mean:模拟均值, vaq:VaR0.995, thE:理论E[S], EN:理论E[N]}
  note:"..."}
```
参数约定：freq=poisson→P.lambda；freq=nb→P.r,P.p（NB 的 r,p，E[N]=r(1-p)/p）。sev=exp/gamma→P.mean（gamma 另需 P.alpha 形状参数）；sev=pareto→P.xm,P.alpha（α>1 才有有限均值）。

### ruin — Cramér-Lundberg 盈余路径（Ch20）
```js
engine:{type:"ruin", title:"拖动初始盈余 u 看破产概率",
  params:[
    {key:"u", label:"初始盈余 u", min:5, max:40, step:5, val:10},
    {key:"c", label:"保费率 c", min:1, max:6, step:0.5, val:3},
    {key:"lambda", label:"索赔频率 λ", min:0.5, max:3, step:0.5, val:2},
    {key:"mean", label:"平均索赔额 μ", min:0.5, max:2, step:0.25, val:1}
  ],
  T:25, n:500,
  live:(P,st)=>({...}),   // st={psi:破产概率估计, theta:安全附加c/(λμ)-1}
  note:"..."}
```
索赔为复合 Poisson(λ)+Exp(μ)。红色路径＝破产。

### hist — PIT 直方图（固定为指数分布 PIT）
```js
engine:{type:"hist", param:{key:"lam", label:"λ", min:0.3, max:3, step:0.1, val:1},
  n:600, bins:20, live:(P,st)=>({...}) /* st={lam} */, note:"..."}
```

### match — 拖拽配对
```js
engine:{type:"match", title:"配对：概念与定义",
  pairs:[{l:"左侧概念", r:"右侧定义"}, ...]}   // 4-6 对，右侧自动打乱
```

### build — 公式拼装
```js
engine:{type:"build", title:"拼装复合 Poisson 的方差公式",
  prompt:"用下方积木拼出 Var(S) 的表达式（复合 Poisson）：",
  bank:["λ","E[X²]","Var(X)","+","E[N]"],
  answer:["λ","E[X²]"],        // 正确顺序；必须是 bank 的子序列
  success:"复合 Poisson 的 Var(S)=λE[X²]——频度方差=均值，两项合一。",
  fail:"再想想：复合 Poisson 中 Var(N)=E[N]=λ。"}
```

### predict — 预测下注
```js
engine:{type:"predict", title:"预测：φ=1.02 的序列会怎样？",
  scenario:"给出 φ=1.02 的 AR(1) 模拟，预测它 50 期后的走势：",
  options:[
    {icon:"📈", label:"持续发散", mini:"|φ|>1", correct:true},
    {icon:"➡️", label:"围绕均值震荡", mini:"|φ|<1", correct:false},
    {icon:"🎯", label:"收敛到 0", mini:"衰减", correct:false}
  ],
  reveal:"|φ|>1 不满足平稳性，冲击被不断放大，序列发散——这就是单位根。"}
```

### aggregate — 蒙特卡洛 VaR 对比（copula 专用，勿用于新章节）

## 4. 曲线函数表（series.fn / readouts.fn）

签名 `(x,P)=>y`；readouts 用 `(P)=>数值`。

| 函数 | 参数 | 含义 |
|---|---|---|
| expDens | P.mu | 指数密度，均值 mu |
| retainXL | P.M | min(x,M)，XL 自留 |
| cedeXL | P.M | (x−M)⁺，XL 分出 |
| payDeduct | P.d | (x−d)⁺，免赔额后赔付 |
| payDeductLimit | P.d,P.L | min((x−d)⁺,L)，免赔+限额 |
| quotaRetain | P.alpha | (1−α)x，成数自留 |
| quotaCede | P.alpha | αx，成数分出 |
| EretainXL | P.M,P.mu | E[min(X,M)]（readout） |
| EcedeXL | P.M,P.mu | E[(X−M)⁺]（readout） |
| EpayDeduct | P.d,P.mu | E[(X−d)⁺]（readout） |
| PcedeXL | P.M,P.mu | P(X>M)（readout） |
| poissonPMF | P.lambda | Poisson 概率（连续插值） |
| nbPMF | P.r,P.p | 负二项概率 |
| acfAR1 | P.phi | φ^k，AR(1) 理论 ACF |
| foreAR1 | P.xT,P.phi | xT·φ^h，AR(1) 预测衰减 |
| ridgeCoef | P.beta0 | β₀/(1+λ)，岭回归收缩 |
| lassoCoef | P.beta0 | sign·max(\|β₀\|−λ,0)，LASSO |
| biasSq | 无 | 偏差²随复杂度下降（x=复杂度） |
| varCurve | 无 | 方差随复杂度上升 |
| totalErr | 无 | 偏差²+方差，U 形 |
| ruinExp | P.R | e^(−Ru)，Lundberg 上界 |
| gevPDF | P.xi | GEV 密度（Ch16 已用） |
| lossDist | P.which,P.shape | 损失分布族密度（Ch15 已用） |

需要新函数？不要自己发明——在片段里用 `note` 说明需求并回报给我，我来扩展 engine.js。优先用现有函数组合。

## 5. live 映射写法

```js
live:(P,st)=>({
  param:"M="+P.M.toFixed(1)+"|自留额",                    // "主值|副标题"
  math:"E[自留]="+ (P.mu*(1-Math.exp(-P.M/P.mu))).toFixed(2) +"|E[min(X,M)]",
  real:(P.M>P.mu?"自留大头，再保只兜巨灾":"自留很少，几乎全分出")+"|风险切分"
})
```
- 三个 key（param/math/real）都可省略；值格式 `"主文本|副文本"`，`|` 前更新节点大字，后更新小字。
- 主文本 ≤20 字符，副文本 ≤16 字符。
- 用 `st` 里的引擎统计量（见各引擎注释）。
- **有滑块/下拉的引擎必须写 live**——这是"三层联动"的灵魂。

## 6. 风格要求

- 中文讲解 + 英文术语：「平稳性（Stationarity）」「超额赔款再保险（Excess of Loss, XL）」。
- hook 必须是具体场景：巨灾、车险、寿险、信评、监管资本……不要"我们来看一个分布"。
- 每章第一个 KP 用情境钩子把整章串起来；KP 之间按"具体→抽象→应用"排序。
- 时间序列章节：务必让学生**拖 φ 看 ACF 衰减/截尾**——这是本章的教学核心。
- 再保险章节：务必让学生**拖 M/α 看自留与分出曲线此消彼长 + 期望读数变化**。
- 风险模型章节：务必让学生**拖 λ/索赔强度看 S 分布右移变厚、拖 u 看破产路径变红**。
- ML 章节：偏差-方差用 totalErr 的 U 形曲线；LASSO/Ridge 用系数收缩路径（lassoCoef 会在某 λ 处归零→稀疏性，ridge 永不归零）。

## 7. 章节配色（series.color 用）

| 章 | 变量 | 色值 |
|---|---|---|
| Ch13 | var(--ch13) | #22d3ee |
| Ch14 | var(--ch14) | #2dd4bf |
| Ch18 | var(--ch18) | #4ade80 |
| Ch19 | var(--ch19) | #60a5fa |
| Ch20 | var(--ch20) | #38bdf8 |
| Ch21 | var(--ch21) | #f472b6 |

## 8. 自检（必做）

写 `_fragtest_ch<NN>.html`：

```html
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0b1526"><div id="app"></div>
<script src="engine.js"></script>
<script src="_kps_ch<NN>.js"></script>
<script>
var KPS=window.KPS_CH<NN>;
if(!KPS){ console.log("DIAG FRAGMENT-PARSE-FAIL"); }
else{
  var fails=0, quizTotal=0;
  KPS.forEach(function(kp){
    var d=document.createElement("div"); document.getElementById("app").appendChild(d);
    try{
      if(kp.engine) Engine.mount(d,kp.engine,{color:"#22d3ee",onState:function(){}});
      var q=(kp.quiz||[]).length; quizTotal+=q;
      if(q<3)console.log("DIAG WARN "+kp.id+" quiz="+q);
      if(!kp.chain||!kp.chain.param||!kp.chain.math||!kp.chain.real)console.log("DIAG WARN "+kp.id+" chain-incomplete");
      console.log("DIAG KP "+kp.id+" engine="+(kp.engine?kp.engine.type:"none")+" canvas="+d.querySelectorAll("canvas").length+" quiz="+q);
    }catch(e){ fails++; console.log("DIAG FAIL "+kp.id+": "+e.message); }
  });
  console.log("DIAG SUMMARY kps="+KPS.length+" quizTotal="+quizTotal+" fails="+fails);
}
</script></body></html>
```

运行（PowerShell）：
```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$url = [System.Uri]::EscapeUriString("file:///C:/Users/THINKPAD/cola/outputs/损失模型互动学习舱/_fragtest_ch<NN>.html")
& $chrome --headless=new --disable-gpu --no-sandbox --enable-logging=stderr --v=0 --virtual-time-budget=6000 --dump-dom $url | Out-Null
```
stderr 里看 `DIAG` 行。要求：`fails=0`、每个 curve/scatter/tsSim/compound/ruin KP 的 canvas≥1、quizTotal≥KP数×3。有 FAIL 就修到干净再回报。

## 9. 完整样板（Ch17 tail-dep，curve+live）

```js
{ id:"tail-dep", name:"尾部相依系数 λ", icon:"🧲", minutes:10,
  hook:"把 Clayton 和 Gaussian 都调到 τ=0.5——平时看起来一样。直到<b>一险种爆出巨损</b>，你才知道另一个跟不跟。λ 就是量化「跟不跟」的尺子。",
  intuition:"尾部相依系数（Tail Dependence）考察一个变量取极端值时另一个也极端的条件概率：<b>λ_L=lim C(q,q)/q（q→0）</b>。Clayton λ_L=2^(−1/θ)>0，Gaussian 恒为 0。",
  chain:{
    param:{lab:"参数", val:"Clayton θ", sub:"越大尾越粘"},
    math:{lab:"数学量", val:"λ_L=2^(−1/θ)", sub:"q→0 的极限"},
    real:{lab:"现象", val:"巨损是否成对出现", sub:"再保定价命门"}
  },
  engine:{type:"curve", title:"λ(q)=C(q,q)/q 随 q→0 收敛到 λ_L",
    x:{min:0.01,max:0.5,label:"q"}, y:{label:"λ(q)"}, ymin:0, ymax:1,
    series:[{label:"Clayton λ(q)", color:"var(--ch17)", fn:"lambdaClayton", width:3}],
    params:[{key:"theta", label:"Clayton 参数 θ", min:0.5, max:8, step:0.1, val:2}],
    readouts:[{label:"λ_L = 2^(−1/θ)", fn:"lambdaLClayton"}],
    live:(P)=>{ const l=Math.pow(2,-1/P.theta); return {param:"Clayton θ="+P.theta.toFixed(1)+"|θ越大尾越粘", math:"λ_L=2^(−1/θ)="+l.toFixed(3)+"|q→0 的极限", real:(l>0.6?"一险巨损，另一险大概率跟极端":"尾部联动较弱")+"|λ_L="+l.toFixed(2)}; },
    note:"q 越接近 0，λ(q) 越接近 λ_L。"}
}
```

照此质量水准创作。开始吧。
