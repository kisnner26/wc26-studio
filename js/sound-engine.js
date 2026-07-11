let enabled=false; let ctx=null;
function getCtx(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)(); return ctx; }
function tone(freq=440,duration=.15,type='sine',gain=.05,delay=0){ if(!enabled) return; const ac=getCtx(); const o=ac.createOscillator(); const g=ac.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=0; o.connect(g); g.connect(ac.destination); const t=ac.currentTime+delay; g.gain.linearRampToValueAtTime(gain,t+.015); g.gain.exponentialRampToValueAtTime(.0001,t+duration); o.start(t); o.stop(t+duration+.03); }
export function setSound(v){ enabled=v; if(enabled) getCtx().resume(); }
export function isSoundEnabled(){ return enabled; }
export function whistle(){ tone(1320,.18,'square',.025,0); tone(1760,.20,'square',.018,.12); }
export function goal(){ tone(330,.18,'sawtooth',.035,0); tone(495,.20,'sawtooth',.04,.08); tone(660,.22,'sawtooth',.035,.16); tone(990,.28,'triangle',.025,.26); }
export function tick(){ tone(760,.05,'sine',.018); }
export function complete(){ whistle(); setTimeout(goal,280); }
