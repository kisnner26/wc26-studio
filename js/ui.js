import { pct, round } from './math-utils.js';
import { GROUPS } from './data-fixtures.js';
import { teamById } from './data-teams.js';
import { renderHorizontalBars, renderValueChart } from './charts.js';
import { buildBettingReport } from './betting-engine.js';

let currentSort={key:'championProb',dir:'desc'}; let lastResults=null;

// ─── i18n ──────────────────────────────────────────────────────────────────
const TXT = {
  en:{
    home:'Home',groups:'Groups',simulator:'Simulator',matches:'All matches',
    bracket:'Bracket',players:'Players',betting:'Betting report',settings:'Settings',
    edition:'USA · MEX · CAN 2026',simulating:'Simulating...',
    title_home:'WC26 Simulation Studio',title_groups:'Groups',
    title_simulator:'Simulation Control Room',title_matches:'All Matches',
    title_bracket:'Bracket Map',title_players:'Player Awards',
    title_betting:'Betting Decision Room',title_settings:'Settings',title_games:'Games Hub',
    run:'Run Simulation',cancel:'Cancel',reset:'Reset',
    champion:'Champion',surprise:'Surprise pick',golden_boot:'Golden Boot',
    mvp:'Player of tournament',upset_rate:'Upset rate',best_bet:'Best bet',
    no_sim_yet:'Run a simulation first',simulations:'Simulations',
    completed:'Completed',ready:'Ready to simulate',
    group_stage:'Group Stage',r32:'Round of 32',r16:'Round of 16',
    quarter:'Quarterfinals',semi:'Semifinals',bronze:'Bronze Final',final:'Final',
    winner:'Winner',draw:'Draw',penalties:'Penalties',no_goals:'No goals',
    all_groups:'All groups',all_phases:'All phases',search:'Search team / player',
    filter_date:'All dates',compact:'Compact view',expanded:'Expanded view',teams:'Teams & Squads',live:'Live fixtures',games:'Games',commentary:'AI Commentary',top_kicker:'WORLD CUP 2026 · MONTE CARLO LAB',sound_off:'Sound off',sound_on:'Sound on',dark:'Dark',light:'Light',match_center:'Match center',three_live:'Three.js live',champ_prob:'Champion probability',distribution:'distribution',model_market:'Model vs market',ev_edge:'EV edge',speed:'Speed',smooth:'Smooth',balanced:'Balanced',fast:'Fast',team_probs:'Team probabilities',whistle:'▶ Whistle',running:'Running…',idle:'Idle',completed_after:'Completed',cancelled_after:'Cancelled after',no_match:'No match',group:'Group',games_hub:'Games Hub',your_prediction:'Your Prediction',penalty_shootout:'Penalty Shootout',rate_player:'Rate the Player',kit_detective:'Kit Detective',trivia:'Trivia',score_predictor:'Score Predictor',ai_match_commentary:'AI Match Commentary',commentary_powered:'Powered by Claude · Peter Drury style',generate_commentary:'Generate commentary for the Final',generating:'Generating...',commentary_unavailable:'Commentary unavailable.',commentary_failed:'Commentary generation failed. Check connection.',no_final:'No final match data',title_games:'Games Hub',photo:'Photo',player:'Player',country:'Country',pos:'Pos',mins:'Mins',boot_prob:'Boot %',top_assist_prob:'Top assist %',role:'Role',mvp_prob:'MVP prob',exp_goals:'Exp. goals',exp_assists:'Exp. assists',best_player:'Best player',second_best:'Second best',third_best:'Third best',next_in_line:'Next in line',title_probability:'title probability',advance:'advance',knockout_volatility:'Knockout volatility',runtime:'Runtime',complete_status:'Complete',cancelled_status:'Cancelled',no_matches_filter:'No matches for these filters.',no_data_yet:'No data yet.',assist_abbr:'ast.',team:'Team',playable_edges:'Playable edges',total_stake:'Total stake',expected_profit:'Expected profit',expected_roi:'Expected ROI',model_confidence:'Model confidence',decimal:'decimal',expected_return:'expected return',no_playable_edges:'No playable edges in this run',market:'Market',selection:'Selection',odds:'Odds',implied:'Implied',model:'Model',edge:'Edge',verdict:'Verdict',kelly:'Kelly %',tbd:'TBD',forecast:'forecast',full_odds_board:'Full odds board',all_markets:'all markets',click_player_stats:'Click any player to see stats',golden_boot_title:'Golden Boot',top_assists_title:'Top assists',disappointment_title:'Disappointment Player',disappointment_sub:'random simulation storyline',disappointment_why:'Why it happened',disappointment_stats:'Simulation line',disappointment_note:'Generated from this run, not hardcoded.',reset_game_scores:'Reset game scores',best_penalty:'Best penalty',best_trivia:'Best trivia',best_rating:'Best rating',kit_score:'Kit',appearance:'Appearance',audio:'Audio',language:'Language',after_simulation:'After simulation',match_display:'Match display',export_data:'Export data',test_goal_sound:'Test goal sound',whistles_on:'Whistles on',bankroll:'Bankroll',stake_of_bankroll:'of bankroll',educational_only:'Educational use only.',bet_disclaimer:'Kelly criterion stakes are theoretical estimates from this Monte Carlo model. Past simulations do not guarantee real results. Never stake more than you can afford to lose. Edges below 2% EV are excluded and odds can move.',bet_empty_desc:'Loaded odds are efficient against model probabilities. Run more simulations for higher confidence, or wait for lineup news to create market inefficiencies.',kelly_fractional:'Fractional Kelly (25%)',max_exposure:'Max 30% bankroll exposure',min_ev:'Min 2% EV threshold',mc_sims:'Monte Carlo simulations',recommend_strong:'Strong Value',recommend_good:'Good Value',recommend_marginal:'Marginal',recommend_thin:'Thin Edge',recommend_no:'No Bet',tier_a:'Tier A — High Conviction',tier_b:'Tier B — Solid Edge',tier_c:'Tier C — Speculative',tier_x:'No Play',edge_label:'edge',winner_market:'Winner',golden_boot_market:'Golden Boot',select_team:'— Select a team —',live_upcoming:'Live & Upcoming',filter_team:'Filter by team...',
  },
  es:{
    home:'Inicio',groups:'Grupos',simulator:'Simulador',matches:'Partidos',
    bracket:'Llave',players:'Jugadores',betting:'Apuestas',settings:'Ajustes',
    edition:'EE.UU. · MEX · CAN 2026',simulating:'Simulando...',
    title_home:'Estudio WC26',title_groups:'Grupos',
    title_simulator:'Sala de Control',title_matches:'Todos los partidos',
    title_bracket:'Llave del torneo',title_players:'Premios individuales',
    title_betting:'Sala de apuestas',title_settings:'Ajustes',
    run:'Ejecutar simulación',cancel:'Cancelar',reset:'Reiniciar',
    champion:'Campeón',surprise:'Sorpresa',golden_boot:'Bota de oro',
    mvp:'Jugador del torneo',upset_rate:'Sorpresas',best_bet:'Mejor apuesta',
    no_sim_yet:'Ejecuta una simulación',simulations:'Simulaciones',
    completed:'Completado',ready:'Listo',
    group_stage:'Fase de grupos',r32:'Ronda de 32',r16:'Octavos',
    quarter:'Cuartos',semi:'Semifinales',bronze:'3er lugar',final:'Final',
    winner:'Ganador',draw:'Empate',penalties:'Penales',no_goals:'Sin goles',
    all_groups:'Todos los grupos',all_phases:'Todas las fases',search:'Buscar equipo / jugador',
    filter_date:'Todas las fechas',compact:'Vista compacta',expanded:'Vista expandida',teams:'Equipos y convocatorias',live:'Calendario en vivo',games:'Juegos',commentary:'Narración IA',top_kicker:'MUNDIAL 2026 · LAB MONTE CARLO',sound_off:'Sonido apagado',sound_on:'Sonido activado',dark:'Oscuro',light:'Claro',match_center:'Centro de partidos',three_live:'Three.js en vivo',champ_prob:'Probabilidad de campeón',distribution:'distribución',model_market:'Modelo vs mercado',ev_edge:'ventaja EV',speed:'Velocidad',smooth:'Suave',balanced:'Balanceado',fast:'Rápido',team_probs:'Probabilidades por selección',whistle:'▶ Silbato',running:'Ejecutando…',idle:'Inactivo',completed_after:'Completado',cancelled_after:'Cancelado tras',no_match:'Sin resultados',group:'Grupo',games_hub:'Centro de juegos',your_prediction:'Tu predicción',penalty_shootout:'Penales',rate_player:'Calificar jugador',kit_detective:'Detective de camisetas',trivia:'Trivia',score_predictor:'Predictor de marcador',ai_match_commentary:'Narración IA del partido',commentary_powered:'Claude · estilo Peter Drury',generate_commentary:'Generar narración de la final',generating:'Generando...',commentary_unavailable:'Narración no disponible.',commentary_failed:'Falló la generación. Revisa la conexión.',no_final:'No hay datos de la final',title_games:'Centro de juegos',photo:'Foto',player:'Jugador',country:'País',pos:'Pos',mins:'Min',boot_prob:'Bota %',top_assist_prob:'Asist. %',role:'Rol',mvp_prob:'Prob. MVP',exp_goals:'Goles esp.',exp_assists:'Asist. esp.',best_player:'Mejor jugador',second_best:'Segundo mejor',third_best:'Tercer mejor',next_in_line:'Siguientes',title_probability:'probabilidad de título',advance:'avanzar',knockout_volatility:'Volatilidad eliminatoria',runtime:'Tiempo',complete_status:'Completo',cancelled_status:'Cancelado',no_matches_filter:'No hay partidos para estos filtros.',no_data_yet:'Sin datos todavía.',assist_abbr:'asis.',team:'Equipo',playable_edges:'Ventajas jugables',total_stake:'Apuesta total',expected_profit:'Ganancia esperada',expected_roi:'ROI esperado',model_confidence:'Confianza del modelo',decimal:'decimal',expected_return:'retorno esperado',no_playable_edges:'No hay ventajas jugables en esta corrida',market:'Mercado',selection:'Selección',odds:'Cuota',implied:'Implícita',model:'Modelo',edge:'Ventaja',verdict:'Veredicto',kelly:'Kelly %',tbd:'Por definir',forecast:'pronóstico',full_odds_board:'Tablero completo de cuotas',all_markets:'todos los mercados',click_player_stats:'Haz clic en un jugador para ver estadísticas',golden_boot_title:'Bota de oro',top_assists_title:'Máximos asistentes',disappointment_title:'Jugador decepción',disappointment_sub:'historia aleatoria de la simulación',disappointment_why:'Por qué ocurrió',disappointment_stats:'Actuación simulada',disappointment_note:'Generado en esta corrida, no hardcodeado.',reset_game_scores:'Reiniciar puntajes de juegos',best_penalty:'Mejor penales',best_trivia:'Mejor trivia',best_rating:'Mejor calificación',kit_score:'Camisetas',appearance:'Apariencia',audio:'Audio',language:'Idioma',after_simulation:'Después de simular',match_display:'Vista de partidos',export_data:'Exportar datos',test_goal_sound:'Probar sonido de gol',whistles_on:'Silbatos activos',bankroll:'Banca',stake_of_bankroll:'de la banca',educational_only:'Solo uso educativo.',bet_disclaimer:'Las apuestas por criterio Kelly son estimaciones teóricas del modelo Monte Carlo. Las simulaciones pasadas no garantizan resultados reales. Nunca apuestes más de lo que puedas perder. Las ventajas menores al 2% EV se excluyen y las cuotas pueden moverse.',bet_empty_desc:'Las cuotas cargadas están eficientes frente a las probabilidades del modelo. Ejecuta más simulaciones para mayor confianza o espera noticias de alineaciones para encontrar ineficiencias.',kelly_fractional:'Kelly fraccional (25%)',max_exposure:'Máx. 30% de exposición de banca',min_ev:'Umbral mínimo 2% EV',mc_sims:'simulaciones Monte Carlo',recommend_strong:'Valor fuerte',recommend_good:'Buen valor',recommend_marginal:'Marginal',recommend_thin:'Ventaja fina',recommend_no:'No apostar',tier_a:'Nivel A — Alta convicción',tier_b:'Nivel B — Ventaja sólida',tier_c:'Nivel C — Especulativa',tier_x:'No jugar',edge_label:'ventaja',winner_market:'Ganador',golden_boot_market:'Bota de oro',select_team:'— Selecciona una selección —',live_upcoming:'En vivo y próximos',filter_team:'Filtrar por equipo...',
  },
  fr:{
    home:'Accueil',groups:'Groupes',simulator:'Simulateur',matches:'Matchs',
    bracket:'Tableau',players:'Joueurs',betting:'Paris',settings:'Réglages',
    edition:'USA · MEX · CAN 2026',simulating:'Simulation...',
    title_home:'Studio WC26',title_groups:'Groupes',
    title_simulator:'Salle de contrôle',title_matches:'Tous les matchs',
    title_bracket:'Tableau final',title_players:'Trophées joueurs',
    title_betting:'Salle de paris',title_settings:'Réglages',
    run:'Lancer',cancel:'Annuler',reset:'Réinitialiser',
    champion:'Champion',surprise:'Surprise',golden_boot:"Soulier d'or",
    mvp:'Joueur du tournoi',upset_rate:'Surprises',best_bet:'Meilleur pari',
    no_sim_yet:'Lancez une simulation',simulations:'Simulations',
    completed:'Terminé',ready:'Prêt',
    group_stage:'Phase de groupes',r32:'Tour de 32',r16:'Huitièmes',
    quarter:'Quarts',semi:'Demi-finales',bronze:'3e place',final:'Finale',
    winner:'Gagnant',draw:'Nul',penalties:'Tirs au but',no_goals:'Aucun but',
    all_groups:'Tous les groupes',all_phases:'Toutes les phases',search:'Chercher',
    filter_date:'Toutes les dates',compact:'Vue compacte',expanded:'Vue développée',teams:'Équipes et listes',live:'Calendrier en direct',games:'Jeux',commentary:'Commentaire IA',top_kicker:'COUPE DU MONDE 2026 · LAB MONTE CARLO',sound_off:'Son désactivé',sound_on:'Son activé',dark:'Sombre',light:'Clair',match_center:'Centre des matchs',three_live:'Three.js en direct',champ_prob:'Probabilité de champion',distribution:'distribution',model_market:'Modèle vs marché',ev_edge:'avantage EV',speed:'Vitesse',smooth:'Fluide',balanced:'Équilibré',fast:'Rapide',team_probs:'Probabilités par équipe',whistle:'▶ Sifflet',running:'Exécution…',idle:'Inactif',completed_after:'Terminé',cancelled_after:'Annulé après',no_match:'Aucun résultat',group:'Groupe',games_hub:'Centre de jeux',your_prediction:'Votre prédiction',penalty_shootout:'Tirs au but',rate_player:'Noter le joueur',kit_detective:'Détective de maillots',trivia:'Quiz',score_predictor:'Prédicteur de score',ai_match_commentary:'Commentaire IA du match',commentary_powered:'Claude · style Peter Drury',generate_commentary:'Générer le commentaire de la finale',generating:'Génération...',commentary_unavailable:'Commentaire indisponible.',commentary_failed:'Échec de la génération. Vérifiez la connexion.',no_final:'Aucune donnée de finale',title_games:'Centre de jeux',photo:'Photo',player:'Joueur',country:'Pays',pos:'Poste',mins:'Min',boot_prob:'Soulier %',top_assist_prob:'Passe %',role:'Rôle',mvp_prob:'Prob. MVP',exp_goals:'Buts exp.',exp_assists:'Passes exp.',best_player:'Meilleur joueur',second_best:'Deuxième',third_best:'Troisième',next_in_line:'Ensuite',title_probability:'probabilité de titre',advance:'qualification',knockout_volatility:'Volatilité éliminatoire',runtime:'Durée',complete_status:'Terminé',cancelled_status:'Annulé',no_matches_filter:'Aucun match avec ces filtres.',no_data_yet:'Pas encore de données.',assist_abbr:'p.d.',team:'Équipe',playable_edges:'Avantages jouables',total_stake:'Mise totale',expected_profit:'Gain attendu',expected_roi:'ROI attendu',model_confidence:'Confiance du modèle',decimal:'décimal',expected_return:'retour attendu',no_playable_edges:'Aucun avantage jouable dans cette simulation',market:'Marché',selection:'Sélection',odds:'Cote',implied:'Implicite',model:'Modèle',edge:'Avantage',verdict:'Verdict',kelly:'Kelly %',tbd:'À définir',forecast:'prévision',full_odds_board:'Tableau complet des cotes',all_markets:'tous les marchés',click_player_stats:'Cliquez sur un joueur pour voir les statistiques',golden_boot_title:'Soulier d’or',top_assists_title:'Meilleurs passeurs',disappointment_title:'Joueur déception',disappointment_sub:'scénario aléatoire de la simulation',disappointment_why:'Pourquoi',disappointment_stats:'Bilan simulé',disappointment_note:'Généré dans cette simulation, non codé en dur.',reset_game_scores:'Réinitialiser les scores',best_penalty:'Meilleur tirs au but',best_trivia:'Meilleur quiz',best_rating:'Meilleure note',kit_score:'Maillots',appearance:'Apparence',audio:'Audio',language:'Langue',after_simulation:'Après simulation',match_display:'Affichage des matchs',export_data:'Exporter les données',test_goal_sound:'Tester le son de but',whistles_on:'Sifflets activés',bankroll:'Capital',stake_of_bankroll:'du capital',educational_only:'Usage éducatif seulement.',bet_disclaimer:'Les mises Kelly sont des estimations théoriques issues du modèle Monte Carlo. Les simulations passées ne garantissent pas les résultats réels. Ne misez jamais plus que ce que vous pouvez perdre. Les avantages sous 2 % EV sont exclus et les cotes peuvent bouger.',bet_empty_desc:'Les cotes chargées sont efficaces face aux probabilités du modèle. Lancez plus de simulations pour plus de confiance ou attendez les infos de composition pour trouver des inefficacités.',kelly_fractional:'Kelly fractionné (25%)',max_exposure:'Exposition max 30 % du capital',min_ev:'Seuil minimum 2 % EV',mc_sims:'simulations Monte Carlo',recommend_strong:'Très forte valeur',recommend_good:'Bonne valeur',recommend_marginal:'Marginal',recommend_thin:'Petit avantage',recommend_no:'Pas de pari',tier_a:'Niveau A — Forte conviction',tier_b:'Niveau B — Avantage solide',tier_c:'Niveau C — Spéculatif',tier_x:'Pas de jeu',edge_label:'avantage',winner_market:'Vainqueur',golden_boot_market:'Soulier d’or',select_team:'— Sélectionnez une équipe —',live_upcoming:'En direct et à venir',filter_team:'Filtrer par équipe...',
  }
};

let currentLang = localStorage.getItem('wc26-lang') || 'es';
export function t(key){ return (TXT[currentLang]||TXT.en)[key] || (TXT.en[key]) || key; }
export function getLang(){ return currentLang; }
if(typeof window!=='undefined'){ window._wcT=t; window._wcLang=()=>currentLang; }

export function applyLanguage(lang='en'){
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
  localStorage.setItem('wc26-lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const val = (TXT[lang]||TXT.en)[el.dataset.i18n];
    if(val) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const val = (TXT[lang]||TXT.en)[el.dataset.i18nPh];
    if(val) el.placeholder = val;
  });
  const activeView = document.querySelector('.nav-item.active')?.dataset.view || 'home';
  const titleEl = document.querySelector('#viewTitle');
  if(titleEl) titleEl.textContent = (TXT[lang]||TXT.en)[`title_${activeView}`] || '';
  const squadOpt=document.querySelector('#squadTeamSelect option[value=""]'); if(squadOpt) squadOpt.textContent=t('select_team');
  const liveFilter=document.querySelector('#liveTeamFilter'); if(liveFilter) liveFilter.placeholder=t('filter_team');
  syncAllDynamicText(lang);
  if(typeof window!=='undefined' && window._renderActiveGame) window._renderActiveGame();
  if(typeof window!=='undefined' && window._renderModelAudit) window._renderModelAudit();
  if(lastResults && typeof window!=='undefined' && window._latestBetting) renderBetting(window._latestBetting,lastResults);
}


function syncAllDynamicText(lang){
  const d = TXT[lang]||TXT.en;
  document.querySelectorAll('[data-action="run"]').forEach(b=>{ if(!b.disabled) b.textContent = d.run||'Run Simulation'; });
  const cancelBtn=document.querySelector('#cancelSimulation'); if(cancelBtn&&cancelBtn.disabled!==false) cancelBtn.textContent=d.cancel||'Cancel';
}

export function navigate(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id===`view-${view}`));
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  const titleEl=document.querySelector('#viewTitle');
  if(titleEl) titleEl.textContent = (TXT[currentLang]||TXT.en)[`title_${view}`] || '';
  // En móvil la navegación es una barra horizontal: centramos la pestaña activa
  // y volvemos arriba para no quedar a mitad de la vista anterior.
  const activeTab=document.querySelector(`.dock-nav .nav-item[data-view="${view}"]`);
  const nav=document.querySelector('.dock-nav');
  if(activeTab && nav && nav.scrollWidth>nav.clientWidth+1){
    activeTab.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
  }
  if(window.matchMedia('(max-width:800px)').matches){
    window.scrollTo({top:0,behavior:'smooth'});
  }
  animateNewContent();
}

export function initFilters(){
  for(const id of ['groupFilter','matchGroupFilter']){
    const sel=document.querySelector(`#${id}`);
    if(sel && sel.options.length===1){
      for(const g of GROUPS){ const o=document.createElement('option'); o.value=g.group; o.textContent=`${t('group')} ${g.group}`; sel.appendChild(o); }
    }
  }
}

export function renderGroups(){
  const box=document.querySelector('#groupCards'); if(!box) return;
  const q=(document.querySelector('#teamSearch')?.value||'').toLowerCase();
  const gf=document.querySelector('#groupFilter')?.value||'all';
  box.innerHTML=GROUPS.filter(g=>gf==='all'||g.group===gf).map(g=>`
    <article class="group-card">
      <h3>${t('group').toUpperCase()} ${g.group}</h3>
      ${g.teams.map(id=>teamById(id)).filter(t=>!q||t.name.toLowerCase().includes(q)||t.id.toLowerCase().includes(q)).map((t,i)=>`
        <div class="group-team">
          <span class="group-pos">${i+1}</span>
          <span class="flag-lg">${t.flag||'⚽'}</span>
          <div class="group-team-info">
            <strong>${t.name}</strong>
            <small>Elo ${t.elo} · FIFA #${t.fifaRank}</small>
          </div>
        </div>
      `).join('')||`<div class="muted">${t('no_match')}</div>`}
    </article>
  `).join('');
}

export function updateProgress({completed,total,progress,elapsed,eta}){
  document.querySelector('#progressBar').style.width=`${progress*100}%`;
  document.querySelector('#progressPct').textContent=pct(progress,1);
  document.querySelector('#progressLabel').textContent=`${completed.toLocaleString()} / ${total.toLocaleString()} ${t('simulations')}`;
  document.querySelector('#runtimeLabel').textContent=`${(elapsed/1000).toFixed(1)}s elapsed · ETA ${(eta/1000).toFixed(1)}s`;
  document.querySelector('.dock-status')?.classList.add('running');
  document.querySelector('#miniStatus').textContent=t('running');
  // Update overlay bar + percent text
  const pctText = document.querySelector('#pencilText');
  if(pctText) pctText.textContent = pct(progress,0);
  const ldBar = document.querySelector('#ldBarFill');
  if(ldBar) ldBar.style.width = `${progress*100}%`;
  // Animate dots based on progress
  const segs = document.querySelectorAll('.ld-seg');
  const activeCount = Math.round(progress * segs.length);
  segs.forEach((s,i) => {
    if(i < activeCount){ s.classList.add('ld-seg-active'); s.style.animationDelay=`${i*0.18}s`; }
    else s.classList.remove('ld-seg-active');
  });
}

export function resetProgress(){
  document.querySelector('#progressBar').style.width='0%';
  document.querySelector('#progressPct').textContent='0%';
  document.querySelector('#progressLabel').textContent=t('ready');
  document.querySelector('#runtimeLabel').textContent = currentLang==='es' ? 'Ejecuta una simulación para desbloquear los 104 partidos, la llave y el reporte de apuestas.' : (currentLang==='fr' ? 'Lancez une simulation pour débloquer les 104 matchs, le tableau et le rapport de paris.' : 'Run simulation to unlock all 104 matches, bracket and betting report.');
  document.querySelector('.dock-status')?.classList.remove('running');
  document.querySelector('#miniStatus').textContent=t('idle');
  document.querySelector('#pencilText').textContent='0%';
}

function table(el, headers, rows){
  if(!el)return;
  const rowHtml=Array.isArray(rows)?rows.join(''):(rows||'');
  el.innerHTML=`<thead><tr>${headers.map(h=>`<th data-key="${h.key||''}" ${h.key?'style="cursor:pointer"':''}>${h.label}</th>`).join('')}</tr></thead><tbody>${rowHtml}</tbody>`;
}

function getSurprise(results){
  return results.teams
    .map(revelationMetrics)
    .filter(t=>t.elo<1960 && t.fifaRank>10)
    .sort((a,b)=>b.revelationIndex-a.revelationIndex)[0];
}

function revelationMetrics(team){
  const fifaStrength=Math.max(0,Math.min(1,(90-team.fifaRank)/89));
  const eloStrength=Math.max(0,Math.min(1,(team.elo-1450)/700));
  const baseline=fifaStrength*.42+eloStrength*.58;
  const expectedAdvance=.20+baseline*.68;
  const deepRun=team.championProb*5+team.finalProb*2.7+team.semiProb*1.45+team.quarterProb*.68;
  const breakthrough=deepRun*Math.pow(1-baseline,.72);
  const qualificationSurplus=Math.max(0,team.groupAdvanceProb-expectedAdvance)*.52;
  const goalSurplus=Math.max(0,(team.avgGF||0)-(team.avgGA||0))*.045;
  const index=Math.round(Math.max(0,Math.min(1,breakthrough+qualificationSurplus+goalSurplus))*100);
  const reason=team.semiProb>=.12?'amenaza real de semifinales':team.quarterProb>=.24?'alta opción de llegar a cuartos':'supera su expectativa de clasificación';
  return {...team,revelationIndex:index,revelationReason:reason,baselineExpectation:expectedAdvance};
}

// Player initials + image-safe fallback portraits — Safari friendly
// Uses an inline span fallback first; the remote photo hydrator may replace it later.
function initialsFromName(name='', id=''){
  const base=String(name||id||'?').replace(/[^\p{L}\s-]/gu,' ').trim();
  const parts=base.split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
}
function hashColor(str=''){
  let h=0; for(const ch of String(str)){ h=(h*31+ch.charCodeAt(0))>>>0; }
  const hue=25+(h%300); return `hsl(${hue} 42% 42%)`;
}
function playerPhoto(id, size=36, name=''){
  const safeName=String(name||id).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const initials=initialsFromName(name,id);
  const bg=hashColor(name||id);
  return `<span class="player-portrait-canvas player-photo-fallback" data-player="${id}" data-player-name="${safeName}" data-size="${size}"
    style="width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;border:2px solid rgba(128,100,60,.2);display:inline-flex;align-items:center;justify-content:center;background:${bg};color:#fff;font-weight:900;font-size:${Math.max(10,Math.floor(size*.34))}px;font-family:Arial,sans-serif;overflow:hidden"
    title="${safeName}">${initials}</span>`;
}

// After innerHTML updates, ask the image hydrator to replace fallbacks with real photos.
function schedulePortraitDraw(){
  requestAnimationFrame(()=>{
    if(window._hydratePlayerPhotos) window._hydratePlayerPhotos(document);
  });
}

function renderCards(results, betting, players){
  const box=document.querySelector('#summaryCards'), tpl=document.querySelector('#cardTemplate');
  if(!box||!tpl) return;
  box.innerHTML='';
  const bestTeam=results.teams[0]||{};
  const bestBet=betting.find(b=>b.expectedValue>0.02)||betting[0]||{};
  const scorer=players.scorers[0]||{};
  const mvp=players.mvp?.[0]||{};
  const surprise=getSurprise(results)||{};
  const cards=[
    [t('champion'), `${bestTeam.flag||''} ${bestTeam.name||'—'}`, `${pct(bestTeam.championProb||0)} ${t('title_probability')}`],
    [t('surprise'), `${surprise.flag||''} ${surprise.name||'—'}`, `Índice ${surprise.revelationIndex||0}/100 · ${pct(surprise.semiProb||0)} ${t('semi')}`],
    [t('best_bet'), bestBet.selection||'—', `EV ${round(bestBet.expectedValue||0,3)}`],
    [t('golden_boot'), scorer.name||'—', `${round(scorer.expectedGoals||0,2)} xG`],
    [t('mvp'), mvp.name||'—', `${pct(mvp.mvpProb||0)} MVP`],
    [t('upset_rate'), pct(results.upsetRate||0), t('knockout_volatility')]
  ];
  for(const [label,value,sub] of cards){
    const n=tpl.content.cloneNode(true);
    n.querySelector('.metric-label').textContent=label;
    n.querySelector('.metric-value').textContent=value;
    n.querySelector('.metric-sub').textContent=sub;
    box.appendChild(n);
  }
}

export function renderTeamTable(results){
  lastResults=results;
  const group=document.querySelector('#groupFilter')?.value||'all';
  const q=(document.querySelector('#teamSearch')?.value||'').toLowerCase();
  const surprise=getSurprise(results);
  const badge=document.querySelector('#surpriseBadge');
  if(badge) badge.innerHTML=`&#128081; ${t('surprise')}: ${surprise?.name||'—'} · ${surprise?.revelationIndex||0}/100`;
  let rows=results.teams.filter(t=>(group==='all'||t.group===group)&&(t.name.toLowerCase().includes(q)||t.id.toLowerCase().includes(q)));
  rows=rows.map(revelationMetrics);
  rows=[...rows].sort((a,b)=>currentSort.dir==='desc'?b[currentSort.key]-a[currentSort.key]:a[currentSort.key]-b[currentSort.key]);
  table(document.querySelector('#teamTable'),
    [{label:'#'},{label:t('team')},{label:t('group')},{label:'FIFA',key:'fifaRank'},{label:'Elo',key:'elo'},{label:'Rev.',key:'revelationIndex'},{label:t('champion'),key:'championProb'},{label:t('final'),key:'finalProb'},{label:t('semi'),key:'semiProb'},{label:t('quarter'),key:'quarterProb'},{label:t('advance'),key:'groupAdvanceProb'}],
    rows.map((t,i)=>`<tr class="${surprise?.id===t.id?'surprise-row':''}">
      <td>${i+1}</td>
      <td><strong>${surprise?.id===t.id?'&#128081; ':''}${t.flag||''} ${t.name}</strong></td>
      <td>${t.group}</td><td>${t.fifaRank}</td><td>${t.elo}</td><td title="${t.revelationReason}"><strong>${t.revelationIndex}</strong>/100</td>
      ${['championProb','finalProb','semiProb','quarterProb','groupAdvanceProb'].map(k=>`
        <td>${pct(t[k])}<div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100,t[k]*100)}%"></div></div></td>
      `).join('')}
    </tr>`)
  );
  document.querySelectorAll('#teamTable th[data-key]').forEach(th=>th.onclick=()=>{
    const key=th.dataset.key; if(!key)return;
    currentSort={key,dir:currentSort.key===key&&currentSort.dir==='desc'?'asc':'desc'};
    renderTeamTable(results);
  });
}

// ─── Player Awards ──────────────────────────────────────────────────────────
function renderPlayerTables(players){
  table(document.querySelector('#scorerTable'),
    [{label:'#'},{label:t('photo')},{label:t('player')},{label:t('country')},{label:t('pos')},{label:t('exp_goals')},{label:t('boot_prob')},{label:'PK'},{label:t('mins')}],
    players.scorers.slice(0,20).map((p,i)=>`<tr>
      <td>${i+1}</td>
      <td style="padding:4px 6px">${playerPhoto(p.id,36,p.name)}</td>
      <td><strong>${p.name}</strong></td>
      <td>${teamById(p.country)?.flag||''} ${p.country}</td>
      <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
      <td><strong>${round(p.expectedGoals,2)}</strong></td>
      <td>${pct(p.goldenBootProb)}</td>
      <td>${p.penaltyTaker?'<span class="tag-yes">PK</span>':'—'}</td>
      <td>${p.expectedMinutes}</td>
    </tr>`)
  );
  table(document.querySelector('#assistTable'),
    [{label:'#'},{label:t('photo')},{label:t('player')},{label:t('country')},{label:t('exp_assists')},{label:t('top_assist_prob')},{label:t('role')}],
    players.assisters.slice(0,20).map((p,i)=>`<tr>
      <td>${i+1}</td>
      <td style="padding:4px 6px">${playerPhoto(p.id,36,p.name)}</td>
      <td><strong>${p.name}</strong></td>
      <td>${teamById(p.country)?.flag||''} ${p.country}</td>
      <td><strong>${round(p.expectedAssists,2)}</strong></td>
      <td>${pct(p.topAssistProb)}</td>
      <td><span class="role-badge">${p.creativeRole}</span></td>
    </tr>`)
  );
  const podium=document.querySelector('#mvpPodium');
  if(podium && players.mvp?.length){
    const top3=players.mvp.slice(0,3);
    const medals=['&#127949;','&#127950;','&#127951;'];
    const placeNames=[t('best_player'),t('second_best'),t('third_best')];
    podium.innerHTML=`
      <div class="podium-header">
        <h2>${t('mvp')}</h2>
        <p class="podium-sub">Based on ${(lastResults?.simulations||0).toLocaleString()} ${t('simulations').toLowerCase()}</p>
      </div>
      <div class="podium-row">
        ${top3.map((p,i)=>{
          const team=teamById(p.country);
          return `<article class="podium-card place-${i+1} ${i===0?'podium-winner':''}">
            <div class="podium-photo-wrap">${playerPhoto(p.id, 64, p.name)}</div>
            <div class="podium-medal">${medals[i]}</div>
            <div class="podium-rank-label">${placeNames[i]}</div>
            <h3 class="podium-name">${p.name}</h3>
            <b class="podium-country">${team?.flag||''} ${team?.name||p.country}</b>
            <div class="podium-stats">
              <div class="podium-stat"><span class="podium-stat-val">${pct(p.mvpProb)}</span><span class="podium-stat-lbl">${t('mvp_prob')}</span></div>
              <div class="podium-stat"><span class="podium-stat-val">${round(p.expectedGoals,1)}</span><span class="podium-stat-lbl">${t('exp_goals')}</span></div>
              <div class="podium-stat"><span class="podium-stat-val">${round(p.expectedAssists,1)}</span><span class="podium-stat-lbl">${t('exp_assists')}</span></div>
            </div>
            <div class="podium-roles">
              <span class="role-badge">${p.creativeRole}</span>
              ${p.penaltyTaker?'<span class="tag-yes">PK</span>':''}
              ${p.freeKickTaker?'<span class="tag-yes">FK</span>':''}
            </div>
          </article>`;
        }).join('')}
      </div>
      <div class="mvp-rest">
        <h4>${t('next_in_line')}</h4>
        <div class="mvp-rest-grid">
          ${players.mvp.slice(3,8).map((p,i)=>{
            const team=teamById(p.country);
            return `<div class="mvp-rest-item">
              <span class="mvp-rest-pos">${i+4}</span>
              <span style="font-size:13px">${playerPhoto(p.id,36,p.name)}</span>
              <span class="flag-sm">${team?.flag||''}</span>
              <span class="mvp-rest-name">${p.name}</span>
              <span class="mvp-rest-pct">${pct(p.mvpProb)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }
  const dis=document.querySelector('#disappointmentCard');
  if(dis && players.disappointment){
    const p=players.disappointment;
    const team=teamById(p.country);
    const goalsLabel = currentLang==='fr' ? 'buts' : (currentLang==='es' ? 'goles' : 'goals');
    dis.innerHTML=`
      <article class="disappointment-card">
        <div class="disappointment-main">
          <div class="podium-photo-wrap">${playerPhoto(p.id,72,p.name)}</div>
          <div>
            <p class="disappointment-kicker">${t('disappointment_sub')}</p>
            <h3>${t('disappointment_title')}: ${p.name}</h3>
            <b>${team?.flag||''} ${team?.name||p.country}</b>
          </div>
        </div>
        <div class="disappointment-grid">
          <div><span>${t('disappointment_stats')}</span><strong>${p.simGoals} ${goalsLabel} · ${p.simAssists} ${t('assist_abbr')} · ${p.simRating}/10</strong></div>
          <div><span>${t('disappointment_why')}</span><strong>${p.reason}</strong></div>
        </div>
        <p class="disappointment-note">${t('disappointment_note')}</p>
      </article>`;
  }

}

// ─── Betting ─────────────────────────────────────────────────────────────────
function recClass(r){
  if(r.includes('Strong')) return 'strong';
  if(r.includes('Good')) return 'good';
  if(r.includes('Marginal')) return 'marginal';
  if(r.includes('Thin')) return 'thin';
  return 'avoid';
}

function confidenceBar(model, implied){
  const w=Math.min(100,model*100);
  const iw=Math.min(100,implied*100);
  return `<div class="prob-bar-wrap">
    <div class="prob-bar-track">
      <div class="prob-bar-implied" style="width:${iw}%"></div>
      <div class="prob-bar-model" style="width:${w}%"></div>
    </div>
    <div class="prob-bar-labels"><span>Implied ${pct(implied)}</span><span>Model ${pct(model)}</span></div>
  </div>`;
}


function translateRecommendation(label=''){
  const key={
    'Strong Value':'recommend_strong','Good Value':'recommend_good','Marginal':'recommend_marginal','Thin Edge':'recommend_thin','No Bet':'recommend_no'
  }[label] || 'recommend_no';
  return t(key);
}
function translateRiskLabel(label=''){
  if(String(label).includes('Tier A')) return t('tier_a');
  if(String(label).includes('Tier B')) return t('tier_b');
  if(String(label).includes('Tier C')) return t('tier_c');
  return t('tier_x');
}
function translateMarket(m=''){
  const x=String(m).toLowerCase();
  if(x==='winner') return t('winner_market');
  if(x==='golden_boot') return t('golden_boot_market');
  return m.replace(/_/g,' ');
}

function renderBetting(betting, results){
  const bankrollInput=document.querySelector('#bankrollInput');
  const bankroll=parseFloat(bankrollInput?.value||'1000')||1000;
  const report=buildBettingReport(betting,bankroll);
  const summary=document.querySelector('#bettingSummary');
  if(summary){
    const playCount=report.portfolio.length;
    const simConf=Math.min(100,Math.round((results?.simulations||0)/1000));
    summary.innerHTML=playCount>0?`
      <div class="bet-hero-grid">
        <div class="bet-hero-kpi"><span class="bh-val">${playCount}</span><span class="bh-lbl">${t('playable_edges')}</span></div>
        <div class="bet-hero-kpi"><span class="bh-val">$${report.totalStaked.toFixed(0)}</span><span class="bh-lbl">${t('total_stake')}</span></div>
        <div class="bet-hero-kpi green"><span class="bh-val">+$${report.totalExpectedReturn.toFixed(0)}</span><span class="bh-lbl">${t('expected_profit')}</span></div>
        <div class="bet-hero-kpi"><span class="bh-val">${((report.totalExpectedReturn/bankroll)*100).toFixed(1)}%</span><span class="bh-lbl">${t('expected_roi')}</span></div>
        <div class="bet-hero-kpi"><span class="bh-val">${simConf}%</span><span class="bh-lbl">${t('model_confidence')}</span></div>
      </div>
      <div class="bet-methodology">
        <span class="bet-method-tag">${t('kelly_fractional')}</span>
        <span class="bet-method-tag">${t('max_exposure')}</span>
        <span class="bet-method-tag">${t('min_ev')}</span>
        <span class="bet-method-tag">${(results?.simulations||0).toLocaleString()} ${t('mc_sims')}</span>
      </div>
      <div class="bet-portfolio-list">
        ${report.portfolio.map((b,i)=>`
          <div class="bet-card tier-${b.risk.tier.toLowerCase()}">
            <div class="bet-card-tier">${translateRiskLabel(b.risk.label)}</div>
            <div class="bet-card-top">
              <div class="bet-card-left">
                <div class="bet-card-num">${i+1}</div>
                <div>
                  <div class="bet-card-selection">${b.selection}</div>
                  <div class="bet-card-market">${translateMarket(b.market).toUpperCase()}</div>
                </div>
              </div>
              <div class="bet-card-odds">
                <span class="bet-odds-num">${b.odds.toFixed(2)}</span>
                <span class="bet-odds-lbl">${t('decimal')}</span>
              </div>
            </div>
            <div class="bet-card-probs">
              ${confidenceBar(b.modelProbability, b.impliedProbability)}
              <div class="bet-card-edge">
                <span class="edge-pill ${b.edge>0?'edge-pos':'edge-neg'}">${b.edge>0?'+':''}${pct(b.edge)} ${t('edge_label')}</span>
                <span class="ev-pill">EV ${round(b.expectedValue,3)}</span>
                <span class="ev-badge ev-${recClass(b.recommendation)}">${translateRecommendation(b.recommendation)}</span>
              </div>
            </div>
            <div class="bet-card-stake">
              <div class="bet-stake-box">
                <span class="bet-stake-amount">$${b.stakeAmount}</span>
                <span class="bet-stake-sub">${(b.scaledKelly*100).toFixed(1)}% ${t('stake_of_bankroll')}</span>
              </div>
              <div class="bet-return-box">
                <span class="bet-return-amount">+$${b.expectedReturn}</span>
                <span class="bet-stake-sub">${t('expected_return')}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="bet-disclaimer">
        <strong>${t('educational_only')}</strong> ${t('bet_disclaimer')}
      </div>
    `:`
      <div class="bet-empty">
        <div class="bet-empty-icon">📊</div>
        <h4>${t('no_playable_edges')}</h4>
        <p>${t('bet_empty_desc')}</p>
      </div>
    `;
  }
  table(document.querySelector('#bettingTable'),
    [{label:t('market')},{label:t('selection')},{label:t('odds')},{label:t('implied')},{label:t('model')},{label:t('edge')},{label:'EV'},{label:t('verdict')},{label:t('kelly')}],
    betting.map(b=>`<tr class="${b.expectedValue<=0?'opacity-50':''}">
      <td>${translateMarket(b.market)}</td>
      <td><strong>${b.selection}</strong></td>
      <td><strong>${b.odds.toFixed(2)}</strong></td>
      <td>${pct(b.impliedProbability)}</td>
      <td>${pct(b.modelProbability)}</td>
      <td class="${b.edge>0?'col-green':'col-red'}">${b.edge>0?'+':''}${pct(b.edge)}</td>
      <td class="${b.expectedValue>0?'col-green':''}">${round(b.expectedValue,3)}</td>
      <td><span class="tag ${recClass(b.recommendation)}">${translateRecommendation(b.recommendation)}</span></td>
      <td>${b.expectedValue>0?`${(b.kelly*100).toFixed(2)}%`:'—'}</td>
    </tr>`)
  );
}

// ─── Match card ───────────────────────────────────────────────────────────────
function roundLabel(phase){ const labels={group:t('group_stage'),r32:t('r32'),r16:t('r16'),quarter:t('quarter'),semi:t('semi'),thirdPlace:t('bronze'),final:t('final')}; return labels[phase||'group'] || phase || ''; }

function scoreCard(m){
  const a=teamById(m.teamA), b=teamById(m.teamB), w=m.winner;
  const meta=m.draw?`<span class="meta-draw">${t('draw')}</span>`:
    m.wentToPenalties?`<span class="meta-pk">${t('penalties')} ${m.penaltyScore||''} &rarr; ${teamById(m.penaltyWinner)?.name||m.penaltyWinner}</span>`:
    `<span class="meta-win">&#9654; ${teamById(w)?.name||w}</span>`;
  return `<article class="match-card" data-phase="${m.phase||'group'}">
    <div class="match-head">
      <span class="match-no-label">M${String(m.matchNo||0).padStart(3,'0')}</span>
      <span class="match-phase-label">${roundLabel(m.phase||'group')}${m.group?` · ${t('group')} ${m.group}`:''}</span>
      ${m.date?`<span class="match-date-label">${m.date}</span>`:''}
    </div>
    <div class="match-body">
      <div class="match-team ${w===m.teamA&&!m.draw?'winner':''}">
        <span class="team-flag">${a?.flag||''}</span>
        <span class="team-name">${a?.name||m.teamA}</span>
        <b class="team-score">${m.goalsA}</b>
      </div>
      <div class="match-vs">VS</div>
      <div class="match-team ${w===m.teamB&&!m.draw?'winner':''}" style="flex-direction:row-reverse">
        <span class="team-flag">${b?.flag||''}</span>
        <span class="team-name" style="text-align:right">${b?.name||m.teamB}</span>
        <b class="team-score">${m.goalsB}</b>
      </div>
    </div>
    <div class="match-footer">${meta}<span class="match-xg">xG ${round(m.xgA,2)}–${round(m.xgB,2)}</span></div>
    <div class="match-events">
      ${(m.events||[]).map(e=>`<div class="event-row">
        <b class="ev-min">${e.minute}'</b>
        <span class="ev-flag">${teamById(e.team)?.flag||''}</span>
        <span class="ev-scorer">${e.scorer}${e.penalty?' <em>(P)</em>':e.assist?` <em>${t('assist_abbr')} ${e.assist}</em>`:''}</span>
      </div>`).join('')||`<div class="event-row muted">${t('no_goals')}</div>`}
    </div>
  </article>`;
}

// ─── Bracket — clean tournament tree ─────────────────────────────────────────
function bmCard(m){
  if(!m) return `<div class="bm-card bm-tbd"><span>${t('tbd')}</span></div>`;
  const a=teamById(m.teamA), b=teamById(m.teamB), w=m.winner;
  const winA=w===m.teamA&&!m.draw, winB=w===m.teamB&&!m.draw;
  return `<div class="bm-card">
    <div class="bm-row ${winA?'bm-win':''}">
      <span class="bm-flag">${a?.flag||''}</span>
      <span class="bm-name">${a?.name||m.teamA}</span>
      <b class="bm-score">${m.goalsA}</b>
    </div>
    <div class="bm-row ${winB?'bm-win':''}">
      <span class="bm-flag">${b?.flag||''}</span>
      <span class="bm-name">${b?.name||m.teamB}</span>
      <b class="bm-score">${m.goalsB}</b>
    </div>
    ${m.wentToPenalties?`<div class="bm-pk-note">PK ${m.penaltyScore}</div>`:''}
  </div>`;
}

function col(label,matches,cls=''){
  return `<div class="bc-col ${cls}">
    <div class="bc-col-label">${label}</div>
    <div class="bc-col-matches">${matches.map(m=>bmCard(m)).join('')}</div>
  </div>`;
}

export function renderBracket(results){
  const box=document.querySelector('#bracketBoard'); if(!box) return;
  const k=results?.lastTournament?.knockout;
  if(!k){
    box.innerHTML=`<div class="bracket-empty">${t('no_sim_yet')}: ${currentLang==='es'?'ejecuta para generar la llave.':currentLang==='fr'?'lancez pour générer le tableau.':'run to generate the bracket.'}</div>`;
    return;
  }
  const L={r32:k.r32.matches.slice(0,8),r16:k.r16.matches.slice(0,4),quarter:k.quarter.matches.slice(0,2),semi:k.semi.matches.slice(0,1)};
  const R={semi:k.semi.matches.slice(1),quarter:k.quarter.matches.slice(2),r16:k.r16.matches.slice(4),r32:k.r32.matches.slice(8)};
  const fin=k.final.matches[0], bro=k.thirdPlace.matches[0];
  const champ=fin?teamById(fin.winner):null;
  box.innerHTML=`
    <div class="bracket-tree">
      ${col('R32',L.r32,'col-r32-l')}
      ${col('R16',L.r16,'col-r16-l')}
      ${col('QF',L.quarter,'col-qf-l')}
      ${col('SF',L.semi,'col-sf-l')}
      <div class="bc-col col-final">
        <div class="bc-col-label">${t('final').toUpperCase()}</div>
        <div class="trophy-box">
          <div class="trophy-icon">&#127942;</div>
          ${champ?`<div class="trophy-flag">${champ.flag}</div><div class="trophy-name">${champ.name}</div><div class="trophy-lbl">${t('champion')}</div>`:''}
        </div>
        <div class="bc-col-matches">${bmCard(fin)}</div>
        <div class="bronze-section">
          <div class="bc-col-label" style="margin-top:14px">${t('bronze').toUpperCase()}</div>
          <div class="bc-col-matches">${bmCard(bro)}</div>
        </div>
      </div>
      ${col('SF',R.semi,'col-sf-r')}
      ${col('QF',R.quarter,'col-qf-r')}
      ${col('R16',R.r16,'col-r16-r')}
      ${col('R32',R.r32,'col-r32-r')}
    </div>
  `;
}

// ─── Match Center ─────────────────────────────────────────────────────────────
export function renderMatchCenter(results){
  const box=document.querySelector('#matchCenter'); if(!box) return;
  const trn=results?.lastTournament;
  if(!trn){box.innerHTML=`<div class="no-data-msg">${t('no_sim_yet')}: ${currentLang==='es'?'ejecuta para generar los marcadores de los 104 partidos.':currentLang==='fr'?'lancez pour générer les scores des 104 matchs.':'run to generate all 104 match scorelines.'}</div>`;return;}
  const phase=document.querySelector('#matchPhaseFilter')?.value||'all';
  const gr=document.querySelector('#matchGroupFilter')?.value||'all';
  const q=(document.querySelector('#matchSearch')?.value||'').toLowerCase();
  const dateF=document.querySelector('#matchDateFilter')?.value||'all';
  const matches=trn.allMatches.filter(m=>
    (phase==='all'||m.phase===phase)&&(gr==='all'||m.group===gr)&&(dateF==='all'||m.date===dateF)&&
    (!q||[m.teamA,m.teamB,teamById(m.teamA)?.name,teamById(m.teamB)?.name,...(m.events||[]).flatMap(e=>[e.scorer,e.assist])].filter(Boolean).join(' ').toLowerCase().includes(q))
  );
  const totalGoals=matches.reduce((s,m)=>s+(m.goalsA||0)+(m.goalsB||0),0);
  const avgGoals=matches.length>0?(totalGoals/matches.length).toFixed(2):0;
  const draws=matches.filter(m=>m.draw).length;
  const pens=matches.filter(m=>m.wentToPenalties).length;
  box.innerHTML=`
    <div class="match-stats-bar">
      <span>${matches.length} ${currentLang==='es'?'partidos':currentLang==='fr'?'matchs':'matches'}</span><span>${totalGoals} ${currentLang==='es'?'goles':currentLang==='fr'?'buts':'goals'}</span>
      <span>${avgGoals} avg goals</span><span>${draws} draws</span>
      ${pens>0?`<span>${pens} penalties</span>`:''}
    </div>
    <div class="match-grid">
      ${matches.length?matches.map(m=>scoreCard(m)).join(''):`<div class="no-data-msg">${t('no_matches_filter')}</div>`}
    </div>`;
}

export function renderEmptyDashboard(){
  lastResults=null;
  const ec=document.querySelector('#summaryCards');
  if(ec) ec.innerHTML=`<article class="metric-card paper-card"><span class="metric-label">${currentLang==='es'?'Estado':currentLang==='fr'?'Statut':'Status'}</span><strong class="metric-value">${t('no_sim_yet')}</strong><small class="metric-sub">${currentLang==='es'?'Presiona Ejecutar para generar resultados.':currentLang==='fr'?'Appuyez sur Lancer pour générer les résultats.':'Press Run to generate results.'}</small></article>`;
  ['#teamTable','#scorerTable','#assistTable','#bettingTable'].forEach(sel=>{const el=document.querySelector(sel);if(el)el.innerHTML='';});
  const pod=document.querySelector('#mvpPodium'); if(pod) pod.innerHTML=`<div class="podium-empty"><p>${currentLang==='es'?'Ejecuta una simulación para ver los premios individuales.':currentLang==='fr'?'Lancez une simulation pour voir les récompenses.':'Run a simulation to see player awards.'}</p></div>`;
  const dis=document.querySelector('#disappointmentCard'); if(dis) dis.innerHTML='';
  const bs=document.querySelector('#bettingSummary'); if(bs) bs.innerHTML=`<div class="bet-empty"><div class="bet-empty-icon">📊</div><h4>${currentLang==='es'?'Aún no hay reporte de apuestas':currentLang==='fr'?'Aucun rapport de paris':'No betting report yet'}</h4><p>${t('no_sim_yet')}.</p></div>`;
  const ch=document.querySelector('#championChart'); if(ch) ch.innerHTML=`<div class="summary-note">${t('no_data_yet')}</div>`;
  const vc=document.querySelector('#valueChart'); if(vc) vc.innerHTML=`<div class="summary-note">${t('no_data_yet')}</div>`;
  renderBracket(null); renderMatchCenter(null);
}

export function renderDashboard(results, betting, players){
  lastResults=results;
  renderCards(results,betting,players); renderTeamTable(results); renderPlayerTables(players);
  renderBetting(betting,results); renderBracket(results); renderMatchCenter(results);
  renderHorizontalBars(document.querySelector('#championChart'),results.teams,{label:'name',value:'championProb'});
  renderValueChart(document.querySelector('#valueChart'),betting.slice(0,8));
  animateNewContent();
  schedulePortraitDraw();
}

export function animateNewContent(){
  if(document.documentElement.dataset.motion==='off'||!window.gsap) return;
  gsap.fromTo('.view.active .paper-card, .view.active .match-card, .view.active .group-card',
    {y:14,opacity:.2},{y:0,opacity:1,duration:.4,stagger:.02,ease:'power2.out'});
}

export function bindMatchFilters(){
  ['matchPhaseFilter','matchGroupFilter','matchDateFilter'].forEach(id=>{
    document.querySelector(`#${id}`)?.addEventListener('change',()=>lastResults&&renderMatchCenter(lastResults));
  });
  document.querySelector('#matchSearch')?.addEventListener('input',()=>lastResults&&renderMatchCenter(lastResults));
  const colBtn=document.querySelector('#collapseMatches');
  if(colBtn){
    colBtn.addEventListener('click',()=>{
      const grid=document.querySelector('#matchCenter .match-grid');
      const isCompact=grid?.classList.toggle('compact');
      colBtn.textContent=isCompact?(t('expanded')||'Expanded'):(t('compact')||'Compact');
    });
  }
  document.querySelector('#bankrollInput')?.addEventListener('input',()=>{
    if(lastResults&&window._latestBetting) renderBetting(window._latestBetting,lastResults);
  });
}
