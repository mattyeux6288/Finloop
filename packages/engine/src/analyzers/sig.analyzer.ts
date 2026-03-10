import type { CompteAggregate, Sig, SigLevel } from '@finthesis/shared';
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
    const details: { label: string; montant: number; compteRacines?: string }[] = [];
    let montant = 0;

    // Ajouter les dépendances (niveaux précédents)
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
      const itemMontant = computeFormulaItem(aggregates, item.compteRacines);
      const signedMontant = itemMontant * item.sign;

      // Extraire les 2 premiers chiffres de chaque racine, dédupliquer
      const racines2 = [...new Set(item.compteRacines.map(r => r.substring(0, 2)))].join('/');

      details.push({
        label: item.label,
        montant: round(signedMontant),
        compteRacines: racines2,
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
 * Calcule le montant d'un item de formule SIG
 * Pour les comptes 7x : retourne le solde créditeur (positif = produit)
 * Pour les comptes 6x : retourne le solde débiteur (positif = charge)
 */
function computeFormulaItem(aggregates: CompteAggregate[], compteRacines: string[]): number {
  let total = 0;

  for (const agg of aggregates) {
    if (!compteStartsWith(agg.compteNum, compteRacines)) continue;

    if (agg.compteClasse === 7) {
      // Produits : crédit - débit
      total += agg.totalCredit - agg.totalDebit;
    } else if (agg.compteClasse === 6) {
      // Charges : débit - crédit
      total += agg.totalDebit - agg.totalCredit;
    } else {
      // Variation de stocks (classe 3) et autres
      total += agg.totalDebit - agg.totalCredit;
    }
  }

  return total;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
