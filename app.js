(function(){
const COL=['#F4C0D1','#FAC775','#B5D4F4','#C0DD97','#CECBF6','#9FE1CB','#F5C4B3','#D3D1C7','#F3E6A0'];
const TN=['','Easy','Medium','Hard','Expert'];const SZ=[5,6,7,8,9];
const $=id=>document.getElementById(id);
const ls={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let tier=ls.get('q.tier',1),HL=null,hlT=null;const CN=['Pink','Amber','Blue','Green','Purple','Teal','Coral','Gray','Yellow'];
const around=false;let auto=ls.get('q.auto',true),level=ls.get('q.level',5),G=null,cells=[],drag=null,last=performance.now(),paused=false;
let S=ls.get('q.stats',null)||{streak:0,bestStreak:0,lv:{}};
function ST(n,t){const k=n+'-'+t;return S.lv[k]||(S.lv[k]={best:null,solved:0,sum:0})}
const fmt=ms=>{const s=Math.floor(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const fmtB=ms=>ms==null?'--':fmt(ms);
function save(){if(G)ls.set('q.game',{n:G.n,tier:G.tier,reg:G.reg,sol:G.sol,st:G.st,el:G.el,hints:G.hints,moves:G.moves,ar:G.ar,undo:G.undo.slice(-100),done:G.done});ls.set('q.stats',S);ls.set('q.level',level);ls.set('q.tier',tier);ls.set('q.auto',auto)}
function newGame(n){
  const p=QGen.generateTier(n,tier,4000);
  const miss=p.tier!==tier;tier=p.tier;
  G={n,tier:p.tier,reg:p.reg,sol:p.sol,st:Array.from({length:n},()=>Array(n).fill(0)),el:0,hints:0,moves:0,ar:{},undo:[],done:false};
  build();save();
  if(miss)$('msg').textContent='Couldn\u2019t find an exact match in time, so this puzzle is '+TN[tier]+'.';
}
const DEFMSG='Tap to cycle. Swipe across cells to mark several.';let hintShown=false;
function clearHL(){HL=null;clearTimeout(hlT);if(hintShown){hintShown=false;$('msg').textContent=DEFMSG}}
function build(){clearHL();
  const n=G.n,g=$('g');g.innerHTML='';cells=[];
  g.style.gridTemplateColumns='repeat('+n+',minmax(0,1fr))';g.style.gridTemplateRows='repeat('+n+',minmax(0,1fr))';g.style.setProperty('--n',n);
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const d=document.createElement('div'),R=G.reg;
    const b=()=>'1px solid rgba(44,44,42,.3)';
    d.style.background=COL[R[r][c]];
    d.style.borderTop=b(r-1,c);d.style.borderLeft=b(r,c-1);d.style.borderBottom=b(r+1,c);d.style.borderRight=b(r,c+1);
    g.appendChild(d);cells.push(d);
  }
  document.querySelectorAll('#lv button').forEach(b=>b.classList.toggle('on',+b.dataset.n===n));
  document.querySelectorAll('#tv button').forEach(b=>b.classList.toggle('on',+b.dataset.t===G.tier));
  $('win').classList.add('hide');$('play').classList.remove('hide');
  $('msg').textContent=DEFMSG;
  draw();
}
function queens(){const q=[];for(let r=0;r<G.n;r++)for(let c=0;c<G.n;c++)if(G.st[r][c]===2)q.push([r,c]);return q}
function bad(q){const b=new Set(),R=G.reg;
  for(let i=0;i<q.length;i++)for(let j=i+1;j<q.length;j++){const[a,x]=q[i],[e,y]=q[j];
    if(a===e||x===y||R[a][x]===R[e][y]||(Math.abs(a-e)<2&&Math.abs(x-y)<2)){b.add(i);b.add(j)}}
  return b}
function edge(set,i,n,w,col){const r=Math.floor(i/n),c=i%n,p=[];
  if(r===0||!set.has(i-n))p.push('inset 0 '+w+'px 0 0 '+col);
  if(r===n-1||!set.has(i+n))p.push('inset 0 -'+w+'px 0 0 '+col);
  if(c===0||!set.has(i-1))p.push('inset '+w+'px 0 0 0 '+col);
  if(c===n-1||!set.has(i+1))p.push('inset -'+w+'px 0 0 0 '+col);
  return p.join(',')}
function draw(){
  const n=G.n,q=queens(),b=bad(q);
  const bs=new Set([...b].map(i=>q[i][0]*n+q[i][1]));
  cells.forEach((d,i)=>{const r=Math.floor(i/n),c=i%n,v=G.st[r][c];
    const au=auto&&v!==2&&q.some(([a,x])=>a===r||x===c||(Math.abs(a-r)<2&&Math.abs(x-c)<2)||G.reg[a][x]===G.reg[r][c]);
    d.textContent=v===2?'♛':(v===1||au)?'×':'';
    d.style.color=v===2&&bs.has(i)?'#A32D2D':'#2C2C2A';
    d.style.opacity='1';
    d.className=v===2?'q':'x';
    d.style.boxShadow=HL&&HL.t.has(i)?edge(HL.t,i,n,4,'#A32D2D'):HL&&HL.c.has(i)?edge(HL.c,i,n,3,'#4a4a47'):'';});
  g.querySelectorAll('.ln').forEach(e=>e.remove());
  if(HL&&HL.lines){const mk=(t,l,w,h)=>{const d=document.createElement('div');d.className='ln';d.style.cssText='position:absolute;pointer-events:none;box-sizing:border-box;border:3px solid #4a4a47;background:rgba(120,120,120,.2);top:'+t+'%;left:'+l+'%;width:'+w+'%;height:'+h+'%';g.appendChild(d)};
    const runs=l=>{const o=[];[...l].sort((x,y)=>x-y).forEach(v=>{const t=o[o.length-1];if(t&&t[1]===v-1)t[1]=v;else o.push([v,v])});return o};
    runs(HL.lines.rows).forEach(([x,y])=>mk(x*100/n,0,100,(y-x+1)*100/n));runs(HL.lines.cols).forEach(([x,y])=>mk(0,x*100/n,(y-x+1)*100/n,100));}
  $('qc').textContent=q.length+' / '+n;
  $('sk').textContent=S.streak;$('bt').textContent=fmtB(ST(n,G.tier).best);
  if(!G.done&&q.length===n&&b.size===0)win();
}
function win(){
  G.done=true;drag=null;
  const s=ST(G.n,G.tier);let line=TN[G.tier]+' '+G.n+'\u00D7'+G.n+': solved in '+fmt(G.el)+'.';
  if(G.hints===0){
    s.solved++;s.sum+=G.el;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);
    if(s.best==null||G.el<s.best){line+=(s.best==null?' First best time.':' New best time!');s.best=G.el}
    else line+=' Best: '+fmt(s.best)+'.';
    line+=' Streak: '+S.streak+'.';
  }else line+=' Hint used, so this solve is not counted in your stats.';
  $('wt').textContent=line;
  $('play').classList.add('hide');$('win').classList.remove('hide');
  $('sk').textContent=S.streak;$('bt').textContent=fmtB(s.best);
  try{navigator.vibrate&&navigator.vibrate([30,40,60])}catch(e){}
  save();
}
function placeAround(r,c){const n=G.n,l=[];for(let a=r-1;a<=r+1;a++)for(let b=c-1;b<=c+1;b++){if((a===r&&b===c)||a<0||b<0||a>=n||b>=n)continue;if(G.st[a][b]===0){G.st[a][b]=1;l.push(a*n+b)}}G.ar[r*n+c]=l}
function clearAround(r,c){const n=G.n,k=r*n+c,l=G.ar[k]||[];delete G.ar[k];const other=new Set();Object.values(G.ar).forEach(x=>x.forEach(i=>other.add(i)));l.forEach(i=>{const a=Math.floor(i/n),b=i%n;if(G.st[a][b]===1&&!other.has(i))G.st[a][b]=0})}
function snap(){G.undo.push(JSON.stringify({s:G.st,a:G.ar}));if(G.undo.length>200)G.undo.shift()}
function at(e){const el=document.elementFromPoint(e.clientX,e.clientY);const i=cells.indexOf(el);return i<0?null:i}
function paint(i){if(drag.seen.has(i))return;drag.seen.add(i);const n=G.n,r=Math.floor(i/n),c=i%n;
  if(G.st[r][c]===2)return;
  if(drag.erase){if(G.st[r][c]===1)G.st[r][c]=0}else if(G.st[r][c]===0)G.st[r][c]=1}
const g=$('g');
g.addEventListener('pointerdown',e=>{if(G.done)return;if(HL){clearHL();draw()}const i=at(e);if(i===null)return;
  const n=G.n,r=Math.floor(i/n),c=i%n;
  drag={start:i,moved:false,seen:new Set(),erase:G.st[r][c]===1,snapped:false};
  try{g.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault()});
g.addEventListener('pointermove',e=>{if(!drag)return;const i=at(e);if(i===null)return;
  if(!drag.moved&&i!==drag.start){drag.moved=true;snap();drag.snapped=true;paint(drag.start)}
  if(drag.moved){paint(i);draw()}});
function end(){if(!drag)return;const n=G.n;
  if(!drag.moved){snap();const r=Math.floor(drag.start/n),c=drag.start%n;{const old=G.st[r][c];G.st[r][c]=(old+1)%3;if(old===1&&around)placeAround(r,c);if(old===2)clearAround(r,c)}
    if(G.st[r][c]===2)try{navigator.vibrate&&navigator.vibrate(10)}catch(x){}}
  G.moves++;drag=null;draw();save()}
g.addEventListener('pointerup',end);g.addEventListener('pointercancel',()=>{drag=null});
function lab(){$('ba').textContent='Auto \u00D7: '+(auto?'On':'Off')}
$('ba').onclick=()=>{auto=!auto;lab();draw();save()};lab();
$('bu').onclick=()=>{if(G.done||!G.undo.length)return;clearHL();{const o=JSON.parse(G.undo.pop());if(Array.isArray(o)){G.st=o;G.ar={}}else{G.st=o.s;G.ar=o.a}}draw();save()};
const nm=g=>'<span class="sw" style="background:'+COL[g]+'"></span><b>'+CN[g]+'</b>';
const pos=(r,c)=>'row '+(r+1)+', column '+(c+1);
function simulate(n,R,q,X){
  const cand=Array.from({length:n},()=>Array(n).fill(true)),rowQ=Array(n).fill(false),colQ=Array(n).fill(false),regQ=Array(n).fill(false);
  const place=(r,c)=>{rowQ[r]=colQ[c]=regQ[R[r][c]]=true;for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(a===r||b===c||R[a][b]===R[r][c]||(Math.abs(a-r)<2&&Math.abs(b-c)<2))cand[a][b]=false};
  const lst=f=>{const o=[];for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(cand[a][b]&&f(a,b))o.push([a,b]);return o};
  const log=[];let dk=null;
  const check=()=>{for(let g=0;g<n;g++)if(!regQ[g]&&!lst((a,b)=>R[a][b]===g).length){dk={k:'g',i:g};return 'the '+nm(g)+' region'}
    for(let r=0;r<n;r++)if(!rowQ[r]&&!lst(a=>a===r).length){dk={k:'r',i:r};return 'row '+(r+1)}
    for(let c=0;c<n;c++)if(!colQ[c]&&!lst((a,b)=>b===c).length){dk={k:'c',i:c};return 'column '+(c+1)}return null};
  q.forEach(([r,c])=>place(r,c));place(X[0],X[1]);
  let steps=0,reason=check();if(reason)return{steps,reason,log,dk};
  const done=t=>{steps++;log.push(t);reason=check();return reason};
  const out=()=>({steps,reason,log,dk});
  let ch=true;
  while(ch){ch=false;
    for(let g=0;g<n;g++)if(!regQ[g]){const l=lst((a,b)=>R[a][b]===g);if(l.length===1){place(l[0][0],l[0][1]);ch=true;if(done('The '+nm(g)+' region has one free cell left, so its queen is forced at '+pos(l[0][0],l[0][1])+'.'))return out()}}
    for(let r=0;r<n;r++)if(!rowQ[r]){const l=lst(a=>a===r);if(l.length===1){place(l[0][0],l[0][1]);ch=true;if(done('Row '+(r+1)+' has one free cell left, so its queen is forced at '+pos(l[0][0],l[0][1])+'.'))return out()}}
    for(let c=0;c<n;c++)if(!colQ[c]){const l=lst((a,b)=>b===c);if(l.length===1){place(l[0][0],l[0][1]);ch=true;if(done('Column '+(c+1)+' has one free cell left, so its queen is forced at '+pos(l[0][0],l[0][1])+'.'))return out()}}
    const kill=l=>{let k=false;l.forEach(([a,b])=>{cand[a][b]=false;k=true});return k};
    for(let g=0;g<n;g++)if(!regQ[g]){const l=lst((a,b)=>R[a][b]===g);if(!l.length)continue;
      if(l.every(([a])=>a===l[0][0])&&kill(lst((a,b)=>a===l[0][0]&&R[a][b]!==g))){ch=true;if(done('All free '+nm(g)+' cells are in row '+(l[0][0]+1)+', so no other color can use that row.'))return out()}
      if(l.every(([,b])=>b===l[0][1])&&kill(lst((a,b)=>b===l[0][1]&&R[a][b]!==g))){ch=true;if(done('All free '+nm(g)+' cells are in column '+(l[0][1]+1)+', so no other color can use that column.'))return out()}}
    for(let r=0;r<n;r++)if(!rowQ[r]){const l=lst(a=>a===r);if(!l.length)continue;const g=R[l[0][0]][l[0][1]];
      if(l.every(([a,b])=>R[a][b]===g)&&kill(lst((a,b)=>R[a][b]===g&&a!==r))){ch=true;if(done('In row '+(r+1)+' only '+nm(g)+' cells are free, so '+nm(g)+' can’t use its cells in other rows.'))return out()}}
    for(let c=0;c<n;c++)if(!colQ[c]){const l=lst((a,b)=>b===c);if(!l.length)continue;const g=R[l[0][0]][l[0][1]];
      if(l.every(([a,b])=>R[a][b]===g)&&kill(lst((a,b)=>R[a][b]===g&&b!==c))){ch=true;if(done('In column '+(c+1)+' only '+nm(g)+' cells are free, so '+nm(g)+' can’t use its cells in other columns.'))return out()}}
  }
  return{steps,reason:null,log,dk:null};
}
window.QSim=simulate;
function hintInfo(logicOnly){
  const n=G.n,R=G.reg,q=queens(),sol=G.sol;
  const line=(r,c)=>q.find(([a,x])=>a===r||x===c||(Math.abs(a-r)<2&&Math.abs(x-c)<2));
  const regq=g=>q.find(([a,x])=>R[a][x]===g);
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(G.st[r][c]===1&&sol[r]===c)return{wrong:[r,c],text:'The \u00D7 at '+pos(r,c)+' is wrong: the queen belongs on that square. Tap it to clear it, or use Undo.'};
  const P=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!line(r,c)&&!regq(R[r][c])&&G.st[r][c]!==1)P.push([r,c]);
  const key=(r,c)=>r*n+c,set=l=>new Set(l.map(([r,c])=>key(r,c)));
  const dkCells=dk=>!dk?[]:P.filter(([r,c])=>dk.k==='g'?R[r][c]===dk.i:dk.k==='r'?r===dk.i:c===dk.i);
  const steps=s=>s.log.map((t,i)=>(i+1)+'. '+t).join('<br>');
  for(const[r,c]of q)if(sol[r]!==c){
    const s=simulate(n,R,q.filter(x=>x[0]!==r),[r,c]);
    let t='The queen at '+pos(r,c)+' can’t be right: no valid solution has a queen there.';
    if(s.reason)t+=' Follow it through:<br>'+(s.log.length?steps(s)+'<br>':'')+'Dead end: '+s.reason+' has no free cell left for its queen.';
    return{wrong:[r,c],text:t+'<br>Undo or remove it.'}}
  const shown=(r,c)=>G.st[r][c]===1||(auto&&!!(line(r,c)||regq(R[r][c])));
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    if(G.st[r][c]===2||shown(r,c))continue;
    const rq=regq(R[r][c]);
    if(rq&&!line(r,c))return{cell:[r,c],hl:set([rq]),text:'The '+nm(R[r][c])+' region already has its queen at '+pos(rq[0],rq[1])+' (outlined). A color gets only one queen, so this cell is out.'};
    const lq=line(r,c);
    if(lq)return{cell:[r,c],hl:set([lq]),text:'This cell is out because it shares a row, column or corner with your queen at '+pos(lq[0],lq[1])+' (outlined).'};
  }
  for(let g=0;g<n;g++){if(regq(g))continue;const pg=P.filter(([r,c])=>R[r][c]===g);
    if(pg.length===1)return{place:true,cell:pg[0],hl:set(pg),text:'The '+nm(g)+' region has only one free cell left, so its queen goes here.'}}
  for(let r=0;r<n;r++){if(q.some(([a])=>a===r))continue;const pr=P.filter(([a])=>a===r);
    if(pr.length===1)return{place:true,cell:pr[0],hl:set(pr),text:'Row '+(r+1)+' has only one free cell left, so its queen goes here.'}}
  for(let c=0;c<n;c++){if(q.some(([,x])=>x===c))continue;const pc=P.filter(([,b])=>b===c);
    if(pc.length===1)return{place:true,cell:pc[0],hl:set(pc),text:'Column '+(c+1)+' has only one free cell left, so its queen goes here.'}}
  const many=cs=>cs.length>1,isare=cs=>many(cs)?'These cells are':'This cell is';
  const un=l=>l.filter(([a,b])=>!shown(a,b));
  const jn=l=>l.length<2?l.join(''):l.slice(0,-1).join(', ')+' and '+l[l.length-1];
  for(let g=0;g<n;g++){
    if(regq(g))continue;const pg=P.filter(([r,c])=>R[r][c]===g);if(!pg.length)continue;
    if(pg.every(([r])=>r===pg[0][0])){const r=pg[0][0],cs=un(P.filter(([a,b])=>a===r&&R[a][b]!==g));
      if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:[r],cols:[]},text:'Every free '+nm(g)+' cell is in row '+(r+1)+' (grey frame), so the '+nm(g)+' queen must be in that row. No other color can use row '+(r+1)+': put an X on its other squares. '+isare(cs)+' out.'}}
    if(pg.every(([,c])=>c===pg[0][1])){const c=pg[0][1],cs=un(P.filter(([a,b])=>b===c&&R[a][b]!==g));
      if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:[],cols:[c]},text:'Every free '+nm(g)+' cell is in column '+(c+1)+' (grey frame), so the '+nm(g)+' queen must be in that column. No other color can use column '+(c+1)+': put an X on its other squares. '+isare(cs)+' out.'}}
  }
  for(let r=0;r<n;r++){const pr=P.filter(([a])=>a===r);if(!pr.length)continue;const g=R[pr[0][0]][pr[0][1]];
    if(pr.every(([a,b])=>R[a][b]===g)){const cs=un(P.filter(([a,b])=>R[a][b]===g&&a!==r));
      if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:[r],cols:[]},text:'The only free squares in row '+(r+1)+' (grey frame) are '+nm(g)+'. So the '+nm(g)+' queen must be in row '+(r+1)+': put an X on its squares outside that row. '+isare(cs)+' out.'}}}
  for(let c=0;c<n;c++){const pc=P.filter(([,b])=>b===c);if(!pc.length)continue;const g=R[pc[0][0]][pc[0][1]];
    if(pc.every(([a,b])=>R[a][b]===g)){const cs=un(P.filter(([a,b])=>R[a][b]===g&&b!==c));
      if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:[],cols:[c]},text:'The only free squares in column '+(c+1)+' (grey frame) are '+nm(g)+'. So the '+nm(g)+' queen must be in column '+(c+1)+': put an X on its squares outside that column. '+isare(cs)+' out.'}}}
  const regs=[...Array(n).keys()].filter(g=>!regq(g)),rows=[...Array(n).keys()].filter(r=>!q.some(([a])=>a===r)),cols=[...Array(n).keys()].filter(c=>!q.some(([,b])=>b===c));
  const subs=(arr,k)=>{const o=[];(function rec(i,cur){if(cur.length===k){o.push(cur.slice());return}for(let j=i;j<arr.length;j++){cur.push(arr[j]);rec(j+1,cur);cur.pop()}})(0,[]);return o};
  for(let k=2;k<=Math.min(4,regs.length-1);k++){
    for(const sub of subs(regs,k)){const gs=new Set(sub),own=P.filter(([r,c])=>gs.has(R[r][c]));if(!own.length)continue;
      const rs=[...new Set(own.map(x=>x[0]))].sort((x,y)=>x-y),cl=[...new Set(own.map(x=>x[1]))].sort((x,y)=>x-y),names=jn(sub.map(nm));
      if(rs.length===k){const cs=un(P.filter(([a,b])=>rs.includes(a)&&!gs.has(R[a][b])));
        if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:rs,cols:[]},text:'The '+names+' regions have all their free squares in just '+k+' rows (grey frames): '+jn(rs.map(x=>x+1))+'. Those '+k+' regions will use up those '+k+' rows, so any other queen in them would leave a region without a row. Put an X on the other squares of those rows. '+isare(cs)+' out.'}}
      if(cl.length===k){const cs=un(P.filter(([a,b])=>cl.includes(b)&&!gs.has(R[a][b])));
        if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:[],cols:cl},text:'The '+names+' regions have all their free squares in just '+k+' columns (grey frames): '+jn(cl.map(x=>x+1))+'. Those '+k+' regions will use up those '+k+' columns, so any other queen in them would leave a region without a column. Put an X on the other squares of those columns. '+isare(cs)+' out.'}}}
    for(const sub of subs(rows,k)){const rr=new Set(sub),own=P.filter(([r])=>rr.has(r));if(!own.length)continue;
      const gl=[...new Set(own.map(([r,c])=>R[r][c]))].sort((x,y)=>x-y);
      if(gl.length===k){const gs=new Set(gl),cs=un(P.filter(([a,b])=>gs.has(R[a][b])&&!rr.has(a)));
        if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:sub,cols:[]},text:'Rows '+jn(sub.map(x=>x+1))+' (grey frames) only have free squares in the '+jn(gl.map(nm))+' regions. Those '+k+' rows will hold those '+k+' regions’ queens, so those regions can’t use any other row. Put an X on their squares elsewhere. '+isare(cs)+' out.'}}}
    for(const sub of subs(cols,k)){const cc=new Set(sub),own=P.filter(([,c])=>cc.has(c));if(!own.length)continue;
      const gl=[...new Set(own.map(([r,c])=>R[r][c]))].sort((x,y)=>x-y);
      if(gl.length===k){const gs=new Set(gl),cs=un(P.filter(([a,b])=>gs.has(R[a][b])&&!cc.has(b)));
        if(cs.length)return{cells:cs,cell:cs[0],lines:{rows:[],cols:sub},text:'Columns '+jn(sub.map(x=>x+1))+' (grey frames) only have free squares in the '+jn(gl.map(nm))+' regions. Those '+k+' columns will hold those '+k+' regions’ queens, so those regions can’t use any other column. Put an X on their squares elsewhere. '+isare(cs)+' out.'}}}
  }
  for(const x of P){if(shown(x[0],x[1]))continue;const s=simulate(n,R,q,x);
    if(s.reason&&s.steps===0)return{cell:x,hl:set(dkCells(s.dk)),text:'A queen here would block every free square of '+s.reason+' (outlined), through its row, column or corners. That leaves it with no queen, so this cell is out.'}}
  if(logicOnly)return null;
  const cnt={};P.forEach(([r,c])=>{cnt[R[r][c]]=(cnt[R[r][c]]||0)+1});
  const cands=P.filter(([r,c])=>sol[r]!==c&&!shown(r,c)).map(x=>({x,s:simulate(n,R,q,x),z:cnt[R[x[0]][x[1]]]}));
  cands.sort((u,v)=>(u.s.reason?0:1)-(v.s.reason?0:1)||(u.s.reason&&v.s.reason?u.s.steps-v.s.steps:0)||u.z-v.z);
  if(cands.length){const{x,s}=cands[0];let t;
    if(!s.reason)t='No simple deduction is left. No valid solution has a queen here, but the dead end needs deeper searching than simple steps.';
    else t='No simple deduction is left. A queen here leads to a dead end. Imagine it there:<br>'+steps(s)+'<br>Dead end: '+s.reason+' has no free cell left for its queen.';
    return{cell:x,hl:set(dkCells(s.dk)),text:t}}
  return null;
}
const legend=h=>'<br><small style="color:var(--mut)">Red outline: the square'+'s the hint changes.'+(h?' Grey: the rows, columns or squares behind the reasoning.':'')+'</small>';
function applyHint(info){
  clearHL();const n=G.n;
  if(info&&info.wrong){G.hints++;HL={t:new Set([info.wrong[0]*n+info.wrong[1]]),c:new Set()};$('msg').innerHTML=info.text+legend(false)}
  else if(info){snap();
    const cs=info.cells||[info.cell];
    if(info.place){const[r,c]=info.cell;G.st[r][c]=2}else cs.forEach(([r,c])=>{if(G.st[r][c]===0)G.st[r][c]=1});
    G.hints++;const tg=new Set(cs.map(([r,c])=>r*n+c)),ev=new Set([...(info.hl||[])].filter(i=>!tg.has(i)));HL={t:tg,c:ev,lines:info.lines||null};$('msg').innerHTML=info.text+legend(ev.size>0||!!info.lines)}
  else{
    let row=-1;for(let r=0;r<n;r++)if(G.st[r][G.sol[r]]!==2){row=r;break}
    if(row<0)return;snap();
    for(let c=0;c<n;c++)if(G.st[row][c]===2){G.st[row][c]=0;clearAround(row,c)}
    G.st[row][G.sol[row]]=2;G.hints++;
    HL={t:new Set([row*n+G.sol[row]]),c:new Set()};
    $('msg').innerHTML='Every other cell is ruled out, so the queen for row '+(row+1)+' goes at column '+(G.sol[row]+1)+'.';
  }
  hintShown=true;hlT=setTimeout(()=>{HL=null;hintShown=false;$('msg').textContent=DEFMSG;draw()},6000);
  draw();save();
}
$('bh').onclick=()=>{if(G.done)return;applyHint(hintInfo(true)||hintInfo(false))};
$('bz').onclick=()=>{if(G.done)return;clearHL();snap();G.st.forEach(r=>r.fill(0));G.ar={};$('msg').textContent='Board cleared. Tap Undo to bring it back.';draw();save()};
$('bn').onclick=()=>{if(!G.done&&G.moves>0&&G.hints===0&&S.streak>0){S.streak=0}newGame(level)};
$('pa').onclick=()=>newGame(level);
$('bs').onclick=()=>{
  let h='<tr><th>Best time</th>'+[1,2,3,4].map(t=>'<th>'+TN[t]+'</th>').join('')+'</tr>';let tot=0;
  for(const n of SZ){h+='<tr><td>'+n+'\u00D7'+n+'</td>'+[1,2,3,4].map(t=>{const s=ST(n,t);tot+=s.solved;return '<td>'+fmtB(s.best)+'</td>'}).join('')+'</tr>'}
  h+='<tr><td>Solved</td><td colspan="4">'+tot+' puzzles</td></tr><tr><td>Streak</td><td colspan="4">'+S.streak+' (best '+S.bestStreak+')</td></tr>';
  $('stt').innerHTML=h;$('ov').style.display='flex'};
$('cl').onclick=()=>{$('ov').style.display='none'};
$('rst').onclick=()=>{S={streak:0,bestStreak:0,lv:{}};save();$('bs').onclick();draw()};
const lv=$('lv'),tv=$('tv');
function chg(){if(!G.done&&G.moves>0&&G.hints===0)S.streak=0;newGame(level)}
SZ.forEach(n=>{const b=document.createElement('button');b.dataset.n=n;b.textContent=n+'\u00D7'+n;
  b.onclick=()=>{if(n===level&&!G.done)return;level=n;chg()};lv.appendChild(b)});
[1,2,3,4].forEach(t=>{const b=document.createElement('button');b.dataset.t=t;b.textContent=TN[t];
  b.onclick=()=>{if(t===tier&&!G.done)return;tier=t;chg()};tv.appendChild(b)});
setInterval(()=>{const now=performance.now(),dt=now-last;last=now;
  if(G&&!G.done&&!paused&&!document.hidden&&$('ov').style.display!=='flex'){G.el+=dt;$('tm').textContent=fmt(G.el)}},250);
document.addEventListener('visibilitychange',()=>{last=performance.now();save()});
addEventListener('pagehide',save);
const saved=ls.get('q.game',null);
if(saved&&saved.reg&&!saved.done){G=Object.assign({tier:1},saved,{undo:saved.undo||[],ar:saved.ar||{}});level=G.n;tier=G.tier;build()}else newGame(level);
$('tm').textContent=fmt(G.el);
try{if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
})();
