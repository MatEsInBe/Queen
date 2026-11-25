(function(root){
function countSolutions(reg,n,limit){
  let count=0,first=null;const cols=[];
  (function rec(r,cm,rm,prev){
    if(count>=limit)return;
    if(r===n){count++;if(!first)first=cols.slice();return;}
    for(let c=0;c<n;c++){
      if(cm>>c&1)continue;
      if(prev>=0&&Math.abs(c-prev)<2)continue;
      const g=reg[r][c];if(rm>>g&1)continue;
      cols[r]=c;rec(r+1,cm|1<<c,rm|1<<g,c);
      if(count>=limit)return;
    }
  })(0,0,0,-1);
  return{count,first};
}
function randPerm(n){
  const cols=[];
  function rec(r,used){
    if(r===n)return true;
    const o=[...Array(n).keys()].sort(()=>Math.random()-.5);
    for(const c of o){
      if(used>>c&1)continue;
      if(r&&Math.abs(c-cols[r-1])<2)continue;
      cols[r]=c;if(rec(r+1,used|1<<c))return true;
    }
    return false;
  }
  return rec(0,0)?cols:null;
}
function grow(n,perm){
  const reg=Array.from({length:n},()=>Array(n).fill(-1));
  const fr=[];
  perm.forEach((c,r)=>{reg[r][c]=r;});
  let free=n*n-n;
  while(free>0){
    const g=Math.floor(Math.random()*n);
    const cand=[];
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(reg[r][c]===g){
      for(const[a,b]of[[r+1,c],[r-1,c],[r,c+1],[r,c-1]])
        if(a>=0&&b>=0&&a<n&&b<n&&reg[a][b]<0)cand.push([a,b]);
    }
    if(!cand.length)continue;
    const[a,b]=cand[Math.floor(Math.random()*cand.length)];
    reg[a][b]=g;free--;
  }
  return reg;
}
function connected(reg,n,g,skip){
  let start=null,total=0;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(reg[r][c]===g&&!(r===skip[0]&&c===skip[1])){total++;if(!start)start=[r,c];}
  if(!start)return false;
  const seen=new Set([start[0]*n+start[1]]),st=[start];
  while(st.length){
    const[r,c]=st.pop();
    for(const[a,b]of[[r+1,c],[r-1,c],[r,c+1],[r,c-1]]){
      if(a<0||b<0||a>=n||b>=n||(a===skip[0]&&b===skip[1])||reg[a][b]!==g)continue;
      const k=a*n+b;if(seen.has(k))continue;seen.add(k);st.push([a,b]);
    }
  }
  return seen.size===total;
}

function mkState(n,R){
  const cand=Array.from({length:n},()=>Array(n).fill(true));
  return{n,R,cand,rowQ:Array(n).fill(false),colQ:Array(n).fill(false),regQ:Array(n).fill(false),placed:0};
}
function cloneState(s){return{n:s.n,R:s.R,cand:s.cand.map(r=>r.slice()),rowQ:s.rowQ.slice(),colQ:s.colQ.slice(),regQ:s.regQ.slice(),placed:s.placed};}
function place(s,r,c){
  const{n,R}=s;s.rowQ[r]=s.colQ[c]=s.regQ[R[r][c]]=true;s.placed++;
  for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(a===r||b===c||R[a][b]===R[r][c]||(Math.abs(a-r)<2&&Math.abs(b-c)<2))s.cand[a][b]=false;
}
function lst(s,f){const o=[];for(let a=0;a<s.n;a++)for(let b=0;b<s.n;b++)if(s.cand[a][b]&&f(a,b))o.push([a,b]);return o;}
function dead(s){
  const{n,R}=s;
  for(let g=0;g<n;g++)if(!s.regQ[g]&&!lst(s,(a,b)=>R[a][b]===g).length)return true;
  for(let r=0;r<n;r++)if(!s.rowQ[r]&&!lst(s,a=>a===r).length)return true;
  for(let c=0;c<n;c++)if(!s.colQ[c]&&!lst(s,(a,b)=>b===c).length)return true;
  return false;
}
function kill(s,l){let k=false;l.forEach(([a,b])=>{if(s.cand[a][b]){s.cand[a][b]=false;k=true}});return k;}
function singles(s){
  const{n,R}=s;
  for(let g=0;g<n;g++)if(!s.regQ[g]){const l=lst(s,(a,b)=>R[a][b]===g);if(l.length===1){place(s,l[0][0],l[0][1]);return true}}
  for(let r=0;r<n;r++)if(!s.rowQ[r]){const l=lst(s,a=>a===r);if(l.length===1){place(s,l[0][0],l[0][1]);return true}}
  for(let c=0;c<n;c++)if(!s.colQ[c]){const l=lst(s,(a,b)=>b===c);if(l.length===1){place(s,l[0][0],l[0][1]);return true}}
  return false;
}
function subsets(arr,k){const o=[];(function rec(i,cur){if(cur.length===k){o.push(cur.slice());return}for(let j=i;j<arr.length;j++){cur.push(arr[j]);rec(j+1,cur);cur.pop()}})(0,[]);return o;}
function confine(s,k){
  const{n,R}=s;
  const regs=[...Array(n).keys()].filter(g=>!s.regQ[g]),rows=[...Array(n).keys()].filter(r=>!s.rowQ[r]),cols=[...Array(n).keys()].filter(c=>!s.colQ[c]);
  if(k>regs.length-1)return false;
  for(const sub of subsets(regs,k)){
    const set=new Set(sub),cs=lst(s,(a,b)=>set.has(R[a][b]));
    const rs=new Set(cs.map(x=>x[0])),qs=new Set(cs.map(x=>x[1]));
    if(rs.size===k&&kill(s,lst(s,(a,b)=>rs.has(a)&&!set.has(R[a][b]))))return true;
    if(qs.size===k&&kill(s,lst(s,(a,b)=>qs.has(b)&&!set.has(R[a][b]))))return true;
  }
  for(const sub of subsets(rows,k)){
    const set=new Set(sub),cs=lst(s,a=>set.has(a)),gs=new Set(cs.map(x=>R[x[0]][x[1]]));
    if(gs.size===k&&kill(s,lst(s,(a,b)=>gs.has(R[a][b])&&!set.has(a))))return true;
  }
  for(const sub of subsets(cols,k)){
    const set=new Set(sub),cs=lst(s,(a,b)=>set.has(b)),gs=new Set(cs.map(x=>R[x[0]][x[1]]));
    if(gs.size===k&&kill(s,lst(s,(a,b)=>gs.has(R[a][b])&&!set.has(b))))return true;
  }
  return false;
}
function look0(s){
  for(const[a,b]of lst(s,()=>true)){const t=cloneState(s);place(t,a,b);if(dead(t)){s.cand[a][b]=false;return true}}
  return false;
}
function step(s,level){
  if(singles(s))return true;
  if(level>=2&&confine(s,1))return true;
  if(level>=3&&look0(s))return true;
  if(level>=4){const mk=Math.min(4,Math.floor(s.n/2));for(let k=2;k<=mk;k++)if(confine(s,k))return true;}
  if(level>=4){
    for(const[a,b]of lst(s,()=>true)){
      const t=cloneState(s);place(t,a,b);
      let guard=0;while(!dead(t)&&t.placed<t.n&&guard++<200&&step(t,3)){}
      if(dead(t)){s.cand[a][b]=false;return true}
    }
  }
  return false;
}
function solvesAt(n,R,level){
  const s=mkState(n,R);let guard=0;
  while(s.placed<n&&guard++<500){if(dead(s))return false;if(!step(s,level))return false}
  return s.placed===n;
}
function rate(n,R){for(let L=1;L<=3;L++)if(solvesAt(n,R,L))return L;return 4;}
function generate(n){
  const LIM=300;
  for(let t=0;t<200;t++){
    const p=randPerm(n);if(!p)continue;
    const reg=grow(n,p);
    let cur=countSolutions(reg,n,LIM).count;
    for(let it=0;it<4000&&cur>1;it++){
      const r=Math.floor(Math.random()*n),c=Math.floor(Math.random()*n);
      if(p[r]===c)continue;
      const g=reg[r][c],opts=[];
      for(const[a,b]of[[r+1,c],[r-1,c],[r,c+1],[r,c-1]])
        if(a>=0&&b>=0&&a<n&&b<n&&reg[a][b]!==g)opts.push(reg[a][b]);
      if(!opts.length||!connected(reg,n,g,[r,c]))continue;
      reg[r][c]=opts[Math.floor(Math.random()*opts.length)];
      const k=countSolutions(reg,n,LIM).count;
      if(k>=1&&k<=cur)cur=k;else reg[r][c]=g;
    }
    if(cur===1){const s=countSolutions(reg,n,2);if(s.count===1)return{n,reg,sol:s.first};}
  }
  return null;
}
function generateTier(n,tier,maxMs){
  const t0=Date.now();let best=null,bd=9;
  while(Date.now()-t0<maxMs){const p=generate(n);if(!p)continue;const L=rate(n,p.reg);p.tier=L;
    if(L===tier)return p;if(Math.abs(L-tier)<bd){bd=Math.abs(L-tier);best=p}}
  return best||generate(n);
}
const api={generate,countSolutions,rate,generateTier};
if(typeof module!=='undefined')module.exports=api;else root.QGen=api;
})(this);
