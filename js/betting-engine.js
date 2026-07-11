import { ODDS } from './data-odds.js';
import { round, pct } from './math-utils.js';

export function classifyEV(ev){ 
  if(ev>.12) return 'Strong Value'; 
  if(ev>.05) return 'Good Value'; 
  if(ev>.02) return 'Marginal'; 
  if(ev>0) return 'Thin Edge'; 
  return 'No Bet'; 
}

export function kellyFraction(modelProb, odds, fraction=0.25){
  // Fractional Kelly (25%) for safer bankroll management
  const b = odds - 1;
  const q = 1 - modelProb;
  const kelly = (b * modelProb - q) / b;
  return Math.max(0, kelly * fraction);
}

export function getRiskTier(ev, confidence){
  if(ev > 0.12 && confidence > 0.65) return { tier:'A', label:'Tier A — High Conviction', color:'#1a7a3a' };
  if(ev > 0.05 && confidence > 0.5) return { tier:'B', label:'Tier B — Solid Edge', color:'#4a7a1a' };
  if(ev > 0.02) return { tier:'C', label:'Tier C — Speculative', color:'#8a6a00' };
  return { tier:'X', label:'No Play', color:'#7a1a1a' };
}

export function buildBettingBoard(results, playerResults){
  const teamByName=Object.fromEntries(results.teams.map(t=>[t.name,t]));
  const scorerByName=Object.fromEntries((playerResults?.scorers||[]).map(p=>[p.name,p]));

  const processed = ODDS.map(o=>{
    const modelProbability = o.market==='winner'
      ? (teamByName[o.selection]?.championProb||0)
      : (scorerByName[o.selection]?.goldenBootProb||0);
    const impliedProbability = 1/o.odds;
    const edge = modelProbability - impliedProbability;
    const expectedValue = modelProbability * o.odds - 1;
    const confidence = Math.min(results.simulations / 10000, 1.0);
    const kelly = kellyFraction(modelProbability, o.odds);
    const risk = getRiskTier(expectedValue, confidence);
    const suggestedStake = kelly * 100; // as % of bankroll
    return {...o, impliedProbability, modelProbability, edge, expectedValue, 
      recommendation:classifyEV(expectedValue), kelly, suggestedStake, risk,
      confidence};
  }).sort((a,b)=>b.expectedValue-a.expectedValue);

  return processed;
}

export function buildBettingReport(bettingBoard, bankroll=1000){
  const plays = bettingBoard.filter(b=>b.expectedValue>0.02).sort((a,b)=>b.expectedValue-a.expectedValue);
  
  // Portfolio analysis
  const totalKellyAlloc = plays.reduce((s,b)=>s+b.kelly, 0);
  const scaleFactor = totalKellyAlloc > 0.3 ? 0.3/totalKellyAlloc : 1; // cap total allocation at 30%
  
  const portfolio = plays.map(b=>({
    ...b,
    scaledKelly: b.kelly * scaleFactor,
    stakeAmount: (b.kelly * scaleFactor * bankroll).toFixed(2),
    expectedReturn: ((b.kelly * scaleFactor * bankroll) * b.expectedValue).toFixed(2)
  }));

  const totalExpectedReturn = portfolio.reduce((s,b)=>s+parseFloat(b.expectedReturn), 0);
  const totalStaked = portfolio.reduce((s,b)=>s+parseFloat(b.stakeAmount), 0);
  
  return { portfolio, totalExpectedReturn, totalStaked, bankroll, scaleFactor };
}
