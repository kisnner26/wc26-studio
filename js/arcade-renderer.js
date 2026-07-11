import { SQUADS } from './data-squads.js';

const FORMATION = [
  {role:'GK',x:5,y:32},
  {role:'DF',x:20,y:8},{role:'DF',x:20,y:24},{role:'DF',x:20,y:40},{role:'DF',x:20,y:56},
  {role:'MF',x:40,y:14},{role:'MF',x:43,y:32},{role:'MF',x:40,y:50},
  {role:'FW',x:62,y:11},{role:'FW',x:66,y:32},{role:'FW',x:62,y:53}
];

const KNOWN_KITS = {
  ARG:['#75aadb','#ffffff','#132742'],FRA:['#203e88','#ffffff','#ef3340'],
  BRA:['#f5d547','#1d6b3a','#123f8b'],ENG:['#f4f1ea','#1b2c53','#d62839'],
  ESP:['#d91f35','#f3c438','#173c78'],GER:['#f2f0e9','#161616','#d2aa3a'],
  POR:['#b51d35','#1d7540','#f0d05c'],NED:['#e66b25','#181818','#f4f1ea'],
  URU:['#69b9e8','#111d4a','#ffffff'],MEX:['#176b43','#ffffff','#c12636'],
  USA:['#f4f1ea','#1e3a66','#c92035'],COL:['#f2d33c','#1f4c94','#d52b3f'],
  BEL:['#1b1b1b','#d33135','#f1cf3a'],CRO:['#f4f1ea','#d72731','#214c8f'],
  MAR:['#bd1d2f','#176b43','#ffffff'],JPN:['#244895','#ffffff','#e33b47']
};

function hashKit(id,side){
  let hue=0;
  for(const ch of id) hue=(hue*31+ch.charCodeAt(0))%360;
  if(side==='away') hue=(hue+145)%360;
  return [`hsl(${hue} 58% 44%)`,'#f4f1ea','#171717'];
}

function kitFor(id,side){ return KNOWN_KITS[id]||hashKit(id,side); }
function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
function ease(t){ return 1-Math.pow(1-clamp(t,0,1),3); }

function shortName(name=''){
  const parts=String(name).trim().split(/\s+/);
  return (parts[0]||'Jugador').slice(0,11);
}

function lineupFor(teamId){
  const pool=SQUADS[teamId]?.players||[];
  const buckets={GK:[],DF:[],MF:[],FW:[]};
  pool.forEach(player=>(buckets[player.pos]||buckets.MF).push(player));
  const used=new Set();
  return FORMATION.map((spot,index)=>{
    let player=(buckets[spot.role]||[]).find(p=>!used.has(p.id));
    if(!player) player=pool.find(p=>!used.has(p.id));
    if(player) used.add(player.id);
    return {id:player?.id||`${teamId}-${index}`,name:player?.name||`${spot.role} ${index+1}`,number:index+1,role:spot.role};
  });
}

export class ArcadeMatchRenderer {
  constructor(canvas){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d',{alpha:false});
    this.staticLayer=document.createElement('canvas');
    this.staticCtx=this.staticLayer.getContext('2d',{alpha:false});
    this.width=0;this.height=0;this.dpr=1;this.raf=0;
    this.running=false;this.paused=false;this.visible=true;this.progress=0;
    this.players=[];this.ball={x:50,y:32,z:0,owner:6,transition:null};
    this.nextPassAt=0;this.eventQueue=[];this.special=null;this.goalMoment=null;this.cardMoment=null;
    this.reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off';
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver=new IntersectionObserver(entries=>{
      this.visible=entries[0]?.isIntersecting!==false;
      if(this.visible&&this.running&&!this.paused) this.ensureLoop();
      else if(!this.visible) this.cancelLoop();
    },{threshold:.05});
    this.intersectionObserver.observe(canvas);
    this.resize();
    this.setTeams('ARG','FRA');
  }

  setTeams(homeId,awayId){
    this.homeId=homeId;this.awayId=awayId;
    const homeLineup=lineupFor(homeId),awayLineup=lineupFor(awayId);
    this.players=[];
    FORMATION.forEach((spot,index)=>this.players.push({
      ...homeLineup[index],team:'home',baseX:spot.x,baseY:spot.y,x:spot.x,y:spot.y,kit:kitFor(homeId,'home')
    }));
    FORMATION.forEach((spot,index)=>this.players.push({
      ...awayLineup[index],team:'away',baseX:100-spot.x,baseY:64-spot.y,x:100-spot.x,y:64-spot.y,kit:kitFor(awayId,'away')
    }));
    this.reset();
  }

  reset(){
    this.progress=0;this.eventQueue=[];this.special=null;this.goalMoment=null;this.cardMoment=null;
    this.ball={x:50,y:32,z:0,owner:6,transition:null};
    this.nextPassAt=performance.now()+650;
    delete this.canvas.dataset.moment;
    this.players.forEach(player=>{player.x=player.baseX;player.y=player.baseY;delete player.eventLabelName;});
    this.render(performance.now(),0);
  }

  resize(){
    const rect=this.canvas.getBoundingClientRect();
    const width=Math.max(320,Math.round(rect.width));
    const height=Math.max(300,Math.round(rect.height));
    if(width===this.width&&height===this.height) return;
    this.width=width;this.height=height;this.dpr=Math.min(2,window.devicePixelRatio||1);
    for(const layer of [this.canvas,this.staticLayer]){
      layer.width=Math.round(width*this.dpr);layer.height=Math.round(height*this.dpr);
    }
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.staticCtx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.field={x:20,y:82,w:width-40,h:height-104};
    this.drawStaticField();
    this.render(performance.now(),0);
  }

  drawStaticField(){
    const ctx=this.staticCtx,{width,height,field}=this;
    ctx.fillStyle='#2f7043';ctx.fillRect(0,0,width,height);
    const stripe=field.w/10;
    for(let i=0;i<10;i++){
      ctx.fillStyle=i%2?'rgba(255,255,255,.022)':'rgba(0,0,0,.025)';
      ctx.fillRect(field.x+i*stripe,field.y,stripe,field.h);
    }
    ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=1.7;
    ctx.strokeRect(field.x,field.y,field.w,field.h);
    const mid=field.x+field.w/2,cy=field.y+field.h/2;
    ctx.beginPath();ctx.moveTo(mid,field.y);ctx.lineTo(mid,field.y+field.h);ctx.stroke();
    ctx.beginPath();ctx.arc(mid,cy,Math.min(43,field.h*.21),0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(mid,cy,2.2,0,Math.PI*2);ctx.fill();
    const boxW=field.w*.14,boxH=field.h*.58,smallW=field.w*.055,smallH=field.h*.28;
    ctx.strokeRect(field.x,cy-boxH/2,boxW,boxH);ctx.strokeRect(field.x,cy-smallH/2,smallW,smallH);
    ctx.strokeRect(field.x+field.w-boxW,cy-boxH/2,boxW,boxH);ctx.strokeRect(field.x+field.w-smallW,cy-smallH/2,smallW,smallH);
    this.drawGoal(ctx,field.x-11,cy,'left');this.drawGoal(ctx,field.x+field.w+11,cy,'right');
  }

  drawGoal(ctx,x,cy,side){
    const width=11,height=Math.max(52,this.field.h*.28),left=side==='left'?x:x-width;
    ctx.strokeStyle='rgba(255,255,255,.86)';ctx.lineWidth=1.4;ctx.strokeRect(left,cy-height/2,width,height);
    ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=.7;
    for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(left+i*width/4,cy-height/2);ctx.lineTo(left+i*width/4,cy+height/2);ctx.stroke();}
    for(let i=1;i<6;i++){ctx.beginPath();ctx.moveTo(left,cy-height/2+i*height/6);ctx.lineTo(left+width,cy-height/2+i*height/6);ctx.stroke();}
  }

  start(){
    if(this.reduced){this.running=false;this.render(performance.now(),0);return;}
    this.running=true;this.paused=false;this.stopAt=0;this.lastFrame=performance.now();
    this.nextPassAt=this.lastFrame+500;this.ensureLoop();
  }

  finish(){ this.stopAt=performance.now()+1500;this.ensureLoop(); }
  stop(){ this.running=false;this.cancelLoop(); }
  setPaused(value){
    this.paused=value;
    if(value) this.cancelLoop(); else if(this.running) {this.lastFrame=performance.now();this.ensureLoop();}
  }
  setProgress(value){ this.progress=clamp(value,0,1); }

  trigger(event){
    if(!['goal','save','chance','wide','card'].includes(event.type)) return;
    this.eventQueue.push(event);
    if(this.reduced){this.consumeStaticEvent();this.render(performance.now(),0);}
  }

  replay(event){
    if(!event)return;
    this.eventQueue=[];this.special=null;this.goalMoment=null;this.cardMoment=null;
    delete this.canvas.dataset.moment;
    this.eventQueue.push(event);
    if(this.reduced){this.consumeStaticEvent();this.render(performance.now(),0);return;}
    this.running=true;this.paused=false;this.stopAt=performance.now()+2800;this.lastFrame=performance.now();
    this.ensureLoop();
  }

  consumeStaticEvent(){
    const event=this.eventQueue.shift();if(!event)return;
    const side=event.team===this.homeId?'home':'away';
    const shooter=this.findEventPlayer(event,side);
    this.ball.owner=this.players.indexOf(shooter);
    if(event.type==='goal') this.goalMoment={team:side,start:performance.now(),label:event.label};
  }

  ensureLoop(){
    if(this.raf||!this.running||this.paused||!this.visible) return;
    this.raf=requestAnimationFrame(now=>this.frame(now));
  }

  cancelLoop(){ if(this.raf) cancelAnimationFrame(this.raf);this.raf=0; }

  frame(now){
    this.raf=0;
    if(!this.running||this.paused||!this.visible) return;
    const dt=Math.min(.04,Math.max(.001,(now-this.lastFrame)/1000));this.lastFrame=now;
    this.update(now,dt);this.render(now,dt);
    if(this.stopAt&&now>=this.stopAt){this.running=false;return;}
    this.ensureLoop();
  }

  update(now,dt){
    this.updatePlayers(now,dt);
    if(!this.special&&this.eventQueue.length) this.beginSpecial(this.eventQueue.shift(),now);
    if(this.special) this.updateSpecial(now);
    else this.updateOpenPlay(now);
  }

  updatePlayers(now,dt){
    const owner=this.players[this.ball.owner];
    for(let i=0;i<this.players.length;i++){
      const player=this.players[i];
      const ballPull=player.role==='GK'?.035:player.role==='DF'?.075:.11;
      let targetX=player.baseX+(this.ball.x-player.baseX)*ballPull;
      let targetY=player.baseY+(this.ball.y-player.baseY)*ballPull;
      if(player===owner&&!this.ball.transition){
        const direction=player.team==='home'?1:-1;
        targetX+=Math.sin(now*.0016+i)*1.4+direction*.45;
        targetY+=Math.cos(now*.0019+i)*1.1;
      }else{
        targetX+=Math.sin(now*.0011+i*1.7)*.55;
        targetY+=Math.cos(now*.0013+i*1.2)*.5;
      }
      const response=clamp(dt*(player===owner?5.5:3.2),0,1);
      player.x+=(targetX-player.x)*response;player.y+=(targetY-player.y)*response;
    }
  }

  updateOpenPlay(now){
    const transition=this.ball.transition;
    if(transition){
      const t=clamp((now-transition.start)/transition.duration,0,1),e=ease(t);
      this.ball.x=transition.from.x+(transition.to.x-transition.from.x)*e;
      this.ball.y=transition.from.y+(transition.to.y-transition.from.y)*e;
      this.ball.z=Math.sin(Math.PI*t)*(transition.arc||2.5);
      if(t>=1){
        this.ball.owner=transition.owner;this.ball.transition=null;this.ball.z=0;
        if(transition.turnover) this.ball.owner=this.closestPlayer(this.ball.x,this.ball.y,transition.team==='home'?'away':'home');
        this.nextPassAt=now+520+Math.random()*700;
      }
      return;
    }
    const owner=this.players[this.ball.owner];
    if(owner){
      const direction=owner.team==='home'?1:-1;
      this.ball.x=owner.x+direction*1.35;this.ball.y=owner.y+.6;this.ball.z=0;
    }
    if(now>=this.nextPassAt) this.makePass(now);
  }

  makePass(now){
    const owner=this.players[this.ball.owner];if(!owner)return;
    const teammates=this.players.filter((player,index)=>player.team===owner.team&&index!==this.ball.owner);
    const direction=owner.team==='home'?1:-1;
    teammates.sort((a,b)=>{
      const scoreA=Math.abs(a.y-owner.y)*.23-Math.max(0,(a.x-owner.x)*direction)*.42+Math.abs(a.x-owner.x)*.08;
      const scoreB=Math.abs(b.y-owner.y)*.23-Math.max(0,(b.x-owner.x)*direction)*.42+Math.abs(b.x-owner.x)*.08;
      return scoreA-scoreB;
    });
    const target=teammates[Math.floor(Math.random()*Math.min(4,teammates.length))]||teammates[0];
    const targetIndex=this.players.indexOf(target);
    this.ball.transition={from:{x:this.ball.x,y:this.ball.y},to:{x:target.x,y:target.y},start:now,duration:320+Math.random()*360,arc:1.8+Math.random()*2,owner:targetIndex,team:owner.team,turnover:Math.random()<.075};
  }

  beginSpecial(event,now){
    const side=event.team===this.homeId?'home':'away';
    const shooter=this.findEventPlayer(event,side),shooterIndex=this.players.indexOf(shooter);
    this.ball.owner=shooterIndex;this.ball.transition=null;
    if(event.type==='card'){
      this.cardMoment={player:shooter,start:now,end:now+1050};
      this.special={event,side,stage:'card',end:now+1050};return;
    }
    const attacksRight=side==='home',goalX=attacksRight?102:-2;
    const goalY=event.type==='wide'?(Math.random()<.5?19:45):32+(Math.random()-.5)*9;
    const target={x:goalX,y:goalY};
    this.special={event,side,shooter,stage:'windup',start:now,shotAt:now+260,end:now+1280,target};
  }

  updateSpecial(now){
    const special=this.special;
    if(special.stage==='card'){
      if(now>=special.end){this.cardMoment=null;this.special=null;}
      return;
    }
    if(special.stage==='windup'){
      this.ball.x=special.shooter.x+(special.side==='home'?1.2:-1.2);this.ball.y=special.shooter.y;
      if(now>=special.shotAt){
        special.stage='shot';special.shotStart=now;
        special.from={x:this.ball.x,y:this.ball.y};
      }
      return;
    }
    if(special.stage==='shot'){
      const duration=special.event.type==='goal'?700:610;
      const t=clamp((now-special.shotStart)/duration,0,1),e=ease(t);
      this.ball.x=special.from.x+(special.target.x-special.from.x)*e;
      this.ball.y=special.from.y+(special.target.y-special.from.y)*e;
      this.ball.z=Math.sin(Math.PI*t)*5;
      if(t>=1){
        special.stage='recover';special.recoverAt=now+(special.event.type==='goal'?1250:420);
        if(special.event.type==='goal'){
          this.goalMoment={team:special.side,start:now,end:special.recoverAt,label:special.event.label};
          this.canvas.dataset.moment='goal';
        }
        else{
          const keeperSide=special.side==='home'?'away':'home';
          this.ball.owner=this.players.findIndex(p=>p.team===keeperSide&&p.role==='GK');
        }
      }
      return;
    }
    if(special.stage==='recover'&&now>=special.recoverAt){
      if(special.event.type==='goal'){
        const conceding=special.side==='home'?'away':'home';
        this.ball.owner=this.players.findIndex(p=>p.team===conceding&&p.role==='GK');
        this.ball.x=50;this.ball.y=32;
      }
      if(special.shooter) delete special.shooter.eventLabelName;
      this.goalMoment=null;delete this.canvas.dataset.moment;this.special=null;this.nextPassAt=now+650;
    }
  }

  findEventPlayer(event,side){
    const teamPlayers=this.players.filter(player=>player.team===side);
    const eventName=String(event.scorer||event.label||'').toLowerCase();
    const named=teamPlayers.find(player=>{
      const surname=shortName(player.name).toLowerCase();
      return surname.length>3&&eventName.includes(surname);
    });
    if(named)return named;
    const forwards=teamPlayers.filter(player=>player.role==='FW');
    const replacement=forwards[Math.floor(Math.random()*forwards.length)]||teamPlayers[6];
    if(event.scorer) replacement.eventLabelName=event.scorer;
    return replacement;
  }

  closestPlayer(x,y,side){
    let best=-1,distance=Infinity;
    this.players.forEach((player,index)=>{
      if(player.team!==side)return;
      const d=Math.hypot(player.x-x,player.y-y);
      if(d<distance){distance=d;best=index;}
    });
    return best;
  }

  point(x,y){
    return {x:this.field.x+(x/100)*this.field.w,y:this.field.y+(y/64)*this.field.h};
  }

  render(now){
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.width,this.height);
    ctx.drawImage(this.staticLayer,0,0,this.staticLayer.width,this.staticLayer.height,0,0,this.width,this.height);
    const ordered=[...this.players].sort((a,b)=>a.y-b.y);
    ordered.forEach(player=>this.drawPlayer(ctx,player,now));
    this.drawBall(ctx);
    if(this.cardMoment) this.drawCard(ctx,this.cardMoment.player,now);
    if(this.goalMoment) this.drawGoalMoment(ctx,now);
  }

  drawPlayer(ctx,player,now){
    const p=this.point(player.x,player.y),scale=clamp(this.width/76,7,10.5);
    const activePlayer=this.players[this.ball.owner]===player;
    const bounce=this.running&&!this.paused?Math.sin(now*.008+player.number)*.8:0;
    ctx.save();ctx.translate(p.x,p.y+bounce);
    if(activePlayer){ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,scale*1.55,scale*1.1,scale*.38,0,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle=player.kit[2];ctx.lineWidth=Math.max(1.2,scale*.22);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-scale*.28,scale*.72);ctx.lineTo(-scale*.52,scale*1.55);ctx.moveTo(scale*.28,scale*.72);ctx.lineTo(scale*.55,scale*1.55);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-scale*.68,-scale*.15);ctx.lineTo(-scale*1.05,scale*.55);ctx.moveTo(scale*.68,-scale*.15);ctx.lineTo(scale*1.05,scale*.55);ctx.stroke();
    ctx.fillStyle=player.kit[0];ctx.strokeStyle='rgba(0,0,0,.68)';ctx.lineWidth=1.4;ctx.beginPath();ctx.roundRect(-scale*.72,-scale*.45,scale*1.44,scale*1.42,scale*.35);ctx.fill();ctx.stroke();
    ctx.fillStyle='#d7a678';ctx.beginPath();ctx.arc(0,-scale*.95,scale*.47,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=player.kit[1];ctx.font=`800 ${Math.max(7,scale*.92)}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(player.number),0,scale*.2);
    if(activePlayer){
      ctx.font='700 10px Arial';const label=shortName(player.eventLabelName||player.name),metrics=ctx.measureText(label),width=metrics.width+10;
      ctx.fillStyle='rgba(13,18,15,.88)';ctx.beginPath();ctx.roundRect(-width/2,-scale*2.55,width,16,6);ctx.fill();
      ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.fillText(label,0,-scale*2.55+8);
    }
    ctx.restore();
  }

  drawBall(ctx){
    const p=this.point(this.ball.x,this.ball.y),radius=clamp(this.width/190,3.2,5.2),lift=this.ball.z*1.4;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(p.x,p.y+4,radius*1.05,radius*.48,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.strokeStyle='#171717';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y-lift,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#171717';ctx.beginPath();ctx.arc(p.x+radius*.18,p.y-lift-radius*.08,radius*.27,0,Math.PI*2);ctx.fill();
  }

  drawCard(ctx,player,now){
    const p=this.point(player.x,player.y),rise=clamp((now-this.cardMoment.start)/350,0,1);
    ctx.save();ctx.translate(p.x+12,p.y-30-rise*8);ctx.rotate(-.12);ctx.fillStyle='#ffd43b';ctx.strokeStyle='#171717';ctx.lineWidth=1.5;ctx.fillRect(-5,-8,10,16);ctx.strokeRect(-5,-8,10,16);ctx.restore();
  }

  drawGoalMoment(ctx,now){
    const elapsed=now-this.goalMoment.start,progress=clamp(elapsed/1000,0,1);
    ctx.save();ctx.globalAlpha=1-progress*.25;
    ctx.fillStyle='rgba(12,18,14,.80)';ctx.fillRect(0,this.field.y+this.field.h*.31,this.width,this.field.h*.38);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${clamp(this.width/16,30,58)}px Arial`;
    ctx.fillText('¡GOOOOL!',this.width/2,this.field.y+this.field.h/2);
    ctx.font='700 12px Arial';ctx.fillText(this.goalMoment.team==='home'?this.homeId:this.awayId,this.width/2,this.field.y+this.field.h/2+36);
    for(let i=0;i<22;i++){
      const angle=(i/22)*Math.PI*2+elapsed*.002,spread=25+progress*Math.min(150,this.width*.22);
      ctx.fillStyle=i%3===0?'#f3cf3a':i%3===1?'#ffffff':'#e44b4b';
      ctx.fillRect(this.width/2+Math.cos(angle)*spread,this.field.y+this.field.h/2+Math.sin(angle)*spread*.52,4,8);
    }
    ctx.restore();
  }
}
