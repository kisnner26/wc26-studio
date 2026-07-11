export const CONFIG = {
  modelVersion: '3.2 Dixon–Coles',
  defaultSimulations: 100000,
  chunkSize: 9000,
  baseGoalRate: 1.23,     // calibrated near modern international tournament scoring
  strengthSwing: 1.28,   // sensibilidad exponencial a diff atk-def (viejo usaba 1.30)
  eloDivisor: 420,       // suaviza el efecto ELO sobre goles (del modelo v1)
  homeBoostFactor: 0.18, // maximum host-country lift at homeAdvantage=10
  randomNoise: 0.10,
  dixonColesRho: -0.105,
  maxScoreGrid: 7,
  upsetFactor: 0.062,
  drawDampener: 0.88,
  penalty: { base: 0.5, keeperWeight: 0.18, experienceWeight: 0.15, eloWeight: 0.10, pressureWeight: 0.08 },
  // Core weights keep ELO and current performance dominant. Structural priors
  // (history, confederation and population) are intentionally small to avoid
  // encoding country size or past trophies as destiny.
  weights: {
    fifa: 0.065, elo: 0.225, squad: 0.075, attack: 0.09, midfield: 0.045,
    defense: 0.105, goalkeeper: 0.045, coach: 0.035, form: 0.085, experience: 0.05,
    depth: 0.04, starPower: 0.035, recentAttack: 0.035, recentDefense: 0.035,
    history: 0.028, confederation: 0.018, population: 0.012,
    agePenalty: 0.022, injuries: 0.05, home: 0.025
  },
  phaseAdjustments: { group: 1.0, r32: 0.97, r16: 0.94, quarter: 0.92, semi: 0.90, final: 0.88 },
  exportFilePrefix: 'worldcup-2026-simulation'
};
