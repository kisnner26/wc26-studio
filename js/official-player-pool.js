import { SQUADS } from './data-squads.js';
import { teamById } from './data-teams.js';

const POS_MAP = { GK:'GK', PO:'GK', DF:'DF', MF:'MF', MC:'MF', FW:'FW', DC:'FW' };
const CONTINENT_CLUB_HINT = /(Real Madrid|Barcelona|Atlético|Manchester|Liverpool|Arsenal|Chelsea|Tottenham|Bayern|Dortmund|Leverkusen|PSG|Paris|Inter|Juventus|Milan|Napoli|Benfica|Porto|Sporting|Newcastle|Aston Villa|Crystal Palace|Brighton|Fulham|West Ham|Marseille|Lyon|Nice|Monaco|Atalanta|Roma|Betis|Villarreal|Leipzig)/i;

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function normPos(pos){ return POS_MAP[pos] || pos || 'MF'; }
function nameInitials(name=''){
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase() || '??';
}
function displayName(name=''){
  // PDF uses mostly "Apellido Nombre". For public photo APIs, "Nombre Apellido" usually works better.
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if(parts.length===2) return `${parts[1]} ${parts[0]}`;
  return name;
}
function estimateRates(player, team){
  const pos = normPos(player.pos);
  const caps = Math.max(1, Number(player.caps||0));
  const goals = Math.max(0, Number(player.goals||0));
  const gpc = goals / caps;
  const star = player.star ? 1.16 : 1;
  const age = Number(player.age||27);
  const ageCurve = pos==='FW' ? clamp(1 - Math.abs(age-27)*0.018, .72, 1.06) : clamp(1 - Math.abs(age-28)*0.012, .78, 1.04);
  const clubBoost = CONTINENT_CLUB_HINT.test(player.club||'') ? 1.06 : 1;
  const teamAttack = team ? clamp((team.attack + team.form + team.starPower) / 255, .72, 1.22) : 1;
  let goalRate;
  if(pos==='FW') goalRate = .16 + clamp(gpc,0,.78)*.58;
  else if(pos==='MF') goalRate = .045 + clamp(gpc,0,.36)*.40;
  else if(pos==='DF') goalRate = .012 + clamp(gpc,0,.18)*.28;
  else goalRate = .001;
  goalRate = clamp(goalRate * star * ageCurve * clubBoost * teamAttack, .001, pos==='FW'?.74:pos==='MF'?.32:pos==='DF'?.12:.004);
  let assistRate = (pos==='FW' ? .11 : pos==='MF' ? .18 : pos==='DF' ? .045 : .001);
  assistRate *= (player.star?1.18:1) * clubBoost * clamp((team?.attack||78)/82,.82,1.2);
  assistRate += clamp(gpc,0,.45) * (pos==='MF'?.14:.07);
  return {goalRate:clamp(goalRate,.001,.78), assistRate:clamp(assistRate,.001,.42)};
}

export function officialPlayersForTeam(teamId){
  const team=teamById(teamId);
  const squad = SQUADS[teamId]?.players || [];
  if(!squad.length) return [];
  const enriched = squad.map(p=>{
    const position = normPos(p.pos);
    const rates = estimateRates(p, team);
    const caps = Number(p.caps||0), goals = Number(p.goals||0);
    const seniority = clamp(caps/80, 0, 1);
    const form = clamp(58 + (p.star?18:0) + seniority*14 + (CONTINENT_CLUB_HINT.test(p.club||'')?6:0) - Math.max(0,(Number(p.age||27)-31))*1.2, 45, 96);
    const clubWorkload = CONTINENT_CLUB_HINT.test(p.club||'') ? 1 : 0;
    const expectedMinutes = position==='GK' ? 0 : Math.round(clamp((position==='FW'?225:position==='MF'?255:238) + seniority*90 + (p.star?82:0) + clubWorkload*18, 65, 525));
    const attackShare = position==='FW' ? .16 + rates.goalRate*.28 + (p.star?.08:0) : position==='MF' ? .10 + rates.assistRate*.22 + (p.star?.04:0) : .035 + rates.goalRate*.12;
    return {
      ...p,
      country: teamId,
      position,
      pos: position,
      displayName: displayName(p.name),
      initials: nameInitials(p.name),
      expectedMinutes,
      goalRate: rates.goalRate,
      assistRate: rates.assistRate,
      penaltyTaker:false,
      freeKickTaker:false,
      teamAttackShare: clamp(attackShare, .015, .36),
      injuryRisk: clamp(.025 + Math.max(0,(Number(p.age||27)-30))*.012 + clubWorkload*.012 + (position==='FW'?.006:0) - seniority*.01, .02, .22),
      form,
      creativeRole: 'Convocatoria oficial FIFA',
      caps,
      goals
    };
  });
  const outfield=enriched.filter(p=>p.position!=='GK');
  const pk = [...outfield].sort((a,b)=>(b.star?1:0)-(a.star?1:0) || b.goals-a.goals || b.goalRate-a.goalRate)[0];
  const fk = [...outfield].sort((a,b)=>b.assistRate-a.assistRate || b.caps-a.caps)[0];
  if(pk) pk.penaltyTaker=true;
  if(fk) fk.freeKickTaker=true;
  return enriched;
}

export const OFFICIAL_PLAYERS = Object.keys(SQUADS).flatMap(officialPlayersForTeam);

export function activeOutfieldPlayers(teamId){
  return officialPlayersForTeam(teamId).filter(p=>p.position!=='GK');
}
