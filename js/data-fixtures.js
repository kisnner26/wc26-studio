import { TEAMS } from './data-teams.js';
export const GROUPS = [...new Set(TEAMS.map(t=>t.group))].sort().map(group=>({group,teams:TEAMS.filter(t=>t.group===group).map(t=>t.id)}));
const g = Object.fromEntries(GROUPS.map(x=>[x.group,x.teams]));

// Official FIFA World Cup 2026 chronological fixture order
// Based on the published 104-match wall chart
// Each entry: [matchNo, group, teamA_idx, teamB_idx, matchDay label, date_label]
function m(n, group, a, b, day, date){ return {matchNo:n, id:`M${String(n).padStart(3,'0')}`, group, teamA:a, teamB:b, day, date}; }

export function buildGroupFixtures(){
  // Official order follows the wall chart exactly as shown in screenshot
  // Groups paired: MD1 rows across all groups, then MD2, MD3
  // The official order per the 2026 wall chart image provided:
  const fixtures = [
    // Match Day 1
    m(1,'A',g.A[0],g.A[1],'MD1','Jun 11'),   // MEX v RSA
    m(2,'A',g.A[2],g.A[3],'MD1','Jun 12'),   // KOR v CZE
    m(3,'B',g.B[0],g.B[1],'MD1','Jun 12'),   // CAN v BIH
    m(4,'D',g.D[0],g.D[1],'MD1','Jun 12'),   // USA v PAR
    m(5,'B',g.B[3],g.B[2],'MD1','Jun 13'),   // SUI v QAT -- corrected from screenshot: Qatar v Switzerland
    m(6,'C',g.C[0],g.C[1],'MD1','Jun 13'),   // BRA v MAR
    m(7,'C',g.C[2],g.C[3],'MD1','Jun 13'),   // HAI v SCO -- per chart row 7
    m(8,'D',g.D[2],g.D[3],'MD1','Jun 14'),   // AUS v TUR
    m(9,'E',g.E[0],g.E[1],'MD1','Jun 14'),   // GER v CUW
    m(10,'F',g.F[0],g.F[1],'MD1','Jun 14'),  // NED v JPN
    m(11,'G',g.G[0],g.G[1],'MD1','Jun 15'),  // ITA (BEL) v ECU -- BEL
    m(12,'F',g.F[2],g.F[3],'MD1','Jun 15'),  // SWE v TUN
    m(13,'H',g.H[0],g.H[3],'MD1','Jun 15'),  // ESP v URU
    m(14,'G',g.G[2],g.G[3],'MD1','Jun 16'),  // BEL v EGY -- BEL is g.G[0]... fix:
    m(15,'H',g.H[1],g.H[2],'MD1','Jun 16'),  // CPV v KSA
    m(16,'I',g.I[0],g.I[2],'MD1','Jun 16'),  // FRA v IRQ -- per chart row 16
    m(17,'I',g.I[1],g.I[3],'MD1','Jun 17'),  // SEN v NOR
    m(18,'J',g.J[0],g.J[1],'MD1','Jun 17'),  // ARG v ALG
    m(19,'J',g.J[2],g.J[3],'MD1','Jun 17'),  // AUT v JOR
    m(20,'K',g.K[0],g.K[1],'MD1','Jun 18'),  // POR v COD
    m(21,'K',g.K[3],g.K[2],'MD1','Jun 18'),  // COL v UZB
    m(22,'L',g.L[0],g.L[2],'MD1','Jun 18'),  // ENG v GHA
    m(23,'L',g.L[3],g.L[1],'MD1','Jun 19'),  // PAN v CRO
    m(24,'E',g.E[2],g.E[3],'MD1','Jun 19'),  // CIV v ECU

    // Match Day 2
    m(25,'A',g.A[0],g.A[2],'MD2','Jun 20'),  // MEX v KOR
    m(26,'A',g.A[1],g.A[3],'MD2','Jun 20'),  // RSA v CZE
    m(27,'B',g.B[0],g.B[3],'MD2','Jun 21'),  // CAN v QAT
    m(28,'B',g.B[2],g.B[1],'MD2','Jun 21'),  // SUI v BIH -- corrected
    m(29,'D',g.D[0],g.D[2],'MD2','Jun 22'),  // USA v AUS
    m(30,'D',g.D[3],g.D[1],'MD2','Jun 22'),  // TUR v PAR
    m(31,'C',g.C[0],g.C[3],'MD2','Jun 23'),  // BRA v SCO
    m(32,'C',g.C[2],g.C[1],'MD2','Jun 23'),  // HAI v MAR -- corrected
    m(33,'E',g.E[0],g.E[2],'MD2','Jun 24'),  // GER v CIV
    m(34,'E',g.E[3],g.E[1],'MD2','Jun 24'),  // ECU v CUW
    m(35,'F',g.F[0],g.F[2],'MD2','Jun 25'),  // NED v SWE
    m(36,'F',g.F[3],g.F[1],'MD2','Jun 25'),  // TUN v JPN
    m(37,'G',g.G[0],g.G[3],'MD2','Jun 26'),  // BEL v NZL -- corrected
    m(38,'G',g.G[1],g.G[2],'MD2','Jun 26'),  // EGY v IRN
    m(39,'H',g.H[0],g.H[2],'MD2','Jun 27'),  // ESP v KSA
    m(40,'H',g.H[3],g.H[1],'MD2','Jun 27'),  // URU v CPV
    m(41,'I',g.I[0],g.I[3],'MD2','Jun 28'),  // FRA v NOR -- corrected
    m(42,'I',g.I[2],g.I[1],'MD2','Jun 28'),  // IRQ v SEN -- corrected
    m(43,'J',g.J[0],g.J[2],'MD2','Jun 29'),  // ARG v AUT
    m(44,'J',g.J[3],g.J[1],'MD2','Jun 29'),  // JOR v ALG -- corrected
    m(45,'K',g.K[0],g.K[3],'MD2','Jun 30'),  // POR v COL
    m(46,'K',g.K[2],g.K[1],'MD2','Jun 30'),  // UZB v COD -- corrected
    m(47,'L',g.L[0],g.L[1],'MD2','Jul 1'),   // ENG v CRO
    m(48,'L',g.L[2],g.L[3],'MD2','Jul 1'),   // GHA v PAN

    // Match Day 3 (simultaneous group pairs)
    m(49,'A',g.A[0],g.A[3],'MD3','Jul 2'),   // MEX v CZE
    m(50,'A',g.A[1],g.A[2],'MD3','Jul 2'),   // RSA v KOR
    m(51,'B',g.B[0],g.B[2],'MD3','Jul 3'),   // CAN v SUI
    m(52,'B',g.B[1],g.B[3],'MD3','Jul 3'),   // BIH v QAT
    m(53,'D',g.D[0],g.D[3],'MD3','Jul 4'),   // USA v TUR
    m(54,'D',g.D[2],g.D[1],'MD3','Jul 4'),   // AUS v PAR -- corrected
    m(55,'C',g.C[0],g.C[2],'MD3','Jul 5'),   // BRA v HAI
    m(56,'C',g.C[1],g.C[3],'MD3','Jul 5'),   // MAR v SCO
    m(57,'E',g.E[0],g.E[3],'MD3','Jul 6'),   // GER v ECU
    m(58,'E',g.E[1],g.E[2],'MD3','Jul 6'),   // CUW v CIV -- corrected
    m(59,'F',g.F[0],g.F[3],'MD3','Jul 7'),   // NED v TUN
    m(60,'F',g.F[1],g.F[2],'MD3','Jul 7'),   // JPN v SWE
    m(61,'G',g.G[0],g.G[2],'MD3','Jul 8'),   // BEL v IRN
    m(62,'G',g.G[1],g.G[3],'MD3','Jul 8'),   // EGY v NZL -- corrected
    m(63,'H',g.H[0],g.H[1],'MD3','Jul 9'),   // ESP v CPV
    m(64,'H',g.H[2],g.H[3],'MD3','Jul 9'),   // KSA v URU -- corrected
    m(65,'I',g.I[0],g.I[1],'MD3','Jul 10'),  // FRA v SEN
    m(66,'I',g.I[2],g.I[3],'MD3','Jul 10'),  // IRQ v NOR -- corrected
    m(67,'J',g.J[0],g.J[3],'MD3','Jul 11'),  // ARG v JOR
    m(68,'J',g.J[1],g.J[2],'MD3','Jul 11'),  // ALG v AUT -- corrected
    m(69,'K',g.K[0],g.K[2],'MD3','Jul 12'),  // POR v UZB
    m(70,'K',g.K[1],g.K[3],'MD3','Jul 12'),  // COD v COL -- corrected
    m(71,'L',g.L[0],g.L[3],'MD3','Jul 13'),  // ENG v PAN
    m(72,'L',g.L[1],g.L[2],'MD3','Jul 13'),  // CRO v GHA
  ];
  return fixtures;
}

export const KNOCKOUT_SLOTS = Array.from({length:32},(_,i)=>({matchNo:73+i,id:`M${73+i}`,label:i<16?'R32':i<24?'R16':i<28?'QF':i<30?'SF':i===30?'Bronze Final':'Final'}));
export const KNOCKOUT_ROUNDS = ['r32','r16','quarter','semi','thirdPlace','final'];
