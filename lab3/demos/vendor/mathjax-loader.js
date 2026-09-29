/* mathjax-loader.js —— LOSS LAB 离线 MathJax 3 适配层
   配合 vendor/mathjax-tex-svg.js 使用（SVG 输出，不依赖外部字体，完全离线）。
   用法（替换原 CDN 的 MathJax 标签，放在 </body> 前）：
     <script>window.__MJ_DOLLAR=1;</script>   ← 仅当页面用单 $ 行内公式时加
     <script src="vendor/mathjax-loader.js"></script>
     <script src="vendor/mathjax-tex-svg.js"></script>
   功能：
   1. 保留页面自带的 window.MathJax 配置（只补不覆盖）；
   2. 按需启用单 $ 行内分隔符；
   3. 注入 MathJax 2 兼容 shim：MathJax.Hub.Queue(["Typeset",MathJax.Hub,el]) → MathJax.typeset([el])。
      shim 立即挂载并排队、就绪后统一重排；并用 defineProperty 守卫 window.MathJax——
      MathJax 3 启动时若整体重写 window.MathJax 对象，setter 会自动把 Hub 补回，
      兼容在 window.onload / 初始化阶段就调用 Hub.Queue 的演示。 */
(function(){
  var M = window.MathJax = window.MathJax || {};
  M.tex = M.tex || {};
  if(!M.tex.inlineMath){ M.tex.inlineMath = [['\\(','\\)']]; }
  if(window.__MJ_DOLLAR){
    var hasDollar = false;
    for(var i=0;i<M.tex.inlineMath.length;i++){ if(M.tex.inlineMath[i][0]==='$'){ hasDollar=true; break; } }
    if(!hasDollar){ M.tex.inlineMath.push(['$','$']); }
  }
  if(!M.tex.displayMath){ M.tex.displayMath = [['$$','$$'],['\\[','\\]']]; }

  /* ---- MathJax 2 兼容 shim：立即挂载 + 排队 ---- */
  var ready = false, pending = [];
  function doTypeset(el){
    try {
      if(el && MathJax.typesetClear){ MathJax.typesetClear([el]); }
      if(el){ MathJax.typeset([el]); } else { MathJax.typeset(); }
    } catch(e){ if(window.console){ console.warn('[mj-shim]', e); } }
  }
  function hubQueue(a){
    if(Array.isArray(a) && a[0]==="Typeset"){
      var el = a[2];
      if(ready){ doTypeset(el); } else { pending.push(el); }
    }
  }
  function attachHub(obj){
    if(obj && typeof obj === 'object'){
      try { Object.defineProperty(obj, 'Hub', { configurable:true, writable:true, value:{ Queue: hubQueue } }); }
      catch(e){ obj.Hub = { Queue: hubQueue }; }
    }
    return obj;
  }
  var _mj = attachHub(M);
  /* 守卫：MathJax 3 启动若整体重写 window.MathJax，setter 自动补回 Hub */
  try {
    Object.defineProperty(window, 'MathJax', {
      configurable: true,
      get: function(){ return _mj; },
      set: function(v){ _mj = attachHub(v); }
    });
  } catch(e){ /* 退路：Hub 已挂在 M 上 */ }

  M.startup = M.startup || {};
  var prevReady = M.startup.pageReady || null;
  M.startup.pageReady = function(){
    var base;
    try { base = prevReady ? prevReady.apply(this, arguments) : MathJax.startup.defaultPageReady(); }
    catch(e){ base = MathJax.startup.defaultPageReady(); }
    if(!base || typeof base.then !== 'function'){ base = Promise.resolve(); }
    return base.then(function(){
      ready = true;
      attachHub(window.MathJax);
      var q = pending.slice(); pending = [];
      q.forEach(function(el){ doTypeset(el); });
    });
  };
})();
