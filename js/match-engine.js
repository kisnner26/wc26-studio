import { CONFIG } from './config.js';
import { sampleNormalish, clamp, sigmoid } from './math-utils.js';
import { teamStrengthModel, attackRating, defenseRating } from './neural-model.js';
import { activeOutfieldPlayers } from './official-player-pool.js';

function teamPlayers(teamId){
  const list=activeOutfieldPlayers(teamId);
  if(list.length) return list;
  return [
    {id:`${teamId}-fw`,name:`${teamId} Delantero principal`,country:teamId,position:'FW',goalRate:.28,assistRate:.10,penaltyTaker:true,teamAttackShare:.28,expectedMinutes:420,form:68,creativeRole:'Slot editable'},
    {id:`${teamId}-mf`,name:`${teamId} Mediocampista creativo`,country:teamId,position:'MF',goalRate:.10,assistRate:.22,penaltyTaker:false,teamAttackShare:.18,expectedMinutes:460,form:68,creativeRole:'Slot editable'},
    {id:`${teamId}-wing`,name:`${teamId} Extremo`,country:teamId,position:'FW',goalRate:.18,assistRate:.16,penaltyTaker:false,teamAttackShare:.20,expectedMinutes:400,form:68,creativeRole:'Slot editable'}
  ];
}
function poissonProbability(k, lambda){
  let factorial=1;
  for(let i=2;i<=k;i++) factorial*=i;
  return Math.exp(-lambda)*Math.pow(lambda,k)/factorial;
}

function dixonColesTau(homeGoals, awayGoals, homeXg, awayXg, rho){
  if(homeGoals===0 && awayGoals===0) return 1-homeXg*awayXg*rho;
  if(homeGoals===0 && awayGoals===1) return 1+homeXg*rho;
  if(homeGoals===1 && awayGoals===0) return 1+awayXg*rho;
  if(homeGoals===1 && awayGoals===1) return 1-rho;
  return 1;
}

// Joint score sampler with the Dixon–Coles low-score correction. Unlike two
// unrelated Poisson draws, this models the observed dependence around 0-0,
// 1-0, 0-1 and 1-1 while preserving each team's expected-goal intensity.
export function sampleDixonColesScore(homeXg, awayXg){
  const cells=[];
  let total=0;
  const max=CONFIG.maxScoreGrid;
  for(let a=0;a<=max;a++) for(let b=0;b<=max;b++){
    const probability=Math.max(0,
      poissonProbability(a,homeXg)*poissonProbability(b,awayXg)*
      dixonColesTau(a,b,homeXg,awayXg,CONFIG.dixonColesRho)
    );
    total+=probability;
    cells.push({a,b,probability});
  }
  let draw=Math.random()*total;
  for(const cell of cells){
    draw-=cell.probability;
    if(draw<=0) return [cell.a,cell.b];
  }
  return [0,0];
}
function weightedPick(list, weightFn){
  const weights=list.map(x=>Math.max(.01, weightFn(x))); const total=weights.reduce((a,b)=>a+b,0); let r=Math.random()*total;
  for(let i=0;i<list.length;i++){ r-=weights[i]; if(r<=0) return list[i]; }
  return list[list.length-1];
}
function goalEvent(team, minute, isPenalty=false, scorerCounts={}){
  const squad=teamPlayers(team.id);
  const candidatePool=squad.filter(p=>(scorerCounts[p.id]||0)<3);
  const pickPool=candidatePool.length?candidatePool:squad;
  const scorer=isPenalty
    ? (pickPool.find(p=>p.penaltyTaker && (scorerCounts[p.id]||0)<3) || weightedPick(pickPool,p=>p.goalRate*(p.teamAttackShare||.18)))
    : weightedPick(pickPool,p=>{
        const already=scorerCounts[p.id]||0;
        const repeatPenalty=already===0?1:already===1?.18:.018;
        return p.goalRate*(p.teamAttackShare||.18)*(p.form||75)/75*repeatPenalty;
      });
  scorerCounts[scorer.id]=(scorerCounts[scorer.id]||0)+1;
  let assister=null;
  if(!isPenalty && Math.random()>.24){
    const pool=squad.filter(p=>p.id!==scorer.id);
    assister=weightedPick(pool.length?pool:squad,p=>(p.assistRate||.08)*(p.expectedMinutes||360)/360*((p.form||75)/75));
  }
  return {minute,team:team.id,scorer:scorer.name,assist:assister?.name||null,penalty:isPenalty};
}
export function expectedGoalsFor(teamA, teamB, phase='group'){
  // Vectores ofensivo/defensivo separados (patrón del modelo v1):
  // más interpretable y calibrable que mezclar todo en una lambda única.
  const atkA = attackRating(teamA);   // 0..1 — ataque + midfield + form + squad
  const defB = defenseRating(teamB);  // 0..1 — defensa + midfield + experiencia + portero

  // Diferencia de fuerza con multiplicador exponencial (patrón del modelo v1):
  // exp(diff * swing) amplifica diferencias extremas de forma no lineal.
  // En partidos parejos (diff≈0) → factor≈1; en desequilibrios grandes → efecto real.
  const diff = atkA - defB;
  const strengthFactor = Math.exp(diff * CONFIG.strengthSwing);  // 1.28 default

  // Ajuste ELO suave: sqrt(exp(elo_diff/eloDivisor)) — igual al modelo v1.
  const eloRaw = Math.exp((teamA.elo - teamB.elo) / CONFIG.eloDivisor);  // 420
  const eloFactor = clamp(Math.sqrt(eloRaw), 0.65, 1.55);

  // Ajuste de fase (r32→final son partidos más cerrados)
  const phaseAdj = CONFIG.phaseAdjustments[phase] || 1;

  // Ventaja local
  const homeBoost = teamA.homeAdvantage
    ? (1 + CONFIG.homeBoostFactor * (teamA.homeAdvantage / 10))
    : 1;

  return clamp(CONFIG.baseGoalRate * strengthFactor * eloFactor * phaseAdj * homeBoost, 0.08, 3.10);
}
export function penaltyWinProbability(teamA, teamB){
  const p=CONFIG.penalty;
  const delta=(teamA.goalkeeper-teamB.goalkeeper)/100*p.keeperWeight + (teamA.experience-teamB.experience)/100*p.experienceWeight + ((teamA.elo-teamB.elo)/700)*p.eloWeight - ((teamA.fifaRank-teamB.fifaRank)/80)*p.pressureWeight;
  return clamp(sigmoid(delta*4),.28,.72);
}
export function simulateMatch(teamA, teamB, {allowDraw=true, phase='group', collectEvents=true}={}){
  // A shared tempo term correlates both teams' chance volume. Separate finishing
  // terms preserve match-to-match variance without changing the latent ratings.
  const tempo=sampleNormalish(1,CONFIG.randomNoise*.62);
  const xgA=clamp(expectedGoalsFor(teamA,teamB,phase)*tempo*sampleNormalish(1,CONFIG.randomNoise*.42),.06,3.45);
  const xgB=clamp(expectedGoalsFor(teamB,teamA,phase)*tempo*sampleNormalish(1,CONFIG.randomNoise*.42),.06,3.45);
  const [goalsA,goalsB]=sampleDixonColesScore(xgA,xgB);
  let events=[];
  if(collectEvents){
    const minutes=[];
    for(let i=0;i<goalsA+goalsB;i++) minutes.push(Math.min(96,Math.max(1,Math.round(2+Math.sqrt(Math.random())*93))));
    minutes.sort((a,b)=>a-b);
    const scorerCountsA={}, scorerCountsB={};
    let idx=0; for(let i=0;i<goalsA;i++) events.push(goalEvent(teamA,minutes[idx++]||Math.round(Math.random()*90),Math.random()<.12,scorerCountsA));
    for(let i=0;i<goalsB;i++) events.push(goalEvent(teamB,minutes[idx++]||Math.round(Math.random()*90),Math.random()<.12,scorerCountsB));
    events.sort((a,b)=>a.minute-b.minute);
  }
  const result={teamA:teamA.id,teamB:teamB.id,goalsA,goalsB,winner:null,loser:null,draw:false,wentToPenalties:false,penaltyWinner:null,xgA,xgB,upset:false,events};
  if(goalsA>goalsB){result.winner=teamA.id;result.loser=teamB.id;} else if(goalsB>goalsA){result.winner=teamB.id;result.loser=teamA.id;} else if(allowDraw){result.draw=true;} else {
    result.wentToPenalties=true; result.penaltyWinner=Math.random()<penaltyWinProbability(teamA,teamB)?teamA.id:teamB.id; result.winner=result.penaltyWinner; result.loser=result.winner===teamA.id?teamB.id:teamA.id;
    result.penaltyScore=result.winner===teamA.id?`${3+Math.floor(Math.random()*3)}-${2+Math.floor(Math.random()*3)}`:`${2+Math.floor(Math.random()*3)}-${3+Math.floor(Math.random()*3)}`;
  }
  const fav=teamStrengthModel(teamA)>teamStrengthModel(teamB)?teamA.id:teamB.id; if(result.winner && result.winner!==fav) result.upset=true;
  return result;
}
