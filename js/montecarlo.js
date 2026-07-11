import { TEAMS } from './data-teams.js';
import { simulateTournament } from './tournament-engine.js';

let cancelRequested=false;
let activeWorker=null;

export function cancelMonteCarlo(){
  cancelRequested=true;
  if(activeWorker) activeWorker.postMessage({type:'cancel'});
}

function initAccumulator(){
  const teams=Object.fromEntries(TEAMS.map(t=>[t.id,{team:t,champion:0,final:0,semi:0,quarter:0,groupAdvance:0,gf:0,ga:0}]));
  return {teams,total:0,totalGoals:0,upsets:0,lastTournament:null};
}
export function summarize(acc){
  const total=Math.max(1,acc.total);
  const teamRows=Object.values(acc.teams).map(r=>({
    ...r.team, championProb:r.champion/total, finalProb:r.final/total, semiProb:r.semi/total, quarterProb:r.quarter/total,
    groupAdvanceProb:r.groupAdvance/total, avgGF:r.gf/total, avgGA:r.ga/total
  })).sort((a,b)=>b.championProb-a.championProb);
  return {simulations:acc.total,teams:teamRows,totalGoalsPerTournament:acc.totalGoals/total,upsetRate:acc.upsets/total,lastTournament:acc.lastTournament,generatedAt:new Date().toISOString()};
}

function runMonteCarloFallback(totalSimulations, chunkSize=2500, onProgress=()=>{}, onComplete=()=>{}){
  cancelRequested=false; const acc=initAccumulator(); const started=performance.now();
  function runChunk(){
    const end=Math.min(acc.total+chunkSize,totalSimulations);
    for(;acc.total<end;acc.total++){
      if(cancelRequested){ acc.lastTournament=simulateTournament({collectDetails:true}); onComplete(summarize(acc),true); return; }
      const needsDetails=acc.total===totalSimulations-1;
      const t=simulateTournament({collectDetails:needsDetails}); if(needsDetails) acc.lastTournament=t;
      acc.teams[t.champion].champion++;
      for(const id of [t.champion,t.runnerUp]) acc.teams[id].final++;
      for(const id of t.semifinalists) acc.teams[id].semi++;
      for(const id of t.quarterfinalists) acc.teams[id].quarter++;
      for(const id of t.groupQualified) acc.teams[id].groupAdvance++;
      for(const [id,g] of Object.entries(t.teamGoals)){ acc.teams[id].gf+=g.gf; acc.teams[id].ga+=g.ga; acc.totalGoals+=g.gf; }
      acc.upsets+=t.upsets;
    }
    const progress=acc.total/totalSimulations; const elapsed=performance.now()-started; const eta=progress>0?(elapsed/progress-elapsed):0;
    onProgress({completed:acc.total,total:totalSimulations,progress,elapsed,eta});
    if(acc.total<totalSimulations) setTimeout(runChunk,0); else onComplete(summarize(acc),false);
  }
  setTimeout(runChunk,0);
}

export function runMonteCarlo(totalSimulations, chunkSize=5000, onProgress=()=>{}, onComplete=()=>{}){
  cancelRequested=false;
  const canUseWorker = typeof Worker !== 'undefined' && location.protocol !== 'file:';
  if(!canUseWorker) return runMonteCarloFallback(totalSimulations, chunkSize, onProgress, onComplete);
  try{
    const worker = new Worker(new URL('./montecarlo-worker.js', import.meta.url), {type:'module'});
    activeWorker = worker;
    worker.onmessage = ({data}) => {
      if(data?.type==='progress') onProgress(data.payload);
      if(data?.type==='complete'){
        worker.terminate(); activeWorker=null;
        onComplete(data.results, data.cancelled);
      }
    };
    worker.onerror = () => {
      worker.terminate(); activeWorker=null;
      runMonteCarloFallback(totalSimulations, chunkSize, onProgress, onComplete);
    };
    worker.postMessage({type:'run', totalSimulations, chunkSize});
  }catch(_err){
    activeWorker=null;
    runMonteCarloFallback(totalSimulations, chunkSize, onProgress, onComplete);
  }
}
