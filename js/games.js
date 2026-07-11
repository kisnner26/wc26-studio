import { TEAMS, teamById } from './data-teams.js';
import { GROUPS, buildGroupFixtures } from './data-fixtures.js';
import { t, getLang } from './ui.js';


const GAMES_TXT={
  en:{prediction_title:'Your World Cup Prediction',prediction_desc:'Pick your group winners, champion and dark horse. Compare vs simulation to see how bold your picks are.',save:'Save',compare:'Compare vs simulation',clear:'Clear',champion:'Champion',dark_horse:'Dark Horse',runner_up:'Runner-up',pick_champion:'Pick champion...',pick_dark:'Pick dark horse...',pick_runner:'Pick runner-up...',pick:'Pick...',group:'Group',first:'1st',second:'2nd',prediction_saved:'Prediction saved!',run_first:'Run a simulation first to compare.',save_first:'Save a prediction first.',your_picks:'Your picks vs the model',win_prob:'Win prob',ranked:'Ranked',of_48:'of 48',semi_prob:'Semi prob',bold:'🔥 Bold pick!',brave:'⚡ Brave!',safe:'🤝 Safe pick',reasonable:'👍 Reasonable',penalty_title:'Penalty Shootout',penalty_desc:'Best of 5. Pick your zone. The keeper will dive.',you:'YOU',gk:'GK',kick:'Kick',choose_zone:'choose a zone',saved:'🧤 Saved!',goal:'⚽ GOAL!',you_win:'🏆 You win!',draw:'🤝 Draw!',keeper_wins:'😔 Keeper wins!',final:'Final',play_again:'Play again',rate_title:'Rate the Player',your_rankings:'Your rankings',rate_again:'Rate again',copy_rankings:'Copy my rankings',copied:'Copied to clipboard!',drag_score:'drag or click to score',next:'Next →',trivia_title:'Trivia',score:'Score',correct:'✓ Correct!',wrong:'✗ Wrong — ',football_genius:'Football genius!',solid:'Solid knowledge!',study:'Time to study!',score_predictor:'Score Predictor',score_desc:'Predict exact scores. Correct score = 3pts, correct result = 1pt.',score_saved:'Score predictions saved!',kit_title:'Kit Detective',kit_ency:'Kit encyclopedia!',kit_decent:'Decent kit knowledge!',kit_study:'Keep watching football!',hint:'Hint',it_was:'✗ It was ',new_high:'New high score'},
  es:{prediction_title:'Tu predicción del Mundial',prediction_desc:'Elige ganadores de grupo, campeón y sorpresa. Compáralo contra la simulación para medir qué tan arriesgada es tu apuesta.',save:'Guardar',compare:'Comparar vs simulación',clear:'Limpiar',champion:'Campeón',dark_horse:'Sorpresa',runner_up:'Subcampeón',pick_champion:'Elige campeón...',pick_dark:'Elige sorpresa...',pick_runner:'Elige subcampeón...',pick:'Elegir...',group:'Grupo',first:'1.º',second:'2.º',prediction_saved:'Predicción guardada.',run_first:'Ejecuta una simulación primero para comparar.',save_first:'Guarda una predicción primero.',your_picks:'Tus elecciones vs el modelo',win_prob:'Prob. de ganar',ranked:'Puesto',of_48:'de 48',semi_prob:'Prob. semifinal',bold:'🔥 Elección arriesgada',brave:'⚡ Valiente',safe:'🤝 Elección segura',reasonable:'👍 Razonable',penalty_title:'Tanda de penales',penalty_desc:'Mejor de 5. Elige una zona y el portero se lanzará.',you:'TÚ',gk:'POR',kick:'Tiro',choose_zone:'elige una zona',saved:'🧤 ¡Atajado!',goal:'⚽ ¡GOL!',you_win:'🏆 ¡Ganaste!',draw:'🤝 Empate',keeper_wins:'😔 Gana el portero',final:'Final',play_again:'Jugar otra vez',rate_title:'Calificar jugador',your_rankings:'Tus rankings',rate_again:'Calificar otra vez',copy_rankings:'Copiar mi ranking',copied:'Copiado al portapapeles.',drag_score:'arrastra o haz clic para puntuar',next:'Siguiente →',trivia_title:'Trivia',score:'Puntaje',correct:'✓ Correcto',wrong:'✗ Incorrecto — ',football_genius:'¡Genio del fútbol!',solid:'¡Buen conocimiento!',study:'¡Toca estudiar!',score_predictor:'Predictor de marcador',score_desc:'Predice marcadores exactos. Marcador exacto = 3 pts, resultado correcto = 1 pt.',score_saved:'Predicciones guardadas.',kit_title:'Detective de camisetas',kit_ency:'¡Enciclopedia de camisetas!',kit_decent:'Buen conocimiento de camisetas.',kit_study:'Sigue viendo fútbol.',hint:'Pista',it_was:'✗ Era ',new_high:'Nuevo récord'},
  fr:{prediction_title:'Votre prédiction du Mondial',prediction_desc:'Choisissez les vainqueurs de groupe, le champion et la surprise. Comparez avec la simulation pour mesurer votre audace.',save:'Enregistrer',compare:'Comparer au modèle',clear:'Effacer',champion:'Champion',dark_horse:'Surprise',runner_up:'Finaliste',pick_champion:'Choisir le champion...',pick_dark:'Choisir la surprise...',pick_runner:'Choisir le finaliste...',pick:'Choisir...',group:'Groupe',first:'1er',second:'2e',prediction_saved:'Prédiction enregistrée.',run_first:'Lancez d’abord une simulation pour comparer.',save_first:'Enregistrez d’abord une prédiction.',your_picks:'Vos choix vs le modèle',win_prob:'Prob. victoire',ranked:'Classé',of_48:'sur 48',semi_prob:'Prob. demi-finale',bold:'🔥 Choix audacieux',brave:'⚡ Courageux',safe:'🤝 Choix prudent',reasonable:'👍 Raisonnable',penalty_title:'Séance de tirs au but',penalty_desc:'Meilleur sur 5. Choisissez une zone, le gardien plonge.',you:'VOUS',gk:'GB',kick:'Tir',choose_zone:'choisissez une zone',saved:'🧤 Arrêté !',goal:'⚽ BUT !',you_win:'🏆 Vous gagnez !',draw:'🤝 Nul',keeper_wins:'😔 Le gardien gagne',final:'Final',play_again:'Rejouer',rate_title:'Noter le joueur',your_rankings:'Votre classement',rate_again:'Noter encore',copy_rankings:'Copier mon classement',copied:'Copié dans le presse-papiers.',drag_score:'glissez ou cliquez pour noter',next:'Suivant →',trivia_title:'Quiz',score:'Score',correct:'✓ Correct !',wrong:'✗ Faux — ',football_genius:'Génie du foot !',solid:'Solide culture foot !',study:'Il faut réviser !',score_predictor:'Prédicteur de score',score_desc:'Prédisez les scores exacts. Score exact = 3 pts, bon résultat = 1 pt.',score_saved:'Pronostics enregistrés.',kit_title:'Détective de maillots',kit_ency:'Encyclopédie des maillots !',kit_decent:'Bonne connaissance des maillots.',kit_study:'Continuez à regarder du foot.',hint:'Indice',it_was:'✗ C’était ',new_high:'Nouveau record'}
};
const gt=(k)=> (GAMES_TXT[getLang?.()||'es']||GAMES_TXT.en)[k] || GAMES_TXT.en[k] || k;

const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(`wc26_${k}`) || 'null'); } catch { return null; } },
  set: (k,v) => localStorage.setItem(`wc26_${k}`, JSON.stringify(v)),
};

export function showToast(msg, type='ok'){
  let t = document.querySelector('#gameToast');
  if(!t){ t=document.createElement('div'); t.id='gameToast'; t.className='game-toast'; document.body.appendChild(t); }
  t.textContent=msg; t.className=`game-toast ${type} show`;
  setTimeout(()=>t.classList.remove('show'), 2400);
}

// ── 1. USER PREDICTION ──────────────────────────────────────────────────────
export function renderPredictionGame(container){
  const saved = store.get('user_prediction') || {};
  container.innerHTML = `
    <div class="game-header">
      <h2>${gt('prediction_title')}</h2>
      <p class="game-desc">${gt('prediction_desc')}</p>
      <div class="game-actions-top">
        <button id="savePrediction" class="primary">${gt('save')}</button>
        <button id="comparePrediction" class="ghost">${gt('compare')}</button>
        <button id="clearPrediction" class="ghost">${gt('clear')}</button>
      </div>
    </div>
    <div class="pred-champion-row">
      <div class="pred-champion-pick">
        <label>${gt('champion')}</label>
        <select id="predChampion">
          <option value="">${gt('pick_champion')}</option>
          ${TEAMS.sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<option value="${t.id}" ${saved.champion===t.id?'selected':''}>${t.flag} ${t.name}</option>`).join('')}
        </select>
      </div>
      <div class="pred-champion-pick">
        <label>${gt('dark_horse')}</label>
        <select id="predDarkHorse">
          <option value="">${gt('pick_dark')}</option>
          ${TEAMS.sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<option value="${t.id}" ${saved.darkHorse===t.id?'selected':''}>${t.flag} ${t.name}</option>`).join('')}
        </select>
      </div>
      <div class="pred-champion-pick">
        <label>${gt('runner_up')}</label>
        <select id="predRunnerUp">
          <option value="">${gt('pick_runner')}</option>
          ${TEAMS.sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<option value="${t.id}" ${saved.runnerUp===t.id?'selected':''}>${t.flag} ${t.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="pred-groups-grid">
      ${GROUPS.map(g => `<div class="pred-group-card">
        <div class="pred-group-label">${gt('group')} ${g.group}</div>
        ${g.teams.map(id=>{ const t=teamById(id); return `<div class="pred-group-team">${t.flag} ${t.name}</div>`; }).join('')}
        <label class="pred-pick-label">${gt('first')} <select class="pred-group-pick" data-group="${g.group}" data-pos="first">
          <option value="">${gt('pick')}</option>
          ${g.teams.map(id=>`<option value="${id}" ${saved.groups?.[g.group]?.first===id?'selected':''}>${teamById(id)?.name}</option>`).join('')}
        </select></label>
        <label class="pred-pick-label">${gt('second')} <select class="pred-group-pick" data-group="${g.group}" data-pos="second">
          <option value="">${gt('pick')}</option>
          ${g.teams.map(id=>`<option value="${id}" ${saved.groups?.[g.group]?.second===id?'selected':''}>${teamById(id)?.name}</option>`).join('')}
        </select></label>
      </div>`).join('')}
    </div>
    <div id="predCompareResult" class="pred-compare-box" style="display:none"></div>
  `;
  container.querySelector('#savePrediction')?.addEventListener('click',()=>{
    const groups={};
    container.querySelectorAll('.pred-group-pick').forEach(sel=>{
      const {group,pos}=sel.dataset; if(!groups[group]) groups[group]={};
      if(sel.value) groups[group][pos]=sel.value;
    });
    const pred={groups,champion:container.querySelector('#predChampion')?.value||'',
      runnerUp:container.querySelector('#predRunnerUp')?.value||'',
      darkHorse:container.querySelector('#predDarkHorse')?.value||''};
    store.set('user_prediction',pred); showToast(gt('prediction_saved'));
  });
  container.querySelector('#clearPrediction')?.addEventListener('click',()=>{
    store.set('user_prediction',{}); renderPredictionGame(container);
  });
  container.querySelector('#comparePrediction')?.addEventListener('click',()=>{
    const sim=window._latestSimResults; const box=container.querySelector('#predCompareResult');
    const pred=store.get('user_prediction')||{};
    box.style.display='block';
    if(!sim){ box.innerHTML=`<p>${gt('run_first')}</p>`; return; }
    if(!pred.champion){ box.innerHTML=`<p>${gt('save_first')}</p>`; return; }
    const ct=sim.teams.find(t=>t.id===pred.champion);
    const dh=sim.teams.find(t=>t.id===pred.darkHorse);
    const rank=sim.teams.findIndex(t=>t.id===pred.champion)+1;
    const boldness=rank>20?gt('bold'):rank>10?gt('brave'):rank<=3?gt('safe'):gt('reasonable');
    box.innerHTML=`<h4>${gt('your_picks')}</h4>
      <div class="compare-row"><span>${gt('champion')}: <b>${teamById(pred.champion)?.flag} ${teamById(pred.champion)?.name}</b></span>
        <span>${gt('win_prob')}: <b>${ct?(ct.championProb*100).toFixed(1)+'%':'—'}</b></span>
        <span>${gt('ranked')} #${rank} ${gt('of_48')} ${boldness}</span></div>
      ${pred.darkHorse?`<div class="compare-row"><span>${gt('dark_horse')}: <b>${teamById(pred.darkHorse)?.flag} ${teamById(pred.darkHorse)?.name}</b></span>
        <span>${gt('semi_prob')}: <b>${dh?(dh.semiProb*100).toFixed(1)+'%':'—'}</b></span></div>`:''}`;
  });
}

// ── 2. PENALTY SHOOTOUT ─────────────────────────────────────────────────────
let penState=null;
const ZONES={
  'top-left':{x:18,y:17,label:'Top left'},
  'top-mid':{x:50,y:13,label:'Top center'},
  'top-right':{x:82,y:17,label:'Top right'},
  'mid-left':{x:14,y:50,label:'Mid left'},
  'mid-right':{x:86,y:50,label:'Mid right'},
  'bot-left':{x:24,y:77,label:'Low left'},
  'bot-right':{x:76,y:77,label:'Low right'},
};

export function renderPenaltyGame(container){
  penState={you:0,gk:0,round:1,max:5,done:false};
  container.innerHTML=`
    <div class="game-header"><h2>${gt('penalty_title')}</h2>
      <p class="game-desc">${gt('penalty_desc')}</p></div>
    <div class="penalty-arena">
      <div class="pen-scoreboard">
        <div class="pen-score-you"><span id="penYou">0</span><small>${gt('you')}</small></div>
        <div class="pen-sep">–</div>
        <div class="pen-score-gk"><span id="penGk">0</span><small>${gt('gk')}</small></div>
      </div>
      <div class="pen-info" id="penInfo">${gt('kick')} 1/5 — ${gt('choose_zone')}</div>
      <div class="pen-goal-wrap">
        <div class="pen-goal" id="penGoal">
          <div class="pen-zones">${Object.entries(ZONES).map(([k,v])=>
            `<div class="pen-zone" data-zone="${k}" title="${v.label}"><span class="zone-hint">${v.label}</span></div>`).join('')}</div>
          <div class="pen-ball" id="penBall"></div>
          <div class="pen-keeper" id="penKeeper">🧤</div>
          <div class="pen-net-overlay" id="penNet"></div>
        </div>
      </div>
      <div class="pen-msg" id="penMsg"></div>
      <div class="pen-kicks" id="penKicks">${Array(5).fill('<div class="pen-kick-dot"></div>').join('')}</div>
      <button class="primary" id="penRestart" style="display:none;margin:14px auto">${gt('play_again')}</button>
    </div>`;
  container.querySelectorAll('.pen-zone').forEach(z=>z.addEventListener('click',()=>takePen(z.dataset.zone,container)));
  container.querySelector('#penRestart')?.addEventListener('click',()=>renderPenaltyGame(container));
}

function takePen(zone, container){
  if(penState.done) return;
  container.querySelectorAll('.pen-zone').forEach(z=>z.style.pointerEvents='none');
  const pos=ZONES[zone], zKeys=Object.keys(ZONES);
  const keeperZone=zKeys[Math.floor(Math.random()*zKeys.length)];
  const saved=keeperZone===zone && Math.random()>.32;
  const ball=container.querySelector('#penBall'), keeper=container.querySelector('#penKeeper');
  const msg=container.querySelector('#penMsg');
  ball.style.cssText=`display:block;left:50%;top:88%;transition:none`;
  keeper.style.cssText=`left:50%;top:54%;transition:none;font-size:min(9vw,36px)`;
  keeper.textContent='🧤';
  requestAnimationFrame(()=>{
    ball.style.transition='all 0.38s cubic-bezier(0.2,0.8,0.3,1)';
    ball.style.left=`${pos.x}%`; ball.style.top=`${pos.y}%`;
    const kpos=ZONES[keeperZone];
    setTimeout(()=>{
      keeper.style.transition='all 0.32s ease-out';
      keeper.style.left=`${kpos.x}%`; keeper.style.top=`${kpos.y}%`;
    },80);
    setTimeout(()=>{
      if(saved){ penState.gk++; msg.textContent=gt('saved'); msg.className='pen-msg miss'; keeper.textContent='🏆'; }
      else { penState.you++; msg.textContent=gt('goal'); msg.className='pen-msg goal'; keeper.textContent='😤'; }
      container.querySelector('#penYou').textContent=penState.you;
      container.querySelector('#penGk').textContent=penState.gk;
      const dots=container.querySelectorAll('.pen-kick-dot');
      if(dots[penState.round-1]) dots[penState.round-1].className=`pen-kick-dot ${saved?'miss':'scored'}`;
      setTimeout(()=>{
        ball.style.display='none'; penState.round++;
        if(penState.round>penState.max){
          penState.done=true;
          const won=penState.you>penState.gk, draw=penState.you===penState.gk;
          msg.textContent=won?gt('you_win'):draw?gt('draw'):gt('keeper_wins');
          msg.className='pen-msg final';
          container.querySelector('#penInfo').textContent=`${gt('final')}: ${penState.you}–${penState.gk}`;
          container.querySelector('#penRestart').style.display='block';
          updateHS('penalty',penState.you);
        } else {
          container.querySelector('#penInfo').textContent=`${gt('kick')} ${penState.round}/5 — ${gt('choose_zone')}`;
          msg.textContent=''; msg.className='pen-msg';
          container.querySelectorAll('.pen-zone').forEach(z=>z.style.pointerEvents='');
        }
      },900);
    },520);
  });
}

// ── 3. RATE THE PLAYER (viral — Davo/Cobra style) ──────────────────────────
const RATE_PLAYERS = [
  {id:'mbappe',name:'Kylian Mbappé',flag:'🇫🇷',club:'Real Madrid',stat:'96 caps · 56 goals'},
  {id:'haaland',name:'Erling Haaland',flag:'🇳🇴',club:'Manchester City',stat:'18+ WC goals needed'},
  {id:'messi',name:'Lionel Messi',flag:'🇦🇷',club:'Inter Miami',stat:'World champion 2022'},
  {id:'vinicius',name:'Vinícius Jr',flag:'🇧🇷',club:'Real Madrid',stat:'Ballon d\'Or candidate'},
  {id:'bellingham',name:'Jude Bellingham',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',club:'Real Madrid',stat:'56 caps · 17 goals'},
  {id:'kane',name:'Harry Kane',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',club:'Bayern Munich',stat:'101 caps · 68 goals'},
  {id:'yamal',name:'Lamine Yamal',flag:'🇪🇸',club:'Barcelona',stat:'18 years old · Euro winner'},
  {id:'ronaldo',name:'Cristiano Ronaldo',flag:'🇵🇹',club:'Al-Nassr',stat:'214 caps · 137 goals'},
  {id:'wirtz',name:'Florian Wirtz',flag:'🇩🇪',club:'Bayer Leverkusen',stat:'Rising star'},
  {id:'musiala',name:'Jamal Musiala',flag:'🇩🇪',club:'Bayern Munich',stat:'German prodigy'},
  {id:'pedri',name:'Pedri',flag:'🇪🇸',club:'Barcelona',stat:'Golden Boy 2021'},
  {id:'salah',name:'Mohamed Salah',flag:'🇪🇬',club:'Liverpool',stat:'Premier League legend'},
  {id:'son',name:'Son Heung-min',flag:'🇰🇷',club:'Tottenham',stat:'Asian legend'},
  {id:'hakimi',name:'Achraf Hakimi',flag:'🇲🇦',club:'PSG',stat:'Best African fullback'},
  {id:'davies',name:'Alphonso Davies',flag:'🇨🇦',club:'Bayern Munich',stat:'Canada\'s greatest ever'},
];

let rateIdx=0, rateScores=[], rateCurrent=null;

export function renderRateGame(container){
  rateIdx=0; rateScores=[];
  const shuffled=[...RATE_PLAYERS].sort(()=>Math.random()-.5).slice(0,10);
  window._rateQueue=shuffled;
  renderRateCard(container, shuffled);
}

function renderRateCard(container, queue){
  if(rateIdx>=queue.length){
    // Show results — ranked order
    const ranked=[...rateScores].sort((a,b)=>b.score-a.score);
    container.innerHTML=`<div class="game-header"><h2>${gt('rate_title')}</h2></div>
      <div class="rate-results">
        <h3>${gt('your_rankings')}</h3>
        <div class="rate-results-list">
          ${ranked.map((r,i)=>`<div class="rate-result-row">
            <span class="rate-result-pos">${i+1}</span>
            <canvas class="player-portrait-canvas" data-player="${r.id}" data-size="36" width="36" height="36" 
              style="width:36px;height:36px;border-radius:50%;flex-shrink:0"></canvas>
            <span class="rate-result-name">${r.name} ${r.flag}</span>
            <div class="rate-stars-display">${'★'.repeat(r.score)}${'☆'.repeat(10-r.score)}</div>
            <span class="rate-score-num">${r.score}/10</span>
          </div>`).join('')}
        </div>
        <button class="primary" id="rateRestart" style="margin-top:18px">${gt('rate_again')}</button>
        <button class="ghost" id="rateShare" style="margin-top:18px">${gt('copy_rankings')}</button>
      </div>`;
    container.querySelector('#rateRestart')?.addEventListener('click',()=>renderRateGame(container));
    container.querySelector('#rateShare')?.addEventListener('click',()=>{
      const text=ranked.map((r,i)=>`${i+1}. ${r.name} ${r.flag} — ${r.score}/10`).join('\n');
      navigator.clipboard?.writeText(`${gt('rate_title')}:\n`+text);
      showToast(gt('copied'));
    });
    // Draw portraits
    setTimeout(()=>window._schedulePortraits?.(),100);
    updateHS('rate', Math.round(ranked[0]?.score||0));
    return;
  }
  const p=queue[rateIdx];
  rateCurrent=p;
  container.innerHTML=`
    <div class="game-header"><h2>${gt('rate_title')}</h2>
      <p class="game-desc">${rateIdx+1}/${queue.length} — ${gt('drag_score')}</p></div>
    <div class="rate-card-wrap">
      <div class="rate-card">
        <div class="rate-portrait-wrap">
          <canvas class="player-portrait-canvas" data-player="${p.id}" data-size="100" width="100" height="100"
            style="width:100px;height:100px;border-radius:50%;display:block;margin:0 auto;border:3px solid var(--line)"></canvas>
        </div>
        <div class="rate-player-name">${p.name}</div>
        <div class="rate-player-meta">${p.flag} · ${p.club}</div>
        <div class="rate-player-stat">${p.stat}</div>
        <div class="rate-slider-wrap">
          <div class="rate-stars" id="rateStars">
            ${Array(10).fill(0).map((_,i)=>`<span class="rate-star" data-val="${i+1}">★</span>`).join('')}
          </div>
          <input type="range" id="rateSlider" min="1" max="10" value="5" class="rate-slider">
          <div class="rate-value-display" id="rateVal">5 / 10</div>
        </div>
        <button class="primary" id="rateSubmit" style="margin-top:18px;width:100%">${gt('next')}</button>
        <div class="rate-progress-bar"><div class="rate-progress-fill" style="width:${(rateIdx/queue.length)*100}%"></div></div>
      </div>
    </div>`;
  
  setTimeout(()=>window._schedulePortraits?.(), 50);
  
  const slider=container.querySelector('#rateSlider');
  const stars=container.querySelectorAll('.rate-star');
  const valDisplay=container.querySelector('#rateVal');
  
  const updateStars=v=>{
    stars.forEach((s,i)=>{ s.classList.toggle('active', i<v); });
    valDisplay.textContent=`${v} / 10`;
  };
  updateStars(5);
  
  slider.addEventListener('input',()=>updateStars(parseInt(slider.value)));
  stars.forEach(s=>{ s.addEventListener('click',()=>{ slider.value=s.dataset.val; updateStars(parseInt(s.dataset.val)); }); });
  
  container.querySelector('#rateSubmit')?.addEventListener('click',()=>{
    rateScores.push({...p, score:parseInt(slider.value)});
    rateIdx++;
    renderRateCard(container, queue);
  });
}

// ── 4. TRIVIA ───────────────────────────────────────────────────────────────
const TRIVIA=[
  {q:'Which team won the 2022 World Cup?',opts:['Brazil','France','Argentina','Croatia'],ans:2},
  {q:'How many teams play in WC 2026?',opts:['32','36','48','64'],ans:2},
  {q:'Who scored in the 2022 final for Argentina?',opts:['Di María','Messi & Álvarez','Lautaro','Paredes'],ans:1},
  {q:'Which 3 countries host WC 2026?',opts:['USA/Brazil/Canada','USA/Mexico/Canada','Mexico/Colombia/USA','Canada/Brazil/Mexico'],ans:1},
  {q:'Who won the 2022 WC Golden Ball?',opts:['Mbappé','Modric','Messi','Benzema'],ans:2},
  {q:'Cristiano Ronaldo has how many int\'l goals?',opts:['110','127','137','98'],ans:2},
  {q:'Which country has most World Cup wins?',opts:['Germany','Brazil','Italy','Argentina'],ans:1},
  {q:'WC 2026: Where is the FINAL played?',opts:['Dallas','Los Angeles','New York (MetLife)','Miami'],ans:2},
  {q:'Who is Mexico\'s all-time top scorer?',opts:['Hugo Sánchez','Javier Hernández','Raúl Jiménez','Cuauhtémoc Blanco'],ans:1},
  {q:'In WC 2026, how many matches in the group stage?',opts:['48','72','64','80'],ans:1},
  {q:'Opening match of WC 2026?',opts:['USA vs Canada','Brazil vs Argentina','Mexico vs South Africa','Spain vs Germany'],ans:2},
  {q:'Who is Spain\'s youngest WC 2026 player?',opts:['Pedri','Gavi','Lamine Yamal','Bryan Gil'],ans:2},
];
let tIdx=0, tScore=0, tAns=false, tQ=[];

export function renderTriviaGame(container){
  tIdx=0; tScore=0; tAns=false;
  tQ=[...TRIVIA].sort(()=>Math.random()-.5).slice(0,8);
  renderTQ(container);
}

function renderTQ(container){
  if(tIdx>=tQ.length){
    updateHS('trivia',tScore);
    container.innerHTML=`<div class="game-header"><h2>${gt('trivia_title')}</h2></div>
      <div class="trivia-end">
        <div class="trivia-trophy">${tScore>=7?'🏆':tScore>=5?'🥈':tScore>=3?'🥉':'📚'}</div>
        <div class="trivia-final">${tScore}/${tQ.length}</div>
        <p>${tScore>=7?gt('football_genius'):tScore>=5?gt('solid'):gt('study')}</p>
        <button class="primary" id="triviaRestart">${gt('play_again')}</button>
      </div>`;
    container.querySelector('#triviaRestart')?.addEventListener('click',()=>renderTriviaGame(container));
    return;
  }
  const q=tQ[tIdx]; tAns=false;
  container.innerHTML=`<div class="game-header"><h2>${gt('trivia_title')}</h2>
      <div class="trivia-progress">${tIdx+1}/${tQ.length} · ${gt('score')}: ${tScore}</div></div>
    <div class="trivia-card">
      <div class="trivia-q">${q.q}</div>
      <div class="trivia-opts">${q.opts.map((o,i)=>
        `<button class="trivia-opt" data-idx="${i}">${o}</button>`).join('')}
      </div>
      <div class="trivia-fb" id="trivFB"></div>
    </div>`;
  container.querySelectorAll('.trivia-opt').forEach(btn=>btn.addEventListener('click',()=>{
    if(tAns) return; tAns=true;
    const ok=parseInt(btn.dataset.idx)===q.ans;
    if(ok) tScore++;
    container.querySelectorAll('.trivia-opt').forEach((b,i)=>{
      if(i===q.ans) b.classList.add('correct');
      else if(parseInt(btn.dataset.idx)===i&&!ok) b.classList.add('wrong');
      b.disabled=true;
    });
    const fb=container.querySelector('#trivFB');
    fb.textContent=ok?gt('correct'):gt('wrong')+q.opts[q.ans];
    fb.className=`trivia-fb ${ok?'fb-ok':'fb-err'}`;
    setTimeout(()=>{tIdx++; renderTQ(container);},1350);
  }));
}

// ── 5. SCORE PREDICTOR ──────────────────────────────────────────────────────
export function renderScorePredictor(container){
  const fixtures=buildGroupFixtures().slice(0,16);
  const saved=store.get('score_preds')||{};
  container.innerHTML=`<div class="game-header"><h2>${gt('score_predictor')}</h2>
    <p class="game-desc">${gt('score_desc')}</p>
    <button id="saveScorePreds" class="primary">${gt('save')}</button></div>
  <div class="score-pred-grid">${fixtures.map(f=>{
    const a=teamById(f.teamA), b=teamById(f.teamB), sv=saved[f.id]||{};
    return `<div class="score-pred-card">
      <div class="sp-date">${f.date} · ${gt('group')} ${f.group}</div>
      <div class="sp-match">
        <span>${a.flag} ${a.name}</span>
        <input type="number" class="sp-inp" data-match="${f.id}" data-side="A" min="0" max="20" value="${sv.goalsA||''}" placeholder="0">
        <span class="sp-sep">–</span>
        <input type="number" class="sp-inp" data-match="${f.id}" data-side="B" min="0" max="20" value="${sv.goalsB||''}" placeholder="0">
        <span>${b.name} ${b.flag}</span>
      </div>
    </div>`;}).join('')}</div>`;
  container.querySelector('#saveScorePreds')?.addEventListener('click',()=>{
    const p={};
    container.querySelectorAll('.sp-inp').forEach(inp=>{
      const {match,side}=inp.dataset; if(!p[match]) p[match]={};
      p[match][`goals${side}`]=inp.value;
    });
    store.set('score_preds',p); showToast(gt('score_saved'));
  });
}

// ── 6. NATIONS QUIZ — "Which country is this kit?" (viral YouTube format) ──
const KIT_QUESTIONS = [
  {team:'BRA',q:'Yellow shirt, green shorts, blue socks — which country?',hint:'5x World Cup winners'},
  {team:'ARG',q:'Light blue & white stripes — which country?',hint:'Current World Champions'},
  {team:'GER',q:'All white shirt, black shorts — which country?',hint:'4x World Cup winners'},
  {team:'FRA',q:'Dark blue shirt, white shorts — which country?',hint:'2018 World Champions'},
  {team:'ENG',q:'White shirt with 3 lions crest — which country?',hint:'1966 World Champions'},
  {team:'ESP',q:'Red shirt, dark navy shorts — which country?',hint:'2010 World Champions'},
  {team:'POR',q:'Red shirt, green shorts — which country?',hint:'Euro 2016 champions'},
  {team:'MEX',q:'Green shirt with eagle crest — which country?',hint:'Co-host of WC 2026'},
  {team:'MAR',q:'Red shirt with green star — which country?',hint:'2022 WC semi-finalists (Africa)'},
  {team:'NED',q:'Bright orange shirt — which country?',hint:'Known as "Oranje"'},
  {team:'BEL',q:'Red shirt, black shorts — which country?',hint:'Former FIFA #1'},
  {team:'URU',q:'Light blue shirt — which country?',hint:'Two-time WC winners, South America'},
  {team:'KOR',q:'Red shirt with tiger crest — which country?',hint:'2002 WC semi-finalists, Asia'},
  {team:'JPN',q:'Dark blue shirt with Samurai Blue badge — which country?',hint:'Asian powerhouse'},
  {team:'SEN',q:'Green & yellow shirt — which country?',hint:'African Cup winners 2022'},
];
let kIdx=0, kScore=0;

export function renderKitQuiz(container){
  kIdx=0; kScore=0;
  const queue=[...KIT_QUESTIONS].sort(()=>Math.random()-.5).slice(0,8);
  window._kitQueue=queue;
  renderKQ(container, queue);
}

function renderKQ(container, queue){
  if(kIdx>=queue.length){
    updateHS('kit',kScore);
    container.innerHTML=`<div class="game-header"><h2>${gt('kit_title')}</h2></div>
      <div class="trivia-end">
        <div class="trivia-trophy">${kScore>=7?'🎽':'⚽'}</div>
        <div class="trivia-final">${kScore}/${queue.length}</div>
        <p>${kScore>=7?gt('kit_ency'):kScore>=4?gt('kit_decent'):gt('kit_study')}</p>
        <button class="primary" id="kitRestart">${gt('play_again')}</button>
      </div>`;
    container.querySelector('#kitRestart')?.addEventListener('click',()=>renderKitQuiz(container));
    return;
  }
  const q=queue[kIdx];
  // Get 3 wrong options
  const allTeams=TEAMS.filter(t=>t.id!==q.team).sort(()=>Math.random()-.5).slice(0,3).map(t=>t.id);
  const opts=[q.team,...allTeams].sort(()=>Math.random()-.5);
  container.innerHTML=`<div class="game-header"><h2>${gt('kit_title')}</h2>
    <div class="trivia-progress">${kIdx+1}/${queue.length} · ${gt('score')}: ${kScore}</div></div>
    <div class="trivia-card">
      <div class="kit-question">${q.q}</div>
      <div class="kit-hint">💡 ${gt('hint')}: ${q.hint}</div>
      <div class="trivia-opts kit-opts">${opts.map(tid=>{
        const t=teamById(tid);
        return `<button class="trivia-opt" data-team="${tid}">${t?.flag} ${t?.name}</button>`;
      }).join('')}</div>
      <div class="trivia-fb" id="kitFB"></div>
    </div>`;
  container.querySelectorAll('.trivia-opt').forEach(btn=>btn.addEventListener('click',()=>{
    const ok=btn.dataset.team===q.team;
    if(ok) kScore++;
    container.querySelectorAll('.trivia-opt').forEach(b=>{
      if(b.dataset.team===q.team) b.classList.add('correct');
      else if(b===btn&&!ok) b.classList.add('wrong');
      b.disabled=true;
    });
    const fb=container.querySelector('#kitFB');
    fb.textContent=ok?gt('correct'):gt('it_was')+teamById(q.team)?.name;
    fb.className=`trivia-fb ${ok?'fb-ok':'fb-err'}`;
    setTimeout(()=>{ kIdx++; renderKQ(container, queue); },1350);
  }));
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function updateHS(game, score){
  const k=`hs_${game}`, c=store.get(k)||0;
  if(score>c){ store.set(k,score); showToast(`${gt('new_high')}: ${score}! 🏆`,'gold'); }
}
export function getHighScores(){
  return {penalty:store.get('hs_penalty')||0, trivia:store.get('hs_trivia')||0,
    rate:store.get('hs_rate')||0, kit:store.get('hs_kit')||0};
}
