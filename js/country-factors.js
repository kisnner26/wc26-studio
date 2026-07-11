// Structural priors used by model v3. They are deliberately low-weight signals:
// population creates a larger talent pool, but does not replace sporting evidence.
// Population: World Bank SP.POP.TOTL, 2024 snapshot (updated 2026-07-01).
// England/Scotland use rounded constituent-country estimates because the World Bank
// publishes the United Kingdom as a single series.
const rows = [
  // id, population, confederation, WC titles, finals, semifinals, appearances
  ['MEX',130861007,'CONCACAF',0,0,0,17],['RSA',64007187,'CAF',0,0,0,3],
  ['KOR',51751065,'AFC',0,0,1,11],['CZE',10905028,'UEFA',0,2,2,9],
  ['CAN',41262329,'CONCACAF',0,0,0,2],['BIH',3164253,'UEFA',0,0,0,1],
  ['QAT',2857822,'AFC',0,0,0,1],['SUI',9005582,'UEFA',0,0,0,12],
  ['BRA',211998573,'CONMEBOL',5,7,11,22],['MAR',38081173,'CAF',0,0,1,6],
  ['HAI',11772557,'CONCACAF',0,0,0,1],['SCO',5490100,'UEFA',0,0,0,8],
  ['USA',340003797,'CONCACAF',0,0,1,11],['PAR',6929153,'CONMEBOL',0,0,0,8],
  ['AUS',27194286,'AFC',0,0,0,6],['TUR',85518661,'UEFA',0,0,1,2],
  ['GER',83516593,'UEFA',4,8,13,20],['CUW',155967,'CONCACAF',0,0,0,0],
  ['CIV',31934230,'CAF',0,0,0,3],['ECU',18135478,'CONMEBOL',0,0,0,4],
  ['NED',17993485,'UEFA',0,3,5,11],['JPN',123975371,'AFC',0,0,0,7],
  ['SWE',10569709,'UEFA',0,1,4,12],['TUN',12277109,'CAF',0,0,0,6],
  ['BEL',11858610,'UEFA',0,0,2,14],['EGY',116538258,'CAF',0,0,0,3],
  ['IRN',91567738,'AFC',0,0,0,6],['NZL',5290000,'OFC',0,0,0,2],
  ['ESP',48848840,'UEFA',1,1,2,16],['CPV',524877,'CAF',0,0,0,0],
  ['KSA',35300280,'AFC',0,0,0,6],['URU',3386588,'CONMEBOL',2,2,5,14],
  ['FRA',68551653,'UEFA',2,4,7,16],['SEN',18501984,'CAF',0,0,0,3],
  ['IRQ',46042015,'AFC',0,0,0,1],['NOR',5572279,'UEFA',0,0,0,3],
  ['ARG',45696159,'CONMEBOL',3,6,6,18],['ALG',46814308,'CAF',0,0,0,4],
  ['AUT',9177982,'UEFA',0,0,2,7],['JOR',11552876,'AFC',0,0,0,0],
  ['POR',10694681,'UEFA',0,0,2,8],['COD',109276265,'CAF',0,0,0,1],
  ['UZB',36361859,'AFC',0,0,0,0],['COL',52886363,'CONMEBOL',0,0,0,6],
  ['ENG',57690000,'UEFA',1,1,3,16],['CRO',3866200,'UEFA',0,1,3,6],
  ['GHA',34427414,'CAF',0,0,0,4],['PAN',4515577,'CONCACAF',0,0,0,1]
  ,['ITA',58990000,'UEFA',4,6,8,18],['CHI',19764771,'CONMEBOL',0,0,1,9]
];

const CONFEDERATION_PRIOR = {
  CONMEBOL: .72,
  UEFA: .70,
  CAF: .52,
  AFC: .48,
  CONCACAF: .47,
  OFC: .31
};

export const COUNTRY_FACTORS = Object.fromEntries(rows.map(r=>[r[0],{
  population:r[1], confederation:r[2], titles:r[3], finals:r[4],
  semifinals:r[5], appearances:r[6]
}]));

export function countryFactors(id){
  return COUNTRY_FACTORS[id] || {population:5000000,confederation:'AFC',titles:0,finals:0,semifinals:0,appearances:0};
}

export function populationPrior(id){
  const population=countryFactors(id).population;
  // Log scale prevents very large countries from dominating. The useful range
  // is compressed to 0..1 and receives only a small coefficient downstream.
  return Math.max(0,Math.min(1,(Math.log10(Math.max(100000,population))-5)/3.55));
}

export function heritagePrior(id){
  const h=countryFactors(id);
  const legacy=h.titles*1.35+h.finals*.48+h.semifinals*.24+Math.log1p(h.appearances)*.22;
  return Math.max(0,Math.min(1,legacy/9.2));
}

export function confederationPrior(id){
  return CONFEDERATION_PRIOR[countryFactors(id).confederation] ?? .45;
}

export const COUNTRY_FACTOR_META = {
  populationSource:'World Bank SP.POP.TOTL',
  populationYear:2024,
  modelRole:'weak structural prior'
};
