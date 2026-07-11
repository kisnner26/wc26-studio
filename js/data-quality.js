import { TEAMS } from './data-teams.js';
import { teamStrengthModel } from './neural-model.js';
import { clamp } from './math-utils.js';

const numericBounds = {
  fifaRank:[1,120], elo:[1200,2250], squadValue:[20,1500], attack:[40,99], midfield:[40,99], defense:[40,99], goalkeeper:[40,99], coach:[40,99], form:[35,99], experience:[35,99], depth:[35,99], avgAge:[20,34], recentGoalsFor:[.4,3.2], recentGoalsAgainst:[.35,2.4], injuriesPenalty:[0,25], homeAdvantage:[0,15], starPower:[30,99]
};
export const DATA_QUALITY_VERSION = 'v11-multifactor-dc';

export async function loadTeamDataOverrides(url='./data/team-overrides.json'){
  const report={loaded:false, updatedAt:null, source:'static bundled data', changed:0, errors:[]};
  try{
    const res=await fetch(`${url}?v=${Date.now()}`, {cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const json=await res.json();
    report.loaded=true; report.updatedAt=json.updatedAt||null; report.source=json.source||url;
    report.sourceUrls=json.sourceUrls||[];
    const overrides=json.teams||{};
    for(const [id,patch] of Object.entries(overrides)){
      const team=TEAMS.find(t=>t.id===id); if(!team) continue;
      for(const [k,v] of Object.entries(patch)){
        if(k in numericBounds && Number.isFinite(Number(v))){
          const [min,max]=numericBounds[k]; team[k]=clamp(Number(v),min,max); report.changed++;
        }
      }
    }
    report.overriddenTeams=Object.keys(overrides).length;
  }catch(err){ report.errors.push(String(err?.message||err)); }
  return report;
}

// ─── Historical back-test dataset ─────────────────────────────────────────────
// Feature snapshots assembled from FIFA ranking archives, Transfermarkt historical
// valuations (inflation-adjusted to 2022 M€ equivalent), and ELO ratings (eloratings.net).
// 5 editions (2006-2022): 40 team-snapshots, sufficient for L2-regularized calibration.
// Cross-reference:
//   https://www.eloratings.net/World
//   https://www.transfermarkt.com/statistik/weltrangliste
//   https://www.rsssf.org/tables  (historical FIFA rankings)
const HISTORICAL = [
  {
    year:2022, host:'QAT',
    actualChampion:'ARG', actualSemis:['ARG','FRA','CRO','MAR'],
    actualFinal:{winner:'ARG', loser:'FRA', penalties:true},
    teams:[
      // [id, fifaRank, elo, squadValue, attack, midfield, defense, goalkeeper, coach, form, experience, depth, avgAge, goalsFor, goalsAgainst, injuriesPenalty, homeAdv, starPower]
      ['BRA',1,2160,1040,91,84,84,84,82,85,87,88,27.7,2.05,.75,0,0,94],
      ['ARG',3,2095,760,88,86,82,83,88,84,93,86,28.1,2.00,.82,0,0,92],
      ['FRA',4,2055,1090,92,87,82,84,83,84,86,91,27.4,2.25,.90,3,0,95],
      ['ENG',5,2030,1200,89,86,84,83,84,83,82,89,26.6,2.10,.80,0,0,91],
      ['ESP',7,1985,830,85,90,83,81,85,82,78,88,26.1,1.95,.85,0,0,88],
      ['NED',8,1970,620,84,83,85,84,82,82,84,82,26.8,1.75,.80,0,0,86],
      ['CRO',12,1890,340,77,84,78,80,82,80,90,74,28.9,1.45,.95,0,0,78],
      ['MAR',22,1765,260,73,74,80,78,76,78,72,72,27.2,1.25,.92,0,0,76]
    ]
  },
  {
    year:2018, host:'RUS',
    actualChampion:'FRA', actualSemis:['FRA','CRO','BEL','ENG'],
    actualFinal:{winner:'FRA', loser:'CRO', penalties:false},
    teams:[
      ['GER',1,2090,980,88,87,83,86,82,81,90,88,27.6,2.10,.90,0,0,91],
      ['BRA',2,2075,990,90,84,85,82,82,84,84,90,27.3,2.05,.80,0,0,93],
      ['FRA',7,1995,1040,90,84,83,86,82,83,78,92,26.2,2.20,.90,0,0,94],
      ['BEL',3,2035,780,88,84,80,82,80,84,82,88,27.5,2.15,.95,0,0,91],
      ['ENG',12,1915,830,84,80,78,79,80,82,76,85,25.9,1.85,.90,0,0,88],
      ['CRO',20,1835,340,78,85,78,80,80,81,88,76,28.5,1.55,1.00,0,0,79],
      ['ARG',5,1980,720,86,80,75,77,74,73,88,84,28.7,1.90,1.15,0,0,92],
      ['ESP',10,1965,790,84,89,82,81,77,78,82,86,28.2,1.85,.90,0,0,87]
    ]
  },
  {
    year:2014, host:'BRA',
    actualChampion:'GER', actualSemis:['GER','ARG','NED','BRA'],
    actualFinal:{winner:'GER', loser:'ARG', penalties:false},
    teams:[
      ['BRA',10,2080,890,88,80,78,82,80,78,86,84,28.3,1.90,.90,0,12,91],
      ['GER',2,2100,1020,88,88,85,86,84,84,90,86,27.8,2.15,.80,0,0,90],
      ['ARG',5,2030,710,86,82,79,80,84,80,88,82,27.9,1.95,.78,0,0,93],
      ['ESP',1,2080,980,85,92,84,82,86,82,82,88,27.2,1.80,.75,0,0,89],
      ['NED',15,1980,680,84,82,86,82,80,82,82,80,27.1,1.90,.78,0,0,86],
      ['BEL',11,1915,610,83,80,78,78,76,78,78,82,26.5,1.75,.90,0,0,84],
      ['FRA',17,1880,880,86,82,78,78,74,74,76,86,26.4,1.70,.88,0,0,86],
      ['CHI',14,1835,340,76,78,76,76,76,78,80,74,27.4,1.52,.95,0,0,77]
    ]
  },
  {
    year:2010, host:'RSA',
    actualChampion:'ESP', actualSemis:['ESP','NED','GER','URU'],
    actualFinal:{winner:'ESP', loser:'NED', penalties:false},
    // ELO: eloratings.net archive Jun 2010. Squad values: Transfermarkt Jul 2010, ×3.2 inflation to 2022 M€.
    teams:[
      ['BRA',2,2050,920,88,82,82,82,80,80,88,88,28.6,1.92,.72,2,0,92],
      ['ESP',1,2060,780,86,92,84,82,86,84,82,86,26.8,1.80,.72,1,0,88],
      ['GER',6,1980,760,84,80,82,80,78,80,82,84,25.8,1.88,.82,1,0,82],
      ['NED',4,1985,620,84,82,84,82,80,82,82,78,27.2,1.85,.78,2,0,84],
      ['ARG',7,1985,680,86,78,74,76,72,76,84,80,27.5,1.78,.85,2,0,90],
      ['URU',18,1845,280,76,74,78,76,74,78,82,70,28.4,1.42,.82,1,0,76],
      ['GHA',32,1748,190,72,70,72,68,68,74,70,66,26.1,1.28,.88,1,0,70],
      ['PAR',31,1752,185,70,70,74,70,66,72,74,66,27.8,1.18,.85,1,0,68]
    ]
  },
  {
    year:2006, host:'GER',
    actualChampion:'ITA', actualSemis:['ITA','FRA','GER','POR'],
    actualFinal:{winner:'ITA', loser:'FRA', penalties:true},
    // ELO: eloratings.net archive Jun 2006. Squad values: Transfermarkt Jul 2006, ×4.1 inflation to 2022 M€.
    teams:[
      ['BRA',1,2100,860,90,84,82,82,82,82,90,88,29.2,2.00,.72,2,0,95],
      ['ITA',12,1965,760,82,82,86,86,82,82,86,80,29.4,1.62,.62,3,0,84],
      ['GER',22,1958,780,82,78,80,78,80,80,80,82,26.8,1.75,.90,2,10,82],
      ['FRA',5,2000,780,80,84,82,80,82,76,88,78,29.8,1.58,.72,3,0,86],
      ['ENG',9,1958,920,82,80,80,80,76,78,82,82,26.2,1.65,.82,4,0,88],
      ['ARG',4,2000,680,84,80,76,76,80,80,82,78,27.2,1.78,.72,2,0,88],
      ['POR',10,1932,680,80,78,76,76,76,78,80,74,26.5,1.60,.78,2,0,86],
      ['CZE',2,1940,440,78,78,76,76,76,76,78,72,28.2,1.50,.88,2,0,78]
    ]
  }
];

function rowToTeam(r){
  return {
    id:r[0], fifaRank:r[1], elo:r[2], squadValue:r[3],
    attack:r[4], midfield:r[5], defense:r[6], goalkeeper:r[7],
    coach:r[8], form:r[9], experience:r[10], depth:r[11],
    avgAge:r[12], recentGoalsFor:r[13], recentGoalsAgainst:r[14],
    injuriesPenalty:r[15], homeAdvantage:r[16], starPower:r[17]
  };
}

export function runBacktestAudit(){
  const editions = HISTORICAL.map(ed => {
    const scored = ed.teams.map(rowToTeam)
      .map(t => ({id:t.id, score:teamStrengthModel(t)}))
      .sort((a,b) => b.score - a.score);
    const actualRank = scored.findIndex(x => x.id === ed.actualChampion) + 1;
    const semiHits = ed.actualSemis.filter(id => scored.slice(0,4).some(x => x.id === id)).length;
    // Predicted finalist is top-2 by score
    const predictedFinalists = scored.slice(0,2).map(x => x.id);
    const finalAccuracy = [ed.actualFinal.winner, ed.actualFinal.loser].every(id => predictedFinalists.includes(id));
    // Brier score (calibration, lower = better)
    const maxScore = scored[0]?.score || 1;
    const brier = scored.reduce((sum,x) =>
      sum + Math.pow((x.id === ed.actualChampion ? 1 : 0) - x.score/maxScore, 2)
    , 0) / scored.length;
    return {
      year: ed.year, host: ed.host,
      modelTop: scored[0]?.id,
      actualChampion: ed.actualChampion,
      actualRank,
      semiHits,
      finalAccuracy,
      brier: Number(brier.toFixed(3))
    };
  });

  const avgSemi = editions.reduce((a,e) => a + e.semiHits, 0) / editions.length;
  const avgRank = editions.reduce((a,e) => a + e.actualRank, 0) / editions.length;
  const finalHits = editions.filter(e => e.finalAccuracy).length;
  const avgBrier = editions.reduce((a,e) => a + e.brier, 0) / editions.length;

  return {
    version: DATA_QUALITY_VERSION,
    editions,
    avgSemiHits: Number(avgSemi.toFixed(1)),
    avgChampionRank: Number(avgRank.toFixed(1)),
    finalPredictionAccuracy: `${finalHits}/${editions.length}`,
    note: `Diagnóstico retrospectivo 2006–2022 (5 ediciones, 40 snapshots): Brier medio ${avgBrier.toFixed(3)}. No es una validación fuera de muestra y el prior histórico no está cortado por fecha; úsese para detectar regresiones, no como promesa de precisión.`,
    dataSources: [
      'https://www.eloratings.net/World',
      'https://www.transfermarkt.com/statistik/weltrangliste',
      'https://www.fifa.com/fifa-world-ranking/men'
    ]
  };
}
