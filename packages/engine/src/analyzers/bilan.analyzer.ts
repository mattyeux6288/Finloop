import type { CompteAggregate, Bilan, BilanSection, BilanItem, SigCompteDetail } from '@finthesis/shared';
import { BILAN_MAPPING, PCG_MAIN_ACCOUNTS, compteStartsWith } from '@finthesis/shared';

/**
 * Construit un Bilan équilibré à partir des agrégations de comptes.
 *
 * Règles PCG appliquées :
 * - Résultat de l'exercice (classes 6/7) → capitaux propres passif
 * - Comptes à double sens (41, 46, 45, 47, 51) : solde > 0 → actif, solde < 0 → passif
 * - Comptes 48 : 486x (CCA) → actif, 487x (PCA) → passif
 * - Comptes 49 : dépréciations → réduction des créances
 * - Comptes 51 négatifs : concours bancaires → dettes financières passif
 */
export function computeBilan(aggregates: CompteAggregate[]): Bilan {
  // ──────────────────────────────────────
  // ACTIF
  // ──────────────────────────────────────

  const immobilisations = buildSection(
    'Immobilisations',
    aggregates,
    BILAN_MAPPING.actif.immobilisations,
    BILAN_MAPPING.actif.amortissementsImmobilisations,
  );

  const stocks = buildSection(
    'Stocks et en-cours',
    aggregates,
    BILAN_MAPPING.actif.stocks,
    BILAN_MAPPING.actif.depreciationsStocks,
  );

  // Créances : 41+, 46+, 45+ (débiteurs), 47+ (transitoires débiteurs)
  const creancesRacines = ['41', '45', '46', '47'];
  const creancesAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, creancesRacines) && a.solde > 0,
  );
  // Dépréciations créances (49)
  const depreciationsCreances = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['49']),
  );
  const creancesItems = buildItemsFromAggregates(creancesAggregates);
  let creancesTotal = round(creancesAggregates.reduce((sum, a) => sum + a.solde, 0));

  // Charges constatées d'avance (486x) → actif
  const ccaAggregates = aggregates.filter(
    (a) => a.compteNum.startsWith('486') && a.solde > 0,
  );
  if (ccaAggregates.length > 0) {
    const ccaItems = buildItemsFromAggregates(ccaAggregates);
    creancesItems.push(...ccaItems);
    creancesTotal += round(ccaAggregates.reduce((sum, a) => sum + a.solde, 0));
  }

  // Soustraire les dépréciations (49)
  if (depreciationsCreances.length > 0) {
    const depTotal = round(depreciationsCreances.reduce((sum, a) => sum + Math.abs(a.solde), 0));
    if (depTotal > 0) {
      const depComptes: SigCompteDetail[] = depreciationsCreances
        .filter(a => Math.abs(a.solde) > 0)
        .map(a => ({ compteNum: a.compteNum, compteLib: a.compteLib, montant: round(-Math.abs(a.solde)) }))
        .sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant));
      creancesItems.push({
        compteRacine: '49',
        label: 'Dépréciations des créances',
        montant: -depTotal,
        comptes: depComptes,
      });
      creancesTotal -= depTotal;
    }
  }

  const creances: BilanSection = {
    label: 'Créances',
    items: creancesItems,
    total: round(creancesTotal),
  };

  // Trésorerie actif : 50+, 51+, 53+, 54+ (solde débiteur uniquement)
  const tresorerieActifAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['50', '51', '53', '54']) && a.solde > 0,
  );
  const tresorerieActif: BilanSection = {
    label: 'Disponibilités',
    items: buildItemsFromAggregates(tresorerieActifAggregates),
    total: round(tresorerieActifAggregates.reduce((sum, a) => sum + a.solde, 0)),
  };

  const totalActif = immobilisations.total + stocks.total + creances.total + tresorerieActif.total;

  // ──────────────────────────────────────
  // PASSIF
  // ──────────────────────────────────────

  // Capitaux propres (10-14) + provisions (15)
  const capitauxPropres = buildSection(
    'Capitaux propres',
    aggregates,
    BILAN_MAPPING.passif.capitauxPropres,
  );
  const provisions = buildSection('Provisions', aggregates, BILAN_MAPPING.passif.provisions);
  capitauxPropres.total += provisions.total;
  capitauxPropres.items.push(...provisions.items);

  // Résultat de l'exercice (classes 6 et 7 non soldées dans le compte 12)
  // Produits (classe 7) : solde créditeur = credit - debit → positif
  // Charges (classe 6) : solde débiteur = debit - credit → positif
  const produitsTotal = aggregates
    .filter(a => a.compteClasse === 7)
    .reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0);
  const chargesTotal = aggregates
    .filter(a => a.compteClasse === 6)
    .reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0);
  const resultatExercice = round(produitsTotal - chargesTotal);

  // Vérifier si le compte 12 existe déjà dans les capitaux propres
  const hasCompte12 = aggregates.some(a => a.compteNum.startsWith('12') && a.compteClasse === 1);

  if (!hasCompte12 && resultatExercice !== 0) {
    // Ajouter le résultat calculé aux capitaux propres
    capitauxPropres.items.push({
      compteRacine: '12',
      label: 'Résultat de l\'exercice (calculé)',
      montant: resultatExercice,
      comptes: [],
    });
    capitauxPropres.total = round(capitauxPropres.total + resultatExercice);
  }

  // Dettes financières (16, 17) + concours bancaires (51 créditeur)
  const dettesFinancieres = buildSection(
    'Dettes financières',
    aggregates,
    BILAN_MAPPING.passif.dettesFinancieres,
  );

  // Concours bancaires : comptes 51 avec solde créditeur (découvert)
  const concoursBancaires = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['51']) && a.solde < 0,
  );
  if (concoursBancaires.length > 0) {
    const cbItems = buildItemsFromAggregates(
      concoursBancaires.map(a => ({ ...a, solde: Math.abs(a.solde) })),
    );
    // Renommer pour clarté
    for (const item of cbItems) {
      item.label = 'Concours bancaires courants';
    }
    dettesFinancieres.items.push(...cbItems);
    const cbTotal = round(concoursBancaires.reduce((sum, a) => sum + Math.abs(a.solde), 0));
    dettesFinancieres.total = round(dettesFinancieres.total + cbTotal);
  }

  // Dettes fournisseurs : comptes 40x avec solde créditeur
  const dettesFournisseursAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['40']) && a.solde > 0,
  );
  const dettesFournisseurs: BilanSection = {
    label: 'Dettes fournisseurs',
    items: buildItemsFromAggregates(dettesFournisseursAggregates),
    total: round(dettesFournisseursAggregates.reduce((sum, a) => sum + a.solde, 0)),
  };

  // Dettes fiscales et sociales : comptes 42, 43, 44 créditeurs
  const dettesFiscalesAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['42', '43', '44']) && a.solde > 0,
  );
  const dettesFiscales: BilanSection = {
    label: 'Dettes fiscales et sociales',
    items: buildItemsFromAggregates(dettesFiscalesAggregates),
    total: round(dettesFiscalesAggregates.reduce((sum, a) => sum + a.solde, 0)),
  };

  // Autres dettes : 45-, 46-, 47- (créditeurs) + PCA (487x)
  const autresDettesRacines = ['45', '46', '47'];
  const autresDettesAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, autresDettesRacines) && a.solde < 0,
  );
  const autresDettesItems = buildItemsFromAggregates(
    autresDettesAggregates.map(a => ({ ...a, solde: Math.abs(a.solde) })),
  );
  let autresDettesTotal = round(autresDettesAggregates.reduce((sum, a) => sum + Math.abs(a.solde), 0));

  // Produits constatés d'avance (487x) → passif
  const pcaAggregates = aggregates.filter(
    (a) => a.compteNum.startsWith('487') && a.solde > 0,
  );
  if (pcaAggregates.length > 0) {
    const pcaItems = buildItemsFromAggregates(pcaAggregates);
    autresDettesItems.push(...pcaItems);
    autresDettesTotal += round(pcaAggregates.reduce((sum, a) => sum + a.solde, 0));
  }

  const autresDettes: BilanSection = {
    label: 'Autres dettes',
    items: autresDettesItems,
    total: round(autresDettesTotal),
  };

  const totalPassif =
    capitauxPropres.total +
    dettesFinancieres.total +
    dettesFournisseurs.total +
    dettesFiscales.total +
    autresDettes.total;

  return {
    actif: {
      immobilisations,
      stocks,
      creances,
      tresorerie: tresorerieActif,
      totalActif: round(totalActif),
    },
    passif: {
      capitauxPropres,
      dettesFinancieres,
      dettesFournisseurs,
      dettesFiscales,
      autresDettes,
      totalPassif: round(totalPassif),
    },
  };
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function buildSection(
  label: string,
  aggregates: CompteAggregate[],
  racines: readonly string[],
  amortRacines: readonly string[] = [],
): BilanSection {
  const items: BilanItem[] = [];
  let total = 0;

  for (const racine of racines) {
    const matching = aggregates.filter((a) => a.compteRacine.startsWith(racine));
    if (matching.length === 0) continue;

    const montantBrut = matching.reduce((sum, a) => sum + Math.abs(a.solde), 0);
    const libelle = PCG_MAIN_ACCOUNTS[racine] || `Compte ${racine}`;

    const comptes: SigCompteDetail[] = matching
      .map((a) => ({ compteNum: a.compteNum, compteLib: a.compteLib, montant: round(Math.abs(a.solde)) }))
      .filter((c) => c.montant !== 0)
      .sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant));

    items.push({
      compteRacine: racine,
      label: libelle,
      montant: montantBrut,
      comptes,
    });
    total += montantBrut;
  }

  // Soustraire les amortissements/dépréciations
  if (amortRacines.length > 0) {
    const amortComptes: SigCompteDetail[] = [];
    let totalAmort = 0;
    for (const racine of amortRacines) {
      const matching = aggregates.filter((a) => a.compteRacine.startsWith(racine));
      const montant = matching.reduce((sum, a) => sum + Math.abs(a.solde), 0);
      totalAmort += montant;
      for (const a of matching) {
        if (Math.abs(a.solde) > 0) {
          amortComptes.push({ compteNum: a.compteNum, compteLib: a.compteLib, montant: round(-Math.abs(a.solde)) });
        }
      }
    }
    if (totalAmort > 0) {
      items.push({
        compteRacine: amortRacines[0],
        label: 'Amortissements et dépréciations',
        montant: -totalAmort,
        comptes: amortComptes.sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant)),
      });
      total -= totalAmort;
    }
  }

  return { label, items, total: round(total) };
}

function buildItemsFromAggregates(aggregates: CompteAggregate[]): BilanItem[] {
  const byRacine = new Map<string, { label: string; montant: number; comptes: SigCompteDetail[] }>();

  for (const agg of aggregates) {
    const racine = agg.compteRacine;
    const existing = byRacine.get(racine);
    const compteMontant = round(Math.abs(agg.solde));
    if (existing) {
      existing.montant += Math.abs(agg.solde);
      if (compteMontant !== 0) {
        existing.comptes.push({ compteNum: agg.compteNum, compteLib: agg.compteLib, montant: compteMontant });
      }
    } else {
      byRacine.set(racine, {
        label: PCG_MAIN_ACCOUNTS[agg.compteRacine.substring(0, 2)] || agg.compteLib,
        montant: Math.abs(agg.solde),
        comptes: compteMontant !== 0 ? [{ compteNum: agg.compteNum, compteLib: agg.compteLib, montant: compteMontant }] : [],
      });
    }
  }

  return Array.from(byRacine.entries()).map(([racine, data]) => ({
    compteRacine: racine,
    label: data.label,
    montant: round(data.montant),
    comptes: data.comptes.sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant)),
  }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
