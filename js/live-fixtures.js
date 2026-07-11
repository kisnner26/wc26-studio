// Live fixtures from openfootball free open-source API (no API key needed)
// https://github.com/openfootball/worldcup.json
const API_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

// Team name normalization map (API → our team IDs)
const NAME_MAP = {
  'Mexico':'MEX','South Africa':'RSA','South Korea':'KOR','Czech Republic':'CZE',
  'Canada':'CAN','Bosnia':'BIH','Bosnia and Herzegovina':'BIH','Qatar':'QAT',
  'Switzerland':'SUI','Brazil':'BRA','Morocco':'MAR','Haiti':'HAI','Scotland':'SCO',
  'United States':'USA','United States of America':'USA','USA':'USA','Paraguay':'PAR',
  'Australia':'AUS','Turkey':'TUR','Germany':'GER','Curacao':'CUW','Ivory Coast':'CIV',
  "Côte d'Ivoire":'CIV','Ecuador':'ECU','Netherlands':'NED','Japan':'JPN',
  'Sweden':'SWE','Tunisia':'TUN','Belgium':'BEL','Egypt':'EGY','Iran':'IRN',
  'New Zealand':'NZL','Spain':'ESP','Cape Verde':'CPV','Saudi Arabia':'KSA',
  'Uruguay':'URU','France':'FRA','Senegal':'SEN','Iraq':'IRQ','Norway':'NOR',
  'Argentina':'ARG','Algeria':'ALG','Austria':'AUT','Jordan':'JOR',
  'Portugal':'POR','DR Congo':'COD','Uzbekistan':'UZB','Colombia':'COL',
  'England':'ENG','Croatia':'CRO','Ghana':'GHA','Panama':'PAN'
};

const STADIUM_MAP = {
  'Mexico City':'Estadio Azteca, Mexico City',
  'Guadalajara (Zapopan)':'Akron Stadium, Guadalajara',
  'Monterrey':'Estadio BBVA, Monterrey',
  'Atlanta':'Mercedes-Benz Stadium, Atlanta',
  'Dallas':'AT&T Stadium, Dallas',
  'Los Angeles (Santa Clara)':'Levi\'s Stadium, LA',
  'Los Angeles':'SoFi Stadium, Los Angeles',
  'San Francisco Bay Area (Santa Clara)':'Levi\'s Stadium',
  'New York (East Rutherford)':'MetLife Stadium, New York',
  'New York/New Jersey (East Rutherford)':'MetLife Stadium, New York',
  'Boston (Foxborough)':'Gillette Stadium, Boston',
  'Seattle (Renton)':'Lumen Field, Seattle',
  'Vancouver':'BC Place, Vancouver',
  'Toronto':'BMO Field, Toronto',
  'Kansas City':'Arrowhead Stadium, Kansas City',
  'Houston':'NRG Stadium, Houston',
  'Philadelphia':'Lincoln Financial Field, Philadelphia',
  'Miami (Fort Lauderdale)':'Hard Rock Stadium, Miami',
  'Chicago (Arlington Heights)':'Soldier Field, Chicago',
  'Miami':'Hard Rock Stadium, Miami',
};

let cachedData = null;
let fetchPromise = null;

export async function fetchLiveFixtures(){
  if(cachedData) return cachedData;
  if(fetchPromise) return fetchPromise;
  fetchPromise = fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      cachedData = processMatches(data.matches || []);
      return cachedData;
    })
    .catch(() => {
      cachedData = null;
      fetchPromise = null;
      return null;
    });
  return fetchPromise;
}

function processMatches(raw){
  return raw.map((m, idx) => {
    const teamA = NAME_MAP[m.team1] || m.team1;
    const teamB = NAME_MAP[m.team2] || m.team2;
    const date = m.date ? new Date(m.date) : null;
    const hasScore = m.score?.ft != null;
    const scoreA = hasScore ? m.score.ft[0] : null;
    const scoreB = hasScore ? m.score.ft[1] : null;
    const now = new Date();
    let status = 'upcoming';
    if(hasScore) status = 'finished';
    else if(date && date <= now && date > new Date(now - 120*60000)) status = 'live';

    // Parse time string e.g. "13:00 UTC-6"
    let utcTime = null;
    if(m.time && date){
      const timeMatch = m.time.match(/(\d+):(\d+)\s*UTC([+-]\d+)/);
      if(timeMatch){
        const offsetH = parseInt(timeMatch[3]);
        const localH = parseInt(timeMatch[1]);
        const utcH = localH - offsetH;
        const d2 = new Date(date);
        d2.setUTCHours(utcH, parseInt(timeMatch[2]), 0, 0);
        utcTime = d2;
      }
    }

    return {
      id: `live_${idx}`,
      teamA, teamB,
      scoreA, scoreB,
      date: m.date,
      utcTime,
      status,
      round: m.round,
      group: m.group,
      stadium: STADIUM_MAP[m.ground] || m.ground,
      goals1: m.goals1 || [],
      goals2: m.goals2 || [],
      halfScore: m.score?.ht || null,
    };
  });
}

export function getUpcoming(matches, n=10){
  const now = new Date();
  return matches
    .filter(m => m.status === 'upcoming')
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, n);
}

export function getRecent(matches, n=8){
  return matches
    .filter(m => m.status === 'finished')
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, n);
}

export function getLive(matches){
  return matches.filter(m => m.status === 'live');
}

export function getByTeam(matches, teamId){
  return matches.filter(m => m.teamA === teamId || m.teamB === teamId);
}
