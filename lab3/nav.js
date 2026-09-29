/* LOSS LAB V3 · 共享顶栏：品牌 + 导航 + 三档背景深浅 + 账号体系
   用法：<script src="nav.js"></script> 即可在 body 顶部生成顶栏；
   <head> 中保留主题预读小脚本避免闪烁。

   账号模型（纯前端，数据存本机 localStorage，无服务器）：
   - v3accounts : [{name, created}]
   - v3cur      : 当前账号名
   - v3data_<账号名> : { prog:{kpId:{v,s,steps}}, wrong:[...] }
   每个学生的全部学习记录挂在自己账号下；学习地图页可导出 JSON
   交给教师端(teacher.html)汇总。换设备需带文件迁移。

   教师入口：在门禁里创建/选择教师账号名（TEACHER_NAME），
   自动进入 teacher.html（配合其口令门）。 */
(function(){
  /* ---------- 主题预应用（防闪烁） ---------- */
  try{
    var t=localStorage.getItem('v2theme');
    if(t) document.documentElement.dataset.theme=t;
  }catch(e){}

  const CUR = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  const NAV = [
    ['首页','index.html'],
    ['学习地图','map.html'],
    ['错题本','wrong.html'],
    ['竞技场','arena.html'],
    ['演示库','library.html'],
  ];
  const bar = document.createElement('div');
  bar.className = 'topbar';
  bar.innerHTML = `<div class="bar">
    <a class="brand" href="index.html"><span class="dot"></span>LOSS LAB <small>损失模型 · CS2 学习舱</small></a>
    <nav class="nav">${NAV.map(([n,h])=>`<a href="${h}"${h===CUR?' class="on"':''}>${n}</a>`).join('')}</nav>
    <div class="acct" id="acct"></div>
    <div class="theme-seg" title="背景深浅">
      <button data-t="">浅色</button><button data-t="soft">柔和</button><button data-t="dark">深色</button>
    </div>
  </div>`;
  document.body.insertBefore(bar, document.body.firstChild);
  const seg = bar.querySelector('.theme-seg');
  function paint(){[...seg.children].forEach(b=>b.classList.toggle('on', b.dataset.t===(document.documentElement.dataset.theme||'')));}
  seg.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.t) document.documentElement.dataset.theme=b.dataset.t; else delete document.documentElement.dataset.theme;
    try{localStorage.setItem('v2theme',b.dataset.t||'')}catch(e){}
    paint();
  });
  paint();
})();

/* ============================================================
   V3 · 数据层：账号 + 学习记录（读写即时落盘 localStorage）
   ============================================================ */
const V3 = {
  accounts(){ try{return JSON.parse(localStorage.getItem('v3accounts')||'[]')}catch(e){return[]} },
  cur(){ try{return localStorage.getItem('v3cur')||''}catch(e){return ''} },
  _cache:null,
  data(){                                   /* 当前账号的数据（含缓存） */
    const name=this.cur();
    if(!name) return {prog:{},wrong:[]};
    if(this._cache && this._cache.name===name) return this._cache.d;
    let d;
    try{ d=JSON.parse(localStorage.getItem('v3data_'+name)||'null') || {prog:{},wrong:[]}; }
    catch(e){ d={prog:{},wrong:[]}; }
    if(!d.prog)d.prog={}; if(!d.wrong)d.wrong=[];
    this._cache={name,d};
    return d;
  },
  _save(){
    const name=this.cur(); if(!name)return;
    try{ localStorage.setItem('v3data_'+name, JSON.stringify(this._cache.d)); }catch(e){}
  },
  /* ---- 学习进度（知识点级） ---- */
  prog(){ return this.data().prog; },
  setProg(kpid, patch){
    const d=this.data();
    d.prog[kpid]=Object.assign({}, d.prog[kpid]||{}, patch);
    this._save();
  },
  progOf(kpid){ return this.data().prog[kpid]||{}; },
  /* ---- 步骤级学习行为：{video,fig,hook,chain,demo}=1; video=秒数; quiz={s,n,log} ---- */
  step(kpid, key, val){
    const d=this.data();
    const p=d.prog[kpid]=d.prog[kpid]||{};
    p.steps=p.steps||{};
    p.steps[key]=val!==undefined?val:1;
    this._save();
  },
  stepOf(kpid){ return (this.data().prog[kpid]||{}).steps||{}; },
  /* ---- 错题本 ---- */
  wrong(){ return this.data().wrong; },
  addWrong(item){
    const d=this.data();
    const rest=d.wrong.filter(x=>!(x.kp===item.kp && x.qi===item.qi));
    rest.unshift(item);
    d.wrong=rest.slice(0,300);
    this._save();
  },
  removeWrong(kp,qi){
    const d=this.data();
    d.wrong=d.wrong.filter(x=>!(x.kp===kp&&x.qi===qi));
    this._save();
  },
  /* ---- 账号操作 ---- */
  create(name, pass){
    name=name.trim(); if(!name)return false;
    const list=this.accounts();
    if(list.some(a=>a.name===name))return false;
    list.push({name, pass:(pass||'').trim(), created:Date.now()});
    try{
      localStorage.setItem('v3accounts', JSON.stringify(list));
      localStorage.setItem('v3cur', name);
    }catch(e){return false}
    this._cache=null;
    return true;
  },
  passOf(name){
    const a=this.accounts().find(x=>x.name===name);
    return a?(a.pass||''):'';
  },
  switchTo(name){
    if(!this.accounts().some(a=>a.name===name))return false;
    try{ localStorage.setItem('v3cur', name); }catch(e){}
    this._cache=null;
    return true;
  },
  exportData(){
    const name=this.cur(); if(!name)return null;
    return JSON.stringify({v:3, account:name, exported:Date.now(),
      site:'LOSS LAB 损失模型 CS2 学习舱', prog:this.data().prog, wrong:this.data().wrong});
  },
  importData(json){                          /* 恢复/合并：把备份并入当前账号 */
    try{
      const o=typeof json==='string'?JSON.parse(json):json;
      if(!o || !o.prog) return false;
      const d=this.data();
      Object.assign(d.prog, o.prog||{});
      if(Array.isArray(o.wrong)){
        const key=x=>x.kp+'|'+x.qi;
        const map={}; d.wrong.forEach(x=>map[key(x)]=x);
        (o.wrong||[]).forEach(x=>{ if(!map[key(x)])map[key(x)]=x; });
        d.wrong=Object.values(map);
      }
      this._save();
      return true;
    }catch(e){ return false; }
  },
};

/* 兼容别名：沿用 V2 调用名的页面不改 */
const V2 = V3;

/* ============================================================
   账号控件 + 全站门禁
   ============================================================ */
(function(){
  const CUR = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  /* 教师账号：在门禁里创建/选择这个名字，即自动进入教师端 */
  const TEACHER_NAME = 'Minz';

  const box=document.getElementById('acct');
  function render(){
    if(!box)return;
    const cur=V3.cur();
    box.innerHTML = cur
      ? `<button class="acct-btn" id="acctBtn">👤 ${cur} ▾</button>`
      : `<button class="acct-btn primary" id="acctBtn">＋ 创建账号</button>`;
    box.querySelector('#acctBtn').onclick=openDialog;
  }
  function teacherLogin(mask){
    /* Minz 钥匙：找到门；口令仍在教师端页面上验证。
       教师端不上传 GitHub，仅本地使用：线上提示，本地直通。 */
    if(location.protocol!=='file:' && !/^https?:\/\/localhost|127\.0\.0\.1/.test(location.origin)){
      if(mask) showErr(mask,'教师端不在线上部署，请在本机打开的学习舱中使用 Minz 入口。');
      return;
    }
    try{ sessionStorage.removeItem('v3teacher') }catch(e){}
    location.href='teacher.html';
  }
  function afterPick(){ V3._cache=null; location.reload(); }
  function showErr(mask,msg){
    const e=mask.querySelector('#acctErr');
    if(e){e.textContent=msg;e.style.display='block';}
  }
  /* 统一入口：输入名字即登录或创建（名字存在则验证口令，不存在则创建） */
  function enterAccount(mask, name, pass){
    name=(name||'').trim();
    if(!name)return;
    if(name===TEACHER_NAME){ teacherLogin(mask); return; }
    const acc=V3.accounts().find(a=>a.name===name);
    if(acc){
      if(acc.pass){
        if(!pass){ showErr(mask,'这个账号设了口令，请输入口令进入。'); return; }
        if(acc.pass!==pass){ showErr(mask,'口令不对，再试试。（忘记口令可用之前的备份文件在新账号里恢复进度）'); return; }
      }
      V3.switchTo(name); afterPick(); return;
    }
    if(V3.create(name, pass)){ afterPick(); return; }
    showErr(mask,'创建失败，请换个名字试试。');
  }
  function buildDialog({gate=false}={}){
    if(document.getElementById('acctMask'))return null;
    const list=V3.accounts();
    const cur=V3.cur();
    const mask=document.createElement('div');
    mask.id='acctMask';
    /* 门禁模式：不透明背景遮住全部内容，不可点外关闭 */
    mask.style.cssText='position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;overflow:auto;'
      +(gate?'background:var(--bg)':'background:rgba(10,20,35,.45);backdrop-filter:blur(2px)');
    mask.innerHTML=`<div class="card" style="width:360px;max-width:92vw;padding:24px 26px;margin:auto">
      ${gate?`<div style="text-align:center;margin-bottom:14px"><span style="font-size:34px">🧪</span><h2 style="font-size:19px;font-weight:800;margin-top:6px">欢迎来到 LOSS LAB</h2>
        <p style="font-size:12.5px;color:var(--muted);margin-top:4px">先创建或选择你的学习账号，才能开始学习</p></div>`
      :`<h3 style="font-size:17px;font-weight:800;margin-bottom:4px">👤 学习账号</h3>
        <p style="font-size:12.5px;color:var(--muted);margin-bottom:14px">账号只存本机浏览器；请定期在「学习地图」导出备份。</p>`}
      <div style="font-size:12px;font-weight:700;color:var(--muted);letter-spacing:1px;margin-bottom:8px">${gate?'输入你的账号':'登录 / 创建账号'}</div>
      <input id="acctName" placeholder="姓名或学号（建议用学号）" maxlength="20" style="width:100%;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:10px;padding:9px 12px;font-size:14px;font-family:inherit;margin-bottom:8px">
      <div style="display:flex;gap:8px">
        <input id="acctPass" type="password" placeholder="口令（可选，机房公用电脑建议设）" maxlength="20" style="flex:1;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:10px;padding:9px 12px;font-size:13px;font-family:inherit">
        <button class="btn primary" id="acctCreate">${gate?'进入学习舱':'进入 / 创建'}</button>
      </div>
      <p id="acctErr" style="font-size:12.5px;color:var(--brick);margin:9px 0 0;display:none"></p>
      <p style="font-size:11.5px;color:var(--muted);margin-top:9px;line-height:1.5">💡 建议用学号作为账户名；名字已存在则验证口令进入，不存在则自动创建。</p>
      ${!gate&&cur?`<div style="border-top:1px solid var(--line);margin-top:16px;padding-top:12px;text-align:right">
        <button id="acctOut" style="border:0;background:transparent;color:var(--brick);font-size:13px;cursor:pointer;font-family:inherit">退出当前账号</button></div>`:''}
      ${!gate?`<div style="text-align:right;margin-top:10px"><button class="btn" id="acctClose">关闭</button></div>`:''}
    </div>`;
    document.body.appendChild(mask);
    return mask;
  }
  function wireCreate(mask){
    const doCreate=()=>{
      const inp=mask.querySelector('#acctName');
      const pi=mask.querySelector('#acctPass');
      enterAccount(mask, inp.value, pi?pi.value:'');
    };
    mask.querySelector('#acctCreate').onclick=doCreate;
    mask.querySelector('#acctName').addEventListener('keydown',e=>{ if(e.key==='Enter')doCreate(); });
    const pi=mask.querySelector('#acctPass');
    if(pi)pi.addEventListener('keydown',e=>{ if(e.key==='Enter')doCreate(); });
  }
  function openDialog(){
    const mask=buildDialog(); if(!mask)return;
    mask.addEventListener('click',e=>{ if(e.target===mask)mask.remove(); });
    wireCreate(mask);
    const out=mask.querySelector('#acctOut');
    if(out)out.onclick=()=>{ try{localStorage.removeItem('v3cur')}catch(e){} V3._cache=null; location.reload(); };
    const cl=mask.querySelector('#acctClose');
    if(cl)cl.onclick=()=>mask.remove();
    const inp=mask.querySelector('#acctName');
    if(!V3.accounts().length)setTimeout(()=>inp.focus(),50);
  }
  /* 门禁：未选账号时锁定全站，创建/选择后刷新放行；教师端页面除外 */
  if(CUR!=='teacher.html' && !V3.cur()){
    render();
    const mask=buildDialog({gate:true});
    wireCreate(mask);
    const inp=mask.querySelector('#acctName');
    setTimeout(()=>inp.focus(),80);
  }else{
    render();
  }
})();
