import { TEAMS, teamById } from './data-teams.js';
import { simulateMatch } from './match-engine.js';
import { ArcadeMatchRenderer } from './arcade-renderer.js';

let timer=null;
let paused=false;
let elapsedBeforePause=0;
let startedAt=0;
let active=null;
let visual=null;
let lastGoalEvent=null;

function language(){ return document.documentElement.lang||'es'; }
function words(){
  const all={
    es:{kickoff:'Comienza el partido',half:'Descanso',full:'Final del partido',goal:'¡GOL!',save:'Atajada decisiva',chance:'Ocasión clara',wide:'Remate desviado',card:'Tarjeta amarilla',pens:'Definición por penales',pause:'Pausar',resume:'Continuar'},
    en:{kickoff:'Kick-off',half:'Half-time',full:'Full-time',goal:'GOAL!',save:'Important save',chance:'Big chance',wide:'Shot off target',card:'Yellow card',pens:'Penalty shootout',pause:'Pause',resume:'Resume'},
    fr:{kickoff:'Coup d’envoi',half:'Mi-temps',full:'Fin du match',goal:'BUT !',save:'Arrêt décisif',chance:'Grosse occasion',wide:'Tir non cadré',card:'Carton jaune',pens:'Tirs au but',pause:'Pause',resume:'Continuer'}
  };
  return all[language()]||all.es;
}

function randomMinute(){ return Math.max(2,Math.min(89,Math.round(4+Math.sqrt(Math.random())*84))); }

function buildTimeline(result){
  const w=words();
  const events=[{minute:0,type:'kickoff',label:w.kickoff}];
  for(const goal of result.events||[]){
    events.push({minute:goal.minute,type:'goal',team:goal.team,scorer:goal.scorer,assist:goal.assist,label:`${w.goal} ${goal.scorer}${goal.assist?` · ${goal.assist}`:''}${goal.penalty?' (P)':''}`});
  }
  for(const side of ['A','B']){
    const team=result[`team${side}`];
    const goals=result[`goals${side}`];
    const xg=result[`xg${side}`];
    const extra=Math.max(2,Math.round(xg*3.2+Math.random()*2)-goals);
    for(let i=0;i<extra;i++){
      const roll=Math.random();
      const type=roll<.34?'save':roll<.72?'chance':'wide';
      events.push({minute:randomMinute(),type,team,label:w[type]});
    }
    const cards=Math.random()<.72?1+(Math.random()<.22?1:0):0;
    for(let i=0;i<cards;i++) events.push({minute:randomMinute(),type:'card',team,label:w.card});
  }
  events.push({minute:45,type:'half',label:w.half});
  if(result.wentToPenalties) events.push({minute:90,type:'pens',team:result.penaltyWinner,label:`${w.pens} · ${result.penaltyScore}`});
  events.push({minute:91,type:'full',label:w.full});
  const priority={kickoff:0,goal:1,save:2,chance:3,wide:4,card:5,half:8,pens:9,full:10};
  return events.sort((a,b)=>a.minute-b.minute||(priority[a.type]||0)-(priority[b.type]||0));
}

function eventIcon(type){ return {kickoff:'●',goal:'⚽',save:'🧤',chance:'◆',wide:'↗',card:'▰',half:'Ⅱ',pens:'◎',full:'■'}[type]||'·'; }

function addEvent(event){
  const feed=document.querySelector('#arcadeFeed');
  if(!feed) return;
  const team=event.team?teamById(event.team):null;
  const row=document.createElement('div');
  row.className=`arcade-event event-${event.type}`;
  row.innerHTML=`<time>${event.minute>90?'90+':event.minute}'</time><span class="arcade-event-icon">${eventIcon(event.type)}</span><p>${team?`${team.flag} <b>${team.name}</b> · `:''}${event.label}</p>`;
  feed.prepend(row);
  while(feed.children.length>12) feed.lastElementChild?.remove();
  if(event.type==='goal'){
    lastGoalEvent=event;
    active.liveScore[event.team]++;
    updateScore();
    document.dispatchEvent(new CustomEvent('wc26:arcade-goal'));
  }
  visual?.trigger(event);
}

function updateScore(){
  const result=active.result;
  const a=teamById(result.teamA),b=teamById(result.teamB);
  document.querySelector('#arcadeScore').innerHTML=`
    <div><span>${a.flag}</span><b>${a.name}</b></div>
    <strong>${active.liveScore[a.id]} <small>–</small> ${active.liveScore[b.id]}</strong>
    <div class="arcade-away"><b>${b.name}</b><span>${b.flag}</span></div>`;
}

function finish(){
  clearInterval(timer);timer=null;
  const result=active.result;
  active.liveScore[result.teamA]=result.goalsA;
  active.liveScore[result.teamB]=result.goalsB;
  updateScore();
  document.querySelector('#arcadeMinute').textContent='FT';
  document.querySelector('#arcadeProgressFill')?.style.setProperty('--progress','1');
  document.querySelector('#arcadeStart').disabled=false;
  document.querySelector('#arcadePause').disabled=true;
  ['#arcadeHome','#arcadeAway','#arcadePhase','#arcadeDuration'].forEach(selector=>{document.querySelector(selector).disabled=false;});
  document.querySelector('#arcadeReplayGoal').disabled=!lastGoalEvent;
  visual?.finish();
}

function tick(){
  const duration=active.duration;
  const elapsed=elapsedBeforePause+(performance.now()-startedAt);
  const progress=Math.min(1,elapsed/duration);
  visual?.setProgress(progress);
  const minute=Math.min(91,Math.floor(progress*91));
  document.querySelector('#arcadeMinute').textContent=minute>=91?'FT':`${minute}'`;
  document.querySelector('#arcadeProgressFill')?.style.setProperty('--progress',String(progress));
  while(active.cursor<active.timeline.length&&active.timeline[active.cursor].minute<=minute){
    addEvent(active.timeline[active.cursor++]);
  }
  if(progress>=1) finish();
}

function startTimer(){
  startedAt=performance.now();
  timer=setInterval(tick,160);
}

function startMatch(){
  const homeId=document.querySelector('#arcadeHome').value;
  let awayId=document.querySelector('#arcadeAway').value;
  if(homeId===awayId){
    const index=TEAMS.findIndex(t=>t.id===awayId);
    awayId=TEAMS[(index+1)%TEAMS.length].id;
    document.querySelector('#arcadeAway').value=awayId;
  }
  const phase=document.querySelector('#arcadePhase').value;
  const result=simulateMatch(teamById(homeId),teamById(awayId),{allowDraw:phase==='group',phase,collectEvents:true});
  active={result,timeline:buildTimeline(result),cursor:0,duration:Number(document.querySelector('#arcadeDuration').value),liveScore:{[homeId]:0,[awayId]:0}};
  elapsedBeforePause=0;paused=false;
  lastGoalEvent=null;
  clearInterval(timer);
  document.querySelector('#arcadeFeed').innerHTML='';
  document.querySelector('#arcadeStart').disabled=true;
  document.querySelector('#arcadePause').disabled=false;
  document.querySelector('#arcadeReplayGoal').disabled=true;
  ['#arcadeHome','#arcadeAway','#arcadePhase','#arcadeDuration'].forEach(selector=>{document.querySelector(selector).disabled=true;});
  document.querySelector('#arcadePause').textContent=words().pause;
  document.querySelector('#arcadeModelLine').textContent=`xG ${result.xgA.toFixed(2)} – ${result.xgB.toFixed(2)} · Dixon–Coles`;
  visual?.setTeams(homeId,awayId);
  visual?.start();
  updateScore();
  startTimer();
}

function togglePause(){
  if(!active) return;
  paused=!paused;
  const button=document.querySelector('#arcadePause');
  if(paused){
    elapsedBeforePause+=performance.now()-startedAt;
    clearInterval(timer);timer=null;
    button.textContent=words().resume;
    visual?.setPaused(true);
  }else{
    button.textContent=words().pause;
    visual?.setPaused(false);
    startTimer();
  }
}

export function initArcadeMatch(){
  const home=document.querySelector('#arcadeHome');
  const away=document.querySelector('#arcadeAway');
  if(!home||!away) return;
  const options=TEAMS.map(team=>`<option value="${team.id}">${team.flag} ${team.name}</option>`).join('');
  home.innerHTML=options;away.innerHTML=options;
  home.value='ARG';away.value='FRA';
  visual=new ArcadeMatchRenderer(document.querySelector('#arcadeCanvas'));
  const preview=()=>{ if(!document.querySelector('#arcadeStart')?.disabled) visual?.setTeams(home.value,away.value); };
  home.addEventListener('change',preview);away.addEventListener('change',preview);
  document.querySelector('#arcadeStart')?.addEventListener('click',startMatch);
  document.querySelector('#arcadePause')?.addEventListener('click',togglePause);
  document.querySelector('#arcadeReplayGoal')?.addEventListener('click',()=>visual?.replay(lastGoalEvent));
  active={result:{teamA:'ARG',teamB:'FRA'},liveScore:{ARG:0,FRA:0}};
  updateScore();
}
