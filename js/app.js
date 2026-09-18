import { CONFIG } from './config.js';
import { TEAMS } from './data-teams.js';
import { runMonteCarlo, cancelMonteCarlo } from './montecarlo.js';
import { cacheRatings } from './neural-model.js';
import { simulatePlayerLeaderboards } from './player-stats-engine.js';
import { buildBettingBoard } from './betting-engine.js';
import { initFilters, resetProgress, updateProgress, renderDashboard, renderTeamTable, renderGroups, navigate, applyLanguage, bindMatchFilters, renderEmptyDashboard, t } from './ui.js';
import { exportJSON, exportCSV } from './export.js';
import { setSound, isSoundEnabled, tick, goal, complete, whistle } from './sound-engine.js';
import { initThreeStage, kickThreeBall, startPencilRun, finishPencilRun } from './three-scene.js';
import { renderPredictionGame, renderPenaltyGame, renderTriviaGame, renderScorePredictor, renderRateGame, renderKitQuiz, getHighScores, showToast } from './games.js';
import { hydratePlayerPhotos } from './player-photo-api.js';
import { SQUADS } from './data-squads.js';
import { fetchLiveFixtures, getUpcoming, getRecent, getLive } from './live-fixtures.js';
import { teamById } from './data-teams.js';
import { loadTeamDataOverrides, runBacktestAudit, DATA_QUALITY_VERSION } from './data-quality.js';
import { initArcadeMatch } from './arcade-match.js';

let latestResults=null, latestPlayers=null, latestBetting=null, lastSoundPct=0;

// ── Portrait bridge ──────────────────────────────────────────────────────────
window._hydratePlayerPhotos = hydratePlayerPhotos;
window._schedulePortraits = () => {
  requestAnimationFrame(()=>{
    if(window._hydratePlayerPhotos) window._hydratePlayerPhotos(document);
  });
};


function renderModelAudit(loadReport=null){
  const box=document.querySelector('#modelAuditBox');
  if(!box) return;
  const audit=runBacktestAudit();
  const L=document.documentElement.lang||'es';
  const labels={
    es:{
      title:'Auditoría del modelo', data:'Overrides externos', source:'Fuente', changed:'campos', teams:'equipos',
      back:'Back-test (2006 · 2010 · 2014 · 2018 · 2022)', champ:'rango prom. del campeón real',
      semi:'semifinalistas en top 4', finals:'finales predichas', note:'Nota', sources:'Fuentes'
    },
    en:{
      title:'Model audit', data:'Live overrides', source:'Source', changed:'fields', teams:'teams',
      back:'Back-test (2006 · 2010 · 2014 · 2018 · 2022)', champ:'avg champion rank',
      semi:'semifinalists in top 4', finals:'finals correctly predicted', note:'Note', sources:'Sources'
    },
    fr:{
      title:'Audit du modèle', data:'Surcharges live', source:'Source', changed:'champs', teams:'équipes',
      back:'Back-test (2006 · 2010 · 2014 · 2018 · 2022)', champ:'rang moy. du vrai champion',
      semi:'demi-finalistes dans le top 4', finals:'finales prédites', note:'Note', sources:'Sources'
    }
  }[L]||{};

  const overrideStatus = loadReport?.loaded
    ? `<span style="color:#22c55e">&#10003; OK</span> · ${loadReport.overriddenTeams||0} ${labels.teams} · ${loadReport.changed||0} ${labels.changed}`
    : `<span style="color:#f59e0b">fallback local</span>`;

  const editionRows = (audit.editions||[]).map(e=>{
    const champHit = e.actualRank===1 ? '&#10003;' : `#${e.actualRank}`;
    return `<tr><td>${e.year}</td><td>${e.modelTop}</td><td>${e.actualChampion} ${champHit}</td><td>${e.semiHits}/4</td><td>${e.finalAccuracy?'&#10003;':'&#10007;'}</td><td>${e.brier}</td></tr>`;
  }).join('');

  const sourceLinks = (audit.dataSources||[]).map(u=>{
    const host=u.replace(/^https?:\/\/(www\.)?/,'').split('/')[0];
    return `<a href="${u}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none">${host}</a>`;
  }).join(' · ');

  box.innerHTML=`
    <h3>${labels.title} <span style="font-size:11px;font-family:var(--mono);color:var(--muted)">${DATA_QUALITY_VERSION}</span></h3>
    <div style="display:grid;grid-template-columns:minmax(0,1fr);gap:10px;font-family:var(--mono);font-size:12px;line-height:1.5;color:var(--ink)">
      <div><b>${labels.data}:</b> ${overrideStatus} · <b>${labels.source}:</b> ${loadReport?.source||'static bundled data'}</div>
      <div>
        <b>${labels.back}</b>
        <div class="table-scroll">
        <table style="width:100%;min-width:340px;border-collapse:collapse;margin-top:4px;font-size:11px">
          <thead><tr style="color:var(--muted);border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:2px 6px 2px 0">Año</th>
            <th style="text-align:left;padding:2px 6px">Top modelo</th>
            <th style="text-align:left;padding:2px 6px">Campeón</th>
            <th style="text-align:left;padding:2px 6px">${labels.semi}</th>
            <th style="text-align:left;padding:2px 6px">Final</th>
            <th style="text-align:left;padding:2px 0">Brier</th>
          </tr></thead>
          <tbody style="color:var(--ink)">${editionRows}</tbody>
          <tfoot><tr style="color:var(--muted);border-top:1px solid var(--border);font-weight:600">
            <td colspan="2" style="padding-top:4px">Promedio</td>
            <td>rank ${audit.avgChampionRank}</td>
            <td>${audit.avgSemiHits}/4</td>
            <td>${audit.finalPredictionAccuracy}</td>
            <td></td>
          </tr></tfoot>
        </table>
        </div>
      </div>
      <div style="color:var(--muted)"><b>${labels.note}:</b> ${audit.note}</div>
      ${sourceLinks ? `<div style="color:var(--muted);font-size:11px"><b>${labels.sources}:</b> ${sourceLinks}</div>` : ''}
    </div>`;
}
window._renderModelAudit = renderModelAudit;

function setRunning(r){
  ['#runSimulation','#runSimulationTop'].forEach(s=>{
    const e=document.querySelector(s); if(e){e.disabled=r; e.textContent=r?(t('running')||'Running…'):(t('run')||'Run Simulation');}
  });
  document.querySelector('#cancelSimulation').disabled=!r;
  ['#exportJson','#exportCsv','#exportJsonSettings','#exportCsvSettings'].forEach(s=>{
    const e=document.querySelector(s); if(e) e.disabled=r||!latestResults;
  });
}

function seedInitialDashboard(){ latestResults=null; latestPlayers=null; latestBetting=null; renderEmptyDashboard(); }

function updateProgressWithSound(payload){
  updateProgress(payload);
  const step=Math.floor(payload.progress*12);
  if(step>lastSoundPct){ lastSoundPct=step; tick(); kickThreeBall(); }
}

function run(){
  const total=Number(document.querySelector('#simulationCount').value);
  const chunk=Number(document.querySelector('#chunkSize')?.value||CONFIG.chunkSize);
  setRunning(true); resetProgress(); lastSoundPct=0;
  whistle(); kickThreeBall(); startPencilRun();
  navigate('simulator');
  cacheRatings(TEAMS);  // pre-calcula attackRating/defenseRating una vez (rendimiento MC)
  const started=performance.now();
  runMonteCarlo(total,chunk,updateProgressWithSound,(results,cancelled)=>{
    latestResults=results;
    document.querySelector('#progressLabel').textContent=t('building_player_tables')||'Calculando tablas de jugadores…';
    latestPlayers=simulatePlayerLeaderboards(results.teams,Math.min(2200,Math.max(900,Math.floor(total/120))));
    window._latestPlayers=latestPlayers;
    latestBetting=buildBettingBoard(results,latestPlayers);
    window._latestBetting=latestBetting;
    window._latestSimResults=results;
    renderDashboard(latestResults,latestBetting,latestPlayers);
    window._schedulePortraits();
    setRunning(false);
    document.querySelector('#progressLabel').textContent=cancelled?`${t('cancelled_after')} ${results.simulations.toLocaleString()} ${t('simulations').toLowerCase()}`:`${t('completed')} ${results.simulations.toLocaleString()} ${t('simulations').toLowerCase()}`;
    document.querySelector('#runtimeLabel').textContent=`${t('runtime')} ${((performance.now()-started)/1000).toFixed(1)}s`;
    document.querySelector('.dock-status')?.classList.remove('running');
    document.querySelector('#miniStatus').textContent=cancelled?t('cancelled_status'):t('complete_status');
    document.querySelector('#miniRuntime').textContent=`${results.simulations.toLocaleString()} ${t('simulations').toLowerCase()}`;
    cancelled?tick():complete(); goal(); kickThreeBall(); finishPencilRun();
    setTimeout(()=>navigate(document.querySelector('#postRunView')?.value||'bracket'),900);
  });
}

function initTheme(){
  const saved=localStorage.getItem('wc26-theme')||'light';
  document.documentElement.dataset.theme=saved; syncThemeButtons();
  const toggle=()=>{
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next; localStorage.setItem('wc26-theme',next); syncThemeButtons();
  };
  document.querySelector('#themeToggle')?.addEventListener('click',toggle);
  document.querySelector('#quickTheme')?.addEventListener('click',toggle);
}
function syncThemeButtons(){
  const d=document.documentElement.dataset.theme==='dark';
  document.querySelector('#quickTheme').textContent=d?t('light'):t('dark');
  document.querySelector('#themeToggle').textContent=d?(document.documentElement.lang==='es'?'Cambiar a claro':document.documentElement.lang==='fr'?'Passer au clair':'Switch to light'):(document.documentElement.lang==='es'?'Cambiar a oscuro':document.documentElement.lang==='fr'?'Passer au sombre':'Switch to dark');
}
function initSound(){
  const sync=()=>{
    document.querySelector('#soundToggle').textContent=isSoundEnabled()?t('sound_on'):t('sound_off');
    document.querySelector('#quickSound').textContent=isSoundEnabled()?t('sound_on'):t('sound_off');
  };
  const toggle=()=>{ setSound(!isSoundEnabled()); sync(); if(isSoundEnabled()) goal(); };
  document.querySelector('#soundToggle')?.addEventListener('click',toggle);
  document.querySelector('#quickSound')?.addEventListener('click',toggle);
  document.querySelector('#testGoal')?.addEventListener('click',()=>{ setSound(true); sync(); goal(); kickThreeBall(); });
  document.querySelector('#playWhistle')?.addEventListener('click',whistle);
  sync();
}

function initSettings(){
  document.documentElement.dataset.motion=localStorage.getItem('wc26-motion')||'on';
  const syncMotion=()=>{
    document.querySelector('#motionToggle').textContent=document.documentElement.dataset.motion==='off'?(document.documentElement.lang==='es'?'Activar animaciones':document.documentElement.lang==='fr'?'Activer les animations':'Enable animations'):(document.documentElement.lang==='es'?'Desactivar animaciones':document.documentElement.lang==='fr'?'Désactiver les animations':'Disable animations');
  };
  syncMotion();
  document.querySelector('#motionToggle')?.addEventListener('click',()=>{
    const off=document.documentElement.dataset.motion==='off';
    document.documentElement.dataset.motion=off?'on':'off';
    localStorage.setItem('wc26-motion',document.documentElement.dataset.motion); syncMotion();
  });
  document.querySelector('#languageSelect')?.addEventListener('change',e=>{
    applyLanguage(e.target.value); tick();
    if(latestResults) renderTeamTable(latestResults);
  });
  const savedLang=localStorage.getItem('wc26-lang')||'es';
  const langSel=document.querySelector('#languageSelect');
  if(langSel) langSel.value=savedLang;
  applyLanguage(savedLang);
  document.querySelector('#compactDensity')?.addEventListener('click',e=>{
    const a=document.body.classList.toggle('density-compact');
    e.currentTarget.textContent=a?(document.documentElement.lang==='es'?'Densidad normal':document.documentElement.lang==='fr'?'Densité normale':'Normal density'):(document.documentElement.lang==='es'?'Densidad compacta':document.documentElement.lang==='fr'?'Densité compacte':'Compact density');
  });
  document.querySelector('#resetAllData')?.addEventListener('click',()=>{
    if(confirm(document.documentElement.lang==='es'?'¿Reiniciar todos los datos y preferencias?':document.documentElement.lang==='fr'?'Réinitialiser toutes les données et préférences ?':'Reset all data and preferences?')){ localStorage.clear(); location.reload(); }
  });
  document.querySelector('#resetGames')?.addEventListener('click',()=>{
    ['hs_penalty','hs_trivia','hs_rate','hs_kit','user_prediction','score_preds'].forEach(k=>localStorage.removeItem(`wc26_${k}`));
    updateGameScores(); showToast('Game scores reset');
  });
  const autoOpen=document.querySelector('#postRunView');
  if(autoOpen){ const sv=localStorage.getItem('wc26-postrun')||'bracket'; autoOpen.value=sv; autoOpen.addEventListener('change',e=>localStorage.setItem('wc26-postrun',e.target.value)); }
  const dateFilter=document.querySelector('#matchDateFilter');
  if(dateFilter && dateFilter.options.length===1){
    ['Jun 11','Jun 12','Jun 13','Jun 14','Jun 15','Jun 16','Jun 17','Jun 18','Jun 19','Jun 20',
     'Jun 21','Jun 22','Jun 23','Jun 24','Jun 25','Jun 26','Jun 27','Jun 28','Jun 29','Jun 30',
     'Jul 1','Jul 2','Jul 3','Jul 4','Jul 5','Jul 6','Jul 7','Jul 8','Jul 9','Jul 10','Jul 11','Jul 12','Jul 13'].forEach(d=>{
      const o=document.createElement('option'); o.value=d; o.textContent=d; dateFilter.appendChild(o);
    });
  }
  document.querySelector('#toggleMatchEvents')?.addEventListener('click',e=>{
    document.body.classList.toggle('hide-match-events');
    e.currentTarget.textContent=document.body.classList.contains('hide-match-events')?'Events: off':'Events: on';
  });
  document.querySelector('#exportPrediction')?.addEventListener('click',()=>{
    const pred=JSON.parse(localStorage.getItem('wc26_user_prediction')||'{}');
    const blob=new Blob([JSON.stringify(pred,null,2)],{type:'application/json'});
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'my-wc26-prediction.json'});
    a.click();
  });
}

function updateGameScores(){
  const hs=getHighScores();
  const el=document.querySelector('#gamesHighScores');
  if(el) el.innerHTML=`${t('best_penalty')}: ${hs.penalty}/5 · ${t('best_trivia')}: ${hs.trivia}/8 · ${t('best_rating')}: ${hs.rate}/10 · ${t('kit_score')}: ${hs.kit}/8`;
}

function initGames(){
  const gc=document.querySelector('#gameContent');
  const tabs=document.querySelectorAll('.game-tab');
  const renderGame=g=>{
    window._activeGame=g;
    tabs.forEach(t=>t.classList.toggle('active',t.dataset.game===g));
    if(!gc) return;
    switch(g){
      case 'prediction': renderPredictionGame(gc); break;
      case 'penalty':    renderPenaltyGame(gc); break;
      case 'rate':       renderRateGame(gc); break;
      case 'trivia':     renderTriviaGame(gc); break;
      case 'kit':        renderKitQuiz(gc); break;
      case 'scores':     renderScorePredictor(gc); break;
    }
    setTimeout(()=>window._schedulePortraits?.(),80);
  };
  window._renderActiveGame=()=>{ renderGame(window._activeGame || 'prediction'); updateGameScores(); };
  tabs.forEach(tab=>tab.addEventListener('click',()=>{ renderGame(tab.dataset.game); tick(); }));
  renderGame(window._activeGame || 'prediction');
  updateGameScores();
  document.querySelector('#view-games')?.addEventListener('click',updateGameScores);
}

// ── Teams / Squad view ───────────────────────────────────────────────────────
function initSquadView(){
  const container=document.querySelector('#teamSquadView');
  if(!container) return;
  
  // Team selector
  const sel=document.querySelector('#squadTeamSelect');
  if(sel){
    Object.keys(SQUADS).forEach(k=>{
      const team=teamById(k);
      const o=document.createElement('option'); o.value=k; o.textContent=`${team?.flag||''} ${team?.name||k}`; sel.appendChild(o);
    });
    sel.addEventListener('change',()=>renderSquad(sel.value, container));
    renderSquad('FRA', container);
    sel.value='FRA';
  }
}

function renderSquad(teamId, container){
  const squad=SQUADS[teamId]; if(!squad) return;
  const team=teamById(teamId);
  const simResults=window._latestSimResults;
  const byPos={GK:[],DF:[],MF:[],FW:[]};
  squad.players.forEach(p=>{ if(byPos[p.pos]) byPos[p.pos].push(p); });
  container.innerHTML=`
    <div class="squad-team-header">
      <div class="squad-team-flag">${team?.flag||''}</div>
      <div>
        <h3>${team?.name||teamId}</h3>
        <span class="squad-coach">Coach: ${squad.coach}</span>
      </div>
      ${simResults?`<div class="squad-sim-badge">
        <span>Champion prob: <b>${((simResults.teams.find(t=>t.id===teamId)?.championProb||0)*100).toFixed(1)}%</b></span>
      </div>`:''}
    </div>
    ${['GK','DF','MF','FW'].map(pos=>`
      <div class="squad-pos-group">
        <div class="squad-pos-label">{{${({GK:'Goalkeepers',DF:'Defenders',MF:'Midfielders',FW:'Forwards'})[pos]}}}</div>
        <div class="squad-players-list">
          ${byPos[pos].map(p=>`<div class="squad-player-row ${p.star?'squad-star':''}" data-player-id="${p.id}" style="cursor:pointer">
            <canvas class="player-portrait-canvas" data-player="${p.id||p.name.toLowerCase().replace(/[^a-z]/g,'').slice(0,8)}"
              data-player-name="${p.name}" data-player-country="${teamId}" data-player-club="${p.club}"
              data-size="38" width="38" height="38" style="width:38px;height:38px;border-radius:50%;flex-shrink:0"></canvas>
            <div class="squad-player-info">
              <span class="squad-player-name">${p.star?'⭐ ':''}<b>${p.name}</b></span>
              <span class="squad-player-meta">${p.club} · ${p.age} yrs · ${p.caps} caps${p.goals>0?` · ${p.goals} goals`:''}</span>
            </div>
            <div class="squad-player-pos pos-badge pos-${p.pos}">${p.pos}</div>
          </div>`).join('')}
        </div>
      </div>
    `).join('')}
  `.replace(/\{\{(.*?)\}\}/g, '$1');
  setTimeout(()=>window._schedulePortraits?.(), 80);
  // Click on player → show modal
  container.querySelectorAll('.squad-player-row').forEach(row=>row.addEventListener('click',()=>{
    const pid=row.dataset.playerId;
    const p=squad.players.find(pl=>pl.id===pid);
    if(p) showPlayerModal(p, teamId);
  }));
}

function showPlayerModal(player, teamId){
  const team=teamById(teamId);
  const sim=window._latestSimResults;
  const simPlayer=window._latestPlayers?.scorers?.find(s=>s.id===player.id||s.name===player.name);
  const assist=window._latestPlayers?.assisters?.find(a=>a.name===player.name);
  let modal=document.querySelector('#playerModal');
  if(!modal){ modal=document.createElement('div'); modal.id='playerModal'; modal.className='player-modal-overlay'; document.body.appendChild(modal); }
  modal.innerHTML=`
    <div class="player-modal" onclick="event.stopPropagation()">
      <button type="button" class="player-modal-close" id="closePlayerModal" aria-label="Cerrar perfil del jugador">✕</button>
      <div class="player-modal-top">
        <canvas class="player-portrait-canvas" data-player="${player.id||''}" data-player-name="${player.name}"
          data-player-country="${teamId}" data-player-club="${player.club}" data-size="80" width="80" height="80"
          style="width:80px;height:80px;border-radius:50%;border:3px solid var(--line)"></canvas>
        <div>
          <h2 class="player-modal-name">${player.star?'⭐ ':''}${player.name}</h2>
          <p>${team?.flag} ${team?.name} · ${player.pos} · ${player.age} ${document.documentElement.lang==='es'?'años':document.documentElement.lang==='fr'?'ans':'yrs'}</p>
          <p class="player-modal-club">${player.club}</p>
        </div>
      </div>
      <div class="player-modal-stats">
        <div class="pms"><span>${player.caps}</span><small>Caps</small></div>
        <div class="pms"><span>${player.goals}</span><small>Int'l goals</small></div>
        <div class="pms"><span>${player.age}</span><small>Age</small></div>
        ${simPlayer?`
          <div class="pms green"><span>${simPlayer.expectedGoals?.toFixed(1)||'—'}</span><small>xGoals (sim)</small></div>
          <div class="pms green"><span>${simPlayer.goldenBootProb?((simPlayer.goldenBootProb)*100).toFixed(1)+'%':'—'}</span><small>Boot prob</small></div>
        `:''}
        ${assist?`<div class="pms"><span>${assist.expectedAssists?.toFixed(1)||'—'}</span><small>xAssists (sim)</small></div>`:''}
      </div>
      ${!sim?'<p style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:10px">Run simulation to see player projections.</p>':''}
    </div>`;
  modal.style.display='flex';
  modal.addEventListener('click',()=>modal.style.display='none');
  document.querySelector('#closePlayerModal')?.addEventListener('click',()=>modal.style.display='none');
  setTimeout(()=>window._schedulePortraits?.(), 50);
}
window._latestPlayers = null; // will be set after sim

// ── Live Fixtures view ───────────────────────────────────────────────────────
async function initLiveFixtures(){
  const container=document.querySelector('#liveFixturesContent');
  if(!container) return;
  container.innerHTML=`<div class="live-loading">${document.documentElement.lang==='es'?'Cargando calendario en vivo...':document.documentElement.lang==='fr'?'Chargement du calendrier...':'Loading fixtures from openfootball...'}</div>`;
  const matches=await fetchLiveFixtures();
  if(!matches){ container.innerHTML='<div class="live-error">Could not load live fixtures. Check your internet connection.</div>'; return; }
  renderFixtures(matches, container);
  // Auto-refresh every 3 minutes for live matches
  setInterval(async()=>{
    const refreshed=await fetchLiveFixtures();
    if(refreshed) renderFixtures(refreshed, document.querySelector('#liveFixturesContent'));
  }, 180000);
}

function renderFixtures(matches, container){
  const live=getLive(matches), upcoming=getUpcoming(matches,12), recent=getRecent(matches,8);
  const now=new Date();
  container.innerHTML=`
    ${live.length?`<div class="live-section">
      <h3 class="live-section-title"><span class="live-dot"></span> LIVE NOW</h3>
      <div class="fixtures-grid">${live.map(m=>fixtureCard(m,'live')).join('')}</div>
    </div>`:''}
    <div class="live-section">
      <h3 class="live-section-title">Upcoming Matches</h3>
      <div class="fixtures-grid">${upcoming.map(m=>fixtureCard(m,'upcoming')).join('')}</div>
      ${!upcoming.length?'<div class="live-empty">No upcoming matches found.</div>':''}
    </div>
    <div class="live-section">
      <h3 class="live-section-title">Recent Results</h3>
      <div class="fixtures-grid">${recent.map(m=>fixtureCard(m,'finished')).join('')}</div>
      ${!recent.length?'<div class="live-empty">No recent results yet.</div>':''}
    </div>
    <div class="live-credit">Data: <a href="https://github.com/openfootball/worldcup.json" target="_blank">openfootball/worldcup.json</a> — open source, no API key</div>
  `;
  // Team filter
  document.querySelector('#liveTeamFilter')?.addEventListener('input', e=>{
    const q=e.target.value.toLowerCase();
    container.querySelectorAll('.fixture-card').forEach(card=>{
      const teams=(card.dataset.teams||'').toLowerCase();
      card.style.display=teams.includes(q)?'':'none';
    });
  });
}

function fixtureCard(m, status){
  const a=teamById(m.teamA), b=teamById(m.teamB);
  const dateStr=m.utcTime?m.utcTime.toLocaleDateString('en-US',{month:'short',day:'numeric'}):(m.date||'TBD');
  const timeStr=m.utcTime?m.utcTime.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}):'';
  const isFinished=status==='finished', isLive=status==='live';
  return `<div class="fixture-card ${isLive?'fixture-live':''}" data-teams="${(a?.name||m.teamA)+' '+(b?.name||m.teamB)}">
    <div class="fixture-meta">
      ${isLive?'<span class="live-badge">LIVE</span>':''}
      <span>${m.round||''}</span>
      <span>${m.group||''}</span>
      <span class="fixture-date">${dateStr} ${timeStr}</span>
    </div>
    <div class="fixture-teams">
      <div class="fixture-team ${isFinished&&m.scoreA>m.scoreB?'fixture-winner':''}">
        <span class="fixture-flag">${a?.flag||m.teamA}</span>
        <span class="fixture-name">${a?.name||m.teamA}</span>
        ${isFinished||isLive?`<b class="fixture-score">${m.scoreA}</b>`:''}
      </div>
      <div class="fixture-sep">${isFinished||isLive?'':'vs'}</div>
      <div class="fixture-team ${isFinished&&m.scoreB>m.scoreA?'fixture-winner':''}">
        ${isFinished||isLive?`<b class="fixture-score">${m.scoreB}</b>`:''}
        <span class="fixture-name ta-r">${b?.name||m.teamB}</span>
        <span class="fixture-flag">${b?.flag||m.teamB}</span>
      </div>
    </div>
    ${m.goals1?.length||m.goals2?.length?`<div class="fixture-goals">
      <span>${m.goals1.map(g=>`${g.name} ${g.minute}'`).join(' · ')}</span>
      <span>${m.goals2.map(g=>`${g.name} ${g.minute}'`).join(' · ')}</span>
    </div>`:''}
    ${m.stadium?`<div class="fixture-stadium">📍 ${m.stadium}</div>`:''}
  </div>`;
}

// ── INNOVATIVE FEATURE: AI Match Commentary Generator ────────────────────────
function initCommentary(){
  const btn=document.querySelector('#genCommentary');
  if(!btn) return;
  btn.addEventListener('click',async()=>{
    const res=window._latestSimResults;
    if(!res){ showToast(t('no_sim_yet')); return; }
    const fin=res.lastTournament?.knockout?.final?.matches?.[0];
    if(!fin){ showToast(t('no_final')); return; }
    const ta=teamById(fin.teamA), tb=teamById(fin.teamB), winner=teamById(fin.winner);
    const box=document.querySelector('#commentaryBox');
    btn.disabled=true; btn.textContent=t('generating');
    box.textContent='';
    // Use Claude API for live commentary
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:600,
          messages:[{role:'user',content:`You are an iconic football commentator like Martin Tyler or Peter Drury. Write a dramatic, poetic 3-paragraph match commentary in ${document.documentElement.lang==='es'?'Spanish':document.documentElement.lang==='fr'?'French':'English'} for this simulated World Cup 2026 Final:
${ta?.flag} ${ta?.name} ${fin.goalsA} – ${fin.goalsB} ${tb?.name} ${tb?.flag}
Winner: ${winner?.name}. Goals: ${(fin.events||[]).map(e=>`${e.minute}' ${e.scorer}`).join(', ')||'(scoreline determined by Monte Carlo simulation)'}.
Style: Peter Drury dramatic, poetic, with metaphors. Keep it under 250 words. No markdown.`}]
        })
      });
      const data=await resp.json();
      const text=data.content?.[0]?.text||t('commentary_unavailable');
      box.textContent=text;
    } catch(e){ box.textContent=t('commentary_failed'); }
    btn.disabled=false; btn.textContent=t('generate_commentary');
  });
}

window.addEventListener('DOMContentLoaded',async()=>{
  const dataReport = await loadTeamDataOverrides();
  initFilters(); renderGroups(); seedInitialDashboard(); setRunning(false); renderModelAudit(dataReport);
  initTheme(); initSound(); initSettings(); initThreeStage(); bindMatchFilters();
  initGames(); initSquadView(); initLiveFixtures(); initCommentary(); initArcadeMatch();
  document.addEventListener('wc26:arcade-goal',()=>goal());

  document.querySelectorAll('[data-view]').forEach(el=>{
    el.addEventListener('click',e=>{ e.preventDefault(); navigate(el.dataset.view); tick(); });
  });
  document.querySelector('#runSimulation').addEventListener('click',run);
  document.querySelector('#runSimulationTop').addEventListener('click',run);
  document.querySelector('#cancelSimulation').addEventListener('click',cancelMonteCarlo);
  document.querySelector('#resetSimulation').addEventListener('click',()=>{
    latestResults=null; latestPlayers=null; latestBetting=null;
    window._latestBetting=null; window._latestSimResults=null; window._latestPlayers=null;
    resetProgress(); renderEmptyDashboard(); setRunning(false); tick();
  });
  const ej=()=>exportJSON({results:latestResults,players:latestPlayers,betting:latestBetting});
  const ec=()=>exportCSV(latestResults,latestBetting,latestPlayers);
  document.querySelector('#exportJson')?.addEventListener('click',ej);
  document.querySelector('#exportCsv')?.addEventListener('click',ec);
  document.querySelector('#exportJsonSettings')?.addEventListener('click',ej);
  document.querySelector('#exportCsvSettings')?.addEventListener('click',ec);
  document.querySelector('#groupFilter')?.addEventListener('change',()=>{ renderGroups(); latestResults&&renderTeamTable(latestResults); });
  document.querySelector('#teamSearch')?.addEventListener('input',()=>{ renderGroups(); latestResults&&renderTeamTable(latestResults); });
  // Squad team select also updates the live filters on the fixtures page
  document.querySelector('#liveTeamFilter')?.addEventListener('input',()=>{});
});
