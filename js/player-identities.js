// Stable identity manifest. The providerRef values were observed in the public
// match payload supplied by the user and are retained only for disambiguation;
// this app does not hotlink or call the third-party headshot endpoint.
export const PLAYER_IDENTITIES = {
  nor_nyland_orjan:{canonicalName:'Ørjan Nyland',providerRef:'sm-32471'},
  nor_moller_wolfe_david:{canonicalName:'David Møller Wolfe',providerRef:'sm-33166012'},
  nor_heggem_torbjorn:{canonicalName:'Torbjørn Heggem',providerRef:'sm-538449'},
  nor_ajer_kristoffer:{canonicalName:'Kristoffer Ajer',providerRef:'sm-151418'},
  nor_berg_patrick:{canonicalName:'Patrick Berg',providerRef:'sm-151243'},
  nor_sorloth_alexander:{canonicalName:'Alexander Sørloth',providerRef:'sm-25514'},
  nor_berge_sander:{canonicalName:'Sander Berge',providerRef:'sm-64193'},
  nor_haaland_erling:{canonicalName:'Erling Haaland',providerRef:'sm-154421'},
  nor_odegaard_martin:{canonicalName:'Martin Ødegaard',providerRef:'sm-26823'},
  nor_nusa_antonio:{canonicalName:'Antonio Nusa',providerRef:'sm-37570379'},
  nor_ryerson_julian:{canonicalName:'Julian Ryerson',providerRef:'sm-151628'},
  eng_pickford_jordan:{canonicalName:'Jordan Pickford',providerRef:'sm-1826'},
  eng_konsa_ezri:{canonicalName:'Ezri Konsa',providerRef:'sm-7124'},
  eng_oreilly_nico:{canonicalName:"Nico O'Reilly",providerRef:'sm-37562487'},
  eng_rice_declan:{canonicalName:'Declan Rice',providerRef:'sm-5273'},
  eng_saka_bukayo:{canonicalName:'Bukayo Saka',providerRef:'sm-16827155'},
  eng_anderson_elliot:{canonicalName:'Elliot Anderson',providerRef:'sm-332047'},
  eng_kane_harry:{canonicalName:'Harry Kane',providerRef:'sm-997'},
  eng_bellingham_jude:{canonicalName:'Jude Bellingham',providerRef:'sm-37255840'},
  eng_burn_dan:{canonicalName:'Dan Burn',providerRef:'sm-2815'},
  eng_gordon_anthony:{canonicalName:'Anthony Gordon',providerRef:'sm-9611543'},
  eng_spence_djed:{canonicalName:'Djed Spence',providerRef:'sm-7026573'}
};

export function stableIdentity(id){ return PLAYER_IDENTITIES[id] || null; }
