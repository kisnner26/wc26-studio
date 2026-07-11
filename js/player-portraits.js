// Player portraits: Canvas-drawn realistic-ish avatars using HTML5 Canvas
// Each player has unique skin tone, hair style, expression, jersey color

const PORTRAIT_DATA = {
  mbappe:     {skin:'#8B5A2B', hair:'#1a0800', hairStyle:'short', jersey:'#1a3a8f', name:'Kylian Mbappé',    flag:'🇫🇷'},
  haaland:    {skin:'#FFD5AA', hair:'#f0c050', hairStyle:'buzz',  jersey:'#8f1a1a', name:'Erling Haaland',   flag:'🇳🇴'},
  vinicius:   {skin:'#6B3A1F', hair:'#1a0800', hairStyle:'curly', jersey:'#1a8f3a', name:'Vinícius Jr',      flag:'🇧🇷'},
  kane:       {skin:'#F5CBA7', hair:'#5a3010', hairStyle:'short', jersey:'#8f1a1a', name:'Harry Kane',        flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
  messi:      {skin:'#F0C899', hair:'#3a2010', hairStyle:'medium',jersey:'#3a6eaf', name:'Lionel Messi',      flag:'🇦🇷'},
  lautaro:    {skin:'#D4A574', hair:'#2a1500', hairStyle:'short', jersey:'#3a6eaf', name:'Lautaro Martínez',  flag:'🇦🇷'},
  bellingham: {skin:'#8B5E3C', hair:'#1a0800', hairStyle:'fade',  jersey:'#8f1a1a', name:'Jude Bellingham',  flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
  foden:      {skin:'#F5CBA7', hair:'#d4a030', hairStyle:'short', jersey:'#3a5f8a', name:'Phil Foden',        flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
  griezmann:  {skin:'#F2C187', hair:'#5a3010', hairStyle:'styled',jersey:'#1a3a8f', name:'A. Griezmann',      flag:'🇫🇷'},
  neymar:     {skin:'#A0703A', hair:'#1a0500', hairStyle:'styled',jersey:'#1a7a3a', name:'Neymar Jr',         flag:'🇧🇷'},
  pedri:      {skin:'#D4985A', hair:'#2a1500', hairStyle:'medium',jersey:'#8f1a2a', name:'Pedri',             flag:'🇪🇸'},
  olmo:       {skin:'#E8A876', hair:'#3a2000', hairStyle:'short', jersey:'#7a1a2a', name:'Dani Olmo',         flag:'🇪🇸'},
  ronaldo:    {skin:'#C4905A', hair:'#1a0800', hairStyle:'styled',jersey:'#8f1a1a', name:'Cristiano Ronaldo', flag:'🇵🇹'},
  bruno:      {skin:'#C0885A', hair:'#2a1000', hairStyle:'beard', jersey:'#8f2a1a', name:'Bruno Fernandes',   flag:'🇵🇹'},
  musiala:    {skin:'#B07840', hair:'#1a0a00', hairStyle:'short', jersey:'#1a1a6a', name:'Jamal Musiala',     flag:'🇩🇪'},
  wirtz:      {skin:'#F0C585', hair:'#b08020', hairStyle:'styled',jersey:'#1a1a5a', name:'Florian Wirtz',     flag:'🇩🇪'},
  leao:       {skin:'#5A3010', hair:'#100500', hairStyle:'fade',  jersey:'#8f1a2a', name:'Rafael Leão',       flag:'🇵🇹'},
  son:        {skin:'#E8B87A', hair:'#0a0500', hairStyle:'short', jersey:'#c0392b', name:'Son Heung-min',     flag:'🇰🇷'},
  salah:      {skin:'#9A6030', hair:'#0a0500', hairStyle:'curly', jersey:'#c0392b', name:'Mohamed Salah',     flag:'🇪🇬'},
  pulisic:    {skin:'#F0C890', hair:'#6a4020', hairStyle:'medium',jersey:'#8b0000', name:'Christian Pulisic', flag:'🇺🇸'},
  davies:     {skin:'#7A4820', hair:'#0a0500', hairStyle:'short', jersey:'#8b0000', name:'Alphonso Davies',   flag:'🇨🇦'},
  hakimi:     {skin:'#8A5028', hair:'#0a0500', hairStyle:'curly', jersey:'#c0392b', name:'Achraf Hakimi',     flag:'🇲🇦'},
  yamal:      {skin:'#D4905A', hair:'#1a0a00', hairStyle:'fade',  jersey:'#8f1a2a', name:'Lamine Yamal',      flag:'🇪🇸'},
  guler:      {skin:'#C4885A', hair:'#2a1000', hairStyle:'short', jersey:'#c0392b', name:'Arda Güler',        flag:'🇹🇷'},
};

function drawPortrait(canvasEl, playerId, size=60){
  const data = PORTRAIT_DATA[playerId];
  if(!canvasEl || !data) return;
  canvasEl.width = size; canvasEl.height = size;
  const ctx = canvasEl.getContext('2d');
  const cx = size/2, cy = size/2, r = size/2;

  // Background circle (jersey color)
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = data.jersey; ctx.fill();

  // Neck
  ctx.fillStyle = data.skin;
  ctx.fillRect(cx-size*.08, cy+size*.22, size*.16, size*.18);

  // Shoulders / jersey
  ctx.beginPath();
  ctx.ellipse(cx, cy+size*.46, size*.38, size*.22, 0, Math.PI, 0);
  ctx.fillStyle = data.jersey; ctx.fill();
  // Jersey collar
  ctx.beginPath(); ctx.moveTo(cx-size*.08,cy+size*.22); ctx.lineTo(cx,cy+size*.16); ctx.lineTo(cx+size*.08,cy+size*.22);
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=size*.03; ctx.stroke();

  // Head
  const headR = size*.26, headY = cy-size*.04;
  ctx.beginPath(); ctx.ellipse(cx, headY, headR*.88, headR, 0, 0, Math.PI*2);
  ctx.fillStyle = data.skin; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.1)'; ctx.lineWidth=1; ctx.stroke();

  // Hair
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, headY, headR*.88, headR, 0, 0, Math.PI*2); ctx.clip();
  ctx.fillStyle = data.hair;
  switch(data.hairStyle){
    case 'buzz':
      ctx.fillRect(cx-headR*.9, headY-headR, headR*1.8, headR*.55);
      break;
    case 'fade':
      ctx.beginPath(); ctx.ellipse(cx, headY-headR*.3, headR*.75, headR*.45, 0, 0, Math.PI*2); ctx.fill();
      break;
    case 'curly':
      for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const rx=Math.cos(a)*headR*.78; const ry=Math.sin(a)*headR*.5-headR*.38; ctx.beginPath(); ctx.arc(cx+rx,headY+ry,headR*.25,0,Math.PI*2); ctx.fill(); }
      break;
    case 'styled':
    case 'medium':
      ctx.beginPath(); ctx.ellipse(cx-headR*.1, headY-headR*.35, headR*.82, headR*.5, -.15, 0, Math.PI*2); ctx.fill();
      break;
    case 'beard':
      ctx.beginPath(); ctx.ellipse(cx, headY-headR*.32, headR*.7, headR*.44, 0, 0, Math.PI*2); ctx.fill();
      // beard
      ctx.fillStyle = data.hair; ctx.globalAlpha=.7;
      ctx.beginPath(); ctx.ellipse(cx, headY+headR*.28, headR*.55, headR*.3, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      break;
    default: // short
      ctx.beginPath(); ctx.ellipse(cx, headY-headR*.3, headR*.85, headR*.52, 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // Eyes
  const eyeY = headY-headR*.08, eyeOffset=headR*.28;
  [eyeOffset, -eyeOffset].forEach(ox=>{
    ctx.beginPath(); ctx.ellipse(cx+ox, eyeY, headR*.13, headR*.09, 0, 0, Math.PI*2);
    ctx.fillStyle='#fff'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+ox+headR*.03, eyeY, headR*.07, headR*.07, 0, 0, Math.PI*2);
    ctx.fillStyle='#1a0800'; ctx.fill();
    // Highlight
    ctx.beginPath(); ctx.arc(cx+ox+headR*.04, eyeY-headR*.03, headR*.025, 0, Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.8)'; ctx.fill();
  });

  // Eyebrows
  ctx.strokeStyle = data.hair; ctx.lineWidth = size*.025; ctx.lineCap='round';
  [[eyeOffset-.14*headR, eyeY-headR*.18, eyeOffset+.14*headR, eyeY-headR*.16],
   [-eyeOffset-.14*headR, eyeY-headR*.18, -eyeOffset+.14*headR, eyeY-headR*.16]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(cx+x1,y1); ctx.lineTo(cx+x2,y2); ctx.stroke();
  });

  // Nose
  ctx.strokeStyle=`${data.skin}80`; ctx.lineWidth=size*.02;
  ctx.beginPath(); ctx.moveTo(cx,eyeY+headR*.12); ctx.quadraticCurveTo(cx+headR*.12,eyeY+headR*.28,cx,eyeY+headR*.32); ctx.stroke();

  // Mouth / smile
  ctx.strokeStyle=`rgba(120,60,30,.6)`; ctx.lineWidth=size*.022;
  ctx.beginPath(); ctx.arc(cx, eyeY+headR*.55, headR*.18, .15*Math.PI, .85*Math.PI); ctx.stroke();

  // Flag overlay bottom-right
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
  ctx.font = `${size*.22}px serif`;
  ctx.textAlign='right'; ctx.textBaseline='bottom';
  ctx.globalAlpha=.85;
  ctx.fillText(data.flag, cx+r*.88, cy+r*.88);
  ctx.restore();
}

export function createPortraitCanvas(playerId, size=60){
  const canvas = document.createElement('canvas');
  canvas.className = 'player-portrait-canvas';
  canvas.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;display:block;flex-shrink:0`;
  canvas.title = PORTRAIT_DATA[playerId]?.name || playerId;
  // Defer drawing until added to DOM
  requestAnimationFrame(() => drawPortrait(canvas, playerId, size));
  return canvas;
}

export function getPlayerName(id){ return PORTRAIT_DATA[id]?.name || null; }
