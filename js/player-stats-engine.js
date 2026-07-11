import { OFFICIAL_PLAYERS } from './official-player-pool.js';
import { teamById } from './data-teams.js';
import { poissonRandom, clamp } from './math-utils.js';
import { playerPerformanceModel } from './neural-model.js';

function estimateMatches(teamRow){return 3 + 1.1*teamRow.groupAdvanceProb + .85*teamRow.quarterProb + .7*teamRow.semiProb + .6*teamRow.finalProb;}
function playerExpected(player, teamRow){
  const team=teamById(player.country);
  const perf=playerPerformanceModel(player,team);
  const matches=estimateMatches(teamRow);
  const minutesFactor=clamp((player.expectedMinutes/90)/Math.max(3,matches),.18,1.05);
  const health=1-player.injuryRisk;
  const teamAttack=((team.attack+team.form+team.starPower)/300);
  const posFactor=player.position==='FW'?1:player.position==='MF'?.72:player.position==='DF'?.32:.02;
  const goals=player.goalRate*matches*minutesFactor*health*(.66+teamAttack*.38)*(.76+perf*.30)*posFactor+(player.penaltyTaker?.20:0);
  const assists=player.assistRate*matches*minutesFactor*health*(.72+teamAttack*.34)*(player.freeKickTaker?1.06:1);
  const mvpScore=goals*1.55+assists*1.05+perf*1.8+(teamRow.finalProb||0)*2.6+(teamRow.championProb||0)*5.0+(player.star?.25:0);
  return {goals:clamp(goals,0,7.2),assists:clamp(assists,0,6.2),mvpScore};
}
function jitter(mult=.22){ return Math.max(.55, 1 + (Math.random()-.5)*2*mult); }
export function simulatePlayerLeaderboards(teamRows, iterations=3000){
  const byTeam=Object.fromEntries(teamRows.map(t=>[t.id,t]));
  const pool=OFFICIAL_PLAYERS.filter(p=>p.position!=='GK' && (p.expectedMinutes||0)>40);
  const rows=pool.map(p=>({player:p,...playerExpected(p,byTeam[p.country]||{groupAdvanceProb:.25,quarterProb:.04,semiProb:.015,finalProb:.006,championProb:.002})}));
  const wins=Object.fromEntries(pool.map(p=>[p.id,{goldenBoot:0,topAssist:0,mvp:0,goalsTotal:0,assistsTotal:0}]));
  for(let i=0;i<iterations;i++){
    let bestG=null,bestA=null,bestM=null;
    for(const r of rows){
      const g=poissonRandom(r.goals*jitter(.30));
      const a=poissonRandom(r.assists*jitter(.28));
      const m=r.mvpScore*jitter(.18) + g*.72 + a*.50 + Math.random()*1.25;
      wins[r.player.id].goalsTotal+=g; wins[r.player.id].assistsTotal+=a;
      if(!bestG||g>bestG.v||(g===bestG.v&&Math.random()<.45)) bestG={id:r.player.id,v:g};
      if(!bestA||a>bestA.v||(a===bestA.v&&Math.random()<.45)) bestA={id:r.player.id,v:a};
      if(!bestM||m>bestM.v) bestM={id:r.player.id,v:m};
    }
    wins[bestG.id].goldenBoot++; wins[bestA.id].topAssist++; wins[bestM.id].mvp++;
  }
  const scorers=rows.map(r=>({...r.player,expectedGoals:wins[r.player.id].goalsTotal/iterations,goldenBootProb:wins[r.player.id].goldenBoot/iterations})).sort((a,b)=>b.goldenBootProb-a.goldenBootProb||b.expectedGoals-a.expectedGoals);
  const assisters=rows.map(r=>({...r.player,expectedAssists:wins[r.player.id].assistsTotal/iterations,topAssistProb:wins[r.player.id].topAssist/iterations})).sort((a,b)=>b.topAssistProb-a.topAssistProb||b.expectedAssists-a.expectedAssists);
  const mvp=rows.map(r=>({...r.player,expectedGoals:wins[r.player.id].goalsTotal/iterations,expectedAssists:wins[r.player.id].assistsTotal/iterations,mvpProb:wins[r.player.id].mvp/iterations,mvpScore:r.mvpScore})).sort((a,b)=>b.mvpProb-a.mvpProb||b.mvpScore-a.mvpScore);
  const disappointment=pickDisappointment(rows, wins, iterations, byTeam);
  return {scorers,assisters,mvp,disappointment};
}

function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function lang(){ return (typeof window!=='undefined' && window._wcLang) ? window._wcLang() : (localStorage.getItem('wc26-lang')||'es'); }
function reasonText(type, player, teamName){
  const L=lang();
  const dict={
    es:{
      minutes:`perdió peso en el once y su selección necesitó más desequilibrio por su banda.`,
      finishing:`tuvo varias llegadas claras, pero su definición quedó muy por debajo de lo esperado.`,
      pressure:`cargó con demasiada responsabilidad en ${teamName} y el modelo castigó sus partidos decisivos.`,
      knockout:`su equipo avanzó menos de lo esperado y eso hundió su impacto individual.`,
      discipline:`una actuación irregular, presión alta y poca precisión redujeron su influencia.`
    },
    fr:{
      minutes:`il a perdu du poids dans le onze et son équipe avait besoin de plus de différence sur son côté.`,
      finishing:`il a eu plusieurs situations, mais sa finition a été bien sous les attentes.`,
      pressure:`il a porté trop de responsabilité avec ${teamName} et le modèle l’a pénalisé dans les matchs clés.`,
      knockout:`son équipe est allée moins loin que prévu, ce qui a réduit son impact individuel.`,
      discipline:`matchs irréguliers, pression élevée et manque de précision ont réduit son influence.`
    },
    en:{
      minutes:`he lost influence in the starting XI and his team needed more final-third impact.`,
      finishing:`he got into good chances, but his finishing landed far below expectation.`,
      pressure:`he carried too much responsibility for ${teamName}, and the model punished his key-match output.`,
      knockout:`his team advanced less than expected, which dragged down his individual impact.`,
      discipline:`inconsistent performances, pressure and poor precision reduced his influence.`
    }
  };
  return (dict[L]||dict.en)[type];
}
function pickDisappointment(rows, wins, iterations, byTeam){
  const stars=rows
    .map(r=>{
      const w=wins[r.player.id];
      const avgG=w.goalsTotal/iterations, avgA=w.assistsTotal/iterations;
      const team=teamById(r.player.country);
      const teamRow=byTeam[r.player.country]||{};
      const expectation=r.goals*1.3+r.assists*.9+r.mvpScore*.55+(r.player.star?1.4:0)+(r.player.penaltyTaker?.35:0);
      const under=(r.goals-avgG)*1.2+(r.assists-avgA)*.85+Math.max(0,.18-(teamRow.championProb||0))*.8;
      return {r,score:expectation+under+Math.random()*2.4,teamName:team?.name||r.player.country,avgG,avgA};
    })
    .filter(x=>x.r.player.position!=='GK' && (x.r.player.star || x.r.goals>.55 || x.r.assists>.45 || x.r.mvpScore>2.2))
    .sort((a,b)=>b.score-a.score)
    .slice(0,36);
  const x=rand(stars.length?stars:rows.map(r=>({r,score:0,teamName:r.player.country,avgG:0,avgA:0})).slice(0,20));
  const type=rand(['minutes','finishing','pressure','knockout','discipline']);
  const simGoals=Math.max(0, Math.min(2, poissonRandom(Math.max(.02, x.avgG*.45))));
  const simAssists=Math.max(0, Math.min(2, poissonRandom(Math.max(.02, x.avgA*.42))));
  const rating=clamp(4.1 + Math.random()*2.0 + simGoals*.35 + simAssists*.25, 4.0, 6.7).toFixed(1);
  return {...x.r.player, simGoals, simAssists, simRating:rating, reason:reasonText(type,x.r.player,x.teamName), reasonType:type};
}
