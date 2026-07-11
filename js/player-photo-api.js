import { SQUADS } from './data-squads.js';
import { teamById } from './data-teams.js';
import { stableIdentity } from './player-identities.js';

const CACHE_KEY='wc26-player-photo-cache-v7-fast-identity';
let cache={};
try{ cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}; }catch{ cache={}; }
function save(){ try{ localStorage.setItem(CACHE_KEY,JSON.stringify(cache)); }catch{} }

const PLAYER_CONTEXT=new Map();
Object.entries(SQUADS).forEach(([country,squad])=>{
  squad.players.forEach(player=>PLAYER_CONTEXT.set(player.id,{...player,country}));
});

function normalizeName(name=''){
  return String(name).normalize('NFC').replace(/\s+/g,' ').trim();
}

function candidateNames(id,name=''){
  const known=stableIdentity(id)?.canonicalName;
  const clean=normalizeName(name);
  const parts=clean.split(' ').filter(Boolean);
  const rotated=parts.length>1 ? `${parts.at(-1)} ${parts.slice(0,-1).join(' ')}` : clean;
  // Squad lists are predominantly surname-first, so the rotated form is the
  // most useful canonical query. Known identities always take precedence.
  return [...new Set([known,rotated,clean].filter(Boolean))];
}

async function fetchJson(url,timeout=4500){
  const controller=typeof AbortController!=='undefined'?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),timeout):null;
  try{
    const response=await fetch(url,{cache:'force-cache',signal:controller?.signal});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }finally{ if(timer) clearTimeout(timer); }
}

function pageList(data){
  return Object.values(data?.query?.pages||{}).filter(page=>page?.thumbnail?.source);
}

function descriptionOf(page){
  return String(page?.terms?.description?.[0]||'').toLowerCase();
}

function footballIdentityScore(page,context,names){
  const description=descriptionOf(page);
  const title=String(page?.title||'').toLowerCase();
  const tokens=names.flatMap(n=>n.toLowerCase().split(/\s+/)).filter(t=>t.length>2);
  const identity=tokens.reduce((score,token)=>score+(title.includes(token)?1:0),0);
  const football=/football|soccer|futbol|fútbol|footballeur|calciatore/.test(description)?5:0;
  const nation=teamById(context.country)?.name?.toLowerCase();
  const country=nation&&description.includes(nation)?1.5:0;
  const clubTokens=String(context.club||'').toLowerCase().split(/\s+/).filter(t=>t.length>4);
  const club=clubTokens.some(token=>description.includes(token))?1:0;
  return football+identity+country+club-(description.includes('club')&&!football?3:0);
}

async function queryByTitle(title,lang){
  const url=`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&redirects=1&prop=pageimages%7Cpageterms&piprop=thumbnail&pilicense=free&pithumbsize=240&wbptterms=description&format=json&origin=*`;
  return pageList(await fetchJson(url))[0]||null;
}

async function searchIdentity(names,context,lang){
  const known=stableIdentity(context.id)?.canonicalName;
  if(known){
    const direct=await queryByTitle(known,lang).catch(()=>null);
    if(direct&&footballIdentityScore(direct,context,names)>=5) return direct.thumbnail.source;
  }
  const query=`${names[0]} ${teamById(context.country)?.name||''} footballer`;
  const url=`https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=pageimages%7Cpageterms&piprop=thumbnail&pilicense=free&pithumbsize=240&wbptterms=description&format=json&origin=*`;
  const candidates=pageList(await fetchJson(url).catch(()=>null));
  const ranked=candidates.map(page=>({page,score:footballIdentityScore(page,context,names)})).sort((a,b)=>b.score-a.score);
  if(ranked[0]?.score>=5) return ranked[0].page.thumbnail.source;
  return null;
}

async function fetchPhoto({id,name,country,club}){
  const key=id||normalizeName(name).toLowerCase();
  if(Object.prototype.hasOwnProperty.call(cache,key)) return cache[key]?.url||null;
  const stored=PLAYER_CONTEXT.get(id)||{};
  const context={id,country:country||stored.country||String(id||'').split('_')[0].toUpperCase(),club:club||stored.club||''};
  const names=candidateNames(id,name||stored.name);
  let url=null;
  for(const lang of ['en']){
    url=await searchIdentity(names,context,lang).catch(()=>null);
    if(url) break;
  }
  cache[key]={url:url||'',canonicalName:names[0]||name,checkedAt:Date.now()};
  save();
  return url;
}

function initials(name=''){
  const parts=normalizeName(name).split(' ').filter(Boolean);
  return parts.length>1?`${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase():(parts[0]||'?').slice(0,2).toUpperCase();
}

function paintFallback(node,name){
  if(!(node instanceof HTMLCanvasElement)) return;
  const size=parseInt(node.dataset.size)||36;
  const ctx=node.getContext('2d');
  if(!ctx) return;
  let hue=0;
  for(const ch of name) hue=(hue*31+ch.charCodeAt(0))%360;
  ctx.clearRect(0,0,size,size);
  ctx.fillStyle=`hsl(${hue} 38% 38%)`;
  ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(11,Math.floor(size*.34))}px Arial`;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials(name),size/2,size/2+1);
}

function loadImg(url,name){
  return new Promise(resolve=>{
    const img=document.createElement('img');
    img.alt=`Foto de ${name}`;img.title=name;img.loading='lazy';img.decoding='async';
    img.referrerPolicy='no-referrer';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url;
  });
}

async function hydrateNode(node){
  node.dataset.photoTried='1';
  const id=node.dataset.player||'';
  const stored=PLAYER_CONTEXT.get(id)||{};
  const name=node.dataset.playerName||stableIdentity(id)?.canonicalName||stored.name||id;
  paintFallback(node,name);
  const url=await fetchPhoto({id,name,country:node.dataset.playerCountry||stored.country,club:node.dataset.playerClub||stored.club}).catch(()=>null);
  if(!url||!node.isConnected) return;
  const img=await loadImg(url,name);
  if(!img||!node.isConnected) return;
  const size=parseInt(node.dataset.size)||36;
  img.className='player-portrait-canvas player-photo-real';
  img.dataset.player=id;
  img.style.cssText=`width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;border:2px solid rgba(128,100,60,.2);object-fit:cover;object-position:50% 20%;background:rgba(0,0,0,.04);display:inline-block;vertical-align:middle`;
  node.parentNode?.replaceChild(img,node);
}

export function hydratePlayerPhotos(root=document){
  const queue=[...root.querySelectorAll('.player-portrait-canvas[data-player]:not([data-photo-tried]):not(img)')].slice(0,80);
  const worker=async()=>{ while(queue.length) await hydrateNode(queue.shift()); };
  for(let i=0;i<Math.min(5,queue.length);i++) worker();
}
