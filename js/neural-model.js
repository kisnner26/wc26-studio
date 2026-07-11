import { CONFIG } from './config.js';
import { clamp, normalizeRange, sigmoid, relu } from './math-utils.js';
import { populationPrior, heritagePrior, confederationPrior } from './country-factors.js';
export { sigmoid, relu };
export function normalize(team){
  return {
    fifa: 1 - normalizeRange(team.fifaRank,1,90), elo: normalizeRange(team.elo,1450,2200), squad: normalizeRange(team.squadValue,20,1200),
    attack: team.attack/100, midfield: team.midfield/100, defense: team.defense/100, goalkeeper: team.goalkeeper/100,
    coach: team.coach/100, form: team.form/100, experience: team.experience/100, depth: team.depth/100, starPower: team.starPower/100,
    recentAttack: normalizeRange(team.recentGoalsFor??1.3,.55,2.5),
    recentDefense: 1-normalizeRange(team.recentGoalsAgainst??1.3,.45,2.05),
    history: heritagePrior(team.id), confederation: confederationPrior(team.id), population: populationPrior(team.id),
    agePenalty: Math.abs((team.avgAge??27)-27)/10, injuries: (team.injuriesPenalty??0)/100, home: (team.homeAdvantage??0)/100
  };
}
export function weightedScore(features, weights=CONFIG.weights){
  return features.fifa*weights.fifa + features.elo*weights.elo + features.squad*weights.squad + features.attack*weights.attack +
    features.midfield*weights.midfield + features.defense*weights.defense + features.goalkeeper*weights.goalkeeper + features.coach*weights.coach +
    features.form*weights.form + features.experience*weights.experience + features.depth*weights.depth + features.starPower*weights.starPower +
    features.recentAttack*weights.recentAttack + features.recentDefense*weights.recentDefense +
    features.history*weights.history + features.confederation*weights.confederation + features.population*weights.population +
    features.home*weights.home - features.agePenalty*weights.agePenalty - features.injuries*weights.injuries;
}
export function teamStrengthModel(team){
  const f=normalize(team); const raw=weightedScore(f); return clamp(sigmoid((raw-.50)*5.3),.05,.98);
}

// ── Ratings ofensivo/defensivo separados ──────────────────────────────────────
// Patrón del modelo v1: vectores propios en lugar de mezclar en una lambda única.
// Usados por expectedGoalsFor() en match-engine para el multiplicador exponencial.
export function attackRating(team){
  if(team._atk!=null) return team._atk;
  const f=normalize(team);
  // Pesos: ataque x midfield x form x squad — no el global teamStrength
  const base = (f.attack*0.43 + f.midfield*0.17 + f.form*0.14 + f.squad*0.10 + f.recentAttack*0.12 + f.starPower*0.04);
  const star = Math.max(0, (team.starPower-85)*0.006);
  return clamp(base+star, 0.05, 0.99);
}
export function defenseRating(team){
  if(team._def!=null) return team._def;
  const f=normalize(team);
  // Portero entra por separado (independiente del vector de features estándar)
  const base = (f.defense*0.46 + f.midfield*0.14 + f.experience*0.12 + f.form*0.10 + f.recentDefense*0.14 + f.depth*0.04);
  const gk = normalizeRange(team.goalkeeper??75, 35, 98);
  return clamp(base*0.82 + gk*0.18, 0.05, 0.99);
}

// Pre-calcula y cachea en el objeto equipo — llamar una vez antes del Monte Carlo.
// Evita recomputar ~100k × 48 × varios partidos = millones de llamadas.
export function cacheRatings(teams){
  teams.forEach(t=>{
    t._atk=null; t._def=null;  // limpiar cache previo
    t._atk=attackRating(t);
    t._def=defenseRating(t);
  });
}

export function playerPerformanceModel(player, team){
  const teamBoost=teamStrengthModel(team); const minutes=(player.expectedMinutes||420)/700; const health=1-(player.injuryRisk||0);
  const role=(player.teamAttackShare||.2)+((player.penaltyTaker?0.055:0)+(player.freeKickTaker?0.025:0));
  return clamp(sigmoid((teamBoost*.42+minutes*.22+health*.16+role*.25+(player.form||80)/100*.18-.55)*4),.03,.97);
}
