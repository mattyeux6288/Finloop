import type { CompteAggregate, Sig, SigLevel, SigCompteDetail } from '@finthesis/shared';
import {
  SIG_FORMULAS,
  SIG_COMPUTATION_ORDER,
  SIG_DEPENDENCIES,
  compteStartsWith,
} from '@finthesis/shared';

/**
 * Calcule les Soldes Intermédiaires de Gestion (SIG)
 *
 * Logique :
 * - Pour les comptes 7x (produits), le montant = totalCredit - totalDebit
 * - Pour les comptes 6x (charges), le montant = totalDebit - totalCredit
 * - Le sign dans la formule indique si on ajoute (+1) ou soustrait (-1)
 */
export function computeSig(aggregates: CompteAggregate[]): Sig {
  const results: Record<string, SigLevel> = {};

  for (const levelKey of SIG_COMPUTATION_ORDER) {
    const formula = SIG_FORMULAS[levelKey];
    const details: SigLevel['details'] = [];
    let montant = 0;

    // Ajouter les dépendances (niveaux précédents) — pas de comptes individuels ici
    const dependencies = SIG_DEPENDENCIES[levelKey] || [];
    for (const dep of dependencies) {
      if (results[dep]) {
        montant += results[dep].montant;
        details.push({
          label: results[dep].label,
          montant: results[dep].montant,
        });
      }
    }

    // Calculer les items de la formule
    for (const item of formula.items) {
      const { total: itemMontant, comptes } = computeFormulaItemWithComptes(aggregates, item.compteRacines);
      const signedMontant = itemMontant * item.sign;

      // Extraire les 2 premiers chiffres de chaque racine, dédupliquer
      const racines2 = [...new Set(item.compteRacines.map(r => r.substring(0, 2)))].join('/');

      details.push({
        label: item.label,
        montant: round(signedMontant),
        compteRacines: racines2,
        comptes: comptes
          .map(c => ({ ...c, montant: round(c.montant * item.sign) }))
          .filter(c => c.montant !== 0)
          .sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant)),
      });

      montant += signedMontant;
    }

    results[levelKey] = {
      label: formula.label,
      montant: round(montant),
      details,
    };
  }

  return {
    margeCommerciale: results['margeCommerciale'],
    productionExercice: results['productionExercice'],
    valeurAjoutee: results['valeurAjoutee'],
    ebe: results['ebe'],
    resultatExploitation: results['resultatExploitation'],
    rcai: results['rcai'],
    resultatExceptionnel: results['resultatExceptionnel'],
    resultatNet: results['resultatNet'],
    plusMoinsValuesCessions: results['plusMoinsValuesCessions'],
  };
}

/**
 * Calcule le montant d'un item de formule SIG et retourne les comptes individuels.
 * Pour les comptes 7x : solde créditeur (positif = produit)
 * Pour les comptes 6x : solde débiteur (positif = charge)
 */
function computeFormulaItemWithComptes(
  aggregates: CompteAggregate[],
  compteRacines: string[],
): { total: number; comptes: SigCompteDetail[] } {
  let total = 0;
  const comptes: SigCompteDetail[] = [];

  for (const agg of aggregates) {
    if (!compteStartsWith(agg.compteNum, compteRacines)) continue;

    let montant: number;
    if (agg.compteClasse === 7) {
      montant = agg.totalCredit - agg.totalDebit;
    } else if (agg.compteClasse === 6) {
      montant = agg.totalDebit - agg.totalCredit;
    } else {
      montant = agg.totalDebit - agg.totalCredit;
    }

    total += montant;
    if (montant !== 0) {
      comptes.push({
        compteNum: agg.compteNum,
        compteLib: agg.compteLib,
        montant: round(montant),
      });
    }
  }

  return { total, comptes };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
