import { TEAMS } from './data-teams.js';
import { simulateTournament } from './tournament-engine.js';

let cancelled = false;

function initAccumulator(){
  const teams=Object.fromEntries(TEAMS.map(t=>[t.id,{team:t,champion:0,final:0,semi:0,quarter:0,groupAdvance:0,gf:0,ga:0}]));
  return {teams,total:0,totalGoals:0,upsets:0,lastTournament:null};
}
function summarize(acc){
  const total=Math.max(1,acc.total);
  const teamRows=Object.values(acc.teams).map(r=>({
    ...r.team, championProb:r.champion/total, finalProb:r.final/total, semiProb:r.semi/total, quarterProb:r.quarter/total,
    groupAdvanceProb:r.groupAdvance/total, avgGF:r.gf/total, avgGA:r.ga/total
  })).sort((a,b)=>b.championProb-a.championProb);
  return {simulations:acc.total,teams:teamRows,totalGoalsPerTournament:acc.totalGoals/total,upsetRate:acc.upsets/total,lastTournament:acc.lastTournament,generatedAt:new Date().toISOString()};
}

self.onmessage = ({data}) => {
  if(data?.type==='cancel'){ cancelled=true; return; }
  if(data?.type!=='run') return;
  cancelled=false;
  const totalSimulations = Math.max(1, Number(data.totalSimulations)||1);
  const chunkSize = Math.max(250, Number(data.chunkSize)||5000);
  const acc=initAccumulator();
  const started=performance.now();
  let lastPost=0;

  while(acc.total<totalSimulations){
    const end=Math.min(acc.total+chunkSize,totalSimulations);
    for(;acc.total<end;acc.total++){
      if(cancelled){
        acc.lastTournament=simulateTournament({collectDetails:true});
        self.postMessage({type:'complete',results:summarize(acc),cancelled:true});
        return;
      }
      const needsDetails = acc.total === totalSimulations - 1;
      const t=simulateTournament({collectDetails:needsDetails});
      if(needsDetails) acc.lastTournament=t;
      acc.teams[t.champion].champion++;
      for(const id of [t.champion,t.runnerUp]) acc.teams[id].final++;
      for(const id of t.semifinalists) acc.teams[id].semi++;
      for(const id of t.quarterfinalists) acc.teams[id].quarter++;
      for(const id of t.groupQualified) acc.teams[id].groupAdvance++;
      for(const [id,g] of Object.entries(t.teamGoals)){ acc.teams[id].gf+=g.gf; acc.teams[id].ga+=g.ga; acc.totalGoals+=g.gf; }
      acc.upsets+=t.upsets;
    }
    const now=performance.now();
    if(now-lastPost>90 || acc.total>=totalSimulations){
      const progress=acc.total/totalSimulations; const elapsed=now-started; const eta=progress>0?(elapsed/progress-elapsed):0;
      self.postMessage({type:'progress',payload:{completed:acc.total,total:totalSimulations,progress,elapsed,eta}});
      lastPost=now;
    }
  }
  self.postMessage({type:'complete',results:summarize(acc),cancelled:false});
};
