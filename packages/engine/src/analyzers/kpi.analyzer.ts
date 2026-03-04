import type { CompteAggregate, DashboardKpis } from '@finthesis/shared';
import { compteStartsWith } from '@finthesis/shared';
import { computeSig } from './sig.analyzer';

/**
 * Calcule les KPIs du dashboard à partir des agrégations de comptes
 */
export function computeKpis(aggregates: CompteAggregate[]): DashboardKpis {
  // Chiffre d'affaires = somme des crédits sur comptes 70x
  const caAggs = aggregates.filter((a) => compteStartsWith(a.compteNum, ['70']));
  const chiffreAffaires = round(
    caAggs.reduce((sum, a) => sum + a.totalCredit - a.totalDebit, 0),
  );

  // Achats consommés = comptes 60x
  const achatsAggs = aggregates.filter((a) => compteStartsWith(a.compteNum, ['60']));
  const achats = round(
    achatsAggs.reduce((sum, a) => sum + a.totalDebit - a.totalCredit, 0),
  );

  // Marge brute = CA - achats
  const margeBrute = round(chiffreAffaires - achats);
  const tauxMargeBrute = chiffreAffaires !== 0 ? round((margeBrute / chiffreAffaires) * 100) : 0;

  // EBE et Résultat net via le SIG
  const sig = computeSig(aggregates);
  const ebe = sig.ebe.montant;
  const resultatNet = sig.resultatNet.montant;

  // Trésorerie nette = banques (51x) + caisse (53x) - concours bancaires (519)
  const tresoActif = aggregates
    .filter((a) => compteStartsWith(a.compteNum, ['51', '53']))
    .reduce((sum, a) => sum + a.totalDebit - a.totalCredit, 0);
  const tresoPassif = aggregates
    .filter((a) => compteStartsWith(a.compteNum, ['519']))
    .reduce((sum, a) => sum + a.totalCredit - a.totalDebit, 0);
  const tresorerieNette = round(tresoActif - tresoPassif);

  // Ratio de rentabilité nette
  const ratioRentabilite = chiffreAffaires !== 0 ? round((resultatNet / chiffreAffaires) * 100) : 0;

  // BFR = (stocks + créances clients) - (dettes fournisseurs + dettes fiscales/sociales)
  const stocks = aggregates
    .filter((a) => a.compteClasse === 3 && !compteStartsWith(a.compteNum, ['39']))
    .reduce((sum, a) => sum + a.totalDebit - a.totalCredit, 0);

  const creancesClients = aggregates
    .filter((a) => compteStartsWith(a.compteNum, ['411']))
    .reduce((sum, a) => sum + a.totalDebit - a.totalCredit, 0);

  const dettesFournisseurs = aggregates
    .filter((a) => compteStartsWith(a.compteNum, ['401']))
    .reduce((sum, a) => sum + a.totalCredit - a.totalDebit, 0);

  const dettesFiscalesSociales = aggregates
    .filter((a) => compteStartsWith(a.compteNum, ['43', '44']))
    .reduce((sum, a) => sum + a.totalCredit - a.totalDebit, 0);

  const bfr = round(stocks + creancesClients - dettesFournisseurs - dettesFiscalesSociales);

  // Délais de paiement
  const caTTC = chiffreAffaires * 1.2; // Approximation TTC avec TVA 20%
  const achatsTTC = achats * 1.2;

  const delaiClientMoyen =
    caTTC !== 0 ? round((Math.max(0, creancesClients) / caTTC) * 360) : 0;
  const delaiFournisseurMoyen =
    achatsTTC !== 0 ? round((Math.max(0, dettesFournisseurs) / achatsTTC) * 360) : 0;

  return {
    chiffreAffaires,
    margeBrute,
    tauxMargeBrute,
    ebe,
    resultatNet,
    tresorerieNette,
    ratioRentabilite,
    bfr,
    delaiClientMoyen,
    delaiFournisseurMoyen,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
