const $=id=>document.getElementById(id),cv=$("cv"),mainCtx=cv.getContext("2d");let ctx=mainCtx,exCv=null,exCtx=null;
const AR={"9:16":[9,16],"1:1":[1,1],"4:5":[4,5],"16:9":[16,9]};
const cam={x:0,y:0,z:0,r:0,p:0,t:0};let focus=10,ap=1,layers=[],uid=0,W=540,H=960,T=0,dur=4,kf=[],raf=null,sel=null,showSel=true,vk=1,selCam=false,blurOn=true,defEase="smooth",ksel=null;
const tmp=document.createElement("canvas"),tctx=tmp.getContext("2d",{willReadFrequently:true});
const REAL=(()=>{try{const c=document.createElement("canvas");c.width=c.height=24;const x=c.getContext("2d");if(!("filter" in x))return false;x.filter="blur(6px)";x.fillRect(8,8,8,8);x.filter="none";return x.getImageData(2,12,1,1).data[3]>0}catch(e){return false}})();

function svg(s){return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">'+s+'</svg>')}
function mips(l){const im=l.img,ms=[{s:im,w:im.naturalWidth}];let c=im,w=im.naturalWidth,h=im.naturalHeight;
  while(w>40&&h>40){w=Math.ceil(w/2);h=Math.ceil(h/2);const k=document.createElement("canvas");k.width=w;k.height=h;const x=k.getContext("2d");x.imageSmoothingQuality="high";x.drawImage(c,0,0,w,h);ms.push({s:k,w});c=k}
  l.mips=ms}
function setSrc(l,src,keep){l.lv=null;l.img=new Image();l.img.onload=()=>{mips(l);render();buildList();if(!REAL)setTimeout(()=>{if(!l.lv&&l.img.naturalWidth)l.lv=levels(l)},30)};l.img.src=src;if(!keep){l.orig=src;l.src0=new Image();l.src0.src=src}}
function mk(name,src,d,fill){const l={id:++uid,name,d,d0:d,fill:!!fill,sc:1,rot:0,ox:0,oy:0,mips:[],orig:"",img:new Image(),src0:new Image(),tr:{d:[],sc:[],rot:[],ox:[],oy:[]}};if(src)setSrc(l,src);layers.push(l);return l}
mk("Background",svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb37a"/><stop offset="1" stop-color="#6a5acd"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><circle cx="220" cy="120" r="34" fill="#fff3c4"/><path d="M0 300 L70 230 L140 290 L210 220 L300 300 V400 H0Z" fill="#3b3470"/>'),16,true);
sel=mk("Man",svg('<circle cx="150" cy="170" r="30" fill="#20232d"/><path d="M98 400 L104 235 Q150 198 196 235 L202 400Z" fill="#20232d"/>'),10);
mk("Flowers",svg('<g stroke="#2e8b57" stroke-width="5"><path d="M40 400V330M90 400V350M215 400V335M265 400V345"/></g><circle cx="40" cy="325" r="22" fill="#ff5d8f"/><circle cx="90" cy="345" r="18" fill="#ffd23f"/><circle cx="215" cy="330" r="24" fill="#ff7b54"/><circle cx="265" cy="340" r="19" fill="#f48fb1"/>'),4);

let arK="9:16",Q=REAL?720:540;
function setAR(k,q){if(raf)return;arK=k||arK;Q=q||Q;const [a,b]=AR[arK],ev=v=>Math.round(v/2)*2;
  if(a<=b){W=Q;H=ev(Q*b/a)}else{H=Q;W=ev(Q*a/b)}cv.width=W;cv.height=H;
  document.querySelectorAll("#ars button").forEach(x=>x.classList.toggle("on",x.dataset.k===arK));
  document.querySelectorAll("#qs button").forEach(x=>x.classList.toggle("on",+x.dataset.q===Q));render()}
Object.keys(AR).forEach(k=>{const b=document.createElement("button");b.className="ghost";b.textContent=k;b.dataset.k=k;b.onclick=()=>setAR(k);$("ars").appendChild(b)});
[[540,"Standard"],[720,"HD"],[1080,"Full HD"]].forEach(([q,n])=>{const b=document.createElement("button");b.className="ghost";b.textContent=n;b.dataset.q=q;b.onclick=()=>setAR(null,q);$("qs").appendChild(b)});

/* ---- smooth blur that works on every browser ---- */
function boxPass(a,w,h,r,horiz){
  const ri=Math.floor(r),fr=r-ri,n=horiz?w:h,m=horiz?h:w,st=horiz?4:4*w,ls=horiz?4*w:4,inv=1/(2*ri+1+2*fr),line=new Float32Array(n*4);
  const cl=j=>j<0?0:j>=n?n-1:j;
  for(let j=0;j<m;j++){const base=j*ls;
    for(let c=0;c<4;c++){let sum=0;for(let i=-ri;i<=ri;i++)sum+=a[base+cl(i)*st+c];
      for(let i=0;i<n;i++){const hi=a[base+cl(i+ri+1)*st+c];
        line[i*4+c]=(sum+fr*(a[base+cl(i-ri-1)*st+c]+hi))*inv;sum+=hi-a[base+cl(i-ri)*st+c]}}
    for(let i=0;i<n;i++){const o=base+i*st;a[o]=line[i*4];a[o+1]=line[i*4+1];a[o+2]=line[i*4+2];a[o+3]=line[i*4+3]}}
}
const SIG=[0.75,1.5,3,6,12,24];
function levels(l){
  const im=l.img,sc=Math.min(1,384/Math.max(im.naturalWidth,im.naturalHeight)),lw=Math.max(2,Math.round(im.naturalWidth*sc)),lh=Math.max(2,Math.round(im.naturalHeight*sc));
  let m=l.mips[0];for(const q of l.mips){if(q.w>=lw)m=q;else break}
  const out=SIG.map(sg=>{
    const r=(Math.sqrt(1+4*sg*sg)-1)/2,p=Math.ceil(sg*3+2);
    const c=document.createElement("canvas");c.width=lw+2*p;c.height=lh+2*p;const x=c.getContext("2d",{willReadFrequently:true});
    x.imageSmoothingQuality="high";x.drawImage(m.s,p,p,lw,lh);
    const d=x.getImageData(0,0,c.width,c.height),a=d.data;
    for(let i=0;i<a.length;i+=4){const f=a[i+3]/255;a[i]*=f;a[i+1]*=f;a[i+2]*=f}
    for(let t=0;t<3;t++){boxPass(a,c.width,c.height,r,true);boxPass(a,c.width,c.height,r,false)}
    for(let i=0;i<a.length;i+=4){const f=a[i+3]/255;if(f>0){a[i]/=f;a[i+1]/=f;a[i+2]/=f}}
    x.putImageData(d,0,0);return{c,p}});
  return{lw,lh,out};
}
function blurDraw(l,x,y,w,h,b){
  const im=l.img;
  if(b<0.15){ctx.drawImage(im,x,y,w,h);return}
  if(REAL){ctx.filter="blur("+(b*vk).toFixed(1)+"px)";ctx.drawImage(im,x,y,w,h);ctx.filter="none";return}
  const lv=l.lv||(l.lv=levels(l)),sl=b*lv.lw/w,S=[0].concat(SIG);
  ctx.imageSmoothingQuality="high";
  if(sl<0.04){ctx.drawImage(im,x,y,w,h);return}
  let i=0;while(i<S.length-2&&sl>=S[i+1])i++;
  const t=Math.min(1,(sl-S[i])/(S[i+1]-S[i])),kx=w/lv.lw,ky=h/lv.lh;
  const put=e=>ctx.drawImage(e.c,x-e.p*kx,y-e.p*ky,e.c.width*kx,e.c.height*ky);
  if(i===0)ctx.drawImage(im,x,y,w,h);else put(lv.out[i-1]);
  ctx.globalAlpha=t;put(lv.out[i]);ctx.globalAlpha=1;
}

let selBox=null;
function geom(l){
  const im=l.img;if(!im.naturalWidth)return null;
  const dist=l.d-cam.z;if(dist<.4)return null;const u=W/360;
  const s=l.d0/dist,fit=(l.fill?Math.max:Math.min)(W/im.naturalWidth,H/im.naturalHeight)*(l.fill?1.3:1)*l.sc;
  const dw=im.naturalWidth*fit*s,dh=im.naturalHeight*fit*s;
  const cx=W/2+l.ox*u*s-cam.x*60/dist*u,cy=H/2+l.oy*u*s+cam.y*60/dist*u;
  return{dist,s,u,x:cx-dw/2,y:cy-dh/2,w:dw,h:dh}
}
function render(){
  const rec=!!exCv,main=ctx;if(rec)ctx=exCtx;
  const ov=!rec&&$("outOn").checked&&showSel;vk=ov?.6:1;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=ov?"#15161a":"#000";ctx.fillRect(0,0,W,H);selBox=null;
  if(ov){ctx.save();ctx.translate(W/2,H/2);ctx.scale(vk,vk);ctx.translate(-W/2,-H/2)}
  ctx.save();ctx.translate(W/2,H/2);ctx.rotate(cam.r*Math.PI/180);ctx.translate(-W/2,-H/2+W/6*Math.tan(cam.t*Math.PI/180));
  const fdist=Math.max(.4,focus);
  layers.slice().sort((a,b)=>b.d-a.d).forEach(l=>{
    const g=geom(l);if(!g)return;
    const b=Math.min(28,(blurOn?ap:0)*150*Math.abs(1/g.dist-1/fdist))*g.u;
    ctx.save();ctx.translate(g.x+g.w/2,g.y+g.h/2);ctx.rotate(l.rot*Math.PI/180);ctx.translate(-g.x-g.w/2,-g.y-g.h/2);blurDraw(l,g.x,g.y,g.w,g.h,b);ctx.restore();
    if(l===sel)selBox=g;
  });
  if(!rec&&showSel&&selBox){ctx.save();ctx.setLineDash([10,8]);ctx.lineWidth=3;ctx.strokeStyle="#6b9bff";ctx.translate(selBox.x+selBox.w/2,selBox.y+selBox.h/2);ctx.rotate(sel.rot*Math.PI/180);ctx.strokeRect(-selBox.w/2,-selBox.h/2,selBox.w,selBox.h);
    ctx.restore();drawHandles()}
  ctx.restore();
  if(ov){ctx.restore();const fx=W*(1-vk)/2,fy=H*(1-vk)/2,fw=W*vk,fh=H*vk;ctx.save();ctx.fillStyle="rgba(0,0,0,.55)";ctx.beginPath();ctx.rect(0,0,W,H);ctx.rect(fx,fy,fw,fh);ctx.fill("evenodd");ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(2,W/270);ctx.strokeRect(fx,fy,fw,fh);ctx.font=Math.round(W/26)+"px system-ui";ctx.fillStyle="#fff";ctx.fillText(arK+" frame",fx,fy-8);ctx.restore()}
  ctx=main;if(rec)mainCtx.drawImage(exCv,0,0);else autosave();
  $("tl").textContent=T.toFixed(1)+"/"+dur+"s";
  drawTop();
}
function syncUI(){$("cz").value=cam.z;$("cx").value=cam.x;$("cy").value=cam.y;$("fd").value=focus;$("ap").value=ap;$("cr").value=cam.r;$("ct").value=cam.t;$("tm").value=T;
  document.querySelectorAll(".kb:not(.lkb)").forEach(b=>{const a=tr[b.dataset.p]||[];b.classList.toggle("on",a.some(o=>Math.abs(o.t-T)<=.05));b.classList.toggle("an",a.length>0)})}
function syncSel(){if(!sel)return;[["sz","sc"],["rt","rot"],["ox","ox"],["oy","oy"],["dp","d"]].forEach(([i,k])=>{const e=$(i);if(e)e.value=sel[k]});
  document.querySelectorAll(".lkb").forEach(b=>{const a=sel.tr[b.dataset.k]||[];b.classList.toggle("on",a.some(o=>Math.abs(o.t-T)<=.05));b.classList.toggle("an",a.length>0)})}

/* ---- keyframes: one track per setting ---- */
const EASE={smooth:u=>u*u*(3-2*u),linear:u=>u,in:u=>u*u,out:u=>1-(1-u)*(1-u),hold:u=>u<1?0:1,back:u=>{const c=1.70158,d=u-1;return 1+(c+1)*d*d*d+c*d*d}};
const PR=[["z","cz","Front / back"],["x","cx","Left / right"],["y","cy","Up / down"],["f","fd","Focus distance"],["a","ap","Blur amount"],["r","cr","Roll"],["t","ct","Tilt"]];
const GET={z:()=>cam.z,x:()=>cam.x,y:()=>cam.y,f:()=>focus,a:()=>ap,r:()=>cam.r,t:()=>cam.t};
const SET={z:v=>{cam.z=v},x:v=>{cam.x=v},y:v=>{cam.y=v},f:v=>{focus=v},a:v=>{ap=v},r:v=>{cam.r=v},t:v=>{cam.t=v}};
const tr={z:[],x:[],y:[],f:[],a:[],r:[],t:[]};
function sampleTrack(a,t){
  if(!a.length)return null;const s=a.slice().sort((p,q)=>p.t-q.t);
  if(t<=s[0].t)return s[0].v;if(t>=s[s.length-1].t)return s[s.length-1].v;
  for(let i=0;i<s.length-1;i++){const p=s[i],q=s[i+1];if(t>=p.t&&t<=q.t){const f0=(t-p.t)/(q.t-p.t),u=p.e==="custom"&&p.bz?bezEase(p.bz,f0):(EASE[p.e]||EASE.smooth)(f0);return p.v+(q.v-p.v)*u}}
  return null}
function setTime(t){T=Math.max(0,Math.min(dur,t));applyAt(T);syncUI();syncSel();render()}
function putKey(k){tr[k]=tr[k].filter(o=>Math.abs(o.t-T)>.05);tr[k].push({t:T,v:GET[k](),e:defEase});drawKF();syncUI()}
function setKey_old(k){tr[k]=tr[k].filter(o=>Math.abs(o.t-T)>.05);tr[k].push({t:T,v:GET[k](),e:defEase});drawKF();syncUI()}
const LP=[["d","Depth"],["sc","Size"],["rot","Tilt"],["ox","Left / right"],["oy","Up / down"]];
function applyAt(t){PR.forEach(([k])=>{const v=sampleTrack(tr[k],t);if(v!==null)SET[k](v)});layers.forEach(l=>LP.forEach(([k])=>{const v=sampleTrack(l.tr[k],t);if(v!==null)l[k]=v}))}
const kpos=t=>"calc(8px + (100% - 16px) * "+Math.min(1,t/dur)+")";
function drawMarks(){
  const m=$("marks");m.innerHTML="";const ts=[];
  const add=a=>a.forEach(o=>{if(!ts.some(t=>Math.abs(t-o.t)<.05))ts.push(o.t)});
  PR.forEach(([k])=>add(tr[k]));layers.forEach(l=>LP.forEach(([k])=>add(l.tr[k])));
  ts.forEach(t=>{const b=document.createElement("button");b.className="mk";b.textContent="◆";b.style.left=kpos(t);b.onclick=()=>setTime(t);m.appendChild(b)});
}
function putLayerKey(l,k){l.tr[k]=l.tr[k].filter(o=>Math.abs(o.t-T)>.05);l.tr[k].push({t:T,v:l[k],e:defEase})}
function setKey(k){const had=tr[k].some(o=>Math.abs(o.t-T)<=.05);if(had){tr[k]=tr[k].filter(o=>Math.abs(o.t-T)>.05);drawKF();syncUI()}else putKey(k)}
function setLayerKey(l,k){const had=l.tr[k].some(o=>Math.abs(o.t-T)<=.05);if(had)l.tr[k]=l.tr[k].filter(o=>Math.abs(o.t-T)>.05);else putLayerKey(l,k);drawKF();syncSel()}
function allTracks(){const a=[];PR.forEach(([k])=>a.push([()=>tr[k],v=>{tr[k]=v}]));layers.forEach(l=>LP.forEach(([k])=>a.push([()=>l.tr[k],v=>{l.tr[k]=v}])));return a}
function say(m){$("st").textContent=m;setTimeout(()=>{if($("st").textContent===m)$("st").textContent=""},2500)}
function removeKeysAt(){let n=0;allTracks().forEach(([g,st])=>{const f=g().filter(o=>Math.abs(o.t-T)>.05);n+=g().length-f.length;st(f)});ksel=null;drawKF();syncUI();syncSel();say(n?"Removed "+n+" keyframe"+(n>1?"s":"")+" at "+T.toFixed(1)+"s":"No keyframes at "+T.toFixed(1)+"s")}
function shiftKeys(dt){allTracks().forEach(([g])=>g().forEach(o=>{if(Math.abs(o.t-T)<=.05)o.t=Math.max(0,Math.min(dur,Math.round((o.t+dt)*100)/100))}));T=Math.max(0,Math.min(dur,Math.round((T+dt)*100)/100));drawKF();setTime(T)}
function clearAllKeys(){if(!confirm("Remove ALL keyframes?"))return;allTracks().forEach(([g,st])=>st([]));ksel=null;drawKF();syncUI();syncSel()}
function drawKF(){
  const box=$("kfs");box.innerHTML="";const tracks=[];
  PR.forEach(([k,id,name])=>tracks.push(["Camera · "+name,()=>tr[k],v=>{tr[k]=v}]));
  layers.forEach(l=>LP.forEach(([k,nm])=>tracks.push([l.name+" · "+nm,()=>l.tr[k],v=>{l.tr[k]=v}])));
  tracks.forEach(([label,get,set])=>{const a0=get();if(!a0.length)return;
    const row=document.createElement("div");row.className="lane";
    const lb=document.createElement("small");lb.textContent=label;row.appendChild(lb);
    const ln=document.createElement("div");ln.className="ln";
    a0.forEach(o=>{const d=document.createElement("button");d.className="dm"+(ksel&&ksel.o===o?" on":"");d.textContent="◆";d.style.left=kpos(o.t);
      d.onpointerdown=e=>{e.preventDefault();ksel={get,set,o,label};d.setPointerCapture(e.pointerId);const r=ln.getBoundingClientRect();
        d.onpointermove=ev=>{o.t=Math.max(0,Math.min(dur,Math.round((ev.clientX-r.left-8)/(r.width-16)*dur*20)/20));d.style.left=kpos(o.t)};
        d.onpointerup=()=>{d.onpointermove=d.onpointerup=null;setTime(o.t);drawKF()};drawKFed()};
      ln.appendChild(d)});
    row.appendChild(ln);box.appendChild(row)});
  if(!box.children.length)box.innerHTML="<small>No keyframes yet. Tap ◆+ to add some.</small>";
  drawKFed();drawMarks();
}
function bezEase(b,u){let lo=0,hi=1,t=u;for(let i=0;i<24;i++){const x=3*(1-t)*(1-t)*t*b[0]+3*(1-t)*t*t*b[2]+t*t*t;if(x<u)lo=t;else hi=t;t=(lo+hi)/2}return 3*(1-t)*(1-t)*t*b[1]+3*(1-t)*t*t*b[3]+t*t*t}
function curveEd(host,o){
  const c=document.createElement("canvas");c.width=220;c.height=200;c.style.cssText="width:220px;height:200px;margin-top:8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);touch-action:none;display:block";host.appendChild(c);
  const x=c.getContext("2d"),px=u=>20+u*180,py=v=>160-v*120;let hd=-1;
  const draw=()=>{const b=o.bz;x.clearRect(0,0,220,200);x.strokeStyle="rgba(128,128,128,.45)";x.lineWidth=1;x.strokeRect(px(0),py(1),180,120);
    x.beginPath();x.moveTo(px(0),py(0));x.lineTo(px(b[0]),py(b[1]));x.moveTo(px(1),py(1));x.lineTo(px(b[2]),py(b[3]));x.stroke();
    x.strokeStyle="#6b9bff";x.lineWidth=3;x.beginPath();for(let i=0;i<=40;i++){const u=i/40,v=bezEase(b,u);i?x.lineTo(px(u),py(v)):x.moveTo(px(u),py(v))}x.stroke();
    x.fillStyle="#ff9f43";[[b[0],b[1]],[b[2],b[3]]].forEach(([a,v])=>{x.beginPath();x.arc(px(a),py(v),8,0,7);x.fill()})};
  const pt=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*220/r.width,(e.clientY-r.top)*200/r.height]};
  c.onpointerdown=e=>{const[mx,my]=pt(e),b=o.bz;hd=Math.hypot(mx-px(b[0]),my-py(b[1]))<Math.hypot(mx-px(b[2]),my-py(b[3]))?0:1;c.setPointerCapture(e.pointerId);c.onpointermove(e)};
  c.onpointermove=e=>{if(hd<0)return;const[mx,my]=pt(e);o.bz[hd*2]=Math.max(0,Math.min(1,(mx-20)/180));o.bz[hd*2+1]=Math.max(-.25,Math.min(1.25,(160-my)/120));draw();setTime(T)};
  c.onpointerup=()=>{hd=-1};draw();
}
const EOPT=[["smooth","Smooth"],["linear","Linear"],["in","Ease in"],["out","Ease out"],["back","Overshoot"],["hold","Hold"],["custom","Custom curve"]];
function drawKFed(){
  const e=$("kfed");e.innerHTML="";if(!ksel)return;const{o,get,set,label}=ksel;
  e.innerHTML='<b></b><div class="row" style="margin-top:4px"><label style="margin:0"><span style="width:auto">Easing to next key</span><select></select></label><label style="margin:0"><span style="width:auto">Time</span><input type="number" step="0.05" style="width:70px"></label><button class="ghost nd" data-d="-0.1">◀ 0.1s</button><button class="ghost nd" data-d="0.1">0.1s ▶</button><button class="ghost" id="kdel">Delete</button></div>';
  e.querySelector("b").textContent=label+" @ "+o.t.toFixed(2)+"s";
  const sl=e.querySelector("select");EOPT.forEach(([v,n])=>{const op=document.createElement("option");op.value=v;op.textContent=n;sl.appendChild(op)});sl.value=o.e||"smooth";sl.onchange=()=>{o.e=sl.value;if(o.e==="custom"&&!o.bz)o.bz=[.42,0,.58,1];setTime(T);drawKFed()};
  const ti=e.querySelector("input");ti.value=o.t;ti.onchange=()=>{o.t=Math.max(0,Math.min(dur,+ti.value||0));drawKF()};
  e.querySelectorAll(".nd").forEach(b=>b.onclick=()=>{o.t=Math.max(0,Math.min(dur,Math.round((o.t+ +b.dataset.d)*100)/100));drawKF()});
  e.querySelector("#kdel").onclick=()=>{set(get().filter(q=>q!==o));ksel=null;drawKF();syncUI();syncSel()};
  if(o.e==="custom"&&o.bz)curveEd(e,o);
}
PR.forEach(([k,id])=>{const b=document.createElement("button");b.className="ghost kb";b.textContent="◆";b.title="Keyframe this setting at the current time";b.dataset.p=k;b.onclick=()=>setKey(k);$(id).parentElement.appendChild(b)});
$("kcam").onclick=()=>{PR.forEach(([k])=>putKey(k))};
$("addk").onclick=()=>{PR.forEach(([k])=>putKey(k));layers.forEach(l=>LP.forEach(([k])=>putLayerKey(l,k)));drawKF();syncSel()};
$("rma").onclick=clearAllKeys;$("rmk").onclick=removeKeysAt;$("remk").onclick=removeKeysAt;document.querySelectorAll(".sh").forEach(b=>b.onclick=()=>shiftKeys(+b.dataset.d));
$("tm").oninput=e=>setTime(+e.target.value);
$("du").oninput=e=>{dur=Math.max(1,Math.min(300,+e.target.value||1));$("tm").max=dur;setTime(Math.min(T,dur));drawMarks()};
tr.z=[{t:0,v:-1},{t:4,v:2}];tr.x=[{t:0,v:-2},{t:4,v:2}];tr.f=[{t:0,v:11},{t:4,v:11}];drawKF();
$("cz").oninput=e=>{cam.z=+e.target.value;akCam("z");render()};
$("cx").oninput=e=>{cam.x=+e.target.value;akCam("x");render()};
$("cy").oninput=e=>{cam.y=+e.target.value;akCam("y");render()};
$("fd").oninput=e=>{focus=+e.target.value;akCam("f");render()};
$("ap").oninput=e=>{ap=+e.target.value;akCam("a");render()};
["r","t"].forEach(k=>{$("c"+k).oninput=e=>{cam[k]=+e.target.value;akCam(k);render()}});
$("bo").onchange=e=>{blurOn=e.target.checked;render()};

/* ---- playback + export ---- */
function run(fin,from){
  showSel=false;const t0=performance.now()-(from||0)*1000;
  const tick=t=>{const p=(t-t0)/1000;setTime(p);if(p<dur){raf=requestAnimationFrame(tick)}else{raf=null;setTime(dur);setTimeout(()=>{fin();setTimeout(()=>{showSel=true;render()},150)},350)}};
  raf=requestAnimationFrame(tick);
}
function stopRun(){if(raf){cancelAnimationFrame(raf);raf=null}showSel=true;$("play").textContent="▶";render()}
$("play").onclick=()=>{if(raf)return;run(()=>{},T>=dur-.02?0:T)};
$("pause").onclick=()=>stopRun();
$("stop").onclick=()=>{stopRun();setTime(0)};
function resetCam(){Object.assign(cam,{x:0,y:0,z:0,r:0,t:0});focus=10;ap=1;blurOn=true;$("bo").checked=true;PR.forEach(([k])=>{tr[k]=[]});ksel=null;drawKF();syncUI();render()}
function resetLayer(l){l.d=l.d0;l.sc=1;l.rot=0;l.ox=0;l.oy=0;LP.forEach(([k])=>{l.tr[k]=[]});ksel=null}
function resetAll(){if(!confirm("Reset the camera and every layer, and delete all keyframes? Your images stay."))return;layers.forEach(resetLayer);resetCam();T=0;setTime(0);buildList()}
$("rc").onclick=resetCam;document.querySelectorAll(".do-reset").forEach(b=>b.onclick=resetAll);
const btnsDis=v=>document.querySelectorAll("#exp,#exp2").forEach(b=>{b.disabled=v});
function exportRT(){
  if(raf)return;
  const types=["video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9","video/webm"];
  const mt=window.MediaRecorder&&types.find(t=>MediaRecorder.isTypeSupported(t));
  if(!mt){$("st").textContent="This browser can’t record video. Try Chrome or Safari.";return}
  exCv=document.createElement("canvas");exCv.width=W;exCv.height=H;exCtx=exCv.getContext("2d");
  const rec=new MediaRecorder(exCv.captureStream(30),{mimeType:mt,videoBitsPerSecond:Math.min(2e7,Math.round(W*H*4.5))}),ch=[];
  rec.ondataavailable=e=>{if(e.data.size)ch.push(e.data)};
  rec.onstop=()=>{exCv=null;render();showVideo(new Blob(ch,{type:mt}),mt.includes("mp4")?"mp4":"webm")};
  $("st").textContent="Recording… keep this tab open ("+dur+"s)";btnsDis(true);
  setTime(0);rec.start();run(()=>{rec.stop();btnsDis(false)});
}
async function exportFast(){
  if(raf)return;
  if(!window.VideoEncoder||!window.VideoFrame||!window.Mp4Muxer)return exportRT();
  const fps=30,n=Math.round(dur*fps);let cfg=null;
  for(const codec of["avc1.640028","avc1.4d0028","avc1.42001f"]){const c={codec,width:W,height:H,bitrate:Math.min(2e7,Math.round(W*H*4.5)),framerate:fps};try{const r=await VideoEncoder.isConfigSupported(c);if(r.supported){cfg=c;break}}catch(e){}}
  if(!cfg)return exportRT();
  btnsDis(true);showSel=false;exCv=document.createElement("canvas");exCv.width=W;exCv.height=H;exCtx=exCv.getContext("2d");
  const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:"avc",width:W,height:H},fastStart:"in-memory"});
  let err=null;const enc=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>{err=e}});enc.configure(cfg);
  for(let i=0;i<=n&&!err;i++){
    setTime(Math.min(dur,i/fps));
    const f=new VideoFrame(exCv,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
    enc.encode(f,{keyFrame:i%fps===0});f.close();
    $("st").textContent="Rendering "+Math.round(i/n*100)+"%";
    if(enc.encodeQueueSize>6||i%4===0)await new Promise(r=>setTimeout(r,0));
  }
  if(!err){try{await enc.flush();muxer.finalize()}catch(e){err=e}}
  exCv=null;showSel=true;btnsDis(false);setTime(0);
  if(err){$("st").textContent="Fast export failed, switching to real-time export…";return exportRT()}
  showVideo(new Blob([muxer.target.buffer],{type:"video/mp4"}),"mp4");
}
document.querySelectorAll("#exp,#exp2").forEach(b=>b.onclick=exportFast);
async function showVideo(blob,ext){
  const o=$("ovb");o.innerHTML="";$("st").textContent="";$("ov").hidden=false;
  const p=document.createElement("div");p.textContent="Video ready · "+(blob.size/1048576).toFixed(1)+" MB · "+W+"×"+H;o.appendChild(p);
  const v=document.createElement("video");v.src=URL.createObjectURL(blob);v.controls=true;v.playsInline=true;v.style.cssText="max-width:100%;max-height:40vh;margin-top:6px;border-radius:8px";o.appendChild(v);
  let dl=null;try{dl=await claude.use("downloads")}catch(e){}
  if(dl){const b=document.createElement("button");b.textContent="Save video";b.style.marginTop="6px";
    b.onclick=async()=>{try{await dl.save({filename:"parallax."+ext,data:blob})}catch(e){if(e&&e.code!=="declined")p.textContent="Couldn’t save: "+(e.code||"error")}};
    o.appendChild(b)}
  else{const a=document.createElement("a");a.href=v.src;a.download="parallax."+ext;a.textContent="Save video";a.className="btn";a.style.cssText="display:inline-block;margin-top:6px;text-decoration:none";o.appendChild(a)}
}

/* ---- drag to move, pinch to resize the selected layer ---- */
const ptrs=new Map();let pin=null;
const pd=()=>{const [a,b]=[...ptrs.values()];return Math.hypot(a.x-b.x,a.y-b.y)||1};
const pang=()=>{const [a,b]=[...ptrs.values()];return Math.atan2(b.y-a.y,b.x-a.x)};
let gest=null;
const hitC=document.createElement("canvas");hitC.width=hitC.height=1;const hitX=hitC.getContext("2d",{willReadFrequently:true});
const dispK=()=>Math.min(cv.clientWidth/W,cv.clientHeight/H)||1;
function fromDisp(x,y){
  if(vk<1){x=W/2+(x-W/2)/vk;y=H/2+(y-H/2)/vk}
  const a=-cam.r*Math.PI/180,c=Math.cos(a),n=Math.sin(a),dx=x-W/2,dy=y-H/2;
  return[W/2+dx*c-dy*n,H/2+dx*n+dy*c-W/6*Math.tan(cam.t*Math.PI/180)]}
function toDisp(q){const a=cam.r*Math.PI/180,c=Math.cos(a),n=Math.sin(a),dx=q[0]-W/2,dy=q[1]-H/2+W/6*Math.tan(cam.t*Math.PI/180);return[W/2+vk*(dx*c-dy*n),H/2+vk*(dx*n+dy*c)]}
function sceneAt(e){
  const r=cv.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H),ox=(r.width-W*k)/2,oy=(r.height-H*k)/2;
  return fromDisp((e.clientX-r.left-ox)/k,(e.clientY-r.top-oy)/k)}
function hitMask(l){
  if(l.hm&&l.hm.src===l.img)return l.hm;
  const im=l.img,sc=128/Math.max(im.naturalWidth,im.naturalHeight),c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.naturalWidth*sc));c.height=Math.max(1,Math.round(im.naturalHeight*sc));
  const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0,c.width,c.height);
  try{l.hm={src:im,w:c.width,h:c.height,a:x.getImageData(0,0,c.width,c.height).data}}catch(e){l.hm={src:im,w:0}}return l.hm}
function hitLayer(q){
  let fb=null;
  for(const l of layers.slice().sort((a,b)=>a.d-b.d)){const g=geom(l);if(!g)continue;
    const bx=g.x+g.w/2,by=g.y+g.h/2,a=-l.rot*Math.PI/180,c=Math.cos(a),n=Math.sin(a),dx=q[0]-bx,dy=q[1]-by,lx=dx*c-dy*n,ly=dx*n+dy*c;
    if(Math.abs(lx)>g.w/2||Math.abs(ly)>g.h/2)continue;
    const m=hitMask(l);if(!m.w)return l;
    const px=Math.min(m.w-1,Math.max(0,Math.floor((lx+g.w/2)/g.w*m.w))),py=Math.min(m.h-1,Math.max(0,Math.floor((ly+g.h/2)/g.h*m.h)));
    if(m.a[(py*m.w+px)*4+3]>24)return l;
    if(!fb)fb=l}
  return fb}
function handlesOf(l){
  const g=geom(l);if(!g)return null;const k=dispK()*vk,bx=g.x+g.w/2,by=g.y+g.h/2,a=l.rot*Math.PI/180,c=Math.cos(a),n=Math.sin(a),P=(x,y)=>[bx+x*c-y*n,by+x*n+y*c];
  const keep=p=>{const d=toDisp(p),m=16/dispK(),x=Math.max(m,Math.min(W-m,d[0])),y=Math.max(m,Math.min(H-m,d[1]));return(x===d[0]&&y===d[1])?p:fromDisp(x,y)};
  return{g,bx,by,k,corners:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>keep(P(sx*g.w/2,sy*g.h/2))),rot:keep(P(0,-g.h/2-36/k))}}
function drawHandles(){
  const H0=sel&&handlesOf(sel);if(!H0)return;const k=H0.k,hs=9/k,a=sel.rot*Math.PI/180;
  ctx.save();ctx.setLineDash([]);ctx.lineWidth=2/k;ctx.strokeStyle="#6b9bff";ctx.fillStyle="#fff";
  ctx.beginPath();ctx.moveTo(H0.bx+H0.g.h/2*Math.sin(a),H0.by-H0.g.h/2*Math.cos(a));ctx.lineTo(H0.rot[0],H0.rot[1]);ctx.stroke();
  H0.corners.forEach(p=>{ctx.beginPath();ctx.rect(p[0]-hs,p[1]-hs,2*hs,2*hs);ctx.fill();ctx.stroke()});
  ctx.beginPath();ctx.arc(H0.rot[0],H0.rot[1],hs,0,7);ctx.fill();ctx.stroke();ctx.restore()}
cv.addEventListener("pointerdown",e=>{if(raf)return;cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){gest=null;if(sel)pin={d:pd(),sc:sel.sc,a:pang(),rot:sel.rot};return}
  const q=sceneAt(e);gest=null;
  if(sel){const H0=handlesOf(sel);if(H0){const R=26/H0.k;
    if(Math.hypot(q[0]-H0.rot[0],q[1]-H0.rot[1])<R){gest={t:"rot",a0:Math.atan2(q[1]-H0.by,q[0]-H0.bx),r0:sel.rot};return}
    if(H0.corners.some(c=>Math.hypot(q[0]-c[0],q[1]-c[1])<R)){gest={t:"sc",d0:Math.hypot(q[0]-H0.bx,q[1]-H0.by)||1,s0:sel.sc};return}}}
  const l=hitLayer(q);if(l){if(l!==sel){selCam=false;sel=l;buildList()}gest={t:"mv",q};render()}});
cv.addEventListener("pointermove",e=>{
  const prev=ptrs.get(e.pointerId);if(!prev||!sel||raf)return;
  if(ptrs.size===1&&gest){const q=sceneAt(e),H0=handlesOf(sel);
    if(gest.t==="mv"){if(H0){sel.ox+=(q[0]-gest.q[0])/(H0.g.u*H0.g.s);sel.oy+=(q[1]-gest.q[1])/(H0.g.u*H0.g.s)}gest.q=q;akLay(sel,"ox","oy")}
    else if(gest.t==="sc"&&H0){sel.sc=Math.max(.1,Math.min(4,gest.s0*Math.hypot(q[0]-H0.bx,q[1]-H0.by)/gest.d0));akLay(sel,"sc")}
    else if(gest.t==="rot"&&H0){sel.rot=gest.r0+(Math.atan2(q[1]-H0.by,q[0]-H0.bx)-gest.a0)*180/Math.PI;akLay(sel,"rot")}}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2&&pin){sel.sc=Math.max(.1,Math.min(4,pin.sc*pd()/pin.d));sel.rot=pin.rot+(pang()-pin.a)*180/Math.PI;akLay(sel,"sc","rot")}
  syncSel();render();
});
["pointerup","pointercancel"].forEach(n=>cv.addEventListener(n,e=>{ptrs.delete(e.pointerId);pin=null;if(!ptrs.size)gest=null}));
cv.addEventListener("wheel",e=>{if(!sel||raf)return;e.preventDefault();sel.sc=Math.max(.1,Math.min(4,sel.sc*Math.exp(-e.deltaY*.0015)));akLay(sel,"sc");syncSel();render()},{passive:false});

/* ---- background remover (tap the background) ---- */
function openEd(l,p){
  const ed=p.querySelector("#ed"),c=p.querySelector("#edc");
  const load=im=>{const sc=Math.min(1,900/Math.max(im.naturalWidth,im.naturalHeight));c.width=Math.round(im.naturalWidth*sc);c.height=Math.round(im.naturalHeight*sc);const x=c.getContext("2d",{willReadFrequently:true});x.clearRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height)};
  load(l.img);ed.hidden=false;
  c.onpointerdown=e=>{
    const r=c.getBoundingClientRect(),px=Math.floor((e.clientX-r.left)*c.width/r.width),py=Math.floor((e.clientY-r.top)*c.height/r.height);
    const x=c.getContext("2d"),w=c.width,h=c.height,d=x.getImageData(0,0,w,h),a=d.data,i0=(py*w+px)*4;
    if(a[i0+3]===0)return;
    const R=a[i0],G=a[i0+1],B=a[i0+2],tol=+p.querySelector("#et").value,t2=tol*tol,seen=new Uint8Array(w*h),st=[py*w+px];seen[st[0]]=1;
    const ok=i=>{const j=i*4;if(a[j+3]===0)return false;const r=a[j]-R,g=a[j+1]-G,b=a[j+2]-B;return r*r+g*g+b*b<=t2};
    const go=i=>{if(!seen[i]){seen[i]=1;if(ok(i))st.push(i)}};
    while(st.length){const i=st.pop(),cx=i%w;a[i*4+3]=0;if(cx>0)go(i-1);if(cx<w-1)go(i+1);if(i>=w)go(i-w);if(i<w*h-w)go(i+w)}
    x.putImageData(d,0,0);
  };
  p.querySelector("#er").onclick=()=>load(l.src0.naturalWidth?l.src0:l.img);
  p.querySelector("#ec").onclick=()=>{ed.hidden=true};
  p.querySelector("#ed1").onclick=()=>{
    const x=c.getContext("2d"),w=c.width,h=c.height,d=x.getImageData(0,0,w,h),a=d.data,cp=new Uint8ClampedArray(a);
    for(let yy=1;yy<h-1;yy++)for(let xx=1;xx<w-1;xx++){const i=(yy*w+xx)*4;if(cp[i+3]>0&&(cp[i-1]===0||cp[i+7]===0||cp[i-w*4+3]===0||cp[i+w*4+3]===0))a[i+3]=Math.min(a[i+3],130)}
    x.putImageData(d,0,0);setSrc(l,c.toDataURL("image/png"),true);
  };
}

/* ---- layers ---- */
let TF=null,aiM=null,dpM=null;
async function tf(){if(!TF){$("st").textContent="Loading AI library…";TF=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2");TF.env.allowLocalModels=false}return TF}
const aiFail=()=>{$("st").textContent="AI isn’t available here (it needs internet access to its model). Use the tap tool instead."};
async function aiCutout(l){
  try{const X=await tf();$("st").textContent="Loading person model (first time only)…";
    if(!aiM)aiM={m:await X.AutoModel.from_pretrained("Xenova/modnet",{quantized:false}),p:await X.AutoProcessor.from_pretrained("Xenova/modnet")};
    $("st").textContent="Cutting out…";
    const img=await X.RawImage.fromURL(l.orig||l.img.src),{pixel_values}=await aiM.p(img),{output}=await aiM.m({input:pixel_values});
    const mask=await X.RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(img.width,img.height);
    const c=document.createElement("canvas");c.width=img.width;c.height=img.height;const x=c.getContext("2d");x.drawImage(l.src0.naturalWidth?l.src0:l.img,0,0,c.width,c.height);
    const d=x.getImageData(0,0,c.width,c.height);for(let i=0;i<mask.data.length;i++)d.data[i*4+3]=mask.data[i];x.putImageData(d,0,0);
    setSrc(l,c.toDataURL("image/png"),true);$("st").textContent="";
  }catch(e){aiFail()}
}
async function photo3D(file){
  try{const X=await tf();$("st").textContent="Loading depth model (first time only)…";
    if(!dpM)dpM=await X.pipeline("depth-estimation","Xenova/depth-anything-small-hf");
    const url=URL.createObjectURL(file);$("st").textContent="Estimating depth…";
    const dm=(await dpM(url)).depth,im=new Image();im.src=url;await im.decode();
    const w=Math.min(1280,im.naturalWidth),h=Math.round(w*im.naturalHeight/im.naturalWidth);
    const t=document.createElement("canvas");t.width=dm.width;t.height=dm.height;const tx=t.getContext("2d"),di=tx.createImageData(dm.width,dm.height);
    for(let i=0;i<dm.width*dm.height;i++){const v=dm.data[i*dm.channels];di.data[i*4]=di.data[i*4+1]=di.data[i*4+2]=v;di.data[i*4+3]=255}
    tx.putImageData(di,0,0);const dc=document.createElement("canvas");dc.width=w;dc.height=h;const dx=dc.getContext("2d");dx.imageSmoothingQuality="high";dx.drawImage(t,0,0,w,h);
    const dd=dx.getImageData(0,0,w,h).data,m=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)m[i*4]=dd[i*4];
    for(let k=0;k<2;k++){boxPass(m,w,h,3,true);boxPass(m,w,h,3,false)}
    const hist=new Uint32Array(256);for(let i=0;i<w*h;i++)hist[m[i*4]]++;
    const pct=q=>{let a=0;for(let v=0;v<256;v++){a+=hist[v];if(a>=w*h*q)return v}return 255};
    const cuts=[-999,pct(.45),pct(.75)],names=["Photo back","Photo middle","Photo front"],depths=[18,11,6];let last=null;
    names.forEach((nm,k)=>{const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(im,0,0,w,h);
      if(k>0){const d=x.getImageData(0,0,w,h),a=d.data;for(let i=0;i<w*h;i++)a[i*4+3]=Math.max(0,Math.min(255,(m[i*4]-cuts[k])*14+128));x.putImageData(d,0,0)}
      last=mk(nm,c.toDataURL("image/png"),depths[k],true)});
    sel=last;selCam=false;buildList();render();$("st").textContent="";
  }catch(e){aiFail()}
}
const btn=(t,f)=>{const b=document.createElement("button");b.className="ghost";b.textContent=t;b.onclick=f;return b};
function swap(a,b){if(!b)return;const t=a.d;a.d=b.d;b.d=t;buildList();render()}
function panel(l){
  const p=document.createElement("div");p.className="panel";
  p.innerHTML='<div class="row"><label class="btn" style="margin:0"></label><button class="ghost" id="rb">Remove background (tap)</button><button class="ghost" id="ai">✨ AI cut-out</button><button class="ghost" id="fo">Focus on this layer</button></div>'+
  '<div id="ed" hidden style="margin-top:8px"><small>Tap the background you want to remove. Tap more spots to remove more. Raise Strength if bits are left over.</small><canvas id="edc" class="chk" style="width:100%;border-radius:8px;margin-top:6px"></canvas><label><span>Strength</span><input id="et" type="range" min="5" max="120" value="40"></label><div class="row"><button id="ed1">Done</button><button class="ghost" id="er">Start over</button><button class="ghost" id="ec">Cancel</button></div></div>'+
  '<label><span>Name</span><input id="nm" type="text"></label>'+
  '<label><span>Depth</span><input id="dp" type="range" min="1" max="30" step="0.1"></label>'+
  '<label><span>Size</span><input id="sz" type="range" min="0.1" max="4" step="0.01"></label>'+
  '<label><span>Tilt</span><input id="rt" type="range" min="-180" max="180" step="0.1"></label>'+
  '<label><span>Left / right</span><input id="ox" type="range" min="-250" max="250" step="1"></label>'+
  '<label><span>Up / down</span><input id="oy" type="range" min="-400" max="400" step="1"></label>'+
  '<label><input id="fl" type="checkbox"> Fill the frame (for backgrounds)</label>'+
  '<div class="row"><button class="ghost" id="lk">◆ Keyframe this layer</button><button class="ghost" id="rl">↺ Reset layer</button><button class="ghost" id="del">Delete layer</button></div>'+
  '<small>Tip: tap a layer in the preview to select it. Drag it to move, drag a white corner to resize, drag the round handle to rotate.</small>';
  const q=s=>p.querySelector(s),has=l.img.naturalWidth>0;
  const lab=q("label.btn");lab.append(has?"Replace image":"Choose image");
  const fi=document.createElement("input");fi.type="file";fi.accept="image/*";fi.hidden=true;fi.id="pick";lab.appendChild(fi);
  fi.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>setSrc(l,r.result);r.readAsDataURL(f)};
  q("#ai").disabled=!has;q("#ai").onclick=()=>aiCutout(l);
  q("#rb").disabled=!has;q("#rb").onclick=()=>openEd(l,p);
  q("#fo").onclick=()=>{focus=Math.max(.5,l.d-cam.z);akCam("f");syncUI();render();buildList()};
  q("#nm").value=l.name;q("#nm").oninput=e=>{l.name=e.target.value};q("#nm").onchange=buildList;
  q("#dp").value=l.d;q("#dp").oninput=e=>{l.d=+e.target.value;akLay(l,"d");render()};q("#dp").onchange=buildList;
  [["sz","sc"],["rt","rot"],["ox","ox"],["oy","oy"]].forEach(([i,k])=>{q("#"+i).value=l[k];q("#"+i).oninput=e=>{l[k]=+e.target.value;akLay(l,k);render()}});
  q("#fl").checked=l.fill;q("#fl").onchange=e=>{l.fill=e.target.checked;render()};
  q("#del").onclick=()=>{layers=layers.filter(o=>o!==l);selCam=false;sel=layers[0]||null;buildList();render()};
  q("#lk").onclick=()=>{LP.forEach(([k])=>putLayerKey(l,k));drawKF();syncSel()};
  q("#rl").onclick=()=>{resetLayer(l);buildList();drawKF();render()};
  [["dp","d"],["sz","sc"],["rt","rot"],["ox","ox"],["oy","oy"]].forEach(([i,k])=>{const b=document.createElement("button");b.className="ghost kb lkb";b.textContent="◆";b.dataset.k=k;b.title="Keyframe at the current time";b.onclick=()=>setLayerKey(l,k);q("#"+i).parentElement.appendChild(b)});
  return p;
}
function buildList(){
  $("camHold").appendChild($("camCard"));
  const box=$("list");box.innerHTML="";
  const cr=document.createElement("div");cr.className="lrow"+(selCam?" sel":"");
  cr.innerHTML='<div class="th" style="display:flex;align-items:center;justify-content:center;font-size:22px;background:none">🎥</div><div style="flex:1"><b>Camera</b><br><small></small></div>';
  cr.querySelector("small").textContent="Front/back "+cam.z.toFixed(1)+" · focus "+focus.toFixed(1);
  cr.onclick=()=>{selCam=true;sel=null;buildList();render()};
  box.appendChild(cr);if(selCam)box.appendChild($("camCard"));
  const ord=layers.slice().sort((a,b)=>a.d-b.d);
  ord.forEach((l,i)=>{
    const row=document.createElement("div");row.className="lrow"+(l===sel?" sel":"");
    const th=document.createElement("img");th.className="th";if(l.img.naturalWidth)th.src=l.img.src;
    const nm=document.createElement("div");nm.style.flex="1";nm.style.minWidth="0";nm.innerHTML="<b></b><br><small></small>";
    nm.firstChild.textContent=l.name;
    nm.querySelector("small").textContent=(i===0?"Front":i===ord.length-1?"Back":"Middle")+" · depth "+l.d.toFixed(1)+(Math.abs(focus-(l.d-cam.z))<.06?" · in focus":"")+(l.img.naturalWidth?"":" · no image");
    row.append(th,nm,btn("↑",()=>swap(l,ord[i-1])),btn("↓",()=>swap(l,ord[i+1])));
    row.onclick=e=>{if(e.target.closest("button"))return;selCam=false;sel=l;buildList();render()};
    box.appendChild(row);
    if(l===sel)box.appendChild(panel(l));
  });
  drawKF();syncSel();
}
$("d3").onclick=()=>$("d3f").click();
$("d3f").onchange=e=>{const f=e.target.files[0];if(f)photo3D(f);e.target.value=""};
$("newl").onclick=()=>{
  const md=layers.length?Math.min(...layers.map(l=>l.d)):6;
  selCam=false;sel=mk("Layer "+(layers.length+1),"",Math.max(1,+(md-1.5).toFixed(1)),false);
  buildList();render();const f=$("pick");if(f)f.click();
};
/* ---- top-down camera view ---- */
const tv=$("tv"),tc=tv.getContext("2d"),TW=720,TH=560,X0=360,XS=4,ZS=11,ZMIN=-12,YB=520;
tv.width=TW;tv.height=TH;
const tY=d=>YB-(d-ZMIN)*ZS,tX=x=>X0+x*XS;
function lw(l){const u=W/360,im=l.img;if(!im.naturalWidth)return 6*l.d0*l.sc;const b=(l.fill?Math.max:Math.min)(W/im.naturalWidth,H/im.naturalHeight)*(l.fill?1.3:1)*l.sc;return im.naturalWidth*b*l.d0/(60*u)}
function drawTop(){
  tc.fillStyle="#1b1c20";tc.fillRect(0,0,TW,TH);tc.font="22px system-ui";tc.textBaseline="middle";tc.lineWidth=1;
  for(let d=-10;d<=30;d+=5){tc.strokeStyle="rgba(255,255,255,.08)";tc.beginPath();tc.moveTo(0,tY(d));tc.lineTo(TW,tY(d));tc.stroke();tc.fillStyle="rgba(255,255,255,.45)";tc.fillText(d,TW-40,tY(d)-12)}
  const pa=0,A=Math.atan(3),c0=[tX(cam.x),tY(cam.z)];
  const ray=a=>[tX(cam.x+Math.sin(a)*90),tY(cam.z+Math.cos(a)*90)],r1=ray(pa-A),r2=ray(pa+A);
  tc.fillStyle="rgba(107,155,255,.13)";tc.beginPath();tc.moveTo(...c0);tc.lineTo(...r1);tc.lineTo(...r2);tc.closePath();tc.fill();
  tc.strokeStyle="rgba(107,155,255,.9)";tc.lineWidth=3;tc.beginPath();tc.moveTo(...r1);tc.lineTo(...c0);tc.lineTo(...r2);tc.stroke();
  const fxw=cam.x+Math.sin(pa)*focus,fzw=cam.z+Math.cos(pa)*focus;
  tc.setLineDash([12,8]);tc.strokeStyle="#ff9f43";tc.lineWidth=2;tc.beginPath();tc.moveTo(tX(fxw-Math.cos(pa)*60),tY(fzw+Math.sin(pa)*60));tc.lineTo(tX(fxw+Math.cos(pa)*60),tY(fzw-Math.sin(pa)*60));tc.stroke();tc.setLineDash([]);
  tc.fillStyle="#ff9f43";tc.beginPath();tc.arc(tX(fxw),tY(fzw),12,0,7);tc.fill();tc.fillText("focus",tX(fxw)+16,tY(fzw)+2);
  layers.slice().sort((a,b)=>b.d-a.d).forEach(l=>{
    const w=lw(l),cx=l.ox*l.d0/60,y=tY(l.d),on=l===sel;
    tc.fillStyle=on?"#ffd23f":"#aab4c8";tc.fillRect(tX(cx-w/2),y-5,w*XS,10);
    tc.fillText(l.name,Math.max(8,Math.min(TW-170,tX(cx-w/2))),y-18);
    if(on){tc.fillStyle="#fff";[-1,1].forEach(g=>{tc.beginPath();tc.arc(tX(cx+g*w/2),y,10,0,7);tc.fill()})}
  });
  const cx=tX(cam.x),cy=tY(cam.z),cc=selCam?"#ffd23f":"#fff";
  tc.save();tc.translate(cx,cy);tc.rotate(pa);tc.fillStyle=cc;tc.fillRect(-18,0,36,22);tc.beginPath();tc.moveTo(-18,0);tc.lineTo(-9,-12);tc.lineTo(9,-12);tc.lineTo(18,0);tc.fill();
  tc.fillStyle="#1b1c20";tc.beginPath();tc.arc(0,11,6,0,7);tc.fill();tc.restore();

  tc.fillStyle=cc;tc.fillText("Camera",Math.max(6,cx-30),cy+38);
}
let td=null;
const tp=e=>{const r=tv.getBoundingClientRect();return[(e.clientX-r.left)*TW/r.width,(e.clientY-r.top)*TH/r.height]};
tv.addEventListener("pointerdown",e=>{if(raf)return;const[px,py]=tp(e);tv.setPointerCapture(e.pointerId);
  {const pa=0,hx=tX(cam.x+Math.sin(pa)*5),hy=tY(cam.z+Math.cos(pa)*5),fx=tX(cam.x+Math.sin(pa)*focus),fy=tY(cam.z+Math.cos(pa)*focus);
   if(Math.hypot(px-fx,py-fy)<30){td={f:1};return}}
  if(sel){const w=lw(sel),cxw=sel.ox*sel.d0/60,y=tY(sel.d);for(const g of[-1,1]){if(Math.abs(px-tX(cxw+g*w/2))<26&&Math.abs(py-y)<26){td={r:sel};return}}}
  if(Math.abs(px-tX(cam.x))<44&&Math.abs(py-tY(cam.z))<36){selCam=true;sel=null;td={c:1};buildList();render();return}
  let best=null,bd=22;layers.forEach(l=>{const dd=Math.abs(py-tY(l.d));if(dd<bd){bd=dd;best=l}});
  if(best){selCam=false;sel=best;td={l:best};buildList();render()}});
tv.addEventListener("pointermove",e=>{if(!td||raf)return;const[px,py]=tp(e),d=ZMIN+(YB-py)/ZS,x=(px-X0)/XS;
  if(td.f){const pa=0;focus=Math.max(.5,Math.min(35,(x-cam.x)*Math.sin(pa)+(d-cam.z)*Math.cos(pa)));akCam("f");syncUI()}
  else if(td.c){cam.x=Math.max(-40,Math.min(40,x));cam.z=Math.max(-12,Math.min(29,d));akCam("x","z");syncUI()}
  else if(td.r){const l=td.r,bw=lw(l)/l.sc,cxw=l.ox*l.d0/60;l.sc=Math.max(.1,Math.min(4,2*Math.abs(x-cxw)/bw));akLay(l,"sc");syncSel()}
  else{const l=td.l;l.d=Math.max(1,Math.min(30,Math.round(d*10)/10));l.ox=Math.max(-250,Math.min(250,x*60/l.d0));akLay(l,"d","ox");syncSel()}
  render()});
["pointerup","pointercancel"].forEach(n=>tv.addEventListener(n,()=>{const l=td&&(td.l||td.r);td=null;if(l)buildList()}));
$("outOn").onchange=render;
let AK=false,skT=null,base=null;
function snap(){base={c:{},l:{}};PR.forEach(([k])=>{base.c[k]=GET[k]()});layers.forEach(l=>{base.l[l.id]={d:l.d,sc:l.sc,rot:l.rot,ox:l.ox,oy:l.oy}})}
function sched(){clearTimeout(skT);skT=setTimeout(()=>{drawKF();syncUI();syncSel()},150)}
function akCam(...ks){let ch=false;ks.forEach(k=>{const an=tr[k].length>0;if(!AK&&!an)return;if(!an&&T>.05&&base)tr[k].push({t:0,v:base.c[k],e:defEase});tr[k]=tr[k].filter(o=>Math.abs(o.t-T)>.05);tr[k].push({t:T,v:GET[k](),e:defEase});ch=true});if(ch)sched()}
function akLay(l,...ks){if(!l)return;let ch=false;ks.forEach(k=>{const an=l.tr[k].length>0;if(!AK&&!an)return;if(!an&&T>.05&&base&&base.l[l.id])l.tr[k].push({t:0,v:base.l[l.id][k],e:defEase});putLayerKey(l,k);ch=true});if(ch)sched()}
$("ak").onclick=()=>{AK=!AK;$("ak").classList.toggle("on",AK);if(AK)snap()};
function projJSON(){return JSON.stringify({v:1,ar:arK,q:Q,dur,defEase,blurOn,cam:{...cam},focus,ap,tr,layers:layers.map(l=>({name:l.name,d:l.d,fill:l.fill,sc:l.sc,rot:l.rot,ox:l.ox,oy:l.oy,d0:l.d0,tr:l.tr,src:l.img.src,orig:l.orig}))})}
function loadProj(j){
  const p=JSON.parse(j);layers=[];sel=null;selCam=false;ksel=null;dur=p.dur||4;$("tm").max=dur;$("du").value=dur;defEase=p.defEase||"smooth";$("de").value=defEase;blurOn=p.blurOn!==false;$("bo").checked=blurOn;
  Object.assign(cam,p.cam);focus=p.focus;ap=p.ap;PR.forEach(([k])=>{tr[k]=(p.tr&&p.tr[k])||[]});
  (p.layers||[]).forEach(o=>{const l=mk(o.name,"",o.d,o.fill);if(o.d0)l.d0=o.d0;l.sc=o.sc;l.rot=o.rot||0;l.ox=o.ox;l.oy=o.oy;l.tr=Object.assign({d:[],sc:[],rot:[],ox:[],oy:[]},o.tr);setSrc(l,o.src,true);l.orig=o.orig||o.src;l.src0=new Image();l.src0.src=l.orig});
  sel=layers[0]||null;setAR(p.ar,p.q);buildList();setTime(0);
}
function newProj(){layers=[];sel=null;selCam=false;ksel=null;PR.forEach(([k])=>{tr[k]=[]});Object.assign(cam,{x:0,y:0,z:0,r:0,p:0,t:0});focus=10;ap=1;buildList();setTime(0);idbSet(null)}
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open("parallaxcam",1);r.onupgradeneeded=()=>r.result.createObjectStore("p");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function idbSet(v){try{const d=await idb();d.transaction("p","readwrite").objectStore("p").put(v,"auto")}catch(e){}}
async function idbGet(){try{const d=await idb();return await new Promise(r=>{const q=d.transaction("p").objectStore("p").get("auto");q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(e){return null}}
let asT=null;function autosave(){clearTimeout(asT);asT=setTimeout(()=>idbSet(projJSON()),1500)}
document.querySelectorAll(".pj-new").forEach(b=>b.onclick=()=>{if(confirm("Start a new empty project?"))newProj()});
document.querySelectorAll(".pj-open").forEach(b=>b.onclick=()=>$("pjf").click());
document.querySelectorAll(".pj-save").forEach(b=>b.onclick=()=>{const u=URL.createObjectURL(new Blob([projJSON()],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download="parallax-project.json";a.click()});
$("pjf").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{loadProj(r.result)}catch(x){$("st").textContent="Couldn’t open that project file."}};r.readAsText(f);e.target.value=""};
EOPT.filter(x=>x[0]!=="custom").forEach(([v,n])=>{const op=document.createElement("option");op.value=v;op.textContent=n;$("de").appendChild(op)});$("de").onchange=e=>{defEase=e.target.value};
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x===b));document.querySelectorAll(".tab").forEach(t=>{t.hidden=t.id!=="t-"+b.dataset.t});$("body").scrollTop=0});
$("ovx").onclick=()=>{$("ov").hidden=true;$("ovb").innerHTML=""};
const mq=matchMedia("(min-width:900px)");
function lay(){if(mq.matches){$("tvslot").appendChild($("tvbox"));$("tlslot").appendChild($("tlbox"))}else{$("t-stage").insertBefore($("tvbox"),$("t-stage").firstChild);$("t-tml").appendChild($("tlbox"))}render()}
mq.addEventListener("change",lay);
(function(){
  const app=$("app"),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const save=()=>{try{localStorage.setItem("pcLayout",JSON.stringify(["wl","wr","wt","pv"].reduce((o,k)=>(o[k]=app.style.getPropertyValue("--"+k),o),{})))}catch(e){}};
  try{const L=JSON.parse(localStorage.getItem("pcLayout")||"{}");for(const k in L)if(L[k])app.style.setProperty("--"+k,L[k])}catch(e){}
  const drag=(id,fn)=>{const el=$(id);el.addEventListener("pointerdown",e=>{e.preventDefault();el.setPointerCapture(e.pointerId);
    const up=()=>{el.removeEventListener("pointermove",fn);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);save()};
    el.addEventListener("pointermove",fn);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up)})};
  drag("sp1",e=>{const r=app.getBoundingClientRect();app.style.setProperty("--wl",clamp(e.clientX-r.left,220,Math.min(700,r.width-480))+"px")});
  drag("sp2",e=>{const r=app.getBoundingClientRect();app.style.setProperty("--wr",clamp(r.right-e.clientX,200,Math.min(700,r.width-480))+"px")});
  drag("sp3",e=>{const r=app.getBoundingClientRect();if(mq.matches)app.style.setProperty("--wt",clamp(r.bottom-e.clientY,110,r.height-260)+"px");else{const t=$("stagebox").getBoundingClientRect().top;app.style.setProperty("--pv",clamp(e.clientY-t-8,70,r.height*.7)+"px")}});
})();
setAR();buildList();setTime(0);lay();
idbGet().then(v=>{if(v){try{loadProj(v)}catch(e){}}});
