import { CONFIG } from './config.js';
import { downloadBlob, round } from './math-utils.js';
export function exportJSON(payload){ downloadBlob(`${CONFIG.exportFilePrefix}.json`, JSON.stringify(payload,null,2), 'application/json'); }
export function rowsToCSV(rows){ if(!rows?.length) return ''; const keys=Object.keys(rows[0]); return [keys.join(','),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replaceAll('"','""')}"`).join(','))].join('\n'); }
export function exportCSV(results, betting, players){
  const teamRows=results.teams.map((t,i)=>({rank:i+1,team:t.name,group:t.group,fifaRank:t.fifaRank,elo:t.elo,championPct:round(t.championProb*100,3),finalPct:round(t.finalProb*100,3),semiPct:round(t.semiProb*100,3),quarterPct:round(t.quarterProb*100,3),groupAdvancePct:round(t.groupAdvanceProb*100,3)}));
  const content=['TEAM PROBABILITIES',rowsToCSV(teamRows),'','BETTING BOARD',rowsToCSV(betting),'','SCORERS',rowsToCSV(players.scorers.slice(0,20))].join('\n');
  downloadBlob(`${CONFIG.exportFilePrefix}.csv`, content, 'text/csv');
}
