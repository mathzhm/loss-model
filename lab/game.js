/* =====================================================================
   game.js —— LOSS LAB 游戏化闭环（localStorage 持久化）
   XP / 等级 / 连击 / 徽章 / 连续学习天数 / 错题本 / 完成度
   全站共用：Game.renderTopbar() 注入顶栏，Game.awardXP() 发经验
   ===================================================================== */
(function(){
"use strict";
const KEY="losslab_state_v1";

const BADGES=[
  {id:"first-step", ic:"🐣", name:"初出茅庐", desc:"完成第一个知识点"},
  {id:"copula-fan", ic:"🔗", name:"Copula 行家", desc:"完成 5 个 Ch17 知识点"},
  {id:"chapter-master", ic:"👑", name:"章节大师", desc:"通关任意一章全部知识点"},
  {id:"collector", ic:"💰", name:"经验收藏家", desc:"累计获得 500 XP"},
  {id:"persistent", ic:"🔥", name:"三日不辍", desc:"连续学习 3 天"},
  {id:"sharpshooter", ic:"🎯", name:"神射手", desc:"竞技场连击 ≥ 8"},
  {id:"perfectionist", ic:"💎", name:"完美主义", desc:"某知识点自测全对（≥3题）"}
];

function defaultState(){
  return { xp:0, level:1, streak:{count:0,lastDay:""}, done:{}, wrong:[],
    badges:[], stats:{quiz:0,correct:0,match:0,predict:0,arenaBest:0,arenaScore:0} };
}
let S;
function load(){ try{ S=JSON.parse(localStorage.getItem(KEY))||defaultState(); }catch(e){ S=defaultState(); }
  // 补全缺字段
  const d=defaultState(); for(const k in d) if(!(k in S))S[k]=d[k]; }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
load();

/* ---------- 等级 ---------- */
const XP_PER_LEVEL=120;
function levelOf(xp){ return Math.floor(xp/XP_PER_LEVEL)+1; }
function levelProgress(xp){ return (xp%XP_PER_LEVEL)/XP_PER_LEVEL; }

/* ---------- 连续天数 ---------- */
function todayStr(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function yesterdayStr(){ const d=new Date(Date.now()-864e5); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function touchStreak(){
  const t=todayStr();
  if(S.streak.lastDay===t) return; // 今天已记
  if(S.streak.lastDay===yesterdayStr()){ S.streak.count++; }
  else { S.streak.count=1; }
  S.streak.lastDay=t; save();
}

/* ---------- 经验 ---------- */
function awardXP(n, reason){
  const before=levelOf(S.xp);
  S.xp+=n; const after=levelOf(S.xp);
  save(); floatXP(n, reason);
  if(after>before){ setTimeout(()=>floatText("⬆ 升级！Lv."+after,"#22d3ee"),700); }
  refreshTopbar(); checkBadges();
  return S.xp;
}
function floatXP(n,reason){ floatText("+"+n+" XP"+(reason?" · "+reason:""),"#fcd34d"); }
function floatText(txt,color){
  const d=document.createElement('div'); d.className='xp-float'; d.textContent=txt;
  if(color)d.style.color=color;
  document.body.appendChild(d); setTimeout(()=>d.remove(),1400);
}

/* ---------- 完成度 ---------- */
function kpKey(ch,kp){ return ch+":"+kp; }
function markKPDone(ch,kp){ S.done[kpKey(ch,kp)]=true; save(); refreshTopbar(); checkBadges(); }
function isKPDone(ch,kp){ return !!S.done[kpKey(ch,kp)]; }
function chapterProgress(ch){
  const total=(ch.kps||[]).length; if(!total)return{done:0,total:0,pct:0};
  let done=0; ch.kps.forEach(k=>{ if(isKPDone(ch.id,k.id))done++; });
  return {done,total,pct:Math.round(done/total*100)};
}
function overallProgress(){
  let done=0,total=0;
  (window.COURSE?COURSE.chapters:[]).forEach(ch=>{ const p=chapterProgress(ch); done+=p.done; total+=p.total; });
  return {done,total,pct:total?Math.round(done/total*100):0};
}

/* ---------- 错题本 ---------- */
function addWrong(entry){
  entry.time=Date.now();
  S.wrong.unshift(entry);
  if(S.wrong.length>200)S.wrong.length=200;
  save();
}
function getWrong(){ return S.wrong; }
function removeWrong(time){ S.wrong=S.wrong.filter(w=>w.time!==time); save(); }
function clearWrong(){ S.wrong=[]; save(); }

/* ---------- 答题记录（learn 自测调用） ---------- */
function recordQuiz(chName,kpName,q,chosen,correct){
  S.stats.quiz++; if(correct)S.stats.correct++;
  if(!correct){
    addWrong({ch:chName,kp:kpName,q:q.q,opts:q.opts,ans:q.ans,chosen:chosen,why:q.why||""});
  }
  save(); refreshTopbar();
  if(correct) awardXP(correct?10:0,"答对一题");
  checkBadges();
}

/* ---------- 匿名答题日志（教师端统计用，不含任何个人信息） ---------- */
const ATT_KEY="losslab_attempts";
function loadAttempts(){ try{ return JSON.parse(localStorage.getItem(ATT_KEY))||[]; }catch(e){ return []; } }
function logAttempt(meta){
  try{
    const a=loadAttempts();
    a.push({ch:meta.ch,chName:meta.chName,kp:meta.kp,kpName:meta.kpName,
      lv:meta.lv||2,q:meta.q,opts:meta.opts,ans:meta.ans,chosen:meta.chosen,
      ok:!!meta.ok,src:meta.src||"learn",t:Date.now()});
    if(a.length>5000)a.splice(0,a.length-5000); // 防止无限增长
    localStorage.setItem(ATT_KEY,JSON.stringify(a));
  }catch(e){}
}
function getAttempts(){ return loadAttempts(); }
function clearAttempts(){ try{ localStorage.removeItem(ATT_KEY); }catch(e){} }

/* ---------- 徽章 ---------- */
function earn(id){
  if(S.badges.includes(id))return;
  const b=BADGES.find(x=>x.id===id); if(!b)return;
  S.badges.push(id); save();
  floatText(b.ic+" 获得徽章「"+b.name+"」","#a78bfa");
}
function checkBadges(){
  const doneCount=Object.keys(S.done).length;
  if(doneCount>=1)earn("first-step");
  const ch17=Object.keys(S.done).filter(k=>k.startsWith("17:")).length;
  if(ch17>=5)earn("copula-fan");
  if(window.COURSE){ COURSE.chapters.forEach(ch=>{ const p=chapterProgress(ch); if(p.total>0&&p.done===p.total)earn("chapter-master"); }); }
  if(S.xp>=500)earn("collector");
  if(S.streak.count>=3)earn("persistent");
  if(S.stats.arenaBest>=8)earn("sharpshooter");
}

/* ---------- 竞技场 ---------- */
function reportArena(score,bestCombo){
  S.stats.arenaScore=Math.max(S.stats.arenaScore||0,score);
  S.stats.arenaBest=Math.max(S.stats.arenaBest||0,bestCombo);
  save(); awardXP(Math.round(score/10),"竞技场得分 "+score);
  checkBadges();
}

/* ---------- 深浅色主题 ---------- */
function toggleTheme(){
  const next=document.documentElement.dataset.theme==='light'?'dark':'light';
  try{ localStorage.setItem('losslab_theme',next); }catch(e){}
  location.reload();
}

/* ---------- 顶栏（全站共用） ---------- */
function renderTopbar(el, active){
  touchStreak();
  const lvl=levelOf(S.xp);
  const isLight=document.documentElement.dataset.theme==='light';
  el.innerHTML=
    '<a class="brand" href="index.html"><span class="logo">∑</span>LOSS LAB<span class="lab">损失模型实验舱</span></a>'+
    '<div class="stat-pills">'+
      '<span class="pill lvl"><span class="ic">⚡</span>Lv.'+lvl+'</span>'+
      '<span class="pill xp"><span class="ic">✦</span>'+S.xp+' XP</span>'+
      '<span class="pill streak"><span class="ic">🔥</span>'+S.streak.count+' 天</span>'+
      '<a class="nav-link" href="arena.html"'+(active==='arena'?' style="color:var(--gold)"':'')+'>🎮 竞技场</a>'+
      '<a class="nav-link" href="library.html"'+(active==='library'?' style="color:var(--ch17)"':'')+'>🔬 演示库</a>'+
      '<a class="nav-link" href="wrong.html"'+(active==='wrong'?' style="color:var(--bad)"':'')+'>📕 错题本'+(S.wrong.length?' ('+S.wrong.length+')':'')+'</a>'+
      '<a class="nav-link" href="index.html">🗺️ 地图</a>'+
      '<button class="nav-link theme-toggle" type="button" title="切换深色/浅色背景">'+(isLight?'🌙 深色':'☀️ 浅色')+'</button>'+
    '</div>';
  const tb=el.querySelector('.theme-toggle'); if(tb)tb.onclick=toggleTheme;
}
let _topEl=null;
function refreshTopbar(){ if(_topEl)renderTopbar(_topEl,_topEl.dataset.active); }

/* ---------- 题库（竞技场用，自动汇总所有 kp.quiz） ---------- */
function allQuiz(opt){
  opt=opt||{}; const out=[];
  if(!window.COURSE)return out;
  COURSE.chapters.forEach(ch=>{
    if(opt.chId&&ch.id!==opt.chId)return;
    (ch.kps||[]).forEach(kp=>{
      if(opt.onlyDone&&!isKPDone(ch.id,kp.id))return;
      (kp.quiz||[]).forEach(q=>{ out.push({ch:ch.id,chName:ch.name,kp:kp.id,kpName:kp.name,color:ch.color,...q}); });
    });
  });
  return out;
}
// 已学知识点数（用于竞技场默认范围）
function doneCount(){ return Object.keys(S.done).length; }

window.Game={
  state:()=>S, save, awardXP, floatText,
  markKPDone, isKPDone, chapterProgress, overallProgress,
  addWrong, getWrong, removeWrong, clearWrong, recordQuiz,
  logAttempt, getAttempts, clearAttempts,
  reportArena, allQuiz, doneCount, BADGES, earnBadge:id=>earn(id),
  levelOf, levelProgress,
  renderTopbar(el,active){ _topEl=el; el.dataset.active=active; renderTopbar(el,active); }
};
})();
