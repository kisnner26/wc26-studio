export const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
export const round = (v,d=2)=>Number.parseFloat(v).toFixed(d);
export const pct = (v,d=2)=>`${round(v*100,d)}%`;
export const normalizeRange = (value,min,max)=>clamp((value-min)/(max-min),0,1);
export const sigmoid = x => 1/(1+Math.exp(-x));
export const relu = x => Math.max(0,x);
export function poissonRandom(lambda){
  if(lambda<=0) return 0;
  const L=Math.exp(-lambda); let k=0,p=1;
  do{ k++; p*=Math.random(); }while(p>L);
  return k-1;
}
export function sampleGaussian(mean=1, spread=.12){
  // Box-Muller transform: true Gaussian noise, replacing the old triangular approximation.
  let u=0, v=0;
  while(u===0) u=Math.random();
  while(v===0) v=Math.random();
  const z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  return clamp(mean + z*spread, 0.45, 1.75);
}
export function sampleNormalish(mean=1,spread=.12){ return sampleGaussian(mean,spread); }
export function sortByKey(arr,key,dir='desc'){return [...arr].sort((a,b)=>dir==='desc'?(b[key]-a[key]):(a[key]-b[key]));}
export function downloadBlob(filename, content, type='application/json'){
  const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
