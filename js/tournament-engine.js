import { TEAMS, teamById } from './data-teams.js';
import { GROUPS, buildGroupFixtures } from './data-fixtures.js';
import { simulateMatch } from './match-engine.js';
import { teamStrengthModel } from './neural-model.js';
import { sampleGaussian, clamp } from './math-utils.js';
function emptyStanding(id){return {id,pts:0,gf:0,ga:0,gd:0,w:0,d:0,l:0};}
function applyMatch(st,a,b,m){
  st[a].gf+=m.goalsA; st[a].ga+=m.goalsB; st[b].gf+=m.goalsB; st[b].ga+=m.goalsA;
  st[a].gd=st[a].gf-st[a].ga; st[b].gd=st[b].gf-st[b].ga;
  if(m.draw){st[a].pts++;st[b].pts++;st[a].d++;st[b].d++;}
  else if(m.winner===a){st[a].pts+=3;st[a].w++;st[b].l++;} else {st[b].pts+=3;st[b].w++;st[a].l++;}
}
function rankStandings(rows){return [...rows].sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||teamById(b.id).elo-teamById(a.id).elo||teamById(a.id).fifaRank-teamById(b.id).fifaRank);}
function bracketSeed(ids){return [...ids].sort((a,b)=>teamStrengthModel(teamById(b))-teamStrengthModel(teamById(a)));}
function firstRoundPairs(ids){
  const s=bracketSeed(ids); const pairs=[]; for(let i=0;i<16;i++) pairs.push([s[i],s[31-i]]); return pairs;
}
function pairSequential(ids){ const pairs=[]; for(let i=0;i<ids.length;i+=2) pairs.push([ids[i],ids[i+1]]); return pairs; }
function simulatePairs(pairs, phase, startNo, collectEvents=true, resolver=teamById){
  const winners=[], losers=[], matches=[]; let no=startNo, upsets=0;
  for(const [a,b] of pairs){ const m={...simulateMatch(resolver(a),resolver(b),{allowDraw:false,phase,collectEvents}), matchNo:no++, phase}; winners.push(m.winner); losers.push(m.loser); if(m.upset) upsets++; if(collectEvents) matches.push(m); }
  return {winners,losers,matches,nextNo:no,upsets};
}
function addMatchNo(m, no, phase){ return {...m, matchNo:no, phase}; }
export function simulateTournament({collectDetails=true}={}){
  const fixtures=buildGroupFixtures();
  // Team-level correlation: a good/bad tournament state persists across matches.
  // This avoids each match being independent noise and produces more realistic hot/cold runs.
  const ctx=Object.fromEntries(TEAMS.map(t=>{
    // Less-observed squads receive wider uncertainty instead of false precision.
    const uncertainty=.026+clamp((140-(t.squadValue||0))/420,0,.022)+clamp(((t.fifaRank||40)-45)/1100,0,.018);
    const momentum=sampleGaussian(1,uncertainty);
    const fatigue=sampleGaussian(1,.018+(1-(t.depth||65)/100)*.025);
    return [t.id,{...t,
      _atk:null,_def:null,
      attack:clamp(t.attack*momentum,45,99),
      midfield:clamp(t.midfield*momentum,45,99),
      defense:clamp(t.defense*(2-momentum)*fatigue,45,99),
      form:clamp(t.form*momentum,45,99),
      injuriesPenalty:clamp((t.injuriesPenalty||0)+(fatigue<.985?2:0),0,18)
    }];
  }));
  const ctxTeam=id=>ctx[id]||teamById(id);
  const standingsByGroup={}, groupMatches=[], teamGoals=Object.fromEntries(TEAMS.map(t=>[t.id,{gf:0,ga:0}]));
  for(const gr of GROUPS) standingsByGroup[gr.group]=Object.fromEntries(gr.teams.map(id=>[id,emptyStanding(id)]));
  for(const f of fixtures){
    const m0=simulateMatch(ctxTeam(f.teamA),ctxTeam(f.teamB),{allowDraw:true,phase:'group',collectEvents:collectDetails});
    const m={...m0,group:f.group,matchNo:f.matchNo,phase:'group',day:f.day}; if(collectDetails) groupMatches.push(m); applyMatch(standingsByGroup[f.group],f.teamA,f.teamB,m);
    teamGoals[f.teamA].gf+=m.goalsA; teamGoals[f.teamA].ga+=m.goalsB; teamGoals[f.teamB].gf+=m.goalsB; teamGoals[f.teamB].ga+=m.goalsA;
  }
  const groupRanks={}, firstSecond=[], thirds=[];
  for(const gr of GROUPS){ const ranked=rankStandings(Object.values(standingsByGroup[gr.group])); groupRanks[gr.group]=ranked; firstSecond.push(ranked[0].id,ranked[1].id); thirds.push(ranked[2]); }
  const bestThirds=rankStandings(thirds).slice(0,8).map(t=>t.id);
  const qualified=[...firstSecond,...bestThirds];
  const r32=simulatePairs(firstRoundPairs(qualified),'r32',73,collectDetails,ctxTeam);
  const r16=simulatePairs(pairSequential(r32.winners),'r16',89,collectDetails,ctxTeam);
  const quarter=simulatePairs(pairSequential(r16.winners),'quarter',97,collectDetails,ctxTeam);
  const semi=simulatePairs(pairSequential(quarter.winners),'semi',101,collectDetails,ctxTeam);
  const thirdPlace=simulatePairs([[semi.losers[0],semi.losers[1]]],'thirdPlace',103,collectDetails,ctxTeam);
  const final=simulatePairs([[semi.winners[0],semi.winners[1]]],'final',104,collectDetails,ctxTeam);
  const champion=final.winners[0], runnerUp=final.losers[0];
  const allMatches=collectDetails?[...groupMatches,...r32.matches,...r16.matches,...quarter.matches,...semi.matches,...thirdPlace.matches,...final.matches].sort((a,b)=>a.matchNo-b.matchNo):[];
  return {champion,runnerUp,thirdPlace:thirdPlace.winners[0],semifinalists:semi.winners.concat(semi.losers),quarterfinalists:quarter.winners.concat(quarter.losers),groupQualified:qualified,teamGoals,groupMatches,groupRanks,allMatches,knockout:{r32,r16,quarter,semi,thirdPlace,final},upsets:r32.upsets+r16.upsets+quarter.upsets+semi.upsets+thirdPlace.upsets+final.upsets};
}
