import { pct, round } from './math-utils.js';
export function renderHorizontalBars(container, rows, {label='name', value='championProb', maxRows=12, formatter=pct}={}){
  container.innerHTML=''; const top=(rows||[]).slice(0,maxRows); if(!top.length){container.innerHTML='<div class="summary-note">No data yet</div>'; return;} const max=Math.max(...top.map(r=>r[value]),.001);
  for(const r of top){
    const row=document.createElement('div'); row.className='chart-row';
    row.innerHTML=`<span class="chart-label">${r[label]}</span><div class="bar-bg"><div class="bar-fill" style="width:${(r[value]/max)*100}%"></div></div><span class="chart-value">${formatter(r[value])}</span>`;
    container.appendChild(row);
  }
}
export function renderValueChart(container, rows){
  renderHorizontalBars(container, (rows||[]).filter(r=>r.expectedValue>0).slice(0,10), {label:'selection', value:'expectedValue', formatter:v=>round(v,3)});
}
