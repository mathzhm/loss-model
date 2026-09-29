/* =====================================================================
   course.js —— LOSS LAB 全站唯一数据源
   index / learn / arena / wrong 四个页面全部读取本文件自动生成。

   ★ 加新章节：在 CHAPTERS 数组加一个 {...}；
   ★ 加新知识点：在某章 kps 数组加一个 {...}；四个页面自动更新。

   知识点(kp)字段：
     id,name,icon,minutes     基本信息
     hook                     情境钩子（精算业务故事，先于公式）
     intuition                直觉层讲解（可含 <span class=mono> 公式）
     chain:{param,math,real}  三层机制链（参数→数学量→现实现象）
     engine:{...}             实验引擎配置（curve/scatter/match/build/predict/hist/aggregate）
     drawers:{mechanism,math,code}  渐进披露抽屉（可选）
     quiz:[{q,opts,ans,why}]  自测题（答错自动进错题本）
   ===================================================================== */

const COURSE = {
  brand:"LOSS LAB",
  title:"损失模型 · CS2 互动学习舱",
  subtitle:"英国精算师 IFoA CS2（Risk Modelling & Survival Analysis）· 像玩游戏一样学精算",
  chapters:[

  /* ============================================================ Ch17 ★样板★ */
  {
    id:17, no:"Ch17", name:"Copula 相依结构", icon:"🔗", color:"var(--ch17)",
    weight:"Syllabus 1.3 · 核心难点", status:"live", pdf:"pdf/loss-model-ch17.pdf", qa:"qa/ch17-qa.html",
    desc:"把「各自的损失分布」和「它们如何联动」拆开建模。Sklar 定理、Archimedean 与椭圆家族、尾部相依——巨灾再保与信用险的命门。",
    kps:[

      { id:"joint-marginal", name:"联合分布与边缘分布", icon:"📐", minutes:7,
        demo:"demos/marginal.html",
        hook:"飓风登陆那年，<b>A 区与 B 区的财产险几乎同时报损</b>。光知道每区各自的损失分布还不够——你得知道它们<b>一起</b>怎么动。这正是联合分布要回答的。",
        intuition:"两个变量 X、Y 的行为有两层：<b>边缘分布</b> F<sub>X</sub>(x)、F<sub>Y</sub>(y) 描述各自轮廓；<b>联合分布</b> H(x,y)=P(X≤x, Y≤y) 描述它们「一起」的完整画面。连续情形下，对联合密度 f(x,y) 沿一个方向积分，就把另一个变量「积掉」，得到边缘密度。",
        chain:{
          param:{lab:"联合密度", val:"f(x,y)=(x+4y)/20", sub:"0≤x,y≤2"},
          math:{lab:"数学量", val:"f<sub>X</sub>(x)=∫f(x,y)dy", sub:"对 y 积分"},
          real:{lab:"现实现象", val:"A 区自己的损失轮廓", sub:"先看清个体，再谈联动"}
        },
        engine:{type:"curve", title:"把 y 积掉：拖动切片位置 y₀，看边缘密度为何不动",
          x:{min:0,max:2,label:"x"}, y:{label:"密度"},
          series:[
            {label:"联合密度切片 f(x, y₀)", color:"#7d93b5", fn:"jointSliceY"},
            {label:"边缘密度 f<sub>X</sub>(x)=(x+4)/10", color:"var(--ch17)", fn:"marginalX", width:3}
          ],
          params:[{key:"y0", label:"切片位置 y₀（上下拖动）", min:0, max:2, step:0.05, val:1}],
          live:(P)=>({param:'y₀='+(+P.y0).toFixed(2)+'|当前切片高度', math:'f<sub>X</sub>(x)=∫₀²f(x,y)dy=(x+4)/10|不随切片位置改变', real:'边缘密度 = 所有切片的「平均」|切片在动，边缘不动'}),
          note:"拖动 y₀：灰色切片线 f(x,y₀)=(x+4y₀)/20 随 y₀ 上下移动，但紫色边缘密度 f<sub>X</sub>(x)=(x+4)/10 纹丝不动——因为它是把 y 从 0 到 2 全部积分（平均）掉的结果。"
        },
        drawers:{
          mechanism:"联合 → 边缘的本质是<b>积分（求和）掉不关心的变量</b>。反之，仅凭两个边缘<b>无法</b>唯一还原联合分布——这正是后面需要 copula 的根本原因。",
          math:"f<sub>X</sub>(x)=∫<sub>-∞</sub><sup>∞</sup> f(x,y)dy；F<sub>X</sub>(x)=H(x,∞)。本例 f<sub>X</sub>(x)=(x+4)/10，f<sub>Y</sub>(y)=(1+4y)/10（不对称，因为原密度里 y 的权重是 4）。",
          code:"# R：数值积分求边缘\nf <- function(x,y)(x+4*y)/20\nfX <- function(x) integrate(function(y) f(x,y), 0, 2)$value\ncurve(fX, 0, 2)  # 与 (x+4)/10 重合"
        },
        quiz:[
      {q:"两个随机变量 X、Y 的联合分布函数 H(x,y) 定义为：", opts:["F<sub>X</sub>(x)·F<sub>Y</sub>(y)", "P(X≤x, Y≤y)", "F<sub>X</sub>(x)+F<sub>Y</sub>(y)", "联合密度 f(x,y)"], ans:1, why:"H(x,y)=P(X≤x, Y≤y)，描述两变量「一起」的完整画面；边缘之积仅在独立时才等于它。", lv:1},
      {q:"由联合密度 f(x,y) 求 X 的边缘密度 f<sub>X</sub>(x)，应当：", opts:["对 x 积分", "对 y 积分 ∫f(x,y)dy", "对 x 求偏导", "令 y=0"], ans:1, why:"把不关心的变量 y 在整个支撑上积掉，就留下 x 的轮廓 f<sub>X</sub>(x)=∫f(x,y)dy。", lv:1},
      {q:"连续随机变量 X、Y 相互独立的密度充要条件是：", opts:["f(x,y)=f<sub>X</sub>(x)+f<sub>Y</sub>(y)", "f(x,y)=f<sub>X</sub>(x)·f<sub>Y</sub>(y) 处处成立", "f<sub>X</sub>(x)=f<sub>Y</sub>(y)", "H(x,y)=0"], ans:1, why:"独立等价于联合密度可分解为两边缘密度之积；只要有一处不成立即不独立。", lv:1},
      {q:"边缘分布 F<sub>X</sub>(x) 用联合分布 H 表示为：", opts:["H(x, ∞)", "H(∞, x)", "H(x, x)", "H(x, 0)"], ans:0, why:"令 Y 取遍全体（y→∞）即把 Y 积掉，F<sub>X</sub>(x)=H(x,∞)；同理 F<sub>Y</sub>(y)=H(∞,y)。", lv:2},
      {q:"联合密度 f(x,y)=e<sup>−x−y</sup>（x,y>0），则 X 与 Y 是否独立？", opts:["独立，可分解为 e<sup>−x</sup>·e<sup>−y</sup>", "不独立，含交叉项", "无法判断", "仅当 x=y 时独立"], ans:0, why:"f=e<sup>−x</sup>·e<sup>−y</sup> 恰为两个 Exp(1) 边缘之积，故独立；能否分离变量是判断关键。", lv:2},
      {q:"设 f(x,y)=(x+4y)/20（0≤x,y≤2），边缘 f<sub>X</sub>(x)=(x+4)/10、f<sub>Y</sub>(y)=(1+4y)/10，则 X 与 Y：", opts:["独立", "不独立，因 f<sub>X</sub>(x)f<sub>Y</sub>(y)≠f(x,y)", "边缘不存在", "完全正相依"], ans:1, why:"f<sub>X</sub>f<sub>Y</sub>=(x+4)(1+4y)/100 含 4xy 项，≠(x+4y)/20，故不独立。", lv:2},
      {q:"设 f(x,y)=(x+4y)/20（0≤x,y≤2），则 H(1,1)=P(X≤1,Y≤1) 约为：", opts:["0.125", "0.25", "0.05", "0.5"], ans:0, why:"∫₀¹∫₀¹(x+4y)/20 dydx：内层得 (x+2)/20，再积分得 2.5/20=0.125。", lv:3},
      {q:"两个二维分布有完全相同的边缘分布和相同的 Pearson 相关系数 ρ，则它们的联合分布：", opts:["一定相同", "不一定相同，ρ 不足以唯一刻画相依结构", "一定不同", "仅当非正态时才不同"], ans:1, why:"边缘加单个 ρ 仍对应无数种相依结构（copula），这正是需要 copula 完整描述相依的原因。", lv:3},
      {q:"下列哪组信息能唯一确定连续 (X,Y) 的联合分布 H？", opts:["仅两个边缘 F<sub>X</sub>、F<sub>Y</sub>", "仅相关系数 ρ", "两个边缘 F<sub>X</sub>、F<sub>Y</sub> 加上 copula C", "仅联合密度在某点的取值"], ans:2, why:"由 Sklar 定理，边缘 + copula 才能拼出唯一联合分布；单靠边缘或 ρ 都不够。", lv:3}
    ],
        match:{pairs:[
          {l:"联合分布 H(x,y)", r:"P(X≤x, Y≤y)，两变量的完整画面"},
          {l:"边缘分布 F<sub>X</sub>(x)", r:"H(x, ∞)，只看 X 自己"},
          {l:"边缘密度 f<sub>X</sub>(x)", r:"∫ f(x,y) dy，积掉 Y"},
          {l:"Sklar 的伏笔", r:"边缘相同 ≠ 联合相同"}
        ]}
      },

      { id:"dependence-trap", name:"依赖的陷阱：Pearson vs 秩相关", icon:"🎯", minutes:9,
        demo:"demos/choose-copula.html",
        hook:"精算师用历史数据估出两险种损失的相关系数 ρ=0.8，觉得很安全。同事把损失单位从「元」换成「ln(元)」做了个单调变换——<b>ρ 突然变了</b>。到底谁在说谎？",
        intuition:"<b>Pearson 相关系数</b>只捕捉<b>线性</b>关系，且对单调非线性变换<b>不稳健</b>：把 X 换成 X³ 或 ln X，ρ 会改变。<b>秩相关</b>（Spearman ρ<sub>S</sub>、Kendall τ）只看「排名」，任何单调变换都不改变排名，因此<b>稳健</b>。Copula 恰好只编码排名层面的相依——这就是为什么它天生与秩相关绑定。",
        chain:{
          param:{lab:"变换", val:"X → X³（单调）", sub:"排名不变"},
          math:{lab:"数学量", val:"Pearson 变 / Spearman 不变", sub:"秩相关稳健"},
          real:{lab:"现实现象", val:"换个计量单位结论就翻车", sub:"线性相关的幻觉"}
        },
        engine:{type:"predict", title:"预测下注：单调变换后谁保持不变？",
          scenario:"对 (X,Y) 做单调变换 X→X³、Y→e<sup>Y</sup>。下面哪个相关度量<b>数值不变</b>？先下注，再看散点验证。",
          options:[
            {icon:"📉", label:"Pearson ρ", mini:"线性相关", correct:false},
            {icon:"🏅", label:"Spearman ρ<sub>S</sub>", mini:"秩相关", correct:true},
            {icon:"📐", label:"协方差 Cov", mini:"量纲敏感", correct:false},
            {icon:"📏", label:"方差 Var(X)", mini:"离散程度", correct:false}
          ],
          reveal:"单调变换不改变数据的<b>排名</b>。Spearman ρ<sub>S</sub> 与 Kendall τ 只依赖排名，因此纹丝不动；Pearson ρ 和协方差都依赖具体数值与量纲，一变就变。Copula 只描述排名层面的相依，所以它天然用秩相关来刻画。"
        },
        drawers:{
          mechanism:"Spearman ρ<sub>S</sub> = 对排名做 Pearson；Kendall τ = P(同序)−P(逆序)。两者都是 copula 的泛函：ρ<sub>S</sub>=12∫∫C dC−3，τ=4∫∫C dC−1，与边缘无关。",
          math:"对严格单调变换 g,h：C<sub>g(X),h(Y)</sub> = C<sub>X,Y</sub>（copula 不变）⇒ 秩相关不变；但 Corr(g(X),h(Y)) 一般 ≠ Corr(X,Y)。",
          code:"# R：验证\nx <- rnorm(500); y <- 0.8*x + 0.6*rnorm(500)\ncor(x,y)              # Pearson\ncor(x^3, exp(y))      # Pearson 变了\ncor(x,y,method='spearman')\ncor(x^3,exp(y),method='spearman')  # 完全相同"
        },
        quiz:[
      {q:"下列哪个相关度量只捕捉线性关系、对单调非线性变换不稳健？", opts:["Spearman 秩相关 ρ<sub>S</sub>", "Kendall τ", "Pearson 相关系数 ρ", "三者都只捕捉线性"], ans:2, why:"Pearson ρ 只度量线性相关，把 X 换成 X³ 或 lnX 会改变它；秩相关则稳健。", lv:1},
      {q:"Kendall τ（与 Spearman ρ<sub>S</sub>）的取值范围是：", opts:["[0, 1]", "[−1, 1]", "[−1, 0]", "(0, +∞)"], ans:1, why:"二者都是标准化关联系数：+1 完全正关联、−1 完全负关联、0 无关联。", lv:1},
      {q:"完全正单调相关（同单调）时，Kendall τ 与 Spearman ρ<sub>S</sub> 的值：", opts:["τ=1 且 ρ<sub>S</sub>=1", "τ=0 且 ρ<sub>S</sub>=0", "τ=1 但 ρ<sub>S</sub>=0", "两者都无界"], ans:0, why:"所有数据对都同序，同序对概率为 1、秩完全一致，故 τ=ρ<sub>S</sub>=1。", lv:1},
      {q:"对 (X,Y) 同时做严格单调变换（如 X→X³、Y→e<sup>Y</sup>）后，下列哪个量一般会改变？", opts:["Spearman ρ<sub>S</sub>", "Kendall τ", "数据的秩", "Pearson 相关系数 ρ"], ans:3, why:"单调变换不改变排名，秩相关与秩都不变；Pearson ρ 依赖具体数值与量纲，会变。", lv:2},
      {q:"n=5 对数据，秩差平方和 Σd²=34，则 Spearman ρ<sub>S</sub>=1−6Σd²/[n(n²−1)] 为：", opts:["−0.7", "0.7", "−0.34", "1.7"], ans:0, why:"ρ<sub>S</sub>=1−6×34/(5×24)=1−204/120=1−1.7=−0.7，明显负秩相关。", lv:2},
      {q:"10 对数据中同序对 n<sub>c</sub>=42、异序对 n<sub>d</sub>=3，则 Kendall τ 约为：", opts:["0.867", "0.39", "0.933", "−0.867"], ans:0, why:"τ=(n<sub>c</sub>−n<sub>d</sub>)/[n(n−1)/2]=(42−3)/45=39/45≈0.867，强正秩相关。", lv:2},
      {q:"Gaussian copula 参数 ρ=0.5 时，Kendall τ=(2/π)arcsin ρ 约为：", opts:["0.5", "0.333", "0.637", "0.25"], ans:1, why:"τ=(2/π)arcsin(0.5)=(2/π)(π/6)=1/3≈0.333，比 Pearson ρ 小约 1/3。", lv:3},
      {q:"Pearson 相关系数 ρ=0，能否推出 X、Y 独立？", opts:["能，ρ=0 即独立", "不能，ρ 只度量线性相关，仍可能有非线性或尾部相依", "能，ρ=0 表示完全负相关", "不能，ρ=0 时 copula 不存在"], ans:1, why:"ρ=0 仅表示无线性相关；除非联合正态，否则仍可能存在非线性相依（copula 可非独立）。", lv:3},
      {q:"Copula 的相依结构天然用秩相关（τ、ρ<sub>S</sub>）而非 Pearson ρ 刻画，根本原因是：", opts:["秩相关计算更快", "Copula 在边缘的严格单调变换下不变，只编码排名层面的相依", "Pearson ρ 总是为 0", "秩相关总是等于 1"], ans:1, why:"Copula 与秩相关都是边缘单调变换下的不变量，二者同构；Pearson 依赖边缘具体数值。", lv:3}
    ]
      },

      { id:"pit", name:"概率积分变换 PIT", icon:"🧪", minutes:8,
        demo:"demos/pit.html",
        hook:"损失数据有的偏斜（指数）、有的厚尾（Pareto），形状千奇百怪，没法直接比较它们的「相依」。<b>有没有一台洗衣机，能把任何分布洗成同一种标准形状？</b>有——概率积分变换。",
        intuition:"关键定理：若 X 连续、分布函数为 F<sub>X</sub>，则 <b>U = F<sub>X</sub>(X) ~ Uniform(0,1)</b>。把每个观测用它自己的 CDF「重新打分」，无论原始分布多偏斜，结果都落在 [0,1] 上且<b>均匀</b>。这一步把「边缘的形状」彻底洗掉，只留下纯粹的相依结构——copula 就住在这个 [0,1]² 方块里。",
        chain:{
          param:{lab:"原始 X", val:"X ~ Exp(λ)", sub:"偏斜分布"},
          math:{lab:"变换", val:"U = F<sub>X</sub>(X) = 1−e<sup>−λX</sup>", sub:"用自己的 CDF 打分"},
          real:{lab:"结果", val:"U ~ Uniform(0,1)", sub:"任何分布都洗成均匀"}
        },
        engine:{type:"hist", title:"亲眼看见：把指数分布「洗」成均匀分布",
          sample:"exp", transform:"pit", bins:20, n:4000,
          param:{key:"lam", label:"指数分布参数 λ", min:0.3, max:3, step:0.1, val:1},
          live:(P)=>({param:'λ='+(+P.lam).toFixed(1)+'|指数分布偏斜程度', math:'U=1−e<sup>−λX</sup>|无论λ多少都均匀', real:'边缘形状被彻底洗掉|直方图趋于水平线'}),
          note:"无论 λ 取多少，U=F<sub>X</sub>(X)=1−e<sup>−λX</sup> 的直方图都近似<b>一条水平线</b>（均匀分布）。偏斜被完全洗掉。"
        },
        drawers:{
          mechanism:"PIT 是 copula 的「入场券」：先把每个边缘 PIT 成均匀，再在 [0,1]² 上研究相依。反向地，给定 U~Unif 和想要的边缘 F，X=F⁻¹(U) 就能造出该边缘——这是模拟 copula 数据的核心。",
          math:"P(U≤u)=P(F<sub>X</sub>(X)≤u)=P(X≤F<sub>X</sub>⁻¹(u))=F<sub>X</sub>(F<sub>X</sub>⁻¹(u))=u，故 U~Unif(0,1)。要求 F<sub>X</sub> 连续。",
          code:"# R：PIT 验证\nx <- rexp(5000, rate=1)\nu <- pexp(x, rate=1)   # = 1-exp(-x)\nhist(u, breaks=20)     # 近似均匀\nks.test(u,'punif')     # p 值很大 ⇒ 不拒绝均匀"
        },
        quiz:[
      {q:"概率积分变换 U=F<sub>X</sub>(X) 严格服从 Uniform(0,1) 要求 X 的分布函数 F<sub>X</sub>：", opts:["连续", "离散", "对称", "厚尾"], ans:0, why:"PIT 定理要求 F<sub>X</sub> 连续，才能保证 U=F<sub>X</sub>(X) 的 CDF 恰为 F<sub>U</sub>(u)=u（严格均匀）。", lv:1},
      {q:"对 X~Exp(λ) 做 U=F<sub>X</sub>(X)=1−e<sup>−λX</sup>，则 U 的分布是：", opts:["仍为 Exp(λ)", "Uniform(0,1)，与 λ 无关", "标准正态", "依赖 λ 的某种分布"], ans:1, why:"无论 λ 取何值，U=F<sub>X</sub>(X) 都被洗成 Uniform(0,1)，偏斜被完全去除。", lv:1},
      {q:"PIT 变换 U=F<sub>X</sub>(X) 的取值范围是：", opts:["[0, 1]", "(−∞, +∞)", "[0, +∞)", "[−1, 1]"], ans:0, why:"F<sub>X</sub> 是 CDF，取值落在 [0,1]，故 U 必在单位区间，这正是 copula 的定义域。", lv:1},
      {q:"Copula 模拟中先在 [0,1]² 抽 (U,V)~C，再令 X=F<sub>X</sub>⁻¹(U)、Y=F<sub>Y</sub>⁻¹(V)，这一步的作用是：", opts:["把数据洗成均匀", "把均匀的相依样本套上指定的边缘分布", "消除异常值", "增大样本量"], ans:1, why:"逆变换法：F⁻¹ 把均匀变量还原成目标边缘；相依结构已由 copula 编码在 (U,V) 中。", lv:2},
      {q:"证明 U=F<sub>X</sub>(X)~Unif 的关键一步 P(U≤u)=u 依赖于：", opts:["F<sub>X</sub>(F<sub>X</sub>⁻¹(u))=u（F 与其逆复合还原）", "X 服从正态", "u 必须等于 0.5", "方差有限"], ans:0, why:"P(F<sub>X</sub>(X)≤u)=P(X≤F<sub>X</sub>⁻¹(u))=F<sub>X</sub>(F<sub>X</sub>⁻¹(u))=u，故 F<sub>U</sub>(u)=u 即均匀分布。", lv:2},
      {q:"IFM 中伪观测值用 rank(xᵢ)/(n+1) 而非 rank(xᵢ)/n，主要是为了：", opts:["加快收敛", "避免 CDF 估计值等于 1（否则 copula 对数似然无定义）", "使秩为整数", "消除量纲"], ans:1, why:"rank/n 可能取到 1，导致 copula 密度为 0、对数似然发散；除以 n+1 是常用修正。", lv:2},
      {q:"若 X 是离散随机变量，则 U=F<sub>X</sub>(X) 是否仍严格服从 Uniform(0,1)？", opts:["是，任何分布都成立", "否，离散时 F<sub>X</sub>(X) 不连续、不严格均匀（PIT 要求连续边缘）", "是，但方差变大", "否，会变成正态"], ans:1, why:"PIT 的严格均匀性依赖 F<sub>X</sub> 连续；离散边缘有跳跃，U 只取有限值、非均匀。", lv:3},
      {q:"对连续 (X,Y) 做 U=F<sub>X</sub>(X)、V=F<sub>Y</sub>(Y) 后，(U,V) 的联合分布函数恰为：", opts:["独立 copula uv", "原联合分布 H(x,y)", "Copula C(u,v)", "两边缘之积"], ans:2, why:"PIT 把边缘洗均匀后，(U,V) 的联合分布就是 copula C(u,v)=P(U≤u,V≤v)。", lv:3},
      {q:"用同一个 U~Unif(0,1) 令 X=F<sub>X</sub>⁻¹(U)、Y=F<sub>Y</sub>⁻¹(U)，则 (X,Y) 的 copula 为：", opts:["独立 copula uv", "Fréchet 上界 C⁺=min(u,v)（同单调）", "Fréchet 下界", "Clayton"], ans:1, why:"同一 U 使两变量百分位完全锁死（U≡V），即完全正相依，copula 为上界 min(u,v)。", lv:3}
    ]
      },

      { id:"sklar", name:"Sklar 定理：解耦的艺术", icon:"🧩", minutes:10,
        demo:"demos/marginal.html",
        hook:"现在你手里有两样东西：每个险种<b>各自的损失分布</b>（边缘），和它们<b>如何联动</b>（相依）。Sklar 定理说：这两样可以<b>完全分开建模，再拼回去</b>——这是整个 copula 理论的基石。",
        intuition:"<b>Sklar 定理</b>：任何联合分布都能写成 H(x,y) = C(F<sub>X</sub>(x), F<sub>Y</sub>(y))。即「联合 = copula ∘ 边缘」。连续边缘下 C 唯一。这意味着：① 你可以分别挑选合适的边缘和合适的 copula；② 换边缘不动相依，换 copula 不动边缘。下面拖动滑块，<b>固定 copula 换边缘</b>、<b>固定边缘换 copula</b>，看两件事如何独立变化。",
        chain:{
          param:{lab:"两块积木", val:"边缘 F<sub>X</sub>,F<sub>Y</sub> + copula C", sub:"分别挑选"},
          math:{lab:"拼装", val:"H(x,y)=C(F<sub>X</sub>(x),F<sub>Y</sub>(y))", sub:"Sklar 定理"},
          real:{lab:"威力", val:"边缘与相依可独立建模", sub:"灵活性的来源"}
        },
        engine:{type:"scatter", title:"解耦实验：[0,1]² 上的相依结构",
          family:"clayton", n:500,
          params:[{key:"theta", label:"Copula 参数 θ（相依强度）", min:0.2, max:8, step:0.1, val:2}],
          live:(P,st)=>({param:'Clayton θ='+(+P.theta).toFixed(1)+'|相依强度', math:'τ='+(st.tau==null?'—':st.tau.toFixed(2))+' λ<sub>L</sub>='+(st.lambdaL||0).toFixed(2)+'|copula 编码相依', real:'边缘已洗均匀，散点纯反映相依|换 θ 改变抱团强度'}),
          note:"这里展示的是 PIT 之后的世界：边缘都已是 Uniform(0,1)，散点形状<b>纯粹</b>反映相依结构。调 θ 看 Clayton 如何把点往左下角拉。换 copula 家族（见下站）会改变「往哪个角拉」。"
        },
        drawers:{
          mechanism:"解耦的工程意义：建模巨灾聚合损失时，可单独为每个险种选 Pareto 边缘（厚尾），再单独选 Gumbel copula（上尾相依），两者互不干扰。这是 copula 相对多元正态的最大优势。",
          math:"Sklar：H(x,y)=C(F<sub>X</sub>(x),F<sub>Y</sub>(y))；若边缘连续则 C 唯一，且 C(u,v)=H(F<sub>X</sub>⁻¹(u),F<sub>Y</sub>⁻¹(v))。",
          code:"# R：用 copula 包拼装\nlibrary(copula)\ncop <- claytonCopula(param=2, dim=2)\nmrg <- list(function(n) rexp(n,1), function(n) rexp(n,1))\nX <- rCopula(500, cop)  # [0,1]^2 上的相依\n# 再套边缘 qexp 即得实际损失"
        },
        quiz:[
      {q:"Sklar 定理把联合分布表示为：", opts:["H(x,y)=F<sub>X</sub>(x)·F<sub>Y</sub>(y)", "H(x,y)=C(F<sub>X</sub>(x), F<sub>Y</sub>(y))", "H(x,y)=C(x, y)", "H(x,y)=F<sub>X</sub>(x)+F<sub>Y</sub>(y)−C"], ans:1, why:"Sklar：联合 = copula ∘ 边缘，即 H(x,y)=C(F<sub>X</sub>(x),F<sub>Y</sub>(y))。", lv:1},
      {q:"Sklar 定理保证 copula C 唯一的条件是：", opts:["边缘分布全部连续", "边缘服从正态", "两个边缘相同", "样本量足够大"], ans:0, why:"边缘连续时 C 唯一；若边缘有离散分量，C 存在但不唯一。", lv:1},
      {q:"Sklar 定理的核心意义是：", opts:["联合分布无法分解", "联合分布可拆为边缘 + 相依结构（copula），二者可分开建模", "边缘决定一切", "copula 依赖边缘形状"], ans:1, why:"Sklar 把「各自分布」与「如何联动」彻底解耦，可分别挑选边缘与 copula。", lv:1},
      {q:"已知联合分布 H 与连续边缘 F<sub>X</sub>、F<sub>Y</sub>，copula 可反表示为：", opts:["C(u,v)=H(F<sub>X</sub>⁻¹(u), F<sub>Y</sub>⁻¹(v))", "C(u,v)=H(u, v)", "C(u,v)=F<sub>X</sub>(u)F<sub>Y</sub>(v)", "C(u,v)=H(F<sub>X</sub>(u), F<sub>Y</sub>(v))"], ans:0, why:"令 x=F<sub>X</sub>⁻¹(u)、y=F<sub>Y</sub>⁻¹(v) 代入 H=C(F<sub>X</sub>,F<sub>Y</sub>) 即得 C(u,v)=H(F<sub>X</sub>⁻¹(u),F<sub>Y</sub>⁻¹(v))。", lv:2},
      {q:"Sklar 逆定理：任取 copula C 与任意一维分布 F<sub>X</sub>、F<sub>Y</sub>，则 H(x,y)=C(F<sub>X</sub>(x),F<sub>Y</sub>(y))：", opts:["不是合法联合分布", "是合法联合分布，且边缘恰为 F<sub>X</sub>、F<sub>Y</sub>", "边缘会改变", "仅当 C 为正态时成立"], ans:1, why:"逆定理保证任意 copula 搭配任意边缘都生成合法联合分布，边缘正好是给定的 F<sub>X</sub>、F<sub>Y</sub>。", lv:2},
      {q:"在 Sklar 框架下，保持 copula 不变、把边缘从指数换成 Pareto，则：", opts:["相依结构（秩相关、尾部相依）不变，仅边缘形状改变", "相依结构剧烈改变", "联合分布不变", "copula 随之改变"], ans:0, why:"copula 只描述 [0,1]² 上的相依，与边缘形状无关；换边缘不动相依。", lv:2},
      {q:"当边缘分布含离散分量时，Sklar 定理中的 copula C：", opts:["唯一", "存在但不唯一", "不存在", "必为独立 copula"], ans:1, why:"Sklar 只保证连续边缘下 C 唯一；离散边缘时 C 存在但一般不唯一。", lv:3},
      {q:"下列哪一项不是 Sklar 定理的内容？", opts:["分解式 H=C(F<sub>X</sub>,F<sub>Y</sub>)", "连续边缘下 copula 唯一", "逆定理：任意 copula + 边缘构造合法联合", "copula 必须是 Gaussian 形式"], ans:3, why:"Sklar 对 copula 形式无任何限制（可为 Clayton、t 等）；前三项才是定理内容。", lv:3},
      {q:"相对多元正态分布，copula 建模（Sklar 解耦）的最大优势是：", opts:["计算更快", "边缘分布与相依结构可分别独立选择（如厚尾边缘 + 上尾 copula）", "参数更少", "不需要数据"], ans:1, why:"可单独为每险种选 Pareto 厚尾边缘、再单独选 Gumbel 上尾 copula，互不干扰。", lv:3}
    ]
      },

      { id:"basic-copula", name:"基础 Copula：独立与 Fréchet 界", icon:"🚧", minutes:8,
        demo:"demos/choose-copula.html",
        hook:"在认识花哨的 copula 家族前，先认识三个「地标」：<b>完全无关</b>、<b>完全正相依</b>、<b>完全负相依</b>。任何 copula 都被夹在上下界之间——这给你一把衡量「相依有多强」的尺子。",
        intuition:"三个基础 copula：① <b>独立</b> C⊥=uv（τ=0）；② <b>Fréchet 上界</b> C⁺=min(u,v)（完全正相依，τ=1）；③ <b>Fréchet 下界</b> C⁻=max(u+v−1,0)（完全负相依，τ=−1）。任何 copula 都满足 C⁻ ≤ C ≤ C⁺。下图画出三者沿对角线 C(u,u) 的取值——这是后面理解尾部相依的同一根坐标轴。",
        chain:{
          param:{lab:"相依强度", val:"τ ∈ [−1, 1]", sub:"从负到正"},
          math:{lab:"三条曲线", val:"C⁻ ≤ C ≤ C⁺", sub:"Fréchet 界"},
          real:{lab:"意义", val:"给相依强度一把尺子", sub:"任何 copula 都在界内"}
        },
        engine:{type:"curve", title:"沿对角线 C(u,u)：三个地标",
          x:{min:0,max:1,label:"u"}, y:{label:"C(u,u)"},
          series:[
            {label:"Fréchet 上界 C⁺=min(u,v)（完全正相依）", color:"var(--bad)", fn:"frechetUpper", width:2},
            {label:"独立 C⊥=uv", color:"var(--muted)", fn:"indep", width:2},
            {label:"Fréchet 下界 C⁻=max(2u−1,0)（完全负相依）", color:"var(--ch13)", fn:"frechetLower", width:2},
            {label:"Clayton C<sub>θ</sub>(u,u)（拖动 θ）", color:"var(--ch17)", fn:"claytonDiag", width:3}
          ],
          params:[{key:"theta", label:"Clayton 参数 θ（相依强度）", min:0.1, max:8, step:0.1, val:1}],
          live:(P)=>{ const t=+P.theta; const tau=t/(t+2); return {param:'Clayton θ='+t.toFixed(1)+'|相依强度旋钮', math:'τ=θ/(θ+2)='+tau.toFixed(2)+'|对角线向上界抬升', real:(tau>0.6?'强相依：分散化几乎失效':'中等相依：分散化仍有效')+'|始终夹在 Fréchet 界内'}; },
          note:"拖动 θ：金色曲线是真实 Clayton copula 的对角线 C<sub>θ</sub>(u,u)。θ→0 它贴近独立线 uv；θ→∞ 逼近上界 u。尾部相依系数正是看 C(u,u) 在 u→0 或 u→1 时贴近哪条界。"
        },
        drawers:{
          mechanism:"Fréchet 界给出相依的「物理极限」。若两险种损失完全同步（C⁺），分散化完全失效；若独立（uv），分散化有效。真实 copula 介于两者之间，靠近哪条界决定极端联动强度。",
          math:"max(u+v−1,0) ≤ C(u,v) ≤ min(u,v)。C⁺ 对应 τ=1，C⁻ 对应 τ=−1，C⊥ 对应 τ=0。",
          code:"# 三条对角线曲线\nu <- seq(0,1,len=200)\nplot(u, pmin(u,u), type='l', col='red')   # 上界=u\nlines(u, u*u, col='gray')                  # 独立\nlines(u, pmax(2*u-1,0), col='steelblue')   # 下界"
        },
        quiz:[
      {q:"Fréchet 上界 C⁺(u,v)（完全正相依）等于：", opts:["min(u, v)", "uv", "max(u+v−1, 0)", "u+v"], ans:0, why:"上界 C⁺=min(u,v)，对应同单调 U≡V，联合概率坍缩为较紧的那个约束。", lv:1},
      {q:"Fréchet 下界 C⁻(u,v)（完全负相依）等于：", opts:["min(u, v)", "uv", "max(u+v−1, 0)", "1−uv"], ans:2, why:"下界 C⁻=max(u+v−1,0)，来自 Bonferroni 不等式 P(A∩B)≥P(A)+P(B)−1。", lv:1},
      {q:"独立 copula C⊥(u,v)=uv 对应的 Kendall τ 与 Spearman ρ<sub>S</sub>：", opts:["都为 1", "都为 0", "τ=1, ρ<sub>S</sub>=0", "τ=−1, ρ<sub>S</sub>=1"], ans:1, why:"独立无任何关联，秩相关与 Kendall τ 均为 0，尾部相依也为 0。", lv:1},
      {q:"Fréchet 上界 C⁺(0.7, 0.4) 的值为：", opts:["0.4", "0.7", "0.28", "0.1"], ans:0, why:"C⁺=min(0.7,0.4)=0.4：两条件中较严的（较小者）自动包含另一个。", lv:2},
      {q:"Fréchet 下界 C⁻（完全负相依）的 Kendall τ 与 Spearman ρ<sub>S</sub> 分别为：", opts:["τ=1, ρ<sub>S</sub>=1", "τ=−1, ρ<sub>S</sub>=−1", "τ=0, ρ<sub>S</sub>=0", "τ=−1, ρ<sub>S</sub>=1"], ans:1, why:"完全反单调（V=1−U）使秩完全反向，τ=ρ<sub>S</sub>=−1。", lv:2},
      {q:"设 u=0.3、v=0.5，则下界、独立 copula、上界三者大小关系为：", opts:["0 ≤ uv=0.15 ≤ min=0.3", "uv=0.15 ≤ 0 ≤ 0.3", "0.3 ≤ 0.15 ≤ 0", "0 ≤ 0.3 ≤ 0.15"], ans:0, why:"max(u+v−1,0)=max(−0.2,0)=0 ≤ uv=0.15 ≤ min(u,v)=0.3，满足 Fréchet-Hoeffding 界。", lv:2},
      {q:"Fréchet 下界（完全负相依）的尾部相依系数 λ<sub>L</sub>、λ<sub>U</sub> 等于：", opts:["−1", "0", "1", "0.5"], ans:1, why:"λ 是概率、恒在 [0,1]；完全负相依指反向极端（一高一低），同向尾部从不同时出现，故 λ=0。", lv:3},
      {q:"关于 Fréchet 下界 C⁻(u,v)=max(u+v−1,0)，下列说法正确的是：", opts:["在任意维度都是有效 copula", "仅在二维是有效 copula，d≥3 时一般不再是有效 copula", "仅在三维有效", "从不是有效 copula"], ans:1, why:"C⁻ 在二维满足 2-递增性是合法 copula；d≥3 无法满足高维非负概率条件。", lv:3},
      {q:"若 U~Unif(0,1)，令 V=1−U，则 (U,V) 的 copula 是：", opts:["Fréchet 上界 min(u,v)", "Fréchet 下界 max(u+v−1,0)", "独立 copula uv", "Gumbel"], ans:1, why:"V=1−U 是反单调（完全负相依），其 copula 恰为下界 C⁻=max(u+v−1,0)。", lv:3}
    ]
      },

      { id:"archimedean", name:"Archimedean 家族：Clayton / Gumbel / Frank", icon:"🌀", minutes:12,

        demo:"demos/archimedean.html",
        hook:"巨灾再保关心<b>大额索赔同时爆发</b>（上尾），信用险关心<b>衰退期同时违约</b>（下尾）。三种主流 Archimedean copula 各有所长——<b>拖动 θ，看散点往哪个角抱团</b>，你就记住了它们。",
        intuition:"Archimedean copula 用生成元 φ 显式构造 C(u,v)=φ⁻¹(φ(u)+φ(v))，只需一个参数 θ：<b>Clayton</b> 下尾相依（左下角抱团，信用险/巨灾同损）；<b>Gumbel</b> 上尾相依（右上角抱团，巨灾再保大额）；<b>Frank</b> 无尾相依、可正可负（整体相关但两端不粘）。切换家族、拖动 θ，观察散点与 τ、λ 同步变化。",
        chain:{
          param:{lab:"参数 θ", val:"Clayton θ>0 / Gumbel θ≥1", sub:"生成元 φ 的旋钮"},
          math:{lab:"数学量", val:"τ=θ/(θ+2)（Clayton）", sub:"λ<sub>L</sub>=2<sup>−1/θ</sup>, λ<sub>U</sub>=0"},
          real:{lab:"现象", val:"衰退期多债务人同时违约", sub:"下尾同损"}
        },
        engine:{type:"scatter", title:"家族图鉴：切换家族 + 拖动 θ",
          family:"selectable", n:600,
          families:["clayton","gumbel","frank"],
          params:[{key:"theta", label:"参数 θ", min:0.2, max:8, step:0.1, val:2}],
          readouts:["tau","lambdaL","lambdaU"],
          live:(P,st)=>{ const nm={clayton:'Clayton',gumbel:'Gumbel',frank:'Frank'}[st.family]||st.family;
            let real; if(st.family==='clayton')real='衰退期多债务人同时违约（下尾同损）|左下角抱团，λ<sub>L</sub>='+st.lambdaL.toFixed(2);
            else if(st.family==='gumbel')real='巨灾致多保单同时大额索赔（上尾）|右上角抱团，λ<sub>U</sub>='+st.lambdaU.toFixed(2);
            else real='温和相关风险因子，两端不粘|无尾相依 λ=0';
            return {param:nm+' θ='+(+P.theta).toFixed(1)+'|相依强度旋钮', math:'λ<sub>L</sub>='+st.lambdaL.toFixed(2)+' λ<sub>U</sub>='+st.lambdaU.toFixed(2)+'|τ='+(st.tau==null?'—':st.tau.toFixed(2)), real}; },
          note:"🔵 Clayton：θ↑ 左下角越粘（λ<sub>L</sub>=2<sup>−1/θ</sup>>0，λ<sub>U</sub>=0）。🔴 Gumbel：θ↑ 右上角越粘（λ<sub>U</sub>=2−2<sup>1/θ</sup>>0，λ<sub>L</sub>=0）。Frank：两端都不粘（λ<sub>L</sub>=λ<sub>U</sub>=0），θ<0 时负相关。"
        },
        drawers:{
          mechanism:"选型口诀：<b>下尾同损选 Clayton，上尾大额选 Gumbel，对称无尾选 Frank</b>。θ 都控制相依强度：Clayton/Gumbel θ→0(或1)→独立，θ→∞→完全正相依。",
          math:"Clayton C=(u<sup>−θ</sup>+v<sup>−θ</sup>−1)<sup>−1/θ</sup>，τ=θ/(θ+2)；Gumbel C=exp{−[(−lnu)<sup>θ</sup>+(−lnv)<sup>θ</sup>]<sup>1/θ</sup>}，τ=1−1/θ；Frank 含 Debye 积分。生成元：Clayton φ=(t<sup>−θ</sup>−1)/θ，Gumbel φ=(−ln t)<sup>θ</sup>。",
          code:"# R：三个家族散点\nlibrary(copula)\nfor(f in list(claytonCopula(3), gumbelCopula(3), frankCopula(3))){\n  plot(rCopula(600,f), main=class(f)); Sys.sleep(1)\n}"
        },
        quiz:[
      {q:"Clayton copula 主要刻画哪种尾部相依？", opts:["下尾相依", "上尾相依", "对称双尾相依", "无尾相依"], ans:0, why:"Clayton λ<sub>L</sub>=2<sup>−1/θ</sup>>0、λ<sub>U</sub>=0，专管左下角抱团（共同下跌/同时违约）。", lv:1},
      {q:"Gumbel copula 主要刻画哪种尾部相依？", opts:["下尾相依", "上尾相依", "对称双尾相依", "无尾相依"], ans:1, why:"Gumbel λ<sub>U</sub>=2−2<sup>1/θ</sup>>0、λ<sub>L</sub>=0，右上角抱团，适合巨灾大额同时索赔。", lv:1},
      {q:"Frank copula 的尾部相依特征是：", opts:["强下尾相依", "强上尾相依", "无尾相依（λ<sub>L</sub>=λ<sub>U</sub>=0），但可正可负", "对称双尾相依"], ans:2, why:"Frank 两端都不粘（λ=0），整体对称相关，θ 可取负以刻画负相关。", lv:1},
      {q:"Clayton copula 参数 θ=2 时，Kendall τ=θ/(θ+2) 为：", opts:["0.5", "0.67", "0.25", "2"], ans:0, why:"τ=2/(2+2)=0.5；Clayton 的 τ 由 θ/(θ+2) 给出，θ↑ 则 τ↑ 趋近 1。", lv:2},
      {q:"Gumbel copula 参数 θ=4 时，Kendall τ=1−1/θ 为：", opts:["0.75", "0.25", "0.8", "0.5"], ans:0, why:"τ=1−1/4=0.75；Gumbel 的 τ=1−1/θ，θ=1 时为 0（独立）。", lv:2},
      {q:"Clayton 与 Gumbel copula 退化为独立 copula 的参数条件分别是：", opts:["两者都 θ→0", "Clayton θ→0⁺，Gumbel θ=1", "两者都 θ=1", "Clayton θ=1，Gumbel θ→0"], ans:1, why:"Clayton θ∈(0,∞) 以 θ→0 趋独立；Gumbel θ∈[1,∞) 以 θ=1 即独立。", lv:2},
      {q:"Clayton(θ) 的下尾与上尾相依系数分别为：", opts:["λ<sub>L</sub>=2<sup>−1/θ</sup>>0，λ<sub>U</sub>=0", "λ<sub>L</sub>=0，λ<sub>U</sub>=2−2<sup>1/θ</sup>", "λ<sub>L</sub>=λ<sub>U</sub>=2<sup>−1/θ</sup>", "λ<sub>L</sub>=λ<sub>U</sub>=0"], ans:0, why:"Clayton 只有下尾相依 λ<sub>L</sub>=2<sup>−1/θ</sup>；上尾 λ<sub>U</sub>=0。别与 Gumbel 的上尾公式记反。", lv:3},
      {q:"建模『衰退期多债务人同时违约』与『牛市多资产同时暴涨』，最合适的 copula 依次是：", opts:["Gumbel、Clayton", "Clayton、Gumbel", "Frank、Frank", "t、Gaussian"], ans:1, why:"同时违约是下尾同损选 Clayton；同时暴涨是上尾同步选 Gumbel。", lv:3},
      {q:"下列 Archimedean copula 中，唯一能刻画负相关（参数可取负）的是：", opts:["Clayton", "Gumbel", "Frank", "三者都不能"], ans:2, why:"Clayton θ>0、Gumbel θ≥1 只能正相关；Frank θ 可取任意非零实数，θ<0 时负相关。", lv:3}
    ]
      },

      { id:"elliptical", name:"椭圆家族：Gaussian 与 t", icon:"🥚", minutes:10,
        demo:"demos/choose-copula.html",
        hook:"2008 年金融危机暴露了一个致命误区：用 <b>Gaussian copula</b> 建模的机构，严重<b>低估了极端时刻的联动</b>。问题出在哪？——高斯的尾巴是「各自逃命」的。",
        intuition:"椭圆族由多元分布经 Sklar 反推得到。<b>Gaussian copula</b>：参数 ρ，但 |ρ|<1 时 <b>λ<sub>L</sub>=λ<sub>U</sub>=0</b>——无论平时多相关，极端时尾部相依为零（各自逃命），这正是它低估巨灾联动的原因。<b>t copula</b>：多一个自由度 ν，<b>对称双尾相依</b>，ν 越小尾巴越厚、极端联动越强；ν→∞ 退化为 Gaussian。",
        chain:{
          param:{lab:"参数", val:"ρ∈[−1,1], ν>0（t）", sub:"相关 + 自由度"},
          math:{lab:"数学量", val:"Gaussian λ=0 / t λ>0", sub:"尾部相依有无"},
          real:{lab:"现象", val:"危机时同步崩盘（t 能捕捉）", sub:"高斯低估极端联动"}
        },
        engine:{type:"scatter", title:"椭圆族：Gaussian vs t，拖动 ρ 与 ν",
          family:"selectable", n:600,
          families:["gaussian","t"],
          params:[
            {key:"rho", label:"相关系数 ρ", min:-0.9, max:0.9, step:0.05, val:0.6},
            {key:"nu", label:"t 自由度 ν（越小尾越厚）", min:2, max:30, step:1, val:4}
          ],
          readouts:["tau","lambdaU"],
          live:(P,st)=>{ if(st.family==='gaussian')return {param:'Gaussian ρ='+(+P.rho).toFixed(2)+'|相关但无尾', math:'τ='+st.tau.toFixed(2)+' · λ=0|极端时各自逃命', real:'平时相关，危机各自崩|λ=0：低估巨灾联动'};
            return {param:'t ρ='+(+P.rho).toFixed(2)+', ν='+P.nu+'|相关+尾厚', math:'τ='+st.tau.toFixed(2)+' · λ='+st.lambdaU.toFixed(2)+'|ν越小尾越厚', real:'危机时同步崩盘|λ='+st.lambdaU.toFixed(2)+'>0，捕捉极端联动'}; },
          note:"Gaussian：调 ρ 只改变整体椭圆倾斜，<b>四个角不额外抱团</b>（λ=0）。切到 t 并把 ν 调小：<b>上下两角同时变密</b>（对称厚尾），这就是危机同步的数学画像。"
        },
        drawers:{
          mechanism:"实务警示：用 Gaussian copula 算巨灾聚合资本的 VaR，会系统性偏低，因为它假设极端时分散化仍有效。t copula 用 ν 控制「危机同步程度」，更贴近现实。",
          math:"Gaussian C=Φ<sub>ρ</sub>(Φ⁻¹u,Φ⁻¹v)，τ=(2/π)arcsinρ，λ<sub>L</sub>=λ<sub>U</sub>=0（|ρ|<1）。t：λ=2t<sub>ν+1</sub>(−√((ν+1)(1−ρ)/(1+ρ)))，ν→∞⇒λ→0。",
          code:"# R：对比尾部\nlibrary(copula)\ng <- normalCopula(0.7); tt <- tCopula(0.7, df=4)\ntailIndex(g)   # ≈0\ntailIndex(tt)  # 明显 >0"
        },
        quiz:[
      {q:"t copula 相对 Gaussian copula 多出的参数是：", opts:["相关系数 ρ", "自由度 ν", "生成元 θ", "尾部系数 λ"], ans:1, why:"t copula 多一个自由度 ν 控制尾厚；Gaussian 只有相关参数 ρ（或矩阵 R）。", lv:1},
      {q:"Gaussian copula 当 ρ=0 时退化为：", opts:["Fréchet 上界", "独立 copula uv", "Fréchet 下界", "Clayton"], ans:1, why:"ρ=0 时 Φ<sub>ρ</sub> 分解为边缘之积，C=uv 即独立 copula。", lv:1},
      {q:"Gaussian copula 当 ρ=1 时退化为：", opts:["独立 copula", "Fréchet 上界 min(u,v)", "Fréchet 下界", "t copula"], ans:1, why:"ρ=1 完全正相关，C=min(u,v) 即 Fréchet 上界（同单调）。", lv:1},
      {q:"t copula 自由度 ν 减小时，尾部相依系数 λ 如何变化？", opts:["λ 减小", "λ 增大（尾更厚、极端联动更强）", "λ 不变", "λ 变为负"], ans:1, why:"ν 越小尾越厚、λ<sub>L</sub>=λ<sub>U</sub> 越大；ν→∞ 时 λ→0 退化为 Gaussian。", lv:2},
      {q:"Gaussian copula 中 Kendall τ 与参数 ρ 的关系是：", opts:["τ=ρ", "τ=(2/π)arcsin ρ", "τ=1−1/ρ", "τ=θ/(θ+2)"], ans:1, why:"Gaussian 的 τ=(2/π)arcsin ρ；ρ 较小时 τ≈0.637ρ，比 Pearson 小约 1/3。", lv:2},
      {q:"椭圆族 copula（Gaussian、t）在尾部相依上的共同限制是：", opts:["完全没有尾部相依", "上尾与下尾相依必然相等（λ<sub>U</sub>=λ<sub>L</sub>），无法刻画非对称尾部", "只能有下尾相依", "尾部相依恒为 1"], ans:1, why:"椭圆族对称，λ<sub>U</sub>=λ<sub>L</sub>；要建模非对称尾部须用 Clayton/Gumbel 等 Archimedean。", lv:2},
      {q:"即使 Gaussian copula 的 ρ 接近 1（如 0.99），只要 |ρ|<1，其尾部相依系数仍为 0。这意味着：", opts:["极端时两变量仍高度联动", "极端尾部两变量联动趋于消失，系统性低估危机同步崩盘", "ρ 越大尾部相依越强", "计算误差所致"], ans:1, why:"高斯 λ=0 与 ρ 无关（|ρ|<1），极端时「各自逃命」，这正是 2008 危机被诟病之处。", lv:3},
      {q:"t copula 的对称尾部相依系数 λ 随参数如何变化？", opts:["ρ 越大、ν 越大，λ 越大", "ρ 越大、ν 越小，λ 越大", "与 ρ、ν 都无关", "仅依赖生成元 θ"], ans:1, why:"λ=2t<sub>ν+1</sub>(−√((ν+1)(1−ρ)/(1+ρ)))：ρ 越大、ν 越小都使 λ 增大。", lv:3},
      {q:"实证显示股市『同步暴跌强于同步暴涨』（非对称尾部），下列哪类 copula 最合适？", opts:["Gaussian", "t", "Clayton（非对称下尾）", "独立"], ans:2, why:"非对称下尾相依须用 Clayton；椭圆族 λ<sub>U</sub>=λ<sub>L</sub> 对称，无法刻画「跌多于涨」。", lv:3}
    ]
      },

      { id:"tail-dep", name:"尾部相依系数 λ(q)", icon:"📡", minutes:11,
        demo:"demos/tail-dependence.html",
        hook:"「极端时到底联不联动」需要一个精确的数字。尾部相依系数 λ 就是<b>把分位 q 逼向 0 或 1 时的极限</b>——它告诉你，当一个险种遭遇百年一遇损失时，另一个跟着极端的概率有多大。",
        intuition:"下尾相依 λ<sub>L</sub> = lim<sub>u→0</sub> C(u,u)/u，上尾相依 λ<sub>U</sub> = lim<sub>u→1</sub> (1−2u+C(u,u))/(1−u)。直觉：λ<sub>L</sub>>0 表示「左尾粘」，λ<sub>U</sub>>0 表示「右尾粘」。下图画出有限分位的 λ(q)=C(q,q)/q 随 q→0 的<b>收敛过程</b>——曲线最终落到的高度，就是 λ<sub>L</sub>。",
        chain:{
          param:{lab:"Clayton θ", val:"θ 越大尾越粘", sub:"拖动看极限"},
          math:{lab:"数学量", val:"λ<sub>L</sub>=lim C(u,u)/u=2<sup>−1/θ</sup>", sub:"q→0 的极限"},
          real:{lab:"现象", val:"一险巨损，另一险跟极端概率", sub:"λ<sub>L</sub> 的直观含义"}
        },
        engine:{type:"curve", title:"λ(q)=C(q,q)/q 随 q→0 收敛到 λ<sub>L</sub>",
          x:{min:0.01,max:0.5,label:"分位 q"}, y:{label:"λ(q)"},
          params:[{key:"theta", label:"Clayton 参数 θ", min:0.3, max:8, step:0.1, val:2}],
          series:[{label:"λ(q)=C(q,q)/q（Clayton）", color:"var(--ch17)", fn:"lambdaClayton", width:3}],
          readouts:[{label:"λ<sub>L</sub> = 2<sup>−1/θ</sup>", fn:"lambdaLClayton"}],
          live:(P)=>{ const l=Math.pow(2,-1/P.theta); return {param:'Clayton θ='+(+P.theta).toFixed(1)+'|θ越大尾越粘', math:'λ<sub>L</sub>=2<sup>−1/θ</sup>='+l.toFixed(3)+'|q→0 的极限', real:(l>0.6?'一险巨损，另一险大概率跟极端':'尾部联动较弱')+'|λ<sub>L</sub>='+l.toFixed(2)}; },
          note:"q 越接近 0，λ(q) 越接近水平渐近线 λ<sub>L</sub>=2<sup>−1/θ</sup>。θ=2 时 λ<sub>L</sub>=2<sup>−0.5</sup>≈0.707——很强的下尾相依。θ↑ 则 λ<sub>L</sub>↑。"
        },
        drawers:{
          mechanism:"λ(q) 曲线是「有限样本能估的量」，λ<sub>L</sub> 是它的理论极限。实务中用高分位经验 λ(q) 外推 λ<sub>L</sub>，判断巨灾联动强度。Gaussian 的 λ(q) 会一路掉到 0，t 的会收敛到正值——一张图区分两族。",
          math:"λ<sub>L</sub>=lim<sub>u→0</sub>C(u,u)/u；Clayton 代入得 2<sup>−1/θ</sup>。λ<sub>U</sub>=lim<sub>u→1</sub>(1−2u+C(u,u))/(1−u)；Gumbel 得 2−2<sup>1/θ</sup>。",
          code:"# R：数值看收敛\nC <- function(u,th)(u^(-th)+u^(-th)-1)^(-1/th)\nq <- seq(0.01,0.5,len=100)\nplot(q, C(q,2)/q, type='l')  # 收敛到 2^(-1/2)≈0.707\nabline(h=2^(-1/2), col='red', lty=2)"
        },
        quiz:[
      {q:"尾部相依系数 λ（λ<sub>L</sub>、λ<sub>U</sub>）的取值范围是：", opts:["[0, 1]", "[−1, 1]", "[0, +∞)", "(−1, 0)"], ans:0, why:"λ 本质是条件概率的极限，恒在 [0,1]，不存在负值。", lv:1},
      {q:"上尾相依系数 λ<sub>U</sub> 的定义是：", opts:["lim<sub>u→0</sub> C(u,u)/u", "lim<sub>u→1</sub> (1−2u+C(u,u))/(1−u)", "C(1,1)", "∫C(u,u)du"], ans:1, why:"λ<sub>U</sub>=lim<sub>u→1</sub>(1−2u+C(u,u))/(1−u)，由联合生存概率容斥得到。", lv:1},
      {q:"λ<sub>L</sub>>0 表示：", opts:["上尾相依：极端大值同步", "下尾相依：一个变量取极端小值时另一个也倾向极端小值", "完全独立", "完全负相依"], ans:1, why:"λ<sub>L</sub> 衡量左下角粘合：一险极端小损失时另一险也极端的条件概率极限为正。", lv:1},
      {q:"Clayton copula θ=4 时，下尾相依系数 λ<sub>L</sub>=2<sup>−1/θ</sup> 约为：", opts:["0.84", "0.71", "0.5", "0.25"], ans:0, why:"λ<sub>L</sub>=2<sup>−1/4</sup>=2<sup>−0.25</sup>≈0.841；θ 越大下尾越粘。", lv:2},
      {q:"Gumbel copula θ=2 时，上尾相依系数 λ<sub>U</sub>=2−2<sup>1/θ</sup> 约为：", opts:["0.586", "0.707", "0.414", "1"], ans:0, why:"λ<sub>U</sub>=2−2<sup>1/2</sup>=2−1.414≈0.586；Gumbel 只有上尾相依。", lv:2},
      {q:"有限分位经验量 λ(q)=C(q,q)/q 当 q→0⁺ 时收敛到：", opts:["下尾相依系数 λ<sub>L</sub>", "上尾相依系数 λ<sub>U</sub>", "Kendall τ", "Spearman ρ<sub>S</sub>"], ans:0, why:"λ<sub>L</sub>=lim<sub>u→0</sub>C(u,u)/u，λ(q) 是其有限样本版本，q→0 时收敛到 λ<sub>L</sub>。", lv:2},
      {q:"推导 Clayton 的 λ<sub>L</sub> 时，C(u,u)/u 化简为 (2−u<sup>θ</sup>)<sup>−1/θ</sup>，取 u→0 的极限得：", opts:["2<sup>−1/θ</sup>", "0", "1", "2−2<sup>1/θ</sup>"], ans:0, why:"C(u,u)=(2u<sup>−θ</sup>−1)<sup>−1/θ</sup>，除以 u 后整理为 (2−u<sup>θ</sup>)<sup>−1/θ</sup>→2<sup>−1/θ</sup>。", lv:3},
      {q:"上尾相依系数 λ<sub>U</sub> 经变量替换 u′=1−u 后，可写成与 λ<sub>L</sub> 对称的形式 lim<sub>u′→0</sub> Ĉ(u′,u′)/u′，其中 Ĉ 是：", opts:["原 copula C", "生存 copula Ĉ(u,v)=u+v−1+C(1−u,1−v)", "独立 copula", "Fréchet 上界"], ans:1, why:"上尾用生存 copula 表达，替换后 λ<sub>U</sub> 与 λ<sub>L</sub> 形式完全对称。", lv:3},
      {q:"绘制 λ(q)=C(q,q)/q 随 q→0 的曲线，Gaussian 与 t copula 的区别是：", opts:["两者都收敛到正值", "Gaussian 的 λ(q) 降到 0，t 的收敛到正值", "两者都降到 0", "t 降到 0、Gaussian 收敛正值"], ans:1, why:"高斯 λ<sub>L</sub>=0 故 λ(q)→0；t 有正尾部相依故 λ(q)→正值，一张图即可区分两族。", lv:3}
    ]
      },

      { id:"joint-prob", name:"联合概率计算器", icon:"🧮", minutes:8,
        demo:"demos/joint-prob.html",
        hook:"核保人想知道：<b>A 区损失超过其 95% 分位、同时 B 区也超过其 95% 分位</b>的概率有多大？这正是 copula 的直接应用——把边缘分位喂进 C，一步算出联合概率。",
        intuition:"由 Sklar，P(X≤x, Y≤y) = C(F<sub>X</sub>(x), F<sub>Y</sub>(y))。计算三步：① 用边缘 CDF 把 x,y 换成 u=F<sub>X</sub>(x)、v=F<sub>Y</sub>(y)（即 PIT）；② 把 (u,v) 代入 copula C；③ 得到联合概率。生存形式 P(X>x,Y>y) 则用生存 copula。下面拼装出正确的计算式。",
        chain:{
          param:{lab:"输入", val:"x, y 与边缘 F<sub>X</sub>, F<sub>Y</sub>", sub:"两区的阈值"},
          math:{lab:"计算", val:"P=C(F<sub>X</sub>(x), F<sub>Y</sub>(y))", sub:"先 PIT 再代入 C"},
          real:{lab:"输出", val:"两区同时超阈的概率", sub:"联合尾部风险"}
        },
        engine:{type:"build", title:"拼装联合概率计算式",
          prompt:"把下面的积木拖进框中，拼出 P(X≤x, Y≤y) 的正确表达式（按顺序）：",
          bank:["C(","F<sub>X</sub>(x)",",","F<sub>Y</sub>(y)",")","∫","dy","P(X>x)"],
          answer:["C(","F<sub>X</sub>(x)",",","F<sub>Y</sub>(y)",")"],
          success:"正确！P(X≤x, Y≤y) = C(F<sub>X</sub>(x), F<sub>Y</sub>(y))——先用边缘 CDF 做 PIT，再代入 copula。∫dy 和 P(X>x) 是干扰项。",
          fail:"再想想：Sklar 定理是 H(x,y)=C(F<sub>X</sub>(x),F<sub>Y</sub>(y))，不需要积分，也不是生存概率。"
        },
        drawers:{
          mechanism:"若要求「都超过阈值」的上尾联合概率 P(X>x,Y>y)，用生存 copula：Ū(u,v)=u+v−1+C(1−u,1−v) 代入。选错 copula 家族（如上尾事件用 Clayton）会严重低估。",
          math:"P(X≤x,Y≤y)=C(u,v)；P(X>x,Y>y)=1−u−v+C(u,v)=Ū(1−u,1−v) 形式，u=F<sub>X</sub>(x)。",
          code:"# R：算联合概率\nu <- pexp(qexp(0.95,1),1)  # =0.95\nC <- function(u,v,th)(u^(-th)+v^(-th)-1)^(-1/th)\nC(0.95,0.95,2)  # 联合 ≤ 概率\n# 上尾：1-0.95-0.95+C(0.95,0.95,2)"
        },
        quiz:[
      {q:"copula C 的输入 (u,v) 必须是：", opts:["原始损失值 x、y", "均匀化概率 u=F<sub>X</sub>(x)、v=F<sub>Y</sub>(y)（PIT 后）", "密度值", "分位数之和"], ans:1, why:"copula 定义在 [0,1]²，只接受 PIT 后的均匀概率，不能直接代原始损失。", lv:1},
      {q:"条件概率 P(X≤x | Y≤y) 用 copula 表示为：", opts:["C(u,v)/v", "C(u,v)/u", "C(u,v)", "u·v"], ans:0, why:"P(X≤x|Y≤y)=P(X≤x,Y≤y)/P(Y≤y)=C(u,v)/v，其中 v=F<sub>Y</sub>(y)。", lv:1},
      {q:"上尾联合概率 P(X>x, Y>y) 的容斥公式为：", opts:["1−u−v+C(u,v)", "u·v", "C(u,v)", "1−C(u,v)"], ans:0, why:"P(X>x,Y>y)=1−F<sub>X</sub>(x)−F<sub>Y</sub>(y)+C(u,v)=1−u−v+C(u,v)。", lv:1},
      {q:"Clayton copula θ=2，u=v=0.5 时，C(u,v)=(u<sup>−2</sup>+v<sup>−2</sup>−1)<sup>−1/2</sup> 约为：", opts:["0.378", "0.25", "0.5", "0.707"], ans:0, why:"0.5<sup>−2</sup>=4，括号内 4+4−1=7，7<sup>−1/2</sup>=1/√7≈0.378（大于独立值 0.25）。", lv:2},
      {q:"两险种『至少一个损失超过各自阈值』的概率 P(X>x ∪ Y>y) 等于：", opts:["1−C(u,v)", "1−u−v+C(u,v)", "C(u,v)", "u+v"], ans:0, why:"P(至少一个超阈)=1−P(X≤x,Y≤y)=1−C(u,v)；别与「都超阈」的 1−u−v+C 混淆。", lv:2},
      {q:"正相依 copula（如 Clayton θ>0）的 C(u,v) 与独立值 uv 的一般关系是：", opts:["C(u,v) ≥ uv", "C(u,v) ≤ uv", "C(u,v) = uv", "无固定关系"], ans:0, why:"正相依使联合概率抬高，C(u,v)≥uv；负相依则 C≤uv，独立取等号。", lv:2},
      {q:"Clayton θ=2，u=0.8888、v=0.7974 时，P(X≤x,Y≤y)=C(u,v) 约为：", opts:["0.737", "0.709", "0.888", "0.5"], ans:0, why:"u<sup>−2</sup>+v<sup>−2</sup>−1≈1.266+1.573−1=1.839，<sup>−1/2</sup>≈0.737；独立假设仅 uv≈0.709。", lv:3},
      {q:"t copula 下 C(0.05,0.08)≈0.0089，则 P(A违约 | B违约)=C(0.05,0.08)/0.08 约为：", opts:["0.111", "0.05", "0.0089", "0.08"], ans:0, why:"0.0089/0.08≈0.111，远高于独立假设的 0.05，体现违约传染（尾部相依）。", lv:3},
      {q:"计算两巨灾险『同时大额索赔』P(X>x,Y>y)（上尾事件）时，误用只含下尾相依的 Clayton copula，会：", opts:["低估上尾联合概率（Clayton λ<sub>U</sub>=0，极端上尾趋于独立）", "高估上尾联合概率", "无影响", "无法计算"], ans:0, why:"Clayton 上尾 λ<sub>U</sub>=0，极端上尾联动被设为 0，会系统性低估同时大额索赔概率。", lv:3}
    ]
      },

      { id:"aggregate", name:"聚合损失与资本要求", icon:"🏦", minutes:12,
        demo:"demos/aggregate-loss.html",
        hook:"偿付能力监管要你为<b>聚合损失 S=X+Y 的 99.5% 分位（VaR）</b>准备资本。如果 X、Y 是两区巨灾损失，<b>选 Gaussian 还是 Gumbel copula，算出的资本可能差一大截</b>——这就是 copula 选型真金白银的后果。",
        intuition:"聚合损失 S=X+Y 的尾部分布<b>强烈依赖 copula</b>。上尾相依的 Gumbel 会让 S 的右尾更厚，VaR 更高；假设独立或 Gaussian 会低估。下图用蒙特卡洛模拟：固定相同的指数边缘，只换 copula，看 S 的 VaRₚ 随 p→1 如何分叉。",
        chain:{
          param:{lab:"copula 选型", val:"独立 / Gaussian / Gumbel", sub:"边缘相同"},
          math:{lab:"数学量", val:"VaRₚ(S)=F<sub>S</sub>⁻¹(p)", sub:"p→1 时差异放大"},
          real:{lab:"后果", val:"资本要求相差巨大", sub:"选型=真金白银"}
        },
        engine:{type:"aggregate", title:"蒙特卡洛：同一边缘、不同 copula 下的 VaR",
          n:8000, margin:"exp",
          copulas:["indep","gaussian","gumbel"],
          note:"三条 VaRₚ(S) 曲线在 p 较小时接近，p→1（极端）时<b>明显分叉</b>：Gumbel（上尾相依）最高，独立最低。分散化在极端时失效——这正是监管关注尾部相依的原因。"
        },
        drawers:{
          mechanism:"分散化的「幻觉」：平时（中部分位）不同 copula 差异小，看起来分散化有效；极端时上尾相依让损失同步爆发，分散化失效，VaR 飙升。用 Gaussian 估资本会系统性不足。",
          math:"S=X+Y，F<sub>S</sub> 无闭式，靠模拟：抽 (U,V)~C，X=F<sub>X</sub>⁻¹(U),Y=F<sub>Y</sub>⁻¹(V)，累加排序取分位。",
          code:"# R：模拟聚合 VaR\nlibrary(copula)\nsim <- function(cop,n=20000){u<-rCopula(n,cop);qexp(u[,1],1)+qexp(u[,2],1)}\nquantile(sim(gumbelCopula(3)),0.995)\nquantile(sim(normalCopula(0.5)),0.995)  # 更低"
        },
        quiz:[
      {q:"聚合损失 S=X+Y 的 VaRₚ(S) 定义为：", opts:["S 的 p 分位数 F<sub>S</sub>⁻¹(p)", "S 的均值", "S 的方差", "p·E[S]"], ans:0, why:"VaRₚ(S)=F<sub>S</sub>⁻¹(p)，即损失不超过该值的概率达到 p 的临界水平。", lv:1},
      {q:"蒙特卡洛估计聚合 VaR 时，生成损失样本的正确步骤是：", opts:["直接从边缘独立抽样相加", "从 copula 抽 (U,V)，再令 X=F<sub>X</sub>⁻¹(U)、Y=F<sub>Y</sub>⁻¹(V) 后相加", "对 x,y 直接套用 copula", "用 Pearson ρ 缩放边缘"], ans:1, why:"先由 copula 得到相依的均匀样本，再用逆边缘还原损失，才能保留尾部相依结构。", lv:1},
      {q:"Solvency II 下偿付能力资本要求 SCR 通常对应聚合损失的哪个分位 VaR？", opts:["99.5%", "95%", "99.9%", "90%"], ans:0, why:"Solvency II 以 99.5% VaR（一年期）作为 SCR 的置信水平。", lv:1},
      {q:"固定相同边缘，仅增大 Gumbel copula 参数 θ，则 S=X+Y 的高分位 VaR：", opts:["降低", "升高（θ↑ 上尾相依↑，极端同步损失↑）", "不变", "变为 0"], ans:1, why:"Gumbel θ↑ 使上尾相依增强，极端损失更同步，右尾变厚、VaR 升高。", lv:2},
      {q:"同单调 copula（完全正相依）下，P(X+Y > VaR₀.₉₅(X)+VaR₀.₉₅(Y)) 等于：", opts:["0.05", "0.0025", "0.1", "0.95"], ans:0, why:"同单调下 X>VaR<sub>X</sub> 当且仅当 Y>VaR<sub>Y</sub>，完全同步，故概率=P(X>VaR<sub>X</sub>)=0.05（独立时仅 0.0025）。", lv:2},
      {q:"『分散化幻觉』是指：在中部分位不同 copula 的聚合 VaR 接近，但当 p→1 时：", opts:["差异消失", "上尾相依使损失同步、分散化失效、VaR 急剧分叉升高", "所有 copula 给出相同 VaR", "VaR 趋于 0"], ans:1, why:"平时看似分散化有效，极端时上尾相依让损失同步爆发，VaR 飙升、差异凸显。", lv:2},
      {q:"聚合 VaR 模拟中，若把含上尾相依的巨灾险误用 Gaussian copula（λ=0）建模，则 p→1 时估计的 VaR：", opts:["系统性偏低，且 p 越接近 1 偏差越大", "系统性偏高", "完全准确", "仅均值有偏"], ans:0, why:"高斯 λ=0 假设极端时分散化仍有效，低估聚合尾部，p 越极端偏差越大。", lv:3},
      {q:"固定相同厚尾边缘，在极高分位 p→1 下，聚合 VaR 由大到小的一般排序是：", opts:["独立 > Gaussian > 上尾相依", "同单调（完全正相依）≥ 上尾相依(Gumbel) > 独立", "各 copula 完全相同", "独立最大、同单调最小"], ans:1, why:"完全正相依使极端完全同步、VaR 最高；上尾相依次之；独立分散化最强、VaR 最低。", lv:3},
      {q:"监管（如 Solvency II）特别关注 copula 尾部相依而非仅线性相关系数，根本原因是：", opts:["尾部相依计算更简单", "极端时尾部相依决定聚合损失尾部与资本，线性相关系数无法捕捉极端同步", "相关系数总是为 0", "尾部相依恒等于 1"], ans:1, why:"线性 ρ 无法刻画极端联动；尾部相依决定分散化在危机时是否失效，直接关乎资本充足。", lv:3}
    ]
      }
    ]
  },

  /* ============================================================ Ch15 损失分布（引擎复用示范） */
  {
    id:15, no:"Ch15", name:"损失分布", icon:"📊", color:"var(--ch15)",
    weight:"Syllabus 1.1 · 基础", status:"live", pdf:"pdf/loss-model-ch15.pdf", qa:"qa/ch15-qa.html",
    desc:"指数、Gamma、Weibull、Pareto、对数正态——刻画单个险种损失轮廓的工具箱。参数如何改变形状与尾重？拖一拖就知道。",
    kps:[
      { id:"common-dists", name:"常用损失分布图鉴", icon:"📈", minutes:10,
        demo:"demos/common-distributions.html",
        hook:"车险小额索赔频繁（轻尾），巨灾损失罕见但惊人（厚尾）。<b>没有万能分布</b>——选错分布，准备金就会算偏。先认识五位「主角」的长相。",
        intuition:"损失建模常用分布各有性格：<b>指数</b>（无记忆、轻尾）、<b>Gamma</b>（形状可调）、<b>Weibull</b>（失效率可升可降）、<b>Pareto/对数正态</b>（厚尾，适合大额）。切换分布、拖动形状参数，观察密度曲线如何变形、尾巴如何变厚。",
        chain:{
          param:{lab:"形状参数", val:"α / k / σ", sub:"拖动看变形"},
          math:{lab:"数学量", val:"f(x) 的峰与尾", sub:"形状与尾重"},
          real:{lab:"现象", val:"轻尾小额 vs 厚尾巨灾", sub:"选对分布"}
        },
        engine:{type:"curve", title:"分布图鉴：切换分布 + 拖动形状参数",
          x:{min:0.01,max:5,label:"损失 x"}, y:{label:"密度 f(x)"},
          params:[
            {key:"which", label:"分布", type:"select", options:["exp","gamma","weibull","pareto","lognormal"], val:"gamma"},
            {key:"shape", label:"形状参数（α/k/σ）", min:0.5, max:5, step:0.1, val:2}
          ],
          series:[{label:"密度 f(x)", color:"var(--ch15)", fn:"lossDist", width:3}],
          live:(P)=>{ const nm={exp:'指数',gamma:'Gamma',weibull:'Weibull',pareto:'Pareto',lognormal:'对数正态'}[P.which]; const heavy=(P.which==='pareto'||P.which==='lognormal');
            return {param:nm+' 参数='+(+P.shape).toFixed(1)+'|拖动看变形', math:'f(x) 的峰与尾在变|'+(heavy?'厚尾':'轻/中尾'), real:(heavy?'适合大额/巨灾损失':'适合小额高频损失')+'|'+nm}; },
          note:"Gamma α<1 时单调下降、α>1 时单峰；Weibull k 控制失效率升降；Pareto 与对数正态尾巴明显更厚（大额损失概率更高）。"
        },
        drawers:{
          mechanism:"尾重排序（大致）：指数 < Gamma ≈ Weibull < 对数正态 < Pareto。巨灾/大额索赔优先选厚尾分布，否则低估极端损失。",
          math:"Exp:λe<sup>−λx</sup>；Gamma:x<sup>α−1</sup>e<sup>−x/β</sup>/(β<sup>α</sup> Γ(α))；Weibull:kxᵏ⁻¹e<sup>−xᵏ</sup>；Pareto(Lomax):αθ<sup>α</sup>/(x+θ)<sup>α+1</sup>。",
          code:"# R：四分布密度对比\ncurve(dexp(x,1),0,5,col=1)\ncurve(dgamma(x,2,1),0,5,col=2,add=TRUE)\ncurve(dweibull(x,2,1),0,5,col=3,add=TRUE)"
        },
        quiz:[
          {q:"下列哪个分布具有「厚尾」特性，适合建模大额巨灾损失？", opts:["指数分布","Pareto 分布","均匀分布","退化分布"], ans:1, why:"Pareto 是典型厚尾分布，大额损失概率衰减慢。", lv:1},
          {q:"指数分布的标志性性质是：", opts:["厚尾","无记忆性","对称","双峰"], ans:1, why:"指数分布是唯一连续的无记忆分布。", lv:1},
          {q:"密度函数形如 λe<sup>−λx</sup>（x>0）的分布是：", opts:["Gamma 分布","指数分布","Weibull 分布","Pareto 分布"], ans:1, why:"这是指数分布的密度函数。", lv:1},
          {q:"Gamma 分布形状参数 α<1 时，密度曲线：", opts:["单峰","在 0 处发散、单调下降","恒为常数","双峰"], ans:1, why:"α<1 时 f(x) 在 0 附近趋于无穷并单调下降。", lv:2},
          {q:"Weibull 分布形状参数 k>1 时，失效率（风险率）：", opts:["单调递减","单调递增","恒定","先增后减"], ans:1, why:"k>1 失效率递增（老化效应）；k=1 恒定（即指数分布）；k<1 递减。", lv:2},
          {q:"尾重由轻到重排序，正确的是：", opts:["指数 < 对数正态 < Pareto","Pareto < 指数 < 对数正态","对数正态 < 指数 < Pareto","指数 < Pareto < 对数正态"], ans:0, why:"尾重：指数（轻尾）< 对数正态 < Pareto（最厚）。", lv:2},
          {q:"指数分布同时是 Gamma 与 Weibull 的特例，条件是：", opts:["Gamma α=1 且 Weibull k=1","Gamma α=2 且 Weibull k=2","Gamma α=1 且 Weibull k=0","Gamma α=0 且 Weibull k=1"], ans:0, why:"Gamma(α=1) 与 Weibull(k=1) 都退化为指数分布。", lv:3},
          {q:"用指数分布（轻尾）拟合巨灾损失，而真实分布是 Pareto（厚尾），估计的高分位 VaR 会：", opts:["明显高估","明显低估","无偏","变为零"], ans:1, why:"厚尾分布的极端分位数更大，轻尾模型会低估尾部风险。", lv:3},
          {q:"形状参数 α=2 的 Pareto 分布：", opts:["均值与方差都存在","均值存在但方差不存在","均值不存在","均值方差都不存在"], ans:1, why:"Pareto 均值存在需 α>1，方差存在需 α>2；α=2 恰好方差不存在。", lv:3}
        ]
      },
      { id:"loss-estimation", name:"损失估计：矩估计与 MLE", icon:"🔬", minutes:9,
        demo:"demos/loss-estimation.html",
        hook:"拿到一批历史损失数据，怎么反推出它服从哪个分布、参数是多少？两把尺子：<b>矩估计</b>（匹配均值方差）和<b>极大似然 MLE</b>（让数据出现概率最大）。",
        intuition:"<b>矩估计</b>：令样本矩=理论矩，解出参数（直观但可能低效）。<b>MLE</b>：最大化似然函数 L(θ)=∏f(xᵢ;θ)，等价于最大化对数似然 ℓ(θ)=Σln f(xᵢ;θ)。MLE 具有渐近最优性，是精算实务主流。",
        chain:{
          param:{lab:"数据", val:"x₁,…,xₙ", sub:"历史损失"},
          math:{lab:"估计", val:"max Σln f(xᵢ;θ)", sub:"对数似然"},
          real:{lab:"产出", val:"分布参数的最优估计", sub:"定价/准备金输入"}
        },
        engine:{type:"match", title:"配对：估计方法与其特征",
          pairs:[
            {l:"矩估计", r:"令样本矩 = 理论矩解参数"},
            {l:"MLE", r:"最大化对数似然 Σln f(xᵢ;θ)"},
            {l:"无记忆性", r:"指数分布的标志"},
            {l:"厚尾", r:"Pareto，大额损失衰减慢"}
          ]
        },
        drawers:{
          mechanism:"MLE 的渐近性质（相合、渐近正态、有效）使其成为默认选择；矩估计常作为 MLE 的初值。卡方拟合优度检验用于判断「选定的分布到底合不合适」。",
          math:"ℓ(θ)=Σln f(xᵢ;θ)，解 ∂ℓ/∂θ=0。指数分布 MLE：λ̂=1/x̄。",
          code:"# R：MLE\nx <- rexp(200, rate=2)\nfitdistrplus::fitdist(x,'exp')  # rate≈2"
        },
        quiz:[
          {q:"MLE 的核心思想是：", opts:["匹配均值方差","最大化数据出现的（对数）似然","最小化方差","随机选取"], ans:1, why:"MLE 选择使观测数据似然最大的参数。", lv:1},
          {q:"判断选定分布是否合适，常用：", opts:["t 检验","卡方拟合优度检验","方差分析","秩和检验"], ans:1, why:"卡方拟合优度检验比较观测与理论频数。", lv:1},
          {q:"矩估计的基本思路是：", opts:["最大化似然函数","令样本矩等于理论矩解出参数","最小化残差平方和","求贝叶斯后验"], ans:1, why:"矩估计用样本均值/方差等匹配理论矩来反推参数。", lv:1},
          {q:"指数分布参数 λ 的 MLE 是：", opts:["样本均值 x̄","1/x̄","样本方差","ln x̄"], ans:1, why:"指数分布 MLE λ̂=1/x̄。", lv:2},
          {q:"MLE 通常最大化对数似然 ℓ(θ) 而非似然 L(θ)，因为：", opts:["ln 单调、极值点不变且乘积化求和便于求导","对数似然总是更大","似然函数无法计算","对数似然必然凹"], ans:0, why:"ln 单调递增不改变 argmax，且把连乘变成求和，求导方便。", lv:2},
          {q:"在 MLE 数值求解中，矩估计常扮演的角色是：", opts:["提供迭代初值","提供收敛判据","替代 MLE","计算 p 值"], ans:0, why:"矩估计直观快速，常作为 MLE 迭代算法的初值。", lv:2},
          {q:"MLE 的渐近性质不包括：", opts:["相合性","渐近正态性","有效性","任何样本下都无偏"], ans:3, why:"MLE 渐近无偏，但有限样本未必无偏；「总是无偏」不是 MLE 的性质。", lv:3},
          {q:"指数分布样本均值 x̄=0.5，则 λ 的 MLE λ̂ 为：", opts:["2","0.5","1","4"], ans:0, why:"λ̂=1/x̄=1/0.5=2。", lv:3},
          {q:"卡方拟合优度检验中，若从数据估计了 3 个参数、分了 k 组，则自由度为：", opts:["k−1","k−3","k−1−3","k+3"], ans:2, why:"自由度 = 组数 − 1 − 估计参数个数 = k−1−3。", lv:3}
        ]
      }
    ]
  },

  /* ============================================================ Ch16 极值理论（引擎复用示范） */
  {
    id:16, no:"Ch16", name:"极值理论 EVT", icon:"🌊", color:"var(--ch16)",
    weight:"Syllabus 1.4 · 进阶", status:"live", pdf:"pdf/loss-model-ch16.pdf", qa:"qa/ch16-qa.html",
    desc:"百年一遇的巨灾、极端市场波动——常规分布拟合不了尾部。GEV 与 GPD 专门刻画「最大值的分布」和「超阈值的分布」。",
    kps:[
      { id:"gev", name:"GEV：最大值的分布", icon:"⛰️", minutes:10,
        demo:[{t:"GEV 分布",src:"demos/gev.html"},{t:"吸引域 DoA",src:"demos/doa.html"},{t:"分块最大值",src:"demos/block-maxima.html"}],
        hook:"把每年最大损失单独拎出来，这些「年度最大值」服从什么分布？极值定理说：无论原始分布如何，标准化后的最大值<b>必然收敛到 GEV 族</b>——由形状参数 ξ 决定尾型。",
        intuition:"<b>广义极值分布 GEV</b> 统一了三类极值分布，形状参数 ξ 决定尾型：ξ>0 厚尾（Fréchet，巨灾型）、ξ=0 轻尾（Gumbel）、ξ<0 有界尾（Weibull）。拖动 ξ，看密度尾部如何变化。",
        chain:{
          param:{lab:"形状 ξ", val:"ξ>0 厚 / =0 轻 / <0 有界", sub:"决定尾型"},
          math:{lab:"数学量", val:"GEV(μ,σ,ξ)", sub:"三类极值统一"},
          real:{lab:"现象", val:"年度最大损失的分布", sub:"巨灾 ξ>0"}
        },
        engine:{type:"curve", title:"GEV 密度：拖动形状参数 ξ 看尾型",
          x:{min:-3,max:6,label:"x"}, y:{label:"密度"},
          params:[{key:"xi", label:"形状参数 ξ", min:-0.4, max:0.5, step:0.02, val:0.1}],
          series:[{label:"GEV(0,1,ξ) 密度", color:"var(--ch16)", fn:"gevPDF", width:3}],
          live:(P)=>{ const xi=P.xi; const t=xi>0.02?'厚尾 Fréchet（巨灾）':(xi<-0.02?'有界尾 Weibull':'轻尾 Gumbel');
            return {param:'ξ='+xi.toFixed(2)+'|尾型旋钮', math:'GEV(0,1,ξ)|'+t, real:(xi>0.02?'年度最大损失可能极大':(xi<-0.02?'损失有上限':'指数型衰减'))+'|ξ='+xi.toFixed(2)}; },
          note:"ξ>0：右尾厚（巨灾/金融极端）；ξ=0：指数型轻尾；ξ<0：有上界。ξ 是极值建模的灵魂参数。"
        },
        drawers:{
          mechanism:"Block Maxima 法：把数据分块（如每年）取最大值，拟合 GEV。ξ 的估计直接决定百年一遇分位的外推可靠性。",
          math:"GEV: F(x)=exp{−[1+ξ(x−μ)/σ]<sup>−1/ξ</sup>}，需 1+ξ(x−μ)/σ>0；ξ→0 退化为 Gumbel exp{−e<sup>−(x−μ)/σ</sup>}。",
          code:"# R：GEV 密度\ngev <- function(x,xi){t<-pmax(1+xi*x,1e-9);exp(-t^(-1/xi))*t^(-1/xi-1)}\ncurve(gev(x,0.2),-3,6,col='red')"
        },
        quiz:[
      {q:"GEV 形状参数 ξ<0 对应的极值分布类型与尾型是：", opts:["Fréchet 型，厚尾", "Gumbel 型，指数尾", "Weibull 型，有界尾", "正态型，对称尾"], ans:2, why:"ξ<0 对应有界尾的 Weibull 型（Type III），分布存在有限上界。", lv:1},
      {q:"Fisher-Tippett 极值定理指出，标准化后的区块最大值依分布收敛到：", opts:["正态分布", "GEV 分布族", "卡方分布", "指数分布"], ans:1, why:"极值定理是极值版的 CLT：标准化最大值收敛到 GEV 族，而非正态。", lv:1},
      {q:"下列哪个原始分布的区块最大值会收敛到 Fréchet 型（ξ>0）GEV？", opts:["正态分布", "指数分布", "Pareto 分布", "均匀分布"], ans:2, why:"Pareto 是重尾分布，最大值收敛到 Fréchet 型；正态/指数→Gumbel，均匀→Weibull。", lv:1},
      {q:"在 GEV 建模中，若估计出的形状参数 ξ 由 0.1 增大到 0.4，则：", opts:["尾部变薄，所需资本减少", "尾型不变，仅位置平移", "尾部变厚，极端损失概率与所需资本上升", "分布退化为 Gumbel"], ans:2, why:"ξ 越大尾部越厚（幂律衰减越慢），极端损失概率上升，需更多资本缓冲。", lv:2},
      {q:"GEV(μ,σ,ξ) 当 ξ>0 时，分布的支撑下界为：", opts:["μ", "μ−σ/ξ", "μ+σ/ξ", "无下界（x∈R）"], ans:1, why:"需 1+ξ(x−μ)/σ>0，ξ>0 时得 x>μ−σ/ξ，即下界 μ−σ/ξ；ξ=0 才是 x∈R。", lv:2},
      {q:"若单个损失服从损失分布中的 Weibull 分布，则其区块最大值收敛到的极值类型是：", opts:["Weibull 型（ξ<0）", "Gumbel 型（ξ=0）", "Fréchet 型（ξ>0）", "不收敛"], ans:1, why:"损失分布 Weibull 属指数型尾部，最大值收敛到 Gumbel；极值 Weibull 型只对有界原始分布出现。", lv:2},
      {q:"形状参数 ξ=0.6 的 Fréchet 型 GEV 分布：", opts:["均值与方差都存在", "均值存在但方差不存在", "均值不存在", "均值方差都不存在"], ans:1, why:"GEV 均值存在需 ξ<1，方差存在需 ξ<1/2；ξ=0.6 满足前者不满足后者，故方差不存在。", lv:3},
      {q:"GEV 建模下，重现期 T=100 年的损失水平 z₁₀₀ 与 VaR 的关系是：", opts:["z₁₀₀ = VaR₀.₉₉", "z₁₀₀ = VaR₀.₉₉₉", "z₁₀₀ = VaR₀.₉₀", "z₁₀₀ = 100×VaR₀.₉₉"], ans:0, why:"z<sub>T</sub> 满足 H(z<sub>T</sub>)=1−1/T，即 z<sub>T</sub>=VaR<sub>1−1/T</sub>；T=100 恰好对应 99% VaR（百年一遇）。", lv:3},
      {q:"真实尾部为 Fréchet 型（ξ>0）的巨灾损失，若误用 Gumbel（ξ=0）模型外推，会：", opts:["高估极端损失概率", "低估极端损失概率，资本准备不足", "估计完全一致", "只影响均值不影响尾部"], ans:1, why:"Gumbel 是指数尾、衰减快于 Fréchet 的幂律尾，远端会严重低估极端概率，导致定价与资本不足。", lv:3}
    ]
      },
      { id:"pot", name:"POT 与 GPD：超阈值建模", icon:"🚨", minutes:9,
        demo:"demos/pot.html",
        hook:"巨灾数据太少，每年只取一个最大值太浪费。<b>POT（超阈值）法</b>把所有超过高阈值 u 的损失都用上——这些「超额量」服从 <b>广义 Pareto 分布 GPD</b>。",
        intuition:"POT 定理：超过高阈值 u 的超额量 X−u | X>u 近似服从 <b>GPD</b>，参数为形状 ξ 与尺度 σ。GPD 与 GEV 共享同一个 ξ，但 POT 用数据更高效（不丢弃非最大值）。阈值选择是关键权衡：太高样本少，太低偏差大。",
        chain:{
          param:{lab:"阈值 u", val:"选高阈值", sub:"权衡偏差/方差"},
          math:{lab:"数学量", val:"超额 ~ GPD(ξ,σ)", sub:"POT 定理"},
          real:{lab:"现象", val:"所有巨灾超额都用上", sub:"比 Block Maxima 高效"}
        },
        engine:{type:"match", title:"配对：EVT 概念",
          pairs:[
            {l:"GEV", r:"Block Maxima，年度最大值的分布"},
            {l:"GPD", r:"POT，超阈值超额量的分布"},
            {l:"形状参数 ξ", r:"GEV 与 GPD 共享，决定尾型"},
            {l:"阈值 u 太高", r:"样本太少、方差大"}
          ]
        },
        drawers:{
          mechanism:"GPD 尾指数与 GEV 一致，故 POT 与 Block Maxima 殊途同归，但 POT 数据利用率高，是巨灾/操作风险实务首选。均值超额图可辅助选阈值。",
          math:"GPD: G(y)=1−(1+ξy/σ)<sup>−1/ξ</sup>，y=x−u>0；ξ>0 厚尾。",
          code:"# R：GPD 拟合超额\nu <- quantile(x,0.9)\nex <- x[x>u]-u\nevd::fgpd(ex)  # 估 ξ,σ"
        },
        quiz:[
      {q:"POT 方法中超阈值超额量渐近服从 GPD，其理论依据是：", opts:["中心极限定理", "Fisher-Tippett 极值定理", "Pickands-Balkema-de Haan 定理", "大数定律"], ans:2, why:"PBdH 定理是 EVT 第二基本定理：高阈值下条件超额分布收敛到 GPD。", lv:1},
      {q:"GPD 当形状参数 ξ=0 时退化为：", opts:["Pareto 分布", "指数分布 Exp(1/σ)", "正态分布", "均匀分布"], ans:1, why:"ξ=0 时 GPD 的 CDF 为 1−e<sup>−y/σ</sup>，即指数分布 Exp(1/σ)（均值 σ，对应 Gumbel 型）。", lv:1},
      {q:"GPD 建模的超额量 Y=X−u|X>u 的定义域起点是：", opts:["从 0 开始（Y≥0）", "从阈值 u 开始", "从 −∞ 开始", "从 1 开始"], ans:0, why:"超额量非负，GPD 总从 0 开始；有限上界仅在 ξ<0 时存在，等于 −σ/ξ。", lv:1},
      {q:"POT 中阈值 u 选得太低，主要问题是：", opts:["超阈值样本太少", "主体数据混入、渐近近似不成立导致偏差大", "GPD 不再存在", "方差达到最大"], ans:1, why:"阈值太低会把非极端的主体数据纳入，违背高阈值渐近假设，产生偏差（太低偏差大、太高方差大）。", lv:2},
      {q:"GPD 的 ξ>0（重尾 Pareto 型）对应 GEV 的哪种类型？", opts:["Gumbel 型", "Weibull 型", "Fréchet 型", "与 GEV 无对应"], ans:2, why:"GPD 与 GEV 共享 ξ：ξ>0 重尾↔Fréchet，ξ=0↔Gumbel，ξ<0 有界↔Weibull。", lv:2},
      {q:"POT 中超过 u+w 的概率 P(X>u+w) 的正确分解是：", opts:["P(X>u)+P(X−u>w)", "P(X>u)·P(X−u>w | X>u)", "P(X>u)−P(X>u+w)", "P(X−u>w)/P(X>u)"], ans:1, why:"由条件概率：P(X>u+w)=P(X>u)·P(X−u>w|X>u)=S(u)·Ḡ(w)，Ḡ 为 GPD 生存函数。", lv:2},
      {q:"GPD(ξ,σ) 当 ξ<0 时，超额量 Y 的有限上界为：", opts:["σ/ξ", "−σ/ξ", "σ/(1−ξ)", "无上界"], ans:1, why:"需 1+ξy/σ>0，ξ<0 时得 y<−σ/ξ，故上界为 −σ/ξ（正值）；ξ≥0 才无上界。", lv:3},
      {q:"GPD 形状参数 ξ≥1 时，超阈值的平均剩余生命（均值超额）e(u) 会：", opts:["等于 0", "有限且随 u 线性增长", "发散为无穷（均值不存在）", "恒为 σ"], ans:2, why:"GPD 均值存在需 ξ<1；ξ≥1 时 e(u) 发散，表示尾部极厚、超阈值平均超额无有限均值。", lv:3},
      {q:"关于 POT（GPD）与区块最大值法（GEV）的对比，下列说法正确的是：", opts:["POT 每块只用一个最大值，数据利用率更低", "GEV 是 2 参数族，GPD 是 3 参数族", "POT 用上所有超阈值观测、样本更多、估计更高效", "两者理论基础完全相同，都是 Fisher-Tippett 定理"], ans:2, why:"POT 利用全部超阈值数据、样本更大、效率更高（实务首选）；GEV 3 参数、GPD 2 参数；POT 依据 PBdH 定理。", lv:3}
    ]
      }
    ]
  },

  /* ============================================================ 建设中章节 */
  { id:13, no:"Ch13", name:"时间序列 I", icon:"📈", color:"var(--ch13)", weight:"Syllabus 2 · 20%", status:"live", pdf:"pdf/loss-model-ch13.pdf", qa:"qa/ch13-qa.html",
    desc:"平稳性、AR/MA/ARMA、后移算子与特征方程、ACF/PACF。识别时间序列的「指纹」。", kps:[
      { id:"stationarity", name:"平稳性：时间序列的「定海神针」", icon:"⚓", minutes:8,
        demo:[{t:"平稳 vs 非平稳",src:"demos/stationarity-1.html"},{t:"参数化平稳性",src:"demos/stationarity-2.html"}],
    hook:"你想用过去十年的赔款数据预测明年。可如果数据的「脾气」一直在变——均值在漂、方差在涨——历史经验就<b>一文不值</b>。平稳性，就是让历史可以外推的前提。",
    intuition:"弱平稳（Weak Stationarity）要求三条：<b>① 均值恒定 E[Xₜ]=μ；② 方差有限且恒定 Var(Xₜ)=σ²；③ 自协方差只依赖滞后期 γ(k)=Cov(Xₜ,Xₜ₊ₖ)</b>，与具体时刻 t 无关。拖动 φ 观察：只要 |φ|<1，AR(1) 序列总是绕着均值波动、振幅稳定——这就是平稳。φ 越接近 1，序列越「恋旧」，但始终回归。",
    chain:{
      param:{val:"自回归系数 φ", sub:"|φ|<1 才平稳"},
      math:{val:"均值/方差/γ(k) 与 t 无关", sub:"弱平稳三条件"},
      real:{val:"历史规律可以外推", sub:"建模的前提"}
    },
    engine:{type:"tsSim", title:"AR(1) 的平稳性：拖 φ 看序列始终回归均值",
      model:"ar1",
      params:[{key:"phi", label:"自回归系数 φ（|φ|<1）", min:-0.95, max:0.95, step:0.05, val:0.7}],
      n:160, lags:14,
      live:(P,st)=>{ const a1=st.acf[0]; return {param:"φ="+(+P.phi).toFixed(2)+"|"+(Math.abs(P.phi)<1?"平稳":"非平稳"), math:"样本 ρ₁="+a1.toFixed(2)+"（理论 "+P.phi.toFixed(2)+"）|均值回归", real:(Math.abs(P.phi)>0.85?"强持续性：冲击久久不散":"冲击较快消散")+"|始终绕均值波动"}; },
      note:"无论 φ 取 0.9 还是 −0.9，序列都围绕 0 波动、振幅稳定——这就是平稳。若 φ=1（随机游走），序列将一去不回头，不再平稳。"},
    drawers:{
      mechanism:"平稳的本质是「统计规律不随时间漂移」：均值是常数、方差是常数、两个时点的相关性只取决于它们隔多远（k），不取决于在哪一天。只有这样，用历史估计出的参数才能用于未来。非平稳序列必须先差分平稳化。",
      math:"弱平稳三条件：E[Xₜ]=μ；Var(Xₜ)=σ²<∞；Cov(Xₜ,Xₜ₊ₖ)=γ(k)。<br>强平稳：任意有限维联合分布关于时间平移不变。强平稳⇒弱平稳（正态时等价）。<br>AR(1) 平稳 ⇔ |φ|<1。",
      code:"# 平稳 vs 非平稳\nset.seed(1)\nn<-300; x<-numeric(n); rw<-numeric(n)\nfor(t in 2:n){ x[t]<-0.7*x[t-1]+rnorm(1); rw[t]<-rw[t-1]+rnorm(1) }\nplot(x, type='l')   # 平稳：绕 0 波动\nlines(rw, col='red') # 随机游走：漂移不回"},
    quiz:[
      {q:"关于强平稳与弱平稳的关系，正确的是：", opts:["弱平稳一定强平稳", "强平稳蕴含弱平稳，反之不一定成立（正态序列下两者等价）", "两者完全等价", "两者互不蕴含"], ans:1, why:"强平稳要求联合分布时间平移不变，蕴含矩条件即弱平稳；反之一般不成立，正态时等价。", lv:1},
      {q:"白噪声过程 {eₜ} 的自相关函数 ρ(k)（k≥1）等于：", opts:["1", "0", "σ²", "随 k 指数衰减"], ans:1, why:"白噪声不同时刻互不相关，γ(k)=0（k≠0），故 ρ(k)=0。", lv:1},
      {q:"平稳序列的自协方差函数在滞后 0 处 γ(0) 等于：", opts:["0", "序列方差 σ²", "1", "均值 μ"], ans:1, why:"γ(0)=Cov(Xₜ,Xₜ)=Var(Xₜ)=σ²；等于 1 的是 ρ(0)=γ(0)/γ(0)。", lv:1},
      {q:"平稳序列 γ(0)=4、ρ(2)=0.5，则自协方差 γ(2) 等于：", opts:["2", "8", "0.125", "4"], ans:0, why:"γ(2)=ρ(2)·γ(0)=0.5×4=2。", lv:2},
      {q:"某序列均值恒为 0，但方差 Var(Xₜ)=t·σ² 随时间增大，该序列：", opts:["弱平稳", "非弱平稳（方差非常数）", "强平稳", "白噪声"], ans:1, why:"弱平稳要求方差有限且与 t 无关；方差随 t 增大违反恒定方差条件。", lv:2},
      {q:"若 {Xₜ} 是方差有限的独立同分布（i.i.d.）序列，则它：", opts:["只是弱平稳，不强平稳", "是强平稳，从而也是弱平稳", "非平稳", "仅当正态时才平稳"], ans:1, why:"i.i.d. 的有限维联合分布是相同边缘分布之积、时间平移不变，故强平稳，进而弱平稳。", lv:2},
      {q:"随机游走 Xₜ=Xₜ₋₁+Zₜ（X₀ 固定，Zₜ 白噪声）非平稳的根本原因及单整阶数为：", opts:["均值非常数，属 I(0)", "方差 var(Xₜ)=var(X₀)+tσ² 依赖 t，属 I(1)", "自协方差与 k 无关，属 I(2)", "它其实是平稳的"], ans:1, why:"递推得 var(Xₜ)=var(X₀)+tσ² 随 t 增大，违反恒定方差；一阶差分 ∇Xₜ=Zₜ 为白噪声，故 I(1)。", lv:3},
      {q:"关于「强平稳一定弱平稳」，正确的辨析是：", opts:["永远成立", "仅当二阶矩（方差）有限时成立；厚尾（如 i.i.d. Cauchy）强平稳序列可能方差不存在而非弱平稳", "永远不成立", "只对白噪声成立"], ans:1, why:"强平稳推弱平稳需有限二阶矩；Cauchy 型厚尾序列强平稳但方差不存在，不是弱平稳。", lv:3},
      {q:"课程所称「平稳时间序列过程」通常指弱平稳且「纯非确定性」的过程。「纯非确定性」的含义是：", opts:["序列可被其历史完全预测", "当前值不能被历史完全预测，含真正的随机新息", "序列方差为 0", "序列无任何自相关"], ans:1, why:"纯非确定性指存在不可预测的随机成分，历史的预测作用随步长衰减，保证序列含真正随机信息。", lv:3}
    ]
  },

  { id:"ar1", name:"AR(1)：拖 φ 看 ACF 指数拖尾", icon:"📉", minutes:10,
    demo:"demos/acf-pacf.html",
    hook:"今年的赔款总额，总是和去年「藕断丝连」。AR(1) 把这种记忆写成一个式子：<b>Xₜ = φXₜ₋₁ + eₜ</b>。φ 就是记忆的强度——它直接决定了 ACF 衰减得多快。",
    intuition:"AR(1) 中当前值直接依赖前一期。其 ACF 为 <b>ρₖ = φᵏ</b>，按几何级数<b>指数衰减（拖尾）</b>，永不截断；而 PACF 在<b>滞后 1 后截尾</b>（ϕ₁₁=φ，ϕₖk=0 对 k≥2）——因为 Xₜ 与 Xₜ₋₂ 的相关完全通过 Xₜ₋₁ 传递。拖动 φ，看 ACF 衰减速度如何变化。",
    chain:{
      param:{val:"自回归系数 φ", sub:"记忆强度"},
      math:{val:"ρₖ = φᵏ", sub:"指数拖尾"},
      real:{val:"冲击按 φ 的速度消散", sub:"预测衰减同步"}
    },
    engine:{type:"tsSim", title:"AR(1)：ACF 指数衰减，PACF 一阶截尾",
      model:"ar1",
      params:[{key:"phi", label:"自回归系数 φ", min:-0.95, max:0.95, step:0.05, val:0.7}],
      n:160, lags:14,
      live:(P,st)=>{ const a1=st.acf[0]; return {param:"φ="+(+P.phi).toFixed(2)+"|记忆强度", math:"ρ₁="+a1.toFixed(2)+"≈φ，ρₖ=φᵏ 拖尾|指数衰减", real:(P.phi<0?"负相关：上下交替震荡":"正相关：同向惯性")+"|冲击按 φᵏ 消散"}; },
      note:"φ>0 时 ACF 全为正、指数衰减；φ<0 时 ACF 正负交替衰减。无论正负，PACF 都只在 lag1 显著——这是识别 AR(1) 的指纹。"},
    drawers:{
      mechanism:"AR(1) 的「记忆」每期乘以 φ：一期前的冲击贡献 φ，两期前 φ²，k 期前 φᵏ。所以自相关 ρₖ=φᵏ 指数拖尾。而偏自相关剔除了中间传导，Xₜ 与 Xₜ₋ₖ（k≥2）没有直接联系，故 PACF 一阶截尾。",
      math:"Xₜ=φXₜ₋₁+eₜ，|φ|<1。<br>ACF：ρₖ=φᵏ（拖尾）。<br>PACF：ϕ₁₁=φ，ϕₖk=0（k≥2，截尾）。<br>方差：γ(0)=σ²/(1−φ²)。<br>Yule-Walker：ρ(1)=φ。",
      code:"# AR(1) 的 ACF/PACF\nlibrary(forecast)\nx <- arima.sim(list(ar=0.7), n=300)\nacf(x)    # 指数拖尾\npacf(x)   # lag1 后截尾"},
    quiz:[
      {q:"平稳 AR(1) 可写成 MA(∞) 形式 Xₜ=Σ<sub>j≥0</sub> wⱼ·eₜ₋ⱼ，其中权重 wⱼ 为：", opts:["φʲ", "j·φ", "φ/j", "1−φʲ"], ans:0, why:"Xₜ=(1−φB)⁻¹eₜ=Σφʲ eₜ₋ⱼ，冲击权重按 φʲ 几何衰减。", lv:1},
      {q:"用矩估计（Yule-Walker）估计 AR(1) 参数 φ 时，φ̂ 直接取样本的：", opts:["滞后 1 自相关系数 ρ̂₁", "样本方差", "样本均值", "滞后 1 偏自相关系数的平方"], ans:0, why:"AR(1) 有 ρ₁=φ，故矩估计 φ̂=ρ̂₁。", lv:1},
      {q:"当 AR(1) 的自回归系数 φ=0 时，过程 Xₜ=eₜ 退化为：", opts:["随机游走", "白噪声", "MA(1)", "ARMA(1,1)"], ans:1, why:"φ=0 时 Xₜ=eₜ，各期独立无记忆，即白噪声。", lv:1},
      {q:"两个平稳 AR(1) 的 φ 分别为 0.3 与 0.9，关于其 ACF 衰减正确的是：", opts:["φ=0.3 衰减更慢、记忆更长", "φ=0.9 衰减更慢、记忆更长", "两者衰减速度相同", "φ 越大 ACF 衰减越快"], ans:1, why:"ρₖ=φᵏ，|φ| 越接近 1 衰减越慢、持续性越强。", lv:2},
      {q:"AR(1) Xₜ=0.6Xₜ₋₁+eₜ，新息方差 σ²=1，则 Xₜ 的方差 γ(0) 为：", opts:["1.000", "1.5625", "0.640", "2.500"], ans:1, why:"γ(0)=σ²/(1−φ²)=1/(1−0.36)=1/0.64=1.5625。", lv:2},
      {q:"AR(1) 中 φ=−0.5，则滞后 2 的自相关系数 ρ₂ 等于：", opts:["−0.5", "0.25", "−0.25", "0.5"], ans:1, why:"ρ₂=φ²=(−0.5)²=0.25；负 φ 使奇数阶为负、偶数阶为正。", lv:2},
      {q:"平稳 AR(1) 的方差 γ(0)=4、滞后 1 自相关 ρ₁=0.5，则新息方差 σ² 为：", opts:["3", "2", "1", "4"], ans:0, why:"φ=ρ₁=0.5；σ²=γ(0)(1−φ²)=4×(1−0.25)=3。", lv:3},
      {q:"关于 AR(1) 参数 φ 趋近 1 的行为，正确的辨析是：", opts:["方差 σ²/(1−φ²) 趋于 0", "φ→1⁻ 时方差趋于无穷，φ=1 即随机游走（单位根），是平稳与非平稳的临界点", "φ=1 时序列仍平稳", "φ 越接近 1 记忆越短"], ans:1, why:"γ(0)=σ²/(1−φ²) 随 φ→1 发散；φ=1 为单位根随机游走，正是平稳性边界。", lv:3},
      {q:"AR(1)（φ=0.5）在 t 期受单位冲击 eₜ=1，该冲击对 Xₜ₊₃ 的贡献（MA(∞) 权重）为：", opts:["0.5", "0.25", "0.125", "0.0625"], ans:2, why:"t 期冲击对 Xₜ₊ⱼ 的贡献为 φʲ，j=3 时 0.5³=0.125。", lv:3}
    ]
  },

  { id:"ma1", name:"MA(1)：拖 θ 看 ACF 一阶截尾", icon:"✂️", minutes:10,
    demo:"demos/ts-models.html",
    hook:"上个月的理赔冲击，这个月还没消化完——但它<b>只影响一个月</b>，再往后就彻底消失。MA(1) 描述的正是这种「只记一期」的记忆：ACF 在滞后 1 之后<b>一刀切断</b>。",
    intuition:"MA(1)：Xₜ = eₜ + θeₜ₋₁，当前值只与本期和上一期的冲击有关。因此 ACF <b>在 lag1 后截尾</b>（ρ₁=θ/(1+θ²)，ρₖ=0 对 k≥2）；而 PACF <b>拖尾</b>。这与 AR(1) 恰好互补。拖动 θ，看 ACF 的 lag1 柱如何变化、lag2 之后如何保持为 0。",
    chain:{
      param:{val:"移动平均系数 θ", sub:"上期冲击的权重"},
      math:{val:"ρ₁=θ/(1+θ²)，ρₖ=0 (k≥2)", sub:"一阶截尾"},
      real:{val:"冲击只持续一期", sub:"记忆短暂"}
    },
    engine:{type:"tsSim", title:"MA(1)：ACF 一阶截尾，PACF 拖尾",
      model:"ma1",
      params:[{key:"theta", label:"移动平均系数 θ", min:-0.9, max:0.9, step:0.05, val:0.6}],
      n:160, lags:14,
      live:(P,st)=>{ const a1=st.acf[0]; const th=P.theta/(1+P.theta*P.theta); return {param:"θ="+(+P.theta).toFixed(2)+"|上期冲击权重", math:"ρ₁="+a1.toFixed(2)+"（理论 "+th.toFixed(2)+"），lag2+≈0|一阶截尾", real:"冲击只持续一期|ACF 一刀切断"}; },
      note:"注意 lag2 之后的 ACF 柱基本都在金色置信带内（不显著）——这就是「截尾」。对比 AR(1) 的 ACF 一路衰减，MA(1) 的记忆只有一期。"},
    drawers:{
      mechanism:"MA(1) 的冲击 eₜ₋₁ 只出现在 Xₜ₋₁ 和 Xₜ 里，隔一期就没有共同冲击了，所以 ρₖ=0（k≥2），ACF 截尾。但用 X 的历史反推 e 需要无穷阶 AR，故 PACF 拖尾。MA(q) 天然平稳（任何 θ 都平稳）。",
      math:"Xₜ=eₜ+θeₜ₋₁。<br>γ(0)=(1+θ²)σ²，γ(1)=θσ²，γ(k)=0（k≥2）。<br>ACF：ρ₁=θ/(1+θ²)，ρₖ=0（k≥2，截尾）。PACF 拖尾。<br>MA(q) 恒平稳；可逆 ⇔ |θ|<1。",
      code:"# MA(1) 的 ACF 截尾\nx <- arima.sim(list(ma=0.6), n=300)\nacf(x)    # lag1 后截尾\npacf(x)   # 拖尾"},
    quiz:[
      {q:"MA(1) 过程 Xₜ=eₜ+θeₜ₋₁ 的方差 γ(0) 等于：", opts:["σ²", "(1+θ²)σ²", "θσ²", "θ²σ²"], ans:1, why:"γ(0)=Var(eₜ)+θ²Var(eₜ₋₁)=(1+θ²)σ²。", lv:1},
      {q:"MA(1) 过程可逆（可表示为收敛的 AR(∞)）的条件是：", opts:["|θ|<1", "θ>0", "|θ|>1", "任何 θ 都可逆"], ans:0, why:"可逆需 1+θz=0 的根 |z|=1/|θ|>1，即 |θ|<1。", lv:1},
      {q:"MA(2) 过程的 ACF 在滞后 2 之后 ρₖ（k≥3）等于：", opts:["指数衰减", "0", "θ₂", "σ²"], ans:1, why:"MA(q) 的 ACF 在 q 阶后截尾，MA(2) 故 k≥3 时 ρₖ=0。", lv:1},
      {q:"MA(1) Xₜ=eₜ+0.5eₜ₋₁ 的滞后 1 自相关系数 ρ₁ 为：", opts:["0.5", "0.4", "0.25", "1.25"], ans:1, why:"ρ₁=θ/(1+θ²)=0.5/(1+0.25)=0.4。", lv:2},
      {q:"MA(1) 中若 θ=−0.8，则 ρ₁ 约为：", opts:["+0.487", "−0.487", "0", "−0.8"], ans:1, why:"ρ₁=−0.8/(1+0.64)=−0.8/1.64≈−0.487；符号随 θ，且 |ρ₁|≠|θ|。", lv:2},
      {q:"MA(1) 的「可逆性」（|θ|<1）主要保证：", opts:["序列平稳", "可由观测值 X 唯一且收敛地反推新息 eₜ", "ACF 截尾", "方差恒定"], ans:1, why:"MA(q) 恒平稳、ACF 恒截尾、方差恒有限；可逆性的作用是新息可由观测唯一（收敛）表示。", lv:2},
      {q:"对任意实数 θ，MA(1) 的 ρ₁=θ/(1+θ²) 的绝对值最大不超过：", opts:["1", "0.5", "0.25", "2"], ans:1, why:"θ/(1+θ²) 在 θ=±1 处取极值 ±0.5，故 |ρ₁|≤0.5（区别于 AR(1) 的 ρ₁ 可趋近 1）。", lv:3},
      {q:"MA(1) 的 PACF 呈拖尾，其衰减形态最接近下列哪个？", opts:["白噪声的 ACF（全为 0）", "AR(1) 的 ACF（几何衰减）", "MA(1) 的 ACF（一阶截尾）", "随机游走的方差"], ans:1, why:"MA(1) 可写成 AR(∞)，其 PACF 拖尾、近似几何衰减，恰似 AR(1) 的 ACF（二者互补）。", lv:3},
      {q:"MA(1) 满足 γ(0)=5σ² 且 ρ₁=0.4。由 (1+θ²)=5 与 θ/(1+θ²)=0.4 解得 θ 并判断可逆性：", opts:["θ=2，不可逆（|θ|>1）", "θ=0.5，可逆", "θ=2，可逆", "θ=0.4，可逆"], ans:0, why:"θ²=4 且 ρ₁>0 取 θ=2，ρ₁=2/5=0.4 吻合；|θ|=2>1 故不可逆。", lv:3}
    ]
  },

  { id:"arma", name:"AR(2) 与 ARMA：拖尾 × 拖尾", icon:"🌀", minutes:10,
    demo:"demos/ts-models.html",
    hook:"真实世界的赔款序列，记忆往往不止一期，还可能<b>来回震荡</b>。AR(2) 引入前两期的影响，能产生周期性波动；ARMA 则把 AR 与 MA 揉在一起——ACF 和 PACF <b>双双拖尾</b>。",
    intuition:"AR(2)：Xₜ=φ₁Xₜ₋₁+φ₂Xₜ₋₂+eₜ。φ₂ 为负时序列呈<b>震荡</b>（ACF 正负交替）。ARMA(p,q) 兼有 AR 与 MA 特征：ACF 与 PACF <b>都拖尾</b>。拖动 φ₁、φ₂，观察 ACF 从单调衰减变为震荡衰减。",
    chain:{
      param:{val:"φ₁, φ₂", sub:"前两期权重"},
      math:{val:"特征根决定衰减形态", sub:"实根单调/复根震荡"},
      real:{val:"赔款周期的起伏", sub:"ARMA 双拖尾"}
    },
    engine:{type:"tsSim", title:"AR(2)：拖 φ₂ 看 ACF 从单调衰减到震荡",
      model:"ar2",
      params:[
        {key:"phi1", label:"φ₁（一期权重）", min:0, max:1.2, step:0.05, val:0.5},
        {key:"phi2", label:"φ₂（二期权重，负值→震荡）", min:-0.9, max:0.3, step:0.05, val:-0.3}
      ],
      n:160, lags:14,
      live:(P,st)=>{ const a1=st.acf[0]; return {param:"φ₁="+(+P.phi1).toFixed(2)+" φ₂="+(+P.phi2).toFixed(2)+"|前两期权重", math:"样本 ρ₁="+a1.toFixed(2)+"|特征根"+(P.phi2<0?"为复根→震荡":"为实根→单调"), real:(P.phi2<0?"序列来回震荡，像周期波动":"序列单调回归均值")+"|ARMA 双拖尾"}; },
      note:"把 φ₂ 拖到负值：序列出现明显的上下交替，ACF 也变成正负交替衰减——这是复特征根的签名。ARMA 模型的 ACF 与 PACF 都拖尾，识别阶数需结合两者。"},
    drawers:{
      mechanism:"AR(2) 的特征方程 1−φ₁z−φ₂z²=0 若有复根，解呈振荡形式，ACF 就正负交替衰减。ARMA(p,q) 同时含 AR（PACF 本应截尾）和 MA（ACF 本应截尾），两者互相「污染」，导致 ACF、PACF 都拖尾——这时要用信息准则（AIC/BIC）定阶。",
      math:"AR(2)：Xₜ=φ₁Xₜ₋₁+φ₂Xₜ₋₂+eₜ，特征方程 1−φ₁z−φ₂z²=0。<br>平稳 ⇔ 所有特征根 |z|>1。<br>ARMA(p,q)：Φ(B)Xₜ=α+Θ(B)eₜ。<br>识别：ACF 拖尾 + PACF 拖尾 → ARMA。",
      code:"# AR(2) 震荡 vs 单调\nx1 <- arima.sim(list(ar=c(0.5,-0.3)), n=300)  # 震荡\nx2 <- arima.sim(list(ar=c(0.8, 0.1)), n=300)  # 单调\nacf(x1); acf(x2)"},
    quiz:[
      {q:"AR(2) 过程 Xₜ=φ₁Xₜ₋₁+φ₂Xₜ₋₂+eₜ 的特征方程为：", opts:["1−φ₁z−φ₂z²=0", "1+φ₁z+φ₂z²=0", "z−φ₁=0", "1−φ₁z=0"], ans:0, why:"AR(p) 特征方程 Φ(z)=1−φ₁z−φ₂z²=0；其余是 AR(1) 形式或符号错误。", lv:1},
      {q:"ARMA(p,q) 模型的平稳性取决于：", opts:["MA 部分 Θ(B)", "AR 部分 Φ(B) 的特征根（模均大于 1）", "差分次数", "新息方差 σ²"], ans:1, why:"平稳性由 AR 部分特征根决定；可逆性才由 MA 部分决定。", lv:1},
      {q:"ARMA(p,0) 与 ARMA(0,q) 分别退化为：", opts:["AR(p) 与 MA(q)", "MA(p) 与 AR(q)", "都是白噪声", "ARIMA 与 MA(q)"], ans:0, why:"q=0 无 MA 项即 AR(p)；p=0 无 AR 项即 MA(q)。", lv:1},
      {q:"AR(2) 的 ACF 满足的 Yule-Walker 递推关系（k 足够大）为：", opts:["ρₖ=φ₁ρₖ₋₁+φ₂ρₖ₋₂", "ρₖ=φ₁ᵏ", "ρₖ=0（k≥3）", "ρₖ=θρₖ₋₁"], ans:0, why:"AR(2) 的 ρₖ 由前两项线性递推；φᵏ 是 AR(1)，k≥3 为 0 是 MA(2)。", lv:2},
      {q:"ARMA(1,1) 的 ACF 自滞后 2 起按 ρₖ=φᵏ⁻¹ρ₁ 衰减，其衰减速度主要由谁决定？", opts:["MA 系数 θ", "AR 系数 φ", "新息方差 σ²", "序列均值 μ"], ans:1, why:"k≥2 后 ρₖ 含因子 φᵏ⁻¹，|φ| 越接近 1 衰减越慢。", lv:2},
      {q:"ARMA(p,q) 模型的可逆性取决于：", opts:["AR 部分 Φ(B)", "MA 部分 Θ(B) 的特征根模均大于 1", "差分算子 ∇", "ACF 的截尾阶数"], ans:1, why:"可逆性由 MA 部分 Θ(z)=0 的根在单位圆外决定，与平稳性（看 AR 部分）对偶。", lv:2},
      {q:"AR(2) 平稳的参数域条件（由特征根在单位圆外推出）为：", opts:["φ₁+φ₂<1、φ₂−φ₁<1 且 |φ₂|<1", "|φ₁|<1 且 |φ₂|<1", "φ₁+φ₂>1", "φ₂>0 即可"], ans:0, why:"AR(2) 平稳的充要是三角域：φ₁+φ₂<1、φ₂−φ₁<1、|φ₂|<1；仅 |φᵢ|<1 是必要非充分。", lv:3},
      {q:"ARMA(1,1) Xₜ=0.5Xₜ₋₁+eₜ+0.5eₜ₋₁，其 ρ₁=(φ+θ)(1+φθ)/(1+θ²+2φθ) 约为：", opts:["0.714", "0.500", "1.000", "0.250"], ans:0, why:"分子 (0.5+0.5)(1+0.25)=1.25，分母 1+0.25+0.5=1.75，ρ₁=1.25/1.75≈0.714。", lv:3},
      {q:"AR(2) 过程特征方程 1−φ₁z−φ₂z²=0 的根为 λ，而 ACF 递推 ρₖ=φ₁ρₖ₋₁+φ₂ρₖ₋₂ 的差分方程特征根为 r，两者关系是：", opts:["完全相同", "互为倒数 r=1/λ（故 ACF 项 (1/λ)ᵏ 随 |λ|>1 衰减）", "互为相反数", "毫无关联"], ans:1, why:"令 z=1/r 代入过程特征方程即得 r²−φ₁r−φ₂=0，故 r=1/λ；平稳 |λ|>1 保证 ACF 衰减。", lv:3}
    ]
  },

  { id:"backshift", name:"后移算子 B 与差分算子 ∇", icon:"🧮", minutes:9,
    demo:"demos/box-jenkins.html",
    hook:"把 Xₜ − 0.7Xₜ₋₁ = eₜ 写成 <b>(1−0.7B)Xₜ = eₜ</b>，整个时间序列代数就变成了<b>多项式代数</b>——可以因式分解、可以求逆。这就是后移算子 B 的威力。",
    intuition:"后移算子 B 满足 <b>BXₜ = Xₜ₋₁</b>，Bᵏ Xₜ = Xₜ₋ₖ。差分算子 <b>∇=1−B</b>，∇Xₜ = Xₜ − Xₜ₋₁（一阶差分），∇²Xₜ = Xₜ − 2Xₜ₋₁ + Xₜ₋₂。差分能消除趋势、实现平稳化。试着拼出二阶差分的展开式。",
    chain:{
      param:{val:"算子 B / ∇", sub:"时间索引的代数"},
      math:{val:"∇²=(1−B)²=1−2B+B²", sub:"二项式展开"},
      real:{val:"差分消趋势、平稳化", sub:"ARIMA 的基石"}
    },
    engine:{type:"build", title:"拼装二阶差分 ∇²Xₜ 的展开式",
      prompt:"用下方积木拼出 ∇²Xₜ = (1−B)²Xₜ 的正确展开：",
      bank:["Xₜ","−2Xₜ₋₁","+Xₜ₋₂","+2Xₜ₋₁","−Xₜ₋₂","Xₜ₋₁"],
      answer:["Xₜ","−2Xₜ₋₁","+Xₜ₋₂"],
      success:"∇²Xₜ = Xₜ − 2Xₜ₋₁ + Xₜ₋₂，正是 (1−B)² 的二项式展开。",
      fail:"提示：(1−B)² = 1 − 2B + B²，注意中间项系数是 −2。"},
    drawers:{
      mechanism:"后移算子把「时间下标」变成「代数符号」：B 作用一次下标减 1。于是 ARMA 模型写成 Φ(B)Xₜ=Θ(B)eₜ 的多项式形式，可以像多项式一样因式分解、判断可逆性（|α|<1 时 (1−αB)⁻¹=Σαʲ Bʲ）。差分 ∇=1−B 反复作用可消去 d 阶趋势。",
      math:"BXₜ=Xₜ₋₁，BᵏXₜ=Xₜ₋ₖ。<br>∇=1−B，∇Xₜ=Xₜ−Xₜ₋₁。<br>∇²Xₜ=Xₜ−2Xₜ₋₁+Xₜ₋₂。<br>(1−αB)⁻¹=Σⱼ₌₀<sup>∞</sup> αʲ Bʲ（|α|<1）。<br>AR(1)→MA(∞)：Xₜ=(1−φB)⁻¹eₜ=Σφʲ eₜ₋ⱼ。",
      code:"# 算子运算验证\n# (1+B)(1-B)^2 = 1 - B - B^2 + B^3\npoly <- c(1,1) %o% c(1,-2,1)  # 卷积\n# 结果系数: 1, -1, -1, 1"},
    quiz:[
      {q:"后移算子 B 作用于常数 μ 的结果 Bμ 为：", opts:["μ", "0", "μ−1", "Bμ 无定义"], ans:0, why:"B 只移动时间下标，常数不含下标，故 Bμ=μ。", lv:1},
      {q:"二阶差分 ∇²Xₜ=(1−B)²Xₜ 展开为：", opts:["Xₜ−2Xₜ₋₁+Xₜ₋₂", "Xₜ−Xₜ₋₂", "Xₜ+2Xₜ₋₁+Xₜ₋₂", "2Xₜ−Xₜ₋₁"], ans:0, why:"(1−B)²=1−2B+B²，中间项系数为 −2；Xₜ−Xₜ₋₂ 是常见错误。", lv:1},
      {q:"AR(1) Xₜ=φXₜ₋₁+eₜ 用后移算子可写为：", opts:["(1−φB)Xₜ=eₜ", "(1+φB)Xₜ=eₜ", "(B−φ)Xₜ=eₜ", "(1−φ)BXₜ=eₜ"], ans:0, why:"φXₜ₋₁=φBXₜ，移项得 (1−φB)Xₜ=eₜ。", lv:1},
      {q:"算子乘积 (1+B)∇Xₜ=(1+B)(1−B)Xₜ 化简为：", opts:["Xₜ−Xₜ₋₂", "Xₜ−Xₜ₋₁", "Xₜ+Xₜ₋₂", "(1−B)²Xₜ"], ans:0, why:"(1+B)(1−B)=1−B²，故得 Xₜ−Xₜ₋₂（隔一期差分）。", lv:2},
      {q:"将 AR(1) Xₜ=(1−0.7B)⁻¹eₜ 展开为 MA(∞)，eₜ₋₂ 的系数为：", opts:["0.7", "0.49", "0.343", "1.4"], ans:1, why:"(1−0.7B)⁻¹=1+0.7B+0.49B²+⋯，eₜ₋₂ 对应 0.7²=0.49。", lv:2},
      {q:"三阶差分 ∇³Xₜ=(1−B)³Xₜ 展开式中 Xₜ₋₁ 项的系数为：", opts:["−3", "3", "−1", "−2"], ans:0, why:"(1−B)³=1−3B+3B²−B³，Xₜ₋₁（即 B 项）系数为 −3。", lv:2},
      {q:"算子 (1+B)∇²Xₜ=(1+B)(1−B)²Xₜ 展开为：", opts:["Xₜ−Xₜ₋₁−Xₜ₋₂+Xₜ₋₃", "Xₜ−2Xₜ₋₁+Xₜ₋₂", "Xₜ−Xₜ₋₃", "Xₜ+Xₜ₋₁−Xₜ₋₂−Xₜ₋₃"], ans:0, why:"(1+B)(1−2B+B²)=1−B−B²+B³，即 Xₜ−Xₜ₋₁−Xₜ₋₂+Xₜ₋₃。", lv:3},
      {q:"含二次趋势 Xₜ=a+bt+ct²+εₜ（c≠0）的序列，要消除趋势项至少需几阶差分？", opts:["1 阶", "2 阶", "3 阶", "0 阶"], ans:1, why:"每阶差分把多项式趋势降一次：∇(t²)=2t−1 仍线性，∇²(t²)=2 为常数，故二次趋势需 2 阶。", lv:3},
      {q:"ARIMA(1,1,0) 模型 (1−0.6B)(1−B)Xₜ=eₜ 展开为：", opts:["Xₜ−1.6Xₜ₋₁+0.6Xₜ₋₂=eₜ", "Xₜ−0.6Xₜ₋₁=eₜ", "Xₜ−1.6Xₜ₋₁−0.6Xₜ₋₂=eₜ", "(1−B)²Xₜ=eₜ"], ans:0, why:"(1−0.6B)(1−B)=1−1.6B+0.6B²，即 Xₜ−1.6Xₜ₋₁+0.6Xₜ₋₂=eₜ。", lv:3}
    ]
  },

  { id:"acf-pacf-identify", name:"模型识别：拖尾 vs 截尾", icon:"🔎", minutes:9,
    demo:[{t:"ACF 与 PACF",src:"demos/acf-pacf.html"},{t:"模型识别",src:"demos/model-identification.html"}],
    hook:"拿到一条未知序列的 ACF 和 PACF 图，你就像拿到<b>指纹</b>：AR 的 PACF 截尾、MA 的 ACF 截尾、ARMA 双双拖尾。学会读指纹，Box-Jenkins 建模的第一步就完成了。",
    intuition:"识别口诀：<b>AR(p)：ACF 拖尾、PACF 在 p 阶截尾；MA(q)：ACF 在 q 阶截尾、PACF 拖尾；ARMA(p,q)：两者都拖尾；白噪声：ACF 全部不显著</b>。ACF 看「总相关」，PACF 看「剔除中间传导后的直接相关」——就像看一个人的全部社会关系 vs 只看直接朋友。",
    chain:{
      param:{val:"模型类型", sub:"AR / MA / ARMA"},
      math:{val:"ACF 与 PACF 的截尾/拖尾", sub:"识别指纹"},
      real:{val:"给未知序列选对模型", sub:"Box-Jenkins 第一步"}
    },
    engine:{type:"match", title:"配对：模型与其 ACF/PACF 指纹",
      pairs:[
        {l:"AR(p)", r:"ACF 拖尾，PACF 在 p 阶后截尾"},
        {l:"MA(q)", r:"ACF 在 q 阶后截尾，PACF 拖尾"},
        {l:"ARMA(p,q)", r:"ACF 与 PACF 都拖尾"},
        {l:"白噪声", r:"ACF 在 k≥1 全部不显著"},
        {l:"AR(1) φ=0.7", r:"ACF 按 0.7ᵏ 几何衰减"},
        {l:"PACF 的含义", r:"剔除中间变量后的纯粹 k 期相关"}
      ]},
    drawers:{
      mechanism:"ACF 包含直接+间接相关（Xₜ 与 Xₜ₊₂ 可能全靠 Xₜ₊₁ 传递），PACF 把中间变量剔除、只看直接联系。AR(p) 只直接依赖前 p 期，故 PACF p 阶截尾；MA(q) 的冲击只共享 q 期，故 ACF q 阶截尾。两者互补，像「全部社会关系」与「直接朋友」的区别。",
      math:"ACF：ρ(k)=γ(k)/γ(0)。<br>PACF：ϕₖk 为 Xₜ 对 Xₜ₋₁,…,Xₜ₋ₖ 回归中 Xₜ₋ₖ 的系数。<br>ϕ₁₁=ρ₁，ϕ₂₂=(ρ₂−ρ₁²)/(1−ρ₁²)。<br>识别表：AR→PACF 截尾；MA→ACF 截尾；ARMA→双拖尾。",
      code:"# 用 ACF/PACF 识别模型\nlibrary(forecast)\npar(mfrow=c(1,2))\nacf(x); pacf(x)\n# PACF 2 阶截尾 → AR(2)\n# ACF 1 阶截尾 → MA(1)\nauto.arima(x)  # 自动定阶"},
    quiz:[
      {q:"白噪声序列的样本 ACF 表现为：", opts:["滞后 k≥1 全部落在置信带内（不显著）", "指数拖尾", "在 1 阶截尾", "在 2 阶截尾"], ans:0, why:"白噪声 ρ(k)=0（k≥1），样本 ACF 各阶均不显著。", lv:1},
      {q:"纯 AR(p) 过程的理论 PACF 在滞后 p 之后 ϕₖk（k>p）等于：", opts:["0（p 阶截尾）", "φᵏ", "指数衰减", "σ²"], ans:0, why:"AR(p) 只直接依赖前 p 期，PACF 在 p 阶后截尾为 0。", lv:1},
      {q:"「ACF 拖尾、PACF 截尾」是哪类模型的识别指纹？", opts:["MA 模型", "AR 模型", "ARMA 模型", "白噪声"], ans:1, why:"AR(p)：ACF 拖尾、PACF 在 p 阶截尾；MA 恰好相反（ACF 截尾、PACF 拖尾）。", lv:1},
      {q:"已知 ρ₁=0.5、ρ₂=0.3，则二阶偏自相关 ϕ₂₂=(ρ₂−ρ₁²)/(1−ρ₁²) 约为：", opts:["0.067", "0.300", "0.250", "0.500"], ans:0, why:"ϕ₂₂=(0.3−0.25)/(1−0.25)=0.05/0.75≈0.067。", lv:2},
      {q:"某序列 ACF 在滞后 2 后截尾、PACF 拖尾，应初步判定为：", opts:["AR(2)", "MA(2)", "ARMA(2,2)", "AR(1)"], ans:1, why:"ACF 在 q 阶截尾 → MA(q)，此处 q=2；PACF 拖尾与之吻合。", lv:2},
      {q:"偏自相关系数 ϕₖk 在计算上等于：", opts:["Xₜ 对 Xₜ₋₁,…,Xₜ₋ₖ 回归时 Xₜ₋ₖ 的回归系数", "ρₖ 的平方", "γ(k)/γ(0)", "Xₜ 与 Xₜ₋ₖ 的简单相关系数"], ans:0, why:"ϕₖk 是剔除中间变量后 Xₜ₋ₖ 的净系数；γ(k)/γ(0) 是 ACF ρₖ。", lv:2},
      {q:"样本 ACF 与 PACF 均呈拖尾、无明显截尾点，最恰当的定阶做法是：", opts:["直接读 ACF 截尾阶为 q", "判定为 ARMA，用 AIC/BIC 在候选 (p,q) 中比较选优", "判定为白噪声", "只做差分不建模"], ans:1, why:"双拖尾是 ARMA 指纹，p、q 难直接读出，需信息准则比较候选模型。", lv:3},
      {q:"某序列 ρ₁=0.5、ρ₂=0.05，算得 ϕ₂₂=(ρ₂−ρ₁²)/(1−ρ₁²)≈−0.267，且 ϕₖk=0（k≥3）、ACF 拖尾。最可能的模型是：", opts:["MA(1)", "AR(2)（PACF 2 阶截尾）", "白噪声", "ARMA(1,1)"], ans:1, why:"ϕ₂₂≠0 而 k≥3 截尾，PACF 2 阶截尾配 ACF 拖尾 → AR(2)。", lv:3},
      {q:"分析者看到某序列 ACF 在 1 阶后截尾、PACF 拖尾，却判定为 AR(1)。其错误在于：", opts:["把 MA 的指纹（ACF 截尾）误当 AR；ACF 截尾对应 MA(1)，AR 应是 PACF 截尾", "判定完全正确", "应判为 ARMA(1,1)", "应判为白噪声"], ans:0, why:"ACF 截尾、PACF 拖尾是 MA(1) 的指纹；AR 模型应是 PACF 截尾、ACF 拖尾，二者不可记反。", lv:3}
    ]
  }
      ] },
  { id:14, no:"Ch14", name:"时间序列 II", icon:"🔮", color:"var(--ch14)", weight:"Syllabus 2 · 20%", status:"live", pdf:"pdf/loss-model-ch14.pdf", qa:"qa/ch14-qa.html",
    desc:"ARIMA、Box-Jenkins 识别-估计-诊断、预测、协整与多元 AR。", kps:[
      { id:"arima-differencing", name:"差分与 ARIMA：驯服随机游走", icon:"🪜", minutes:9,
        demo:[{t:"趋势与季节性",src:"demos/trend-1.html"},{t:"趋势去除",src:"demos/trend-2.html"}],
    hook:"股价、CPI、累计赔款……这些序列<b>一路漂移、永不回头</b>，ACF 慢得几乎不衰减。直接建模必然失败。解药只有一个字：<b>差</b>。差一下，随机游走就变回白噪声。",
    intuition:"随机游走 Xₜ=Xₜ₋₁+eₜ 是<b>非平稳</b>的（I(1)）：均值漂移、ACF 缓慢衰减。对它做<b>一阶差分 ∇Xₜ=Xₜ−Xₜ₋₁=eₜ</b>，立刻变成平稳的白噪声。若 X 差分 d 次后成为 ARMA(p,q)，则 X 是 <b>ARIMA(p,d,q)</b>。观察下图随机游走的 ACF 衰减得多慢——这就是「需要差分」的信号。",
    chain:{
      param:{val:"随机游走 Xₜ=Xₜ₋₁+eₜ", sub:"含单位根"},
      math:{val:"ACF 缓慢衰减不截尾", sub:"非平稳指纹"},
      real:{val:"一阶差分 ∇Xₜ=eₜ 即平稳", sub:"ARIMA 的 d"}
    },
    engine:{type:"tsSim", title:"随机游走：序列漂移、ACF 慢衰减（非平稳）",
      model:"rw",
      n:160, lags:14,
      live:(P,st)=>{ const a1=st.acf[0]; return {param:"随机游走 Xₜ=Xₜ₋₁+eₜ|含单位根，非平稳", math:"样本 ρ₁="+a1.toFixed(2)+"（缓慢衰减）|非平稳指纹", real:"一阶差分 ∇Xₜ=eₜ 即平稳|对应 ARIMA 的 d=1"}; },
      note:"对比 Ch13 的 AR(1)：随机游走的 ACF 衰减极慢、长期为正——这是单位根的标志。差分一次，序列就平稳了，这正是 ARIMA(p,d,q) 中 d 的来历。"},
    drawers:{
      mechanism:"非平稳三大来源：确定性趋势、季节性、积分序列（单位根）。差分专治单位根：∇ 把 Xₜ−Xₜ₋₁ 的增量留下，漂移被消去。d 的选取看差分后序列是否平稳（ACF 快速衰减、差分后方差最小），也可用 ADF 检验（p<0.05 拒绝单位根）。",
      math:"随机游走：Xₜ=Xₜ₋₁+eₜ，I(1)。<br>∇Xₜ=Xₜ−Xₜ₋₁=eₜ（平稳）。<br>ARIMA(p,d,q)：Φ(B)(1−B)ᵈ Xₜ=α+Θ(B)eₜ。<br>ADF 检验：H₀ 有单位根，p<0.05 → 平稳。",
      code:"# 差分平稳化\nx <- cumsum(rnorm(300))      # 随机游走\nacf(x)                       # 慢衰减\ndx <- diff(x)                # 一阶差分\nacf(dx)                      # 立即截尾（白噪声）\n# tseries::adf.test(x)       # 单位根检验"},
    quiz:[
      {q:"一阶差分算子 ∇Xₜ 的定义是：", opts:["Xₜ − Xₜ₋₁", "Xₜ − Xₜ₋₂", "Xₜ / Xₜ₋₁", "(Xₜ + Xₜ₋₁)/2"], ans:0, why:"一阶差分 ∇Xₜ=Xₜ−Xₜ₋₁，只留下相邻两期的增量。", lv:1},
      {q:"对随机游走 Xₜ=Xₜ₋₁+eₜ 做一阶差分 ∇Xₜ，得到：", opts:["仍是随机游走", "白噪声 eₜ", "AR(1) 过程", "确定性趋势"], ans:1, why:"∇Xₜ=Xₜ−Xₜ₋₁=eₜ，即平稳的白噪声。", lv:1},
      {q:"某序列需差分 2 次才变为平稳，则该序列是：", opts:["I(0)", "I(1)", "I(2)", "白噪声"], ans:2, why:"使序列平稳所需的差分次数即单整阶数 d，差 2 次为 I(2)。", lv:1},
      {q:"ARIMA(p,d,q) 中，对原序列做 d 次差分后得到的平稳序列服从：", opts:["ARMA(p,q) 平稳过程", "更高阶的 ARIMA", "白噪声", "MA(d) 过程"], ans:0, why:"差分消去 d 阶单位根后，剩下的就是平稳的 ARMA(p,q)。", lv:2},
      {q:"月度数据（周期 s=12）的季节差分 ∇₁₂Xₜ 为：", opts:["Xₜ − Xₜ₋₁", "Xₜ − Xₜ₋₁₂", "Xₜ − Xₜ₋₆", "Xₜ / Xₜ₋₁₂"], ans:1, why:"季节差分 ∇ₛXₜ=Xₜ−Xₜ₋ₛ，月度数据 s=12。", lv:2},
      {q:"带漂移随机游走 Xₜ=Xₜ₋₁+c+eₜ（c>0）的均值 E[Xₜ] 随时间：", opts:["恒定不变", "线性增长", "指数衰减", "周期性波动"], ans:1, why:"E[Xₜ]=X₀+ct，漂移项使均值随 t 线性上升。", lv:2},
      {q:"随机游走（X₀ 固定）的方差 var(Xₜ)=var(X₀)+tσ²，这主要违反弱平稳的哪一条件？", opts:["均值须为常数", "方差须有限且与 t 无关", "自协方差仅依赖滞后 k", "序列须可逆"], ans:1, why:"方差随 t 线性增大、依赖时间，违反恒定有限方差条件，故非平稳。", lv:3},
      {q:"带漂移随机游走 Xₜ=Xₜ₋₁+Zₜ，X₀=0，P(Z=+1)=0.6、P(Z=−1)=0.4，则 E[X₁0]=：", opts:["0", "2", "10", "6"], ans:1, why:"E[Z]=0.6−0.4=0.2，E[X₁0]=10×0.2=2。", lv:3},
      {q:"确定性线性趋势 Xₜ=α+βt+εₜ 与随机游走 Xₜ=Xₜ₋₁+eₜ 的本质区别是：", opts:["前者有趋势后者没有", "前者的冲击 εₜ 是暂时性的，后者的冲击永久累积", "前者非平稳后者平稳", "两者都必须差分才能平稳"], ans:1, why:"确定性趋势的扰动会消退、去趋势即平稳；随机游走的冲击永久累积，必须差分。", lv:3}
    ]
  },

  { id:"box-jenkins", name:"Box-Jenkins：识别-估计-诊断", icon:"🔁", minutes:9,
    demo:"demos/box-jenkins.html",
    hook:"面对一条陌生序列，Box 和 Jenkins 给了一套<b>可复制的流水线</b>：先识别阶数，再估计参数，最后诊断残差。诊断不过关？回到第一步重来。这套循环至今仍是 ARIMA 建模的标准动作。",
    intuition:"Box-Jenkins 三阶段：<b>① 识别（Identification）</b>——用序列图/ACF/PACF 定 p,d,q；<b>② 估计（Estimation）</b>——最小二乘或 MLE 求参数；<b>③ 诊断（Diagnostic）</b>——检验残差是否白噪声。通过则预测，否则返回识别。模型选择用 <b>AIC</b> 防止过拟合。",
    chain:{
      param:{val:"三阶段循环", sub:"识别→估计→诊断"},
      math:{val:"AIC=log(σ̂²)+2k/n", sub:"取最小防过拟合"},
      real:{val:"残差是白噪声才算合格", sub:"可交付预测"}
    },
    engine:{type:"match", title:"配对：Box-Jenkins 阶段与任务",
      pairs:[
        {l:"阶段 1：识别 Identification", r:"用 ACF/PACF 与差分确定 p,d,q"},
        {l:"阶段 2：估计 Estimation", r:"最小二乘 / MLE 估计 φ、θ"},
        {l:"阶段 3：诊断 Diagnostic", r:"检验残差是否为白噪声"},
        {l:"确定 d", r:"差分至 ACF 快速衰减 / 差分后方差最小"},
        {l:"AIC 准则", r:"log(σ̂²)+2×参数个数/n，取最小"},
        {l:"诊断不通过", r:"返回阶段 1 重新识别"}
      ]},
    drawers:{
      mechanism:"识别靠「指纹」：ACF 慢衰减→需差分（定 d）；PACF p 阶截尾→AR(p)；ACF q 阶截尾→MA(q)；双拖尾→ARMA，用 AIC 定阶。估计把参数算出来。诊断是质检：残差必须像白噪声（无自相关、均值 0、方差恒定），否则说明模型没榨干信息，要回炉。",
      math:"AIC=log(σ̂²)+2k/n（k 为参数个数）。<br>识别：d 看 ACF 衰减/差分方差最小；p 看 PACF 截尾；q 看 ACF 截尾。<br>估计：AR 用最小二乘/Yule-Walker，MA、ARMA 用 MLE。<br>诊断通过后用于预测。",
      code:"# Box-Jenkins 全流程\nlibrary(forecast)\npar(mfrow=c(1,2)); acf(x); pacf(x)   # 识别\nfit <- auto.arima(x)                  # 自动定阶+估计\ncheckresiduals(fit)                   # 诊断（Ljung-Box）\nforecast(fit, h=10)                   # 预测"},
    quiz:[
      {q:"Box-Jenkins 中，用序列图、ACF/PACF 与差分来确定 p,d,q 属于：", opts:["估计阶段", "识别阶段", "诊断阶段", "预测阶段"], ans:1, why:"识别（Identification）阶段的任务就是确定 ARIMA(p,d,q) 的阶数。", lv:1},
      {q:"AIC=log(σ̂²)+2k/n 中的 k 指：", opts:["样本观测个数", "模型参数个数", "差分次数", "滞后阶数上限"], ans:1, why:"k 是参数个数，2k/n 是对模型复杂度的惩罚项。", lv:1},
      {q:"估计纯 AR 模型参数最常用的方法是：", opts:["最小二乘 / Yule-Walker 方程", "差分至平稳", "Ljung-Box 检验", "转折点计数"], ans:0, why:"AR 模型可用最小二乘或 Yule-Walker 矩估计；MA/ARMA 才常用 MLE。", lv:1},
      {q:"样本 PACF 在滞后 2 后截尾、ACF 拖尾，应初步选：", opts:["MA(2)", "AR(2)", "ARMA(2,2)", "ARIMA(0,2,0)"], ans:1, why:"PACF 在 p 阶截尾是 AR(p) 的指纹，故取 AR(2)。", lv:2},
      {q:"ACF 与 PACF 都呈拖尾（双拖尾），定阶通常应：", opts:["直接取 AR(1)", "借助 AIC 等信息准则尝试 ARMA(p,q)", "只做差分", "放弃建模"], ans:1, why:"双拖尾提示 ARMA，p、q 难直接读出，需 AIC 比较候选模型。", lv:2},
      {q:"按「差分后方差最小」原则选 d，样本方差 σ̂²<sub>d</sub> 随 d 通常：", opts:["单调递减", "单调递增", "先降后升，取最小处", "恒定不变"], ans:2, why:"差分到平稳时方差最小，再差分会过度差分使方差回升。", lv:2},
      {q:"拟合 ARMA 模型后残差 Ljung-Box 检验 p=0.01，正确的下一步是：", opts:["直接用于预测", "返回识别阶段重新定阶", "增大置信水平即可", "接受该模型"], ans:1, why:"p<0.05 拒绝白噪声，说明模型未榨干信息，应回识别阶段重定 p,d,q。", lv:3},
      {q:"参数个数接近样本量 n 的「完美拟合」模型，其典型表现是：", opts:["参数 t 值普遍不显著、预测几乎无用", "AIC 必然最小", "残差一定是白噪声", "预测精度最高"], ans:0, why:"这是过拟合：拟合虽好但参数不显著、外推预测毫无用处。", lv:3},
      {q:"两个候选模型的 AIC 分别为 −3.2 与 −2.9，按 AIC 准则应选：", opts:["AIC=−2.9 的模型（数值较大）", "AIC=−3.2 的模型（数值较小）", "两者等价", "无法比较"], ans:1, why:"AIC 取最小，越负越好，故选 −3.2 的模型。", lv:3}
    ]
  },

  { id:"forecast", name:"预测：AR(1) 的衰减记忆", icon:"🔮", minutes:9,
    demo:"demos/ts-models.html",
    hook:"模型建好了，现在要预测明年、后年的赔款。AR(1) 的预测有个优美的规律：<b>越往后看，预测越向均值回归</b>，而且回归速度恰好是 φʰ。拖一拖 φ，看预测曲线如何「失忆」。",
    intuition:"AR(1) 的 h 步向前预测为 <b>x̂ₙ(h)=φʰ·xₙ</b>（设均值为 0）。φ 越大，预测衰减越慢、记忆越久；φ 越小，预测越快回归均值。拖动 φ 与当前值 x<sub>T</sub>，观察预测曲线向 0 衰减的速度。",
    chain:{
      param:{val:"φ 与当前值 x<sub>T</sub>", sub:"预测起点"},
      math:{val:"x̂(h)=φʰ·x<sub>T</sub>", sub:"几何衰减"},
      real:{val:"远期预测趋于均值", sub:"不确定性增大"}
    },
    engine:{type:"curve", title:"AR(1) 的 h 步预测：φʰ·x<sub>T</sub> 向均值衰减",
      x:{min:0,max:10,label:"预测步长 h"}, y:{label:"预测值 x̂(h)"},
      series:[{label:"预测 x̂(h)=φʰ·x<sub>T</sub>", color:"var(--ch14)", fn:"foreAR1", width:3}],
      params:[
        {key:"phi", label:"自回归系数 φ", min:0.1, max:0.95, step:0.05, val:0.7},
        {key:"xT", label:"当前值 x<sub>T</sub>", min:1, max:10, step:0.5, val:5}
      ],
      live:(P)=>{ const h5=P.xT*Math.pow(P.phi,5); return {param:"φ="+(+P.phi).toFixed(2)+" · x<sub>T</sub>="+(+P.xT).toFixed(1)+"|预测起点", math:"x̂(5)=φ⁵x<sub>T</sub>="+h5.toFixed(2)+"|几何衰减", real:(P.phi>0.8?"记忆持久：远期仍偏离均值":"快速回归均值")+"|预测渐失记忆"}; },
      note:"φ=0.9 时预测久久不回落；φ=0.3 时两三步就贴近均值 0。预测越远，越接近均值，置信区间也越宽——这就是 AR 预测的「均值回归」本质。"},
    drawers:{
      mechanism:"预测用条件期望：未来的 e 期望为 0，已知的 X 用观测值、未知的 X 用预测值递推。AR(1) 递推得 x̂(h)=φʰ xₙ，呈几何衰减。φ 越接近 1，衰减越慢，序列「记性」越好；同时预测误差方差随 h 增大，置信带变宽。",
      math:"AR(1)：x̂ₙ(1)=φxₙ，x̂ₙ(2)=φ²xₙ，x̂ₙ(h)=φʰ xₙ。<br>通式：X̂ₙ₊ₖ=E[Xₙ₊ₖ∣Xₙ,Xₙ₋₁,…]。<br>未来新息 eₙ₊ⱼ 用期望 0 代入。<br>预测误差方差随 h 单调增至 σ²/(1−φ²)。",
      code:"# AR(1) 预测\nfit <- arima(x, order=c(1,0,0))\np <- predict(fit, n.ahead=10)\nplot(p$pred, type='b')\nlines(p$pred+2*p$se, col='red')   # 置信带渐宽\nlines(p$pred-2*p$se, col='red')"},
    quiz:[
      {q:"均值 0 的 AR(1) 的 1 步向前预测 x̂ₙ(1) 等于：", opts:["φxₙ", "φ²xₙ", "xₙ/φ", "0"], ans:0, why:"x̂ₙ(1)=E[Xₙ₊₁∣Fₙ]=φxₙ（未来新息期望为 0）。", lv:1},
      {q:"ARIMA 预测中，未来新息 eₙ₊ⱼ（j≥1）应代入：", opts:["最近残差 êₙ", "其条件期望 0", "样本均值", "1"], ans:1, why:"未来新息未知，条件期望取 0；历史残差才用 ê 代入。", lv:1},
      {q:"平稳 AR(1) 的远期预测（h→∞）趋于：", opts:["当前值 xₙ", "序列均值", "无穷大", "永不回归的常数"], ans:1, why:"φʰ→0，预测向均值回归（均值 0 时趋于 0）。", lv:1},
      {q:"AR(1)（均值 0）φ=0.5、xₙ=8，2 步预测 x̂ₙ(2) 为：", opts:["4", "2", "1", "8"], ans:1, why:"x̂(2)=φ²xₙ=0.25×8=2。", lv:2},
      {q:"AR(1)（φ=0.6，新息方差 σ²=1）的预测误差方差随 h→∞ 趋于：", opts:["1.000", "1.5625", "0.640", "2.500"], ans:1, why:"极限为 σ²/(1−φ²)=1/(1−0.36)=1.5625，即平稳方差。", lv:2},
      {q:"对 ARMA 模型做 2 步预测时，关于历史残差 êₙ 的正确说法是：", opts:["êₙ 一定不进入 2 步预测", "MA 部分可能使 êₙ 仍影响 2 步预测", "êₙ 一律用 0 代替", "êₙ 须重新估计"], ans:1, why:"未来新息取 0，但 MA 滞后项（如 q≥2 时的 êₙ）仍保留在 2 步预测中。", lv:2},
      {q:"含均值 AR(1)：Xₜ−μ=φ(Xₜ₋₁−μ)+eₜ，μ=2、φ=0.5、xₙ=10，则 x̂ₙ(2)=：", opts:["4", "2", "5", "8"], ans:0, why:"x̂(h)=μ+φʰ(xₙ−μ)=2+0.25×8=4。", lv:3},
      {q:"AR(1)（均值 0）φ=0.8、xₙ=10，则 x̂ₙ(3)−x̂ₙ(1) 等于：", opts:["−2.88", "2.88", "−5.12", "0"], ans:0, why:"x̂(3)=0.512×10=5.12，x̂(1)=8，差=5.12−8=−2.88。", lv:3},
      {q:"与 AR 的几何衰减不同，MA(q) 模型在预测步长 h>q 后，预测值会：", opts:["继续按 φʰ 衰减", "迅速等于序列均值（有限记忆）", "发散", "恒等于当前值"], ans:1, why:"MA(q) 只有 q 步记忆，h>q 后所有新息项取 0，预测即均值。", lv:3}
    ]
  },

  { id:"diagnostics", name:"诊断检验：残差是不是白噪声？", icon:"🩺", minutes:9,
    demo:"demos/residual-diagnostics.html",
    hook:"模型拟合得漂亮，R² 很高——但<b>这不算数</b>。真正的问题是：残差里还有没有没被榨干的规律？Ljung-Box 检验就是那道质检关：<b>残差必须是白噪声</b>，否则模型不合格。",
    intuition:"诊断的核心假设 H₀：<b>残差是白噪声</b>（无自相关）。Ljung-Box 统计量 Q=n(n+2)Σρ̂ₖ²/(n−k)，在 H₀ 下近似 χ²(m)。<b>p>0.05 → 不拒绝，残差像白噪声，模型合格</b>；p<0.05 → 残差仍有自相关，模型要回炉。辅以残差 ACF 图（95% 落在 ±1.96/√n 内）与残差时序图。",
    chain:{
      param:{val:"Ljung-Box Q / p 值", sub:"残差自相关检验"},
      math:{val:"Q~χ²(m)，p>0.05 通过", sub:"不拒绝白噪声"},
      real:{val:"残差无规律才算榨干", sub:"模型可交付"}
    },
    engine:{type:"match", title:"配对：诊断方法与通过标准",
      pairs:[
        {l:"Ljung-Box 检验", r:"Q 统计量，p>0.05 → 残差为白噪声"},
        {l:"残差 ACF 图", r:"约 95% 落在 ±1.96/√n 置信带内"},
        {l:"残差时序图", r:"无明显模式，均值近 0、方差恒定"},
        {l:"转折点检验", r:"转折点数落在 95% 置信区间内"},
        {l:"诊断的 H₀", r:"残差是白噪声（模型充分）"}
      ]},
    drawers:{
      mechanism:"如果残差还有自相关，说明模型漏掉了可利用的规律，预测会偏。Ljung-Box 把多个滞后的 ρ̂² 加权求和成 Q：ρ̂ 都很小→Q 小→p 大→与白噪声相容；某些 ρ̂ 明显非零→Q 大→p 小→拒绝。一句话：p 大=「就算是白噪声也会这样」=通过。",
      math:"Q=n(n+2)Σₖ₌₁ᵐ ρ̂ₖ²/(n−k) ~ χ²(m)。<br>p=P(χ²(m)≥Qₒbs)。<br>p>0.05 → 不拒绝 H₀（白噪声）✓；p<0.05 → 拒绝 ✗。<br>残差 ACF：95% 在 ±1.96/√n 内。",
      code:"# Ljung-Box 诊断\nfit <- arima(x, order=c(1,0,1))\nBox.test(fit$residuals, lag=10, type='Ljung-Box')\n# p-value = 0.42 > 0.05 → 残差是白噪声，模型合格\nacf(fit$residuals)   # 应全部在置信带内"},
    quiz:[
      {q:"Ljung-Box 统计量 Q 在 H₀ 下近似服从：", opts:["标准正态分布", "χ²(m) 分布", "t 分布", "F 分布"], ans:1, why:"H₀（残差为白噪声）下 Q~χ²(m)，m 为所用滞后数。", lv:1},
      {q:"Ljung-Box 检验 p<0.05，结论是：", opts:["不拒绝 H₀，残差像白噪声", "拒绝 H₀，残差存在自相关，模型不合格", "序列非平稳", "需增大样本"], ans:1, why:"p 小表明白噪声几乎不可能产生这么大的 Q，故残差仍有自相关。", lv:1},
      {q:"Box-Jenkins 诊断检验的对象是：", opts:["原始序列 Xₜ", "模型残差 êₜ", "差分后的序列", "预测值"], ans:1, why:"诊断是检查残差是否还有未被榨干的自相关（是否为白噪声）。", lv:1},
      {q:"Ljung-Box 中若各滞后 ρ̂ₖ 都很小，则：", opts:["Q 很大、p 很小，拒绝白噪声", "Q 很小、p 很大，与白噪声相容", "Q 为负值", "无法计算 p"], ans:1, why:"ρ̂ 小→Q 小→χ² 右尾面积大→p 大，数据与白噪声相容。", lv:2},
      {q:"n=100、m=10，χ²(10) 的 95% 分位点为 18.31；若 Qₒbs=3.2，应：", opts:["拒绝 H₀", "不拒绝 H₀（残差可视为白噪声）", "重新差分", "增大 m"], ans:1, why:"Qₒbs=3.2<18.31，落在主体区域，p≈0.97，不拒绝白噪声。", lv:2},
      {q:"转折点检验中，三个连续独立观测使中间值成为转折点的概率为：", opts:["1/3", "2/3", "1/2", "1/6"], ans:1, why:"三值的 6 种排列中有 4 种使中间值为局部极值，概率 4/6=2/3。", lv:2},
      {q:"n=100、m=10，χ²(10) 的 95% 分位点为 18.31；若 Qₒbs=23.5，则：", opts:["不拒绝 H₀（p≈0.97）", "拒绝 H₀，残差有显著自相关（p≈0.009）", "Q 落在主体区域", "模型合格"], ans:1, why:"Qₒbs=23.5>18.31，落入极右尾，p≈0.009<0.05，拒绝白噪声。", lv:3},
      {q:"对 Ljung-Box 检验 p=0.90 的正确解读是：", opts:["证明残差绝对是白噪声", "没有足够证据拒绝白噪声，但不能证明 H₀ 为真", "模型一定最优", "残差存在强自相关"], ans:1, why:"p 大只表示数据与白噪声相容、无从拒绝，并非证明残差确为白噪声。", lv:3},
      {q:"N=100 时转折点数 95% CI 约为 [57,73]；若实测转折点仅 45，应：", opts:["认为残差是白噪声", "拒绝独立性/白噪声（转折过少提示趋势或相关）", "增大置信区间", "无需处理"], ans:1, why:"45 远低于下界 57，转折过少提示存在趋势或自相关，拒绝随机性。", lv:3}
    ]
  },

  { id:"cointegration", name:"协整：漂移中的长期均衡", icon:"🪢", minutes:9,

    demo:"demos/cointegration.html",
    hook:"两只股票价格各自像醉汉一样随机游走，<b>单独看都没法预测</b>。可它们的价差却常年围绕一个水平波动——一旦偏离太远，就有力量拉回来。这种「各自漂移、合力稳定」的关系，叫<b>协整</b>。",
    intuition:"两个序列 X、Y 都是 <b>I(1)</b>（一阶单整、非平稳），但若存在非零向量 (α,β) 使 <b>αX+βY 平稳</b>，则称它们<b>协整</b>，(α,β) 是协整向量。协整意味着变量间有<b>长期均衡</b>：短期可偏离，但不会无限走散。这是配对交易、汇率与物价关系建模的基础。",
    chain:{
      param:{val:"两个 I(1) 序列", sub:"各自非平稳"},
      math:{val:"αX+βY 平稳", sub:"协整向量 (α,β)"},
      real:{val:"长期均衡，偏离会回归", sub:"配对交易基础"}
    },
    engine:{type:"predict", title:"预测：两只随机游走的价差平稳，说明什么？",
      scenario:"股价 P₁、P₂ 各自都是随机游走（I(1)），但价差 P₁−0.8P₂ 长期围绕固定水平波动、偏离后会回归。这说明：",
      options:[
        {icon:"🪢", label:"P₁ 与 P₂ 协整", mini:"长期均衡", correct:true},
        {icon:"➡️", label:"P₁、P₂ 都平稳", mini:"I(0)", correct:false},
        {icon:"🎯", label:"P₁ 与 P₂ 相互独立", mini:"无关联", correct:false},
        {icon:"📈", label:"价差还会继续发散", mini:"无均衡", correct:false}
      ],
      reveal:"P₁、P₂ 都是 I(1)，但线性组合 P₁−0.8P₂ 平稳 → 二者协整，协整向量 (1, −0.8)。协整意味着长期均衡：短期价差可偏离，但会被拉回。配对交易正是赌这个回归——价差偏离均值时反向建仓，回归时平仓获利。"},
    drawers:{
      mechanism:"协整的直觉是「拴在一起的两只醉汉」：各自乱走（I(1)），但中间的绳子（均衡关系）不让它们走散，距离（线性组合）平稳。产生原因：一个驱动另一个，或被同一潜在因素共同驱动。检验常用 Engle-Granger 两步法或 Johansen 检验。",
      math:"X、Y 均 I(1)；若 ∃(α,β)≠0 使 αX+βY 平稳，则协整。<br>例：Xₜ=0.65Xₜ₋₁+0.35Yₜ₋₁+e<sup>X</sup>，Yₜ=0.35Xₜ₋₁+0.65Yₜ₋₁+e<sup>Y</sup>，则 Wₜ=Xₜ−Yₜ=0.3Wₜ₋₁+… 平稳 → 协整向量 (1,−1)。<br>VAR(1) 平稳 ⇔ 系数矩阵特征值模 < 1。",
      code:"# Engle-Granger 协整检验\nlibrary(urca)\n# 1) 回归 Y ~ X，取残差\nres <- lm(Y ~ X)$residuals\n# 2) 对残差做单位根检验\nsummary(ur.df(res, type='none'))   # 平稳则协整\n# 或 ca.jo(cbind(X,Y))  # Johansen 检验"},
    quiz:[
      {q:"协整向量 (α,β) 的作用是使：", opts:["αX+βY 成为平稳序列", "X、Y 各自平稳", "X·Y 为常数", "X+Y 发散"], ans:0, why:"存在非零 (α,β) 使线性组合 αX+βY 平稳，即协整。", lv:1},
      {q:"检验两序列是否协整，常用的方法是：", opts:["Engle-Granger 两步法 / Johansen 检验", "Ljung-Box 检验", "转折点检验", "卡方拟合优度检验"], ans:0, why:"协整检验用 Engle-Granger 两步法（多变量用 Johansen）；Ljung-Box 是残差自相关检验。", lv:1},
      {q:"若 X、Y 协整且协整向量为 (1,−1)，则下列平稳的序列是：", opts:["X+Y", "X−Y", "X·Y", "X/Y"], ans:1, why:"协整向量 (1,−1) 即 1·X+(−1)·Y=X−Y 平稳。", lv:1},
      {q:"X、Y 都是 I(1)，且 Xₜ−0.8Yₜ 长期平稳，则：", opts:["X、Y 不协整", "X、Y 协整，协整向量 (1,−0.8)", "X、Y 都已平稳", "X、Y 相互独立"], ans:1, why:"各自 I(1) 而线性组合 X−0.8Y 平稳，正是协整，向量 (1,−0.8)。", lv:2},
      {q:"二维 VAR(1) 系数矩阵 A=[[0.3,0.5],[0.2,0.2]] 的特征值约为：", opts:["0.57 与 −0.07（模均<1，平稳）", "1.5 与 0.5（含>1，非平稳）", "0.3 与 0.2", "0 与 4"], ans:0, why:"det(A−λI)=λ²−0.5λ−0.04=0，解得 λ≈0.57、−0.07，模均<1 故平稳。", lv:2},
      {q:"下列哪种情形最可能使两个 I(1) 序列协整？", opts:["两者完全独立、互不影响", "两者被同一潜在因素共同驱动", "两者方差相同", "两者均值都为 0"], ans:1, why:"协整常源于驱动关系或共同潜在因素，使长期行为保持一致。", lv:2},
      {q:"设 Xₜ=0.65Xₜ₋₁+0.35Yₜ₋₁+e<sup>X</sup>，Yₜ=0.35Xₜ₋₁+0.65Yₜ₋₁+e<sup>Y</sup>，令 Wₜ=Xₜ−Yₜ，则 Wₜ 满足：", opts:["Wₜ=0.3Wₜ₋₁+(e<sup>X</sup>−e<sup>Y</sup>)，平稳 AR(1)", "Wₜ=Wₜ₋₁+(e<sup>X</sup>−e<sup>Y</sup>)，随机游走", "Wₜ=0.65Wₜ₋₁，平稳", "Wₜ 非平稳"], ans:0, why:"两式相减得 Wₜ=0.30(Xₜ₋₁−Yₜ₋₁)+(e<sup>X</sup>−e<sup>Y</sup>)=0.3Wₜ₋₁+…，|0.3|<1 平稳。", lv:3},
      {q:"对两个互不相关的 I(1) 序列直接做回归，最可能出现：", opts:["真实可靠的因果关系", "伪回归：R² 很高、t 值显著但残差非平稳", "残差必为白噪声", "自动协整"], ans:1, why:"非平稳序列回归易得伪回归——统计量好看却无真实关系，残差仍非平稳。", lv:3},
      {q:"关于协整的适用前提，下列说法正确的是：", opts:["两个本身已平稳 I(0) 的序列也需做协整分析", "协整针对非平稳（I(1)）序列，I(0) 序列无需协整分析", "协整要求序列厚尾", "协整只适用于 MA 过程"], ans:1, why:"协整的前提是各序列同阶非平稳（如 I(1)）；已平稳的 I(0) 序列谈协整无意义。", lv:3}
    ]
  }
      ] },
  { id:18, no:"Ch18", name:"再保险", icon:"🛡️", color:"var(--ch18)", weight:"Syllabus 1.1", status:"live", pdf:"pdf/loss-model-ch18.pdf", qa:"qa/ch18-qa.html",
    desc:"比例/超额赔款再保险、免赔额、赔偿限额、共保——风险如何在保险人与再保险人之间切分。", kps:[
      { id:"reinsurance-map", name:"再保险全景：比例 vs 非比例", icon:"🗺️", minutes:8,
        demo:"demos/reinsurance-types.html",
    hook:"一场飓风过后，小保险公司面临<b>远超自身资本的索赔海啸</b>。它该怎么办？答案是把风险「转包」出去——再保险（Reinsurance），<b>保险的保险</b>。",
    intuition:"再保险是原保险人（分出公司）把部分风险与责任转移给再保险人（分入公司）的安排。目的包括<b>扩大承保能力、稳定经营成果、巨灾保障、分散风险、资本管理</b>。合同分两大类：<b>比例再保险</b>（按固定比例分享保费与赔款，如成数、溢额）与<b>非比例再保险</b>（损失超过门槛才触发，如超额赔款 XL）。",
    chain:{
      param:{val:"合同类型", sub:"比例 / 非比例"},
      math:{val:"风险切分规则", sub:"按比例 or 按门槛"},
      real:{val:"保险人自留多少、分出多少", sub:"资本与稳定的权衡"}
    },
    engine:{type:"match", title:"配对：再保险形式与其特征",
      pairs:[
        {l:"成数再保险 Quota Share", r:"每笔业务按固定比例 α 分出保费与赔款"},
        {l:"溢额再保险 Surplus", r:"只对保额超过自留额 M 的部分按比例分出"},
        {l:"险位超赔 Per-Risk XL", r:"M 与 L 适用于单一风险的单次损失"},
        {l:"巨灾超赔 Cat XL", r:"M 与 L 适用于一次巨灾事件的全部赔款总和"},
        {l:"赔付率分保 Stop Loss", r:"年度累计赔款超过 M（常表为保费百分比）才赔付"},
        {l:"再保险的根本目的", r:"扩大承保能力 + 稳定经营成果 + 巨灾保障"}
      ]},
    drawers:{
      mechanism:"比例再保险「同甘共苦」——赔多少都按比例摊；非比例再保险「兜底巨灾」——小额损失保险人自己扛，超过门槛的大额才由再保险人接住。前者平滑日常波动，后者对抗极端尾部。",
      math:"成数：X<sub>C</sub>=αX，X<sub>R</sub>=(1−α)X。<br>溢额：自留比例 M/S，分出 (S−M)/S。<br>XL：X<sub>C</sub>=min(X,M)，X<sub>R</sub>=(X−M)₊。",
      code:"# 三种再保险下保险人自留额\nX <- rexp(1e5, rate=1/2)   # 损失\nalpha <- 0.6; M <- 3\nqs   <- alpha * X           # 成数自留\nxl   <- pmin(X, M)          # 超赔自留\nmean(cbind(qs, xl))         # 比较平均自留"},
    quiz:[
      {q:"在再保险安排中，「分出公司」（ceding company）指的是：", opts:["购买再保险、把风险转出的原保险人", "承接风险的再保险人", "投保的企业", "监管机构"], ans:0, why:"分出公司即原保险人，把自己承保的风险分给再保险人（分入公司）。", lv:1},
      {q:"下列哪种再保险属于「比例再保险」？", opts:["成数分保 Quota Share", "险位超赔 Per-Risk XL", "巨灾超赔 Cat XL", "赔付率分保 Stop Loss"], ans:0, why:"成数分保按固定比例分享保费与赔款，是典型比例再保险；其余三者均为非比例。", lv:1},
      {q:"溢额再保险（Surplus）属于哪一大类？", opts:["比例再保险", "非比例再保险", "既是比例又是非比例", "不属于再保险"], ans:0, why:"溢额按 (S−M)/S 的比例分出，本质仍是比例再保险，只是比例随保额变化。", lv:1},
      {q:"溢额再保险中，自留额为 M、保额为 S，则再保险人的分保比例为：", opts:["(S−M)/S", "M/S", "S/M", "1−M"], ans:0, why:"保险人自留比例 M/S，再保险人分得超出部分 (S−M)/S。", lv:2},
      {q:"巨灾超赔（Cat XL）的免赔额 M 与上限 L 适用于：", opts:["一次巨灾事件造成的所有赔款总和", "单一保单的单次损失", "年度累计赔款", "每笔保费收入"], ans:0, why:"Cat XL 以一次巨灾事件的全部赔款总和为对象；单一风险单次损失是险位超赔。", lv:2},
      {q:"区分比例再保险与非比例再保险的核心依据是：", opts:["再保险人责任是按固定比例分摊，还是仅在损失超过门槛时才触发", "保费的高低", "是否跨国分保", "合同的币种"], ans:0, why:"比例按固定比例同甘共苦；非比例只在损失超过免赔额时兜底。", lv:2},
      {q:"累计超赔（Aggregate XL）的免赔额 M 适用于：", opts:["一年内所有赔款的总和 S=ΣXᵢ", "单次损失", "一次巨灾事件的赔款总和", "每笔保费"], ans:0, why:"Aggregate XL 针对特定时期的累计赔款 S；这与按单次/单事件触发的 XL 不同。", lv:3},
      {q:"溢额再保险自留额 M=400 万、保额 S=1000 万，一笔损失 X=500 万，保险人自留：", opts:["200 万", "300 万", "400 万", "500 万"], ans:0, why:"保险人自留 (M/S)·X=(400/1000)×500=200 万，其余 300 万分出。", lv:3},
      {q:"下列关于再保险类型与触发机制的配对，错误的是：", opts:["巨灾超赔——按固定比例分摊一次巨灾的全部赔款", "成数分保——按固定比例分摊每笔赔款", "溢额分保——仅对保额超过自留额的部分按比例分出", "险位超赔——损失超过 M 才赔付，适用于单一风险单次损失"], ans:0, why:"巨灾超赔是非比例再保险，超过门槛才赔付，并非按固定比例分摊。", lv:3}
    ]
  },

  { id:"quota-share", name:"成数再保险：拖 α 看风险切分", icon:"⚖️", minutes:8,
    demo:"demos/coinsurance.html",
    hook:"你是一家车险公司，资本有限但想多接单。和再保险人谈好：每笔业务你留 α，剩下的分出去。<b>α 定多少，决定了你留多少风险、留多少保费</b>。",
    intuition:"成数再保险（Quota Share）最简单：对每笔损失 X，保险人自留 <b>αX</b>，再保险人承担 <b>(1−α)X</b>，保费也按同比例分配。α 越大，自留越多、保费留得越多，但波动也越大。拖动 α，看两条直线如何此消彼长。",
    chain:{
      param:{val:"分出比例 1−α", sub:"再保险人份额"},
      math:{val:"X<sub>R</sub>=(1−α)X", sub:"线性切分"},
      real:{val:"保费与赔款同比例分出", sub:"平滑但让渡利润"}
    },
    engine:{type:"curve", title:"成数分保：自留线 vs 分出线（拖动分出比例）",
      x:{min:0,max:10,label:"损失 X"}, y:{label:"承担金额"}, ymin:0,
      series:[
        {label:"保险人自留 αX", color:"var(--ch18)", fn:"quotaRetain", width:3},
        {label:"再保险人分出 (1−α)X", color:"#7d93b5", fn:"quotaCede", width:2}
      ],
      params:[{key:"alpha", label:"分出比例 1−α（再保险人份额）", min:0, max:1, step:0.05, val:0.4}],
      live:(P)=>{ const a=P.alpha; return {param:"分出 "+(a*100).toFixed(0)+"% · 自留 "+((1-a)*100).toFixed(0)+"%|线性切分", math:"X<sub>R</sub>="+(a).toFixed(2)+"·X|自留="+(1-a).toFixed(2)+"·X", real:(a>0.6?"分出大头：稳但让渡利润多":"自留大头：留利润但波动大")+"|比例再保险"}; },
      note:"成数分保是「直线切分」——无论损失大小，比例不变。它平滑的是整体波动，而不是专门兜巨灾。"},
    drawers:{
      mechanism:"比例再保险对大小损失一视同仁：100 元的小案和 100 万的大案都按同一比例分。所以它擅长「稳定日常经营」，但要对抗巨灾尾部，还得靠非比例（XL）。",
      math:"保险人：X<sub>C</sub>=αX；再保险人：X<sub>R</sub>=(1−α)X。<br>保费、赔款、甚至未到期责任都按 α:(1−α) 分配。<br>方差：Var(X<sub>C</sub>)=α²Var(X)——自留比例降一半，自留波动方差降到 1/4。",
      code:"# 成数分保后保险人赔付的波动\nX <- rgamma(1e5, shape=2, rate=1)\nalpha <- 0.6\nsd(alpha*X) / sd(X)   # = alpha，波动按比例缩小"},
    quiz:[
      {q:"成数再保险中的自留比例 α 表示：", opts:["保险人对每笔损失自留的固定比例", "损失超过的门槛", "再保险人的份额", "保额上限"], ans:0, why:"α 是保险人自留比例，再保险人份额为 1−α，对每笔损失固定不变。", lv:1},
      {q:"成数分保下，保费如何在保险人与再保险人之间分配？", opts:["按与赔款相同的比例 α:(1−α) 分配", "全部归保险人", "全部归再保险人", "按损失大小浮动"], ans:0, why:"比例再保险中保费与赔款同比例分配，均为 α:(1−α)。", lv:1},
      {q:"成数再保险对大额损失与小额损失的处理方式是：", opts:["一视同仁，按同一比例分摊", "只分出大额损失", "只分出小额损失", "按免赔额触发"], ans:0, why:"成数分保对大小损失按同一比例 α 分摊，没有门槛。", lv:1},
      {q:"成数分保中提高自留比例 α，保险人的处境是：", opts:["自留赔款与自留保费都增加，波动也随之增大", "自留赔款减少", "自留保费减少", "波动减小"], ans:0, why:"α 越大，自留的赔款和保费都越多，但承担的波动（风险）也越大。", lv:2},
      {q:"成数分保 α=0.4 时，保险人自留赔款的方差变为原来的：", opts:["0.16", "0.4", "0.64", "0.8"], ans:0, why:"Var(αX)=α²Var(X)=0.4²=0.16 倍；注意方差按 α² 缩小。", lv:2},
      {q:"为什么成数分保不能专门对抗巨灾尾部风险？", opts:["它对大小损失按同一比例分摊，不专门截断大额尾部", "它没有保费", "它只承保小额业务", "它设有免赔额"], ans:0, why:"比例分保一视同仁，大额损失仍按比例自留一部分；兜巨灾需靠非比例 XL。", lv:2},
      {q:"成数分保 α=0.5 时，保险人自留赔款的方差与标准差分别变为原来的：", opts:["方差 1/4、标准差 1/2", "方差 1/2、标准差 1/4", "方差与标准差都为 1/2", "方差与标准差都为 1/4"], ans:0, why:"方差按 α²=1/4 缩小，标准差按 α=1/2 缩小，二者不可混淆。", lv:3},
      {q:"成数分保 α=0.6，损失 X 均值 100、标准差 50，则再保险人承担赔款的均值与标准差为：", opts:["均值 40、标准差 20", "均值 60、标准差 30", "均值 40、标准差 30", "均值 60、标准差 20"], ans:0, why:"再保险人承担 (1−α)X=0.4X：均值 0.4×100=40，标准差 0.4×50=20。", lv:3},
      {q:"成数分保 α=0.6，一笔损失 X=200 万，对应保费 10 万。保险人自留的赔款与保费分别为：", opts:["120 万、6 万", "80 万、4 万", "120 万、4 万", "200 万、10 万"], ans:0, why:"赔款与保费同比例：自留赔款 αX=120 万，自留保费 α×10=6 万。", lv:3}
    ]
  },

  { id:"xl", name:"超额赔款再保险：拖免赔额 M", icon:"🛡️", minutes:10,
    demo:"demos/policy-limit.html",
    hook:"巨灾来了，单笔赔款可能上亿。成数分保按比例摊，可你真正怕的是<b>那一两笔天文数字</b>。于是你对再保险人说：小额我自己扛，超过 M 的部分你接——这就是<b>超额赔款（XL）</b>。",
    intuition:"超额赔款再保险（Excess of Loss）：保险人自留 <b>min(X,M)</b>，再保险人赔付超出的 <b>(X−M)₊</b>，常带上限 L（写作「L xs M」）。拖动免赔额 M：M 越高，自留线抬得越高、分出曲线越靠右，再保险人的期望赔款 <b>E[(X−M)₊]=μe<sup>−M/μ</sup></b>（指数损失下）指数下降。",
    chain:{
      param:{val:"免赔额 M", sub:"起赔点 / 自留额"},
      math:{val:"E[(X−M)₊]=μe<sup>−M/μ</sup>", sub:"随 M 指数衰减"},
      real:{val:"M 越高保费越便宜，自留风险越大", sub:"保留额权衡"}
    },
    engine:{type:"curve", title:"XL：自留 min(X,M) vs 分出 (X−M)₊（拖动 M）",
      x:{min:0,max:10,label:"损失 X"}, y:{label:"承担金额"}, ymin:0,
      series:[
        {label:"保险人自留 min(X,M)", color:"var(--ch18)", fn:"retainXL", width:3},
        {label:"再保险人分出 (X−M)₊", color:"#f87171", fn:"cedeXL", width:2}
      ],
      params:[
        {key:"M", label:"免赔额 M（起赔点）", min:0.5, max:8, step:0.1, val:2},
        {key:"mu", label:"损失均值 μ（指数分布）", min:1, max:5, step:0.5, val:2}
      ],
      readouts:[
        {label:"E[自留]", fn:"EretainXL"},
        {label:"E[分出]", fn:"EcedeXL"},
        {label:"P(X>M)", fn:"PcedeXL"}
      ],
      live:(P)=>{ const ec=P.mu*Math.exp(-P.M/P.mu); const er=P.mu*(1-Math.exp(-P.M/P.mu)); const p=Math.exp(-P.M/P.mu);
        return {param:"M="+P.M.toFixed(1)+" · μ="+P.mu.toFixed(1)+"|起赔点与损失尺度", math:"E[分出]="+ec.toFixed(2)+" · P(X>M)="+(p*100).toFixed(0)+"%|指数衰减", real:(P.M>P.mu?"高 M：保费省、自留风险大":"低 M：保费贵、更稳")+"|保留额权衡"}; },
      note:"M 右移：自留线（绿）抬升、分出曲线（红）右移变矮。读一读 E[分出] 如何随 M 指数下降——这就是 XL 保费随免赔额上升而下降的原因。"},
    drawers:{
      mechanism:"XL 是「尾部保险」：日常小额损失全由保险人自留（所以保费便宜），再保险人只在极端大额时出手。M 是价格与保障的旋钮——M 越高，再保险人出手的概率 P(X>M) 越小，保费越低，但保险人自己扛的尾部越厚。",
      math:"X<sub>C</sub>=min(X,M)，X<sub>R</sub>=(X−M)₊（带上限 L 时 X<sub>R</sub>=min((X−M)₊,L)）。<br>指数分布 Exp(1/μ)：E[(X−M)₊]=μe<sup>−M/μ</sup>，P(X>M)=e<sup>−M/μ</sup>。<br>「L xs M」= 赔偿上限 L、起赔点 M。",
      code:"# XL 自留与分出（指数损失）\nmu <- 2; M <- 2\nX <- rexp(1e6, 1/mu)\ncat(mean(pmin(X,M)),      # E[自留]\n    mean(pmax(X-M,0)),    # E[分出] ≈ mu*exp(-M/mu)\n    mean(X>M))            # P(X>M)"},
    quiz:[
      {q:"超额赔款再保险（XL）中，保险人的自留赔款为：", opts:["min(X, M)", "(X−M)₊", "αX", "max(X, M)"], ans:0, why:"保险人自留不超过免赔额 M 的部分，即 min(X, M)。", lv:1},
      {q:"无赔付上限时，XL 再保险人的赔付公式为：", opts:["(X−M)₊ = max(0, X−M)", "min(X, M)", "X−M（可为负）", "αX"], ans:0, why:"再保险人只赔超过 M 的部分，且不为负，即 (X−M)₊=max(0, X−M)。", lv:1},
      {q:"XL 合同写作「L xs M」，其含义是：", opts:["起赔点（免赔额）为 M、赔偿上限为 L", "起赔点为 L、上限为 M", "分保比例为 L:M", "保额为 L"], ans:0, why:"「L xs M」= L in excess of M：超过 M 的部分由再保险人赔，最多赔 L。", lv:1},
      {q:"带赔付上限 L 时，XL 再保险人的赔付为：", opts:["min((X−M)₊, L)", "(X−M)₊", "max(X−M, L)", "min(X, L)"], ans:0, why:"先取超出部分 (X−M)₊，再用上限 L 封顶，即 min((X−M)₊, L)。", lv:2},
      {q:"指数损失 Exp(1/μ) 下，损失超过免赔额 M 的概率 P(X>M) 等于：", opts:["e<sup>−M/μ</sup>", "1−e<sup>−M/μ</sup>", "μe<sup>−M/μ</sup>", "M/μ"], ans:0, why:"指数分布生存函数 S(M)=P(X>M)=e<sup>−M/μ</sup>，随 M 指数衰减。", lv:2},
      {q:"保险人提高免赔额 M，对再保险人的期望赔款与触发概率 P(X>M) 的影响是：", opts:["两者都下降", "两者都上升", "期望赔款下降但概率上升", "概率下降但期望赔款上升"], ans:0, why:"M 越高，越过门槛的概率与超出部分的期望都下降，故再保险保费更便宜。", lv:2},
      {q:"「300 万 xs 200 万」合同，损失 X=700 万时，再保险人赔付：", opts:["300 万", "500 万", "200 万", "700 万"], ans:0, why:"(X−M)₊=700−200=500 万，但被上限 L=300 万封顶，故只赔 300 万。", lv:3},
      {q:"指数损失均值 μ=2、免赔额 M=2，再保险人期望赔款 E[(X−M)₊] 约为：", opts:["2e⁻¹ ≈ 0.74", "2", "e⁻¹ ≈ 0.37", "4e⁻¹ ≈ 1.47"], ans:0, why:"E[(X−M)₊]=μe<sup>−M/μ</sup>=2e⁻¹≈0.74；勿漏乘 μ 或误用指数。", lv:3},
      {q:"损失 X≥0、免赔额 M，下列现金流恒等式正确的是：", opts:["X = min(X, M) + (X−M)₊", "X = min(X, M) + max(X−M, 0) 仅当 X>M 成立", "X = (X−M)₊ − min(X, M)", "X = max(X, M) + (X−M)₊"], ans:0, why:"自留 min(X,M) 与分出 (X−M)₊ 之和恒等于 X；该式对一切 X≥0 成立。", lv:3}
    ]
  },

  { id:"mean-excess", name:"平均超额损失：厚尾的照妖镜", icon:"📏", minutes:10,
    demo:"demos/tail-weight.html",
    hook:"再保险人给 XL 定价，核心是算：<b>已知损失超过了 M，平均还会超出多少？</b>这个量 e<sub>X</sub>(M) 叫平均超额损失。它对免赔额 M 的「态度」，直接暴露了损失分布是轻尾还是厚尾。",
    intuition:"平均超额损失（Mean Excess Loss）<b>e<sub>X</sub>(M)=E[X−M∣X>M]</b>。指数分布因无记忆性，e<sub>X</sub>(M) 恒等于均值（水平线）；帕累托分布 e<sub>X</sub>(M)=(M+θ)/(α−1)，随 M <b>线性上升</b>——损失越大，超出部分平均越多，这就是厚尾。拖动 α 看斜率如何变化。",
    chain:{
      param:{val:"尾部形状 α", sub:"越小尾越厚"},
      math:{val:"e(M)=(M+θ)/(α−1)", sub:"斜率 1/(α−1)"},
      real:{val:"厚尾：免赔额越高，超赔期望越大", sub:"巨灾定价命门"}
    },
    engine:{type:"curve", title:"e<sub>X</sub>(M)：指数恒为常数 vs 帕累托线性上升",
      x:{min:0,max:20,label:"免赔额 M"}, y:{label:"平均超额损失 e(M)"}, ymin:0,
      series:[
        {label:"帕累托 e(M)=(M+θ)/(α−1)", color:"var(--ch18)", fn:"meanExcessPareto", width:3},
        {label:"指数 e(M)=θ（无记忆性）", color:"#7d93b5", fn:"meanExcessExp", width:2}
      ],
      params:[
        {key:"alpha", label:"帕累托形状参数 α", min:1.2, max:5, step:0.1, val:3},
        {key:"theta", label:"尺度参数 θ", min:1, max:10, step:0.5, val:5}
      ],
      live:(P)=>{ const slope=1/(P.alpha-1); return {param:"α="+P.alpha.toFixed(1)+" · θ="+P.theta.toFixed(1)+"|尾部形状与尺度", math:"斜率 1/(α−1)="+slope.toFixed(2)+"|e(0)=θ/(α−1)="+(P.theta/(P.alpha-1)).toFixed(2), real:(P.alpha<2?"极厚尾：超赔期望随 M 猛涨":"中等厚尾")+"|再保险定价"}; },
      note:"灰线（指数）永远水平——无记忆性意味着「已经超了 M」不改变剩余损失的期望。绿线（帕累托）一路向上——这就是为什么巨灾 XL 那么贵。"},
    drawers:{
      mechanism:"e<sub>X</sub>(M) 是再保险纯保费的核心：E[(X−M)₊]=e<sub>X</sub>(M)·S<sub>X</sub>(M)。指数分布「忘了」已经损失多少，超额期望不变；帕累托则「越损越凶」，M 越高剩余超额反而越大。α 越小（尾越厚），斜率 1/(α−1) 越陡。",
      math:"e<sub>X</sub>(M)=E[X−M∣X>M]=∫<sub>M</sub><sup>∞</sup> S<sub>X</sub>(x)dx / S<sub>X</sub>(M)。<br>指数 Exp(1/θ)：e<sub>X</sub>(M)=θ。<br>帕累托 Pareto(α,θ)：S(x)=(θ/(x+θ))<sup>α</sup>，e<sub>X</sub>(M)=(M+θ)/(α−1)。<br>再保险层期望：E[(X−M)₊]=e<sub>X</sub>(M)·S<sub>X</sub>(M)=∫<sub>M</sub><sup>∞</sup> S<sub>X</sub>(x)dx。",
      code:"# 平均超额损失经验估计\nX <- rpareto <- function(n,a,th) th*(runif(n)^(-1/a)-1)\nx <- rpareto(1e5, 3, 5)\nM <- 10\nmean(x[x>M]-M)          # ≈ (M+th)/(a-1) = 7.5"},
    quiz:[
      {q:"平均超额损失 e<sub>X</sub>(M) 的定义是：", opts:["E[X−M ∣ X>M]", "E[X]", "E[X−M]", "P(X>M)"], ans:0, why:"e<sub>X</sub>(M) 是已知损失超过 M 时，超出部分 X−M 的条件期望。", lv:1},
      {q:"指数分布 Exp(1/θ) 的平均超额损失 e<sub>X</sub>(M) 的取值为：", opts:["恒为 θ（即均值 1/λ）", "M+θ", "θ/(M+1)", "恒为 0"], ans:0, why:"指数分布无记忆性，e<sub>X</sub>(M)=θ=均值，取值为常数 θ。", lv:1},
      {q:"指数分布的 e<sub>X</sub>(M) 恒为常数，其根本原因是：", opts:["无记忆性", "厚尾性", "损失有界", "分布对称"], ans:0, why:"无记忆性意味着「已经损失超过 M」不改变剩余超额的期望。", lv:1},
      {q:"帕累托 e<sub>X</sub>(M)=(M+θ)/(α−1) 中，减小 α（尾更厚）会使斜率 1/(α−1)：", opts:["增大（曲线更陡）", "减小", "不变", "变为负值"], ans:0, why:"α 越小尾越厚，斜率 1/(α−1) 越大，超额期望随 M 上升越猛。", lv:2},
      {q:"帕累托 e<sub>X</sub>(M)=(M+θ)/(α−1) 作为 M 的函数，其斜率为：", opts:["1/(α−1)", "α−1", "θ/(α−1)", "1/θ"], ans:0, why:"对 M 求导得斜率 1/(α−1)，θ/(α−1) 只是截距 e(0)。", lv:2},
      {q:"公式 e<sub>X</sub>(M)=∫<sub>M</sub><sup>∞</sup> S<sub>X</sub>(x)dx / S<sub>X</sub>(M) 中，分母 S<sub>X</sub>(M) 的作用是：", opts:["对条件 X>M 做归一化（条件化）", "去除厚尾", "计算方差", "做通胀调整"], ans:0, why:"e<sub>X</sub>(M) 是条件期望，需除以 P(X>M)=S<sub>X</sub>(M) 将积分归一到条件分布上。", lv:2},
      {q:"帕累托分布 α=3、θ=5，免赔额 M=10 时的平均超额损失 e<sub>X</sub>(M) 为：", opts:["7.5", "5", "15", "3.75"], ans:0, why:"e<sub>X</sub>(M)=(M+θ)/(α−1)=(10+5)/(3−1)=7.5。", lv:3},
      {q:"指数分布 e(M)=θ 恒定，而帕累托 e(M) 随 M 上升。对厚尾巨灾风险这意味着：", opts:["提高免赔额后剩余超赔的平均 severity 反而更大，故巨灾 XL 定价昂贵", "剩余超赔平均更小", "平均超赔不变", "超赔期望为零"], ans:0, why:"厚尾「越损越凶」，M 越高剩余超额期望越大，这正是巨灾 XL 昂贵的命门。", lv:3},
      {q:"帕累托分布的平均超额损失 e<sub>X</sub>(M)=(M+θ)/(α−1) 为有限值的条件是：", opts:["α>1", "α>2", "α>0", "任意 α"], ans:0, why:"e<sub>X</sub>(M) 有限需均值存在，即 α>1；α≤1 时超额期望发散为无穷。", lv:3}
    ]
  },

  { id:"inflation", name:"通胀杠杆效应：被放大的超赔", icon:"🎈", minutes:7,
    demo:"demos/deductible-frequency.html",
    hook:"签合同时免赔额 M=1000 万，当时很合理。三年后通胀 30%，损失水涨船高，M 却没动。再保险人发现：<b>自己掏钱的频率和金额都暴涨了</b>——通胀对 XL 有「杠杆效应」。",
    intuition:"损失统一通胀 r 后 X′=(1+r)X，而免赔额 M 固定，则 E[(X′−M)₊]=(1+r)·E[(X−M/(1+r))₊]——<b>等同于把免赔额降到 M/(1+r)</b>。免赔额降低会放大期望赔款，叠加损失本身上涨 r，总增幅<b>远超 r 本身</b>。对策是免赔额指数化：M′=(1+r)M。",
    chain:{
      param:{val:"通胀率 r", sub:"损失 ×(1+r)"},
      math:{val:"M 等效降为 M/(1+r)", sub:"E[(X−d)₊] 是 d 的减函数"},
      real:{val:"超赔赔款增幅远超通胀率", sub:"需指数化条款"}
    },
    engine:{type:"predict", title:"预测：通胀 10% 后，再保险人期望赔款涨多少？",
      scenario:"某 XL 合同免赔额 M=100 万，损失厚尾。次年所有损失统一上涨 10%（X′=1.1X），免赔额不变。再保险人的期望赔款大约增加：",
      options:[
        {icon:"📈", label:"远超 10%", mini:"杠杆效应", correct:true},
        {icon:"➡️", label:"约 10%", mini:"与通胀同步", correct:false},
        {icon:"📉", label:"不到 10%", mini:"免赔额吸收", correct:false},
        {icon:"🎯", label:"不变", mini:"M 固定", correct:false}
      ],
      reveal:"通胀 r 等效于把免赔额降到 M/(1+r)。E[(X−d)₊] 随 d 减小而上升，这个「免赔额下降效应」叠加损失上涨的 10%，使赔款增幅远超 10%——即杠杆效应。加入指数化条款 M′=(1+r)M 后，赔款增长率才回落到恰好 r。"},
    drawers:{
      mechanism:"固定免赔额 + 通胀 = 再保险人「被动降免赔」。损失越大、尾越厚，杠杆越猛。这就是为什么长期 XL 合同几乎都带免赔额指数化（inflation clause）。",
      math:"E[(X′−M)₊]=(1+r)·E[(X−M/(1+r))₊]。<br>指数化后 M′=(1+r)M：E[(X′−M′)₊]=(1+r)·E[(X−M)₊]，增幅恰好 = 通胀率 r。",
      code:"# 通胀杠杆效应演示\nmu <- 2; M <- 2; r <- 0.10\nbase <- mu*exp(-M/mu)                 # E[(X-M)+]\ninfl <- (1+r)*mu*exp(-(M/(1+r))/mu)   # 通胀后\nindex<- (1+r)*mu*exp(-M/mu)           # 指数化后\ncat(infl/base-1, index/base-1)        # 杠杆 > r；指数化 = r"},
    quiz:[
      {q:"通胀的「杠杆效应」对哪类再保险影响最为显著？", opts:["非比例再保险（XL）", "成数再保险", "溢额再保险", "所有比例再保险"], ans:0, why:"XL 有固定免赔额，通胀会放大超赔；比例分保按比例同步，无杠杆。", lv:1},
      {q:"通胀杠杆效应下，固定免赔额 M 会使再保险人的赔付频率与赔付金额：", opts:["两者都上升", "两者都下降", "两者都不变", "频率上升、金额下降"], ans:0, why:"损失水涨船高而 M 不动，越过门槛更频繁、超出部分也更大，频率与金额齐涨。", lv:1},
      {q:"所有损失统一受通胀率 r 影响后，新损失 X′ 为：", opts:["X′=(1+r)X", "X′=X+r", "X′=X/(1+r)", "X′=rX"], ans:0, why:"统一通胀即损失整体乘以 (1+r)。", lv:1},
      {q:"E[(X′−M)₊]=(1+r)·E[(X−M/(1+r))₊] 说明通胀 r 的影响可分解为：", opts:["损失放大 (1+r) 倍，叠加免赔额等效降至 M/(1+r)", "仅损失放大 (1+r) 倍", "仅免赔额变化", "两者相互抵消"], ans:0, why:"该式把通胀拆成损失×(1+r) 与免赔额等效降到 M/(1+r) 两个效应。", lv:2},
      {q:"加入指数化条款 M′=(1+r)M 后，再保险人期望赔款 E[(X′−M′)₊] 相对原来的增长率：", opts:["恰好等于通胀率 r", "远超 r", "为 0", "等于 (1+r)²"], ans:0, why:"指数化后 E[(X′−M′)₊]=(1+r)E[(X−M)₊]，增长率恰好回落到 r。", lv:2},
      {q:"长期 XL 合同几乎都带免赔额指数化条款，原因是：", opts:["否则通胀会持续放大再保险人的实际赔付（杠杆效应）", "为了增加保费收入", "为了降低保额", "监管禁止固定免赔额"], ans:0, why:"固定 M 下通胀等效降免赔，赔付增幅远超 r；指数化才能消除杠杆。", lv:2},
      {q:"指数损失 μ=2、M=2、通胀 r=10%。未指数化时再保险人期望赔款增幅约为：", opts:["约 20%（远超 10%）", "恰好 10%", "约 5%", "不变"], ans:0, why:"基值 2e⁻¹；通胀后 1.1×2e<sup>−2/(1.1×2)</sup>≈0.886，相对基值约 +20.5%。", lv:3},
      {q:"同一通胀 r 下，固定 M 合同与指数化 M′=(1+r)M 合同相比，再保险人期望赔款增长率：", opts:["固定 M 远超 r，指数化恰为 r", "两者都恰为 r", "固定 M 恰为 r，指数化远超 r", "两者都远超 r"], ans:0, why:"固定 M 有杠杆（远超 r）；指数化消除杠杆，增长率恰为 r。", lv:3},
      {q:"通胀对成数（比例）再保险的影响与对 XL 相比：", opts:["成数按比例分摊，赔款随损失同比例增长 (1+r)，无杠杆放大；XL 因固定 M 有杠杆效应", "成数的杠杆效应更强", "两者杠杆效应相同", "成数完全不受通胀影响"], ans:0, why:"比例分保再保险人付 (1−α)X′=(1+r)(1−α)X，恰好 +r；XL 才有杠杆。", lv:3}
    ]
  },

  { id:"censored-mle", name:"审查数据与 MLE：看不见的尾部", icon:"🔍", minutes:9,
    demo:"demos/censored-mle.html",
    hook:"你想拟合巨灾损失分布，可手头的数据很「势利」：<b>超过免赔额的才记录（左截断），超过上限的只记「至少这么多」（右审查）</b>。尾巴恰恰最重要，却看不全。怎么办？",
    intuition:"再保险数据天然是<b>截断（Truncated）</b>或<b>审查（Censored）</b>的：左截断只见 X∣X>M；右审查在上限 M+L 处只知道 X≥M+L。标准做法是<b>极大似然估计（MLE）</b>——按数据的观测方式写似然：完整观测贡献 lnf(x)−lnS(M)，右审查贡献 lnS(M+L)−lnS(M)，最大化求参数。",
    chain:{
      param:{val:"截断点 M / 上限 M+L", sub:"观测窗口"},
      math:{val:"按观测方式写似然", sub:"lnf−lnS / lnS(M+L)−lnS(M)"},
      real:{val:"尾巴看不全，更要正确用数据", sub:"巨灾参数估计"}
    },
    engine:{type:"match", title:"配对：观测类型与其似然贡献",
      pairs:[
        {l:"在 (M, M+L) 内完整观测到 x", r:"lnf(x) − lnS(M)"},
        {l:"在上限 M+L 处右审查", r:"lnS(M+L) − lnS(M)"},
        {l:"左截断（只有超 M 的数据）", r:"条件密度 f(x)/S(M)，x>M"},
        {l:"右审查的含义", r:"只知损失至少 M+L，不知确切值"},
        {l:"MLE 的目标", r:"最大化对数似然求分布参数"}
      ]},
    drawers:{
      mechanism:"截断是「样本选择」——低于 M 的整个看不见；审查是「数值封顶」——知道有这笔损失，但金额被压在 M+L。两者似然不同：截断要除以 S(M) 重归一，审查用生存函数 S(M+L)。把每笔数据按其观测方式写贡献，加总取最大，就是 MLE。",
      math:"左截断条件密度：f(x∣X>M)=f(x)/S(M)，x>M。<br>完整观测：lnf(xᵢ)−lnS(M)。<br>右审查：lnP(X>M+L∣X>M)=lnS(M+L)−lnS(M)。<br>对数似然 ℓ=Σ 各贡献，∂ℓ/∂θ=0 求 θ̂。",
      code:"# 右审查数据的 MLE（指数分布）\n# x 为观测值，d=1 表示在 u 处被审查\nloglik <- function(lambda, x, d, M, u){\n  ll <- ifelse(d==0, log(lambda)-lambda*x,\n               -lambda*u)          # 审查：lnS(u)\n  sum(ll) + length(x)*lambda*M     # 左截断修正 +lnS(M)\n}"},
    quiz:[
      {q:"损失超过再保险层上限 M+L 时，只知损失「至少为 M+L」而不知确切值，这属于：", opts:["右审查（Right Censoring）", "左截断（Left Truncation）", "区间审查", "左审查"], ans:0, why:"知道该笔损失存在但金额被封顶在 M+L，是右审查。", lv:1},
      {q:"再保险理赔数据通常不完整，主要表现为哪两种形式？", opts:["截断（Truncated）与审查（Censored）", "缺失与重复", "通胀与折扣", "频度与强度"], ans:0, why:"再保险数据天然受免赔额与上限影响，呈现截断或审查两种不完整形式。", lv:1},
      {q:"极大似然估计（MLE）处理截断/审查数据的目标是：", opts:["最大化对数似然函数以求分布参数", "最小化样本方差", "求样本均值", "最小化再保险保费"], ans:0, why:"按数据的观测方式写出似然，最大化对数似然 ℓ 求参数 θ̂。", lv:1},
      {q:"左截断（截断点 M）下，完整观测 x（x>M）的条件密度为：", opts:["f(x∣X>M)=f(x)/S<sub>X</sub>(M)", "f(x)·S<sub>X</sub>(M)", "f(x)−S<sub>X</sub>(M)", "f(x)/F<sub>X</sub>(M)"], ans:0, why:"截断后需以 P(X>M)=S<sub>X</sub>(M) 重归一化，条件密度为 f(x)/S<sub>X</sub>(M)。", lv:2},
      {q:"截断（Truncation）与审查（Censoring）的本质区别是：", opts:["截断是样本选择（整笔缺失），审查是数值封顶（知道存在但金额被压）", "两者完全相同", "截断只影响大额损失", "审查只影响小额损失"], ans:0, why:"截断看不到 M 以下的样本；审查知道有这笔损失，只是金额被压在上限。", lv:2},
      {q:"区间审查（Interval Censoring）与右审查的不同在于：", opts:["区间审查只知损失落在某区间 [a,b] 内，右审查只知损失超过上限", "两者相同", "区间审查知道损失确切值", "右审查知道损失确切值"], ans:0, why:"区间审查把损失归入预设区间；右审查只给出「至少 M+L」的下界。", lv:2},
      {q:"左截断数据中，一个完整观测 xᵢ 与一个在 M+L 处右审查的观测，其对数似然贡献的差异是：", opts:["完整观测用 lnf(xᵢ)，审查观测用 lnS<sub>X</sub>(M+L)，两者都减去 lnS<sub>X</sub>(M)", "完整观测不减 lnS<sub>X</sub>(M)", "审查观测用 lnf(M+L)", "两者都用 lnf"], ans:0, why:"截断使两者都含 −lnS<sub>X</sub>(M)；完整观测贡献 lnf，右审查贡献 lnS<sub>X</sub>(M+L)。", lv:3},
      {q:"对左截断（截断点 M）兼右审查（上限 M+L）的样本，总对数似然为：", opts:["Σ完整[lnf(xᵢ)−lnS<sub>X</sub>(M)] + Σ审查[lnS<sub>X</sub>(M+L)−lnS<sub>X</sub>(M)]", "Σ lnf(xᵢ)", "Σ lnS<sub>X</sub>(xᵢ)", "Σ[lnf(xᵢ)+lnS<sub>X</sub>(M)]"], ans:0, why:"按观测方式分别写贡献再加总：完整用 lnf−lnS(M)，审查用 lnS(M+L)−lnS(M)。", lv:3},
      {q:"对右审查观测，若错误地用 lnf(M+L) 代替 lnS<sub>X</sub>(M+L)−lnS<sub>X</sub>(M)，问题在于：", opts:["审查只知 X>M+L 而非确切等于 M+L，应用条件生存概率而非密度", "密度值总是更大", "这样处理没有任何影响", "应再乘以 S<sub>X</sub>(M)"], ans:0, why:"右审查观测的信息是「超过上限」，似然应为条件生存概率 S(M+L)/S(M) 的对数。", lv:3}
    ]
  }
      ] },
  { id:19, no:"Ch19", name:"风险模型 I", icon:"🎲", color:"var(--ch19)", weight:"Syllabus 1.2", status:"live", pdf:"pdf/loss-model-ch19.pdf", qa:"qa/ch19-qa.html",
    desc:"复合分布（复合 Poisson/负二项）、集体风险模型：聚合赔款 S=ΣXᵢ 的建模。", kps:[
      { id:"collective-model", name:"集体风险模型：S=ΣXᵢ", icon:"🎲", minutes:10,
        demo:"demos/collective-risk.html",
    hook:"一年下来，车险组合到底要赔多少钱？这取决于两件事：<b>赔多少次（N）</b>和<b>每次赔多少（Xᵢ）</b>。把两者乘起来、加起来，总赔款 S 就浮出水面——它天生右偏、厚尾。",
    intuition:"集体风险模型（Collective Risk Model）把总赔款写成 <b>S=X₁+X₂+⋯+X<sub>N</sub></b>：N 是索赔次数（频度），Xᵢ 是单次赔款（强度），两者独立、Xᵢ 独立同分布。拖动 λ（索赔频率）与 E[X]（平均赔款），看 S 的分布如何右移、变厚、VaR 飙升。",
    chain:{
      param:{val:"λ 与 E[X]", sub:"频度 × 强度"},
      math:{val:"E[S]=E[N]·E[X]", sub:"线性叠加"},
      real:{val:"总赔款右偏厚尾", sub:"资本金要兜住右尾"}
    },
    engine:{type:"compound", title:"复合 Poisson：拖 λ 与 E[X] 看总赔款分布",
      freq:"poisson", sev:"exp",
      params:[
        {key:"lambda", label:"索赔次数 λ（频度）", min:1, max:10, step:1, val:4},
        {key:"mean", label:"平均赔款 E[X]（强度）", min:1, max:5, step:0.5, val:2}
      ],
      n:2000, bins:40,
      live:(P,st)=>{ return {param:"λ="+P.lambda+" · E[X]="+P.mean.toFixed(1)+"|频度 × 强度", math:"E[S]=λ·E[X]="+(st.thE==null?'—':st.thE.toFixed(1))+"（模拟 "+st.mean.toFixed(1)+"）|线性叠加", real:"VaR₀.₉₉₅="+st.vaq.toFixed(1)+"|右尾要留足资本"}; },
      note:"把 λ 或 E[X] 调大：分布整体右移、右尾变厚，VaR₀.₉₉₅ 明显上升。注意模拟均值与理论 E[S]=λ·E[X] 几乎重合——这就是大数定律。"},
    drawers:{
      mechanism:"S 的随机性有两个来源：N 的波动（今年赔几次）和 X 的波动（每次赔多少）。所以方差有两项：E[N]Var(X)（强度不确定性）+ Var(N)(E[X])²（频度不确定性）。频度越高，S 越接近正态（中心极限）；频度低、强度厚尾时，S 严重右偏。",
      math:"S=Σᵢ₌₁<sup>N</sup> Xᵢ。<br>E[S]=E[N]·E[X]。<br>Var(S)=E[N]Var(X)+Var(N)(E[X])²。<br>MGF：M<sub>S</sub>(t)=M<sub>N</sub>(ln M<sub>X</sub>(t))。<br>假设：Xᵢ i.i.d.，N 与 Xᵢ 独立。",
      code:"# 集体风险模型模拟\nset.seed(1)\nlam<-4; mu<-2\nN<-rpois(2000, lam)\nS<-sapply(N, function(n) sum(rexp(n, 1/mu)))\nmean(S); quantile(S, .995)  # E[S]≈8，VaR"},
    quiz:[
      {q:"集体风险模型 S=ΣXᵢ 中，N 代表：", opts:["总赔款额", "保单数量", "索赔次数（频度）", "单次赔款金额"], ans:2, why:"N 是随机索赔次数（频度），Xᵢ 是单次赔款（强度），S 是总赔款。", lv:1},
      {q:"集体风险模型下，总赔款 S 的分布通常呈现：", opts:["对称钟形", "右偏、厚尾", "均匀分布", "退化于一点"], ans:1, why:"频度低、强度厚尾时 S 严重右偏厚尾，极端大额赔款拉长右尾。", lv:1},
      {q:"若某时期索赔次数 N=0，则总赔款 S 等于：", opts:["E[X]", "1", "无法确定", "0"], ans:3, why:"没有索赔就没有赔款，空和约定为 S=0。", lv:1},
      {q:"Var(S)=E[N]Var(X)+Var(N)(E[X])² 中，反映「索赔次数波动（频度不确定性）」的是：", opts:["E[N]Var(X)", "Var(N)(E[X])²", "两项都是", "两项都不是"], ans:1, why:"Var(N)(E[X])² 来自 N 的波动；E[N]Var(X) 来自单次赔款强度 X 的波动。", lv:2},
      {q:"总赔款 S 的矩母函数 M<sub>S</sub>(t) 与 N、X 的矩母函数关系为：", opts:["M<sub>S</sub>(t)=M<sub>N</sub>(t)·M<sub>X</sub>(t)", "M<sub>S</sub>(t)=M<sub>N</sub>(t)+M<sub>X</sub>(t)", "M<sub>S</sub>(t)=M<sub>N</sub>(ln M<sub>X</sub>(t))", "M<sub>S</sub>(t)=[M<sub>X</sub>(t)]<sup>N</sup>"], ans:2, why:"复合分布 MGF 为 M<sub>S</sub>(t)=M<sub>N</sub>(ln M<sub>X</sub>(t))，由条件 MGF 与全期望推出。", lv:2},
      {q:"保持单次赔款分布不变，索赔频度 N 很大时，S 的分布趋向：", opts:["接近正态（中心极限）", "更严重右偏", "退化为单点", "变成离散分布"], ans:0, why:"频度高时 S 是大量独立赔款之和，由中心极限定理趋近正态。", lv:2},
      {q:"N~Poisson(4)，X~Exp（E[X]=2，Var(X)=4），则总赔款 S 的方差 Var(S) 为：", opts:["8", "16", "32", "64"], ans:2, why:"Var(S)=E[N]Var(X)+Var(N)(E[X])²=4×4+4×4=32（Poisson 时 E[N]=Var(N)=4）。", lv:3},
      {q:"若索赔次数 N 与单次赔款 Xᵢ 不独立（如大额风险索赔次数也高），直接用 E[S]=E[N]·E[X] 会：", opts:["仍然精确成立", "一般不再成立，需回到全期望 E[E[S|N]]", "使 S 恒为 0", "使方差变为 0"], ans:1, why:"E[S]=E[N]E[X] 依赖 N 与 Xᵢ 独立；不独立时须用全期望 E[E[S|N]] 处理。", lv:3},
      {q:"下列哪种组合下，总赔款 S 的右偏与厚尾最严重、最需资本兜住右尾？", opts:["高频度 + 轻尾强度", "高频度 + 厚尾强度", "低频度 + 退化强度（X 恒定）", "低频度 + 厚尾强度（如巨灾）"], ans:3, why:"频度低时中心极限平均化作用弱，强度厚尾使极端大额索赔主导右尾，S 右偏最严重。", lv:3}
    ]
  },

  { id:"compound-poisson", name:"复合 Poisson 的矩：λ 的化简魔法", icon:"🧙", minutes:9,

    demo:"demos/aggregate-loss.html",
    hook:"Poisson 有个神奇的性质：<b>均值等于方差</b>（都是 λ）。把它代入复合分布的一般公式，两项方差立刻合并成一项：<b>Var(S)=λE[X²]</b>。这个化简，让复合 Poisson 成为最易处理的复合分布。",
    intuition:"一般复合分布 Var(S)=E[N]Var(X)+Var(N)(E[X])²。对 Poisson，E[N]=Var(N)=λ，于是 <b>Var(S)=λVar(X)+λ(E[X])²=λE[X²]</b>。MGF 为 M<sub>S</sub>(t)=exp[λ(M<sub>X</sub>(t)−1)]。试着拼出一般形式的方差公式。",
    chain:{
      param:{val:"N~Poisson(λ)", sub:"E[N]=Var(N)=λ"},
      math:{val:"Var(S)=λE[X²]", sub:"两项合一"},
      real:{val:"最易处理的复合分布", sub:"可加性、闭式矩"}
    },
    engine:{type:"build", title:"拼装复合分布方差 Var(S) 的一般公式",
      prompt:"用下方积木拼出复合分布方差的一般表达式 Var(S)：",
      bank:["E[N]","Var(X)","Var(N)","(E[X])²","+","E[X²]","−"],
      answer:["E[N]","Var(X)","+","Var(N)","(E[X])²"],
      success:"Var(S)=E[N]Var(X)+Var(N)(E[X])²。对 Poisson，E[N]=Var(N)=λ，两项合并为 λE[X²]。",
      fail:"提示：两项相加——强度方差 Var(X) 乘 E[N]，加上频度方差 Var(N) 乘 (E[X])²。"},
    drawers:{
      mechanism:"复合分布方差的两项对应两个不确定性来源。Poisson 因为「均值=方差」，两项系数都是 λ，恰好合成 λ(Var(X)+(E[X])²)=λE[X²]。这个简洁形式加上 MGF 的指数结构，让复合 Poisson 在可加性、近似计算上都特别好用。",
      math:"一般：Var(S)=E[N]Var(X)+Var(N)(E[X])²。<br>Poisson：E[N]=Var(N)=λ ⇒ Var(S)=λE[X²]=λm₂。<br>E[S]=λm₁，skew(S)=λm₃。<br>MGF：M<sub>S</sub>(t)=exp[λ(M<sub>X</sub>(t)−1)]。",
      code:"# 复合 Poisson 的矩\nlam<-4; mu<-2            # X~Exp(1/mu)\nES  <- lam*mu            # λm1\nVarS<- lam*2*mu^2        # λm2 = λ·2μ²（指数 m2=2μ²）\ncat(ES, VarS)"},
    quiz:[
      {q:"复合 Poisson 分布（N~Poisson(λ)）的总赔款均值 E[S] 等于：", opts:["λ²E[X]", "λE[X]", "E[X]/λ", "λE[X²]"], ans:1, why:"E[S]=E[N]·E[X]=λE[X]=λm₁。", lv:1},
      {q:"复合 Poisson 总赔款 S 的三阶中心矩 E[(S−E[S])³]（偏度）等于：", opts:["λE[X]", "(λE[X])³", "λE[X³]=λm₃", "λ²E[X²]"], ans:2, why:"复合 Poisson 的偏度（三阶中心矩）为 λm₃=λE[X³]。", lv:1},
      {q:"记 mₖ=E[Xᵏ]，则单次赔款的方差 Var(X) 等于：", opts:["m₂−m₁²", "m₂+m₁²", "m₁²−m₂", "m₂"], ans:0, why:"Var(X)=E[X²]−(E[X])²=m₂−m₁²。", lv:1},
      {q:"复合 Poisson 中 λ=5，单次赔款 X~Exp（均值 μ=3，故 E[X²]=2μ²=18），则 Var(S) 为：", opts:["45", "150", "270", "90"], ans:3, why:"Var(S)=λE[X²]=λm₂=5×18=90（指数分布 m₂=2μ²）。", lv:2},
      {q:"复合 Poisson 的 Var(S)=λE[X²] 等价于下列哪一项？", opts:["λVar(X)−λ(E[X])²", "λ(Var(X)+(E[X])²)", "λ²Var(X)", "λ(E[X])²"], ans:1, why:"E[X²]=Var(X)+(E[X])²，故 λE[X²]=λVar(X)+λ(E[X])²，即一般公式两项之和。", lv:2},
      {q:"由一般式 M<sub>S</sub>(t)=M<sub>N</sub>(ln M<sub>X</sub>(t)) 及 Poisson 的 M<sub>N</sub>(t)=exp[λ(eᵗ−1)]，复合 Poisson 的 M<sub>S</sub>(t) 为：", opts:["exp[λ(M<sub>X</sub>(t)−1)]", "exp[λM<sub>X</sub>(t)]", "[M<sub>X</sub>(t)]<sup>λ</sup>", "exp[λt(M<sub>X</sub>(t)−1)]"], ans:0, why:"代入 e<sup>ln M<sub>X</sub></sup>=M<sub>X</sub>，得 exp[λ(M<sub>X</sub>(t)−1)]。", lv:2},
      {q:"复合 Poisson 中 λ=10，E[X]=2、Var(X)=5。则 E[S] 与 Var(S) 分别为：", opts:["E[S]=20，Var(S)=50", "E[S]=20，Var(S)=40", "E[S]=20，Var(S)=90", "E[S]=100，Var(S)=90"], ans:2, why:"E[S]=λE[X]=20；E[X²]=Var(X)+(E[X])²=9，Var(S)=λE[X²]=90。", lv:3},
      {q:"下列哪个公式是复合 Poisson 特有（而非一般复合分布通用）的？", opts:["E[S]=E[N]·E[X]", "Var(S)=E[N]Var(X)+Var(N)(E[X])²", "M<sub>S</sub>(t)=M<sub>N</sub>(ln M<sub>X</sub>(t))", "Var(S)=λE[X²]"], ans:3, why:"前三式对任意复合分布成立；Var(S)=λE[X²] 用到 E[N]=Var(N)=λ，是 Poisson 特有。", lv:3},
      {q:"若单次赔款退化为常数 X≡c（Var(X)=0），复合 Poisson 的 Var(S) 等于：", opts:["0", "λc²", "λc", "c²"], ans:1, why:"X≡c 时 E[X²]=c²，Var(S)=λE[X²]=λc²（此时 S=cN，即缩放 Poisson，方差 λc²）。", lv:3}
    ]
  },

  { id:"frequency-nb", name:"负二项频度：过度离散的救星", icon:"📦", minutes:9,
    demo:"demos/ab0-class.html",
    hook:"用 Poisson 拟合索赔次数，却发现<b>样本方差远大于均值</b>——Poisson 的「均值=方差」被现实打脸了。这时需要一个更宽容的频度分布：<b>负二项</b>，它的方差可以大于均值。",
    intuition:"负二项 N~NB(r,p) 的均值 kq/p、方差 kq/p²（q=1−p），<b>方差=均值/p > 均值</b>，能刻画「过度离散」（heterogeneity：保单组合异质、风险不均）。拖动 r、p，看负二项的尾巴如何比同均值 Poisson 更厚。",
    chain:{
      param:{val:"r, p", sub:"NB 的两个旋钮"},
      math:{val:"Var=均值/p > 均值", sub:"过度离散"},
      real:{val:"异质组合索赔更分散", sub:"Poisson 太「紧」"}
    },
    engine:{type:"curve", title:"频度分布对比：Poisson vs 负二项（拖 r、p）",
      x:{min:0,max:20,label:"索赔次数 k"}, y:{label:"P(N=k)"}, ymin:0,
      series:[
        {label:"Poisson(λ)", color:"var(--ch19)", fn:"poissonPMF", width:2},
        {label:"负二项 NB(r,p)", color:"#f472b6", fn:"nbPMF", width:3}
      ],
      params:[
        {key:"lambda", label:"Poisson 参数 λ", min:1, max:15, step:1, val:5},
        {key:"r", label:"NB 参数 r", min:1, max:10, step:0.5, val:5},
        {key:"p", label:"NB 参数 p", min:0.1, max:0.9, step:0.05, val:0.5}
      ],
      live:(P)=>{ const nbm=P.r*(1-P.p)/P.p; const nbv=P.r*(1-P.p)/(P.p*P.p); return {param:"λ="+P.lambda+" · r="+P.r.toFixed(1)+" · p="+(+P.p).toFixed(2)+"|两个频度模型", math:"NB 均值="+nbm.toFixed(1)+" 方差="+nbv.toFixed(1)+"（>均值）|过度离散", real:(P.p<0.7?"NB 尾更厚：索赔次数更分散":"p 大时 NB 接近 Poisson")+"|异质组合"}; },
      note:"p 越小，负二项方差越大、右尾越厚（粉色比蓝色更「胖」）。当 p→1 时 NB 退化为 Poisson。真实保单组合常有异质性，NB 比 Poisson 更贴合。"},
    drawers:{
      mechanism:"Poisson 假设所有保单风险完全同质，导致「均值=方差」。但真实组合里风险有高有低（异质性），索赔次数波动被放大，方差>均值——这就是过度离散。负二项可以看作「λ 本身服从 Gamma 分布」的 Poisson 混合，天然带上这层异质性。",
      math:"NB(r,p)：P(N=k)=C(k+r−1,k)pʳ qᵏ。<br>E[N]=rq/p，Var(N)=rq/p²=均值/p ≥ 均值。<br>NB 是 Poisson-Gamma 混合：N∣Λ~Pois(Λ)，Λ~Gamma。<br>复合 NB：E[S]=(rq/p)E[X]。",
      code:"# 过度离散诊断\nn <- c(0,1,2,3,4,5,6,8,10)  # 索赔次数\nmean(n); var(n)             # 若 var >> mean → 用 NB\n# 拟合负二项\nlibrary(MASS); fitdistr(n, 'negative binomial')"},
    quiz:[
      {q:"「过度离散」（overdispersion）在索赔次数建模中指：", opts:["样本方差远大于均值", "样本均值远大于方差", "均值等于方差", "方差等于 0"], ans:0, why:"过度离散即 var>mean，违背 Poisson 的「均值=方差」，提示改用负二项。", lv:1},
      {q:"负二项 N~NB(r,p)（q=1−p）的方差 Var(N) 等于：", opts:["rq/p", "rp/q", "rq/p²", "rq²/p"], ans:2, why:"NB(r,p) 均值 rq/p、方差 rq/p²=均值/p，p<1 时方差大于均值。", lv:1},
      {q:"Poisson 频度分布被现实「打脸」、需要负二项替代，是因为它假设：", opts:["方差大于均值", "均值等于方差", "索赔次数恒为 0", "赔款服从正态"], ans:1, why:"Poisson 强制均值=方差，无法容纳真实数据中常见的 var>mean（过度离散）。", lv:1},
      {q:"固定 r，负二项参数 p 越小时，索赔次数分布：", opts:["方差越小、越集中", "均值恒为 0", "退化为正态", "方差越大、右尾越厚"], ans:3, why:"Var=rq/p²，p↓ 则 q↑ 且 1/p²↑，方差增大、右尾更厚（过度离散更明显）。", lv:2},
      {q:"负二项能刻画过度离散，其机制可理解为：", opts:["保单组合异质、λ 本身随机（Poisson-Gamma 混合）放大了索赔次数波动", "所有保单风险完全同质", "索赔金额服从厚尾分布", "索赔次数被人为调高"], ans:0, why:"NB 是 Poisson-Gamma 混合：λ 随机（异质性）使边际方差 Var=均值/p>均值。", lv:2},
      {q:"均值相同的负二项与 Poisson 频度分布相比，负二项的右尾：", opts:["更薄", "更厚（索赔次数更分散、右尾更厚）", "完全相同", "先厚后薄"], ans:1, why:"同均值下 NB 方差=均值/p>均值=Poisson 方差，分布更分散、右尾更厚。", lv:2},
      {q:"复合负二项中 N~NB(r=4,p=0.5)（q=0.5），单次赔款 E[X]=3，则 E[S] 为：", opts:["6", "24", "12", "4"], ans:2, why:"E[N]=rq/p=4×0.5/0.5=4，E[S]=E[N]·E[X]=4×3=12。", lv:3},
      {q:"若样本索赔次数方差明显小于均值（欠离散 underdispersion），下列哪个频度分布比 Poisson 更合适？", opts:["负二项", "二项分布", "复合 Poisson", "Gamma 分布"], ans:1, why:"二项 Bin(n,p) 方差=np(1−p)<均值=np，刻画欠离散；负二项刻画过度离散（var>mean）。", lv:3},
      {q:"把 N 看作 Poisson-Gamma 混合（N|Λ~Pois(Λ)），用全方差公式 Var(N)=E[Var(N|Λ)]+Var(E[N|Λ]) 可得 Var(N) 等于：", opts:["仅 E[Λ]", "仅 Var(Λ)", "E[Λ]−Var(Λ)", "E[Λ]+Var(Λ)，大于均值 E[Λ]"], ans:3, why:"Poisson 条件均值=方差=Λ，故 Var(N)=E[Λ]+Var(Λ)=均值+异质方差>均值，即过度离散来源。", lv:3}
    ]
  },

  { id:"compound-additivity", name:"复合 Poisson 可加性：组合的魔法", icon:"🧩", minutes:8,
    demo:"demos/aggregate-loss.html",
    hook:"车险部、家险部各自建模，现在老板要<b>合并整个产险组合</b>的总赔款。如果两部门都是复合 Poisson 且相互独立，好消息：合并后<b>还是复合 Poisson</b>，参数直接相加。",
    intuition:"独立的复合 Poisson 之和仍是复合 Poisson：S<sub>A</sub>+S<sub>B</sub> ~ 复合 Poisson，<b>频度参数 λ=λ<sub>A</sub>+λ<sub>B</sub></b>，单次赔款分布是 λᵢ/λ 加权的混合分布。这让保险组合可以「先分后合」地建模——正是风险汇集（pooling）的数学基础。",
    chain:{
      param:{val:"λ<sub>A</sub> + λ<sub>B</sub>", sub:"频度相加"},
      math:{val:"和仍为复合 Poisson", sub:"强度按 λᵢ/λ 加权"},
      real:{val:"组合可合并建模", sub:"pooling 降方差"}
    },
    engine:{type:"predict", title:"预测：两个独立复合 Poisson 之和服从什么？",
      scenario:"车险年聚合赔款 S<sub>A</sub>~复合 Poisson(λ=3)，家险 S<sub>B</sub>~复合 Poisson(λ=5)，两者独立。合并后的 S<sub>A</sub>+S<sub>B</sub> 服从：",
      options:[
        {icon:"🎯", label:"复合 Poisson，λ=8", mini:"可加性", correct:true},
        {icon:"➡️", label:"不再是复合分布", mini:"无法合并", correct:false},
        {icon:"📊", label:"正态分布", mini:"中心极限", correct:false},
        {icon:"📈", label:"复合 Poisson，λ=15", mini:"相乘", correct:false}
      ],
      reveal:"独立复合 Poisson 之和仍是复合 Poisson：频度参数相加 λ=3+5=8，单次赔款分布为 (3/8)F<sub>A</sub>+(5/8)F<sub>B</sub> 的加权混合。这个可加性让大组合可以分块建模再合并，是风险汇集的数学根基。"},
    drawers:{
      mechanism:"可加性的根源在 MGF：复合 Poisson 的 MGF 是 exp[λ(M<sub>X</sub>−1)]，两个独立变量相乘时指数相加，恰好还是复合 Poisson 的形式。频度相加、强度按频度加权混合。这保证了「整体=部分之和」在分布层面依然成立。",
      math:"Sᵢ~复合 Poisson(λᵢ, Fᵢ) 独立 ⇒ ΣSᵢ~复合 Poisson(λ, F)。<br>λ=Σλᵢ，F(x)=Σ(λᵢ/λ)Fᵢ(x)。<br>证明：MGF 相乘，指数项相加。<br>推论：组合可分块建模再合并。",
      code:"# 可加性验证（模拟）\nA<-sapply(rpois(5000,3), function(n) sum(rexp(n,1)))\nB<-sapply(rpois(5000,5), function(n) sum(rexp(n,2)))\nS<-A+B\nmean(S)  # ≈ 3*1 + 5*2 = 13"},
    quiz:[
      {q:"复合 Poisson 可加性（和仍为复合 Poisson）成立的关键前提是：", opts:["频度参数相等", "各复合 Poisson 相互独立", "单次赔款服从正态", "索赔次数为常数"], ans:1, why:"可加性要求各分量相互独立，MGF 才能相乘、指数项相加。", lv:1},
      {q:"车险 S<sub>A</sub>~复合 Poisson(λ=3) 与家险 S<sub>B</sub>~复合 Poisson(λ=5) 独立，合并后频度参数为：", opts:["8", "15", "2", "5"], ans:0, why:"频度相加 λ=3+5=8（不是相乘）。", lv:1},
      {q:"复合 Poisson 可加性在保险实务中的直接意义是：", opts:["必须逐保单建模", "合并后不再是复合分布", "大组合可「先分块建模再合并」，便于风险汇集", "频度参数相乘"], ans:2, why:"可加性让产险组合分部门建模后再合并，是风险汇集（pooling）的数学基础。", lv:1},
      {q:"λ<sub>A</sub>=3、λ<sub>B</sub>=5 的两个独立复合 Poisson 合并后，单次赔款分布中 F<sub>A</sub> 的权重为：", opts:["5/8", "1/2", "3/5", "3/8"], ans:3, why:"合并强度按频度占比加权，F<sub>A</sub> 权重=λ<sub>A</sub>/(λ<sub>A</sub>+λ<sub>B</sub>)=3/8。", lv:2},
      {q:"两独立复合 Poisson 的单次赔款分布不同（MGF 为 M<sub>A</sub>、M<sub>B</sub>）时，合并后的单次赔款 MGF 为：", opts:["频度加权混合 (λ<sub>A</sub> M<sub>A</sub>+λ<sub>B</sub> M<sub>B</sub>)/(λ<sub>A</sub>+λ<sub>B</sub>)", "M<sub>A</sub>·M<sub>B</sub>", "M<sub>A</sub>+M<sub>B</sub>", "M<sub>A</sub>−M<sub>B</sub>"], ans:0, why:"合并后强度 MGF=(λ<sub>A</sub> M<sub>A</sub>+λ<sub>B</sub> M<sub>B</sub>)/λ，即按频度占比加权的混合分布 MGF。", lv:2},
      {q:"若两个复合 Poisson 不独立（如共享同一巨灾因子），其和：", opts:["仍是复合 Poisson(λ₁+λ₂)", "一般不再是复合 Poisson，可加性失效", "变为正态", "频度参数相乘"], ans:1, why:"可加性依赖独立性；相关时 MGF 不能简单相乘，和一般不再是复合 Poisson。", lv:2},
      {q:"S<sub>A</sub>~复合 Poisson(λ=3，X<sub>A</sub> 均值 1)、S<sub>B</sub>~复合 Poisson(λ=5，X<sub>B</sub> 均值 2) 独立，合并后总赔款均值 E[S<sub>A</sub>+S<sub>B</sub>] 为：", opts:["8", "16", "13", "30"], ans:2, why:"E[S<sub>A</sub>+S<sub>B</sub>]=3×1+5×2=13；等价于 λ·E[混合强度]=8×(3/8·1+5/8·2)=13。", lv:3},
      {q:"X<sub>A</sub>≡X<sub>B</sub>≡1（常数）时，S<sub>A</sub>~复合 Poisson(λ=3)、S<sub>B</sub>~复合 Poisson(λ=5) 独立。合并后 S<sub>A</sub>+S<sub>B</sub> 的方差为：", opts:["15", "3", "5", "8"], ans:3, why:"X≡1 时复合 Poisson 即 Poisson，Var(S<sub>A</sub>)=3、Var(S<sub>B</sub>)=5，独立和方差相加=8（=合并 λ）。", lv:3},
      {q:"把多个独立、同强度分布的复合 Poisson 子组合并（λ 增大）后，总赔款的变异系数 CV=SD(S)/E[S] 一般：", opts:["减小（风险汇集降低相对波动）", "增大", "不变", "变为 0"], ans:0, why:"复合 Poisson 下 CV=√(λm₂)/(λm₁)∝1/√λ，λ 增大 CV 下降——正是 pooling 降相对风险的数学体现。", lv:3}
    ]
  }
      ] },
  { id:20, no:"Ch20", name:"风险模型 II", icon:"🧱", color:"var(--ch20)", weight:"Syllabus 1.2", status:"live", pdf:"pdf/loss-model-ch20.pdf", qa:"qa/ch20-qa.html",
    desc:"复合分布的矩、再保险后的复合分布、个体风险模型与破产模型。", kps:[
      { id:"reins-moments", name:"再保险后的聚合赔款矩", icon:"🪂", minutes:9,
        demo:"demos/reins-model.html",
    hook:"买了再保险，保险人自己的赔付 S<sub>I</sub> 就变成「原赔款被切一刀」后的总和。<b>成数分保下 S<sub>I</sub>=αS</b>——方差直接缩到 α² 倍。这一刀切得越深，晚上睡得越香。",
    intuition:"引入再保险后，每次索赔拆成保险人 Yᵢ 与再保险人 Zᵢ（Xᵢ=Yᵢ+Zᵢ），各自的总赔付 S<sub>I</sub>、S<sub>R</sub> 仍是复合分布，把公式里的 X 换成 Y 或 Z 即可。<b>成数分保 Y=αX ⇒ S<sub>I</sub>=αS，Var(S<sub>I</sub>)=α²Var(S)</b>；超赔则 Y=min(X,M)。试着拼出成数下保险人自留的方差。",
    chain:{
      param:{val:"自留比例 α / 自留额 M", sub:"切分方式"},
      math:{val:"Var(S<sub>I</sub>)=α²Var(S)", sub:"线性缩放"},
      real:{val:"自留波动大幅压缩", sub:"用保费换稳定"}
    },
    engine:{type:"build", title:"拼装成数再保险下保险人自留方差 Var(S<sub>I</sub>)",
      prompt:"成数再保险自留比例 α，保险人自留总额 S<sub>I</sub>=αS。拼出 Var(S<sub>I</sub>)：",
      bank:["α²","Var(S)","α","E[S]","+","Var(N)"],
      answer:["α²","Var(S)"],
      success:"Var(S<sub>I</sub>)=α²Var(S)——自留额的标准差按 α 缩放，α=0.5 时方差缩到 1/4。",
      fail:"提示：S<sub>I</sub>=αS 是线性关系，方差提出系数要平方。"},
    drawers:{
      mechanism:"再保险不改变「复合分布」的结构，只替换单次赔款变量：保险人用 Y、再保险人用 Z，第 19 章的矩公式原样套用。成数是线性切分（方差按 α² 缩）；超赔是非线性切分（Y=min(X,M) 有界，方差压缩更彻底但保费更贵）。",
      math:"Xᵢ=Yᵢ+Zᵢ，S=S<sub>I</sub>+S<sub>R</sub>。<br>E[S<sub>I</sub>]=E[N]E[Y]，Var(S<sub>I</sub>)=E[N]Var(Y)+Var(N)(E[Y])²。<br>成数：Y=αX ⇒ S<sub>I</sub>=αS，Var(S<sub>I</sub>)=α²Var(S)。<br>超赔：Y=min(X,M)，Z=(X−M)₊。",
      code:"# 成数 vs 超赔的自留方差\nX<-rgamma(1e5,2,rate=1/1000); alpha<-0.6; M<-2500\nvar(alpha*X)        # 成数自留方差\nvar(pmin(X,M))      # 超赔自留方差（更小）"},
    quiz:[
      {q:"引入再保险后，保险人对第 i 次索赔的赔付 Yᵢ 与再保险人赔付 Zᵢ 满足：", opts:["Xᵢ=Yᵢ+Zᵢ", "Xᵢ=Yᵢ·Zᵢ", "Xᵢ=Yᵢ−Zᵢ", "Xᵢ=max(Yᵢ,Zᵢ)"], ans:0, why:"每次索赔被拆成保险人与再保险人两部分，Xᵢ=Yᵢ+Zᵢ，总额 S=S<sub>I</sub>+S<sub>R</sub>。", lv:1},
      {q:"比例（成数）再保险自留比例 α 下，保险人单次赔付 Yᵢ 等于：", opts:["αXᵢ", "min(Xᵢ,M)", "(Xᵢ−M)₊", "(1−α)Xᵢ"], ans:0, why:"成数是线性切分，保险人按固定比例自留，Yᵢ=αXᵢ。", lv:1},
      {q:"个别超赔再保险（自留额 M）下，再保险人单次赔付 Zᵢ 等于：", opts:["min(Xᵢ,M)", "(Xᵢ−M)₊", "αXᵢ", "Xᵢ−M"], ans:1, why:"再保险人只付超过自留额的部分，Zᵢ=max(0,Xᵢ−M)=(Xᵢ−M)₊。", lv:1},
      {q:"成数再保险下保险人自留总额 S<sub>I</sub> 与原总赔款 S 的关系是：", opts:["S<sub>I</sub>=αS", "S<sub>I</sub>=S−α", "S<sub>I</sub>=S/α", "S<sub>I</sub>=α+S"], ans:0, why:"Yᵢ=αXᵢ 逐项线性求和，得 S<sub>I</sub>=αS。", lv:2},
      {q:"成数再保险把自留比例从 α 降到 α/2，保险人自留总额的标准差 SD(S<sub>I</sub>) 变为原来的：", opts:["1/2", "1/4", "不变", "2 倍"], ans:0, why:"SD(S<sub>I</sub>)=αSD(S) 按 α 线性缩放，α 减半则标准差减半（方差才缩到 1/4）。", lv:2},
      {q:"超赔再保险下保险人单次自留 Y=min(X,M) 与成数自留 Y=αX 相比，关键区别是：", opts:["超赔自留有上界 M、大额索赔被截断，成数自留随 X 线性无界", "两者都是有界线性的", "成数自留有上界，超赔没有", "两者完全相同"], ans:0, why:"超赔 Y=min(X,M) 有界、非线性，对大额索赔压缩更彻底；成数 Y=αX 线性无界。", lv:2},
      {q:"成数再保险自留 α=0.6，原总赔款 E[S]=100、Var(S)=400，则保险人自留的 E[S<sub>I</sub>] 与 Var(S<sub>I</sub>) 为：", opts:["E[S<sub>I</sub>]=60，Var(S<sub>I</sub>)=144", "E[S<sub>I</sub>]=60，Var(S<sub>I</sub>)=240", "E[S<sub>I</sub>]=60，Var(S<sub>I</sub>)=400", "E[S<sub>I</sub>]=36，Var(S<sub>I</sub>)=144"], ans:0, why:"E[S<sub>I</sub>]=αE[S]=60；Var(S<sub>I</sub>)=α²Var(S)=0.36×400=144。", lv:3},
      {q:"保险人自留 S<sub>I</sub> 的方差通用公式 Var(S<sub>I</sub>)=E[N]Var(Y)+Var(N)(E[Y])² 在成数（Y=αX）下化简为：", opts:["α²Var(S)", "αVar(S)", "α²E[S]", "Var(S)"], ans:0, why:"代入 Var(Y)=α²Var(X)、E[Y]=αE[X]，两项各提出 α²，正好得 α²Var(S)。", lv:3},
      {q:"总超赔（Stop Loss，针对总赔款 S、总自留额 M）下，再保险人总赔付 S<sub>R</sub> 等于：", opts:["(S−M)₊", "Σ(Xᵢ−M)₊", "min(S,M)", "αS"], ans:0, why:"总超赔针对总赔款而非单次索赔，S<sub>R</sub>=max(0,S−M)=(S−M)₊，区别于个别超赔的 Σ(Xᵢ−M)₊。", lv:3}
    ]
  },

  { id:"xl-reinsurer", name:"超赔再保险人的聚合赔款：Poisson 稀释", icon:"🎯", minutes:9,
    demo:"demos/aggregate-loss.html",
    hook:"再保险人只接「超过 M」的赔案。原组合一年赔 N 次，但大部分小额赔案根本到不了他手里。<b>他真正出手的次数 N<sub>R</sub>，是被 p=P(X>M) 稀释过的 Poisson(λp)</b>。",
    intuition:"超赔再保险人的总赔付有两种建模方式：<b>人工模型</b> S<sub>R</sub>=Σᵢ₌₁<sup>N</sup> Zᵢ（沿用原索赔次数 N，未超 M 的 Zᵢ=0，数学简单）；<b>现实模型</b> S<sub>R</sub>=Σⱼ₌₁<sup>N<sub>R</sub></sup> Wⱼ（N<sub>R</sub> 是实际超 M 的次数，Wⱼ 是 X−M 在 X>M 下的条件分布）。若 N~Poisson(λ)，由 Poisson 稀释性，<b>N<sub>R</sub>~Poisson(λp)</b>。",
    chain:{
      param:{val:"p=P(X>M)", sub:"超赔概率"},
      math:{val:"N<sub>R</sub>~Poisson(λp)", sub:"Poisson 稀释"},
      real:{val:"再保人只接大额、低频", sub:"频次被 p 稀释"}
    },
    engine:{type:"predict", title:"预测：再保险人实际赔付次数 N<sub>R</sub> 服从什么？",
      scenario:"个别超赔再保险（自留额 M），原索赔次数 N~Poisson(λ)，单次索赔超过 M 的概率 p=P(X>M)。现实模型中，再保险人实际发生赔付的次数 N<sub>R</sub> 服从：",
      options:[
        {icon:"🎯", label:"Poisson(λp)", mini:"被 p 稀释", correct:true},
        {icon:"➡️", label:"Poisson(λ)", mini:"与原组合相同", correct:false},
        {icon:"📊", label:"Binomial(n,p)", mini:"固定 n", correct:false},
        {icon:"📈", label:"负二项", mini:"过度离散", correct:false}
      ],
      reveal:"Poisson 稀释（thinning）：每次索赔独立地以概率 p 超过 M，故超赔次数 N<sub>R</sub>~Poisson(λp)。人工模型沿用原 N（多数 Zᵢ=0，数学简单）；现实模型用 N<sub>R</sub> 搭配条件分布 X−M∣X>M，更贴合再保险人实际看到的赔案流。"},
    drawers:{
      mechanism:"把原索赔流按「是否超 M」分成两股：超的（概率 p）流向再保险人，不超的留下。Poisson 过程按概率独立分流后仍是 Poisson，强度乘 p——这就是稀释性。再保险人面对的是「低频、大额」的赔案流，频次 λp 远小于 λ。",
      math:"p=P(X>M)。<br>人工模型：S<sub>R</sub>=Σᵢ₌₁<sup>N</sup> Zᵢ，Zᵢ=(Xᵢ−M)₊（可为 0）。<br>现实模型：S<sub>R</sub>=Σⱼ₌₁<sup>N<sub>R</sub></sup> Wⱼ，N<sub>R</sub>~Poisson(λp)，W~(X−M∣X>M)。<br>E[S<sub>R</sub>]=λp·E[W]=λE[(X−M)₊]（两模型一致）。",
      code:"# Poisson 稀释验证\nlam<-1000; p<-0.08\nN<-rpois(5000, lam)\nNR<-rbinom(5000, N, p)   # 每笔以 p 超赔\nmean(NR)                 # ≈ lam*p = 80"},
    quiz:[
      {q:"个别超赔再保险中，单次索赔超过自留额 M 的概率 p 等于：", opts:["P(X>M)", "P(X<M)", "E[X]/M", "P(X=M)"], ans:0, why:"再保险人只在索赔额超过 M 时出手，超赔概率 p=P(X>M)。", lv:1},
      {q:"原索赔次数 N~Poisson(λ)、超赔概率 p 时，再保险人实际赔付次数 N<sub>R</sub> 服从：", opts:["Poisson(λp)", "Poisson(λ)", "Binomial(λ,p)", "Poisson(λ(1−p))"], ans:0, why:"Poisson 稀释（thinning）：每笔独立地以概率 p 超赔，N<sub>R</sub>~Poisson(λp)。", lv:1},
      {q:"超赔「人工模型」（Artificial Model）中再保险人总赔付 S<sub>R</sub> 写成：", opts:["Σᵢ₌₁<sup>N</sup> Zᵢ，沿用原索赔次数 N（未超 M 的 Zᵢ=0）", "Σⱼ₌₁<sup>N<sub>R</sub></sup> Wⱼ，用实际超赔次数", "N<sub>R</sub>·M", "恒为 0"], ans:0, why:"人工模型沿用原索赔次数 N，Zᵢ=(Xᵢ−M)₊ 可为 0，数学上可直接套复合分布公式。", lv:1},
      {q:"超赔再保险「现实模型」中单次实际赔付 W 的分布是：", opts:["X 的原分布", "X−M 在 X>M 下的条件分布", "均匀分布", "退化为常数 M"], ans:1, why:"W=(X−M∣X>M)，是扣除自留额后的条件超额分布，只取正值。", lv:2},
      {q:"N~Poisson(1000)、超赔概率 p=0.08 时，再保险人实际赔付次数 N<sub>R</sub> 的均值约为：", opts:["80", "1000", "920", "8"], ans:0, why:"N<sub>R</sub>~Poisson(λp)，均值 λp=1000×0.08=80，频次被 p 大幅稀释。", lv:2},
      {q:"与原索赔流相比，超赔再保险人面对的赔案流特征是：", opts:["低频、大额", "高频、小额", "频率不变、金额变小", "频率与金额都不变"], ans:0, why:"多数小额索赔到不了再保险人，他接的是被 p 稀释后的低频、大额赔案流。", lv:2},
      {q:"人工模型（S<sub>R</sub>=Σᵢ₌₁<sup>N</sup> Zᵢ）与现实模型（S<sub>R</sub>=Σⱼ₌₁<sup>N<sub>R</sub></sup> Wⱼ）的总赔款均值 E[S<sub>R</sub>] 关系是：", opts:["两者相等，都等于 λE[(X−M)₊]", "人工模型更大", "现实模型更大", "无法比较"], ans:0, why:"现实模型 E[S<sub>R</sub>]=λp·E[W]=λE[(X−M)₊]，与人工模型逐项求和的结果一致。", lv:3},
      {q:"若原索赔次数 N 服从负二项（而非 Poisson），按「是否超 M」稀释后的 N<sub>R</sub>：", opts:["一般不再是负二项的简单稀释，Poisson(λp) 结论不适用", "仍是 Poisson(λp)", "恒为 0", "变成正态分布"], ans:0, why:"N<sub>R</sub>~Poisson(λp) 依赖原 N 为 Poisson 的稀释性；换成负二项等分布时该简洁结论不再成立。", lv:3},
      {q:"自留额 M 提高时，超赔概率 p=P(X>M) 与再保险人赔付次数 N<sub>R</sub>~Poisson(λp) 的变化是：", opts:["p 减小、N<sub>R</sub> 的均值 λp 随之减小", "p 增大、N<sub>R</sub> 增大", "p 与 N<sub>R</sub> 都不变", "p 减小但 N<sub>R</sub> 增大"], ans:0, why:"M 提高使超过它的概率 p 下降，稀释后的频次 λp 也下降，再保险人出手更少。", lv:3}
    ]
  },

  { id:"individual-model", name:"个体风险模型：从每张保单出发", icon:"🧾", minutes:9,
    demo:"demos/individual-risk.html",
    hook:"集体模型从「总索赔次数 N」出发；个体模型反过来，<b>盯着每一张保单</b>：它今年出不出险（概率 qⱼ）？出了赔多少（Xⱼ）？把 n 张保单加起来，就是总赔款。",
    intuition:"个体风险模型（Individual Risk Model）：S=Y₁+⋯+Yₙ，Yⱼ 是第 j 个风险单位的年赔款。假设<b>每个单位一年最多赔一次</b>（Nⱼ∈{0,1}），出险概率 qⱼ，出险则赔 Xⱼ。故 E[Yⱼ]=qⱼE[Xⱼ]，Var(Yⱼ)=qⱼ(1−qⱼ)(E[Xⱼ])²+qⱼVar(Xⱼ)。<b>同质时退化为 N~Bin(n,q) 的集体模型</b>。",
    chain:{
      param:{val:"qⱼ, Xⱼ（逐保单）", sub:"n 个独立单位"},
      math:{val:"E[Yⱼ]=qⱼE[Xⱼ]", sub:"Bernoulli×赔额"},
      real:{val:"适合保单粒度数据", sub:"同质时=复合二项"}
    },
    engine:{type:"match", title:"配对：个体风险模型的概念",
      pairs:[
        {l:"个体风险模型", r:"从每个风险单位出发，S=ΣYⱼ"},
        {l:"每个风险单位的索赔次数", r:"一年最多 1 次，Nⱼ∈{0,1}"},
        {l:"E[Yⱼ]", r:"qⱼ·E[Xⱼ]（出险概率×赔额）"},
        {l:"Var(Yⱼ)", r:"qⱼ(1−qⱼ)(E[Xⱼ])²+qⱼVar(Xⱼ)"},
        {l:"同质个体模型（qⱼ=q）", r:"等价于 N~Bin(n,q) 的集体模型"},
        {l:"集体风险模型", r:"从整体出发，S=Σᵢ₌₁<sup>N</sup> Xᵢ"}
      ]},
    drawers:{
      mechanism:"个体模型把「是否出险」（Bernoulli qⱼ）和「出险赔多少」（Xⱼ）分开，Yⱼ 是两者的乘积。因为每单最多赔一次，Nⱼ 是 0-1 变量，方差自然含「出险与否」的波动 q(1−q)(E[X])² 和「赔多少」的波动 qVar(X) 两部分。n 张独立保单相加即得 S。",
      math:"Yⱼ=Iⱼ·Xⱼ，Iⱼ~Bernoulli(qⱼ)。<br>E[Yⱼ]=qⱼE[Xⱼ]。<br>Var(Yⱼ)=qⱼ(1−qⱼ)(E[Xⱼ])²+qⱼVar(Xⱼ)。<br>E[S]=ΣqⱼE[Xⱼ]，Var(S)=ΣVar(Yⱼ)（独立）。<br>同质 ⇒ N~Bin(n,q) 的集体模型。",
      code:"# 个体风险模型模拟\nn<-1000; q<-0.003\nI<-rbinom(n,1,q)              # 是否出险\nX<-rgamma(n,shape=5,scale=500) # 出险赔额\nS<-sum(I*X)\ncat(S, mean(I*X))"},
    quiz:[
      {q:"个体风险模型把总赔款 S 定义为：", opts:["n 个风险单位年赔款之和 S=ΣYⱼ", "总索赔次数 N 乘以平均赔额", "单次最大赔款", "索赔次数 N 本身"], ans:0, why:"个体模型从每张保单出发，S=Y₁+⋯+Yₙ，Yⱼ 是第 j 个单位的年赔款。", lv:1},
      {q:"个体风险模型的核心假设之一是：每个风险单位一年内索赔次数 Nⱼ：", opts:["服从 Poisson", "最多 1 次（0 或 1）", "至少 1 次", "可任意多次"], ans:1, why:"核心假设每单位一年最多赔一次，Nⱼ∈{0,1}，即 Bernoulli 变量。", lv:1},
      {q:"个体模型中第 j 个风险单位年赔款 Yⱼ 可写成（Iⱼ 为是否出险的指示变量）：", opts:["Yⱼ=Iⱼ·Xⱼ", "Yⱼ=Iⱼ+Xⱼ", "Yⱼ=Xⱼ/Iⱼ", "Yⱼ=Iⱼ−Xⱼ"], ans:0, why:"不出险（Iⱼ=0）赔 0，出险（Iⱼ=1）赔 Xⱼ，故 Yⱼ=IⱼXⱼ。", lv:1},
      {q:"第 j 个风险单位出险概率 qⱼ、出险赔额 Xⱼ，则 E[Yⱼ] 等于：", opts:["qⱼE[Xⱼ]", "E[Xⱼ]", "qⱼ²E[Xⱼ]", "qⱼVar(Xⱼ)"], ans:0, why:"Yⱼ=IⱼXⱼ 且 Iⱼ 与 Xⱼ 独立，E[Yⱼ]=P(出险)·E[Xⱼ]=qⱼE[Xⱼ]。", lv:2},
      {q:"n 个相互独立风险单位的总赔款 S 的方差 Var(S) 等于：", opts:["ΣVar(Yⱼ)", "(ΣE[Yⱼ])²", "ΣE[Yⱼ]", "Var(Yⱼ)/n"], ans:0, why:"独立性使协方差项为 0，Var(S)=ΣVar(Yⱼ)，逐项相加。", lv:2},
      {q:"所有风险单位同质（qⱼ=q、Xⱼ 同分布）时，个体风险模型等价于：", opts:["索赔次数 N~Bin(n,q) 的集体模型", "复合 Poisson 模型", "复合负二项模型", "正态模型"], ans:0, why:"n 个独立 Bernoulli(q) 之和为 Bin(n,q)，即退化为频度二项的集体模型。", lv:2},
      {q:"Var(Yⱼ)=qⱼ(1−qⱼ)(E[Xⱼ])²+qⱼVar(Xⱼ) 中，第一项 qⱼ(1−qⱼ)(E[Xⱼ])² 反映的是：", opts:["「出不出险」（Bernoulli）的波动", "「出险后赔多少」Xⱼ 的波动", "再保险自留比例的影响", "索赔次数的过度离散"], ans:0, why:"第一项来自是否出险的 0-1 波动；第二项 qⱼVar(Xⱼ) 才来自赔额 Xⱼ 本身的波动。", lv:3},
      {q:"两个独立风险单位：q₁=0.1、X₁≡100（常数）；q₂=0.2、X₂≡50（常数）。总赔款 S 的方差 Var(S) 为：", opts:["1700", "1300", "900", "400"], ans:1, why:"常数赔额时 Var(Yⱼ)=qⱼ(1−qⱼ)Xⱼ²：0.1×0.9×10000=900，0.2×0.8×2500=400，独立相加 900+400=1300。", lv:3},
      {q:"个体风险模型与集体风险模型的根本区别是：", opts:["个体模型从每张保单（是否出险+赔多少）出发，集体模型从总索赔次数 N 出发", "个体模型只能用正态近似", "集体模型不能处理异质保单", "两者完全等价、无区别"], ans:0, why:"个体模型逐保单建模 Yⱼ=IⱼXⱼ 再求和；集体模型先给总频度 N 再叠加赔额，出发点不同。", lv:3}
    ]
  },

  { id:"param-variability", name:"参数不确定性：异质性的代价", icon:"🎛️", minutes:8,
    demo:[{t:"Bootstrap 重抽样",src:"demos/bootstrap.html"},{t:"参数不确定性",src:"demos/parameter-uncertainty.html"}],
    hook:"你以为组合里每张保单的索赔频率都是 λ̄？错了——<b>每张保单的 λᵢ 各不相同</b>。把 λ 本身当成随机变量，总赔款的方差会多出一项。忽视它，就低估了风险。",
    intuition:"实践中参数未知且异质。把 λ 视为随机变量（如服从 Gamma），用全期望/全方差公式：<b>E[S]=E[E[S∣λ]]，Var(S)=E[Var(S∣λ)]+Var(E[S∣λ])</b>。第二项 Var(E[S∣λ])>0 是参数异质性额外贡献的方差——这正是负二项（Poisson-Gamma 混合）方差大于均值的原因。",
    chain:{
      param:{val:"λ 本身是随机变量", sub:"异质组合"},
      math:{val:"Var(S)=E[Var(S∣λ)]+Var(E[S∣λ])", sub:"全方差公式"},
      real:{val:"忽视异质性会低估风险", sub:"过度离散的来源"}
    },
    engine:{type:"predict", title:"预测：异质组合的聚合赔款方差会怎样？",
      scenario:"某组合中每张保单的索赔频率 λᵢ 服从 Gamma 分布（均值 λ̄）。与同均值的同质 Poisson(λ̄) 组合相比，这个异质组合的聚合赔款 S 的方差：",
      options:[
        {icon:"📈", label:"更大", mini:"参数异质性叠加方差", correct:true},
        {icon:"➡️", label:"相等", mini:"均值相同", correct:false},
        {icon:"📉", label:"更小", mini:"分散化", correct:false},
        {icon:"🎯", label:"为零", mini:"完全确定", correct:false}
      ],
      reveal:"全方差公式 Var(S)=E[Var(S∣λ)]+Var(E[S∣λ])：第二项 Var(E[S∣λ])>0 来自 λ 的波动，是异质性额外贡献的方差。所以异质组合方差更大——这正是负二项（Poisson-Gamma 混合）方差大于均值、呈现过度离散的根源。"},
    drawers:{
      mechanism:"同质假设把 λ 当常数，只算了「给定 λ 时」的波动 E[Var(S∣λ)]。但真实组合里 λ 本身在变，这层「参数的不确定性」通过 Var(E[S∣λ]) 叠加进来。两项相加，方差必然大于同质情形。建模时要用负二项等过离散分布，否则低估尾部。",
      math:"全期望：E[S]=E[E[S∣λ]]。<br>全方差：Var(S)=E[Var(S∣λ)]+Var(E[S∣λ])。<br>Poisson-Gamma 混合 ⇒ 边际分布为负二项，Var>均值。<br>第二项 Var(E[S∣λ])>0 即异质性贡献。",
      code:"# 参数异质性放大方差\nlam<-rgamma(2000, shape=2, rate=2/5)  # 异质 λ，均值 5\nS<-rpois(2000, lam)\nvar(S)      # ≈ 5 + Var(λ)·… > 5（同质 Poisson 方差=5）"},
    quiz:[
      {q:"处理参数不确定性时，把索赔频率 λ 本身视为：", opts:["一个随机变量（如服从 Gamma 分布）", "固定常数", "必然为 0", "样本均值"], ans:0, why:"异质组合中各保单 λᵢ 不同，把 λ 当随机变量（如 Gamma）才能刻画参数不确定性。", lv:1},
      {q:"全期望公式 E[S] 等于：", opts:["E[E[S∣λ]]", "E[S∣λ]", "Var(S∣λ)", "E[S]·λ"], ans:0, why:"先对给定 λ 求条件期望，再对 λ 取期望，E[S]=E[E[S∣λ]]。", lv:1},
      {q:"Poisson-Gamma 混合（λ~Gamma）的边际索赔次数分布是：", opts:["Poisson", "负二项", "二项", "正态"], ans:1, why:"λ 服从 Gamma 的 Poisson 混合，边际分布为负二项，呈现过度离散。", lv:1},
      {q:"全方差公式 Var(S)=E[Var(S∣λ)]+Var(E[S∣λ]) 中，第二项 Var(E[S∣λ]) 反映：", opts:["参数 λ 本身波动（异质性）贡献的方差", "给定 λ 时组内的随机波动", "样本误差", "利息波动"], ans:0, why:"第二项来自 λ 的波动，是异质性额外贡献的方差；第一项才是给定 λ 时的组内波动。", lv:2},
      {q:"与同均值 λ̄ 的同质 Poisson 组合相比，λᵢ~Gamma 的异质组合其聚合赔款 S 的方差：", opts:["更大", "相等", "更小", "为 0"], ans:0, why:"全方差公式多出 Var(E[S∣λ])>0 一项，异质组合方差必然大于同质情形。", lv:2},
      {q:"负二项（Poisson-Gamma 混合）方差大于均值，其根源是：", opts:["λ 的异质性通过 Var(E[S∣λ]) 叠加进方差", "索赔额服从厚尾分布", "样本量太小", "保费定价过高"], ans:0, why:"λ 随机使边际方差=均值+异质方差>均值，这正是过度离散（var>mean）的来源。", lv:2},
      {q:"N∣λ~Poisson(λ)、λ 的均值 E[λ]=5、方差 Var(λ)=3，则边际索赔次数 N 的方差 Var(N) 为：", opts:["8", "5", "3", "15"], ans:0, why:"Poisson 条件均值=方差=λ，Var(N)=E[λ]+Var(λ)=5+3=8>均值 5（过度离散）。", lv:3},
      {q:"若忽视参数异质性、误把 λ 当固定常数 λ̄ 建模，聚合赔款方差会被：", opts:["低估（漏掉 Var(E[S∣λ]) 项）", "高估", "完全准确", "变为 0"], ans:0, why:"只用 E[Var(S∣λ)] 会漏掉异质性贡献的 Var(E[S∣λ])，从而低估方差与尾部风险。", lv:3},
      {q:"对异质组合用全方差公式时，E[Var(S∣λ)] 与 Var(E[S∣λ]) 两项的关系是：", opts:["两项都非负、相加，缺一即低估总方差", "两项相互抵消为 0", "只需保留第二项", "只需保留第一项"], ans:0, why:"全方差由组内波动与参数异质波动两项非负相加，任一项被忽略都会低估总方差。", lv:3}
    ]
  },

  { id:"ruin-model", name:"破产模型：盈余何时见底？", icon:"🌊", minutes:11,

    demo:[{t:"离散时间破产",src:"demos/ruin-discrete.html"},{t:"连续时间破产",src:"demos/ruin-continuous.html"}],
    hook:"保险公司的盈余像一个水池：<b>保费以速率 c 稳定流入，索赔却冷不丁抽走一大块</b>。水位一旦归零，就是破产。初始资本 u 该备多少？拖一拖，看破产概率如何瞬间变化。",
    intuition:"Cramér-Lundberg 模型：盈余 U(t)=u+ct−ΣXᵢ，u 是初始盈余、c 是保费率、索赔为复合 Poisson(λ) 且赔额 Exp(μ)。<b>安全附加 θ=c/(λμ)−1</b> 衡量保费比期望赔付「多收」多少。拖动 u 与 c，观察红色路径（破产）比例与破产概率 ψ̂(u) 的变化。",
    chain:{
      param:{val:"初始盈余 u / 保费率 c", sub:"资本与定价"},
      math:{val:"ψ(u) 与 θ=c/(λμ)−1", sub:"破产概率"},
      real:{val:"资本越厚、保费越足越安全", sub:"偿付能力监管"}
    },
    engine:{type:"ruin", title:"Cramér-Lundberg：拖 u 与 c 看破产路径",
      params:[
        {key:"u", label:"初始盈余 u", min:5, max:40, step:5, val:10},
        {key:"c", label:"保费率 c", min:1, max:6, step:0.5, val:3},
        {key:"lambda", label:"索赔频率 λ", min:0.5, max:3, step:0.5, val:2},
        {key:"mean", label:"平均赔额 μ", min:0.5, max:2, step:0.25, val:1}
      ],
      T:25, n:500,
      live:(P,st)=>{ return {param:"u="+P.u+" · c="+(+P.c).toFixed(1)+"|资本与保费", math:"ψ̂(u)="+(st.psi*100).toFixed(1)+"% · θ="+(st.theta*100).toFixed(0)+"%|安全附加", real:(st.theta<=0?"θ≤0：保费不足，破产几乎必然":"资本越厚，破产概率越低")+"|偿付能力"}; },
      note:"把 u 调大：红色路径变少、ψ̂ 下降——资本是抵御破产的缓冲垫。把 c 调大：安全附加 θ 上升，路径整体向上抬。若 θ≤0（保费连期望赔付都不够），破产只是时间问题。"},
    drawers:{
      mechanism:"盈余过程是「确定性流入（保费 ct）+ 随机流出（复合 Poisson 索赔）」的拉锯。索赔的随机性可能让盈余瞬间击穿零点。初始资本 u 越高、保费率 c 越大（安全附加 θ 越高），被击穿的概率 ψ(u) 越小。理论上 ψ(u) 随 u 指数衰减（Lundberg 上界 e<sup>−Ru</sup>）。",
      math:"U(t)=u+ct−Σᵢ₌₁<sup>N(t)</sup>Xᵢ。<br>ψ(u)=P(∃t:U(t)<0)。<br>安全附加 θ=c/(λμ)−1，θ>0 是长期不破产的必要条件。<br>Lundberg 上界：ψ(u)≤e<sup>−Ru</sup>，R 为调节系数。",
      code:"# Cramér-Lundberg 模拟\nu<-10; c<-3; lam<-2; mu<-1; T<-25\nruin<-replicate(500, {\n  t<-0; U<-u; ok<-TRUE\n  while(t<T && ok){ dt<-rexp(1,lam); t<-t+dt; U<-U+c*dt-rexp(1,1/mu); if(U<0)ok<-FALSE }\n  !ok })\nmean(ruin)   # ψ̂(u)"},
    quiz:[
      {q:"Cramér-Lundberg 模型中，盈余过程 U(t) 等于：", opts:["u+ct−ΣXᵢ", "u−ct+ΣXᵢ", "ct−u", "ΣXᵢ−ct"], ans:0, why:"盈余=初始盈余 u+保费流入 ct−累计索赔 ΣXᵢ。", lv:1},
      {q:"安全附加 θ 的定义是：", opts:["c/(λμ)−1", "λμ/c", "c−λμ", "u/c"], ans:0, why:"θ=c/(λμ)−1，衡量保费率相对期望赔付 λμ 的加成比例。", lv:1},
      {q:"破产概率 ψ(u) 的定义是：", opts:["盈余过程在某时刻跌破 0 的概率 P(∃t:U(t)<0)", "盈余恒为正的概率", "索赔次数超过 u 的概率", "保费率不足的概率"], ans:0, why:"ψ(u)=P(∃t:U(t)<0)，即盈余迟早被索赔击穿零点的概率。", lv:1},
      {q:"初始盈余 u 增大时，破产概率 ψ(u) 一般：", opts:["下降", "上升", "不变", "先升后降"], ans:0, why:"资本是抵御破产的缓冲垫，u 越高被索赔击穿零点的概率越低。", lv:2},
      {q:"安全附加 θ≤0（即 c≤λμ）意味着：", opts:["保费不足以覆盖期望赔付，长期几乎必然破产", "绝对安全", "盈亏平衡且稳定", "索赔为零"], ans:0, why:"θ≤0 时保费连期望赔付都不够，盈余长期下行，破产只是时间问题。", lv:2},
      {q:"Lundberg 上界 ψ(u)≤e<sup>−Ru</sup>（R 为调节系数）说明破产概率随初始盈余 u：", opts:["指数衰减", "线性增大", "恒定", "二次增长"], ans:0, why:"上界 e<sup>−Ru</sup> 随 u 指数下降，资本越厚破产概率衰减越快。", lv:2},
      {q:"λ=2、平均赔额 μ=1、保费率 c=3 时，安全附加 θ 为：", opts:["0.5", "1.5", "0.33", "2"], ans:0, why:"θ=c/(λμ)−1=3/(2×1)−1=0.5，即保费比期望赔付多收 50%。", lv:3},
      {q:"盈余过程 U(t)=u+ct−ΣXᵢ 中，使盈余瞬间击穿零点的是：", opts:["索赔的随机跳跃（复合 Poisson 的大额赔款）", "保费的稳定流入 ct", "初始盈余 u 太大", "时间 t 本身"], ans:0, why:"保费是确定性流入、只会抬升盈余；只有索赔的随机跳跃可能让盈余瞬间跌破零点。", lv:3},
      {q:"在 Cramér-Lundberg 模型中，下列哪种变化组合最能降低破产概率 ψ(u)？", opts:["增大初始盈余 u 且提高保费率 c（增大 θ）", "减小 u 且降低 c", "增大 λ 且增大 μ", "减小 c 使 θ→0"], ans:0, why:"u 增厚缓冲垫、c 提高安全附加 θ，两者都压低 ψ(u)；其余选项都恶化偿付能力。", lv:3}
    ]
  }
      ] },
  { id:21, no:"Ch21", name:"机器学习", icon:"🤖", color:"var(--ch21)", weight:"Syllabus 5 · 10%", status:"live", pdf:"pdf/loss-model-ch21.pdf", qa:"qa/ch21-qa.html",
    desc:"监督/无监督学习、正则化（LASSO/Ridge）、决策树、KNN、K-means、PCA、Bootstrap 与 GLM。", kps:[
      { id:"ml-overview", name:"机器学习四大分支", icon:"🤖", minutes:7,
    demo:"demos/naive-bayes.html",
    hook:"同样是「从数据里学东西」，<b>有没有标签、要不要反馈</b>，决定了你走哪条路：预测赔款金额用回归，识别欺诈用分类，给客户分群用聚类，让机器人自己摸索用强化学习。",
    intuition:"机器学习四分支：<b>监督学习</b>（数据带标签：分类=离散目标、回归=连续目标）、<b>无监督学习</b>（无标签：聚类、关联规则）、<b>半监督学习</b>（少量标签+大量无标签）、<b>强化学习</b>（智能体与环境交互、最大化长期奖励）。精算里预测理赔风险是回归，预测寿命是回归，客户分群是聚类。",
    chain:{
      param:{val:"有无标签 / 反馈", sub:"分支判据"},
      math:{val:"分类 vs 回归 vs 聚类", sub:"目标类型"},
      real:{val:"按问题选对工具", sub:"精算广泛应用"}
    },
    engine:{type:"match", title:"配对：学习范式与任务",
      pairs:[
        {l:"监督学习", r:"数据带标签，学习输入→输出映射"},
        {l:"无监督学习", r:"数据无标签，发现内在结构"},
        {l:"分类 Classification", r:"目标是离散类别（如是否欺诈）"},
        {l:"回归 Regression", r:"目标是连续数值（如赔款金额）"},
        {l:"强化学习", r:"智能体试错交互，最大化长期奖励"},
        {l:"聚类 Clustering", r:"簇内相似、簇间不同（K-means）"}
      ]},
    drawers:{
      mechanism:"判别分支的关键看「目标 y 是否存在」：有 y 且离散→分类，有 y 且连续→回归（都是监督）；没有 y→无监督（聚类、降维）；靠环境奖励反馈→强化。半监督介于两者之间，用无标签数据的结构信息帮少量标签「四两拨千斤」。",
      math:"监督：y=f(x₁,…,x<sub>J</sub>)+ε，学 g≈f。<br>分类：y∈{0,1}；回归：y∈ℝ。<br>无监督：只有 x，找结构。<br>强化：状态 s、动作 a、奖励 r、策略 π。",
      code:"# 精算中的监督学习\n# 回归：预测赔款金额\nglm(claim ~ age + car_value, family=Gamma)\n# 分类：预测是否出险\nglm(at_fault ~ age + history, family=binomial)"},
    quiz:[
      {q:"区分监督学习与无监督学习的最根本判据是：", opts:["计算速度的快慢", "数据是否带标签（目标 y 是否已知）", "是否使用神经网络", "数据量的大小"], ans:1, why:"有标签 y → 监督学习；无标签 → 无监督学习，这是分支判据的根本。", lv:1},
      {q:"目标变量是离散类别（如「是否欺诈」）的监督学习任务称为：", opts:["分类 Classification", "回归 Regression", "聚类 Clustering", "降维"], ans:0, why:"目标离散 → 分类；目标连续 → 回归，二者都属于监督学习。", lv:1},
      {q:"把客户自动分成若干团（无预先给定的类别标签），这类任务属于：", opts:["监督学习（分类）", "强化学习", "无监督学习（聚类）", "半监督学习"], ans:2, why:"无标签、靠相似性发现内在结构 → 聚类，是典型的无监督学习。", lv:1},
      {q:"半监督学习与纯监督学习的关键区别是：", opts:["只用少量带标签数据 + 大量无标签数据", "完全不需要任何标签", "只处理连续型目标", "靠环境奖励反馈学习"], ans:0, why:"半监督用少量标签 + 大量无标签数据的结构信息，介于监督与无监督之间。", lv:2},
      {q:"电商「购买此商品的客户也购买了…」的购物篮分析（Apriori 关联规则）属于：", opts:["监督学习的分类", "回归", "强化学习", "无监督学习的关联规则挖掘"], ans:3, why:"发现数据项间关联、无需标签，属无监督学习中的关联规则。", lv:2},
      {q:"精算中预测某被保险人的未来寿命 Tₓ（连续数值），应选用的任务类型是：", opts:["回归（监督学习）", "聚类", "关联规则", "强化学习"], ans:0, why:"寿命是连续目标 → 回归；若预测「能否存活到某年龄」这类离散目标才是分类。", lv:2},
      {q:"强化学习区别于其余三种范式的本质在于：", opts:["数据完全无标签", "目标是连续数值", "靠智能体与环境交互的奖励反馈学最优策略，而非直接从标签学映射", "只用少量标签数据"], ans:2, why:"强化学习在状态-动作-奖励循环中试错，最大化长期累积奖励，不依赖标签映射。", lv:3},
      {q:"同一车险数据上建两个模型：A 预测「明年是否出险」，B 预测「明年赔款金额」。二者分别是：", opts:["A 是分类、B 是回归", "A 是回归、B 是分类", "两者都是分类", "两者都是回归"], ans:0, why:"是否出险是离散 0/1 → 分类；赔款金额是连续值 → 回归，目标类型决定任务类型。", lv:3},
      {q:"分类（Classification）与聚类（Clustering）都「把样本分组」，二者的根本区别是：", opts:["分类只能分两类，聚类可分多类", "聚类需要标签，分类不需要", "两者完全相同", "分类有已知类别标签做监督，聚类无标签、靠相似性自动成簇"], ans:3, why:"分类是监督学习（有标签学映射）；聚类是无监督（无标签发现结构），这是本质分野。", lv:3}
    ]
  },

  { id:"bias-variance", name:"偏差-方差权衡：U 形的总误差", icon:"⚖️", minutes:9,
    demo:"demos/train-val-test.html",
    hook:"模型越复杂，训练误差越低——但测试误差先降后升，画出一条 <b>U 形曲线</b>。左边是「学得太少」（偏差大），右边是「学得太多」（方差大）。最优点在谷底。",
    intuition:"预测误差可分解为 <b>Error = Bias² + Variance + Noise</b>。偏差是模型对真实规律的拟合不足（太简单）；方差是模型对训练数据波动的敏感（太复杂、过拟合）。模型复杂度增加：偏差²下降、方差上升，总误差呈 <b>U 形</b>，谷底就是最优复杂度。",
    chain:{
      param:{val:"模型复杂度", sub:"从简单到复杂"},
      math:{val:"Error=Bias²+Var+Noise", sub:"U 形总误差"},
      real:{val:"欠拟合 vs 过拟合", sub:"谷底最优"}
    },
    engine:{type:"curve", title:"偏差²、方差与总误差随模型复杂度的 U 形",
      x:{min:0,max:10,label:"模型复杂度"}, y:{label:"误差"}, ymin:0,
      series:[
        {label:"总误差 Bias²+Var", color:"var(--ch21)", fn:"totalErr", width:3},
        {label:"偏差² Bias²", color:"#7d93b5", fn:"biasSq", width:2},
        {label:"方差 Variance", color:"#f87171", fn:"varCurve", width:2}
      ],
      note:"粉色（方差）随复杂度上升、灰色（偏差²）随复杂度下降，金色总误差在谷底最小。谷底左侧是欠拟合（偏差主导），右侧是过拟合（方差主导）——正则化、交叉验证都是为了找到这个谷底。"},
    drawers:{
      mechanism:"简单模型「固执」（偏差大但稳定，方差小）；复杂模型「敏感」（偏差小但换个训练集结果大变，方差大）。Error=E(y−ŷ)² 展开成 Bias²+Variance+Noise 三项，前两项此消彼长，总误差呈 U 形。机器学习的核心技艺就是把复杂度调到谷底。",
      math:"Error=E[(y−ŷ)²]=Bias²+Variance+Noise。<br>Bias=E[ŷ]−f（拟合不足）。<br>Variance=E[(ŷ−E[ŷ])²]（对数据敏感）。<br>欠拟合：偏差大；过拟合：方差大；最优点在 U 形谷底。",
      code:"# 偏差-方差的经验观察\nlibrary(rpart)\ndepths <- 1:20; err <- c()\nfor(d in depths){\n  fit <- rpart(y~., data=train, control=rpart.control(maxdepth=d))\n  err[d] <- mean((test$y - predict(fit, test))^2)\n}\nplot(depths, err, type='b')   # U 形"},
    quiz:[
      {q:"欠拟合（模型过于简单）的典型表现是：", opts:["训练集上误差就很高", "训练集很好、测试集很差", "测试集比训练集表现更好", "训练与测试误差都为 0"], ans:0, why:"欠拟合是模型连训练数据的规律都没学到，训练集上误差就高（偏差大）。", lv:1},
      {q:"偏差（Bias）刻画的是：", opts:["不可约的随机噪声", "模型平均预测对真实规律的系统性偏离（拟合不足）", "模型对训练数据波动的敏感度", "样本量的大小"], ans:1, why:"Bias=E[ŷ]−f，衡量模型平均预测与真值的系统偏离，即拟合不足。", lv:1},
      {q:"方差（Variance）刻画的是：", opts:["标签本身的噪声", "特征数量的多少", "换一份训练集时模型预测的变动程度（对数据的敏感度）", "模型的系统性偏离"], ans:2, why:"Variance=E[(ŷ−E[ŷ])²]，衡量模型随训练集不同而波动，即对数据的敏感度。", lv:1},
      {q:"总误差随模型复杂度呈 U 形，谷底对应：", opts:["最优模型复杂度（偏差²与方差之和最小）", "偏差最大的位置", "方差最大的位置", "训练误差恰好为 0 处"], ans:0, why:"谷底处 Bias²+Variance 之和最小、泛化最好，正则化与交叉验证就是为了找到它。", lv:2},
      {q:"用一个很简单的模型（如线性模型）去拟合非线性数据，通常表现为：", opts:["偏差小、方差大", "偏差大、方差小（固执但稳定）", "偏差、方差都小", "偏差、方差都大"], ans:1, why:"简单模型「固执」：拟合不足（偏差大）但对数据波动不敏感（方差小）。", lv:2},
      {q:"过拟合（训练好、测试差）在误差分解 Error=Bias²+Variance+Noise 中主要由哪一项主导？", opts:["方差 Variance", "偏差² Bias²", "噪声 Noise", "三项都为零"], ans:0, why:"过拟合是模型过度贴合训练数据中的噪声、换数据就大变，由方差主导。", lv:2},
      {q:"「预测点很集中、但整体偏离靶心」对应偏差-方差的哪种情形？", opts:["低偏差、低方差", "低偏差、高方差", "高偏差、高方差", "高偏差、低方差"], ans:3, why:"集中 = 方差小（稳定），偏离靶心 = 偏差大（不准），即高偏差低方差（欠拟合）。", lv:3},
      {q:"持续增大模型复杂度，训练误差与测试误差的变化趋势是：", opts:["训练误差持续下降，测试误差先降后升（U 形）", "两者都持续下降", "两者都先降后升", "训练误差先降后升，测试误差持续下降"], ans:0, why:"复杂度↑训练误差单调下降（可过拟合到近 0）；测试误差因方差上升呈 U 形先降后升。", lv:3},
      {q:"误差分解 Error=Bias²+Variance+Noise 中，无论模型多复杂都无法消除的是：", opts:["偏差² Bias²", "噪声 Noise（不可约误差）", "方差 Variance", "三者都能被消除"], ans:1, why:"Noise 来自数据本身的随机性（ε），是误差下界，任何模型都无法消除；偏差²与方差可通过调复杂度权衡。", lv:3}
    ]
  },

  { id:"regularization", name:"正则化：Ridge 收缩 vs LASSO 归零", icon:"🪢", minutes:10,

    demo:"demos/penalised-glm.html",
    hook:"协变量一多，系数估计就开始「发飘」（方差大）。正则化的办法很直接：<b>在损失函数里加惩罚项，逼系数变小</b>。妙的是，LASSO 能把系数直接压到 0——顺手做了特征选择。",
    intuition:"Ridge（L2）惩罚 λΣβ²，把系数<b>收缩到接近 0 但永不为 0</b>（β=β₀/(1+λ)）；LASSO（L1）惩罚 λΣ|β|，把系数<b>收缩到恰好 0</b>（β=max(|β₀|−λ,0)），产生稀疏模型、自动特征选择。拖动 β₀，看两条收缩路径的分野——LASSO 在 λ=β₀ 处归零。",
    chain:{
      param:{val:"正则化强度 λ", sub:"惩罚力度"},
      math:{val:"Ridge β₀/(1+λ) · LASSO (β₀−λ)₊", sub:"收缩路径"},
      real:{val:"LASSO 归零→特征选择", sub:"Ridge 只收缩"}
    },
    engine:{type:"curve", title:"系数收缩路径：Ridge 永不归零，LASSO 在 λ=β₀ 归零",
      x:{min:0,max:5,label:"正则化参数 λ"}, y:{label:"系数 β(λ)"}, ymin:0,
      series:[
        {label:"LASSO（L1）：λ=β₀ 处归零", color:"var(--ch21)", fn:"lassoCoef", width:3},
        {label:"Ridge（L2）：渐近 0 不为 0", color:"#7d93b5", fn:"ridgeCoef", width:2}
      ],
      params:[{key:"beta0", label:"未惩罚系数 β₀", min:0.5, max:3, step:0.1, val:2}],
      live:(P)=>{ return {param:"β₀="+(+P.beta0).toFixed(1)+"|未惩罚系数", math:"LASSO 在 λ="+P.beta0.toFixed(1)+" 处归零|Ridge 渐近 0", real:(P.beta0>2?"系数大：需较强 λ 才压到 0":"系数小：易被 LASSO 剔除")+"|稀疏→特征选择"}; },
      note:"粉色（LASSO）线性下降、在 λ=β₀ 处干脆归零；灰色（Ridge）双曲线式衰减、永远贴近但不等于 0。这就是 LASSO 能做特征选择、Ridge 只能整体收缩的几何根源（菱形 vs 圆形约束）。"},
    drawers:{
      mechanism:"几何上看：L1 约束区域是菱形，损失等值线最容易碰到菱形的「角」，而角恰在坐标轴上（某些 β=0）→ 稀疏。L2 约束区域是圆，等值线碰到圆上任意点，β 只是整体缩小、不会恰好为 0。λ 控制惩罚力度：太小欠惩罚（过拟合），太大只留最强特征（欠拟合），用交叉验证选。",
      math:"Ridge：min Σ(y−Xβ)²+λΣβ² ⇒ β=β₀/(1+λ)（不为 0）。<br>LASSO：min Σ(y−Xβ)²+λΣ|β| ⇒ β=sign(β₀)(|β₀|−λ)₊（λ≥|β₀| 时为 0）。<br>λ 选择：s-折交叉验证。<br>AIC/BIC 也惩罚参数个数。",
      code:"# Ridge vs LASSO\nlibrary(glmnet)\nx <- model.matrix(y~., data=train)\nfit.lasso <- glmnet(x, y, alpha=1)   # L1\nfit.ridge <- glmnet(x, y, alpha=0)   # L2\ncoef(fit.lasso, s=0.1)   # 很多系数恰为 0（稀疏）\ncoef(fit.ridge, s=0.1)   # 系数都非 0"},
    quiz:[
      {q:"LASSO 回归使用的惩罚项是：", opts:["λΣ|β|（L1 范数）", "λΣβ²（L2 范数）", "λΣβ", "λ/Σβ²"], ans:0, why:"LASSO 用 L1 范数 λΣ|β|，正是绝对值惩罚使系数可以被压到恰好为 0。", lv:1},
      {q:"LASSO 相比 Ridge 独有的能力是：", opts:["完全不需要调 λ", "把某些系数收缩到恰好 0，实现特征选择（稀疏模型）", "计算速度永远更快", "使系数永不归零"], ans:1, why:"L1 惩罚产生稀疏解，部分系数恰为 0，等于自动做了特征选择。", lv:1},
      {q:"Ridge（L2）回归对系数的作用是：", opts:["把系数直接压到 0", "放大系数", "把系数收缩到接近 0 但永不为 0", "不改变系数"], ans:2, why:"Ridge β=β₀/(1+λ) 随 λ 增大渐近趋于 0 但永不等于 0，只收缩不归零。", lv:1},
      {q:"LASSO 能产生稀疏解的几何原因是：", opts:["L1 约束区域是菱形，损失等值线最易碰到落在坐标轴上的角点（某些 β=0）", "L2 约束区域是圆，圆上处处非零", "菱形内部全为 0", "圆形约束最容易碰到角点"], ans:0, why:"菱形角点在坐标轴上（某些 β=0），等值线最易在此相切 → 稀疏；圆形无角点故系数不归零。", lv:2},
      {q:"正则化参数 λ 取得太小，会导致：", opts:["系数全部被压到 0", "惩罚不足、接近无正则化，可能过拟合", "必然欠拟合", "模型自动删除所有特征"], ans:1, why:"λ 太小惩罚几乎不起作用，退化为普通最小二乘，方差大、易过拟合。", lv:2},
      {q:"实践中选择正则化参数 λ 的常用方法是：", opts:["恒令 λ=0", "恒令 λ→∞", "s-折交叉验证，取验证误差最小者", "随机猜一个即可"], ans:2, why:"用 s-折交叉验证比较不同 λ 的泛化误差，选验证误差最小的 λ。", lv:2},
      {q:"Ridge 下系数 β=β₀/(1+λ)。若 β₀=3、λ=2，则收缩后的系数为：", opts:["1", "3", "0", "1.5"], ans:0, why:"β=3/(1+2)=1；Ridge 把系数缩到原来的 1/(1+λ)，但永不为 0。", lv:3},
      {q:"LASSO 下系数 β=sign(β₀)(|β₀|−λ)₊。当 β₀=2 时，系数恰好归零的 λ 为：", opts:["λ=0", "λ=2", "λ=1", "λ=4"], ans:1, why:"(|β₀|−λ)₊ 在 λ≥|β₀|=2 时取 0，故 λ=2 处系数恰好归零。", lv:3},
      {q:"模型选择准则 AIC=ln(σ̂²)+2·(参数数/n)、BIC=ln(σ̂²)+ln(n)·(参数数/n)。当样本量 n 较大时：", opts:["AIC 对参数个数的惩罚更重", "二者惩罚完全相同", "二者都不惩罚参数个数", "BIC 对参数个数的惩罚更重，倾向选更简单的模型"], ans:3, why:"n 大时 ln(n)>2，BIC 的惩罚系数更大，更严厉地惩罚复杂度、倾向更稀疏的模型。", lv:3}
    ]
  },

  { id:"eval-metrics", name:"评估指标：Precision、Recall 与 AUC", icon:"🎯", minutes:9,
    demo:"demos/loss-function.html",
    hook:"反欺诈模型「一个坏人都不放过」，听起来很美——可如果它把<b>一半好客户也当成坏人</b>呢？准确率会骗人，你得看 Precision（查得准不准）和 Recall（查得全不全）。",
    intuition:"二分类评估靠混淆矩阵（TP/FP/TN/FN）。<b>准确率=(TP+TN)/总数</b>；<b>精确率 Precision=TP/(TP+FP)</b>（预测为正的有多准）；<b>召回率 Recall=TP/(TP+FN)</b>（真实正例捞出多少）；<b>F1</b> 是两者调和平均；<b>AUC</b> 是 ROC 曲线下面积（0.5=随机，1=完美）。",
    chain:{
      param:{val:"分类阈值", sub:"移动它改变 P/R"},
      math:{val:"Precision / Recall / F1 / AUC", sub:"混淆矩阵导出"},
      real:{val:"漏报 vs 误报的代价权衡", sub:"欺诈筛查、癌症检测"}
    },
    engine:{type:"match", title:"配对：评估指标与其含义",
      pairs:[
        {l:"准确率 Accuracy", r:"(TP+TN)/总数——整体预测对的比例"},
        {l:"精确率 Precision", r:"TP/(TP+FP)——预测为正的有多准"},
        {l:"召回率 Recall", r:"TP/(TP+FN)——真实正例捞出多少"},
        {l:"F1 分数", r:"精确率与召回率的调和平均"},
        {l:"AUC", r:"ROC 曲线下面积，0.5=随机、1=完美"}
      ]},
    drawers:{
      mechanism:"阈值调高：判正更谨慎，Precision 升、Recall 降；阈值调低则相反。PR 曲线和 ROC 曲线就是把阈值扫一遍画出的轨迹。类别不平衡时（欺诈只占 1%），准确率虚高，必须看 Precision/Recall/AUC。癌症筛查里假阴性（漏诊）代价高，要优先保 Recall。",
      math:"Accuracy=(TP+TN)/(TP+FP+TN+FN)。<br>Precision=TP/(TP+FP)。<br>Recall=TP/(TP+FN)=TPR。<br>F1=2PR/(P+R)。<br>FPR=FP/(FP+TN)；AUC=∫TPR dFPR。",
      code:"# 混淆矩阵与指标\nlibrary(caret)\ncm <- confusionMatrix(pred, truth)\ncm$byClass   # Sensitivity(Recall), Precision\n# ROC/AUC\nlibrary(pROC); auc(roc(truth, prob))"},
    quiz:[
      {q:"精确率 Precision 的计算公式是：", opts:["TP/(TP+FP)", "TP/(TP+FN)", "(TP+TN)/总数", "FP/(FP+TN)"], ans:0, why:"Precision=TP/(TP+FP)，衡量预测为正的样本里真正为正的比例（查得准不准）。", lv:1},
      {q:"召回率 Recall（=TPR，即敏感度）的计算公式是：", opts:["TP/(TP+FP)", "TP/(TP+FN)", "TN/(TN+FP)", "(TP+TN)/总数"], ans:1, why:"Recall=TP/(TP+FN)，衡量真实正例中被正确捞出的比例（查得全不全）。", lv:1},
      {q:"AUC=1 表示该分类器：", opts:["与随机猜测无异", "全部预测错误", "完美分类（ROC 曲线经过左上角）", "无法判断好坏"], ans:2, why:"AUC=1 是完美分类器；0.5 是随机（对角线）；越接近 1 越好。", lv:1},
      {q:"把分类阈值调高（判正更谨慎）后，Precision 和 Recall 通常会：", opts:["Precision 上升、Recall 下降", "Precision 下降、Recall 上升", "两者都上升", "两者都不变"], ans:0, why:"阈值调高判正更严格，误报 FP 减少（Precision↑）但漏报 FN 增多（Recall↓）。", lv:2},
      {q:"欺诈交易只占 1%，一个「把所有交易都判为正常」的模型准确率约 99%。这说明：", opts:["该模型非常优秀，应直接上线", "类别不平衡时准确率会虚高，必须看 Precision/Recall/AUC", "应只盯着准确率", "此时 AUC 也等于 0.99"], ans:1, why:"全判负类即可骗得高准确率，但 Recall=0、AUC≈0.5，不平衡场景下准确率会误导。", lv:2},
      {q:"F1 分数的定义是：", opts:["准确率 Accuracy", "TP+TN 之和", "精确率与召回率的调和平均 2PR/(P+R)", "精确率与召回率的算术平均"], ans:2, why:"F1=2PR/(P+R) 是 P、R 的调和平均，对二者中较小者更敏感，综合衡量又准又全。", lv:2},
      {q:"某模型混淆矩阵 TP=80、FP=20、FN=5，则 Precision 与 Recall 分别约为：", opts:["Precision=0.80、Recall≈0.94", "Precision≈0.94、Recall=0.80", "Precision=0.80、Recall=0.80", "Precision≈0.94、Recall≈0.94"], ans:0, why:"Precision=80/(80+20)=0.80；Recall=80/(80+5)=80/85≈0.94。", lv:3},
      {q:"ROC 曲线的横坐标与纵坐标分别是：", opts:["横 TPR、纵 FPR", "横 FPR=FP/(FP+TN)、纵 TPR=TP/(TP+FN)", "横 Precision、纵 Recall", "横 Recall、纵 Precision"], ans:1, why:"ROC 以 FPR 为横轴、TPR(=Recall) 为纵轴，点越靠近左上角越好；横 Precision 纵 Recall 的是 PR 曲线。", lv:3},
      {q:"传染病筛查相比普通癌症筛查，假阴性（FN）的额外危害主要是：", opts:["假阴性会误伤健康人", "假阴性比假阳性更便宜", "应优先提高 Precision 而非 Recall", "漏诊者可能在不知情中传染他人，故更要优先保证 Recall"], ans:3, why:"传染病假阴性不仅延误本人治疗，还会造成社区传播，代价更高，需优先保 Recall（少漏诊）。", lv:3}
    ]
  },

  { id:"trees-ensemble", name:"决策树与集成：Bagging 降方差、Boosting 降偏差", icon:"🌳", minutes:9,
    demo:"demos/trees-ensemble.html",
    hook:"一棵决策树容易「用力过猛」（过拟合）。解决办法是<b>种一片森林</b>：Bagging 让很多棵独立的树投票（降方差），Boosting 让后一棵树专补前一棵的错（降偏差）。随机森林和 GBDT 就是这两条路线的代表。",
    intuition:"决策树用贪心分裂（基尼指数/平方误差）递归切分，需剪枝防过拟合。<b>Bagging</b>（如袋装树、随机森林）：Bootstrap 抽样、并行训练多棵树再平均/投票，<b>降低方差</b>；随机森林再加特征随机。<b>Boosting</b>（如 GBDT、XGBoost）：串行训练浅树，每棵拟合上一轮的残差再累加，<b>降低偏差</b>。",
    chain:{
      param:{val:"集成策略", sub:"Bagging / Boosting"},
      math:{val:"平均降方差 · 累加降偏差", sub:"殊途同归"},
      real:{val:"随机森林 vs GBDT", sub:"竞赛常胜将军"}
    },
    engine:{type:"predict", title:"预测：随机森林与 GBDT 各自主要解决什么？",
      scenario:"随机森林属于 Bagging（平均许多棵较深的独立树）；GBDT 属于 Boosting（串行累加许多棵浅树）。这两种集成策略主要降低的误差成分是：",
      options:[
        {icon:"🎯", label:"Bagging 降方差，Boosting 降偏差", mini:"互补", correct:true},
        {icon:"➡️", label:"两者都降偏差", mini:"", correct:false},
        {icon:"📉", label:"两者都降方差", mini:"", correct:false},
        {icon:"📈", label:"两者都增大方差", mini:"", correct:false}
      ],
      reveal:"Bagging 平均多棵相对独立的深树——独立随机变量求平均，方差显著下降（深树本身偏差小、方差大）。Boosting 用浅树（弱学习器、偏差大）串行拟合残差并累加，逐步逼近真值——降低偏差。随机森林在 Bagging 上再加特征随机，进一步降低树间相关性，泛化更好。"},
    drawers:{
      mechanism:"Bagging 的关键词是「独立+平均」：每棵树 Bootstrap 抽样独立训练，预测取平均/投票，方差被平均掉。Boosting 的关键词是「纠错+累加」：后一棵树盯着前一棵的残差学，小树叠加慢慢逼近，偏差被补上来。随机森林=Bagging+特征随机；XGBoost=Boosting+正则化。",
      math:"Bagging：ŷ=avg(f<sub>b</sub>(x))，方差↓（树独立）。<br>随机森林：再加特征子集随机，降树间相关。<br>Boosting：ŷ=Σfₘ(x)，fₘ 拟合残差，偏差↓。<br>基尼指数 G=1−Σpₖ²；平方误差 Σ(y−ŷ)²。",
      code:"# 随机森林 vs GBDT\nlibrary(randomForest); rf <- randomForest(y~., data=train)\nlibrary(xgboost); xgb <- xgboost(data=x, label=y, nrounds=100)\n# rf 降方差（深树平均）；xgb 降偏差（浅树累加）"},
    quiz:[
      {q:"决策树分类分裂用的基尼指数 G=1−Σpₖ²，当节点最纯（所有样本同类）时 G 等于：", opts:["0", "0.5", "1", "2"], ans:0, why:"全同类时某 pₖ=1、其余为 0，G=1−1=0 最纯；二分类各半时 G=0.5 最不纯。", lv:1},
      {q:"Bagging（Bootstrap Aggregation）训练每棵树时采用的抽样方式是：", opts:["只用前一半数据", "有放回的 Bootstrap 自助抽样", "无放回抽样", "完全不抽样"], ans:1, why:"Bagging 对训练集做有放回自助抽样，得到多个子集并行训练多棵树。", lv:1},
      {q:"Boosting（如 GBDT）训练多棵树的方式是：", opts:["完全并行、彼此独立", "只训练一棵树", "串行迭代，后一棵树拟合前面的残差", "随机丢弃样本不训练"], ans:2, why:"Boosting 串行生成，每棵浅树拟合上一轮残差再累加，逐步逼近真值。", lv:1},
      {q:"随机森林相比普通袋装决策树（Bagged Trees）额外增加的是：", opts:["节点分裂时随机选取特征子集（特征随机），降低树间相关性", "改用串行训练", "改用更深的单树", "取消 Bootstrap 抽样"], ans:0, why:"随机森林=Bagging+特征随机（分类常用 √p 个候选特征），双重随机降低树间相关、泛化更好。", lv:2},
      {q:"Boosting 主要降低偏差的机制是：", opts:["用高偏差的浅树（弱学习器）串行拟合残差并累加，逐步逼近真值", "平均许多棵深树", "把单棵树深度增到最大", "随机抽样后取投票"], ans:0, why:"单棵浅树欠拟合（偏差大），叠加许多棵不断修正残差，把偏差一点点补上来。", lv:2},
      {q:"Bagging 与 Boosting 在预测合成（模型融合）方式上的区别是：", opts:["两者都取平均", "两者都累加残差", "Bagging 对各树取平均/多数票，Boosting 把各树输出累加求和", "Bagging 累加、Boosting 投票"], ans:2, why:"Bagging 并行独立树取平均（回归）或投票（分类）；Boosting 串行树输出累加求和。", lv:2},
      {q:"Bagging 能降低方差的数学原因是：", opts:["对多棵相对独立的树取平均，独立随机变量求平均使方差下降", "靠累加残差", "增大每棵树的深度", "提高树与树之间的相关性"], ans:0, why:"若各树近似独立，平均 m 棵树的方差约为单树的 1/m；深树偏差小方差大，平均正好压方差。", lv:3},
      {q:"关于单棵树深度与过拟合，下列说法正确的是：", opts:["随机森林用较深的树、靠集成降方差；GBDT 用浅树、但树太多反而易过拟合", "GBDT 用深树、随机森林用浅树", "两者都只用单棵深树", "Bagging 树越多越容易过拟合"], ans:0, why:"Bagging/RF 用深树（单树易过拟合，集成平均缓解）；Boosting 用浅树，但累加过多也会过拟合。", lv:3},
      {q:"某节点 10 个样本中 6 个属 A 类、4 个属 B 类，该节点的基尼指数为：", opts:["0.50", "0.24", "0.48", "0.60"], ans:2, why:"G=1−(0.6²+0.4²)=1−(0.36+0.16)=1−0.52=0.48。", lv:3}
    ]
  },

  { id:"kmeans-pca", name:"K-means 聚类与 PCA 降维", icon:"🧭", minutes:9,

    demo:"demos/kmeans-elbow.html",
    hook:"给客户分群（K-means）和给特征「瘦身」（PCA），是无监督学习的左膀右臂。一个回答<b>「数据天然分成几团」</b>，一个回答<b>「哪些方向信息最多」</b>。",
    intuition:"K-means：随机选 K 个质心→按欧氏距离把每点分到最近质心→重算质心（均值）→迭代至收敛；K 用<b>肘部法则</b>选，对初始质心和异常值敏感（K-medoids 更鲁棒）。PCA：中心化→协方差矩阵特征值分解→取最大特征值对应的正交方向投影，<b>最大化方差、主成分互不相关</b>。",
    chain:{
      param:{val:"簇数 K / 主成分数", sub:"人工指定"},
      math:{val:"距离分配+质心更新 / 特征值分解", sub:"迭代 or 分解"},
      real:{val:"客户分群、特征降维", sub:"先标准化！"}
    },
    engine:{type:"match", title:"配对：无监督算法与要点",
      pairs:[
        {l:"K-means 算法流程", r:"分配（最近质心）→更新（均值）→迭代至收敛"},
        {l:"K 的选择（肘部法则）", r:"画 K-簇内平方和曲线，拐点即合适 K"},
        {l:"PCA 主成分", r:"投影方差最大、各主成分正交不相关"},
        {l:"K-medoids", r:"质心必须是真实数据点，对噪声鲁棒"},
        {l:"聚类/距离计算前必须", r:"标准化，否则大量纲变量主导距离"}
      ]},
    drawers:{
      mechanism:"K-means 用「均值」当质心，所以会被极端值拉偏；K-medoids 强制质心是真实样本点，更稳。PCA 的本质是找一组正交基，让数据在上面的投影方差最大（保留最多信息）且互不相关（去冗余）——数学上就是协方差矩阵的特征向量。两者都依赖距离/方差，所以量纲敏感，必须先标准化。",
      math:"K-means：min Σ‖x−μ<sub>c(x)</sub>‖²，交替优化。<br>肘部法则：WSS(K) 拐点。<br>PCA：Cov 特征值分解，取前 k 个特征向量 P，Y=PX。<br>标准化：x′=(x−μ)/σ。",
      code:"# K-means 与 PCA\nset.seed(1)\nkm <- kmeans(scale(x), centers=3)\nplot(x, col=km$cluster)\npca <- prcomp(scale(x))\nsummary(pca)   # 各主成分方差贡献率"},
    quiz:[
      {q:"K-means 中每个簇的质心更新为该簇内所有点的：", opts:["均值", "中位数", "最大值", "随机某一个点"], ans:0, why:"K-means 用簇内均值作质心（故名 k-means）；正因用均值，才对异常值敏感。", lv:1},
      {q:"K-means 把每个数据点分配到：", opts:["距离最远的质心所在簇", "距离最近的质心所在簇（按欧氏距离）", "随机一个簇", "样本编号最小的簇"], ans:1, why:"分配步按欧氏距离把每点归到最近质心的簇，再更新质心，迭代至收敛。", lv:1},
      {q:"主成分分析（PCA）本质上是一种：", opts:["分类算法", "聚类算法", "降维技术，把高维数据线性变换为少数不相关主成分", "强化学习算法"], ans:2, why:"PCA 通过线性变换把高维数据投影到少数正交主成分上，属无监督降维。", lv:1},
      {q:"用肘部法则选择 K-means 的簇数 K 时，应选取：", opts:["簇内平方和 WSS 随 K 下降曲线出现明显拐点（肘部）处的 K", "WSS 最大的 K", "恒取 K=1", "取样本量 N"], ans:0, why:"画 K-WSS 曲线，拐点后继续增大 K 收益骤减，肘部对应合适的 K。", lv:2},
      {q:"K-medoids 相比 K-means 对噪声和异常值更鲁棒，原因是：", opts:["质心必须是某个真实数据点（取距离和最小者），不受极端均值拉扯", "质心用均值计算", "它不需要预先指定 K", "它用欧氏距离平方放大大偏差"], ans:0, why:"K-medoids 强制质心为真实样本点（选距离和最小者），避免均值被异常值拉偏。", lv:2},
      {q:"PCA 求主成分的核心数学步骤是：", opts:["对数据做 K-means 聚类", "计算基尼指数", "对（中心化后数据的）协方差矩阵做特征值分解，取最大特征值对应的特征向量", "做梯度下降"], ans:2, why:"PCA 即中心化→协方差矩阵→特征值分解→取前 k 个最大特征值的特征向量构成投影矩阵 P，Y=PX。", lv:2},
      {q:"关于欧氏距离（L2）与曼哈顿距离（L1），下列说法正确的是：", opts:["欧氏距离平方放大大偏差、对离群点更敏感；曼哈顿距离线性累加、对极端值更鲁棒", "曼哈顿距离平方放大大偏差", "两者对离群点同样敏感", "欧氏距离对极端值更鲁棒"], ans:0, why:"欧氏 dist=√Σ(x−k)² 平方放大大偏差；曼哈顿 dist=Σ|x−k| 线性累加更鲁棒（K-median 配曼哈顿）。", lv:3},
      {q:"PCA 要求「主成分间协方差为 0」，这在几何上意味着：", opts:["各主成分方向相互平行", "各主成分方向相互正交，避免信息冗余（线性不相关）", "各主成分方差都为 0", "主成分越多越好"], ans:1, why:"协方差为 0 即线性不相关，几何上各主成分正交；这样每个主成分承载不重复的信息，避免冗余。", lv:3},
      {q:"对数据做标准化 x′=(x−μ)/σ 时，关于测试集的正确做法是：", opts:["用测试集自己的均值和标准差", "不需要标准化测试集", "用全部数据合并后重新计算 μ、σ", "用训练集的均值 μ 和标准差 σ 去标准化测试集，不能重新计算"], ans:3, why:"测试集须沿用训练集的 μ、σ，否则会造成数据泄露、使评估失真——这是标准化易错的边界点。", lv:3}
    ]
  },

  { id:"glm-basics", name:"GLM 基础：方差是均值的函数 V(μ)", icon:"📊", minutes:10,

    demo:"demos/glm-basics.html",
    hook:"车险定价时，你用一条直线把每车年索赔次数 N 对驾龄回归，结果给安全司机预测出 −0.3 次索赔——<b>负的索赔次数</b>？不是数据错了，是工具错了：索赔次数天生<b>均值越大、波动越大</b>，线性回归的恒定方差假设从根上就不成立。",
    intuition:"广义线性模型（GLM, Generalized Linear Model）把线性回归向两个方向推广：响应变量可以服从<b>指数族（Exponential Family）</b>里的任何分布，方差不再是常数而是<b>均值的函数 V(μ)</b>（方差函数，Variance Function）：Poisson V(μ)=μ，Gamma V(μ)=μ²/α，NB V(μ)=μ+μ²/α。保险索赔次数恰好是「均值越大波动越大」的数据——这正是 GLM 成为费率厘定标准工具的原因。",
    chain:{
      param:{lab:"分布族 + 形状 α", val:"Poisson·Gamma·NB", sub:"方差结构旋钮"},
      math:{lab:"方差函数", val:"V(μ)=μ, μ²/α, μ+μ²/α", sub:"方差是均值的函数"},
      real:{lab:"现实现象", val:"均值大波动大：索赔次数", sub:"费率厘定要匹配离散"}
    },
    engine:{type:"curve", title:"方差函数 V(μ)：切换分布族、拖动 α，看方差曲线如何随均值上升",
      x:{min:0,max:10,label:"μ"}, y:{label:"方差 V(μ)"}, ymin:0,
      series:[{label:"方差函数 V(μ)", color:"var(--ch21)", fn:"glmVar", width:3}],
      params:[
        {key:"which", label:"分布族", type:"select", options:["normal","poisson","gamma","nb"], val:"poisson"},
        {key:"alpha", label:"形状参数 α（gamma / nb 有效）", min:0.5, max:5, step:0.5, val:2}
      ],
      live:(P)=>{ const a=+P.alpha;
        const V5={normal:1, poisson:5, gamma:25/a, nb:5+25/a}[P.which];
        const fm={normal:'V(μ)=1', poisson:'V(μ)=μ', gamma:'V(μ)=μ²/α', nb:'V(μ)=μ+μ²/α'}[P.which];
        const nm={normal:'Normal 正态', poisson:'Poisson', gamma:'Gamma', nb:'NB 负二项'}[P.which];
        const useA=(P.which==='gamma'||P.which==='nb');
        const real={normal:'波动与均值无关', poisson:'等离散：均值大波动大', gamma:'方差随均值平方增长', nb:'过度离散：方差>均值'}[P.which];
        const rsub={normal:'同方差（Homoscedastic）', poisson:'索赔次数建模基准', gamma:'大额赔款厚尾', nb:'被保险人异质性'}[P.which];
        return {param:(useA? nm+' α='+a.toFixed(1) : nm)+'|'+(useA?'分布族 + 形状参数':'分布族（无 α）'),
          math:fm+' · V(5)='+V5.toFixed(1)+'|μ=5 处的方差',
          real:real+'|'+rsub}; },
      note:"normal 是一条<b>水平线</b>（同方差：方差与均值无关）；poisson 沿对角线<b>线性上升</b>（V=μ）；gamma <b>二次上升</b>（μ²/α）；nb＝线性＋二次，α 越小曲线越陡。保险索赔次数正是「均值越大波动越大」——所以该用 GLM，而不是线性回归。"},
    drawers:{
      mechanism:"线性回归把方差钉死为常数 σ²，而索赔数据<b>方差随均值一起涨</b>。GLM 用方差函数 V(μ) 直接刻画这一点：Poisson 假设方差＝均值（等离散），Gamma 让方差按平方增长，NB 在 Poisson 之上再加一个二次的<b>过度离散（Overdispersion）</b>项。<b>先匹配 V(μ) 与数据的离散形态</b>，就抓住了 GLM 选型的牛鼻子。",
      math:"GLM：Y~指数族，E[Y]=μ，Var(Y)=φ·V(μ)<br>Normal：V(μ)=1（同方差，线性回归是特例）<br>Poisson：V(μ)=μ（等离散）<br>Gamma：V(μ)=μ²/α（α 为形状参数）<br>NB：V(μ)=μ+μ²/α（α→∞ 时退化为 Poisson）",
      code:"# R：三种方差结构，三种分布族\ndat <- read.csv('auto_claims.csv')      # N=每车年索赔次数\nfit.p  <- glm(N ~ age + region, family=poisson, data=dat)\nfit.nb <- MASS::glm.nb(N ~ age + region, data=dat)\nfit.g  <- glm(X ~ age + region, family=Gamma(link='log'), data=dat)  # X=赔款金额\n# 离散度检查：deviance/df 远大于 1 → 方差>均值，该用 NB 而非 Poisson\nc(dispersion = deviance(fit.p)/df.residual(fit.p))"
    },
    quiz:[
      {q:"经典线性回归（Linear Regression）假设的方差结构是？", opts:["同方差：Var(Y)=σ²，与均值无关", "方差与均值的平方成正比", "方差随均值增大而增大", "方差随均值增大而减小"], ans:0, why:"线性回归假设同方差性（Homoscedasticity）；GLM 把它放宽为方差是均值的函数 V(μ)。", lv:1},
      {q:"Poisson（泊松）分布的方差函数 V(μ) 是？", opts:["V(μ)=μ²", "V(μ)=μ", "V(μ)=μ+μ²/α", "V(μ)=1（常数）"], ans:1, why:"Poisson 均值等于方差：Var(N)=E[N]=μ，所以 V(μ)=μ，方差随均值线性上升。", lv:1},
      {q:"方差函数为 V(μ)=μ+μ²/α 的分布族是？", opts:["Normal（正态）", "Gamma（伽马）", "Poisson（泊松）", "NB（负二项）"], ans:3, why:"NB 在 Poisson 的线性项 μ 之上多了二次的过度离散项 μ²/α，专治方差大于均值的计数数据。", lv:1},
      {q:"Gamma 分布均值为 μ、形状参数为 α，其方差函数是？", opts:["V(μ)=μ", "V(μ)=μ+μ²/α", "V(μ)=μ²/α", "V(μ)=αμ"], ans:2, why:"Gamma 的 Var(Y)=μ²/α：方差随均值二次增长，α 越大方差越小、曲线越平缓。", lv:2},
      {q:"车险索赔次数数据呈现「均值越高、方差越大」。下列方差函数中最合理的是？", opts:["V(μ)=σ²（常数）", "V(μ)=μ（Poisson）", "V(μ) 随 μ 递减", "V(μ) 与 μ 无关"], ans:1, why:"计数数据的方差与均值绑定；Poisson 的 V(μ)=μ 恰好刻画「均值大、波动大」的等离散特征。", lv:2},
      {q:"NB 方差函数 V(μ)=μ+μ²/α 中，令形状参数 α→∞，NB 分布趋于？", opts:["Gamma 分布", "Normal 分布", "Poisson 分布", "Bernoulli 分布"], ans:2, why:"α→∞ 时过度离散项 μ²/α→0，V(μ)→μ，正是 Poisson 的方差函数——NB 是 Poisson 的过度离散推广。", lv:2},
      {q:"用线性回归直接建模车险索赔次数 N，最根本的问题是？", opts:["计算速度太慢", "违背同方差与正态假设：N 是非负整数且 V(N) 与 E[N] 绑定", "索赔次数不存在方差", "线性回归无法处理大样本"], ans:1, why:"计数是非负整数、右偏、方差随均值变化，线性回归的常数方差＋正态误差全部失守，甚至会预测出负的索赔次数。", lv:3},
      {q:"用 Gamma 建模赔款金额 X，取 α=0.5 与 α=4 相比，方差函数 V(μ)=μ²/α 的差异是？", opts:["两条方差曲线完全重合", "只改变均值，方差不变", "方差曲线是两条平行直线", "α 小的曲线更陡，异质性（离散）更强"], ans:3, why:"V(μ)=μ²/α 中 α 越小方差越大、二次上升越快；小 α 对应厚尾重异质性，大 α 接近轻尾。", lv:3},
      {q:"三个分布族的方差函数随 μ→∞ 的增长阶，正确的是？", opts:["Poisson 线性、Gamma 二次、NB 二次（μ²/α 主导）", "三者都是线性", "三者都是二次", "Poisson 二次、Gamma 线性、NB 常数"], ans:0, why:"Poisson V=μ（线性），Gamma V=μ²/α（二次），NB V=μ+μ²/α 在 μ 大时由二次项主导。", lv:3}
    ]
  },

  { id:"glm-link", name:"连接函数 g(μ)=Xβ：把均值映到实数轴", icon:"🔗", minutes:9,

    demo:"demos/glm-link.html",
    hook:"风控经理用线性回归建模出险概率，高风险司机预测值 1.35——<b>概率大于 1</b>？概率的家在 (0,1)：你需要一个连接函数，先把均值映到整条实数轴上建模，再保证预测值永远不出界。",
    intuition:"<b>连接函数（Link Function）</b> g(μ)=Xβ 是 GLM 的桥梁：把均值 μ 从自然范围（概率 (0,1)、计数 (0,∞)）映到整个实数轴，让线性预测子（Linear Predictor）自由建模；求解后再用<b>逆映射（Inverse Link）</b> μ=g⁻¹(η) 变回来，预测值永不越界。logit 是 S 形、log 单调上升、identity 是直线（即线性回归本身）——连接选错，预测就会出界。",
    chain:{
      param:{lab:"连接函数 g", val:"logit·probit·log·id", sub:"四种映射方式"},
      math:{lab:"线性预测子", val:"g(μ)=Xβ∈ℝ", sub:"均值映到实数轴"},
      real:{lab:"现实现象", val:"预测概率始终在 (0,1)", sub:"永不出界"}
    },
    engine:{type:"curve", title:"连接函数 g(μ)：切换连接，看均值如何被映到实数轴",
      x:{min:0.01,max:0.99,label:"μ"}, y:{label:"g(μ)"},
      series:[{label:"连接函数 g(μ)", color:"var(--ch21)", fn:"glmLink", width:3}],
      params:[
        {key:"which", label:"连接函数", type:"select", options:["logit","probit","log","identity"], val:"logit"}
      ],
      live:(P)=>{ const g05={logit:0, probit:0, log:-0.6931, identity:0.5}[P.which];
        const fm={logit:'g(μ)=ln(μ/(1−μ))', probit:'g(μ)=Φ⁻¹(μ)', log:'g(μ)=ln(μ)', identity:'g(μ)=μ'}[P.which];
        const shape={logit:'S 形 (0,1)→ℝ', probit:'S 形（正态分位）', log:'单调上升 (0,∞)→ℝ', identity:'直线（不映射）'}[P.which];
        const real={logit:'预测概率始终在 (0,1)', probit:'预测概率始终在 (0,1)', log:'预测计数恒为正', identity:'概率可能越出 [0,1]！'}[P.which];
        const rsub={logit:'优势比对数建模', probit:'正态潜变量视角', log:'索赔频率建模', identity:'出界风险'}[P.which];
        return {param:P.which+'|连接函数 · '+shape,
          math:fm+' · g(0.5)='+g05.toFixed(2)+'|μ=0.5 处的映射值',
          real:real+'|'+rsub}; },
      note:"logit / probit 是 <b>S 形</b>（概率专用，(0,1)→ℝ，两端渐近线把预测锁在 (0,1) 内）；log <b>单调上升</b>，把正数映到实数轴；identity 是<b>直线</b>——不做任何映射，就是线性回归本身，概率建模时会在边界出界。"},
    drawers:{
      mechanism:"线性预测子 Xβ 可以取遍 ℝ，但概率只能住在 (0,1)。连接函数 g 就是桥梁：<b>先把 μ 映到实数轴上自由建模，再用逆映射 g⁻¹ 把预测拉回自然范围</b>。连接选错（如用 identity 建模概率），预测就会越界；logit / probit 的 S 形两端渐近，天生为二值结果设计。",
      math:"g(μ)=η=Xβ，μ=g⁻¹(η)<br>logit：g(μ)=ln(μ/(1−μ))，g⁻¹(η)=e<sup>η</sup>/(1+e<sup>η</sup>)∈(0,1)<br>probit：g(μ)=Φ<sup>−1</sup>(μ)，g⁻¹(η)=Φ(η)<br>log：g(μ)=ln(μ)，g⁻¹(η)=e<sup>η</sup>>0<br>identity：g(μ)=μ（线性回归本身，无范围保证）",
      code:"# R：出险概率建模（二值响应 Y∈{0,1}）\nfit.logit  <- glm(claim ~ age + prior, family=binomial(link='logit'), data=dat)\nfit.probit <- glm(claim ~ age + prior, family=binomial(link='probit'), data=dat)\n# type='response' 做逆映射 g⁻¹，预测值恒在 (0,1)\np <- predict(fit.logit, type='response')\nrange(p)                # 0 < p < 1，永不出界\nexp(coef(fit.logit))    # 回归系数取指数 = 优势比 OR"
    },
    quiz:[
      {q:"GLM 中连接函数 g(·) 的作用是？", opts:["把均值 μ 映到整个实数轴，与线性预测子 Xβ 对接", "把方差映到均值上", "把协变量标准化", "求解回归系数 β"], ans:0, why:"g(μ)=Xβ 把 μ 从自然范围（如 (0,1)、(0,∞)）映到 ℝ，让线性预测子可以自由建模，再由 g⁻¹ 映回。", lv:1},
      {q:"logit 连接函数的表达式是？", opts:["g(μ)=ln(μ)", "g(μ)=μ", "g(μ)=ln(μ/(1−μ))", "g(μ)=Φ⁻¹(μ)"], ans:2, why:"logit 是优势（Odds）的对数：g(μ)=ln(μ/(1−μ))，把概率 (0,1) 一一映到整条实数轴。", lv:1},
      {q:"Poisson GLM 建模索赔次数时 μ∈(0,∞)，通常选用的连接函数是？", opts:["logit", "log", "probit", "identity"], ans:1, why:"log 连接把正数映到 ℝ：g(μ)=ln(μ)，逆映射 μ=e^η 保证预测的索赔次数恒为正。", lv:1},
      {q:"用线性回归（identity 连接）建模出险概率，最典型的问题是？", opts:["计算速度太慢", "残差不服从正态", "预测值可能越出 [0,1]，失去概率意义", "无法纳入多个协变量"], ans:2, why:"identity 连接 μ=η=Xβ 无界，协变量取极端值时预测会小于 0 或大于 1。", lv:2},
      {q:"μ=0.5 时，logit(μ) 与 probit(μ) 的取值分别是？", opts:["logit=0，probit=1", "logit=1，probit=0", "两者都等于 0.5", "两者都等于 0"], ans:3, why:"ln(0.5/0.5)=0，Φ⁻¹(0.5)=0：两条 S 形曲线都在中点 (0.5, 0) 处穿过。", lv:2},
      {q:"logit 连接下，线性预测子 η 每增加 1，事件的优势 Odds=μ/(1−μ) 会？", opts:["增加 1", "保持不变", "减半", "乘以 e≈2.72"], ans:3, why:"ln(Odds)=η ⇒ Odds=e^η；η 加 1 使 Odds 乘 e≈2.72，这正是「回归系数＝对数优势比」的解释。", lv:2},
      {q:"比较 logit 与 probit 连接，正确的说法是？", opts:["两者都是 S 形把 (0,1)→ℝ；probit 用正态分位 Φ⁻¹(μ)，与 logit 形状相近", "logit 只能用于计数数据", "probit 不可逆，无法还原 μ", "两者曲线完全重合"], ans:0, why:"两者都是 (0,1)→ℝ 的 S 形双射；probit=Φ⁻¹，在 0.5 附近更陡、尾部收得更快，实务结论通常与 logit 一致。", lv:3},
      {q:"GLM 中均值函数 μ=g⁻¹(η) 与连接函数 g 的关系是？", opts:["g⁻¹ 是 g 的导数", "g⁻¹ 是 g 的逆映射：由 η 反解出自然范围内的 μ", "g⁻¹ 是 g 的倒数", "g⁻¹ 与 g 无关"], ans:1, why:"g(μ)=η ⇔ μ=g⁻¹(η)；如 logit⁻¹(η)=e^η/(1+e^η) 保证 μ∈(0,1)，log⁻¹(η)=e^η 保证 μ>0。", lv:3},
      {q:"用三种连接建模出险概率：①logit ②probit ③identity。能保证预测值始终落在 (0,1) 的连接是？", opts:["仅 ③", "三者都可以", "① 与 ②", "仅 ①"], ans:2, why:"logit / probit 的逆映射把 ℝ 拉回 (0,1)；identity 的 μ=η 无界，协变量极端时预测出界。", lv:3}
    ]
  }
      ] },

  { id:22, no:"Ch22", name:"模拟方法", icon:"🎲", color:"var(--ch22)", weight:"Syllabus · 实务核心", status:"live",
    desc:"从伪随机数到逆变换、接受-拒绝，再到聚合赔款的蒙特卡洛模拟——精算实务的「实验科学」。学会用计算机实验回答解析法答不出的问题。",
    kps:[
  { id:"prng", name:"伪随机数生成（PRNG）", icon:"🎲", minutes:9,
    demo:"demos/prng.html",
    hook:"风险团队连夜跑了一万次巨灾模拟，第二天监管只问了一句：<b>你的「随机数」从哪来？</b>计算机不会抛硬币——一切随机性都必须被「算」出来。",
    intuition:"计算机只能用确定性递推「挤」出统计上像随机的序列——这就是<b>伪随机数（Pseudo-Random Number）</b>。最经典的是<b>线性同余生成器（LCG）</b>：X<sub>n+1</sub>=(aX<sub>n</sub>+c) mod m，再令 U<sub>n</sub>=X<sub>n</sub>/m 落到 [0,1)。<b>种子（Seed）</b>X₀ 决定整条序列；<b>周期（Period）</b>必须足够长；输出还要通过均匀性与独立性检验——可靠的 U(0,1) 是一切精算模拟的起点。",
    chain:{
      param:{lab:"种子", val:"X₀=12345", sub:"决定整条序列"},
      math:{lab:"递推式", val:"Xₙ₊₁=(aXₙ+c) mod m", sub:"LCG 线性同余"},
      real:{lab:"现象", val:"同种子→同「随机」结果", sub:"模拟可复现"}
    },
    engine:{type:"match", title:"配对：PRNG 核心概念",
      pairs:[
        {l:"种子（Seed）", r:"决定序列起点的初始值 X₀"},
        {l:"周期（Period）", r:"序列开始重复前的长度，越长越好"},
        {l:"LCG 递推式", r:"Xₙ₊₁=(aXₙ+c) mod m"},
        {l:"伪随机性", r:"确定性算法生成，统计上却「像」随机"},
        {l:"均匀性检验", r:"判断输出是否真的均匀落在 (0,1)"},
        {l:"U(0,1)", r:"一切模拟方法出发的原料"}
      ]},
    drawers:{
      mechanism:"LCG 把状态空间 {0,1,…,m−1} 用线性递推遍历一遍，Xₙ/m 落进 [0,1)。序列由 (a,c,m,X₀) 完全决定——<b>「随机」是假象，统计性质才是真的</b>：好的参数让输出通过均匀性、独立性等检验，坏参数（如平方取中法）很快露馅。",
      math:"X<sub>n+1</sub>=(aX<sub>n</sub>+c) mod m，U<sub>n</sub>=X<sub>n</sub>/m ∈ [0,1)<br>周期 ≤ m；经典参数 a=1664525、c=1013904223、m=2³²",
      code:"# R：伪随机数的可复现性\nset.seed(42); u1 <- runif(5)\nset.seed(42); u2 <- runif(5)\nidentical(u1, u2)      # TRUE：同种子，同序列\nks.test(u1, 'punif')   # 均匀性检验"
    },
    quiz:[
      {q:"计算机在精算模拟中产生的「随机数」本质上是：", opts:["确定性算法生成、统计上像随机的序列（伪随机数）", "来自物理噪声的真随机", "从网络上采集的随机源", "由硬件时钟直接给出"], ans:0, why:"计算机无法抛硬币，只能用确定性递推算法生成能通过统计检验的序列——即伪随机数（Pseudo-Random Number）。", lv:1},
      {q:"线性同余法 Xₙ₊₁=(aXₙ+c) mod m 中，种子 X₀ 的作用是：", opts:["只影响第一个数", "决定序列的均匀性", "决定序列的起点，此后整条序列被递推唯一确定", "决定周期的长短"], ans:2, why:"给定 X₀，递推式唯一确定后续每一项；同种子必得同序列——这正是模拟可复现性的来源。", lv:1},
      {q:"伪随机数生成器的周期（Period）是指：", opts:["生成随机数所需的时间", "序列开始重复前的长度", "随机数的取值范围", "参数 a、c、m 的个数"], ans:1, why:"LCG 状态空间有限（最多 m 个值），迟早出现重复并进入循环；周期越长，可供模拟消耗的随机数越多。", lv:1},
      {q:"同事用相同的种子完全复现了你的模拟结果，正确的理解是：", opts:["他抄袭了你的代码", "伪随机序列由种子完全决定——这是可复现性，不是巧合", "说明随机数是真的随机", "说明两次模拟相互独立"], ans:1, why:"伪随机序列是种子的确定性函数，同种子→同序列。可复现性是调试模型与实施方差缩减技术的基础。", lv:2},
      {q:"下列哪一项不属于评判伪随机数生成器质量的标准？", opts:["均匀性：输出接近 U(0,1)", "独立性：前后项之间无关联", "周期足够长", "由放射性衰变等物理噪声产生"], ans:3, why:"前三项是 PRNG 的核心质量标准；物理噪声属于真随机数生成器（TRNG），PRNG 只靠确定性算法。", lv:2},
      {q:"精算模拟总是先获得可靠的 U(0,1) 序列，原因是：", opts:["监管规定必须从均匀分布出发", "U(0,1) 的方差最小", "借助逆变换等方法，任何分布都能由 U(0,1) 构造出来", "均匀随机数最节省存储空间"], ans:2, why:"有了 U(0,1)，逆变换 X=F⁻¹(U)、接受-拒绝等方法就能把它变成任意目标分布——U(0,1) 是模拟的「原料」。", lv:2},
      {q:"某 LCG 周期为 10⁶，而模拟要消耗 10⁸ 个随机数，后果是：", opts:["序列被循环使用，产生伪相关，使估计过度自信", "没有影响", "周期会自动延长", "随机数会退化为常数"], ans:0, why:"随机数耗尽后同一段子序列反复出现，样本相关性使标准误被低估——应选周期远超消耗量的生成器（如 Mersenne Twister）。", lv:3},
      {q:"某 PRNG 通过了均匀性检验与独立性检验，最准确的说法是：", opts:["该序列是真随机序列", "检验证明了序列周期无限", "序列在所检验的层面「像」随机，但仍是确定性算法的产物", "序列不存在任何缺陷"], ans:2, why:"统计检验只能证伪不能证实：通过只说明在该显著性水平下未发现问题，序列依然由确定性算法生成。", lv:3},
      {q:"用模拟比较两套再保险方案时，让两套方案使用同一种子（共同随机数），目的是：", opts:["节省计算时间", "使两方案面对相同的「随机世界」，差异只反映方案本身的差别", "让结果看起来更美观", "缩短生成器的周期"], ans:1, why:"共同随机数（CRN）使配对样本正相关，差值的方差大幅下降，方案比较更锐利——这是经典的方差缩减技术。", lv:3}
    ]
  },

  { id:"inverse-transform", name:"逆变换法（Inverse Transform）", icon:"🔄", minutes:10,
    demo:"demos/inverse-transform.html",
    hook:"手里只有均匀随机数生成器，模型却要指数分布的索赔额、Pareto 的大额损失。<b>一个公式就能把均匀随机数变成任意分布</b>——逆变换法是模拟工具箱里的第一件法器。",
    intuition:"想从目标分布 F 抽样：先抽 U~U(0,1)，再令 <b>X=F⁻¹(U)</b>。原理只有一行：P(F⁻¹(U)≤x)=P(U≤F(x))=F(x)，所以 X 的分布函数恰好是 F。对指数分布 F(x)=1−e<sup>−λx</sup>，反函数 F⁻¹(u)=−ln(1−u)/λ。适用条件：F 连续严格单调、反函数可解析求出——求不出来就换接受-拒绝法。",
    chain:{
      param:{lab:"随机数 U", val:"U~U(0,1)", sub:"拖动看映射"},
      math:{lab:"映射", val:"X=F⁻¹(U)=−μ·ln(1−U)", sub:"每个 U 唯一对应一个 X"},
      real:{lab:"结果", val:"X 服从指数分布", sub:"均匀→目标分布"}
    },
    engine:{type:"curve", title:"逆变换抽样：拖动 U，看它在 CDF 上映射出的 X=F⁻¹(U)",
      x:{min:0,max:8,label:"x"}, y:{label:"F(x)"}, ymin:0, ymax:1,
      series:[{label:"指数 CDF F(x)=1−e<sup>−x/μ</sup>", color:"var(--ch22)", fn:"expCDF", width:3}],
      params:[
        {key:"mu", label:"指数均值 μ", min:0.5, max:5, step:0.5, val:2},
        {key:"U", label:"抽到的均匀随机数 U", min:0.01, max:0.99, step:0.01, val:0.5}
      ],
      readouts:[{label:"X=F⁻¹(U)", fn:"invExpCDF"}],
      live:(P)=>{ const x=-P.mu*Math.log(1-P.U); return {param:"U="+P.U.toFixed(2)+"|抽到的随机数", math:"X=F⁻¹(U)="+x.toFixed(2)+"|−μ·ln(1−U)", real:"每个 U 唯一对应一个 X|均匀→指数"}; },
      note:"拖动 U，看它在 CDF 上对应的 X——这就是逆变换抽样：U 是「高度」，水平撞到曲线再落下去，就是抽到的 X。再拖 μ：曲线变形，同一个 U 映射到不同的 X。"},
    drawers:{
      mechanism:"几何图像：U 是一个「高度」，过该高度作水平线交 CDF 曲线，垂足就是 X=F⁻¹(U)。<b>CDF 陡峭的区域（密度大）更容易被命中</b>，抽出的 X 恰好复刻目标分布。概率积分变换 U=F(X)~U(0,1) 是它的逆定理，二者互为镜像。",
      math:"P(F⁻¹(U)≤x)=P(U≤F(x))=F(x) ⇒ X~F<br>指数：F(x)=1−e<sup>−λx</sup> ⇒ F⁻¹(u)=−ln(1−u)/λ<br>Pareto：F(x)=1−(xₘ/x)<sup>α</sup> ⇒ F⁻¹(u)=xₘ(1−u)<sup>−1/α</sup>",
      code:"# R：逆变换法抽样\nu <- runif(10000)\nx <- -log(1-u)/1.5          # Exp，速率 1.5\n# 等价于内置分位函数：x <- qexp(u, rate=1.5)\nks.test(x, 'pexp', rate=1.5)  # p 值大 ⇒ 抽样正确"
    },
    quiz:[
      {q:"用逆变换法生成服从分布 F 的样本 X，两步操作是：", opts:["先抽 U~U(0,1)，再令 X=F⁻¹(U)", "先抽 U~U(0,1)，再令 X=F(U)", "直接从 F 中抽取 X", "先抽 U，再令 X=1−U"], ans:0, why:"先抽均匀随机数，再用 CDF 的反函数把它「推回」取值空间——由概率反推数值，与 CDF 的方向正好相反。", lv:1},
      {q:"设 U~U(0,1)，F 为连续严格增的分布函数，则 X=F⁻¹(U) 服从：", opts:["均匀分布 U(0,1)", "标准正态分布", "分布函数恰好为 F 的分布", "参数为 1 的指数分布"], ans:2, why:"P(X≤x)=P(F⁻¹(U)≤x)=P(U≤F(x))=F(x)——X 的 CDF 恰为 F，这就是逆变换法的基本定理。", lv:1},
      {q:"指数分布 F(x)=1−e<sup>−λx</sup>（x≥0）的逆函数 F⁻¹(u) 为：", opts:["e<sup>−u</sup>/λ", "ln(u)/λ", "λ(1−u)", "−ln(1−u)/λ"], ans:3, why:"由 u=1−e^(−λx) 解出 x：e^(−λx)=1−u，取对数得 x=−ln(1−u)/λ。因 1−U 仍是 U(0,1)，实务常简写为 −ln(U)/λ。", lv:1},
      {q:"证明 P(F⁻¹(U)≤x)=P(U≤F(x)) 的关键一步依赖：", opts:["F 有界", "F 单调递增，故 F⁻¹(U)≤x 与 U≤F(x) 是同一事件", "U 的方差有限", "x 必须大于 0"], ans:1, why:"单调性保证两个事件等价；再由 U~U(0,1) 得 P(U≤F(x))=F(x)，于是 X 的 CDF 恰为 F。", lv:2},
      {q:"实务中常用 −ln(U)/λ 代替 −ln(1−U)/λ 生成指数样本，理由是：", opts:["两个公式计算结果逐点相同", "1−U 与 U 同服从 U(0,1)，两者分布等价", "U 比 1−U 更容易生成", "1−U 会导致数值溢出"], ans:1, why:"均匀分布的对称性使 1−U~U(0,1)，两种写法的分布完全相同，选哪个只取决于方便。", lv:2},
      {q:"下列哪种情形让逆变换法难以直接使用？", opts:["F 是指数分布", "F 是均匀分布", "F⁻¹ 没有解析表达式（如 Gamma 的 CDF）", "F 连续且严格单调"], ans:2, why:"逆变换法要求把 F⁻¹ 显式解出来；CDF 反函数求不出解析式（Gamma、正态等）时，需改用接受-拒绝等方法。", lv:2},
      {q:"Pareto 分布 F(x)=1−(xₘ/x)<sup>α</sup>（x≥xₘ）的逆变换抽样公式为：", opts:["xₘ(1−u)<sup>−1/α</sup>", "xₘ·u<sup>1/α</sup>", "xₘ/(1−u)<sup>α</sup>", "xₘ·e<sup>u</sup>"], ans:0, why:"由 u=1−(xₘ/x)^α 解出 x：(xₘ/x)^α=1−u，故 x=xₘ(1−u)^(−1/α)，这是模拟厚尾大额索赔的标准公式。", lv:3},
      {q:"离散分布用广义逆 F⁻¹(u)=min{x: F(x)≥u}。设 P(X=0)=0.3、P(X=1)=0.5、P(X=2)=0.2，当 u=0.6 时抽得：", opts:["0", "2", "1", "0.6"], ans:2, why:"F(0)=0.3<0.6，F(1)=0.8≥0.6，故取 X=1。广义逆把每段 u 区间映射到对应的跳跃点上。", lv:3},
      {q:"逆变换是单调映射：U₁<U₂ ⟹ X₁≤X₂。下列哪一应用直接依赖这一保序性质？", opts:["把模拟出的 S 排序后直接读取样本分位数作为 VaRₚ", "使模拟误差降为零", "使伪随机数变成真随机数", "延长生成器的周期"], ans:0, why:"保序性使 U 的 p 分位恰好映射到 X 的 p 分位，所以把模拟结果排序取 99.5% 位置就是 VaR₀.₉₉₅——分位数估计全靠它。", lv:3}
    ]
  },

  { id:"acceptance-rejection", name:"接受-拒绝法（Acceptance-Rejection）", icon:"🎯", minutes:9,
    demo:"demos/acceptance-rejection.html",
    hook:"想从 Gamma(α=3) 抽样，可它的分布函数根本解不出反函数？<b>用一个容易抽样的「包络」罩住目标密度，再用一个均匀随机数决定去留</b>——接受-拒绝法用「浪费」换「通用」。",
    intuition:"当 F⁻¹ 求不出来时，找一个容易抽样的<b>提议分布（Proposal Distribution）</b>g(x)，乘上常数 M 使<b>包络（Envelope）</b>Mg(x)≥f(x) 整个罩住目标密度。抽 Y~g 与 U~U(0,1)：若 <b>U≤f(Y)/[M·g(Y)]</b> 则接受 Y，否则拒绝重来。<b>接受率（Acceptance Rate）=1/M</b>——M 越小（包络越贴合 f）效率越高。演示里正是用指数包络抽 Gamma。",
    chain:{
      param:{lab:"包络", val:"Mg(x)≥f(x)", sub:"M 越小越贴合"},
      math:{lab:"接受条件", val:"U≤f(Y)/[M·g(Y)]", sub:"接受率=1/M"},
      real:{lab:"代价", val:"M=4→平均抽 4 次中 1 个", sub:"效率换通用性"}
    },
    engine:{type:"predict", title:"预测下注：包络常数 M 翻倍，接受率会怎样？",
      scenario:"用指数包络抽取 Gamma 形状的目标密度，当前包络常数 M=2（接受率 50%）。若提议分布没选好，<b>M 升到了 4</b>——接受率与接受样本的分布会怎样变化？先下注，再看演示验证。",
      options:[
        {icon:"➡️", label:"接受率不变", mini:"M 只是常数", correct:false},
        {icon:"📉", label:"接受率降到 25%，分布不变", mini:"1/M", correct:true},
        {icon:"🧨", label:"接受率降到 25%，分布也被扭曲", mini:"包络破坏 f", correct:false},
        {icon:"📈", label:"接受率升到 50%", mini:"罩子变大", correct:false}
      ],
      reveal:"接受概率 P(U≤f/(Mg))=1/M：M 从 2 升到 4，接受率由 50% 降到 25%，平均要抽 4 次才中 1 个。但每点的接受概率与 f(Y) 成正比，接受样本的形状依然是目标密度——<b>M 只影响效率，从不影响正确性</b>。所以要选「贴合」f 的提议分布。"
    },
    drawers:{
      mechanism:"把点均匀地撒在包络 Mg 下方：<b>落在 f 曲线下方的点被留下，其余拒绝</b>。留下点的密度正比于 f——提议分布 g 的形状被接受概率恰好抵消。这就是为什么「浪费」只增加抽样次数，绝不污染样本；演示用指数分布作提议抽取 Gamma(α≥1)。",
      math:"接受条件：U ≤ f(Y)/[M·g(Y)]，要求 Mg(x)≥f(x) 处处成立<br>接受率：P(接受)=∫[f/(Mg)]·g dx = 1/M<br>接受样本的条件密度：[f(x)/(Mg(x))]·g(x) ÷ (1/M) = f(x)",
      code:"# R：用指数包络抽 Gamma(3,1)\nM <- 1.83; x <- numeric(0)\nwhile(length(x) < 1000){\n  y <- rexp(1); u <- runif(1)\n  if(u <= dgamma(y,3)/(M*dexp(y))) x <- c(x,y)\n}\nmean(x)   # ≈ 3"
    },
    quiz:[
      {q:"接受-拒绝法的核心思想是：", opts:["用易抽样的提议分布 g 构造包络 Mg(x)≥f(x)，再用均匀随机数决定接受或拒绝", "直接对目标分布的 CDF 求反函数", "用正态分布近似任意目标密度", "只在目标密度的众数处抽样"], ans:0, why:"找一个罩得住 f 的包络 Mg，在包络下均匀撒点，落在 f 曲线下方的点被保留——保留点的形状恰好是 f。", lv:1},
      {q:"接受-拒绝法每一轮迭代需要抽取：", opts:["仅一个均匀随机数 U", "候选样本 Y~g 与均匀随机数 U~U(0,1)", "两个标准正态随机数", "一个服从目标分布 f 的随机数"], ans:1, why:"先从提议分布 g 抽候选 Y，再抽 U 做裁判：U≤f(Y)/[M·g(Y)] 则接受，否则拒绝重来。", lv:1},
      {q:"设包络常数为 M，接受-拒绝法的平均接受率为：", opts:["M", "M²", "1/M", "1−1/M"], ans:2, why:"P(接受)=E[f(Y)/(Mg(Y))]=∫[f/(Mg)]·g dx=1/M。M 越小说明包络越贴合 f，效率越高。", lv:1},
      {q:"常数 M 必须满足的条件是：", opts:["Mg(x)≥f(x) 对一切 x 成立", "Mg(x)=f(x) 对一切 x 成立", "M 必须大于 100", "M 等于 f 的均值"], ans:0, why:"包络必须处处罩住目标密度；若某处 Mg<f，该区域的样本会被系统性漏掉，分布立刻失真。", lv:2},
      {q:"若提议分布没选好，M 从 2 升到 4，则接受样本：", opts:["接受率不变", "分布变成提议分布 g", "接受率减半，目标分布不变", "接受率翻倍"], ans:2, why:"接受率 1/M 从 1/2 降到 1/4；但接受概率与 f 成正比，接受样本的形状仍是 f——M 只影响效率，不影响正确性。", lv:2},
      {q:"下列哪种情形最适合选用接受-拒绝法？", opts:["目标分布的 F⁻¹ 容易求出", "目标密度 f 可计算但 F⁻¹ 无解析解", "目标分布是均匀分布", "只需要一个样本"], ans:1, why:"逆变换法失效（F⁻¹ 求不出）时，接受-拒绝法只需能算密度值——Gamma、Beta 及许多自定义密度都靠它模拟。", lv:2},
      {q:"接受样本的密度恰好是 f 而非 g，根本原因是：", opts:["接受概率 f(Y)/[M·g(Y)] 恰好抵消了 g 的形状，只留下 f 的形状", "因为 g 一定是对称分布", "因为 M 足够大", "由大数定律保证"], ans:0, why:"P(Y∈dx|接受) ∝ P(接受|Y=x)·g(x)dx=[f(x)/(Mg(x))]·g(x)dx=f(x)/M·dx——g 被完全抵消，归一化后恰为 f。", lv:3},
      {q:"用指数包络抽 Gamma(α,β)。当 α=1 时 Gamma 退化为指数分布本身，此时：", opts:["M=∞，无法抽样", "接受率趋近于 0", "包络不再成立", "M=1，接受率 100%"], ans:3, why:"α=1 时 f 与 g 完全重合，可取 M=1，每个样本都被接受——包络「严丝合缝」时效率最高；α 偏离 1 越远，M 越大、效率越低。", lv:3},
      {q:"设 M=2.5，需要 10000 个被接受的样本，则期望需要从 g 中抽取约：", opts:["4000 次", "10000 次", "25000 次", "2500 次"], ans:2, why:"接受率 1/M=0.4，期望抽取次数=需求数×M=10000×2.5=25000——这正是「通用性」要付的计算代价。", lv:3}
    ]
  },

  { id:"sim-application", name:"聚合赔款蒙特卡洛模拟（Monte Carlo）", icon:"🏦", minutes:13,
    demo:"demos/sim-application.html",
    hook:"董事会问：「明年我们可能面临的最大损失，99.5% 的把握不超过多少？」频度乘强度、层层卷积，解析公式很快失效。<b>模拟几万个「可能的世界」，把结果排成一列</b>，资本答案自己浮现。",
    intuition:"把索赔次数 N~Poisson(λ) 与单次赔额 Xᵢ 组合起来，<b>蒙特卡洛（Monte Carlo）</b>反复模拟聚合赔款 S=ΣXᵢ：每次先抽 N，再抽 N 个赔额求和。几万个 S 排成直方图就是它的分布，由此估计 <b>VaR/分位数</b>与<b>破产概率（Ruin Probability）</b>——这是精算定价、资本与准备金的核心工具。由<b>大数定律（LLN）</b>保证：模拟次数越多，估计越稳。",
    chain:{
      param:{lab:"两个旋钮", val:"λ 与 E[X]", sub:"频度 × 强度"},
      math:{lab:"聚合赔款", val:"E[S]=λ·E[X]", sub:"模拟均值≈理论均值"},
      real:{lab:"资本线", val:"VaR₀.₉₉₅(S)", sub:"该留多少资本"}
    },
    engine:{type:"compound", title:"聚合赔款蒙特卡洛：拖动 λ 与 E[X]，看 S 的分布与 VaR",
      freq:"poisson", sev:"exp",
      params:[
        {key:"lambda", label:"索赔次数 λ", min:1, max:10, step:1, val:4},
        {key:"mean", label:"平均索赔额 E[X]", min:1, max:5, step:0.5, val:2}
      ],
      n:2000, bins:40,
      live:(P,st)=>({param:"λ="+P.lambda.toFixed(0)+" · E[X]="+P.mean.toFixed(1)+"|频度×强度", math:"E[S]="+st.thE.toFixed(1)+"|λ·E[X]", real:"VaR₀.₉₉₅≈"+st.vaq.toFixed(1)+"|资本线"}),
      note:"拖动 λ 或 E[X]：S 的整个分布右移变厚，VaR 涨得比均值快——尾巴才是资本关心的地方。无论怎么拖，模拟均值总围着理论值 E[S]=λ·E[X] 打转，这就是大数定律。"
    },
    drawers:{
      mechanism:"频度-强度框架把 S 拆成两层：「多少次」（N）×「每次多少」（Xᵢ）。S 的分布通常没有闭式（复合分布的卷积），于是<b>逐个世界地模拟、用直方图逼近分布</b>——尾部的那几个百分点，正是精算师的语言：资本、偿付能力、准备金。",
      math:"E[S]=E[N]·E[X]=λE[X]<br>Var(S)=E[N]Var(X)+Var(N)E[X]²=λE[X²]（Poisson 情形）<br>VaR_p(S)=F<sub>S</sub>⁻¹(p)，用样本分位数估计",
      code:"# R：聚合赔款蒙特卡洛\nlambda <- 4; mu <- 2; n <- 100000\nS <- replicate(n, sum(rexp(rpois(1, lambda), rate=1/mu)))\nmean(S)              # ≈ λ·mu = 8\nquantile(S, 0.995)   # VaR₀.₉₉₅ → 资本线\nmean(S > 30)         # 超过资本的破产概率估计"
    },
    quiz:[
      {q:"聚合赔款模型 S=Σᵢ₌₁ᴺ Xᵢ 中，N 与 Xᵢ 分别代表：", opts:["索赔频度与单次索赔强度", "保费与准备金", "均值与方差", "利率与期限"], ans:0, why:"N 是一段时间内的索赔次数（频度），Xᵢ 是第 i 次的赔款金额（强度），加总即聚合赔款 S。", lv:1},
      {q:"用蒙特卡洛模拟一次聚合赔款 S 的正确步骤是：", opts:["解一个微分方程", "直接抽取一个正态随机数", "查表得到 S 的精确分布", "先抽 N~Poisson(λ)，再抽 N 个赔额 Xᵢ 并求和"], ans:3, why:"先定「发生几次」，再定「每次多少」，求和得到一个 S；重复上万次，就得到 S 的整个分布。", lv:1},
      {q:"模拟次数越多，VaR 的估计越稳定，这依赖：", opts:["中心极限定理使分布变正态", "大数定律：样本均值随试验次数收敛到真值", "贝叶斯公式", "切比雪夫不等式的上界"], ans:1, why:"大数定律保证频率收敛于概率、均值收敛于期望；中心极限定理则进一步给出 O(1/√n) 的误差速度。", lv:1},
      {q:"聚合赔款的理论均值 E[S] 等于：", opts:["E[N]+E[X]", "E[N]·E[X]", "Var(N)·Var(X)", "E[N²]·E[X]"], ans:1, why:"由全期望公式（塔性质）：E[S]=E[E[S|N]]=E[N·E[X]]=E[N]·E[X]，复合 Poisson 下即 λE[X]。", lv:2},
      {q:"复合 Poisson 模型（N~Poisson(λ)，Xᵢ 独立同分布）下，Var(S) 等于：", opts:["λ(E[X])²", "E[X²]/λ", "λE[X²]", "λ²E[X]"], ans:2, why:"一般公式 Var(S)=E[N]Var(X)+Var(N)(E[X])²；Poisson 的 E[N]=Var(N)=λ，合并即 λ(Var(X)+E[X]²)=λE[X²]。", lv:2},
      {q:"VaR₀.₉₉₅(S) 的含义是：", opts:["S 的最大可能取值", "S 分布的 99.5% 分位数：P(S≤VaR)=0.995", "S 的期望值", "S 超过均值的概率"], ans:1, why:"VaR 是分位数：损失超过它的概率只有 0.5%。监管把它当作资本线——资本必须能扛住到这一档的损失。", lv:2},
      {q:"设 λ=4、X~Exp 且 E[X]=2，则 E[S] 与 Var(S) 分别为：", opts:["8 与 32", "8 与 16", "4 与 8", "16 与 32"], ans:0, why:"E[S]=λE[X]=4×2=8；指数分布 E[X²]=2μ²=8，故 Var(S)=λE[X²]=4×8=32。", lv:3},
      {q:"蒙特卡洛估计的误差大致按 1/√n 衰减。想把标准误差缩小一半，模拟次数应：", opts:["增加 1 倍", "减少一半", "增加为 4 倍", "增加为 10 倍"], ans:2, why:"误差 O(1/√n)：误差减半需要 n 变为 4 倍——模拟精度的代价按平方增长，所以方差缩减技术很重要。", lv:3},
      {q:"用模拟而非正态近似来估计破产概率 P(S>资本)，关键优势是：", opts:["模拟能如实反映 S 右偏、厚尾的形状，正态近似会严重低估尾部风险", "模拟计算总是更快", "正态分布无法计算均值", "模拟能给出精确解析解"], ans:0, why:"聚合赔款通常右偏且右尾厚重，对称的正态分布会系统性低估极端损失；模拟保留分布的真实形状，而尾部正是资本与破产的所在。", lv:3}
    ]
  }
    ] }

  ]
};

/* 供 arena 限时挑战抽取的全局题库（自动从各 kp.quiz 汇总，见 game.js） */

/* ============================================================
   讲解资源映射 COURSE.lectures
   kp.id -> { video, vTitle, img, iCap, text }
   视频来自 Min 讲稿，概念图为精选教学图解（均已本地化）
   ============================================================ */
COURSE.lectures = {

  /* ---- Ch13 时间序列 I ---- */
  "stationarity": { video:"video/ch13-t-stationarity.mp4", vTitle:"解构时间序列的平稳性 · 专题讲解",
    img:"img/ch13-stationarity.png", iCap:"强平稳 vs 弱平稳",
    text:"平稳性是时间序列建模的前提。视频先讲为什么「稳定」的序列才可分析，再区分<b>强平稳</b>（任意有限维分布不随时间平移改变）与<b>弱平稳</b>（只需一、二阶矩平稳）。配合概念图，抓住均值恒定、方差恒定、自协方差只依赖滞后 k 这三个要点。" },
  "ar1": { video:"video/ch13-t-ar.mp4", vTitle:"自回归模型 AR(p) 的数学奥秘 · 专题讲解",
    img:"img/ch13-ar.png", iCap:"AR(p) 模型的结构与性质",
    text:"AR(1) 是最基础的自回归模型：当前值只依赖上一期值加噪声。视频里 Min 推导了平稳条件 |φ|&lt;1 与自相关结构。看完后到实验台拖动 φ，亲眼验证 ACF 的<b>指数拖尾</b>——这正是 AR 过程的指纹。" },
  "ma1": { video:"video/ch13-t-ma.mp4", vTitle:"深入理解移动平均模型 · 专题讲解",
    img:"img/ch13-ma.png", iCap:"MA(q) 模型的结构与性质",
    text:"MA(1) 把当前值写成当期与过去噪声的线性组合，它<b>永远平稳</b>（对 θ 无限制）。关键特征是 ACF 在一阶后截尾。先看视频理解为什么 MA 的自相关会「截断」，再到实验台拖 θ，观察只有 ρ₁ 非零。" },
  "arma": { video:"video/ch13-t-arma.mp4", vTitle:"解构 ARMA 与 ARIMA 模型 · 专题讲解",
    img:"img/ch13-arma.png", iCap:"AR 与 MA 的组合：ARMA / ARIMA",
    text:"ARMA 把自回归与移动平均结合起来：ACF 与 PACF 都拖尾。视频讲解如何组合 AR 与 MA、为什么二阶 AR 项能产生更丰富的自相关形态（如衰减振荡）。这为后面的模型识别（拖尾 vs 截尾）做好铺垫。" },
  "backshift": { video:"video/ch13-t-operators.mp4", vTitle:"时间的数学刻度 · 专题讲解",
    img:"img/ch13-backshift.png", iCap:"后移算子 B 与差分算子 ∇",
    text:"后移算子 B（BXₜ=Xₜ₋₁）与差分算子 ∇（=1−B）是时间序列的代数速记语言。用它们可以把 ARMA 模型写成多项式方程，平稳性判断也变成「特征方程的根在单位圆外」。掌握这套语言，后面的公式就都读得懂了。" },
  "acf-pacf-identify": { video:"video/ch13-t-identify.mp4", vTitle:"ARIMA 模型识别指南 · 专题讲解",
    img:"img/ch13-acf.png", iCap:"ACF / PACF 的定义与模型识别表",
    text:"ACF 度量 Xₜ 与 Xₜ₋ₖ 的相关性；PACF 剔除中间滞后的影响，度量「直接相关」。识别口诀是核心考点：<b>AR → ACF 拖尾、PACF 截尾；MA → ACF 截尾、PACF 拖尾；ARMA → 两者都拖尾</b>。概念图底部的识别表值得记住。" },

  /* ---- Ch14 时间序列 II ---- */
  "arima-differencing": { video:"video/ch14-t-arima.mp4", vTitle:"ARIMA 模型基础与挑战 · 专题讲解",
    img:"img/ch13-arma.png", iCap:"从 ARMA 到 ARIMA：差分的作用",
    text:"非平稳序列（带趋势）要先差分变平稳再建模。ARIMA(p,d,q) 就是「差分 d 次后拟合 ARMA」。视频里 Min 演示了用差分算子 ∇ 驯服随机游走的过程，理解为什么大多数趋势序列 d=1 就够了。" },
  "box-jenkins": { video:"video/ch14-t-boxjenkins.mp4", vTitle:"Box-Jenkins 建模全解 · 专题讲解",
    img:"img/ch14-boxjenkins.png", iCap:"Box-Jenkins 方法流程",
    text:"Box-Jenkins 是时间序列建模的标准工作流：<b>识别</b>（看 ACF/PACF 定 p、q）→ <b>估计</b>（拟合参数）→ <b>诊断</b>（检验残差是否白噪声）→ 不通过则迭代。这个「识别-估计-诊断」循环是整章的方法论主线。" },
  "forecast": { video:"video/ch14-forecast.mp4", vTitle:"AR(1) 的衰减记忆 · 专题讲解",
    img:"img/ch14-ar1-memory-forecast.png", iCap:"AR(1) 的衰减记忆：冲击、ACF 与预测回归均值",
    text:"AR(1) 的最优预测是 φʰ·Xₜ——记忆随预测步长 h <b>指数衰减</b>。视频讲清楚条件期望如何产生预测、为什么平稳序列的预测收敛到均值、而随机游走的预测是「水平延伸」。到实验台拖 φ，感受衰减的快慢。" },
  "diagnostics": { video:"video/ch14-diagnostics.mp4", vTitle:"残差是不是白噪声？· 专题讲解",
    img:"img/ch14-residual-diagnostics.png", iCap:"残差诊断：白噪声、ACF 与 Ljung-Box 检验",
    text:"模型拟合好后必须检验残差是否为白噪声（信息有没有被榨干）。Ljung-Box 检验是最常用的工具：原假设是「残差无自相关」，不能拒绝才说明模型充分。视频带你理解「用残差查残差」的逻辑。" },
  "cointegration": { video:"video/ch14-t-advanced.mp4", vTitle:"高级时间序列模型全解析 · 专题讲解",
    img:"img/ch14-cointegration.png", iCap:"协整：漂移中的长期均衡",
    text:"两个各自非平稳的序列，它们的某个线性组合却可能平稳——这就是<b>协整</b>，刻画「长期均衡」。视频讲清楚为什么直接回归非平稳序列会得到伪回归，以及 Engle-Granger 两步法如何检验协整。" },

  /* ---- Ch15 损失分布 ---- */
  "common-dists": { video:"video/ch15-dists.mp4", vTitle:"损失分布：揭示风险的真面目 · Min 讲解",
    img:"img/ch15-dists.png", iCap:"常见损失分布的形态对比",
    text:"指数、Gamma、Weibull、Pareto、对数正态——每个分布刻画一种「损失的形状」。视频帮你建立「参数如何改变密度形态与尾部厚度」的直觉，看完再到分布图鉴里逐个拖动验证。<b>Pareto 的重尾</b>是保险大额理赔建模的重点。",
    gallery:{ title:"📈 分布图鉴 · 七种常用损失分布（点击放大）", items:[
      {src:"img/ch15-exponential.png", cap:"指数分布"},
      {src:"img/ch15-gamma.png", cap:"伽马分布"},
      {src:"img/ch15-weibull.png", cap:"威布尔分布"},
      {src:"img/ch15-pareto.png", cap:"帕累托分布"},
      {src:"img/ch15-lognormal.png", cap:"对数正态分布"},
      {src:"img/ch15-invgauss.png", cap:"逆高斯分布"},
      {src:"img/ch15-burr.png", cap:"Burr 分布"}
    ]} },
  "loss-estimation": { video:"video/ch15-heavytail.mp4", vTitle:"损失分布：量化厚尾风险 · Min 讲解（估计部分）",
    img:"img/ch15-estimation.png", iCap:"矩估计 vs 极大似然估计",
    text:"有了数据，如何估计分布参数？<b>矩估计</b>用样本矩匹配理论矩（简单但不最优）；<b>MLE</b> 找让观测数据「最可能出现」的参数（渐近最优）。视频带你对比两者的构造思路与适用场景。" },

  /* ---- Ch16 极值理论 ---- */
  "gev": { video:"video/ch16-gev.mp4", vTitle:"GEV：最大值的分布 · 专题讲解",
    img:"img/ch16-limits.png", iCap:"极值理论的三个核心极限定理",
    text:"Fisher-Tippett 定理告诉我们：无论原分布是什么，归一化后的最大值都收敛到三类之一——Fréchet（重尾）、Gumbel（轻尾）、Weibull（有界尾）——统一为 <b>GEV 分布</b>。视频讲清楚为什么极值理论「只关心尾部形状」而与原分布无关。" },
  "pot": { video:"video/ch16-pot.mp4", vTitle:"POT 与 GPD 超阈值建模 · 专题讲解",
    img:"img/ch16-mrl.png", iCap:"平均剩余生命与超阈值",
    text:"POT（超阈值）方法用 <b>GPD</b> 建模「超过阈值的超出量」，比块最大值法更充分地利用极端数据。平均剩余生命图帮助选择阈值。视频带你掌握 GPD 的形式与 VaR/ES 的估计。" },

  /* ---- Ch17 Copula ---- */
  "joint-marginal": { video:"video/ch17-joint-marginal.mp4", vTitle:"联合分布与边缘分布 · 专题讲解",
    img:"img/ch17-joint-marginal.png", iCap:"联合分布与边缘分布",
    text:"联合分布描述「多个风险如何一起动」，边缘分布描述「各自怎么动」。核心问题是：边缘分布<b>不能唯一决定</b>联合分布——还需要单独刻画依赖结构。这正是整个 Copula 章节的出发点。" },
  "dependence-trap": { video:"video/ch17-dependence-trap.mp4", vTitle:"依赖的陷阱 · 专题讲解",
    img:"img/ch17-spearman.png", iCap:"Pearson 相关 vs Spearman 秩相关",
    text:"Pearson 相关只捕捉线性依赖、且对极端值敏感；<b>秩相关</b>（Spearman ρ、Kendall τ）捕捉单调依赖、对离群值稳健。视频演示同一组数据在非线性变换下 Pearson 可以面目全非，而秩相关保持不变——这就是「依赖的陷阱」。" },
  "pit": { video:"video/ch17-pit.mp4", vTitle:"PIT：通往 Copula 的桥梁 · 专题讲解",
    img:"img/ch17-pit-concept.png", iCap:"概率积分变换：从任意边缘到均匀尺度",
    text:"概率积分变换（PIT）：任何连续随机变量代入自己的分布函数，就得到 U(0,1) 均匀分布。它是从「任意边缘」通往「均匀世界」的桥梁——Copula 正是定义在均匀尺度上的。到实验台拖参数，看 PIT 把分布「洗」成均匀。" },
  "sklar": { video:"video/ch17-sklar.mp4", vTitle:"Sklar 定理：解耦的艺术 · 专题讲解",
    img:"img/ch17-sklar.png", iCap:"Sklar 定理的表述与直观",
    text:"Sklar 定理是 Copula 理论的基石：任何联合分布都可以分解为「<b>边缘分布 + Copula（依赖结构）</b>」，且连续边缘下 Copula 唯一。这让边缘与依赖可以分开建模——视频讲透这个「解耦」的意义。" },
  "basic-copula": { video:"video/ch17-basic-copula.mp4", vTitle:"基础 Copula 与 Fréchet 界 · 专题讲解",
    img:"img/ch17-basic.png", iCap:"独立 Copula 与 Fréchet 上下界",
    text:"最基础的三个 Copula：独立 Copula Π(u,v)=uv、完全正相关（同调）上界 M(u,v)=min(u,v)、完全负相关（反调）下界 W。Fréchet 界告诉我们依赖的「可能范围」。视频带你建立这三种极端情形的几何直觉。" },
  "archimedean": { video:"video/ch17-archimedean.mp4", vTitle:"Archimedean 家族的三位明星 · 专题讲解",
    img:"img/ch17-archimedean.png", iCap:"Clayton / Gumbel / Frank 的生成元",
    text:"Archimedean Copula 用生成元 φ 统一构造：<b>Clayton</b> 下尾相依（保险理赔同发）、<b>Gumbel</b> 上尾相依（巨灾极端风险）、<b>Frank</b> 对称依赖。视频讲清三个成员的特点与适用场景。" },
  "elliptical": { video:"video/ch17-elliptical.mp4", vTitle:"椭圆家族：Gaussian 与 t · 专题讲解",
    img:"img/ch17-elliptical.png", iCap:"Gaussian 与 t Copula 的等高线结构",
    text:"Gaussian Copula <b>没有尾相依</b>（低估极端联动——金融危机的教训）；t Copula 有对称尾相依，自由度 ν 控制尾部强度。视频对比两者的等高线结构，理解为什么选 ν 很重要。" },
  "tail-dep": { video:"video/ch17-tail-dep.mp4", vTitle:"尾部相依系数 λ · 专题讲解",
    img:"img/ch17-taildep.png", iCap:"尾部相依系数 λ 的定义与估计",
    text:"尾部相依系数 λ 度量「一边极端时另一边也极端」的条件概率。Clayton 有 λ<sub>L</sub>&gt;0、Gumbel 有 λ<sub>U</sub>&gt;0、Gaussian 则 λ=0。视频讲清 λ<sub>U</sub>/λ<sub>L</sub> 的定义，再到实验台拖 q，看 λ(q) 如何收敛到 λ。" },
  "joint-prob": { video:"video/ch17-joint-prob.mp4", vTitle:"联合概率计算器 · 专题讲解",
    img:"img/ch17-joint-probability-calculator.png", iCap:"联合概率计算器：边缘概率经 Copula 得到联合概率",
    text:"有了 Sklar 定理就能算联合概率：P(X≤x, Y≤y) = C(F(x), G(y))。视频演示如何把实际问题翻译成「查边缘 → 转均匀尺度 → 代 Copula」三步，完成联合概率计算器的拼装。" },
  "aggregate": { video:"video/ch17-aggregate.mp4", vTitle:"聚合损失与资本要求 · 专题讲解",
    img:"img/ch17-aggregate-loss-capital.png", iCap:"尾部相依如何加厚聚合损失尾部并抬高资本要求",
    text:"依赖结构直接影响聚合风险与资本要求：尾相依越强，聚合损失的 VaR 越高。视频讲清为什么「分散化效应」在极端情形下会失效，再到蒙特卡洛实验台对比不同 Copula 的 VaR 差异。" },

  /* ---- Ch18 再保险 ---- */
  "reinsurance-map": { video:"video/ch18-reinsurance-map.mp4", vTitle:"再保险：份额与层次 · 专题讲解",
    img:"img/ch18-map.png", iCap:"再保险全景：比例 vs 非比例",
    text:"再保险把风险在原保险人与再保险人之间切分。两大家族：<b>比例再保险</b>（成数、溢额）按固定比例分摊；<b>非比例再保险</b>（超额赔款）超过阈值才赔付。视频先建立全景框架，再逐个进入具体形式。" },
  "quota-share": { video:"video/ch18-quota-share.mp4", vTitle:"成数再保险：一个参数的权衡 · 专题讲解",
    img:"img/ch18-quota.png", iCap:"成数再保险的风险切分结构",
    text:"成数再保险：再保险人按固定比例 α 承担每笔赔款。原保险人自留损失的均值、方差都按 (1−α) 缩放。视频讲清比例再保险的简单性与局限（对大额赔款没有杠杆效应），再到实验台拖 α 看风险切分。",
    gallery:{ title:"🖼️ 比例再保险图解（点击放大）", items:[
      {src:"img/ch18-proportional-1.png", cap:"比例再保险 · 图示一"},
      {src:"img/ch18-proportional-2.png", cap:"比例再保险 · 图示二"}
    ]} },
  "xl": { video:"video/ch18-xl.mp4", vTitle:"超额赔款再保险：锁定风险尾部 · 专题讲解",
    img:"img/ch18-xl.png", iCap:"超额赔款再保险的赔付结构",
    text:"超额赔款再保险：再保险人只赔<b>超过免赔额 M</b> 的部分，原保险人自留损失变为 X∧M（截断）。视频讲清「个体超赔」与「聚合超赔」的赔付函数，再到实验台拖 M，看自留与分出的此消彼长。",
    gallery:{ title:"🖼️ 非比例再保险图解（点击放大）", items:[
      {src:"img/ch18-nonproportional-1.png", cap:"非比例再保险 · 图示一"},
      {src:"img/ch18-nonproportional-2.png", cap:"非比例再保险 · 图示二"}
    ]} },
  "mean-excess": { video:"video/ch18-mean-excess.mp4", vTitle:"厚尾的照妖镜 · 专题讲解",
    img:"img/ch18-xl.png", iCap:"平均超额损失与条件尾部期望",
    text:"平均超额损失 e(M)=E[X−M|X&gt;M] 度量「超过阈值后平均还超多少」——<b>厚尾分布的 e(M) 不随 M 下降</b>（甚至上升）。它是厚尾的照妖镜，也是超赔再保险定价的核心。视频讲清它与 CTE 的关系。" },
  "inflation": { video:"video/ch18-inflation.mp4", vTitle:"通胀杠杆效应 · 专题讲解",
    img:"img/ch18-inflation.png", iCap:"通胀对超赔再保险的放大效应",
    text:"通胀让赔款整体上涨，但对超赔再保险的影响是<b>放大的</b>：超过免赔额 M 的部分占比上升得比通胀本身更快。视频讲透这个「杠杆效应」——这正是超赔合约对通胀高度敏感的原因。" },
  "censored-mle": { video:"video/ch18-censored-mle.mp4", vTitle:"审查数据与 MLE：看不见的尾部 · 专题讲解",
    img:"img/ch18-censoring-mle.png", iCap:"审查数据与 MLE：让看不见的尾部仍进入估计",
    text:"再保险数据常常是「审查」过的：超过限额的赔款只记录到限额值。直接拟合会低估尾部。视频讲清如何用审查数据正确构造似然函数（审查点用生存函数），得到无偏的 MLE 估计。" },

  /* ---- Ch19 风险模型 I ---- */
  "collective-model": { video:"video/ch19-collective-model.mp4", vTitle:"集体风险模型 · 专题讲解",
    img:"img/ch19-collective.png", iCap:"集体风险模型 S=ΣXᵢ 的结构",
    text:"集体风险模型把聚合赔款 S 分解为「<b>赔款次数 N × 单次赔款 X</b>」。视频讲清为什么这个「频度-强度」分解是精算建模的基石，以及 N 与 X 的随机性如何共同决定 S 的分布。" },
  "compound-poisson": { video:"video/ch19-compound-poisson.mp4", vTitle:"复合 Poisson 的化简魔法 · 专题讲解",
    img:"img/ch19-compound.png", iCap:"复合 Poisson 的矩",
    text:"当 N~Poisson(λ) 时，S 的矩有优雅的形式：E[S]=λE[X]，Var(S)=λE[X²]。视频演示矩母函数如何「魔法般」简化推导——<b>「λ 乘高一阶矩」</b>的规律是常考点。" },
  "frequency-nb": { video:"video/ch19-frequency-nb.mp4", vTitle:"过度离散的救星：负二项分布 · 专题讲解",
    img:"img/ch19-compound.png", iCap:"负二项分布与过度离散",
    text:"当赔款次数数据的方差大于均值（<b>过度离散</b>），Poisson 就不够了——负二项分布多一个形状参数来容纳额外变异。视频讲清 NB 作为「Poisson-Gamma 混合」的表达及其保险含义（异质性）。" },
  "compound-additivity": { video:"video/ch19-compound-additivity.mp4", vTitle:"复合 Poisson 的组合魔法 · 专题讲解",
    img:"img/ch19-compound.png", iCap:"独立复合 Poisson 的可加性",
    text:"独立复合 Poisson 之和仍是复合 Poisson：λ 相加，赔款分布变为加权混合。这个「<b>聚合封闭性</b>」让组合管理非常方便。视频带你掌握可加性定理的条件与结论。" },

  /* ---- Ch20 风险模型 II ---- */
  "reins-moments": { video:"video/ch20-reins-moments.mp4", vTitle:"再保险后的聚合赔款矩 · 专题讲解",
    img:"img/ch20-reins.png", iCap:"再保险后的聚合赔款矩",
    text:"再保险之后，原保险人的聚合赔款的频度与强度都变了。视频讲清如何计算自留损失的矩——对超赔再保险，频度变为<b>稀释后的 Poisson</b>，强度变为截断分布。" },
  "xl-reinsurer": { video:"video/ch20-xl-reinsurer.mp4", vTitle:"Poisson 稀释的计算魔法 · 专题讲解",
    img:"img/ch20-reins.png", iCap:"再保险人聚合赔款的 Poisson 稀释",
    text:"再保险人的赔款次数是从原 Poisson「<b>稀释</b>」出来的：只有超过 M 的赔款才进入再保险人账本，稀释概率为 P(X&gt;M)。视频讲清 Poisson 稀释的优雅结论——再保险人频度仍是 Poisson，参数为 λ·P(X&gt;M)。" },
  "individual-model": { video:"video/ch20-individual-model.mp4", vTitle:"个体风险模型：从每张保单出发 · 专题讲解",
    img:"img/ch20-individual.png", iCap:"个体风险模型：从每张保单出发",
    text:"个体风险模型从每张保单出发：S=ΣIᵢBᵢ（是否出险 × 赔款额），适合保单数固定的组合。视频对比个体模型与集体风险模型各自的适用场景，以及前者如何逼近后者。" },
  "param-variability": { video:"video/ch20-param-variability.mp4", vTitle:"参数不确定性：异质性的代价 · 专题讲解",
    img:"img/ch20-parameter-uncertainty-heterogeneity.png", iCap:"参数不确定性与异质性：方差放大、尾部变厚",
    text:"参数是从数据估计来的，带有不确定性——忽略它会低估真实风险。视频讲清参数变异如何给预测分布「再加一层」，以及精算中为什么要为异质性与估计误差付出代价。" },
  "ruin-model": { video:"video/ch20-ruin-model.mp4", vTitle:"破产模型：盈余何时见底 · 专题讲解",
    img:"img/ch20-ruin-model-surplus.png", iCap:"破产模型：保费上升、理赔跳跌与盈余首次见底",
    text:"Cramér-Lundberg 模型描述保险人盈余的演化：初始资本 u + 保费收入 ct − 累积赔款 S(t)。<b>破产</b>就是盈余首次跌破零。视频讲清破产概率 ψ(u) 的定义与安全附加系数 θ 的作用，再到实验台拖参数，看盈余路径如何变红。" },

  /* ---- Ch21 机器学习 ---- */
  "ml-overview": { video:"video/ch21-branches.mp4", vTitle:"机器学习四大分支 · Min 讲解",
    img:"img/ch21-branches.png", iCap:"机器学习的四大分支",
    text:"机器学习按「<b>有无标签、什么反馈</b>」分为四大分支：监督（分类/回归）、无监督（聚类/降维）、半监督、强化学习。视频带你建立全景地图，想清楚「预测赔款金额」「客户分群」这类精算问题各该用哪种工具。" },
  "bias-variance": { video:"video/ch21-overfit.mp4", vTitle:"模型验证与过拟合权衡 · Min 讲解",
    img:"img/ch21-bias-variance-concept.png", iCap:"偏差-方差权衡：测试误差 U 形曲线的谷底",
    text:"预测误差 = <b>Bias² + Variance + Noise</b>。欠拟合是偏差主导，过拟合是方差主导，总误差呈 U 形。视频讲清模型复杂度如何驱动这个权衡，以及为什么交叉验证、正则化都是为了「找到谷底」。" },
  "regularization": { video:"video/ch21-regularization.mp4", vTitle:"正则化：收缩与归零 · 专题讲解",
    img:"img/ch21-regularization-ridge-lasso.png", iCap:"正则化：Ridge 圆形收缩与 LASSO 菱形归零",
    text:"正则化在损失函数里加惩罚项来抑制过拟合。<b>Ridge（L2）</b>把系数收缩到接近零但不为零；<b>LASSO（L1）</b>能把系数恰好收缩到零，顺带做特征选择。视频讲清几何直觉（圆形 vs 菱形约束区），再到实验台拖 β₀ 看两条收缩路径。",
    gallery:{ title:"🖼️ 正则化图解（点击放大）", items:[
      {src:"img/ch21-regularization-1.png", cap:"正则化图解 · 一"},
      {src:"img/ch21-regularization-2.png", cap:"正则化图解 · 二"},
      {src:"img/ch21-regularization-3.png", cap:"正则化图解 · 三"}
    ]} },
  "eval-metrics": { video:"video/ch21-eval.mp4", vTitle:"模型评估与泛化验证 · Min 讲解",
    img:"img/ch21-evalmetrics.png", iCap:"模型评估指标：精确率、召回率与 AUC",
    text:"混淆矩阵派生出一族评估指标：准确率、<b>精确率</b>（预测为正的有多准）、<b>召回率</b>（正例捞得多全）、F1 与 AUC。视频讲清各指标的取舍，理解为什么欺诈检测与癌症筛查要看不同的指标。" },
  "trees-ensemble": { video:"video/ch21-trees-ensemble.mp4", vTitle:"决策树与集成 · 专题讲解",
    img:"img/ch21-cart.png", iCap:"CART 决策树的贪心分裂",
    text:"决策树用贪心分裂（基尼指数/平方误差）递归切分，单树容易过拟合。集成学习两条路线：<b>Bagging（随机森林）</b>平均降方差，<b>Boosting（GBDT/XGBoost）</b>累加降偏差。视频讲清两者的互补逻辑。" },
  "kmeans-pca": { video:"video/ch21-unsupervised.mp4", vTitle:"非监督学习技术导论 · Min 讲解",
    img:"img/ch21-knn-kmeans.png", iCap:"KNN（监督）与 K-means（无监督）的区分",
    text:"K-means 用「分配-更新」迭代找簇，K 用肘部法则选；PCA 投影到方差最大的方向实现降维。视频带你掌握两者的算法流程，别忘了共同前提：<b>先标准化</b>，否则大量纲变量会主导距离。" },

  /* ---- Ch21 · GLM ---- */
  "glm-basics": { video:"video/ch21-glm-basics.mp4", vTitle:"GLM 核心：方差函数 V(μ) · 专题讲解",
    img:"img/ch21-glm-basics-variance-function.png", iCap:"GLM 基础：方差函数 V(μ) 如何适配不同数据",
    text:"线性回归假设「方差处处相等」，但保险计数数据（索赔次数）天然均值越大、波动越大。GLM 放宽这个假设：让方差成为均值的函数 V(μ)。这段导读带你理解为什么车险费率厘定、索赔频率建模要用 GLM 而不是普通线性回归。" },
  "glm-link": { video:"video/ch21-glm-link.mp4", vTitle:"连接函数：GLM 的核心桥梁 · 专题讲解",
    img:"img/ch21-link-function-map-mean.png", iCap:"连接函数：将受限均值映射到无界线性预测子",
    text:"连接函数 g(μ)=Xβ 是 GLM 的桥梁：把均值 μ（概率、计数等有自然范围）映射到整个实数轴，让线性预测子可以安全建模。logit 保证预测概率落在 (0,1)，log 保证预测值为正。理解连接函数，就理解了 GLM 为什么不会给出「负的概率」这种荒谬预测。" },

  /* ---- Ch22 · 模拟方法 ---- */
  "prng": { video:"video/ch22-prng.mp4", vTitle:"伪随机数生成 · 专题讲解",
    img:"img/ch22-prng.png", iCap:"伪随机数：从种子、递推到均匀数",
    text:"一切精算模拟都从可靠的随机数开始。计算机产生的是伪随机数——确定性算法生成的、统计上像随机的序列。这段导读讲线性同余法（LCG）的递推、种子的作用、周期的意义，以及如何检验生成的 U(0,1) 是否真的「均匀」。" },
  "inverse-transform": { video:"video/ch22-inverse-transform.mp4", vTitle:"逆变换法：随机数的转换钥匙 · 专题讲解",
    img:"img/ch22-inverse-transform.png", iCap:"逆变换法：均匀随机数经逆 CDF 映射为目标分布",
    text:"逆变换法是抽样的基本工具：抽 U~U(0,1)，令 X=F⁻¹(U)，则 X 服从目标分布 F。导读推导为什么这样做是对的（P(F⁻¹(U)≤x)=F(x)），并给出指数分布的具体反函数。配合演示，拖动 U 看它如何映射到 X。" },
  "acceptance-rejection": { video:"video/ch22-acceptance-rejection.mp4", vTitle:"接受-拒绝法 · 专题讲解",
    img:"img/ch22-acceptance-rejection.png", iCap:"接受-拒绝法：在包络下投点并筛选目标样本",
    text:"当反函数求不出来，接受-拒绝法登场：用容易抽样的提议分布 g 乘常数 M 罩住目标密度 f，按比例 f/(Mg) 决定接受还是拒绝。导读讲清接受率=1/M 与包络贴合度的关系——M 越小效率越高。" },
  "sim-application": { video:"video/ch22-sim-application.mp4", vTitle:"聚合赔款蒙特卡洛模拟 · 专题讲解",
    img:"img/ch22-aggregate-loss-monte-carlo.png", iCap:"聚合赔款蒙特卡洛：抽次数、抽金额、求和并读取尾部风险",
    text:"把频度与强度抽样组合，蒙特卡洛模拟聚合赔款 S 的分布，进而估计 VaR、破产概率——这是精算定价、资本与准备金实务的核心。导读串联前三个知识点，展示一次完整的聚合赔款模拟如何落地。" }

};

// 章节按创建顺序存储，这里统一按章号排序（Ch13→Ch21），保证地图/导航/面包屑顺序一致
COURSE.chapters.sort((a,b)=>a.id-b.id);
